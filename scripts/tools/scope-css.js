/* ============================================================
   Scope a CSS file under a parent class
   Usage: node scripts/scope-css.js <css-file-relative-path> <parent-class>
   Example: node scripts/scope-css.js css/sections/markets.css .gcc-country-page
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const cssPath = process.argv[2];
const parentClass = process.argv[3];

if (!cssPath || !parentClass) {
  console.error('Usage: node scripts/scope-css.js <css-file> <parent-class>');
  process.exit(1);
}

const fullPath = path.join(ROOT, cssPath);
let css = fs.readFileSync(fullPath, 'utf8');
const originalSize = css.length;

function scopeSelector(selector, parent) {
  return selector.split(',').map(part => {
    part = part.trim();
    if (!part) return part;
    if (part.startsWith('@')) return part;
    // Already scoped with this parent?
    if (part.startsWith(parent + ' ')) return part;
    if (part.startsWith(parent + '.')) return part;
    return `${parent} ${part}`;
  }).join(',\n  ');
}

function processRules(cssText, parent) {
  let result = '';
  let i = 0;
  let currentSelector = '';
  
  while (i < cssText.length) {
    const char = cssText[i];
    const nextTwo = cssText.substring(i, i + 2);
    
    // Comments
    if (nextTwo === '/*') {
      const endIdx = cssText.indexOf('*/', i + 2);
      if (endIdx === -1) {
        result += cssText.substring(i);
        break;
      }
      result += cssText.substring(i, endIdx + 2);
      i = endIdx + 2;
      continue;
    }
    
    // @-rules
    if (char === '@' && currentSelector.trim() === '') {
      const atMatch = cssText.substring(i).match(/^(@[^{]+)\{/);
      if (atMatch) {
        const atHeader = atMatch[1];
        const atStart = i + atHeader.length + 1;
        
        // Find matching closing brace
        let depth = 1;
        let j = atStart;
        let inComment = false;
        while (j < cssText.length && depth > 0) {
          if (!inComment && cssText.substring(j, j + 2) === '/*') {
            inComment = true; j += 2; continue;
          }
          if (inComment && cssText.substring(j, j + 2) === '*/') {
            inComment = false; j += 2; continue;
          }
          if (inComment) { j++; continue; }
          if (cssText[j] === '{') depth++;
          else if (cssText[j] === '}') depth--;
          j++;
        }
        
        const atBody = cssText.substring(atStart, j - 1);
        const scopedBody = processRules(atBody, parent);
        result += atHeader + '{\n' + scopedBody + '}';
        i = j;
        currentSelector = '';
        continue;
      }
    }
    
    // Rule block start
    if (char === '{') {
      const selector = currentSelector.trim();
      
      // Find matching closing brace
      let depth = 1;
      let j = i + 1;
      let inComment = false;
      while (j < cssText.length && depth > 0) {
        if (!inComment && cssText.substring(j, j + 2) === '/*') {
          inComment = true; j += 2; continue;
        }
        if (inComment && cssText.substring(j, j + 2) === '*/') {
          inComment = false; j += 2; continue;
        }
        if (inComment) { j++; continue; }
        if (cssText[j] === '{') depth++;
        else if (cssText[j] === '}') depth--;
        j++;
      }
      
      const ruleBody = cssText.substring(i + 1, j - 1);
      
      if (selector) {
        const scopedSel = scopeSelector(selector, parent);
        result += scopedSel + ' {' + ruleBody + '}';
      } else {
        result += '{' + ruleBody + '}';
      }
      
      currentSelector = '';
      i = j;
      continue;
    }
    
    currentSelector += char;
    i++;
  }
  
  return result;
}

// Preserve top comment block
const headerMatch = css.match(/^(\/\*[\s\S]*?\*\/\s*)/);
const header = headerMatch ? headerMatch[1] : '';
const body = headerMatch ? css.substring(headerMatch[0].length) : css;

const scopedBody = processRules(body, parentClass);
const scoped = header + `\n/* Scoped under ${parentClass} to prevent global pollution */\n` + scopedBody;

fs.writeFileSync(fullPath, scoped);
console.log(`✅ ${cssPath} scoped under ${parentClass}`);
console.log(`   ${originalSize} → ${scoped.length} bytes`);
