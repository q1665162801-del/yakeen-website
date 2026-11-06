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

const spacingValues = {}; // { value: { count, files: Set, props: Set } }

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  const relPath = path.relative('css', file);
  
  // 匹配 padding 和 margin 属性
  const propRe = /(?:^|\{|\n)\s*(padding|margin)(?:-(top|right|bottom|left))?\s*:\s*([^;{}]+)/g;
  let match;
  while ((match = propRe.exec(clean)) !== null) {
    const prop = match[1] + (match[2] ? '-' + match[2] : '');
    const value = match[3].trim();
    
    // 跳过变量、calc、clamp、0、auto、inherit
    if (value.startsWith('var(') || value.startsWith('calc') || value.startsWith('clamp') ||
        value === '0' || value === 'auto' || value === 'inherit' || value === 'initial') continue;
    
    // 只统计纯 px 值的单值属性（因为多值 padding/margin 比较复杂）
    const pxMatch = value.match(/^(-?\d+(?:\.\d+)?)px$/);
    if (!pxMatch) continue;
    
    const pxValue = parseFloat(pxMatch[1]);
    // 跳过负值（通常是特殊布局，不是标准间距）
    if (pxValue < 0) continue;
    
    const key = `${pxValue}px`;
    if (!spacingValues[key]) {
      spacingValues[key] = { count: 0, files: new Set(), props: new Set() };
    }
    spacingValues[key].count++;
    spacingValues[key].files.add(relPath);
    spacingValues[key].props.add(prop);
  }
});

console.log('=== 间距值分布（px 单值） TOP 30 ===\n');

const entries = Object.entries(spacingValues)
  .map(([val, data]) => ({ value: val, px: parseFloat(val), ...data }))
  .sort((a,b) => b.count - a.count);

let totalCount = 0;
entries.forEach(e => totalCount += e.count);

console.log(`总计: ${totalCount} 处单值 px 间距\n`);

entries.slice(0, 30).forEach((e, i) => {
  const fileCount = e.files.size;
  const props = [...e.props].slice(0, 4).join(', ');
  console.log(`${(i+1).toString().padStart(2)}. ${e.value.padEnd(8)} ${e.count.toString().padStart(3)} 次  分布在 ${fileCount} 个文件  属性: ${props}${e.props.size > 4 ? '...' : ''}`);
});

// 看看标准间距值（4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80）的覆盖情况
console.log('\n=== 标准 8px 栅格间距覆盖 ===\n');
const standardSpacings = [4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80, 96, 120];
let standardTotal = 0;
standardSpacings.forEach(px => {
  const key = `${px}px`;
  const data = spacingValues[key];
  const count = data ? data.count : 0;
  standardTotal += count;
  if (count > 0) {
    console.log(`  ${px.toString().padStart(3)}px: ${count.toString().padStart(3)} 次  ${'█'.repeat(Math.ceil(count/5))}`);
  }
});

console.log(`\n标准间距总计: ${standardTotal} 次 (占 ${(standardTotal/totalCount*100).toFixed(1)}%)`);

// 非标准间距值（不在 8px 栅格上的）
console.log('\n=== 非标准间距值（不在 8px 栅格上）===');
const nonStandard = entries.filter(e => e.px % 4 !== 0);
console.log(`共 ${nonStandard.length} 种非标准值，${nonStandard.reduce((s,e)=>s+e.count,0)} 次\n`);
nonStandard.slice(0, 20).forEach((e, i) => {
  console.log(`${(i+1).toString().padStart(2)}. ${e.value.padEnd(8)} ${e.count.toString().padStart(3)} 次  ${[...e.files].slice(0,3).join(', ')}`);
});
