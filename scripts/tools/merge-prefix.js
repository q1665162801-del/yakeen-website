/**
 * Append CSS blocks from .components-split/<prefix>.css into target file.
 * Strips extraction metadata comments, keeps original formatting.
 *
 * Usage: node scripts/merge-prefix.js <targetFile> <prefix1> [prefix2 ...]
 * Example: node scripts/merge-prefix.js css/sections/markets.css boom luxury heritage
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SPLIT_DIR = path.join(ROOT, '.components-split');

const targetFile = path.join(ROOT, process.argv[2]);
const prefixes = process.argv.slice(3);

if (!targetFile || prefixes.length === 0) {
  console.error('Usage: node scripts/merge-prefix.js <targetFile> <prefix1> [prefix2 ...]');
  process.exit(1);
}

let totalBlocks = 0;
let totalLines = 0;
let allOutput = '\n';

for (const prefix of prefixes) {
  const srcFile = path.join(SPLIT_DIR, `${prefix}.css`);
  if (!fs.existsSync(srcFile)) {
    console.warn(`Warning: ${prefix}.css not found, skipping`);
    continue;
  }

  const content = fs.readFileSync(srcFile, 'utf8');
  const lines = content.split('\n');

  // Collect actual CSS blocks (skip header comments and Lxx-yy markers)
  const outLines = [];
  let blockCount = 0;
  let braceDepth = 0;
  let currentBlock = [];
  let inBlock = false;

  for (const line of lines) {
    // Skip extraction metadata
    if (line.startsWith('/* =') || line.startsWith('   PREFIX:') ||
        line.startsWith('   Source:') || line.match(/^\/\*\s*L\d+-/)) {
      continue;
    }

    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;

    if (braceDepth === 0 && opens > 0 && line.trim().startsWith('.')) {
      inBlock = true;
      currentBlock = [line];
      braceDepth += opens - closes;
      continue;
    }

    if (inBlock) {
      currentBlock.push(line);
      braceDepth += opens - closes;
      if (braceDepth === 0 && closes > 0) {
        outLines.push(...currentBlock);
        outLines.push('');
        blockCount++;
        inBlock = false;
        currentBlock = [];
      }
    }
  }

  if (blockCount > 0) {
    allOutput += `/* ============================================================\n`;
    allOutput += `   ${prefix.toUpperCase()}-* components\n`;
    allOutput += `   ============================================================ */\n\n`;
    allOutput += outLines.join('\n');
    totalBlocks += blockCount;
    totalLines += outLines.length;
  }
}

fs.appendFileSync(targetFile, allOutput);
console.log(`Merged ${prefixes.length} prefix groups (${totalBlocks} blocks, ~${totalLines} lines) into ${process.argv[2]}`);
