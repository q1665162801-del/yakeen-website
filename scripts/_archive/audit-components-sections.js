const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const componentsCss = path.join(__dirname, '..', 'css', 'sections', 'components.css');

// Collect all HTML class names
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const r = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...walk(full));
    else if (e.name.endsWith('.html')) r.push(full);
  }
  return r;
}
const htmlFiles = walk(distDir);
const allHtml = htmlFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
const classSet = new Set();
const classMatches = allHtml.match(/class="([^"]+)"/g) || [];
for (const m of classMatches) {
  const classes = m.replace(/class="([^"]+)"/, '$1').split(/\s+/);
  for (const c of classes) if (c) classSet.add(c);
}

// Parse components.css — section headings are multi-line:
//   /* =====
//      1. Section Name
//      ===== */
const content = fs.readFileSync(componentsCss, 'utf-8').replace(/^\uFEFF/, '');
const lines = content.split('\n');
const sections = [];
let currentSection = null;
let startLine = 0;

for (let i = 0; i < lines.length; i++) {
  // Detect start of section heading: line with /* === and next line has section title
  if (lines[i].match(/^\s*\/\*\s*=+\s*$/) && i + 1 < lines.length) {
    const titleLine = lines[i + 1].trim();
    // Title line should NOT end with */
    if (!titleLine.endsWith('*/') && titleLine.length > 0 && titleLine.length < 80) {
      // Skip lines that are purely decorative (all = or just a number)
      if (!titleLine.match(/^[=.\s]+$/)) {
        if (currentSection) {
          sections.push({
            name: currentSection,
            startLine,
            endLine: i - 1,
            code: lines.slice(startLine, i).join('\n'),
          });
        }
        currentSection = titleLine.replace(/^\s*\d+[\d.]*\s*/, '').trim();
        startLine = i;
      }
    }
  }
}
if (currentSection) {
  sections.push({
    name: currentSection,
    startLine,
    endLine: lines.length - 1,
    code: lines.slice(startLine).join('\n'),
  });
}

// Analyze each section
console.log('sections/components.css — per-section usage (' + sections.length + ' sections)\n');
console.log(''.padEnd(42) + ' Size    Used  Total  Used%');
console.log('-'.repeat(75));

let totalSize = 0, totalClasses = 0, totalUsed = 0;
const deadSections = [];
const lowUseSections = [];

for (const s of sections) {
  // Strip comments for analysis
  const clean = s.code.replace(/\/\*[\s\S]*?\*\//g, '');
  const size = Buffer.byteLength(s.code, 'utf-8');
  const classSelectors = clean.match(/\.[a-zA-Z_][\w-]*/g) || [];
  const uniqueClasses = [...new Set(classSelectors.map(c => c.slice(1)))];
  const used = uniqueClasses.filter(c => classSet.has(c)).length;
  const total = uniqueClasses.length;
  const usedPct = total > 0 ? (used / total * 100).toFixed(0) : '0';

  totalSize += size;
  totalClasses += total;
  totalUsed += used;

  const sizeStr = (size / 1024).toFixed(1) + 'KB';
  console.log(
    s.name.substring(0, 40).padEnd(42) + ' ' +
    sizeStr.padStart(6) + '  ' +
    String(used).padStart(4) + '  ' +
    String(total).padStart(5) + '  ' +
    usedPct.padStart(4) + '%'
  );

  if (used === 0 && total > 0) {
    deadSections.push({ ...s, classCount: total, classes: uniqueClasses });
  } else if (total > 0 && used / total < 0.5) {
    lowUseSections.push({ ...s, used, total, classes: uniqueClasses });
  }
}

console.log('-'.repeat(75));
console.log('TOTAL'.padEnd(42) + ' ' +
  (totalSize/1024).toFixed(1) + 'KB  ' +
  String(totalUsed).padStart(4) + '  ' +
  String(totalClasses).padStart(5) + '  ' +
  (totalUsed/totalClasses*100).toFixed(0) + '%');

if (deadSections.length > 0) {
  console.log('\n=== 100% DEAD SECTIONS ===\n');
  for (const s of deadSections) {
    console.log('  ' + s.name + '  (' + (s.code.length/1024).toFixed(1) + 'KB, ' + s.classCount + ' classes)');
    console.log('    Classes: ' + s.classes.join(', '));
  }
}

if (lowUseSections.length > 0) {
  console.log('\n=== <50% USAGE SECTIONS ===\n');
  for (const s of lowUseSections) {
    const deadClasses = s.classes.filter(c => !classSet.has(c));
    console.log('  ' + s.name + '  (' + s.used + '/' + s.total + ' used)');
    console.log('    Dead classes: ' + deadClasses.join(', '));
  }
}
