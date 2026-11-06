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

// Gold hex colors to check (lowercase)
const goldHexes = [
  '#c8961e', '#e8c868', '#b89648', '#d4af37', '#a87e1a',
  '#e8dcc4', '#d4a84b', '#d4b454', '#a08040', '#e8c56e',
  '#9a7e57', '#e0bc42', '#c4a014', '#c9a227', '#c2a56a',
  '#b8960c'
];

const findings = [];

files.forEach(file => {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    // Skip comments
    if (line.trim().startsWith('/*') || line.trim().startsWith('*')) return;
    
    const lowerLine = line.toLowerCase();
    
    goldHexes.forEach(hex => {
      // Find occurrences
      let pos = 0;
      while ((pos = lowerLine.indexOf(hex, pos)) !== -1) {
        // Check if it's inside a var() fallback — look backwards for 'var('
        // and check there's no 'var(' before this position that contains this hex as fallback
        const before = lowerLine.substring(Math.max(0, pos - 50), pos);
        const isVarFallback = before.includes('var(--color-') && before.includes(', ');
        
        // Check if it's a token definition (--xxx: #hex)
        const isTokenDef = /^--[a-z0-9-]+\s*:\s*$/i.test(line.substring(0, pos).trim()) ||
                           line.trim().match(/^--[a-z-]+:\s*#/i);
        
        // Check if it's inside a gradient (still a "bare" hex)
        const isInGradient = lowerLine.includes('linear-gradient') || lowerLine.includes('radial-gradient');
        
        if (!isVarFallback && !isTokenDef) {
          findings.push({
            file: path.relative('css', file),
            line: idx + 1,
            hex: hex,
            context: line.trim().substring(0, 100),
            type: isInGradient ? 'gradient' : 'bare'
          });
        }
        pos += hex.length;
      }
    });
  });
});

// Group by file
const byFile = {};
findings.forEach(f => {
  if (!byFile[f.file]) byFile[f.file] = [];
  byFile[f.file].push(f);
});

console.log('=== 裸金色 hex（未用 CSS 变量）统计 ===\n');
console.log(`共 ${findings.length} 处裸金色 hex，分布在 ${Object.keys(byFile).length} 个文件中\n`);

Object.entries(byFile).sort((a, b) => b[1].length - a[1].length).forEach(([file, items]) => {
  // Count by hex
  const byHex = {};
  items.forEach(i => {
    if (!byHex[i.hex]) byHex[i.hex] = { count: 0, type: i.type };
    byHex[i.hex].count++;
  });
  
  console.log(`\n${file} (${items.length} 处):`);
  Object.entries(byHex).forEach(([hex, data]) => {
    console.log(`  ${hex.padEnd(10)} ${String(data.count).padStart(3)} 次  [${data.type}]`);
  });
  
  // Show line numbers and context
  items.slice(0, 5).forEach(i => {
    console.log(`    L${i.line}: ${i.context.substring(0, 70)}`);
  });
  if (items.length > 5) console.log(`    ... 还有 ${items.length - 5} 处`);
});
