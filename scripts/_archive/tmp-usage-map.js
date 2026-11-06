const fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
const CSS = path.join(__dirname, '..', 'css', 'components', 'modules.css');

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

const htmlFiles = walk(DIST, '.html');
const pageText = {};
for (const f of htmlFiles) {
  pageText[f.replace(DIST + path.sep, '').replace(/\\/g, '/')] = fs.readFileSync(f, 'utf8');
}
const jsText = walk(path.join(__dirname, '..', 'js'), '.js').map(f => fs.readFileSync(f, 'utf8')).join('\n');

const lines = fs.readFileSync(CSS, 'utf8').replace(/^\uFEFF/, '').split('\n');

// collect sub-block boundaries: "/* --- X --- */" and "/* ===.." titled sections
const marks = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i].trim();
  const m = l.match(/^\/\* --- (.+) --- \*\/$/);
  if (m) marks.push({ line: i + 1, name: m[1] });
  if (l.match(/^\/\*\s*=+\s*$/) && lines[i + 1] && lines[i + 1].trim() && !lines[i + 1].trim().startsWith('=') && lines[i + 1].trim().length < 80) {
    const t = lines[i + 1].trim();
    if (!t.endsWith('*/')) marks.push({ line: i + 1, name: 'SECTION: ' + t.replace(/^\s*\d+[\d.]*\s*/, '') });
  }
}

const classesOf = txt => {
  txt = txt.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...new Set((txt.match(/\.[a-zA-Z_][\w-]*/g) || []).map(s => s.slice(1)))];
};

for (let k = 0; k < marks.length; k++) {
  const a = marks[k].line;
  const b = k + 1 < marks.length ? marks[k + 1].line - 1 : lines.length;
  const block = lines.slice(a - 1, b).join('\n');
  const cls = classesOf(block);
  if (!cls.length) continue;
  const pages = new Set();
  for (const c of cls) {
    const re = new RegExp('class="[^"]*\\b' + c.replace(/-/g, '\\-') + '\\b');
    for (const [pg, t] of Object.entries(pageText)) if (re.test(t)) pages.add(pg);
    if (new RegExp('\\b' + c.replace(/-/g, '\\-') + '\\b').test(jsText)) pages.add('(js)');
  }
  const pl = [...pages];
  console.log('\n### ' + marks[k].name + '  [' + cls.length + ' cls]');
  console.log('   pages(' + pl.length + '): ' + (pl.length > 14 ? pl.slice(0, 14).join(', ') + ' …' : pl.join(', ')));
}
