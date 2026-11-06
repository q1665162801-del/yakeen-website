const fs = require('fs');
const path = require('path');

const unusedTokens = [
  '--color-bg-primary', '--color-bg-tertiary', '--color-gold-deep',
  '--font-size-2xl', '--font-size-3xl', '--font-size-4xl', '--font-size-hero', '--font-size-xl',
  '--gold-gradient-soft',
  '--line-height-normal', '--line-height-tight',
  '--nav-height', '--noise-texture',
  '--radius-2xl', '--radius-xl',
  '--shadow-xl',
  '--space-1', '--space-10', '--space-2', '--space-20', '--space-24',
  '--space-3', '--space-4', '--space-6',
  '--tracking-normal', '--tracking-tight',
  '--transition-lux', '--z-sticky'
];

// Search JS files for setProperty, CSS variable references
const jsDir = path.join(__dirname, '..', 'js');
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const r = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...walk(full));
    else if (e.name.endsWith('.js')) r.push(full);
  }
  return r;
}
const jsFiles = walk(jsDir);
const allJs = jsFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');

console.log('Checking unused tokens against JS dynamic usage:\n');
const stillDead = [];
const jsUsed = [];

for (const v of unusedTokens) {
  const varName = v.replace(/^--/, '');
  // Check for setProperty('--varname') or .style.setProperty
  const setPropRe = new RegExp('setProperty\\s*\\(\\s*[\'"]' + varName.replace(/-/g, '\\-') + '[\'"]');
  // Check for direct string reference
  const strRe = new RegExp('[\'"]' + v.replace(/-/g, '\\-') + '[\'"]');
  if (setPropRe.test(allJs) || strRe.test(allJs)) {
    jsUsed.push(v);
  } else {
    stillDead.push(v);
  }
}

console.log('Used in JS: ' + jsUsed.length);
for (const v of jsUsed) console.log('  ' + v);
console.log('');
console.log('Confirmed dead: ' + stillDead.length);
for (const v of stillDead) console.log('  ' + v);

// Estimate size savings
const tokensContent = fs.readFileSync(path.join(__dirname, '..', 'css', 'tokens.css'), 'utf-8');
let savedChars = 0;
for (const v of stillDead) {
  const re = new RegExp(v + '\\s*:\\s*[^;]+;', 'g');
  const matches = tokensContent.match(re);
  if (matches) {
    for (const m of matches) savedChars += m.length + 1; // +1 for newline
  }
}
console.log('\nEstimated savings from tokens.css: ~' + savedChars + ' bytes (' + (savedChars/1024).toFixed(1) + ' KB)');
