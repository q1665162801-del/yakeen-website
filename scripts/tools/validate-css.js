/**
 * Validate CSS syntax and report all parse errors.
 */
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const ROOT = path.resolve(__dirname, '..');
const cssFile = path.join(ROOT, 'css', 'components', 'misc.css');

const css = fs.readFileSync(cssFile, 'utf8');

try {
  postcss.parse(css, { from: cssFile });
  console.log('✅ CSS is valid');
} catch (err) {
  console.log('❌ Parse error:');
  console.log(err.message);
  console.log(`Line: ${err.line}, Column: ${err.column}`);

  // Show context
  const lines = css.split('\n');
  const start = Math.max(0, err.line - 5);
  const end = Math.min(lines.length, err.line + 2);
  console.log('\nContext:');
  for (let i = start; i < end; i++) {
    const marker = (i + 1 === err.line) ? '>> ' : '   ';
    console.log(`${marker}${i+1}: ${lines[i]}`);
  }
}
