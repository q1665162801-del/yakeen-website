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

const stats = {
  totalSelectors: 0,
  bodyIdSelectors: 0, // body#yakeen-page
  doubleClass: 0,    // .foo.bar
  nestedDeep: 0,    // 3层以上嵌套
  idSelectors: 0,   // #xxx
  important: 0,
};

const fileStats = [];

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  const relPath = path.relative('css', file);
  
  // 粗略提取选择器（每行包含 { 的）
  const lines = clean.split('\n');
  let fileTotal = 0;
  let fileBodyId = 0;
  
  lines.forEach(line => {
    if (!line.includes('{')) return;
    const selectorPart = line.split('{')[0].trim();
    if (!selectorPart || selectorPart === '@keyframes' || selectorPart.startsWith('@')) return;
    
    const selectors = selectorPart.split(',').map(s => s.trim()).filter(s => s);
    selectors.forEach(sel => {
      fileTotal++;
      if (sel.startsWith('body#yakeen-page')) fileBodyId++;
    });
  });
  
  if (fileTotal > 0) {
    fileStats.push({ file: relPath, total: fileTotal, bodyId: fileBodyId, percent: ((fileBodyId/fileTotal)*100).toFixed(1) });
    stats.totalSelectors += fileTotal;
    stats.bodyIdSelectors += fileBodyId;
  }
});

console.log('=== CSS 选择器权重审计 ===\n');
console.log(`总选择器数: ${stats.totalSelectors}`);
console.log(`body#yakeen-page 前缀: ${stats.bodyIdSelectors} 个 (${((stats.bodyIdSelectors/stats.totalSelectors)*100).toFixed(1)}%)\n`);

console.log('按文件排名（body#yakeen-page 最多的）:');
fileStats.sort((a,b) => b.bodyId - a.bodyId).slice(0, 15).forEach(f => {
  const bar = '█'.repeat(Math.ceil(f.bodyId / 10));
  console.log(`  ${f.bodyId.toString().padStart(3)} / ${f.total.toString().padStart(3)} (${f.percent.padStart(5)}%)  ${f.file}  ${bar}`);
});
