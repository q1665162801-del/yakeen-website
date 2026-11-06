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

const fontFamilies = {};
const varFontFamilies = {};

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /font-family:\s*([^;{}]+)/g;
  let match;
  while ((match = re.exec(clean)) !== null) {
    const val = match[1].trim();
    const relPath = path.relative('css', file);
    
    if (val.startsWith('var(')) {
      varFontFamilies[val] = (varFontFamilies[val] || 0) + 1;
    } else {
      if (!fontFamilies[val]) fontFamilies[val] = { count: 0, files: [] };
      fontFamilies[val].count++;
      if (!fontFamilies[val].files.includes(relPath)) {
        fontFamilies[val].files.push(relPath);
      }
    }
  }
});

console.log('=== 硬编码 font-family 值分布 ===\n');

const entries = Object.entries(fontFamilies).sort((a,b) => b[1].count - a[1].count);
entries.forEach(([val, data], i) => {
  console.log(`${(i+1).toString().padStart(2)}. [${data.count}处 / ${data.files.length}文件] ${val}`);
  console.log(`    文件: ${data.files.slice(0, 5).join(', ')}${data.files.length > 5 ? '...' : ''}`);
});

console.log(`\n总计: ${entries.reduce((s,e) => s + e[1].count, 0)} 处硬编码，${entries.length} 种不同值\n`);

console.log('=== 已使用变量的 font-family ===\n');
Object.entries(varFontFamilies).sort((a,b) => b[1] - a[1]).forEach(([val, count]) => {
  console.log(`  [${count}处] ${val}`);
});
