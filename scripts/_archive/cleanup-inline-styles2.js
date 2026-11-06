/**
 * Batch clean remaining inline styles:
 * 1. Product pages: tested-section inline styles → add .product-tested-section class
 * 2. Market pages: related-articles inline styles → extract to markets.css
 */
const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.resolve(__dirname, '..', 'src', 'pages');

function walkDir(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.name.endsWith('.html')) {
      callback(fullPath, entry.name);
    }
  }
}

let testedRemoved = 0;
let raRemoved = 0;
let filesChanged = 0;

walkDir(PAGES_DIR, (filePath, fileName) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // === 1. Tested-section inline styles (product pages) ===
  const testedStyleRegex = /\n?\s*<style>\s*\.tested-section[\s\S]*?<\/style>\s*\n?/;
  if (testedStyleRegex.test(content)) {
    // Add product-tested-section modifier class
    content = content.replace(
      /class="tested-section"/g,
      'class="tested-section product-tested-section"'
    );
    // Remove inline style
    content = content.replace(testedStyleRegex, '\n\n  ');
    testedRemoved++;
    changed = true;
    console.log(`  [tested] ${fileName}`);
  }

  // === 2. Related-articles inline styles (market pages) ===
  const raStyleRegex = /\n?\s*<style>\s*\.related-articles[\s\S]*?<\/style>\s*\n?/;
  if (raStyleRegex.test(content)) {
    // Add market-ra-section modifier class
    content = content.replace(
      /class="related-articles"/g,
      'class="related-articles market-ra-section"'
    );
    // Remove inline style
    content = content.replace(raStyleRegex, '\n\n  ');
    raRemoved++;
    changed = true;
    console.log(`  [ra]     ${fileName}`);
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesChanged++;
  }
});

console.log(`\n=== Summary ===`);
console.log(`Tested-section styles removed: ${testedRemoved}`);
console.log(`Related-articles styles removed: ${raRemoved}`);
console.log(`Files modified: ${filesChanged}`);
