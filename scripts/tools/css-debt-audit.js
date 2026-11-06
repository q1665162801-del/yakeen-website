const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'css');
const distDir = path.join(__dirname, '..', 'dist');

// 1. Collect all CSS source files
const srcFiles = [];
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.css')) {
      const content = fs.readFileSync(full, 'utf-8');
      // Strip comments for selector counting
      const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
      // Rough selector count: lines ending with { that aren't inside media queries
      const selectorMatches = clean.match(/[.#\[a-zA-Z][^{]*\{/g) || [];
      srcFiles.push({
        file: full.replace(cssDir, '').replace(/\\/g, '/').replace(/^\//, ''),
        size: Buffer.byteLength(content, 'utf-8'),
        selectors: selectorMatches.length,
        content,
      });
    }
  }
}
walk(cssDir);

srcFiles.sort((a, b) => b.size - a.size);

const totalSize = srcFiles.reduce((s, f) => s + f.size, 0);

console.log('=== CSS Source File Audit ===\n');
console.log('Pct    Size      Sels   File');
console.log('---    ----      ----   ----');
for (const f of srcFiles) {
  const pct = (f.size / totalSize * 100).toFixed(1).padStart(4);
  const kb = (f.size / 1024).toFixed(1).padStart(6) + ' KB';
  const sel = String(f.selectors).padStart(5);
  console.log(pct + '%  ' + kb + '  ' + sel + '   ' + f.file);
}
console.log('\nTotal: ' + srcFiles.length + ' files, ' + (totalSize/1024).toFixed(1) + ' KB');

// 2. Per-file usage: how many selectors from each file are actually used?
//    Build a set of all class names used in the final HTML
const htmlFiles = [];
function walkHtml(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkHtml(full);
    else if (e.name.endsWith('.html')) htmlFiles.push(full);
  }
}
walkHtml(distDir);

const allHtml = htmlFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');

// Extract all class names from HTML
const classSet = new Set();
const classMatches = allHtml.match(/class="([^"]+)"/g) || [];
for (const m of classMatches) {
  const classes = m.replace(/class="([^"]+)"/, '$1').split(/\s+/);
  for (const c of classes) if (c) classSet.add(c);
}

console.log('\n=== Selector Usage by File ===\n');
console.log('File                              Used  Total  Used%  Dead%');
console.log('----                              ----  -----  -----  -----');

let totalUsed = 0, totalSel = 0;

for (const f of srcFiles.slice(0, 15)) { // top 15 files
  const clean = f.content.replace(/\/\*[\s\S]*?\*\//g, '');
  // Extract class selectors (.foo, .foo.bar, etc.)
  const classSelectors = clean.match(/\.[a-zA-Z_][\w-]*/g) || [];
  const uniqueClasses = [...new Set(classSelectors.map(c => c.slice(1)))];
  const used = uniqueClasses.filter(c => classSet.has(c)).length;
  const total = uniqueClasses.length;
  const usedPct = total > 0 ? (used / total * 100).toFixed(0) : '0';
  const deadPct = total > 0 ? ((total - used) / total * 100).toFixed(0) : '0';
  totalUsed += used;
  totalSel += total;
  console.log(
    f.file.padEnd(32) + '  ' +
    String(used).padStart(4) + '  ' +
    String(total).padStart(5) + '  ' +
    usedPct.padStart(4) + '%  ' +
    deadPct.padStart(4) + '%'
  );
}

console.log('\nNote: This is a rough class-name match. Element selectors, pseudo-classes,');
console.log('attribute selectors, and nested selectors are not fully counted.');
