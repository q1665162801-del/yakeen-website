// Compare duplicate CSS class rules across files
// Classifies each duplicate: IDENTICAL (delete extras), SIMILAR (unify with modifiers), DIFFERENT (scope/rename)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSS_DIRS = [
  'css/base',
  'css/components',
  'css/layout',
  'css/sections',
  'css/pages',
];

// Extract all top-level class rules from a CSS file
function extractClassRules(css) {
  const rules = {};
  let i = 0;
  
  // Skip comments
  function skipComment(pos) {
    if (css.substring(pos, pos + 2) === '/*') {
      const end = css.indexOf('*/', pos + 2);
      return end === -1 ? pos : end + 2;
    }
    return pos;
  }
  
  while (i < css.length) {
    i = skipComment(i);
    if (i >= css.length) break;
    
    const char = css[i];
    
    // @-rules — recurse into them
    if (char === '@') {
      const braceIdx = css.indexOf('{', i);
      if (braceIdx !== -1) {
        const header = css.substring(i, braceIdx).trim();
        // Find matching closing brace
        let depth = 1;
        let j = braceIdx + 1;
        while (j < css.length && depth > 0) {
          j = skipComment(j);
          if (j >= css.length) break;
          if (css[j] === '{') depth++;
          else if (css[j] === '}') depth--;
          j++;
        }
        const body = css.substring(braceIdx + 1, j - 1);
        const nestedRules = extractClassRules(body);
        for (const [cls, ruleArr] of Object.entries(nestedRules)) {
          if (!rules[cls]) rules[cls] = [];
          rules[cls].push(...ruleArr);
        }
        i = j;
        continue;
      }
    }
    
    // Class selector
    if (char === '.') {
      const lineEnd = css.indexOf('{', i);
      const newlineIdx = css.indexOf('\n', i);
      if (lineEnd !== -1 && (newlineIdx === -1 || lineEnd < newlineIdx)) {
        const selector = css.substring(i, lineEnd).trim();
        // Simple class name match (no combinators)
        const classMatch = selector.match(/^\.([\w-]+)$/);
        if (classMatch) {
          const className = classMatch[1];
          // Find matching closing brace
          let depth = 1;
          let j = lineEnd + 1;
          while (j < css.length && depth > 0) {
            j = skipComment(j);
            if (j >= css.length) break;
            if (css[j] === '{') depth++;
            else if (css[j] === '}') depth--;
            j++;
          }
          const ruleBody = css.substring(lineEnd + 1, j - 1).trim();
          if (!rules[className]) rules[className] = [];
          rules[className].push(ruleBody);
          i = j;
          continue;
        }
      }
    }
    
    i++;
  }
  
  return rules;
}

// Normalize a CSS rule for comparison
function normalizeRule(rule) {
  return rule
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
    .replace(/\s+/g, ' ')             // normalize whitespace
    .replace(/\s*([:;{}])\s*/g, '$1') // normalize around punctuation
    .trim();
}

// Compare two rule sets for similarity
function compareRules(rulesA, rulesB) {
  const normA = rulesA.map(normalizeRule).sort().join('|');
  const normB = rulesB.map(normalizeRule).sort().join('|');
  
  if (normA === normB) return 'IDENTICAL';
  
  // Check if one is a subset of the other
  const propsA = new Set(normA.split(';').filter(Boolean));
  const propsB = new Set(normB.split(';').filter(Boolean));
  let common = 0;
  for (const p of propsA) if (propsB.has(p)) common++;
  
  const total = Math.max(propsA.size, propsB.size);
  const similarity = total > 0 ? common / total : 0;
  
  if (similarity > 0.7) return 'SIMILAR (' + Math.round(similarity * 100) + '%)';
  return 'DIFFERENT (' + Math.round(similarity * 100) + '%)';
}

// Collect all CSS files
const cssFiles = [];
for (const dir of CSS_DIRS) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) continue;
  (function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const fp = path.join(d, entry.name);
      if (entry.isDirectory()) walk(fp);
      else if (entry.name.endsWith('.css')) cssFiles.push(fp);
    }
  })(fullDir);
}

// Extract rules from all files
const fileRules = {};
for (const f of cssFiles) {
  const css = fs.readFileSync(f, 'utf8');
  const rules = extractClassRules(css);
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  fileRules[rel] = rules;
}

// Find duplicates
const allClasses = {};
for (const [file, rules] of Object.entries(fileRules)) {
  // Skip override files for the "true duplicates" count
  if (file.includes('responsive.css') || file.includes('utilities.css') || file.includes('/themes/')) continue;
  for (const cls of Object.keys(rules)) {
    if (!allClasses[cls]) allClasses[cls] = {};
    allClasses[cls][file] = rules[cls];
  }
}

// Filter to duplicates only
const duplicates = Object.entries(allClasses)
  .filter(([, files]) => Object.keys(files).length >= 2)
  .sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length);

console.log(`Found ${duplicates.length} duplicate class definitions (excluding responsive/utilities/themes)\n`);

// Classify each
const categories = { IDENTICAL: [], SIMILAR: [], DIFFERENT: [] };

for (const [className, files] of duplicates) {
  const fileList = Object.keys(files);
  // Compare all pairs
  let worstCase = 'IDENTICAL';
  for (let i = 0; i < fileList.length; i++) {
    for (let j = i + 1; j < fileList.length; j++) {
      const result = compareRules(files[fileList[i]], files[fileList[j]]);
      if (result.startsWith('DIFFERENT')) worstCase = 'DIFFERENT';
      else if (result.startsWith('SIMILAR') && worstCase !== 'DIFFERENT') worstCase = 'SIMILAR';
    }
  }
  
  const catKey = worstCase;
  categories[catKey].push({
    class: '.' + className,
    files: fileList,
    count: fileList.length
  });
}

for (const [cat, items] of Object.entries(categories)) {
  console.log(`\n=== ${cat} (${items.length}) ===`);
  for (const item of items) {
    console.log(`  ${item.class}  [${item.count} files] ${item.files.join(', ')}`);
  }
}
