const fs = require('fs');
const path = require('path');

// CSS files in build order (before light.css)
const BEFORE_FILES = [
  'tokens.css', 'base.css', 'layout.css', 'utilities.css', 'animations.css',
  'components/index.css', 'components/modules.css', 'components/whatsapp-widget.css',
  'sections/misc.css', 'sections/hero.css', 'sections/features.css',
  'sections/products.css', 'sections/projects.css', 'sections/markets.css',
  'sections/about.css', 'sections/cta.css', 'sections/rebuilt.css',
  'pages/chandeliers.css',
];

const LIGHT_FILE = 'themes/light.css';
const CSS_DIR = 'css';

// Extract all selectors and their properties from a CSS file
function parseRules(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rules = [];
  
  // Remove comments
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Simple block parser
  let depth = 0;
  let currentSelector = '';
  let currentProps = '';
  let inBlock = false;
  
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    
    if (char === '{' && depth === 0) {
      depth++;
      inBlock = true;
      continue;
    }
    if (char === '}' && depth === 1) {
      depth--;
      inBlock = false;
      if (currentSelector.trim() && !currentSelector.startsWith('@media')) {
        const props = currentProps.split(';').filter(p => p.trim()).map(p => {
          const m = p.match(/([a-z-]+)\s*:/i);
          return m ? m[1].toLowerCase() : null;
        }).filter(Boolean);
        rules.push({
          selector: currentSelector.trim(),
          properties: props
        });
      }
      currentSelector = '';
      currentProps = '';
      continue;
    }
    
    if (inBlock) {
      currentProps += char;
    } else {
      currentSelector += char;
    }
  }
  
  return rules;
}

// Load all "before" rules
const beforeRules = [];
BEFORE_FILES.forEach(f => {
  const p = path.join(CSS_DIR, f);
  if (fs.existsSync(p)) {
    const rules = parseRules(p);
    rules.forEach(r => r.file = f);
    beforeRules.push(...rules);
  }
});

// Load light.css rules
const lightRules = parseRules(path.join(CSS_DIR, LIGHT_FILE));

console.log(`Before files rules: ${beforeRules.length}`);
console.log(`light.css rules: ${lightRules.length}\n`);

// For each light.css rule, check if any before rule has the same selector + same property
let canMove = 0;
let mightConflict = 0;

lightRules.forEach(rule => {
  // Skip @media blocks (they're in the same file)
  if (rule.selector.startsWith('@media') || rule.selector.startsWith('@keyframes')) return;
  
  // Split compound selectors
  const selectors = rule.selector.split(',').map(s => s.trim());
  
  let hasAnyConflict = false;
  const conflictingProps = new Set();
  
  selectors.forEach(sel => {
    beforeRules.forEach(br => {
      const brSels = br.selector.split(',').map(s => s.trim());
      brSels.forEach(brSel => {
        if (brSel === sel) {
          // Same selector — check property overlap
          rule.properties.forEach(prop => {
            if (br.properties.includes(prop)) {
              conflictingProps.add(prop);
              hasAnyConflict = true;
            }
          });
        }
      });
    });
  });
  
  if (hasAnyConflict) {
    mightConflict++;
    console.log(`⚠️  CONFLICT: ${rule.selector.substring(0, 70)}`);
    console.log(`     Conflicting properties: ${[...conflictingProps].join(', ')}`);
  } else {
    canMove++;
  }
});

console.log(`\n=== Summary ===`);
console.log(`Can safely move: ${canMove} rules`);
console.log(`Might conflict: ${mightConflict} rules`);
