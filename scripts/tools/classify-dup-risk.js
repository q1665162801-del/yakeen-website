// Classify duplicate CSS classes by risk level
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'css');

function extractTopLevelClasses(css) {
  let cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  let i = 0;
  const classes = new Set();
  
  while (i < cleanCss.length) {
    const char = cleanCss[i];
    if (char === '{') { depth++; i++; continue; }
    if (char === '}') { depth = Math.max(0, depth - 1); i++; continue; }
    
    if (depth === 0 && char === '.') {
      // Check what comes before — must be start of selector
      let before = '';
      let j = i - 1;
      while (j >= 0 && cleanCss[j] !== '\n' && cleanCss[j] !== ',') {
        before = cleanCss[j] + before;
        j--;
      }
      if (before.trim() !== '') {
        i++;
        continue;
      }
      const rest = cleanCss.substring(i);
      const match = rest.match(/^\.([a-zA-Z_][\w-]*)\s*\{/);
      if (match) {
        classes.add(match[1]);
        i += match[0].length;
        depth++;
        continue;
      }
    }
    
    if (depth === 0 && char === '@') {
      const rest = cleanCss.substring(i);
      const atMatch = rest.match(/^@[^{]+\{/);
      if (atMatch) {
        i += atMatch[0].length;
        depth++;
        continue;
      }
    }
    i++;
  }
  return classes;
}

// Collect all CSS files
const cssFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fp);
    else if (entry.name.endsWith('.css')) cssFiles.push(fp);
  }
})(CSS_DIR);

// Categorize files
const fileCategory = {};
for (const f of cssFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (rel.includes('/themes/')) fileCategory[rel] = 'theme';
  else if (rel.includes('responsive.css')) fileCategory[rel] = 'responsive';
  else if (rel.includes('utilities.css')) fileCategory[rel] = 'utility';
  else if (rel.includes('animations.css')) fileCategory[rel] = 'animation';
  else if (rel.includes('css/components/')) fileCategory[rel] = 'component';
  else if (rel.includes('css/sections/')) fileCategory[rel] = 'section';
  else if (rel.includes('css/pages/')) fileCategory[rel] = 'page';
  else if (rel.includes('css/layout.css')) fileCategory[rel] = 'layout';
  else if (rel.includes('css/base/')) fileCategory[rel] = 'base';
  else fileCategory[rel] = 'other';
}

// Extract top-level classes from each file
const fileClasses = {};
for (const f of cssFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (fileCategory[rel] === 'theme' || fileCategory[rel] === 'responsive' || fileCategory[rel] === 'utility') continue;
  const css = fs.readFileSync(f, 'utf8');
  fileClasses[rel] = extractTopLevelClasses(css);
}

// Find duplicates and classify
const allClasses = {};
for (const [file, classes] of Object.entries(fileClasses)) {
  for (const cls of classes) {
    if (!allClasses[cls]) allClasses[cls] = [];
    allClasses[cls].push(file);
  }
}

const duplicates = Object.entries(allClasses)
  .filter(([, files]) => files.length >= 2)
  .sort((a, b) => b[1].length - a[1].length);

// Risk classification
const risks = {
  'P0: page + component (global pollution)': [],
  'P1: section + component (override risk)': [],
  'P2: section + section (naming confusion)': [],
  'P3: page + section (scoped, low risk)': [],
  'P3: page + page (separate pages)': [],
};

for (const [cls, files] of duplicates) {
  const cats = files.map(f => fileCategory[f]);
  const hasComponent = cats.includes('component') || cats.includes('layout');
  const hasSection = cats.includes('section');
  const hasPage = cats.includes('page');
  const hasAnimation = cats.includes('animation');
  
  if (hasPage && hasComponent) {
    risks['P0: page + component (global pollution)'].push({ cls, files });
  } else if (hasSection && hasComponent) {
    risks['P1: section + component (override risk)'].push({ cls, files });
  } else if (hasPage && hasSection) {
    risks['P3: page + section (scoped, low risk)'].push({ cls, files });
  } else if (hasPage && files.filter(f => fileCategory[f] === 'page').length >= 2) {
    risks['P3: page + page (separate pages)'].push({ cls, files });
  } else if (hasSection && files.filter(f => fileCategory[f] === 'section').length >= 2) {
    risks['P2: section + section (naming confusion)'].push({ cls, files });
  } else {
    // Other combinations
    risks['P2: section + section (naming confusion)'].push({ cls, files });
  }
}

console.log(`Total duplicate classes (excluding themes/responsive/utilities): ${duplicates.length}\n`);

let total = 0;
for (const [risk, items] of Object.entries(risks)) {
  console.log(`=== ${risk} (${items.length}) ===`);
  total += items.length;
  for (const item of items.slice(0, 10)) {
    console.log(`  .${item.cls}  [${item.files.length}] ${item.files.join(', ')}`);
  }
  if (items.length > 10) console.log(`  ... and ${items.length - 10} more`);
  console.log();
}
console.log(`Total: ${total}`);
