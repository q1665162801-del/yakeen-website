/**
 * Find the line number where merge-prefix.js first added content.
 * (looks for "/* ============================================================" followed by a PREFIX comment)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const files = [
  'css/components/index.css',
  'css/sections/blog.css',
  'css/sections/markets.css',
  'css/pages/testing-quality.css',
  'css/pages/certifications.css',
  'css/sections/hero.css',
  'css/sections/cta.css',
  'css/sections/products.css',
  'css/pages/specification.css',
  'css/pages/home.css',
  'css/pages/resources.css',
  'css/pages/faq.css',
];

// The merge script adds blocks like:
// /* ============================================================
//    PREFIX-* components
//    ============================================================ */

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  if (!fs.existsSync(fullPath)) {
    console.log(`${f}: NOT FOUND`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  let firstMergeLine = -1;
  for (let i = 0; i < lines.length; i++) {
    // Match merge-prefix marker: "PREFIXNAME-* components" on comment line
    if (lines[i].match(/^\s+[A-Z0-9-]+\* components\s*$/) && i > 0 && lines[i-1].includes('======')) {
      firstMergeLine = i - 1;
      // Walk back to find the opening /* ===
      while (firstMergeLine > 0 && !lines[firstMergeLine].startsWith('/* ===')) {
        firstMergeLine--;
      }
      break;
    }
  }

  if (firstMergeLine >= 0) {
    console.log(`${f}: first merge at line ${firstMergeLine + 1} (total ${lines.length} lines, ${lines.length - firstMergeLine} lines added)`);
  } else {
    console.log(`${f}: clean (${lines.length} lines)`);
  }
}
