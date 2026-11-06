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

// Gold hex → list of { file, property, selector }
const goldUsage = {};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Parse rule blocks
  const ruleRe = /([^{]+)\{([^}]+)\}/g;
  let match;
  while ((match = ruleRe.exec(clean)) !== null) {
    const selector = match[1].trim();
    const props = match[2];
    
    // Skip media queries and at-rules
    if (selector.startsWith('@')) continue;
    if (selector.includes('@media')) continue;
    
    const propLines = props.split(';');
    propLines.forEach(line => {
      const m = line.match(/([a-z-]+)\s*:\s*.*?(#[0-9a-f]{6}|#[0-9a-f]{3})/i);
      if (m) {
        const prop = m[1].toLowerCase().trim();
        const hex = m[2].toLowerCase();
        
        // Gold-ish detection
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        const isGoldish = r >= 140 && g >= 100 && b < 140 && r >= g && g > b;
        const isGoldTinted = Math.abs(r - g) < 30 && r > b + 20 && r > 180;
        
        if (isGoldish || isGoldTinted) {
          if (!goldUsage[hex]) goldUsage[hex] = [];
          goldUsage[hex].push({
            file: path.relative('css', file),
            property: prop,
            selector: selector.substring(0, 60)
          });
        }
      }
    });
  }
});

const sorted = Object.entries(goldUsage).sort((a, b) => b[1].length - a[1].length);

console.log('=== 金色 hex 用途分类 ===\n');

sorted.forEach(([hex, usages]) => {
  // Group by property
  const byProp = {};
  usages.forEach(u => {
    if (!byProp[u.property]) byProp[u.property] = [];
    byProp[u.property].push(u);
  });
  
  console.log(`\n${hex} (${usages.length} 次)`);
  console.log(`  RGB: ${parseInt(hex.substring(1,3),16)}, ${parseInt(hex.substring(3,5),16)}, ${parseInt(hex.substring(5,7),16)}`);
  console.log(`  按属性分布:`);
  
  Object.entries(byProp).sort((a,b) => b[1].length - a[1].length).forEach(([prop, items]) => {
    const files = [...new Set(items.map(i => i.file))];
    console.log(`    ${prop.padEnd(25)} ${String(items.length).padStart(3)} 次  [${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}]`);
  });
  
  // Show sample selectors for top property
  const topProp = Object.entries(byProp).sort((a,b) => b[1].length - a[1].length)[0];
  if (topProp) {
    const samples = [...new Set(topProp[1].slice(0, 4).map(i => i.selector))];
    console.log(`  示例: ${samples.join(' / ')}`);
  }
});
