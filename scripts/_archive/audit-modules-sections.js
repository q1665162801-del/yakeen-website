const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const modulesCss = path.join(__dirname, '..', 'css', 'components', 'modules.css');

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

// Also collect JS classes
const jsDir = path.join(__dirname, '..', 'js');
function walkJs(dir) {
  if (!fs.existsSync(dir)) return [];
  const r = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...walkJs(full));
    else if (e.name.endsWith('.js')) r.push(full);
  }
  return r;
}
const jsFiles = walkJs(jsDir);
const allJs = jsFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');

// Parse modules.css sections
const content = fs.readFileSync(modulesCss, 'utf-8').replace(/^\uFEFF/, '');
const lines = content.split('\n');
const sections = [];
let currentSection = null;
let startLine = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/^\s*\/\*\s*=+\s*$/) && i + 1 < lines.length) {
    const titleLine = lines[i + 1].trim();
    if (!titleLine.endsWith('*/') && titleLine.length > 0 && titleLine.length < 80
        && !titleLine.match(/^[=.\s]+$/) && !titleLine.startsWith('Modules')) {
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
if (currentSection) {
  sections.push({
    name: currentSection,
    startLine,
    endLine: lines.length - 1,
    code: lines.slice(startLine).join('\n'),
  });
}

console.log('modules.css — per-section usage (' + sections.length + ' sections)\n');
console.log(''.padEnd(40) + ' Size    Used  Total  Used%');
console.log('-'.repeat(70));

let totalSize = 0, totalClasses = 0, totalUsed = 0;
const deadSections = [];

for (const s of sections) {
  const clean = s.code.replace(/\/\*[\s\S]*?\*\//g, '');
  const size = Buffer.byteLength(s.code, 'utf-8');
  const classSelectors = clean.match(/\.[a-zA-Z_][\w-]*/g) || [];
  const uniqueClasses = [...new Set(classSelectors.map(c => c.slice(1)))];
  // Check both HTML and JS
  const used = uniqueClasses.filter(c => {
    const inHtml = classSet.has(c);
    const inJs = new RegExp('\\b' + c.replace(/-/g, '\\-') + '\\b').test(allJs);
    return inHtml || inJs;
  }).length;
  const total = uniqueClasses.length;
  const usedPct = total > 0 ? (used / total * 100).toFixed(0) : '0';

  totalSize += size;
  totalClasses += total;
  totalUsed += used;

  const sizeStr = (size / 1024).toFixed(1) + 'KB';
  console.log(
    s.name.substring(0, 38).padEnd(40) + ' ' +
    sizeStr.padStart(6) + '  ' +
    String(used).padStart(4) + '  ' +
    String(total).padStart(5) + '  ' +
    usedPct.padStart(4) + '%'
  );

  if (used === 0 && total > 0 && size > 200) {
    deadSections.push({ ...s, classCount: total, classes: uniqueClasses });
  }
}

console.log('-'.repeat(70));
console.log('TOTAL'.padEnd(40) + ' ' +
  (totalSize/1024).toFixed(1) + 'KB  ' +
  String(totalUsed).padStart(4) + '  ' +
  String(totalClasses).padStart(5) + '  ' +
  (totalUsed/totalClasses*100).toFixed(0) + '%');

if (deadSections.length > 0) {
  console.log('\n=== 100% DEAD SECTIONS (>200B) ===\n');
  for (const s of deadSections) {
    console.log('  ' + s.name + '  (' + (s.code.length/1024).toFixed(1) + 'KB, ' + s.classCount + ' classes)');
    console.log('    ' + s.classes.join(', '));
  }
}
