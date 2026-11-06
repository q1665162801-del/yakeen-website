const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'css', 'sections', 'components.css');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find all top-level selectors and their line ranges
const blocks = []; // { selector, startLine, endLine, prefix }
let braceDepth = 0;
let currentBlock = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/\{/g) || []).length;
  const closes = (line.match(/\}/g) || []).length;

  if (braceDepth === 0 && opens > 0 && line.trim().startsWith('.')) {
    const selector = line.trim().replace(/\s*\{.*$/, '').trim();
    currentBlock = {
      selector,
      startLine: i + 1, // 1-based
      endLine: null,
      prefix: null,
    };
    // extract prefix (first segment before first hyphen, or whole name if no hyphen)
    const className = selector.split(/[.\s,>]/).filter(s => s.startsWith(''))[0] || selector;
    const firstClass = selector.match(/^\.([a-zA-Z][\w-]*)/);
    if (firstClass) {
      const name = firstClass[1];
      const hyphenIdx = name.indexOf('-');
      currentBlock.prefix = hyphenIdx > 0 ? name.substring(0, hyphenIdx) : name;
    }
  }

  braceDepth += opens - closes;

  if (braceDepth === 0 && currentBlock && closes > 0) {
    currentBlock.endLine = i + 1;
    blocks.push(currentBlock);
    currentBlock = null;
  }
}

console.log(`Total top-level blocks: ${blocks.length}`);
console.log(`Total lines: ${lines.length}`);
console.log('');

// Group by prefix
const byPrefix = {};
for (const b of blocks) {
  const p = b.prefix || '(none)';
  if (!byPrefix[p]) byPrefix[p] = [];
  byPrefix[p].push(b);
}

console.log('=== Prefix distribution (sorted by block count) ===');
const sortedPrefixes = Object.keys(byPrefix).sort((a, b) => byPrefix[b].length - byPrefix[a].length);
for (const p of sortedPrefixes) {
  const blocksForPrefix = byPrefix[p];
  const totalLines = blocksForPrefix.reduce((sum, b) => sum + (b.endLine - b.startLine + 1), 0);
  console.log(`  ${p.padEnd(15)} ${String(blocksForPrefix.length).padStart(3)} blocks  ${String(totalLines).padStart(5)} lines`);
}

console.log('');
console.log('=== Full block list by prefix ===');
for (const p of sortedPrefixes) {
  console.log(`\n--- ${p} (${byPrefix[p].length} blocks) ---`);
  for (const b of byPrefix[p]) {
    console.log(`  L${b.startLine}-${b.endLine}  ${b.selector}`);
  }
}
