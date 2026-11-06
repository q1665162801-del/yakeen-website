const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'css');
const marketsPath = path.join(cssDir, 'sections', 'markets.css');

let content = fs.readFileSync(marketsPath, 'utf-8');

// Collect all selectors from other CSS files
const otherSelectors = new Set();

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.css') && full !== marketsPath) {
      const fileContent = fs.readFileSync(full, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
      const matches = fileContent.match(/[.#\[][^{]+\{/g) || [];
      for (const m of matches) {
        const sel = m.replace(/\s*\{$/, '').trim();
        otherSelectors.add(sel);
      }
    }
  }
}
walk(cssDir);

// Find all body#yakeen-page prefixed selectors in markets.css
// and check if the unprefixed version exists in other files
const prefixRegex = /body#yakeen-page\s+([^{]+)\s*\{/g;
let match;
let removed = 0;
let kept = 0;
const keptSelectors = [];

// We need to do replacement carefully — process each rule block
// Strategy: replace "body#yakeen-page .foo" with ".foo" ONLY if ".foo" not in other files
let result = content;
const blocks = content.match(/body#yakeen-page\s+[^{]+\s*\{[^}]*\}/g) || [];

for (const block of blocks) {
  const selectorMatch = block.match(/body#yakeen-page\s+([^{]+?)\s*\{/);
  if (!selectorMatch) continue;
  const selector = selectorMatch[1].trim();
  
  // Check if unprefixed selector exists in other files
  if (otherSelectors.has(selector)) {
    kept++;
    keptSelectors.push(selector);
  } else {
    // Safe to remove prefix
    const newBlock = block.replace(/^body#yakeen-page\s+/, '');
    result = result.replace(block, newBlock);
    removed++;
  }
}

fs.writeFileSync(marketsPath, result);

console.log('Removed body#yakeen-page prefix from ' + removed + ' selectors');
console.log('Kept prefix on ' + kept + ' selectors (overlap with other files):');
for (const s of keptSelectors) console.log('  - ' + s);
console.log('');
console.log('Savings: ~' + (removed * 18) + ' chars (body#yakeen-page + space)');
