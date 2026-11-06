const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

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

const jsFiles = walk(path.join(__dirname, '..', 'js'), '.js');
const allJs = jsFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');

// Analyze chandeliers.css dead classes
const files = [
  'css/pages/chandeliers.css',
  'css/sections/features.css',
];

for (const f of files) {
  const filePath = path.join(__dirname, '..', f);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf-8');
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  const classSelectors = clean.match(/\.[a-zA-Z_][\w-]*/g) || [];
  const uniqueClasses = [...new Set(classSelectors.map(c => c.slice(1)))];
  const deadClasses = uniqueClasses.filter(c => {
    const inHtml = classSet.has(c);
    const inJs = new RegExp('\\b' + c.replace(/-/g, '\\-') + '\\b').test(allJs);
    return !inHtml && !inJs;
  });

  console.log(f + ' (' + (content.length/1024).toFixed(1) + 'KB):');
  console.log('  Dead classes: ' + deadClasses.length + '/' + uniqueClasses.length);
  if (deadClasses.length > 0) {
    for (const c of deadClasses) {
      // Count occurrences
      const re = new RegExp('\\.' + c.replace(/-/g, '\\-') + '\\b', 'g');
      const count = (clean.match(re) || []).length;
      console.log('    ' + c + ' (' + count + ' occurrences)');
    }
  }
  console.log('');
}
