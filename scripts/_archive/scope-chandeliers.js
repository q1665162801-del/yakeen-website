/* ============================================================
   Scope chandeliers.css under .chandelier-page
   Prevents page-specific styles from polluting global scope
   ============================================================ */

const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'css', 'pages', 'chandeliers.css');
let css = fs.readFileSync(filePath, 'utf8');

// Preserve the top comment block
const headerMatch = css.match(/^(\/\*[\s\S]*?\*\/\s*)/);
const header = headerMatch ? headerMatch[1] : '';
let body = headerMatch ? css.substring(headerMatch[0].length) : css;

function scopeSelector(selector, parentClass) {
  // Split by comma and scope each part
  return selector.split(',').map(part => {
    part = part.trim();
    if (!part) return part;
    // Skip @-rules
    if (part.startsWith('@')) return part;
    // Already scoped? skip
    if (part.startsWith(parentClass)) return part;
    return `${parentClass} ${part}`;
  }).join(',\n  ');
}

function processRules(cssText, parentClass) {
  let result = '';
  let i = 0;
  let depth = 0;
  let currentSelector = '';
  let inComment = false;
  
  while (i < cssText.length) {
    const char = cssText[i];
    const nextTwo = cssText.substring(i, i + 2);
    
    // Handle comments
    if (nextTwo === '/*') {
      // Find end of comment
      const endIdx = cssText.indexOf('*/', i + 2);
      if (endIdx === -1) {
        result += cssText.substring(i);
        break;
      }
      result += cssText.substring(i, endIdx + 2);
      i = endIdx + 2;
      continue;
    }
    
    if (char === '@' && depth === 0) {
      // @-rule like @media, @keyframes — handle specially
      const atMatch = cssText.substring(i).match(/^(@[^{]+)\{/);
      if (atMatch) {
        const atHeader = atMatch[1];
        const atStart = i + atHeader.length + 1;
        
        // Find matching closing brace
        let atDepth = 1;
        let atI = atStart;
        let atInComment = false;
        while (atI < cssText.length && atDepth > 0) {
          if (!atInComment && cssText.substring(atI, atI + 2) === '/*') {
            atInComment = true;
            atI += 2;
            continue;
          }
          if (atInComment && cssText.substring(atI, atI + 2) === '*/') {
            atInComment = false;
            atI += 2;
            continue;
          }
          if (atInComment) { atI++; continue; }
          
          if (cssText[atI] === '{') atDepth++;
          else if (cssText[atI] === '}') atDepth--;
          atI++;
        }
        
        const atBody = cssText.substring(atStart, atI - 1);
        // Process rules inside the @-rule
        const scopedBody = processRules(atBody, parentClass);
        result += atHeader + '{\n' + scopedBody + '}';
        i = atI;
        continue;
      }
    }
    
    if (char === '{' && depth === 0) {
      // Found a rule block start
      const selector = currentSelector.trim();
      
      // Find matching closing brace
      let braceDepth = 1;
      let j = i + 1;
      let inBlockComment = false;
      while (j < cssText.length && braceDepth > 0) {
        if (!inBlockComment && cssText.substring(j, j + 2) === '/*') {
          inBlockComment = true;
          j += 2;
          continue;
        }
        if (inBlockComment && cssText.substring(j, j + 2) === '*/') {
          inBlockComment = false;
          j += 2;
          continue;
        }
        if (inBlockComment) { j++; continue; }
        
        if (cssText[j] === '{') braceDepth++;
        else if (cssText[j] === '}') braceDepth--;
        j++;
      }
      
      const ruleBody = cssText.substring(i + 1, j - 1);
      
      // Scope the selector
      const scopedSel = scopeSelector(selector, parentClass);
      result += scopedSel + ' {' + ruleBody + '}';
      
      currentSelector = '';
      i = j;
      continue;
    }
    
    if (depth === 0) {
      currentSelector += char;
    } else {
      result += char;
    }
    
    i++;
  }
  
  return result;
}

const scoped = header + '\n/* Scoped under .chandelier-page to prevent global pollution */\n' + processRules(body, '.chandelier-page');

fs.writeFileSync(filePath, scoped);
console.log('✅ chandeliers.css scoped under .chandelier-page');
console.log(`   Original size: ${css.length} bytes`);
console.log(`   New size: ${scoped.length} bytes`);
