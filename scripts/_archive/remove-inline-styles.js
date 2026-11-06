/**
 * Remove inline <style> tags containing deep-dive styles from all market pages
 * These have been moved to css/sections/markets.css
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

let removed = 0;
let filesChanged = 0;

walkDir(PAGES_DIR, (filePath, fileName) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Match <style>...</style> blocks that contain deep-dive styles
  const styleRegex = /\n?\s*<style>\s*\.deep-dive-section[\s\S]*?<\/style>\s*\n?/g;
  const matches = content.match(styleRegex);
  
  if (matches) {
    content = content.replace(styleRegex, '\n\n  ');
    fs.writeFileSync(filePath, content, 'utf8');
    removed += matches.length;
    filesChanged++;
    console.log(`  Removed ${matches.length} from ${fileName}`);
  }
});

console.log(`\nTotal inline style tags removed: ${removed}`);
console.log(`Files modified: ${filesChanged}`);
