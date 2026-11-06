const fs = require('fs');
const path = require('path');

function walk(dir, ext) {
  const files = fs.readdirSync(dir);
  let result = [];
  files.forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '_archive') result = result.concat(walk(p, ext));
    } else if (f.endsWith(ext)) {
      result.push(p);
    }
  });
  return result;
}

const cssFiles = walk('css', '.css');

const fileStats = [];
let total = 0;

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /font-family:\s*(?!var\(|inherit)([^;{}]+)/g;
  const matches = clean.match(re);
  if (matches) {
    const relPath = path.relative('css', file);
    const values = matches.map(m => m.replace(/font-family:\s*/, '').trim());
    const uniqueValues = [...new Set(values)];
    fileStats.push({ file: relPath, count: matches.length, values: uniqueValues });
    total += matches.length;
  }
});

fileStats.sort((a,b) => b.count - a.count);

console.log(`总计: ${total} 处硬编码 font-family\n`);
fileStats.forEach(f => {
  console.log(`${f.count.toString().padStart(3)} 处  ${f.file}`);
  f.values.forEach(v => console.log(`        ${v}`));
});
