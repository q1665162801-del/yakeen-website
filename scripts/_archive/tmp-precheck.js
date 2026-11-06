const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const lines = fs.readFileSync(path.join(ROOT, 'css/components/modules.css'), 'utf8').replace(/^\uFEFF/, '').split('\n');
function topClasses(t) {
  const o = new Set();
  t = t.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /(^|\})\s*([^{}@\/][^{}]*?)\{/g; let x;
  while (x = re.exec(t)) {
    const s = x[2].trim(); if (s.startsWith('@')) continue;
    s.split(',').forEach(p => { const m = p.trim().match(/^\.[A-Za-z_][\w-]*/); if (m) o.add(m[0]); });
  }
  return o;
}
// [target, start, end, label]
const moves = [
  ['css/utilities.css', 1269, 1323, 'Misc utilities'],
  ['css/pages/testing-quality.css', 1184, 1223, 'Report/Case study'],
  ['css/sections/features.css', 1162, 1183, 'Diff side'],
  ['css/sections/about.css', 1142, 1161, 'Studio hero'],
  ['css/sections/form.css', 1117, 1141, 'Thank you card'],
  ['css/sections/form.css', 1089, 1116, 'Quote timeline'],
  ['css/pages/specification.css', 1032, 1088, 'Spec series'],
  ['css/pages/certifications.css', 706, 1031, 'CR series'],
  ['css/pages/certifications.css', 676, 705, 'IP ratings grid'],
  ['css/pages/home-ar.css', 603, 675, 'Collections grid'],
  ['css/sections/about.css', 523, 602, 'Philosophy grid'],
  ['css/pages/home-ar.css', 462, 522, 'Services grid'],
  ['css/sections/markets.css', 396, 461, 'WGCC card'],
  ['css/sections/hero.css', 308, 344, 'Page hero inner'],
  ['css/sections/hero.css', 284, 307, 'Page hero blog'],
  ['css/sections/hero.css', 176, 202, 'Alternative hero'],
];
for (const [tgt, a, b, label] of moves) {
  const block = lines.slice(a - 1, b).join('\n');
  const cls = [...topClasses(block)];
  const t = topClasses(fs.readFileSync(path.join(ROOT, tgt), 'utf8').replace(/^\uFEFF/, ''));
  const dup = cls.filter(c => t.has(c));
  console.log(`${label.padEnd(18)} -> ${tgt.padEnd(34)} cls=${String(cls.length).padStart(3)} dup=${dup.length}${dup.length ? '  [' + dup.join(', ') + ']' : ''}`);
}
