const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  let result = [];
  files.forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '_archive') result = result.concat(walk(p));
    } else if (f.endsWith('.html')) {
      result.push(p);
    }
  });
  return result;
}

const files = walk('src');

const allAlts = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const imgRe = /<img[^>]*>/gi;
  let match;
  while ((match = imgRe.exec(content)) !== null) {
    const imgTag = match[0];
    const altMatch = imgTag.match(/alt\s*=\s*["']([^"']*)["']/i);
    const srcMatch = imgTag.match(/src\s*=\s*["']([^"']+)["']/i);
    const alt = altMatch ? altMatch[1] : '(NO ALT)';
    const src = srcMatch ? srcMatch[1] : '(no src)';
    const page = file.replace(/^src[\\/]/, '');
    allAlts.push({ page, alt, src, len: alt.length });
  }
});

// Sort by length (shortest first = most likely poor quality)
allAlts.sort((a, b) => a.len - b.len);

console.log(`Total images: ${allAlts.length}\n`);
console.log('=== Shortest alt texts (most likely poor quality) ===\n');
allAlts.slice(0, 30).forEach(img => {
  console.log(`  [${img.len} chars] alt="${img.alt}"`);
  console.log(`            src="${img.src.substring(0, 60)}"`);
  console.log(`            in: ${img.page}`);
  console.log();
});
