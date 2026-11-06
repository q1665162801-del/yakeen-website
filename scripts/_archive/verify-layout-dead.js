const fs = require('fs');
const path = require('path');

const deadCandidates = [
  'is-open', 'nav--scrolled', 'active', 'mobile-menu', 'mobile-close',
  'mobile-link', 'mobile-cta', 'menu-backdrop', 'is-visible',
  'footer-brand', 'w3', 'org'
];

// Search JS files
function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  const r = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...walk(full, ext));
    else if (e.name.endsWith(ext)) r.push(full);
  }
  return r;
}

const jsFiles = walk('js', '.js');
const allJs = jsFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');

// Search HTML too (for hidden elements)
const htmlFiles = walk('dist', '.html');
const allHtml = htmlFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');

console.log('layout.css dead class verification (JS + HTML):\n');
console.log('Class'.padEnd(18) + 'JS'.padEnd(6) + 'HTML'.padEnd(6) + 'Verdict');
console.log('-'.repeat(45));

const trulyDead = [];
for (const c of deadCandidates) {
  const jsRe = new RegExp('\\b' + c.replace(/-/g, '\\-') + '\\b');
  const htmlRe = new RegExp('class="[^"]*\\b' + c.replace(/-/g, '\\-') + '\\b');
  const inJs = jsRe.test(allJs);
  const inHtml = htmlRe.test(allHtml);
  let verdict = 'DEAD';
  if (inJs) verdict = 'JS-dynamic';
  else if (inHtml) verdict = 'HTML';
  else trulyDead.push(c);
  console.log(
    c.padEnd(18) +
    (inJs ? 'YES' : 'no').padEnd(6) +
    (inHtml ? 'YES' : 'no').padEnd(6) +
    verdict
  );
}

console.log('\nTruly dead (no JS, no HTML): ' + trulyDead.length);
console.log('  ' + trulyDead.join(', '));
