/**
 * Move a block from one file to another.
 * Usage: node scripts/move-block.js <srcFile> <startLine> <endLine> <destFile> [label]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const srcRel = process.argv[2];
const startLine = parseInt(process.argv[3], 10);
const endLine = parseInt(process.argv[4], 10);
const destRel = process.argv[5];
const label = process.argv[6] || 'moved block';

const srcFile = path.join(ROOT, srcRel);
const destFile = path.join(ROOT, destRel);

const srcContent = fs.readFileSync(srcFile, 'utf8');
const srcLines = srcContent.split('\n');

// Extract block
const blockLines = srcLines.slice(startLine - 1, endLine);
let block = blockLines.join('\n').replace(/^\n+/, '').replace(/\n+$/, '');
// Strip legacy "/* --- from <file> --- */" provenance markers (now redundant)
block = block.split('\n')
  .filter(l => !/^\/\* --- from .+ --- \*\/$/.test(l.trim()))
  .join('\n').replace(/^\n+/, '').replace(/\n+$/, '');

// Only add a header when the block does not already carry its own comment header
const needsHeader = !block.startsWith('/*');
const headerComment = `/* ============================================================
   ${label}
   ============================================================ */`;

// Append to dest
const destContent = fs.readFileSync(destFile, 'utf8');
const destLines = destContent.split('\n');
while (destLines.length > 0 && destLines[destLines.length - 1].trim() === '') {
  destLines.pop();
}
if (needsHeader) destLines.push('', '', headerComment, '');
destLines.push('', block, '');
fs.writeFileSync(destFile, destLines.join('\n'));

// Remove from src (local removal only — do not collapse newlines globally,
// so line numbers above the cut stay valid for subsequent bottom-up moves)
const remaining = srcLines.slice(0, startLine - 1).concat(srcLines.slice(endLine));
const result = remaining.join('\n');
fs.writeFileSync(srcFile, result);

console.log(`Moved lines ${startLine}-${endLine} from ${srcRel} to ${destRel}`);
console.log(`${srcRel}: ${srcLines.length} → ${remaining.length} lines`);
console.log(`${destRel}: now ${destLines.length} lines`);
