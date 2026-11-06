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

const htmlFiles = walk('src', '.html');

// 精确映射：hex 值必须和变量值完全一致
// 只替换 style 属性内的颜色
const mappings = [
  { from: '#C8961E', to: 'var(--color-gold-primary)', varName: '--color-gold-primary' },
  { from: '#D4AF37', to: 'var(--color-gold-light)', varName: '--color-gold-light' },
];

let totalReplaced = 0;
const fileChanges = [];

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  let fileCount = 0;
  
  mappings.forEach(({ from, to }) => {
    // 只替换 style="..." 内的颜色值
    // 匹配 style 属性中出现的 hex 颜色
    const styleRe = new RegExp(`(style="[^"]*)(${from.replace('#', '#')})([^"]*")`, 'gi');
    let match;
    // 先数一下有多少个
    const tempRe = new RegExp(`style="[^"]*${from}[^"]*"`, 'gi');
    const matches = content.match(tempRe);
    const count = matches ? matches.reduce((acc, m) => {
      const re = new RegExp(from, 'gi');
      const found = m.match(re);
      return acc + (found ? found.length : 0);
    }, 0) : 0;
    
    if (count > 0) {
      fileCount += count;
      // 逐个替换 style 属性内的 hex
      content = content.replace(/style="[^"]*"/gi, (styleAttr) => {
        const innerRe = new RegExp(from, 'gi');
        return styleAttr.replace(innerRe, to);
      });
    }
  });
  
  if (fileCount > 0) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplaced += fileCount;
    fileChanges.push({ file: path.relative('src', file), count: fileCount });
  }
});

console.log(`替换完成！共替换 ${totalReplaced} 处金色硬编码\n`);
console.log('涉及文件:');
fileChanges.sort((a,b) => b.count - a.count).forEach(f => {
  console.log(`  ${f.count.toString().padStart(2)} 处  ${f.file}`);
});

console.log('\n映射关系:');
mappings.forEach(m => {
  console.log(`  ${m.from} → ${m.to}`);
});

console.log('\n⚠️ 注意：只替换了和 tokens.css 变量值完全一致的金色');
console.log('   #C7A86C、#A08040 等无精确变量匹配的已保留不动');
