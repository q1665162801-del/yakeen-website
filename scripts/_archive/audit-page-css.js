const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'css', 'pages');
const distDir = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(pagesDir)) {
  console.log('No pages/ directory found.');
  process.exit(0);
}

// Collect all HTML class names
function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  const r = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...walk(full, ext));
    else if (!ext || e.name.endsWith(ext)) r.push(full);
  }
  return r;
}
const htmlFiles = walk(distDir, '.html');
const allHtml = htmlFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
const classSet = new Set();
const classMatches = allHtml.match(/class="([^"]+)"/g) || [];
for (const m of classMatches) {
  const classes = m.replace(/class="([^"]+)"/, '$1').split(/\s+/);
  for (const c of classes) if (c) classSet.add(c);
}

// Also check JS
const jsFiles = walk(path.join(__dirname, '..', 'js'), '.js');
const allJs = jsFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');

const pageFiles = walk(pagesDir, '.css');
console.log('Page-specific CSS files — usage analysis (' + pageFiles.length + ' files)\n');
console.log(''.padEnd(40) + ' Size    Used  Total  Used%');
console.log('-'.repeat(70));

let totalSize = 0, totalClasses = 0, totalUsed = 0;
const deadFiles = [];

for (const file of pageFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  const size = Buffer.byteLength(content, 'utf-8');
  const classSelectors = clean.match(/\.[a-zA-Z_][\w-]*/g) || [];
  const uniqueClasses = [...new Set(classSelectors.map(c => c.slice(1)))];
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

  const name = path.basename(file);
  const sizeStr = (size / 1024).toFixed(1) + 'KB';
  console.log(
    name.substring(0, 38).padEnd(40) + ' ' +
    sizeStr.padStart(6) + '  ' +
    String(used).padStart(4) + '  ' +
    String(total).padStart(5) + '  ' +
    usedPct.padStart(4) + '%'
  );

  if (used === 0 && total > 0 && size > 500) {
    deadFiles.push({ name, file, size, classes: uniqueClasses });
  }
}

console.log('-'.repeat(70));
console.log('TOTAL'.padEnd(40) + ' ' +
  (totalSize/1024).toFixed(1) + 'KB  ' +
  String(totalUsed).padStart(4) + '  ' +
  String(totalClasses).padStart(5) + '  ' +
  (totalClasses > 0 ? (totalUsed/totalClasses*100).toFixed(0) : '0') + '%');

if (deadFiles.length > 0) {
  console.log('\n=== FILES WITH 0 USAGE (>500B) ===\n');
  for (const f of deadFiles) {
    console.log('  ' + f.name + '  (' + (f.size/1024).toFixed(1) + 'KB)');
    console.log('    Classes: ' + f.classes.join(', '));
  }
}
