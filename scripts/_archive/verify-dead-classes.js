const fs = require('fs');
const path = require('path');

const deadClasses = [
  'articles-grid', 'article-card', 'article-card-image', 'article-card-body',
  'article-card-category', 'article-card-footer', 'read-time',
  'journal-categories', 'journal-categories-inner', 'cat-pill',
  'topics-grid', 'topic-card', 'topic-icon',
  'featured-article', 'featured-grid', 'featured-visual',
  'featured-content', 'read-link', 'author', 'author-avatar'
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const r = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...walk(full));
    else if (e.name.endsWith('.html')) r.push(full);
  }
  return r;
}
const htmlFiles = walk('dist');
const allHtml = htmlFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');

console.log('Verifying dead classes — searching all ' + htmlFiles.length + ' HTML files:\n');
let reallyDead = [];
let actuallyUsed = [];
for (const c of deadClasses) {
  const re = new RegExp('class="[^"]*\\b' + c.replace(/-/g, '\\-') + '\\b');
  const found = re.test(allHtml);
  if (found) actuallyUsed.push(c);
  else reallyDead.push(c);
  console.log('  ' + (found ? 'USED  ' : 'DEAD  ') + c);
}
console.log('\nReally dead: ' + reallyDead.length + '/' + deadClasses.length);
if (actuallyUsed.length > 0) {
  console.log('Actually used (false positive): ' + actuallyUsed.join(', '));
}
