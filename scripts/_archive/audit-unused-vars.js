const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'css');

// Walk all CSS files
function walk(dir) {
  const r = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...walk(full));
    else if (e.name.endsWith('.css')) r.push(full);
  }
  return r;
}
const cssFiles = walk(cssDir);

// Collect all CSS variable definitions (--foo: value)
const definedVars = new Map(); // varName -> file
const usedVars = new Set();

for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const relPath = file.replace(cssDir, '').replace(/\\/g, '/').replace(/^\//, '');

  // Find variable definitions: --variable-name:
  const defMatches = content.match(/--[\w-]+\s*:/g) || [];
  for (const m of defMatches) {
    const varName = m.replace(/\s*:/, '');
    if (!definedVars.has(varName)) {
      definedVars.set(varName, relPath);
    }
  }

  // Find variable usages: var(--foo
  const useMatches = content.match(/var\(--[\w-]+/g) || [];
  for (const m of useMatches) {
    const varName = m.replace(/^var\(/, '');
    usedVars.add(varName);
  }
}

// Also check HTML for inline style variables
const distDir = path.join(__dirname, '..', 'dist');
function walkHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  const r = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...walkHtml(full));
    else if (e.name.endsWith('.html')) r.push(full);
  }
  return r;
}
const htmlFiles = walkHtml(distDir);
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const styleMatches = content.match(/style="[^"]*--[\w-]+\s*:/g) || [];
  for (const m of styleMatches) {
    const varMatches = m.match(/--[\w-]+/g) || [];
    for (const v of varMatches) usedVars.add(v);
  }
}

// Find unused variables
const unused = [];
for (const [name, file] of definedVars) {
  if (!usedVars.has(name)) {
    unused.push({ name, file });
  }
}

console.log('CSS Variable Usage Audit:');
console.log('  Total variables defined: ' + definedVars.size);
console.log('  Variables used in CSS/HTML: ' + usedVars.size);
console.log('  Unused variables: ' + unused.length + ' (' + (unused.length/definedVars.size*100).toFixed(0) + '%)');

if (unused.length > 0) {
  console.log('\nUnused variables by file:');
  const byFile = new Map();
  for (const u of unused) {
    if (!byFile.has(u.file)) byFile.set(u.file, []);
    byFile.get(u.file).push(u.name);
  }
  for (const [file, vars] of byFile) {
    console.log('\n  ' + file + ' (' + vars.length + '):');
    for (const v of vars.sort()) {
      console.log('    ' + v);
    }
  }
}
