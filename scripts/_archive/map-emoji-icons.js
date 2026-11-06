// Map each emoji icon to its context for SVG replacement planning
const fs = require('fs');
const path = require('path');

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

const results = [];

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const lines = html.split('\n');
  const rel = path.relative(path.resolve(__dirname, '..'), f).replace(/\\/g, '/');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Find icon divs with emoji
    const iconMatch = line.match(/<div[^>]*class="([^"]*icon[^"]*)"[^>]*>([^<]*)<\/div>/);
    if (iconMatch && emojiRegex.test(iconMatch[2])) {
      const cls = iconMatch[1];
      const content = iconMatch[2].trim();
      // Skip single regional indicators
      if (/^[\u{1F1E6}-\u{1F1FF}]$/u.test(content)) continue;
      
      // Get surrounding context
      const context = lines.slice(Math.max(0, i - 2), i + 3).join('\n');
      results.push({
        file: rel,
        line: i + 1,
        class: cls,
        emoji: content,
        context: context.trim()
      });
    }
  }
}

// Group by emoji type
const byEmoji = {};
for (const r of results) {
  if (!byEmoji[r.emoji]) byEmoji[r.emoji] = [];
  byEmoji[r.emoji].push(r);
}

console.log(`Total: ${results.length} emoji icons in ${new Set(results.map(r => r.file)).size} pages`);
console.log(`Unique types: ${Object.keys(byEmoji).length}`);
console.log('');

for (const [emoji, instances] of Object.entries(byEmoji).sort((a, b) => b[1].length - a[1].length)) {
  const cp = emoji.codePointAt(0).toString(16).toUpperCase();
  console.log(`\n=== ${emoji}  U+${cp}  (${instances.length} instances) ===`);
  for (const inst of instances.slice(0, 3)) {
    console.log(`  ${inst.file}:${inst.line}`);
    console.log(`    class="${inst.class}"`);
    // Show the heading/text nearby
    const headingMatch = inst.context.match(/<h[34][^>]*>([^<]+)<\/h[34]>/);
    if (headingMatch) console.log(`    heading: "${headingMatch[1].trim()}"`);
  }
  if (instances.length > 3) console.log(`  ... and ${instances.length - 3} more`);
}
