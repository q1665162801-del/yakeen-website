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

const colorValues = {}; // { color: { count, files: Set, contexts: [] } }
let totalInlineColors = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative('src', file);
  
  // 匹配 style="..." 中的 color: #xxx
  const styleRe = /style="([^"]*)"/g;
  let match;
  while ((match = styleRe.exec(content)) !== null) {
    const styleStr = match[1];
    // 提取颜色相关属性
    const colorProps = styleStr.split(';').filter(s => 
      s.trim().match(/^(color|background-color|background|border-color|border)\s*:/)
    );
    
    colorProps.forEach(prop => {
      const trimmed = prop.trim();
      // 提取 hex 颜色值
      const hexMatch = trimmed.match(/:#([0-9a-fA-F]{3,8})\b/);
      if (hexMatch) {
        const color = '#' + hexMatch[1].toUpperCase();
        const propName = trimmed.split(':')[0].trim();
        
        if (!colorValues[color]) {
          colorValues[color] = { count: 0, files: new Set(), propTypes: new Set(), samples: [] };
        }
        colorValues[color].count++;
        colorValues[color].files.add(relPath);
        colorValues[color].propTypes.add(propName);
        if (colorValues[color].samples.length < 3) {
          colorValues[color].samples.push(`${relPath}: ${trimmed}`);
        }
        totalInlineColors++;
      }
      
      // 提取 var(--color-xxx) 形式
      const varMatch = trimmed.match(/var\(--color-([^)]+)\)/);
      if (varMatch) {
        // 已经用了变量，不计入问题
      }
    });
  }
});

console.log('=== HTML 内联 style 中的颜色硬编码 ===\n');
console.log(`总计: ${totalInlineColors} 处颜色硬编码\n`);

const entries = Object.entries(colorValues)
  .map(([color, data]) => ({ color, ...data }))
  .sort((a,b) => b.count - a.count);

entries.forEach((e, i) => {
  const props = [...e.propTypes].join(', ');
  console.log(`${(i+1).toString().padStart(2)}. ${e.color.padEnd(10)} ${e.count.toString().padStart(3)} 次  ${e.files.size} 页  属性: ${props}`);
});

// 统计金色相关
console.log('\n=== 金色系颜色 ===\n');
const goldShades = entries.filter(e => {
  const c = e.color.toLowerCase();
  // 金色系：D4AF37, C8961E, E8C868, DAA520, B8860B, 以及各种金色变体
  return c === '#d4af37' || c === '#c8961e' || c === '#e8c868' || 
         c === '#daa520' || c === '#b8860b' || c === '#cd853f' ||
         c === '#d4a017' || c === '#e6be8a' || c === '#e8c547' ||
         c === '#f0d77e' || c === '#e8c100' || c === '#dab420' ||
         c.match(/#e8c/) || c.match(/#d4a/) || c.match(/#c89/) ||
         c.match(/#daa/) || c.match(/#e6b/);
});

let goldTotal = 0;
goldShades.forEach(e => {
  goldTotal += e.count;
  console.log(`  ${e.color.padEnd(10)} ${e.count.toString().padStart(3)} 次  ${e.files.size} 页`);
});
console.log(`  ${'合计'.padEnd(10)} ${goldTotal.toString().padStart(3)} 次`);
