const fs = require('fs');

const content = fs.readFileSync('css/components/index.css', 'utf8');

// Find all section headers and their line numbers
const lines = content.split('\n');
const sections = [];
let currentSection = null;

lines.forEach((line, i) => {
  const m = line.match(/^\s*\d+\.\s+(.+?)\s+=+/);
  if (m) {
    if (currentSection) {
      currentSection.endLine = i;
      currentSection.totalLines = i - currentSection.startLine;
      sections.push(currentSection);
    }
    currentSection = {
      name: m[1],
      startLine: i,
      endLine: null,
      totalLines: null,
      selectors: []
    };
  }
  
  // Collect top-level selectors in this section
  if (currentSection && /^\.[a-zA-Z][^{]+\s*\{/.test(line) && !line.includes('@media')) {
    const selMatch = line.match(/^\.([a-zA-Z][^{]+?)\s*\{/);
    if (selMatch) {
      const sel = selMatch[1].trim();
      if (!currentSection.selectors.includes(sel)) {
        currentSection.selectors.push(sel);
      }
    }
  }
});

if (currentSection) {
  currentSection.endLine = lines.length;
  currentSection.totalLines = lines.length - currentSection.startLine;
  sections.push(currentSection);
}

console.log('=== components/index.css 结构分析 ===\n');
sections.forEach((s, i) => {
  console.log(`${i + 1}. ${s.name}`);
  console.log(`   行数: ${s.totalLines}`);
  console.log(`   选择器前缀: ${s.selectors.slice(0, 3).join(', ')}${s.selectors.length > 3 ? '...' : ''}`);
  console.log(`   共 ${s.selectors.length} 个选择器`);
  console.log();
});

console.log(`总计: ${sections.length} 个部分，${lines.length} 行`);
