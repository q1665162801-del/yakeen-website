const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const layoutCss = path.join(__dirname, '..', 'css', 'layout.css');

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

const content = fs.readFileSync(layoutCss, 'utf-8');
const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
const classSelectors = clean.match(/\.[a-zA-Z_][\w-]*/g) || [];
const uniqueClasses = [...new Set(classSelectors.map(c => c.slice(1)))];

const deadClasses = uniqueClasses.filter(c => !classSet.has(c));
const usedClasses = uniqueClasses.filter(c => classSet.has(c));

console.log('layout.css dead class analysis:');
console.log('  Total unique classes: ' + uniqueClasses.length);
console.log('  Used: ' + usedClasses.length);
console.log('  Dead: ' + deadClasses.length + ' (' + (deadClasses.length/uniqueClasses.length*100).toFixed(0) + '%)');
console.log('');
console.log('  Dead classes:');
for (const c of deadClasses) {
  // Count occurrences in CSS
  const re = new RegExp('\\.' + c.replace(/-/g, '\\-') + '\\b', 'g');
  const count = (clean.match(re) || []).length;
  console.log('    ' + c + ' (' + count + ' occurrences)');
}
