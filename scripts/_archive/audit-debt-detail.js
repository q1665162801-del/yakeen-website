// Quick script: dump all duplicate classes and emoji icon locations
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'pages');
const CSS = path.join(ROOT, 'css');

// ─── 1. Duplicate CSS classes ───
const cssFiles = [];
(function walkCss(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkCss(fullPath);
    else if (entry.name.endsWith('.css')) cssFiles.push(fullPath);
  }
})(CSS);

const classDefs = {};
for (const f of cssFiles) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  let inComment = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (inComment) {
      if (line.includes('*/')) { inComment = false; line = line.substring(line.indexOf('*/') + 2); }
      else continue;
    }
    line = line.replace(/\/\*[\s\S]*?\*\//g, '');
    if (line.includes('/*') && !line.includes('*/')) { inComment = true; line = line.substring(0, line.indexOf('/*')); }
    const m = line.trim().match(/^\.([a-zA-Z_][\w-]*)\s*\{/);
    if (m) {
      const cls = m[1];
      if (!classDefs[cls]) classDefs[cls] = [];
      classDefs[cls].push({ file: rel, line: i + 1 });
    }
  }
}

const dupes = [];
for (const [cls, defs] of Object.entries(classDefs)) {
  const files = new Set(defs.map(d => d.file));
  if (files.size < 2) continue;
  if (cls.startsWith('btn-')) continue;
  if (cls === 'container' || cls.startsWith('container-')) continue;
  dupes.push({ cls, count: defs.length, files: [...files], defs });
}
dupes.sort((a, b) => b.files.length - a.files.length || b.count - a.count);

console.log('=== DUPLICATE CSS CLASSES (85 total) ===');
console.log(`Total: ${dupes.length}`);
console.log('');

// Categorize
const categories = {
  '组件级 (components + sections/pages 重复)': [],
  'section 间重复': [],
  'responsive 覆盖': [],
  '其他': []
};

for (const d of dupes) {
  const hasComponent = d.files.some(f => f.includes('/components/'));
  const hasResponsive = d.files.some(f => f.includes('responsive.css'));
  const sectionFiles = d.files.filter(f => f.includes('/sections/'));
  
  if (hasComponent && d.files.length > 1) {
    categories['组件级 (components + sections/pages 重复)'].push(d);
  } else if (hasResponsive) {
    categories['responsive 覆盖'].push(d);
  } else if (sectionFiles.length >= 2) {
    categories['section 间重复'].push(d);
  } else {
    categories['其他'].push(d);
  }
}

for (const [cat, items] of Object.entries(categories)) {
  console.log(`\n--- ${cat} (${items.length}) ---`);
  for (const d of items) {
    console.log(`  .${d.cls}  [${d.files.length} files] ${d.files.join(', ')}`);
  }
}

// ─── 2. Emoji icons ───
console.log('\n\n=== EMOJI ICONS IN ICON CONTAINERS ===');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{FA00}-\u{FAFF}]/u;

const htmlFiles = [];
(function walkHtml(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(fullPath);
    else if (entry.name.endsWith('.html')) htmlFiles.push(fullPath);
  }
})(SRC);

const emojiMap = {}; // emoji -> count
let totalEmoji = 0;
let totalFiles = 0;

for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf8');
  const iconRegex = /<div[^>]*class="[^"]*icon[^"]*"[^>]*>([^<]*)<\/div>/g;
  let m;
  let found = false;
  while ((m = iconRegex.exec(html)) !== null) {
    const content = m[1].trim();
    if (content && !content.startsWith('<svg') && content.length < 30 && emojiRegex.test(content)) {
      const emojiChars = content.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{FA00}-\u{FAFF}]/gu) || [];
      for (const e of emojiChars) {
        emojiMap[e] = (emojiMap[e] || 0) + 1;
        totalEmoji++;
      }
      found = true;
    }
  }
  if (found) totalFiles++;
}

console.log(`Total emoji icons: ${totalEmoji} in ${totalFiles} pages`);
console.log(`Unique emoji types: ${Object.keys(emojiMap).length}`);
console.log('');
const sorted = Object.entries(emojiMap).sort((a, b) => b[1] - a[1]);
for (const [emoji, count] of sorted) {
  console.log(`  ${emoji}  ×${count}`);
}
