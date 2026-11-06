const fs = require('fs');
const path = require('path');

const classes = ['advantage-grid', 'adv-card-link', 'metric-value', 'mistake-item', 'mistake-num', 'process-step', 'process-steps', 'resource-link', 'resource-type', 'sector-card'];

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

console.log('modules-legacy.css class usage:\n');
let usedCount = 0;
for (const c of classes) {
  const regex = new RegExp('class="[^"]*\\b' + c.replace(/-/g, '\\-') + '\\b', 'g');
  const matches = allHtml.match(regex);
  const count = matches ? matches.length : 0;
  if (count > 0) usedCount++;
  const status = count > 0 ? 'USED' : 'UNUSED';
  console.log('  ' + status.padEnd(6) + ' ' + String(count).padStart(3) + 'x  ' + c);
}
console.log('\n' + usedCount + '/' + classes.length + ' classes are used');
