const fs = require('fs');
const path = require('path');

// Extract all class selectors from a CSS file
function extractClasses(css) {
  const classes = new Set();
  const re = /\.([a-zA-Z][\w-]*)/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    classes.add(m[1]);
  }
  return classes;
}

const ROOT = path.resolve(__dirname, '..');

// We need two builds to compare. For now, let's check what's in the current build
// vs what classes are actually used in HTML.

function findHTML(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results = results.concat(findHTML(full));
    else if (e.name.endsWith('.html')) results.push(full);
  }
  return results;
}

const htmlFiles = findHTML(path.join(ROOT, 'src'));
const usedClasses = new Set();

for (const f of htmlFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const re = /class="([^"]+)"/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const classNames = m[1].split(/\s+/).filter(Boolean);
    for (const c of classNames) usedClasses.add(c);
  }
}

console.log(`Total classes used in HTML: ${usedClasses.size}`);

// Now find which used classes are ONLY defined in components.css
// (i.e., defined in components.css but not in any other CSS file)

// For now, let's just list all classes in components.css that are used in HTML
const compCss = fs.readFileSync(path.join(ROOT, 'css', 'sections', 'components.css.bak'), 'utf8');
const compClasses = extractClasses(compCss);
console.log(`\nClasses defined in components.css: ${compClasses.size}`);

const usedFromComp = [...compClasses].filter(c => usedClasses.has(c));
console.log(`Classes from components.css that are actually used: ${usedFromComp.length}`);

// Check which of these are also defined in index.css
const indexCss = fs.readFileSync(path.join(ROOT, 'css', 'components', 'index.css'), 'utf8');
const indexClasses = extractClasses(indexCss);

const onlyInComp = usedFromComp.filter(c => !indexClasses.has(c));
console.log(`Used classes only defined in components.css (not in index.css): ${onlyInComp.length}`);
console.log('\nFirst 30:');
onlyInComp.slice(0, 30).forEach(c => console.log(`  .${c}`));
if (onlyInComp.length > 30) console.log(`  ... +${onlyInComp.length - 30} more`);
