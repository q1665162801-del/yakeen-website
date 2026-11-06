const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const ROOT = path.resolve(__dirname, '..');

const files = [
  'css/components/misc.css',
  'css/components/index.css',
  'css/sections/blog.css',
  'css/sections/markets.css',
  'css/sections/hero.css',
  'css/sections/cta.css',
  'css/sections/products.css',
  'css/pages/testing-quality.css',
  'css/pages/certifications.css',
  'css/pages/specification.css',
  'css/pages/home.css',
  'css/pages/resources.css',
  'css/pages/faq.css',
];

let hasError = false;
for (const f of files) {
  const full = path.join(ROOT, f);
  if (!fs.existsSync(full)) {
    console.log(`⚠️  ${f}: NOT FOUND`);
    continue;
  }
  try {
    postcss.parse(fs.readFileSync(full, 'utf8'), { from: full });
    const lineCount = fs.readFileSync(full, 'utf8').split('\n').length;
    console.log(`✅ ${f} (${lineCount} lines)`);
  } catch (e) {
    hasError = true;
    console.log(`❌ ${f}: L${e.line} — ${e.message.split('\n')[0]}`);
  }
}

process.exit(hasError ? 1 : 0);
