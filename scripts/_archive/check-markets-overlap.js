const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'css');

function getSelectors(file) {
  const content = fs.readFileSync(file, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
  const classes = new Set();
  // Extract top-level class selectors (not nested inside @media, etc.)
  const matches = content.match(/[.#\[][^{]+\{/g) || [];
  for (const m of matches) {
    const selector = m.replace(/\s*\{$/, '').trim();
    // Strip body#yakeen-page prefix for comparison
    const clean = selector.replace(/^body#yakeen-page\s+/, '');
    classes.add(clean);
  }
  return classes;
}

// Collect all selectors from non-markets files
const otherSelectors = new Set();
const otherFiles = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.css') && e.name !== 'markets.css') {
      otherFiles.push(full);
      const sels = getSelectors(full);
      for (const s of sels) otherSelectors.add(s);
    }
  }
}
walk(cssDir);

// Check markets.css selectors against the rest
const marketsSels = getSelectors(path.join(cssDir, 'sections', 'markets.css'));
let overlapping = 0;
let unique = 0;
const overlapExamples = [];

for (const sel of marketsSels) {
  if (otherSelectors.has(sel)) {
    overlapping++;
    if (overlapExamples.length < 10) overlapExamples.push(sel);
  } else {
    unique++;
  }
}

console.log('markets.css selector overlap analysis:');
console.log('  Total selectors: ' + marketsSels.size);
console.log('  Overlapping with other files: ' + overlapping);
console.log('  Unique to markets.css: ' + unique);
console.log('');
console.log('  Overlap examples:');
for (const e of overlapExamples) console.log('    - ' + e);
console.log('');
console.log('  Conclusion:');
if (overlapping === 0) {
  console.log('    No overlapping selectors — body#yakeen-page prefix is 100% redundant');
  console.log('    Can be safely removed (cascade order already ensures markets.css wins)');
} else {
  console.log('    ' + overlapping + ' selectors overlap — prefix provides specificity boost');
  console.log('    Removing prefix requires verification of cascade order');
}
