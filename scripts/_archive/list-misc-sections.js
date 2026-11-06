/**
 * List all section headings in misc.css with their line numbers and approximate sizes.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const content = fs.readFileSync(path.join(ROOT, 'css', 'components', 'misc.css'), 'utf8');
const lines = content.split('\n');

const sections = [];
for (let i = 0; i < lines.length; i++) {
  // Section heading: line with "===" followed by a title line
  if (lines[i].match(/^\/\* =+/) && i + 1 < lines.length && !lines[i+1].match(/^\/\* =+/)) {
    const title = lines[i+1] ? lines[i+1].trim() : '(no title)';
    sections.push({ line: i + 1, title });
  }
}

console.log(`Total sections: ${sections.length}\n`);
for (let i = 0; i < sections.length; i++) {
  const endLine = (i < sections.length - 1) ? sections[i+1].line - 1 : lines.length;
  const size = endLine - sections[i].line + 1;
  console.log(`  L${sections[i].line.toString().padStart(5)}  (${size.toString().padStart(4)} lines)  ${sections[i].title}`);
}
