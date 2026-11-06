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

// 金色系 hex → 变量映射
// 先收集所有出现的金色 hex，再决定映射关系
const goldColors = new Map(); // hex -> { count, files: Set, props: Set }

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
      // 匹配颜色属性中的 hex 值
      const colorMatch = trimmed.match(/(color|background|background-color|border-color|border)\s*:\s*.*#([0-9a-fA-F]{3,8})/);
      if (colorMatch) {
        const propName = colorMatch[1];
        const hex = '#' + colorMatch[2].toUpperCase();
        
        // 判断是不是金色系
        const isGold = isGoldColor(hex);
        if (isGold) {
          if (!goldColors.has(hex)) {
            goldColors.set(hex, { count: 0, files: new Set(), props: new Set() });
          }
          const data = goldColors.get(hex);
          data.count++;
          data.files.add(relPath);
          data.props.add(propName);
        }
      }
    });
  }
});

function isGoldColor(hex) {
  // 规范化
  let h = hex.toUpperCase().replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6) return false;
  
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  
  // 金色判断：R > G > B，且 R 和 G 都比较高，B 相对低
  // 金色大概在 #D4AF37 附近，R≈212, G≈175, B≈55
  return r > 150 && g > 120 && b < 120 && r > g && g > b && (r - b) > 50;
}

console.log('=== HTML 内联 style 中的金色系颜色 ===\n');

const sorted = [...goldColors.entries()]
  .map(([hex, data]) => ({ hex, ...data }))
  .sort((a,b) => b.count - a.count);

let total = 0;
sorted.forEach((c, i) => {
  total += c.count;
  const props = [...c.props].join(', ');
  const fileList = [...c.files].slice(0, 3).join(', ');
  console.log(`${(i+1).toString().padStart(2)}. ${c.hex.padEnd(10)} ${c.count.toString().padStart(3)} 次  ${c.files.size} 页  属性: ${props}`);
  console.log(`    页面: ${fileList}${c.files.size > 3 ? '...' : ''}`);
});

console.log(`\n总计: ${total} 处金色硬编码，${sorted.length} 种不同的金色`);

// 建议的变量映射
console.log('\n=== 建议变量映射 ===\n');
sorted.forEach(c => {
  // 找最接近的现有金色变量
  const mapping = suggestVariable(c.hex);
  console.log(`  ${c.hex.padEnd(10)} → ${mapping}`);
});

function suggestVariable(hex) {
  const h = hex.toUpperCase().replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const brightness = (r + g + b) / 3;
  
  if (brightness > 200) return 'var(--color-gold-bright)（浅金色）';
  if (brightness > 170) return 'var(--color-gold-primary)（标准金）';
  if (brightness > 140) return 'var(--color-gold-dark)（深金色）';
  return 'var(--color-gold-darker)（暗金色）';
}
