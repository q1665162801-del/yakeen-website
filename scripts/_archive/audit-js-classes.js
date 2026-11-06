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

const jsFiles = walk('js', '.js');

// 从 JS 中提取可能的 class 操作
const jsClasses = new Set();

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // classList.add / remove / toggle / contains
  const classListRe = /\.classList\.(?:add|remove|toggle|contains)\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = classListRe.exec(content)) !== null) {
    jsClasses.add(match[1]);
  }
  
  // className = 'xxx' 或 className += ' xxx'
  const classNameRe = /\.className\s*[+\-]?=\s*['"`]([^'"`]+)['"`]/g;
  while ((match = classNameRe.exec(content)) !== null) {
    match[1].split(/\s+/).filter(s => s).forEach(c => jsClasses.add(c));
  }
  
  // setAttribute('class', 'xxx')
  const setAttrRe = /setAttribute\(\s*['"`]class['"`]\s*,\s*['"`]([^'"`]+)['"`]/g;
  while ((match = setAttrRe.exec(content)) !== null) {
    match[1].split(/\s+/).filter(s => s).forEach(c => jsClasses.add(c));
  }
  
  // jQuery 风格: .addClass('xxx') / .removeClass('xxx')
  const jqRe = /\.(?:addClass|removeClass|toggleClass)\(\s*['"`]([^'"`]+)['"`]/g;
  while ((match = jqRe.exec(content)) !== null) {
    match[1].split(/\s+/).filter(s => s).forEach(c => jsClasses.add(c));
  }
});

console.log('=== JS 动态操作的 class ===\n');
console.log(`共 ${jsClasses.size} 个 class 在 JS 中被操作\n`);
[...jsClasses].sort().forEach(c => console.log(`  .${c}`));
