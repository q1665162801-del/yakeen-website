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

// 收集所有 HTML 中出现的 class
const allClasses = new Set();
const allIds = new Set();

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // 提取 class="..." 里的类名
  const classMatches = content.match(/class="[^"]*"/g);
  if (classMatches) {
    classMatches.forEach(attr => {
      const classes = attr.replace(/^class="/, '').replace(/"$/, '').split(/\s+/).filter(s => s);
      classes.forEach(c => allClasses.add(c));
    });
  }
  // 提取 id="..."
  const idMatches = content.match(/id="[^"]*"/g);
  if (idMatches) {
    idMatches.forEach(attr => {
      const ids = attr.replace(/^id="/, '').replace(/"$/, '').split(/\s+/).filter(s => s);
      ids.forEach(i => allIds.add(i));
    });
  }
});

// 收集 CSS 中的类选择器和 ID 选择器
const cssSelectors = []; // { selector, file, line, type }

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // 去掉注释
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  const lines = clean.split('\n');
  
  lines.forEach((line, idx) => {
    // 匹配 CSS 选择器行（粗略：包含 { 的行）
    if (!line.includes('{')) return;
    
    const selectorPart = line.split('{')[0].trim();
    if (!selectorPart) return;
    
    // 分割多个选择器
    const selectors = selectorPart.split(',').map(s => s.trim()).filter(s => s);
    
    selectors.forEach(sel => {
      // 提取类选择器（.xxx）
      const classMatches = sel.match(/\.([a-zA-Z][\w-]*)/g);
      if (classMatches) {
        classMatches.forEach(cls => {
          const className = cls.substring(1);
          cssSelectors.push({
            selector: sel,
            className: className,
            file: path.relative('css', file),
            line: idx + 1,
            type: 'class'
          });
        });
      }
      
      // 提取 ID 选择器（#xxx）
      const idMatches = sel.match(/#([a-zA-Z][\w-]*)/g);
      if (idMatches) {
        idMatches.forEach(id => {
          const idName = id.substring(1);
          cssSelectors.push({
            selector: sel,
            idName: idName,
            file: path.relative('css', file),
            line: idx + 1,
            type: 'id'
          });
        });
      }
    });
  });
});

// 找出未使用的类
const unusedClasses = {};
const usedClasses = {};

cssSelectors.filter(s => s.type === 'class').forEach(s => {
  if (!allClasses.has(s.className)) {
    if (!unusedClasses[s.className]) {
      unusedClasses[s.className] = [];
    }
    unusedClasses[s.className].push(`${s.file}:${s.line}`);
  } else {
    usedClasses[s.className] = (usedClasses[s.className] || 0) + 1;
  }
});

// 找出未使用的 ID
const unusedIds = {};
cssSelectors.filter(s => s.type === 'id').forEach(s => {
  if (!allIds.has(s.idName)) {
    if (!unusedIds[s.idName]) {
      unusedIds[s.idName] = [];
    }
    unusedIds[s.idName].push(`${s.file}:${s.line}`);
  }
});

console.log('=== CSS 死代码审计 ===\n');
console.log(`HTML 页面数: ${htmlFiles.length}`);
console.log(`HTML 中出现的 class 数: ${allClasses.size}`);
console.log(`HTML 中出现的 id 数: ${allIds.size}`);
console.log(`CSS 类选择器出现次数: ${cssSelectors.filter(s => s.type === 'class').length}`);
console.log(`CSS ID 选择器出现次数: ${cssSelectors.filter(s => s.type === 'id').length}\n`);

console.log(`未使用的 CSS 类: ${Object.keys(unusedClasses).length} 个`);
console.log(`未使用的 CSS ID: ${Object.keys(unusedIds).length} 个\n`);

// 按文件分组未使用的类
const byFile = {};
Object.entries(unusedClasses).forEach(([cls, locations]) => {
  locations.forEach(loc => {
    const file = loc.split(':')[0];
    if (!byFile[file]) byFile[file] = [];
    byFile[file].push(cls);
  });
});

console.log('按文件分布（未使用类最多的 15 个文件）:');
Object.entries(byFile)
  .map(([f, classes]) => ({ file: f, count: [...new Set(classes)].length }))
  .sort((a,b) => b.count - a.count)
  .slice(0, 15)
  .forEach(f => {
    console.log(`  ${f.count.toString().padStart(3)} 个  ${f.file}`);
  });

console.log('\n未使用的类列表（出现 >=3 处 CSS 定义的）:');
const unusedWithCounts = Object.entries(unusedClasses)
  .map(([cls, locs]) => ({ class: cls, locations: locs, count: locs.length }))
  .sort((a,b) => b.count - a.count);

unusedWithCounts.filter(x => x.count >= 3).slice(0, 30).forEach((x, i) => {
  console.log(`${(i+1).toString().padStart(2)}. .${x.class} — ${x.count} 处定义 (${x.locations.slice(0,3).join(', ')}${x.locations.length > 3 ? '...' : ''})`);
});
