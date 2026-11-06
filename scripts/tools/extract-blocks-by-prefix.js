/**
 * Reliably extract top-level CSS blocks by class name prefix.
 * Handles nested braces, multi-line selectors, @media blocks, comma-separated selectors.
 *
 * Usage: node scripts/extract-blocks-by-prefix.js <prefix> [outputFile]
 * If outputFile not given, prints to stdout.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'css', 'components', 'misc.css');

const prefix = process.argv[2];
const outFile = process.argv[3];

if (!prefix) {
  console.error('Usage: node scripts/extract-blocks-by-prefix.js <prefix> [outputFile]');
  process.exit(1);
}

const content = fs.readFileSync(SRC, 'utf8');
const lines = content.split('\n');

/**
 * Parse top-level blocks from CSS.
 * A "top-level block" is either:
 *   - A ruleset: selector { ... }
 *   - An at-rule: @media (...) { ... } (kept as one unit)
 *
 * Returns array of { selector, startLine, endLine, text }
 */
function parseTopLevelBlocks(lines) {
  const blocks = [];
  let i = 0;
  let currentSelector = '';
  let selectorStart = -1;
  let inBlock = false;
  let braceDepth = 0;
  let blockStart = -1;
  let blockLines = [];

  while (i < lines.length) {
    const line = lines[i];

    if (!inBlock) {
      // Skip blank lines and comments between blocks
      if (line.trim() === '' || line.trim().startsWith('/*')) {
        i++;
        continue;
      }
      // Start of a new selector or at-rule
      selectorStart = i;
      currentSelector = line;
      // Check if this line has an opening brace
      const openCount = (line.match(/\{/g) || []).length;
      const closeCount = (line.match(/\}/g) || []).length;
      if (openCount > 0) {
        inBlock = true;
        braceDepth = openCount - closeCount;
        blockStart = i;
        blockLines = [line];
        if (braceDepth === 0) {
          // Single-line block
          blocks.push({
            selector: currentSelector.split('{')[0].trim(),
            startLine: selectorStart + 1,
            endLine: i + 1,
            text: lines.slice(selectorStart, i + 1).join('\n')
          });
          inBlock = false;
          currentSelector = '';
        }
      }
      i++;
    } else {
      // Inside a block
      blockLines.push(line);
      const openCount = (line.match(/\{/g) || []).length;
      const closeCount = (line.match(/\}/g) || []).length;
      braceDepth += openCount - closeCount;

      if (braceDepth <= 0) {
        // End of block
        blocks.push({
          selector: lines[selectorStart].split('{')[0].trim(),
          startLine: selectorStart + 1,
          endLine: i + 1,
          text: lines.slice(selectorStart, i + 1).join('\n')
        });
        inBlock = false;
        currentSelector = '';
        braceDepth = 0;
      }
      i++;
    }
  }

  return blocks;
}

const blocks = parseTopLevelBlocks(lines);

// Filter blocks whose primary selector starts with .prefix- or is .prefix
const prefixPattern = new RegExp(`^\\.${prefix}(?:-|$)`);

const matching = blocks.filter(b => {
  // Get first selector (before comma)
  const firstSel = b.selector.split(',')[0].trim();
  return prefixPattern.test(firstSel);
});

console.error(`Total top-level blocks: ${blocks.length}`);
console.error(`Blocks matching .${prefix}*: ${matching.length}`);

const output = matching.map(b => b.text).join('\n\n') + '\n';

if (outFile) {
  const outPath = path.join(ROOT, outFile);
  fs.writeFileSync(outPath, output);
  console.error(`Written to ${outFile}`);
} else {
  console.log(output);
}
