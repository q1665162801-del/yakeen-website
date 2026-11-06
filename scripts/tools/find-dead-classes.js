// Find CSS classes that are defined but never used in any HTML
// Helps identify dead code that can safely be deleted
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'pages');
const CSS_DIR = path.join(ROOT, 'css');

// Collect all HTML class names
const htmlClasses = new Set();
const htmlFiles = [];
(function walkHtml(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(fullPath);
    else if (entry.name.endsWith('.html')) {
      htmlFiles.push(fullPath);
      const html = fs.readFileSync(fullPath, 'utf8');
      const classRegex = /class="([^"]+)"/g;
      let m;
      while ((m = classRegex.exec(html)) !== null) {
        for (const c of m[1].split(/\s+/)) if (c) htmlClasses.add(c);
      }
    }
  }
})(SRC);

// Collect all CSS class definitions per file
const cssFiles = [];
(function walkCss(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkCss(fullPath);
    else if (entry.name.endsWith('.css')) cssFiles.push(fullPath);
  }
})(CSS_DIR);

const classSources = {}; // class -> [files]

for (const f of cssFiles) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  let inComment = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (inComment) {
      if (line.includes('*/')) { inComment = false; line = line.substring(line.indexOf('*/') + 2); }
      else continue;
    }
    line = line.replace(/\/\*[\s\S]*?\*\//g, '');
    if (line.includes('/*') && !line.includes('*/')) { inComment = true; line = line.substring(0, line.indexOf('/*')); }
    
    const m = line.trim().match(/^\.([a-zA-Z_][\w-]*)\s*\{/);
    if (m) {
      const cls = m[1];
      if (!classSources[cls]) classSources[cls] = [];
      classSources[cls].push({ file: rel, line: i + 1 });
    }
  }
}

// Find classes that are defined in 2+ files but never used in HTML
const deadDuplicates = [];
for (const [cls, sources] of Object.entries(classSources)) {
  const uniqueFiles = new Set(sources.map(s => s.file));
  if (uniqueFiles.size < 2) continue;
  
  // Skip override files
  const nonOverride = [...uniqueFiles].filter(f => 
    !f.includes('responsive.css') && !f.includes('/themes/') && !f.includes('utilities.css')
  );
  if (nonOverride.length < 2) continue;
  
  if (!htmlClasses.has(cls)) {
    deadDuplicates.push({ cls, sources });
  }
}

console.log(`=== DEAD DUPLICATE CLASSES (defined in 2+ files, never used in HTML) ===`);
console.log(`Total: ${deadDuplicates.length}`);
console.log('');

// Group by file
const fileDead = {};
for (const d of deadDuplicates) {
  for (const s of d.sources) {
    if (!fileDead[s.file]) fileDead[s.file] = [];
    fileDead[s.file].push(d.cls);
  }
}

for (const [file, classes] of Object.entries(fileDead).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n--- ${file} (${classes.length} dead classes) ---`);
  console.log(`  ${classes.join(', ')}`);
}

// Also check: classes defined only once but unused
const singleDead = [];
for (const [cls, sources] of Object.entries(classSources)) {
  if (sources.length === 1 && !htmlClasses.has(cls)) {
    const f = sources[0].file;
    if (f.includes('responsive.css') || f.includes('/themes/') || f.includes('utilities.css')) continue;
    singleDead.push({ cls, source: sources[0] });
  }
}

console.log(`\n\n=== SINGLE-FILE DEAD CLASSES (defined once, never used) ===`);
console.log(`Total: ${singleDead.length}`);
const byFile = {};
for (const d of singleDead) {
  if (!byFile[d.source.file]) byFile[d.source.file] = [];
  byFile[d.source.file].push(d.cls);
}
for (const [file, classes] of Object.entries(byFile).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n  ${file} (${classes.length}):`);
  console.log(`    ${classes.slice(0, 20).join(', ')}${classes.length > 20 ? ' ...' : ''}`);
}
