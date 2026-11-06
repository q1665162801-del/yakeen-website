const fs = require('fs');
const path = require('path');

// Extract all CSS rules for a given selector
function getRules(className, cssDir) {
  const files = fs.readdirSync(cssDir, { recursive: true }).filter(f => f.endsWith('.css'));
  const rules = [];
  
  files.forEach(file => {
    const fullPath = path.join(cssDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Find rules containing this class
    // Simple approach: find .className { ... } blocks
    const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`([^{]*\\.${escaped}[^{]*)\\{([^}]+)\\}`, 'gi');
    let match;
    while ((match = re.exec(clean)) !== null) {
      const selector = match[1].trim();
      const props = match[2].trim();
      // Skip media queries
      if (selector.includes('@media')) continue;
      if (selector.includes('@keyframes')) continue;
      
      rules.push({
        file: path.relative(cssDir, fullPath),
        selector: selector.substring(0, 100),
        props: props.replace(/\s+/g, ' ').trim().substring(0, 200)
      });
    }
  });
  
  return rules;
}

const btnClasses = [
  'btn-primary', 'btn-accent', 'btn--gold', 'btn-gold', 'btn--primary',
  'btn-secondary', 'btn-outline', 'btn--outline', 'btn-outline-light', 'btn--outline-light'
];

console.log('=== 按钮样式属性对比 ===\n');

btnClasses.forEach(cls => {
  const rules = getRules(cls, 'css');
  if (rules.length === 0) return;
  
  console.log(`\n── ${cls} (${rules.length} 条规则) ──`);
  rules.forEach(r => {
    console.log(`  [${r.file}]`);
    console.log(`    ${r.selector.substring(0, 60)}`);
    console.log(`    { ${r.props.substring(0, 150)} }`);
  });
});
