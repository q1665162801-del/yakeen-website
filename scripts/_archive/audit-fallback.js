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

// Read tokens and extract gold variable values
const tokens = fs.readFileSync('css/tokens.css', 'utf8');
const goldVars = {};
const varRe = /(--color-gold-[a-z-]+)\s*:\s*(#[0-9a-f]{6}|#[0-9a-f]{3})/gi;
let m;
while ((m = varRe.exec(tokens)) !== null) {
  goldVars[m[1].toLowerCase()] = m[2].toLowerCase();
}

console.log('=== 金色变量及其值 ===\n');
Object.entries(goldVars).forEach(([name, val]) => {
  console.log(`  ${name.padEnd(30)} = ${val}`);
});

// Check all var() fallbacks in CSS files
const files = walk('css');
const mismatches = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    // Find var(--color-gold-xxx, #xxxxxx) patterns
    const fallbackRe = /var\((--color-gold-[a-z-]+)\s*,\s*(#[0-9a-f]{6}|#[0-9a-f]{3})\)/gi;
    let match;
    while ((match = fallbackRe.exec(line)) !== null) {
      const varName = match[1].toLowerCase();
      const fallback = match[2].toLowerCase();
      const actual = goldVars[varName];
      
      if (actual && actual !== fallback) {
        mismatches.push({
          file: path.relative('css', file),
          line: idx + 1,
          variable: varName,
          fallback: fallback,
          actual: actual,
          context: line.trim().substring(0, 80)
        });
      }
    }
  });
});

console.log(`\n=== Fallback 值不匹配 ===\n`);
if (mismatches.length === 0) {
  console.log('  全部正确！');
} else {
  console.log(`  共 ${mismatches.length} 处不匹配：\n`);
  mismatches.forEach(m => {
    console.log(`  ${m.file}:L${m.line}`);
    console.log(`    变量: ${m.variable}`);
    console.log(`    实际值: ${m.actual}`);
    console.log(`    Fallback: ${m.fallback}`);
    console.log(`    ${m.context}`);
    console.log();
  });
}
