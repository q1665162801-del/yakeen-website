const fs = require('fs');

const content = fs.readFileSync('css/components/index.css', 'utf8');
const lines = content.split('\n');

// Find section headers with the actual format: "   N. Name — description"
const sections = [];
let currentSection = null;

lines.forEach((line, i) => {
  // Match patterns like "   1. Buttons — Unified button system"
  const m = line.match(/^\s+\d+\.\s+(.+)/);
  if (m && line.includes('=')) {
    if (currentSection) {
      currentSection.endLine = i;
      currentSection.totalLines = i - currentSection.startLine;
      sections.push(currentSection);
    }
    currentSection = {
      name: m[1].replace(/\s*=+$/, '').trim(),
      startLine: i,
      endLine: null,
      totalLines: null,
      selectors: []
    };
  }
  
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
  console.log(`   行: ${s.startLine + 1}-${s.endLine} (${s.totalLines} 行)`);
  console.log(`   选择器: ${s.selectors.slice(0, 4).join(', ')}${s.selectors.length > 4 ? '...' : ''}`);
  console.log(`   共 ${s.selectors.length} 个顶层选择器`);
  console.log();
});

console.log(`总计: ${sections.length} 个部分，${lines.length} 行`);
