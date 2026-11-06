// Map page CSS files to their pageClass from corresponding HTML pages
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'src', 'pages');
const CSS_PAGES_DIR = path.join(ROOT, 'css', 'pages');

const pageCssFiles = fs.readdirSync(CSS_PAGES_DIR).filter(f => f.endsWith('.css'));

function findPageClass(cssName) {
  const baseName = cssName.replace('.css', '');
  
  // Search HTML files for matching pageClass
  const htmlFiles = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fp);
      else if (entry.name.endsWith('.html')) {
        // Match by filename similarity
        const htmlBase = entry.name.replace('.html', '').replace(/-ar$/, '');
        if (htmlBase === baseName || baseName.includes(htmlBase) || htmlBase.includes(baseName)) {
          htmlFiles.push(fp);
        }
      }
    }
  })(PAGES_DIR);
  
  const pageClasses = new Set();
  for (const f of htmlFiles) {
    const content = fs.readFileSync(f, 'utf8');
    const match = content.match(/pageClass:\s*["']([^"']+)["']/);
    if (match) pageClasses.add(match[1]);
  }
  
  return [...pageClasses];
}

console.log('Page CSS → pageClass mapping:');
for (const cssFile of pageCssFiles) {
  const classes = findPageClass(cssFile);
  console.log(`  ${cssFile}: ${classes.length > 0 ? classes.join(', ') : 'NOT FOUND'}`);
}
