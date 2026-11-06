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

// 找出包含 page-hero 或 home-hero 的页面
const heroPages = [];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes('page-hero') && !content.includes('home-hero') && !content.includes('hero-global') && !content.includes('country-hero')) return;
  
  const relPath = path.relative('src', file);
  
  // 提取 hero section 范围内的内联 style
  // 粗略找：找到第一个 <section.*hero 和 下一个 </section> 之间的内容
  const heroSectionRe = /<section[^>]*hero[^>]*>([\s\S]*?)<\/section>/i;
  const match = content.match(heroSectionRe);
  
  if (!match) {
    heroPages.push({ file: relPath, inlineCount: 0, styles: [], note: 'hero section 未找到' });
    return;
  }
  
  const heroContent = match[1];
  const styleAttrs = heroContent.match(/style="[^"]*"/g) || [];
  
  // 过滤掉纯 background-image
  const realInlineStyles = styleAttrs.filter(s => {
    const styleContent = s.replace(/^style="/, '').replace(/"$/, '');
    const props = styleContent.split(';').filter(p => p.trim());
    // 如果只有 background-image，不算问题
    const nonBgProps = props.filter(p => !p.trim().startsWith('background-image'));
    return nonBgProps.length > 0;
  });
  
  // 收集具体的属性
  const styleDetails = [];
  realInlineStyles.forEach(attr => {
    const styleContent = attr.replace(/^style="/, '').replace(/"$/, '');
    const props = styleContent.split(';').filter(p => p.trim() && !p.trim().startsWith('background-image'));
    styleDetails.push(props.map(p => p.trim()).join('; '));
  });
  
  if (realInlineStyles.length > 0) {
    heroPages.push({
      file: relPath,
      inlineCount: realInlineStyles.length,
      styles: styleDetails
    });
  }
});

console.log('=== Hero 区域内联 style 审计（排除 background-image）===\n');

heroPages.sort((a,b) => b.inlineCount - a.inlineCount);

let total = 0;
heroPages.forEach(p => {
  total += p.inlineCount;
  console.log(`${p.inlineCount.toString().padStart(2)} 处  ${p.file}`);
  if (p.styles.length > 0 && p.inlineCount <= 5) {
    p.styles.slice(0, 3).forEach(s => console.log(`       → ${s}`));
    if (p.styles.length > 3) console.log(`       ... 还有 ${p.styles.length - 3} 个`);
  }
});

console.log(`\n总计: ${total} 处内联 style，分布在 ${heroPages.filter(p=>p.inlineCount>0).length} 个 hero 页面`);

// 统计重复模式
console.log('\n=== 重复出现的内联样式模式 ===\n');
const patternCounts = {};
heroPages.forEach(p => {
  p.styles.forEach(s => {
    patternCounts[s] = (patternCounts[s] || 0) + 1;
  });
});

Object.entries(patternCounts)
  .filter(([_, c]) => c >= 2)
  .sort((a,b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([pattern, count], i) => {
    console.log(`${(i+1).toString().padStart(2)}. [${count}次] ${pattern}`);
  });
