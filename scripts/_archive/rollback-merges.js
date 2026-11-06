/**
 * Rollback merge-prefix additions by truncating files at the first merge marker.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const files = [
  { file: 'css/components/index.css', rollbackToLine: 81 }, // line 82 is first merge, keep lines 0-81
  { file: 'css/sections/blog.css', rollbackToLine: 307 }, // line 308 is first merge
  { file: 'css/sections/markets.css', rollbackToLine: 1162 }, // line 1163 is first merge
  { file: 'css/pages/testing-quality.css', rollbackToLine: 33 },
  { file: 'css/pages/certifications.css', rollbackToLine: 67 },
  { file: 'css/sections/hero.css', rollbackToLine: 656 },
  { file: 'css/sections/cta.css', rollbackToLine: 610 },
  { file: 'css/sections/products.css', rollbackToLine: 733 },
  { file: 'css/pages/specification.css', rollbackToLine: 114 },
  { file: 'css/pages/home.css', rollbackToLine: 25 },
  { file: 'css/pages/resources.css', rollbackToLine: 381 },
  { file: 'css/pages/faq.css', rollbackToLine: 54 },
];

for (const { file, rollbackToLine } of files) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`${file}: NOT FOUND, skipping`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  const originalLines = lines.slice(0, rollbackToLine);
  // Remove trailing blank lines
  while (originalLines.length > 0 && originalLines[originalLines.length - 1].trim() === '') {
    originalLines.pop();
  }
  originalLines.push(''); // ensure trailing newline
  fs.writeFileSync(fullPath, originalLines.join('\n'));
  console.log(`${file}: truncated from ${lines.length} to ${originalLines.length} lines`);
}

console.log('\nRollback complete.');
