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

// 精确映射：{ 属性: { hex: 变量 } }
// 只在指定属性上替换，确保语义和值都匹配
const mappings = [
  // 背景色
  { props: ['background', 'background-color'], from: '#F5F3EE', to: 'var(--color-bg-canvas)' },
  { props: ['background', 'background-color'], from: '#fff', to: 'var(--color-bg-elevated)' },
  { props: ['background', 'background-color'], from: '#FFF', to: 'var(--color-bg-elevated)' },
  { props: ['background', 'background-color'], from: '#EFEBE3', to: 'var(--color-bg-surface)' },
  // 文本色
  { props: ['color'], from: '#1C1A17', to: 'var(--color-text-primary)' },
  { props: ['color'], from: '#1A1A1A', to: 'var(--color-text-primary)' },
  // 边框色（值和 text-primary 相同）
  { props: ['border', 'border-top', 'border-bottom', 'border-left', 'border-right', 'border-color'], from: '#1C1A17', to: 'var(--color-text-primary)' },
];

let totalReplaced = 0;
const fileChanges = [];
const replacedByMapping = {};

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  let fileCount = 0;
  
  // 找到所有 style 属性，逐个处理
  content = content.replace(/style="([^"]*)"/gi, (match, styleContent) => {
    let newStyle = styleContent;
    let styleCount = 0;
    
    mappings.forEach(({ props, from, to }) => {
      props.forEach(prop => {
        // 匹配属性: 值 的模式，值中包含 hex
        // 需要处理 border: 1px solid #xxx 这种复合属性
        const propRe = new RegExp(
          `(${prop}\\s*:\\s*[^;]*?)(${from.replace(/[#]/g, '#')})([^;]*?)`,
          'gi'
        );
        
        if (propRe.test(newStyle)) {
          // 数一下有多少个匹配
          const countMatches = newStyle.match(new RegExp(from, 'gi'));
          if (countMatches) {
            // 验证是在正确的属性内
            const tempRe = new RegExp(`${prop}\\s*:\\s*[^;]*?${from}`, 'gi');
            const propMatches = newStyle.match(tempRe);
            if (propMatches) {
              styleCount += propMatches.length;
              newStyle = newStyle.replace(tempRe, (m) => {
                const hexRe = new RegExp(from, 'gi');
                return m.replace(hexRe, to);
              });
              
              const key = `${prop}: ${from} → ${to}`;
              replacedByMapping[key] = (replacedByMapping[key] || 0) + propMatches.length;
            }
          }
        }
      });
    });
    
    if (styleCount > 0) {
      fileCount += styleCount;
      return `style="${newStyle}"`;
    }
    return match;
  });
  
  if (fileCount > 0) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplaced += fileCount;
    fileChanges.push({ file: path.relative('src', file), count: fileCount });
  }
});

console.log(`替换完成！共替换 ${totalReplaced} 处颜色硬编码\n`);
console.log('涉及文件:');
fileChanges.sort((a,b) => b.count - a.count).forEach(f => {
  console.log(`  ${f.count.toString().padStart(2)} 处  ${f.file}`);
});

console.log('\n替换明细:');
Object.entries(replacedByMapping)
  .sort((a,b) => b[1] - a[1])
  .forEach(([key, count]) => {
    console.log(`  ${count.toString().padStart(2)} 处  ${key}`);
  });
