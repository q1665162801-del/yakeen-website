const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function findHTML(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results = results.concat(findHTML(full));
    else if (e.name.endsWith('.html')) results.push(full);
  }
  return results;
}

const htmlFiles = findHTML(path.join(ROOT, 'src'));

const classes = [
  'arrow', 'available', 'brand-col', 'center', 'coming', 'compact-section',
  'deep-dive-content', 'deliverables-grid', 'documents-grid', 'has-photo',
  'home-hero-title', 'home-cta-right', 'icon', 'large', 'medium', 'primary',
  'request', 'resources-grid', 'scroll-line', 'selector-outro', 'small',
  'testimonial-section', 'unit', 'value', 'vs', 'yakeen'
];

console.log('=== Standalone class usage verification ===\n');
for (const cls of classes) {
  let count = 0;
  const pages = new Set();
  for (const f of htmlFiles) {
    const content = fs.readFileSync(f, 'utf8');
    // Match as a standalone class name in class attribute
    // class="icon foo" or class="foo icon" or class="icon"
    const re = new RegExp('class="([^"]* )?' + cls.replace(/-/g, '\\-') + '( [^"]*)?"', 'g');
    const matches = content.match(re);
    if (matches) {
      count += matches.length;
      const rel = path.relative(path.join(ROOT, 'src', 'pages'), f).replace(/\\/g, '/');
      pages.add(rel);
    }
  }
  const pageList = [...pages].sort().slice(0, 3).join(', ');
  const more = pages.size > 3 ? ` +${pages.size - 3}` : '';
  console.log(`${cls.padEnd(22)} ${String(count).padStart(3)} uses in ${String(pages.size).padStart(2)} pages  ${pageList}${more}`);
}
