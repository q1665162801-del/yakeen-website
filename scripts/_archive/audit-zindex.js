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

const zIndexEntries = [];

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  const lines = clean.split('\n');
  const relPath = path.relative('css', file);
  
  // 向上找选择器
  function findSelector(lineIdx) {
    for (let i = lineIdx - 1; i >= Math.max(0, lineIdx - 20); i--) {
      if (lines[i].includes('{')) {
        const sel = lines[i].split('{')[0].trim();
        if (sel) return sel.split(',').map(s => s.trim())[0];
      }
    }
    return '(unknown)';
  }
  
  lines.forEach((line, idx) => {
    const match = line.match(/z-index:\s*(-?\d+)/);
    if (match) {
      zIndexEntries.push({
        value: parseInt(match[1]),
        file: relPath,
        line: idx + 1,
        selector: findSelector(idx),
        context: line.trim()
      });
    }
  });
});

console.log('=== z-index 完整清单（按值排序）===\n');

zIndexEntries.sort((a,b) => a.value - b.value);

zIndexEntries.forEach((e, i) => {
  console.log(`${(i+1).toString().padStart(2)}. z-index: ${e.value.toString().padStart(6)}  ${e.file.padEnd(30)} L${e.line.toString().padEnd(4)}  ${e.selector}`);
});

console.log(`\n总计: ${zIndexEntries.length} 处`);
console.log(`值范围: ${zIndexEntries[0].value} ~ ${zIndexEntries[zIndexEntries.length-1].value}`);

// 按层级分组
console.log('\n=== 层级建议 ===\n');
const layers = {
  '0 基础层': zIndexEntries.filter(e => e.value === 0).length,
  '1-3 内容层': zIndexEntries.filter(e => e.value >= 1 && e.value <= 3).length,
  '50 下拉/悬浮': zIndexEntries.filter(e => e.value === 50).length,
  '1000+ 导航/覆盖层': zIndexEntries.filter(e => e.value >= 1000 && e.value < 9000).length,
  '9999+ 弹窗/顶层': zIndexEntries.filter(e => e.value >= 9000).length,
};
Object.entries(layers).forEach(([layer, count]) => {
  console.log(`  ${layer.padEnd(18)} ${count} 处`);
});
