const fs = require('fs'), path = require('path');
const CSS = path.join(__dirname, '..', 'css', 'components', 'modules.css');
const lines = fs.readFileSync(CSS, 'utf8').replace(/^\uFEFF/, '').split('\n');
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
const cls = t => [...new Set((t.replace(/\/\*[\s\S]*?\*\//g, '').match(/\.[a-zA-Z_][\w-]*/g) || []).map(s => s.slice(1)))];
for (let k = 0; k < marks.length; k++) {
  const a = marks[k].line;
  const b = k + 1 < marks.length ? marks[k + 1].line - 1 : lines.length;
  console.log('\n[' + a + '-' + b + '] ' + marks[k].name);
  console.log('   ' + cls(lines.slice(a - 1, b).join('\n')).join(', '));
}
