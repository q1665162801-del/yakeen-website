// List unique emoji types in icon containers from dist/
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');
const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fp);
    else if (entry.name.endsWith('.html')) files.push(fp);
  }
})(DIST);

const emojiMap = {};
let total = 0;

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const iconRegex = /<div[^>]*class="[^"]*icon[^"]*"[^>]*>([^<]*)<\/div>/g;
  let m;
  while ((m = iconRegex.exec(html)) !== null) {
    const content = m[1].trim();
    if (!content || content.startsWith('<svg') || content.length >= 30) continue;
    if (!emojiRegex.test(content)) continue;
    // Skip regional indicator letters
    if (/^[\u{1F1E6}-\u{1F1FF}]$/u.test(content)) continue;
    
    const chars = content.match(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu) || [];
    for (const e of chars) {
      emojiMap[e] = (emojiMap[e] || 0) + 1;
      total++;
    }
  }
}

console.log(`Total: ${total} emoji icons, ${Object.keys(emojiMap).length} unique types`);
console.log('');
const sorted = Object.entries(emojiMap).sort((a, b) => b[1] - a[1]);
for (const [emoji, count] of sorted) {
  const codePoint = emoji.codePointAt(0).toString(16).toUpperCase();
  console.log(`  ${emoji}  U+${codePoint}  ×${count}`);
}
