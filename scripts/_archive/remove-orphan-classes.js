/* ============================================================
   Remove orphan class attributes — classes used in HTML but
   with zero CSS definitions. Safe delete (visual zero change).
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES = path.join(ROOT, 'src', 'pages');

const ORPHAN_CLASSES = ['differ-note', 'article-cta-buttons', 'disclaimer-box'];

let totalFiles = 0;
let totalRemoved = 0;

function walk(dir) {
  const r = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...walk(full));
    else if (e.name.endsWith('.html')) r.push(full);
  }
  return r;
}

const files = walk(PAGES);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  const original = content;
  let fileChanged = false;

  for (const cls of ORPHAN_CLASSES) {
    // Pattern 1: standalone class attribute → remove entire attribute
    // class="foo"  or  class='foo'
    const reStandalone = new RegExp(
      `\\s+class\\s*=\\s*["']` + cls.replace(/-/g, '\\-') + `["']`,
      'g'
    );
    const before = content;
    content = content.replace(reStandalone, '');
    if (content !== before) fileChanged = true;
  }

  if (fileChanged) {
    fs.writeFileSync(file, content, 'utf-8');
    const relPath = file.replace(PAGES, '').replace(/\\/g, '/').replace(/^\//, '');
    const removed = ORPHAN_CLASSES.filter(c =>
      !new RegExp(`class=["']` + c.replace(/-/g, '\\-') + `["']`).test(original) === false &&
      !new RegExp(`class=["']` + c.replace(/-/g, '\\-') + `["']`).test(content)
    ).length;
    // Actually count properly
    let count = 0;
    for (const c of ORPHAN_CLASSES) {
      const re = new RegExp(`class=["']` + c.replace(/-/g, '\\-') + `["']`, 'g');
      const origMatches = (original.match(re) || []).length;
      const newMatches = (content.match(re) || []).length;
      count += origMatches - newMatches;
    }
    console.log(`  ${relPath} — ${count} class attr(s) removed`);
    totalFiles++;
    totalRemoved += count;
  }
}

console.log(`\nDone: ${totalRemoved} orphan class attributes removed from ${totalFiles} files.`);
