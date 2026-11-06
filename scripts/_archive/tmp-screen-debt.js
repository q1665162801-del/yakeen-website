// Temporary screening tool — manual debt audit for the remaining modules.css.
// For each top-level selector block, report: other CSS files defining the same
// top-level class, and which HTML pages reference it.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MODULES = path.join(ROOT, 'css', 'components', 'modules.css');

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full, ext));
    else if (e.name.endsWith(ext)) out.push(full);
  }
  return out;
}

// All CSS files except modules.css
const cssFiles = walk(path.join(ROOT, 'css'), '.css').filter(f => f !== MODULES);

// Parse modules.css into top-level blocks: comment header + selector + body
const raw = fs.readFileSync(MODULES, 'utf-8').replace(/^\uFEFF/, '');
const lines = raw.split('\n');

// Collect every top-level selector text (lines starting with . or @media handled separately)
const blocks = []; // {selector, line}
let i = 0;
while (i < lines.length) {
  const t = lines[i].trim();
  if (t.startsWith('/*') && !t.includes('*/')) {
    // multi-line comment header — skip to end
    let j = i;
    while (j < lines.length && !lines[j].includes('*/')) j++;
    i = j + 1;
    continue;
  }
  if (t.startsWith('/*')) { i++; continue; }
  if (t.startsWith('@media')) {
    // find matching close brace
    let depth = 0, j = i;
    for (; j < lines.length; j++) {
      depth += (lines[j].match(/\{/g) || []).length;
      depth -= (lines[j].match(/\}/g) || []).length;
      if (depth === 0 && j > i) break;
    }
    // inner selectors
    for (let k = i + 1; k < j; k++) {
      const s = lines[k].trim();
      if (s.startsWith('.') || s.startsWith('@media')) {
        const sel = s.split('{')[0].trim();
        if (sel) blocks.push({ selector: sel, line: k + 1, inMedia: true });
      }
    }
    i = j + 1;
    continue;
  }
  if (t.startsWith('.') || t.startsWith('@')) {
    const sel = t.split('{')[0].trim();
    if (sel) blocks.push({ selector: sel, line: i + 1, inMedia: false });
    // skip body
    let depth = 0, j = i;
    for (; j < lines.length; j++) {
      depth += (lines[j].match(/\{/g) || []).length;
      depth -= (lines[j].match(/\}/g) || []).length;
      if (depth === 0 && j >= i) break;
    }
    i = j + 1;
    continue;
  }
  i++;
}

// Extract the primary class from a selector (first .class, ignoring pseudo/attrs)
function primaryClass(sel) {
  const m = sel.match(/\.([a-zA-Z_][\w-]*)/);
  return m ? m[1] : null;
}

// Read all CSS files into memory, find top-level definitions of a class
const cssCache = cssFiles.map(f => ({ f, text: fs.readFileSync(f, 'utf-8').replace(/^\uFEFF/, '') }));
function topLevelDefs(cls) {
  const re = new RegExp('(^|[\\n,{])\\s*\\.' + cls + '(?![\\w-])', 'g');
  const hits = [];
  for (const { f, text } of cssCache) {
    // only consider selectors that are at nesting depth 0 (no leading whitespace / not inside media)
    const l = text.split('\n');
    let depth = 0;
    for (let n = 0; n < l.length; n++) {
      const line = l[n];
      const before = depth;
      depth += (line.match(/\{/g) || []).length;
      depth -= (line.match(/\}/g) || []).length;
      const s = line.trim();
      if (s.startsWith('/*')) continue;
      const m = s.match(/^\.([a-zA-Z_][\w-]*)/);
      if (m && m[1] === cls && before === 0) {
        hits.push({ file: path.relative(ROOT, f), line: n + 1 });
      }
    }
  }
  return hits;
}

// HTML usage
const distHtml = walk(path.join(ROOT, 'dist'), '.html');
const srcHtml = walk(path.join(ROOT, 'src'), '.html');
const htmlFiles = [...distHtml, ...srcHtml];
const jsFiles = walk(path.join(ROOT, 'js'), '.js');

const htmlCache = htmlFiles.map(f => ({ f, text: fs.readFileSync(f, 'utf-8') }));
const jsText = jsFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');

function pageUsage(cls) {
  const re = new RegExp('(?<![\\w-])' + cls + '(?![\\w-])');
  const pages = new Set();
  for (const { f, text } of htmlCache) {
    // class attribute usage
    const attrs = text.matchAll(/class="([^"]*)"/g);
    let hit = false;
    for (const a of attrs) {
      if (a[1].split(/\s+/).some(c => c === cls)) { hit = true; break; }
    }
    if (hit) pages.add(path.relative(ROOT, f).replace(/\\/g, '/'));
  }
  const inJs = re.test(jsText);
  return { pages: [...pages], inJs };
}

// Compact: dedupe pages by stripping -ar and dir prefixes
function shortPage(p) {
  return p.replace(/^dist\//, '').replace(/^src\//, '').replace(/^pages\//, '');
}
const outLines = [];
outLines.push('modules.css top-level blocks: ' + blocks.length + '\n');
for (const b of blocks) {
  const cls = primaryClass(b.selector);
  const defs = cls ? topLevelDefs(cls) : [];
  const usage = cls ? pageUsage(cls) : { pages: [], inJs: false };
  const defStr = defs.length ? defs.map(d => d.file + ':' + d.line).join(' | ') : '-';
  // dedupe by removing -ar variant
  const uniq = [...new Set(usage.pages.map(p => shortPage(p).replace(/-ar\.html$/, '.html')))];
  const pageStr = uniq.length ? uniq.slice(0, 8).join(', ') + (uniq.length > 8 ? ' …' : '') : '(none)';
  outLines.push('L' + b.line + (b.inMedia ? ' [media]' : '') + '  ' + b.selector);
  outLines.push('     defs: ' + defStr);
  outLines.push('     pages=' + uniq.length + (usage.inJs ? ' +JS' : '') + ': ' + pageStr);
}
const out = outLines.join('\n');
fs.writeFileSync(path.join(ROOT, 'scripts', '_screen-report.txt'), out);
console.log('written scripts/_screen-report.txt (' + out.length + ' bytes)');
