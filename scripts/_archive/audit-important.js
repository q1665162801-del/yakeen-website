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
const allImportant = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Remove comments
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  const lines = clean.split('\n');
  
  // Find selector context for each !important
  let currentSelector = '';
  let braceCount = 0;
  let selectorLines = [];
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    // Track selector context
    if (trimmed.includes('{')) {
      if (braceCount === 0) {
        // Start of a new rule - capture selector from previous lines
        currentSelector = selectorLines.join(' ').trim();
      }
      braceCount += (trimmed.match(/\{/g) || []).length;
    }
    if (trimmed.includes('}')) {
      braceCount -= (trimmed.match(/\}/g) || []).length;
      if (braceCount === 0) {
        selectorLines = [];
        currentSelector = '';
      }
    }
    
    if (braceCount === 0 && trimmed && !trimmed.startsWith('@') && !trimmed.includes('{')) {
      selectorLines.push(trimmed);
    }
    if (braceCount === 0 && trimmed.includes('{')) {
      selectorLines.push(trimmed.split('{')[0]);
    }
    
    // Check for !important
    if (trimmed.includes('!important')) {
      // Extract property
      const propMatch = trimmed.match(/([a-z-]+)\s*:/i);
      const property = propMatch ? propMatch[1] : 'unknown';
      
      allImportant.push({
        file: path.relative('css', file),
        line: idx + 1,
        property: property,
        selector: currentSelector.substring(0, 80),
        context: trimmed.substring(0, 100)
      });
    }
  });
});

// Group by file
const byFile = {};
allImportant.forEach(i => {
  if (!byFile[i.file]) byFile[i.file] = [];
  byFile[i.file].push(i);
});

console.log(`=== !important 分布统计 ===\n`);
console.log(`总计: ${allImportant.length} 个 !important，分布在 ${Object.keys(byFile).length} 个文件中\n`);

Object.entries(byFile).sort((a, b) => b[1].length - a[1].length).forEach(([file, items]) => {
  console.log(`\n${file} (${items.length} 个):`);
  
  // Group by property
  const byProp = {};
  items.forEach(i => {
    if (!byProp[i.property]) byProp[i.property] = [];
    byProp[i.property].push(i);
  });
  
  Object.entries(byProp).sort((a, b) => b[1].length - a[1].length).forEach(([prop, list]) => {
    console.log(`  ${prop.padEnd(25)} ${String(list.length).padStart(3)} 个`);
    list.slice(0, 2).forEach(i => {
      console.log(`    L${i.line}: ${i.context.substring(0, 70)}`);
    });
    if (list.length > 2) console.log(`    ... 还有 ${list.length - 2} 个`);
  });
});

// Also analyze by category
console.log(`\n\n=== 按语义分类 ===\n`);

const categories = {
  'section-dark 反色覆盖': 0,
  '响应式覆盖': 0,
  'GCC 国家页覆盖': 0,
  '高权重选择器覆盖': 0,
  'utility 类': 0,
  '其他': 0
};

allImportant.forEach(i => {
  const s = i.selector.toLowerCase();
  const ctx = i.context.toLowerCase();
  if (s.includes('section-dark') || s.includes('.dark')) {
    categories['section-dark 反色覆盖']++;
  } else if (i.file.includes('responsive')) {
    categories['响应式覆盖']++;
  } else if (s.includes('gcc-country') || s.includes('.gcc-')) {
    categories['GCC 国家页覆盖']++;
  } else if (s.includes('body#yakeen-page') || s.startsWith('#yakeen-page')) {
    categories['高权重选择器覆盖']++;
  } else if (i.file.includes('utilities')) {
    categories['utility 类']++;
  } else {
    categories['其他']++;
  }
});

Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`  ${cat.padEnd(25)} ${count} 个`);
});
