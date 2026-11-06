/* Exact class-token usage: parse class="..." attributes and count real tokens. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const TARGETS = process.argv.slice(2);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const counts = {};
for (const t of TARGETS) counts[t] = [];
for (const file of walk(SRC)) {
  const html = fs.readFileSync(file, 'utf-8');
  const tokens = new Set();
  const re = /class\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    for (const tok of m[1].split(/\s+/)) if (tok) tokens.add(tok);
  }
  for (const t of TARGETS) {
    if (tokens.has(t)) counts[t].push(path.relative(SRC, file).replace(/\\/g, '/'));
  }
}

for (const t of TARGETS) {
  console.log(`### ${t}  -> ${counts[t].length} files`);
  for (const f of counts[t].slice(0, 8)) console.log('   ' + f);
  if (counts[t].length > 8) console.log(`   ... (+${counts[t].length - 8} more)`);
}
