const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'css', 'sections', 'components.css');
let content = fs.readFileSync(file, 'utf-8');

// Section 1: ARTICLE CARD (blog list) — 100% dead
// Remove from section heading to next section heading
const articleCardStart = content.indexOf('2. ARTICLE CARD (blog list)');
const articleCardEnd = content.indexOf('3. FEATURED ARTICLE', articleCardStart);
if (articleCardStart > 0 && articleCardEnd > 0) {
  // Find the /* ==== line before the title
  const startIdx = content.lastIndexOf('/* ===', articleCardStart);
  content = content.slice(0, startIdx) + content.slice(articleCardEnd);
  console.log('✓ Removed ARTICLE CARD section');
} else {
  console.log('✗ ARTICLE CARD section not found');
}

// Re-find positions after first deletion
// Section 2: FEATURED ARTICLE — only partially dead (2/9 used, 7 dead)
// We'll remove only the dead selectors and their rules
// Actually, let's be safe: remove only the classes we confirmed are dead
// The used ones are: featured-article (class itself? no, it's dead too)...
// Wait, audit said 2/9 used. Let me check which 2.
// From the audit: FEATURED ARTICLE has 9 classes, 2 used
// The dead ones: featured-article, featured-grid, featured-visual, featured-content, read-link, author, author-avatar
// Used ones (2): let me figure out... probably "featured" something shared.
// To be safe, let's just mark this section for review and NOT delete it yet.
// We'll focus on the 3 fully dead sections first.

// Find JOURNAL CATEGORIES section
const journalIdx = content.indexOf('23. JOURNAL CATEGORIES');
if (journalIdx > 0) {
  const startIdx = content.lastIndexOf('/* ===', journalIdx);
  // Find next section heading after this one
  const afterJournal = content.slice(journalIdx);
  const nextSectionMatch = afterJournal.match(/\n\/\*\s*=+\s*\n\s*\d+\.\s/);
  if (nextSectionMatch) {
    const endIdx = journalIdx + nextSectionMatch.index + 1; // +1 for the newline
    content = content.slice(0, startIdx) + content.slice(endIdx);
    console.log('✓ Removed JOURNAL CATEGORIES section');
  } else {
    console.log('✗ JOURNAL CATEGORIES end not found');
  }
} else {
  console.log('✗ JOURNAL CATEGORIES section not found');
}

// Find TOPICS GRID section
const topicsIdx = content.indexOf('35. TOPICS GRID');
if (topicsIdx > 0) {
  const startIdx = content.lastIndexOf('/* ===', topicsIdx);
  const afterTopics = content.slice(topicsIdx);
  const nextSectionMatch = afterTopics.match(/\n\/\*\s*=+\s*\n\s*\d+\.\s/);
  if (nextSectionMatch) {
    const endIdx = topicsIdx + nextSectionMatch.index + 1;
    content = content.slice(0, startIdx) + content.slice(endIdx);
    console.log('✓ Removed TOPICS GRID section');
  } else {
    // It might be the last section — remove to end
    content = content.slice(0, startIdx).trimEnd() + '\n';
    console.log('✓ Removed TOPICS GRID section (last section)');
  }
} else {
  console.log('✗ TOPICS GRID section not found');
}

fs.writeFileSync(file, content);
const newSize = Buffer.byteLength(content, 'utf-8');
console.log('\nNew file size: ' + (newSize / 1024).toFixed(1) + ' KB');
