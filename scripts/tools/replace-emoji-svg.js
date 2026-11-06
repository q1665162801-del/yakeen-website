/* ============================================================
   Replace emoji in icon containers with SVG equivalents
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { icons } = require('./svg-icon-lib');

// Build a normalized lookup (strip FE0F variant selectors)
const iconLookup = {};
for (const [key, svg] of Object.entries(icons)) {
  const norm = key.replace(/\uFE0F/g, '');
  if (!iconLookup[norm]) iconLookup[norm] = svg;
}

const SRC = path.resolve(__dirname, '..', 'src', 'pages');

const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;

const files = [];
(function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fp);
    else if (entry.name.endsWith('.html')) files.push(fp);
  }
})(SRC);

let totalReplaced = 0;
let filesChanged = 0;
const missed = [];

for (const f of files) {
  let html = fs.readFileSync(f, 'utf8');
  let original = html;
  
  // Find all icon divs with emoji content
  const iconRegex = /(<div[^>]*class="[^"]*icon[^"]*"[^>]*>)([^<]*)(<\/div>)/g;
  html = html.replace(iconRegex, (match, open, content, close) => {
    const trimmed = content.trim();
    
    // Skip SVG already present
    if (trimmed.startsWith('<svg')) return match;
    // Skip empty
    if (!trimmed) return match;
    // Skip non-emoji text
    if (!emojiRegex.test(trimmed)) return match;
    // Skip single regional indicator letters
    if (/^[\u{1F1E6}-\u{1F1FF}]$/u.test(trimmed)) return match;
    
    // Extract the emoji (handle multi-char emoji sequences)
    const emojiChars = trimmed.match(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu) || [];
    const firstEmoji = emojiChars[0];
    
    // Try normalized lookup (strip FE0F from both sides)
    const normEmoji = firstEmoji.replace(/\uFE0F/g, '');
    const iconSvg = iconLookup[normEmoji];
    
    if (iconSvg) {
      const indent = content.match(/^\s*/)[0];
      totalReplaced++;
      return `${open}${indent}${iconSvg}${close}`;
    } else {
      missed.push({ file: path.relative(path.resolve(__dirname, '..'), f).replace(/\\/g, '/'), emoji: trimmed });
      return match;
    }
  });
  
  if (html !== original) {
    fs.writeFileSync(f, html);
    filesChanged++;
  }
}

console.log(`✅ Replaced ${totalReplaced} emoji icons with SVG`);
console.log(`   Files changed: ${filesChanged}`);

if (missed.length > 0) {
  console.log(`\n⚠️  ${missed.length} emoji(s) not found in icon library:`);
  const unique = [...new Set(missed.map(m => m.emoji))];
  for (const e of unique) {
    const count = missed.filter(m => m.emoji === e).length;
    const cp = [...e].map(c => c.codePointAt(0).toString(16).toUpperCase()).join(' ');
    console.log(`   ${e}  U+${cp}  ×${count}`);
  }
}
