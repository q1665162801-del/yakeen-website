/**
 * Append prefixed CSS blocks from .components-split/ into target file
 * with a scope selector prepended to each top-level selector.
 *
 * Usage: node scripts/scoped-merge.js <scope> <targetFile> <prefix1> [prefix2 ...]
 * Example: node scripts/scoped-merge.js ".gcc-country-page" css/sections/markets.css boom luxury heritage
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SPLIT_DIR = path.join(ROOT, '.components-split');

const scope = process.argv[2];
const targetFile = path.join(ROOT, process.argv[3]);
const prefixes = process.argv.slice(4);

if (!scope || !targetFile || prefixes.length === 0) {
  console.error('Usage: node scripts/scoped-merge.js <scope> <targetFile> <prefix1> [prefix2 ...]');
  process.exit(1);
}

function addScopeToSelector(selector, scope) {
  // Split by comma (multiple selectors), add scope to each
  const parts = selector.split(',').map(s => s.trim()).filter(Boolean);
  return parts.map(s => `${scope} ${s}`).join(',\n');
}

let allOutput = '';

for (const prefix of prefixes) {
  const srcFile = path.join(SPLIT_DIR, `${prefix}.css`);
  if (!fs.existsSync(srcFile)) {
    console.warn(`Warning: ${prefix}.css not found, skipping`);
    continue;
  }

  const content = fs.readFileSync(srcFile, 'utf8');
  const lines = content.split('\n');

  // Parse blocks and add scope
  const outLines = [];
  let braceDepth = 0;
  let inBlock = false;
  let blockSelector = '';
  let blockLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip header comments and blank lines
    if (line.startsWith('/* =') || line.startsWith('   PREFIX:') ||
        line.startsWith('   Source:') || line.match(/^\/\*\s*L\d+-/)) {
      continue;
    }

    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;

    if (braceDepth === 0 && opens > 0 && line.trim().startsWith('.')) {
      inBlock = true;
      blockSelector = line.trim().replace(/\s*\{.*$/, '').trim();
      // Check if the { is on the same line
      const restMatch = line.match(/\{(.*)$/);
      const restAfterBrace = restMatch ? restMatch[1] : '';
      braceDepth += opens - closes;

      const scoped = addScopeToSelector(blockSelector, scope);
      outLines.push(`${scoped} {`);
      if (restAfterBrace && restAfterBrace.trim()) {
        outLines.push(`  ${restAfterBrace.trim()}`);
      }
      continue;
    }

    if (inBlock) {
      if (braceDepth - (opens - closes) === 0 && closes > 0 && braceDepth === 1) {
        // Last closing brace
        const beforeClose = line.replace(/\}.*/, '').trim();
        if (beforeClose) outLines.push(`  ${beforeClose}`);
        outLines.push('}');
        inBlock = false;
        braceDepth += opens - closes;
        continue;
      }
      // Indent nested content
      if (line.trim()) {
        outLines.push(`  ${line.trim()}`);
      } else {
        outLines.push('');
      }
    }
    braceDepth += opens - closes;
  }

  if (outLines.length > 0) {
    allOutput += `\n/* ============================================================\n`;
    allOutput += `   ${prefix.toUpperCase()}-* — Country page components\n`;
    allOutput += `   ============================================================ */\n\n`;
    allOutput += outLines.join('\n') + '\n';
  }
}

// Append to target file
fs.appendFileSync(targetFile, allOutput);
console.log(`Appended ${prefixes.length} prefix groups to ${process.argv[3]}`);
console.log(`Total added: ~${allOutput.split('\n').length} lines`);
