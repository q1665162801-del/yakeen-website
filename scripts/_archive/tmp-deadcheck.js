const fs = require('fs'), path = require('path');
function walk(d, ext) {
  let r = [];
  if (!fs.existsSync(d)) return r;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) r = r.concat(walk(p, ext));
    else if (e.name.endsWith(ext)) r.push(p);
  }
  return r;
}
const html = walk('dist', '.html').map(f => fs.readFileSync(f, 'utf8')).join('\n');
const js = walk('js', '.js').map(f => fs.readFileSync(f, 'utf8')).join('\n');
const m = fs.readFileSync('css/components/modules.css', 'utf8').replace(/^\uFEFF/, '').replace(/\/\*[\s\S]*?\*\//g, '');
const cls = [...new Set((m.match(/\.[a-zA-Z_][\w-]*/g) || []).map(s => s.slice(1)))];
const esc = c => c.replace(/-/g, '\\-');
const unused = cls.filter(c =>
  !new RegExp('class="[^"]*\\b' + esc(c) + '\\b').test(html) &&
  !new RegExp('\\b' + esc(c) + '\\b').test(js)
);
console.log('modules.css classes: ' + cls.length + '  unused-in-html/js: ' + unused.length);
unused.forEach(c => console.log('  .' + c));
