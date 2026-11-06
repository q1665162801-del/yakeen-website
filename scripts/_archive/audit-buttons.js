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

// Part 1: Find all button class definitions in CSS
const cssFiles = walk('css', '.css');
const btnClasses = {}; // className -> { count, files: Set }

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Find class selectors starting with btn- or containing -btn
  const re = /\.(btn-[a-z0-9_-]+)/gi;
  let match;
  while ((match = re.exec(clean)) !== null) {
    const cls = match[1];
    // Skip pseudo-classes like btn-primary:hover — just capture the base class
    const base = cls.split(':')[0];
    if (!btnClasses[base]) btnClasses[base] = { count: 0, files: new Set() };
    btnClasses[base].count++;
    btnClasses[base].files.add(path.relative('css', file));
  }
  
  // Also find classes that look like buttons: .submit-btn, .cta-btn, etc.
  const re2 = /\.([a-z0-9_-]*-btn[a-z0-9_-]*)/gi;
  while ((match = re2.exec(clean)) !== null) {
    const cls = match[1].split(':')[0];
    if (!btnClasses[cls]) btnClasses[cls] = { count: 0, files: new Set() };
    btnClasses[cls].count++;
    btnClasses[cls].files.add(path.relative('css', file));
  }
});

// Part 2: Find all button classes used in HTML
const htmlFiles = walk('src', '.html');
const htmlBtnUsage = {};

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find class="..." containing btn-
  const classRe = /class="([^"]*)"/g;
  let match;
  while ((match = classRe.exec(content)) !== null) {
    const classes = match[1].split(/\s+/);
    classes.forEach(cls => {
      if (cls.includes('btn')) {
        if (!htmlBtnUsage[cls]) htmlBtnUsage[cls] = new Set();
        htmlBtnUsage[cls].add(path.relative('src', file));
      }
    });
  }
});

console.log('=== CSS 中定义的按钮类 ===\n');
const sorted = Object.entries(btnClasses).sort((a, b) => b[1].count - a[1].count);
console.log(`共 ${sorted.length} 种按钮类名\n`);

sorted.forEach(([cls, data]) => {
  const files = [...data.files].slice(0, 3).join(', ');
  const more = data.files.size > 3 ? ` (+${data.files.size - 3})` : '';
  const htmlCount = htmlBtnUsage[cls] ? htmlBtnUsage[cls].size : 0;
  console.log(`  ${cls.padEnd(35)} ${String(data.count).padStart(3)} 处  HTML: ${String(htmlCount).padStart(2)} 页  [${files}${more}]`);
});

console.log(`\n\n=== HTML 中使用的按钮类（CSS 中未定义的）===\n`);
const orphanBtns = Object.entries(htmlBtnUsage).filter(([cls]) => !btnClasses[cls]);
if (orphanBtns.length === 0) {
  console.log('  全部都有 CSS 定义 ✓');
} else {
  orphanBtns.forEach(([cls, files]) => {
    console.log(`  ${cls.padEnd(30)} ${files.size} 页`);
  });
}

console.log(`\n\n=== 按钮变体统计 ===\n`);

// Categorize
const categories = {
  '主按钮/金色': [],
  '次按钮/边框': [],
  '文字按钮': [],
  '尺寸变体': [],
  '页面专用按钮': [],
  '其他': []
};

Object.keys(btnClasses).forEach(cls => {
  const lower = cls.toLowerCase();
  if (lower.includes('primary') || lower.includes('gold') || lower.includes('accent')) {
    categories['主按钮/金色'].push(cls);
  } else if (lower.includes('secondary') || lower.includes('outline') || lower.includes('border')) {
    categories['次按钮/边框'].push(cls);
  } else if (lower.includes('text') || lower.includes('link')) {
    categories['文字按钮'].push(cls);
  } else if (lower.includes('sm') || lower.includes('lg') || lower.includes('large') || lower.includes('small')) {
    categories['尺寸变体'].push(cls);
  } else if (lower.includes('hero') || lower.includes('cta') || lower.includes('submit') || lower.includes('form')) {
    categories['页面专用按钮'].push(cls);
  } else {
    categories['其他'].push(cls);
  }
});

Object.entries(categories).forEach(([cat, items]) => {
  console.log(`\n${cat} (${items.length}):`);
  items.forEach(i => console.log(`  - ${i}`));
});
