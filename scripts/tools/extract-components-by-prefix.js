/**
 * Extract CSS blocks from sections/components.css by prefix.
 * Outputs each prefix group to a separate file for review & migration.
 *
 * Usage: node scripts/extract-components-by-prefix.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'css', 'sections', 'components.css');
const OUT_DIR = path.join(ROOT, '.components-split');

const content = fs.readFileSync(SRC, 'utf8');
const lines = content.split('\n');

// Parse all top-level blocks
const blocks = [];
let braceDepth = 0;
let currentBlock = null;
let currentLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/\{/g) || []).length;
  const closes = (line.match(/\}/g) || []).length;

  if (braceDepth === 0 && opens > 0 && line.trim().startsWith('.')) {
    currentBlock = {
      selector: line.trim().replace(/\s*\{.*$/, '').trim(),
      startLine: i,
      lines: [line],
      prefix: null,
    };
    const firstClass = line.match(/^\.([a-zA-Z][\w-]*)/);
    if (firstClass) {
      const name = firstClass[1];
      const hyphenIdx = name.indexOf('-');
      currentBlock.prefix = hyphenIdx > 0 ? name.substring(0, hyphenIdx) : name;
    }
    braceDepth += opens - closes;
    continue;
  }

  if (currentBlock) {
    currentBlock.lines.push(line);
  }
  braceDepth += opens - closes;

  if (braceDepth === 0 && currentBlock && closes > 0) {
    currentBlock.endLine = i;
    blocks.push(currentBlock);
    currentBlock = null;
  }
}

// Group by prefix
const byPrefix = {};
for (const b of blocks) {
  const p = b.prefix || '(none)';
  if (!byPrefix[p]) byPrefix[p] = [];
  byPrefix[p].push(b);
}

// Write each prefix group
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const sortedPrefixes = Object.keys(byPrefix).sort((a, b) => byPrefix[b].length - byPrefix[a].length);

for (const p of sortedPrefixes) {
  const blocksForPrefix = byPrefix[p];
  const outPath = path.join(OUT_DIR, `${p}.css`);
  const outLines = [];
  outLines.push(`/* ============================================================`);
  outLines.push(`   PREFIX: ${p}  (${blocksForPrefix.length} blocks)`);
  outLines.push(`   Source: css/sections/components.css`);
  outLines.push(`   ============================================================ */`);
  outLines.push('');
  for (const b of blocksForPrefix) {
    outLines.push(`/* L${b.startLine + 1}-${b.endLine + 1} */`);
    outLines.push(...b.lines);
    outLines.push('');
  }
  fs.writeFileSync(outPath, outLines.join('\n'));
}

// Summary
console.log(`Extracted ${blocks.length} blocks into ${Object.keys(byPrefix).length} prefix files`);
console.log(`Output: ${OUT_DIR}`);
console.log('');
for (const p of sortedPrefixes) {
  const totalLines = byPrefix[p].reduce((s, b) => s + b.lines.length, 0);
  console.log(`  ${p.padEnd(15)} ${String(byPrefix[p].length).padStart(3)} blocks  ${String(totalLines).padStart(5)} lines`);
}
