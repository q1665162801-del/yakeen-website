/**
 * Move a section block from components/misc.css to a target file.
 * Usage: node scripts/move-section.js <startLine> <endLine> <targetFile> [sectionLabel]
 * Lines are 1-based, inclusive.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_FILE = path.join(ROOT, 'css', 'components', 'misc.css');

const startLine = parseInt(process.argv[2], 10);
const endLine = parseInt(process.argv[3], 10);
const targetRel = process.argv[4];
const label = process.argv[5] || 'moved section';

if (!startLine || !endLine || !targetRel) {
  console.error('Usage: node scripts/move-section.js <startLine> <endLine> <targetFile> [label]');
  process.exit(1);
}

const srcContent = fs.readFileSync(SRC_FILE, 'utf8');
const srcLines = srcContent.split('\n');

// Extract block (1-based to 0-based, inclusive)
const blockLines = srcLines.slice(startLine - 1, endLine);
let block = blockLines.join('\n');

// Clean up: remove leading blank lines and trailing blank lines
block = block.replace(/^\n+/, '').replace(/\n+$/, '');

// Add section header label comment
const headerComment = `/* ============================================================\n   [MIGRATED] ${label}\n   ============================================================ */`;

// Append to target file
const targetFile = path.join(ROOT, targetRel);
const targetContent = fs.readFileSync(targetFile, 'utf8');
const targetLines = targetContent.split('\n');

// Remove trailing blank lines from target, then append
while (targetLines.length > 0 && targetLines[targetLines.length - 1].trim() === '') {
  targetLines.pop();
}
targetLines.push('', '', headerComment, '', block, '');
fs.writeFileSync(targetFile, targetLines.join('\n'));

// Remove from source file
const remainingLines = srcLines.slice(0, startLine - 1).concat(srcLines.slice(endLine));
// Clean up extra blank lines at the cut point
let result = remainingLines.join('\n');
result = result.replace(/\n{3,}/g, '\n\n'); // collapse 3+ newlines to 2
fs.writeFileSync(SRC_FILE, result);

console.log(`Moved lines ${startLine}-${endLine} (${blockLines.length} lines) from misc.css to ${targetRel}`);
console.log(`Label: ${label}`);
console.log(`misc.css now has ${remainingLines.length} lines`);
console.log(`${targetRel} now has ${targetLines.length} lines`);
