const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'css');

function walk(dir) {
  const r = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...walk(full));
    else if (e.name.endsWith('.css')) r.push(full);
  }
  return r;
}

const cssFiles = walk(cssDir);
const pattern = /,__FB__var\([^)]+\)/g;
let totalFixed = 0;

for (const file of cssFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  const matches = content.match(pattern);
  if (matches && matches.length > 0) {
    content = content.replace(pattern, '');
    fs.writeFileSync(file, content);
    const relPath = file.replace(cssDir, '').replace(/\\/g, '/').replace(/^\//, '');
    console.log('✓ ' + relPath + ': fixed ' + matches.length + ' corrupted var fallbacks');
    totalFixed += matches.length;
  }
}

console.log('\nTotal fixed: ' + totalFixed + ' corrupted var fallbacks across all CSS files');
