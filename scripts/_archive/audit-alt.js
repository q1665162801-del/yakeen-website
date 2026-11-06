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

let totalImgs = 0;
let emptyAlt = 0;
let genericAlt = 0;
let goodAlt = 0;
const issues = [];

// Generic/bad alt patterns
const badPatterns = [
  /^image$/i,
  /^photo$/i,
  /^picture$/i,
  /^img[\d_-]*$/i,
  /^logo$/i,
  /^icon$/i,
  /^hero$/i,
  /^product$/i,
  /^banner$/i,
  /^default$/i,
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const imgRe = /<img[^>]*>/gi;
  let match;
  while ((match = imgRe.exec(content)) !== null) {
    totalImgs++;
    const imgTag = match[0];
    const altMatch = imgTag.match(/alt\s*=\s*["']([^"']*)["']/i);
    const srcMatch = imgTag.match(/src\s*=\s*["']([^"']+)["']/i);
    
    if (!altMatch) {
      // No alt attribute at all
      const page = file.replace(/^src[\\/]/, '');
      const src = srcMatch ? srcMatch[1].substring(0, 50) : '(no src)';
      issues.push({ page, type: 'missing', alt: '', src });
      emptyAlt++;
    } else {
      const alt = altMatch[1].trim();
      if (alt === '') {
        emptyAlt++;
      } else if (badPatterns.some(p => p.test(alt)) || alt.length < 5) {
        genericAlt++;
        const page = file.replace(/^src[\\/]/, '');
        const src = srcMatch ? srcMatch[1].substring(0, 50) : '(no src)';
        issues.push({ page, type: 'generic', alt, src });
      } else {
        goodAlt++;
      }
    }
  }
});

console.log('=== Image Alt Text Audit ===\n');
console.log(`Total <img> tags: ${totalImgs}`);
console.log(`Good alt text:    ${goodAlt} (${(goodAlt/totalImgs*100).toFixed(1)}%)`);
console.log(`Empty alt:        ${emptyAlt} (${(emptyAlt/totalImgs*100).toFixed(1)}%)`);
console.log(`Generic/poor:     ${genericAlt} (${(genericAlt/totalImgs*100).toFixed(1)}%)`);

console.log('\n=== Issues by page (top pages) ===\n');
const pageCounts = {};
issues.forEach(i => {
  if (!pageCounts[i.page]) pageCounts[i.page] = { missing: 0, generic: 0 };
  pageCounts[i.page][i.type]++;
});

const sortedPages = Object.entries(pageCounts)
  .sort((a, b) => (b[1].missing + b[1].generic) - (a[1].missing + a[1].generic))
  .slice(0, 15);

sortedPages.forEach(([page, counts]) => {
  console.log(`  ${page.padEnd(45)} missing:${counts.missing}  generic:${counts.generic}`);
});

console.log('\n=== Sample generic/poor alt examples ===\n');
issues.filter(i => i.type === 'generic').slice(0, 15).forEach(i => {
  console.log(`  [${i.page.substring(0, 30)}] alt="${i.alt}"  src="${i.src}"`);
});

console.log('\n=== Sample missing alt examples ===\n');
issues.filter(i => i.type === 'missing').slice(0, 10).forEach(i => {
  console.log(`  [${i.page.substring(0, 30)}] src="${i.src}"`);
});
