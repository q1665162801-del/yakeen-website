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

// Inter 字体变体 → var(--font-sans)
// 所有这些替换都是零视觉变化，因为 --font-sans 变量值就是 Inter 字体栈
const interPatterns = [
  // 完整形式：'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
  { pattern: /font-family:\s*'Inter',\s*-apple-system,\s*BlinkMacSystemFont,\s*'Segoe UI',\s*sans-serif/g, replacement: "font-family: var(--font-sans)" },
  // 形式：'Inter', -apple-system, BlinkMacSystemFont, sans-serif
  { pattern: /font-family:\s*'Inter',\s*-apple-system,\s*BlinkMacSystemFont,\s*sans-serif/g, replacement: "font-family: var(--font-sans)" },
  // 形式：'Inter', -apple-system, sans-serif
  { pattern: /font-family:\s*'Inter',\s*-apple-system,\s*sans-serif/g, replacement: "font-family: var(--font-sans)" },
  // 最简形式：'Inter', sans-serif
  { pattern: /font-family:\s*'Inter',\s*sans-serif/g, replacement: "font-family: var(--font-sans)" },
];

let totalReplaced = 0;
const fileChanges = [];

cssFiles.forEach(file => {
  const original = fs.readFileSync(file, 'utf8');
  let content = original;
  let fileCount = 0;
  
  interPatterns.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      fileCount += matches.length;
      content = content.replace(pattern, replacement);
    }
  });
  
  if (fileCount > 0) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplaced += fileCount;
    fileChanges.push({ file: path.relative('css', file), count: fileCount });
  }
});

console.log(`替换完成！共替换 ${totalReplaced} 处 font-family 硬编码\n`);
console.log('涉及文件:');
fileChanges.sort((a,b) => b.count - a.count).forEach(f => {
  console.log(`  ${f.count.toString().padStart(3)} 处  ${f.file}`);
});
