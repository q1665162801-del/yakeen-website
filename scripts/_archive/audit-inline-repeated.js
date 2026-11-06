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

// 统计每个完整 style 属性的出现次数（排除 background-image-only）
const styleCounts = {};
const stylePages = {};

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative('src', file);
  
  const styleAttrs = content.match(/style="[^"]*"/g);
  if (!styleAttrs) return;
  
  styleAttrs.forEach(attr => {
    const styleContent = attr.replace(/^style="/, '').replace(/"$/, '');
    const props = styleContent.split(';').filter(p => p.trim());
    
    // 跳过纯 background-image
    const nonBgProps = props.filter(p => !p.trim().startsWith('background-image'));
    if (nonBgProps.length === 0) return;
    
    // 规范化：排序后重新拼接
    const normalized = nonBgProps.map(p => p.trim()).sort().join('; ');
    
    styleCounts[normalized] = (styleCounts[normalized] || 0) + 1;
    if (!stylePages[normalized]) stylePages[normalized] = new Set();
    stylePages[normalized].add(relPath);
  });
});

console.log('=== 跨页重复内联样式 TOP 40（>=3页 或 >=5次）===\n');

const entries = Object.entries(styleCounts)
  .filter(([style, count]) => {
    const pages = stylePages[style].size;
    return pages >= 3 || count >= 5;
  })
  .map(([style, count]) => ({
    style,
    count,
    pages: stylePages[style].size,
    pageList: [...stylePages[style]]
  }))
  .sort((a,b) => b.count - a.count);

let totalSaving = 0;
entries.forEach((e, i) => {
  totalSaving += e.count;
  console.log(`${(i+1).toString().padStart(2)}. [${e.count}次 / ${e.pages}页] ${e.style}`);
  console.log(`    页面: ${e.pageList.slice(0, 4).join(', ')}${e.pageList.length > 4 ? '...' : ''}`);
});

console.log(`\n合计: ${entries.length} 种重复模式，${totalSaving} 处内联 style`);

// 按属性类型分组建议
console.log('\n=== 分类建议 ===\n');

const categories = {
  'text-align 类': { patterns: [], count: 0 },
  'display:flex 布局': { patterns: [], count: 0 },
  '间距(margin/padding)': { patterns: [], count: 0 },
  '字体大小': { patterns: [], count: 0 },
  '颜色': { patterns: [], count: 0 },
  '其他': { patterns: [], count: 0 },
};

entries.forEach(e => {
  let categorized = false;
  if (e.style.includes('text-align')) {
    categories['text-align 类'].patterns.push(e);
    categories['text-align 类'].count += e.count;
    categorized = true;
  }
  if (e.style.includes('display: flex') || e.style.includes('flex-wrap') || e.style.includes('gap:')) {
    categories['display:flex 布局'].patterns.push(e);
    categories['display:flex 布局'].count += e.count;
    categorized = true;
  }
  if (e.style.match(/margin|padding/) && !e.style.includes('display') && !e.style.includes('flex')) {
    categories['间距(margin/padding)'].patterns.push(e);
    categories['间距(margin/padding)'].count += e.count;
    categorized = true;
  }
  if (e.style.match(/font-size|font-family|font-weight|letter-spacing|line-height/) && !e.style.includes('display') && !e.style.includes('margin') && !e.style.includes('padding')) {
    categories['字体大小'].patterns.push(e);
    categories['字体大小'].count += e.count;
    categorized = true;
  }
  if (e.style.match(/color/) && !e.style.includes('display') && !e.style.includes('margin') && !e.style.includes('font') && !e.style.includes('padding')) {
    categories['颜色'].patterns.push(e);
    categories['颜色'].count += e.count;
    categorized = true;
  }
  if (!categorized) {
    categories['其他'].patterns.push(e);
    categories['其他'].count += e.count;
  }
});

Object.entries(categories)
  .sort((a,b) => b[1].count - a[1].count)
  .forEach(([name, data]) => {
    console.log(`  ${name.padEnd(18)} ${data.count.toString().padStart(3)} 处 / ${data.patterns.length} 种模式`);
  });
