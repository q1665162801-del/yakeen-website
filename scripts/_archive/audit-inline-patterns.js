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

// 统计每个完整 style 属性字符串的出现次数
const styleCounts = {};
const styleLocations = {};

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const styleAttrs = content.match(/style="[^"]*"/g);
  if (!styleAttrs) return;
  
  styleAttrs.forEach(attr => {
    // 排除纯 background-image
    if (attr.includes('background-image') && !attr.includes(';')) return;
    
    const style = attr.replace(/^style="/, '').replace(/"$/, '').trim();
    // 规范化（去掉多余空格）
    const normalized = style.split(';')
      .map(s => s.trim())
      .filter(s => s)
      .sort()
      .join('; ');
    
    styleCounts[normalized] = (styleCounts[normalized] || 0) + 1;
    if (!styleLocations[normalized]) styleLocations[normalized] = [];
    styleLocations[normalized].push(path.relative('src', file));
  });
});

console.log('=== 重复出现的内联样式 TOP 30 ===\n');

const entries = Object.entries(styleCounts)
  .filter(([style, count]) => count >= 2)
  .sort((a,b) => b[1] - a[1])
  .slice(0, 30);

entries.forEach(([style, count], i) => {
  const pages = [...new Set(styleLocations[style])].length;
  console.log(`${(i+1).toString().padStart(2)}. [${count}次 / ${pages}页] ${style}`);
});

console.log(`\n共 ${Object.keys(styleCounts).length} 种不同的 style 组合`);
console.log(`其中重复出现（>=2次）的有 ${entries.length} 种`);

// 统计单个属性的出现频率
console.log('\n=== 单个属性出现频率 TOP 20 ===\n');
const propCounts = {};
Object.keys(styleCounts).forEach(style => {
  const count = styleCounts[style];
  style.split(';').forEach(prop => {
    const trimmed = prop.trim();
    if (!trimmed) return;
    const [name, ...valParts] = trimmed.split(':');
    const propName = name.trim().toLowerCase();
    const value = valParts.join(':').trim();
    const key = `${propName}: ${value}`;
    propCounts[key] = (propCounts[key] || 0) + count;
  });
});

Object.entries(propCounts)
  .filter(([k]) => !k.startsWith('background-image'))
  .sort((a,b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([prop, count], i) => {
    console.log(`${(i+1).toString().padStart(2)}. [${count}次] ${prop}`);
  });
