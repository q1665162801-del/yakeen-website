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

console.log('=== 内联 style 分类审计 ===\n');

let totalStyleAttrs = 0;
let bgImageCount = 0;
let realInlineCount = 0;

const categories = {
  backgroundImage: 0,
  color: 0,
  textAlign: 0,
  margin: 0,
  padding: 0,
  fontSize: 0,
  widthHeight: 0,
  display: 0,
  flex: 0,
  other: 0
};

const problematicPages = [];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const styleAttrs = content.match(/style="[^"]*"/g);
  if (!styleAttrs) return;
  
  totalStyleAttrs += styleAttrs.length;
  
  let pageRealInline = 0;
  
  styleAttrs.forEach(attr => {
    const style = attr.replace(/^style="/, '').replace(/"$/, '');
    const props = style.split(';').filter(s => s.trim());
    
    props.forEach(prop => {
      const trimmed = prop.trim();
      if (!trimmed) return;
      
      const [name, ...valParts] = trimmed.split(':');
      const propName = name.trim().toLowerCase();
      const value = valParts.join(':').trim();
      
      if (propName === 'background-image') {
        categories.backgroundImage++;
        bgImageCount++;
      } else if (propName === 'color' || propName.includes('color') && propName !== 'background-color') {
        categories.color++;
        realInlineCount++;
        pageRealInline++;
      } else if (propName === 'text-align') {
        categories.textAlign++;
        realInlineCount++;
        pageRealInline++;
      } else if (propName.startsWith('margin')) {
        categories.margin++;
        realInlineCount++;
        pageRealInline++;
      } else if (propName.startsWith('padding')) {
        categories.padding++;
        realInlineCount++;
        pageRealInline++;
      } else if (propName.startsWith('font') || propName === 'line-height' || propName === 'letter-spacing') {
        categories.fontSize++;
        realInlineCount++;
        pageRealInline++;
      } else if (propName === 'width' || propName === 'height') {
        categories.widthHeight++;
        realInlineCount++;
        pageRealInline++;
      } else if (propName === 'display') {
        categories.display++;
        realInlineCount++;
        pageRealInline++;
      } else if (propName.startsWith('flex') || propName === 'gap' || propName === 'justify-content' || propName === 'align-items') {
        categories.flex++;
        realInlineCount++;
        pageRealInline++;
      } else if (propName === 'background-color' || propName === 'background' || propName === 'border' || propName === 'border-radius' || propName === 'opacity' || propName === 'position' || propName.startsWith('max-') || propName.startsWith('min-') || propName === 'z-index' || propName === 'box-shadow' || propName === 'text-shadow' || propName === 'text-transform' || propName === 'font-weight' || propName === 'overflow' || propName === 'cursor' || propName === 'white-space' || propName === 'text-decoration') {
        categories.other++;
        realInlineCount++;
        pageRealInline++;
      } else {
        categories.other++;
        realInlineCount++;
        pageRealInline++;
      }
    });
  });
  
  if (pageRealInline > 0) {
    problematicPages.push({
      file: path.relative('src', file),
      count: pageRealInline
    });
  }
});

console.log(`总计 style 属性: ${totalStyleAttrs} 个`);
console.log(`其中 background-image: ${bgImageCount} 个（合理，每张图不同）`);
console.log(`真正的内联样式问题: ${realInlineCount} 个属性\n`);

console.log('按属性类型分布:');
Object.entries(categories)
  .filter(([k]) => k !== 'backgroundImage')
  .sort((a,b) => b[1] - a[1])
  .forEach(([name, count]) => {
    console.log(`  ${name.padEnd(15)} ${count.toString().padStart(3)} 个`);
  });

console.log(`\n问题最严重的 15 个页面（排除 background-image）:`);
problematicPages.sort((a,b) => b.count - a.count).slice(0, 15).forEach(p => {
  console.log(`  ${p.count.toString().padStart(3)} 个  ${p.file}`);
});
