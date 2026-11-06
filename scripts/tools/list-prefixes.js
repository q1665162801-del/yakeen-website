/**
 * List all unique class name prefixes in a CSS file (top-level rules only).
 * Prefix = first segment before the first dash (or whole name if no dash).
 */
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const ROOT = path.resolve(__dirname, '..');
const file = process.argv[2] || 'css/components/misc.css';

const css = fs.readFileSync(path.join(ROOT, file), 'utf8');
const root = postcss.parse(css, { from: file });

const prefixCounts = {};
const prefixRules = {};

root.walkRules(rule => {
  // Skip rules inside @keyframes etc.
  let parent = rule.parent;
  while (parent && parent.type !== 'root') {
    if (parent.type === 'atrule' && parent.name === 'keyframes') return;
    parent = parent.parent;
  }

  const firstSel = rule.selector.split(',')[0].trim();
  const match = firstSel.match(/^\.([a-zA-Z][\w]*)/);
  if (!match) return;

  const className = match[1];
  // Get prefix: first segment before dash
  const dashIdx = className.indexOf('-');
  const prefix = dashIdx > 0 ? className.substring(0, dashIdx) : className;

  if (!prefixCounts[prefix]) prefixCounts[prefix] = 0;
  prefixCounts[prefix]++;
  if (!prefixRules[prefix]) prefixRules[prefix] = [];
  if (!prefixRules[prefix].includes(className)) {
    prefixRules[prefix].push(className);
  }
});

// Sort by count descending
const sorted = Object.entries(prefixCounts).sort((a, b) => b[1] - a[1]);

console.log(`\nPrefix distribution in ${file} (${sorted.length} prefixes):\n`);
for (const [prefix, count] of sorted) {
  const examples = prefixRules[prefix].slice(0, 3).join(', ');
  console.log(`  ${prefix.padEnd(18)} ${count.toString().padStart(3)} rules  (e.g. ${examples})`);
}
console.log(`\nTotal rules: ${sorted.reduce((s, [, c]) => s + c, 0)}`);
