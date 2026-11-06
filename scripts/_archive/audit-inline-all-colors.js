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

const htmlFiles = walk('src', '.html');

// tokens.css 中已知的精确颜色值
const tokenColors = {
  // 背景色
  '#F5F3EE': 'var(--color-bg-canvas)',
  '#EFEBE3': 'var(--color-bg-surface)',
  '#FFFFFF': 'var(--color-bg-elevated)',
  '#FFF': 'var(--color-bg-elevated)',
  '#E8E3D8': 'var(--color-bg-sunken)',
  '#F2EDE3': 'var(--color-bg-accent)',
  // 文本色
  '#1C1A17': 'var(--color-text-primary)',
  '#1A1A1A': 'var(--color-text-primary)',
  '#3D3A33': 'var(--color-text-secondary)',
  '#6B6557': 'var(--color-text-tertiary)',
  '#9A9282': 'var(--color-text-muted)',
  // 金色
  '#C8961E': 'var(--color-gold-primary)',
  '#D4AF37': 'var(--color-gold-light)',
  '#E8C868': 'var(--color-gold-bright)',
  '#B89648': 'var(--color-gold-text)',
  // 边框
  '#1C1A17': 'var(--color-text-primary)',
  '#eee': 'var(--color-border-light)',
  '#ddd': 'var(--color-border)',
  // 其他
  '#fff': 'var(--color-bg-elevated)',
};

// 统计内联 style 中所有颜色硬编码
const allColors = {}; // { hex: { count, files: Set, props: Set } }

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative('src', file);
  
  const styleRe = /style="([^"]*)"/g;
  let match;
  while ((match = styleRe.exec(content)) !== null) {
    const styleStr = match[1];
    const props = styleStr.split(';').filter(p => p.trim());
    
    props.forEach(prop => {
      const trimmed = prop.trim();
      // 提取所有 hex 颜色
      const hexRe = /#([0-9a-fA-F]{3,8})\b/g;
      let hexMatch;
      while ((hexMatch = hexRe.exec(trimmed)) !== null) {
        const hex = '#' + hexMatch[1].toUpperCase();
        const propName = trimmed.split(':')[0].trim();
        
        if (!allColors[hex]) {
          allColors[hex] = { count: 0, files: new Set(), props: new Set() };
        }
        allColors[hex].count++;
        allColors[hex].files.add(relPath);
        allColors[hex].props.add(propName);
      }
    });
  }
});

console.log('=== HTML 内联 style 中所有 hex 颜色（按出现次数）===\n');

const sorted = Object.entries(allColors)
  .map(([hex, data]) => ({ hex, ...data }))
  .sort((a,b) => b.count - a.count);

let total = 0;
sorted.forEach((c, i) => {
  total += c.count;
  const hasMatch = tokenColors[c.hex] ? '✅ ' : '   ';
  const mapping = tokenColors[c.hex] || '';
  const props = [...c.props].slice(0, 3).join(', ');
  console.log(`${hasMatch}${(i+1).toString().padStart(2)}. ${c.hex.padEnd(10)} ${c.count.toString().padStart(3)} 次  ${c.files.size} 页  ${props.padEnd(20)} ${mapping}`);
});

console.log(`\n总计: ${total} 处颜色硬编码，${sorted.length} 种颜色`);

// 计算可替换的
let replaceable = 0;
sorted.forEach(c => {
  if (tokenColors[c.hex]) replaceable += c.count;
});
console.log(`可精确替换为变量: ${replaceable} 处 (${(replaceable/total*100).toFixed(1)}%)`);
