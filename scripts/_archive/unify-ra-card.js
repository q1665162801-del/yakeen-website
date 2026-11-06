/**
 * Unify ra-card component:
 * 1. Add ra-card--text modifier to text-only ra-card instances in chandeliers pages
 *    and custom-lighting pages
 */
const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.resolve(__dirname, '..', 'src', 'pages');

function walkDir(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.name.endsWith('.html')) {
      callback(fullPath, entry.name);
    }
  }
}

let modified = 0;
let filesChanged = 0;

walkDir(PAGES_DIR, (filePath, fileName) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find ra-card that DON'T have ra-card-thumb inside them (text-only variant)
  // We match: class="ra-card" followed by content that does NOT contain ra-card-thumb before </a>
  // Simpler approach: find all ra-card elements and check each one
  const raCardRegex = /<a[^>]*class="ra-card"[^>]*>[\s\S]*?<\/a>/g;
  let match;
  let fileChanged = false;
  
  // We need to work on copies since we'll be modifying the string
  let newContent = content;
  let offset = 0;
  
  while ((match = raCardRegex.exec(content)) !== null) {
    const cardHtml = match[0];
    // Check if it's a text-only card (no ra-card-thumb, no ra-card-body)
    if (!cardHtml.includes('ra-card-thumb') && !cardHtml.includes('ra-card-body')) {
      // Add --text modifier
      const newCardHtml = cardHtml.replace(
        /class="ra-card"/,
        'class="ra-card ra-card--text"'
      );
      newContent = newContent.substring(0, match.index + offset) + newCardHtml + newContent.substring(match.index + match[0].length + offset);
      offset += newCardHtml.length - cardHtml.length;
      modified++;
      fileChanged = true;
    }
  }
  
  if (fileChanged) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesChanged++;
    console.log(`  ${fileName}`);
  }
});

console.log(`\n=== Summary ===`);
console.log(`ra-card--text modifier added: ${modified}`);
console.log(`Files modified: ${filesChanged}`);
