const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  let result = [];
  files.forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '_archive') result = result.concat(walk(p));
    } else if (f.endsWith('.css')) {
      result.push(p);
    }
  });
  return result;
}

const files = walk('css');

// All gold-ish hex colors (case insensitive)
const goldRe = /#([0-9a-f]{6}|[0-9a-f]{3})\b/gi;

const colorMap = {};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Remove comments
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  
  let match;
  while ((match = goldRe.exec(clean)) !== null) {
    const hex = match[0].toLowerCase();
    // Check if it's gold-ish (R and G high, B low — typical gold/amber)
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    
    // Gold-ish: R >= 150, G >= 120, B < 120, and R > G > B
    const isGoldish = r >= 140 && g >= 100 && b < 140 && r >= g && g > b;
    // Also catch grays that might be gold-tinted (R and G close, both > B)
    const isGoldTinted = Math.abs(r - g) < 30 && r > b + 20 && r > 180;
    
    if (isGoldish || isGoldTinted) {
      if (!colorMap[hex]) {
        colorMap[hex] = { count: 0, files: new Set() };
      }
      colorMap[hex].count++;
      colorMap[hex].files.add(path.relative('css', file));
    }
  }
});

// Sort by count descending
const sorted = Object.entries(colorMap).sort((a, b) => b[1].count - a[1].count);

console.log('=== Gold-ish Colors in CSS ===\n');
console.log(`共找到 ${sorted.length} 种金色系 hex 值\n`);

sorted.forEach(([hex, data]) => {
  const fileList = [...data.files].slice(0, 3).join(', ');
  const more = data.files.size > 3 ? `... (+${data.files.size - 3})` : '';
  console.log(`  ${hex.padEnd(10)} ${String(data.count).padStart(3)} 次  [${fileList}${more}]`);
});

console.log('\n=== 当前 tokens.css 中定义的金色变量 ===\n');
const tokens = fs.readFileSync('css/tokens.css', 'utf8');
const tokenRe = /(--[a-z0-9-]+gold[a-z0-9-]*)\s*:\s*(#[0-9a-f]{6}|#[0-9a-f]{3}|var\([^)]+\)|rgba?\([^)]+\))/gi;
let tMatch;
while ((tMatch = tokenRe.exec(tokens)) !== null) {
  console.log(`  ${tMatch[1].padEnd(35)} = ${tMatch[2].trim()}`);
}
