const fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
function walk(d) {
  let r = [];
  if (!fs.existsSync(d)) return r;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) r = r.concat(walk(p));
    else if (e.name.endsWith('.html')) r.push(p);
  }
  return r;
}
const pages = walk(DIST).map(f => ({ f: f.replace(DIST + path.sep, '').replace(/\\/g, '/'), t: fs.readFileSync(f, 'utf8') }));
const js = walk(path.join(__dirname, '..', 'js')).length ? require('child_process') : null;
const list = process.argv.slice(2);
for (const c of list) {
  const re = new RegExp('class="[^"]*\\b' + c.replace(/-/g, '\\-') + '\\b');
  const hits = pages.filter(p => re.test(p.t)).map(p => p.f);
  console.log(c.padEnd(24) + ' ' + hits.length + '  ' + (hits.length > 10 ? hits.slice(0, 10).join(', ') + ' …' : hits.join(', ')));
}
