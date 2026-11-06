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
const htmlFiles = walk('src', '.html');

console.log('=== P1 架构债务审计 ===\n');

// 1. 内联 style 属性（HTML 里硬编码样式）
console.log('1. HTML 内联 style 属性（硬编码样式）');
let inlineStyleCount = 0;
const inlineStyleFiles = [];
htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/style="[^"]*"/g);
  if (matches && matches.length > 0) {
    inlineStyleCount += matches.length;
    inlineStyleFiles.push({ file: path.relative('src', file), count: matches.length });
  }
});
console.log(`   总计: ${inlineStyleCount} 处，分布在 ${inlineStyleFiles.length} 个文件`);
inlineStyleFiles.sort((a,b) => b.count - a.count).slice(0, 10).forEach(f => {
  console.log(`   ${f.count.toString().padStart(3)} 处  ${f.file}`);
});
console.log('');

// 2. 裸 hex 颜色值（剩余未变量化的）
console.log('2. 裸 hex 颜色值（非变量）');
let bareHexCount = 0;
const bareHexByFile = {};
cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  const hexMatches = clean.match(/:#[0-9a-fA-F]{3,8}\b/g);
  if (hexMatches) {
    // 排除变量定义（--xxx: #... 是变量定义，不算裸值）
    const varRe = /--[\w-]+:\s*#[0-9a-fA-F]{3,8}/g;
    const varMatches = clean.match(varRe) || [];
    const bare = hexMatches.length - varMatches.length;
    if (bare > 0) {
      bareHexCount += bare;
      bareHexByFile[path.relative('css', file)] = bare;
    }
  }
});
console.log(`   总计: ${bareHexCount} 处`);
Object.entries(bareHexByFile).sort((a,b) => b[1] - a[1]).slice(0, 10).forEach(([f, c]) => {
  console.log(`   ${c.toString().padStart(3)} 处  ${f}`);
});
console.log('');

// 3. 无衬线/等宽字体混用
console.log('3. font-family 直接定义（未用变量）');
let fontFamilyCount = 0;
const fontFamilyFiles = {};
cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  const matches = clean.match(/font-family:\s*(?!var\()/g);
  if (matches) {
    fontFamilyCount += matches.length;
    fontFamilyFiles[path.relative('css', file)] = matches.length;
  }
});
console.log(`   总计: ${fontFamilyCount} 处直接写 font-family`);
Object.entries(fontFamilyFiles).sort((a,b) => b[1] - a[1]).slice(0, 10).forEach(([f, c]) => {
  console.log(`   ${c.toString().padStart(3)} 处  ${f}`);
});
console.log('');

// 4. 魔法数字（间距、圆角等硬编码 px）
console.log('4. 硬编码 padding/margin（非变量）');
let magicSpacingCount = 0;
const spacingFiles = {};
cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  // 匹配 padding/margin: xxpx（排除 0、变量、calc、clamp）
  const re = /(?:padding|margin)(?:-top|-right|-bottom|-left)?:\s*(?![\d\s]*0[\s;]|var\(|calc|clamp|auto|inherit|transparent)\d+px/g;
  const matches = clean.match(re);
  if (matches) {
    magicSpacingCount += matches.length;
    spacingFiles[path.relative('css', file)] = matches.length;
  }
});
console.log(`   总计: ${magicSpacingCount} 处硬编码间距`);
Object.entries(spacingFiles).sort((a,b) => b[1] - a[1]).slice(0, 10).forEach(([f, c]) => {
  console.log(`   ${c.toString().padStart(3)} 处  ${f}`);
});
console.log('');

// 5. z-index 审计
console.log('5. z-index 定义');
let zIndexCount = 0;
const zIndexValues = {};
cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  const matches = clean.match(/z-index:\s*(-?\d+)/g);
  if (matches) {
    matches.forEach(m => {
      zIndexCount++;
      const val = m.split(':')[1].trim();
      zIndexValues[val] = (zIndexValues[val] || 0) + 1;
    });
  }
});
console.log(`   总计: ${zIndexCount} 处 z-index`);
console.log(`   值分布: ${Object.keys(zIndexValues).sort((a,b) => parseInt(a)-parseInt(b)).join(', ')}`);
console.log('');

// 6. CSS 文件大小排名
console.log('6. CSS 文件大小排名（最大的 10 个）');
const fileSizes = cssFiles.map(f => ({
  file: path.relative('css', f),
  size: fs.statSync(f).size,
  lines: fs.readFileSync(f, 'utf8').split('\n').length
})).sort((a,b) => b.size - a.size);
fileSizes.slice(0, 10).forEach(f => {
  const kb = (f.size / 1024).toFixed(1);
  console.log(`   ${kb.padStart(6)} KB  ${f.lines.toString().padStart(4)} 行  ${f.file}`);
});
console.log('');

// 7. 总结
console.log('=== 总结 ===');
console.log(`  内联 style:   ${inlineStyleCount} 处 / ${inlineStyleFiles.length} 页`);
console.log(`  裸 hex:      ${bareHexCount} 处`);
console.log(`  字体硬编码:   ${fontFamilyCount} 处`);
console.log(`  间距硬编码:   ${magicSpacingCount} 处`);
console.log(`  z-index:     ${zIndexCount} 处（${Object.keys(zIndexValues).length} 种值）`);
console.log(`  最大文件:     ${fileSizes[0].file} (${(fileSizes[0].size/1024).toFixed(1)} KB)`);
