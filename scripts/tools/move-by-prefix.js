/**
 * Move CSS rules by class name prefix from source file to target file.
 * Uses PostCSS for reliable parsing — no regex-based hacks.
 *
 * Usage:
 *   node scripts/move-by-prefix.js <sourceFile> <targetFile> <prefix1> [prefix2 ...]
 *
 * Example:
 *   node scripts/move-by-prefix.js css/components/misc.css css/pages/specification.css spec lab
 *
 * Rules are matched if their FIRST selector starts with .prefix- or is exactly .prefix.
 * At-rules (@media, @keyframes etc.) are moved if they contain matching rules.
 * Top-level comments before a moved rule are also moved (section headings).
 */
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const ROOT = path.resolve(__dirname, '..');

const srcRel = process.argv[2];
const dstRel = process.argv[3];
const prefixes = process.argv.slice(4);

if (!srcRel || !dstRel || prefixes.length === 0) {
  console.error('Usage: node scripts/move-by-prefix.js <sourceFile> <targetFile> <prefix1> [prefix2 ...]');
  process.exit(1);
}

const srcFile = path.join(ROOT, srcRel);
const dstFile = path.join(ROOT, dstRel);

const srcCss = fs.readFileSync(srcFile, 'utf8');
const dstCss = fs.readFileSync(dstFile, 'utf8');

const srcRoot = postcss.parse(srcCss, { from: srcFile });
const dstRoot = postcss.parse(dstCss, { from: dstFile });

// Build prefix patterns — match .prefix, .prefix-, .prefix:, .prefix::, .prefix[
const patterns = prefixes.map(p => new RegExp(`^\\.${p}(?:[-:.\\[ ]|$|::)`));

function matchesPrefix(selector) {
  const firstSel = selector.split(',')[0].trim();
  return patterns.some(p => p.test(firstSel));
}

// Collect nodes to move
const nodesToMove = [];
const nodesToRemove = [];

srcRoot.each((node, index) => {
  let shouldMove = false;

  if (node.type === 'rule') {
    shouldMove = matchesPrefix(node.selector);
  } else if (node.type === 'atrule') {
    // Check if this at-rule contains any matching rules
    let hasMatching = false;
    node.walkRules(rule => {
      if (matchesPrefix(rule.selector)) {
        hasMatching = true;
        return false; // stop walking
      }
    });
    shouldMove = hasMatching;
  } else if (node.type === 'comment') {
    // Don't move comments directly — they'll be handled via preceding comment logic
    return;
  }

  if (shouldMove) {
    // Also capture the preceding comment if it looks like a section heading
    const prev = srcRoot.nodes[index - 1];
    if (prev && prev.type === 'comment' && prev.text.includes('===')) {
      if (!nodesToMove.includes(prev)) {
        nodesToMove.push(prev);
        nodesToRemove.push(prev);
      }
    }
    nodesToMove.push(node);
    nodesToRemove.push(node);
  }
});

if (nodesToMove.length === 0) {
  console.log(`No rules found matching prefixes: ${prefixes.join(', ')}`);
  process.exit(0);
}

// Add a section header comment to the target
const headerComment = postcss.comment({
  text: ` ============================================================\n   [MIGRATED] ${prefixes.join('-* / ')}—* — from ${srcRel}\n   ============================================================ `
});
dstRoot.append(headerComment);
dstRoot.append(postcss.rule({ selector: '' }).remove()); // spacer — we'll handle formatting differently

// Move nodes
let movedCount = 0;
let movedAtRules = 0;
let movedComments = 0;

for (const node of nodesToMove) {
  // Clone the node
  const cloned = node.clone();
  dstRoot.append(cloned);

  // Remove from source
  node.remove();

  if (node.type === 'rule') movedCount++;
  else if (node.type === 'atrule') movedAtRules++;
  else if (node.type === 'comment') movedComments++;
}

// Clean up: remove consecutive blank comments, ensure proper formatting
// PostCSS stringify will handle basic formatting

// Write back
fs.writeFileSync(srcFile, srcRoot.toString());
fs.writeFileSync(dstFile, dstRoot.toString());

console.log(`Moved ${movedCount} rules, ${movedAtRules} at-rules, ${movedComments} comments`);
console.log(`  From: ${srcRel}`);
console.log(`  To:   ${dstRel}`);
console.log(`  Prefixes: ${prefixes.join(', ')}`);
