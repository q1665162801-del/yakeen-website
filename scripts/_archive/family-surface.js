/* For each base class, list every selector containing it as a token, grouped by file. */
const fs = require('fs');
const path = require('path');
const { CSS_FILES } = require('../build/config');

const ROOT = path.resolve(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'css');
const BASES = process.argv.slice(2);

function parse(css, onRule) {
  let i = 0;
  const mediaStack = [];
  function skipWs() { while (i < css.length && /\s/.test(css[i])) i++; }
  function skipComment() {
    if (css.substr(i, 2) === '/*') { const e = css.indexOf('*/', i + 2); i = e === -1 ? css.length : e + 2; return true; }
    return false;
  }
  function parseBlock(isTop) {
    while (i < css.length) {
      skipWs();
      if (skipComment()) continue;
      if (i >= css.length) return;
      if (css[i] === '}') { i++; if (isTop) continue; return; }
      const start = i;
      let dp = 0;
      while (i < css.length) {
        const ch = css[i];
        if (ch === '(') dp++;
        else if (ch === ')') dp--;
        else if (ch === '{' && dp === 0) break;
        else if (ch === ';' && dp === 0) break;
        i++;
      }
      if (i >= css.length) return;
      const prelude = css.substring(start, i).trim();
      if (css[i] === ';') { i++; continue; }
      i++;
      if (prelude.startsWith('@')) {
        if (/^@(media|supports|layer)/i.test(prelude)) { mediaStack.push(prelude); parseBlock(false); mediaStack.pop(); }
        else { let d = 1; while (i < css.length && d > 0) { if (css[i] === '{') d++; else if (css[i] === '}') d--; i++; } }
      } else {
        let d = 1;
        while (i < css.length && d > 0) { if (css[i] === '{') d++; else if (css[i] === '}') d--; i++; }
        onRule(prelude, mediaStack.slice());
      }
    }
  }
  parseBlock(true);
}

const bySel = {}; // sel -> Set(file)
for (const file of CSS_FILES) {
  const p = path.join(CSS_DIR, file);
  if (!fs.existsSync(p)) continue;
  parse(fs.readFileSync(p, 'utf-8'), (prelude, mediaStack) => {
    for (const raw of prelude.split(',')) {
      const sel = raw.replace(/\s+/g, ' ').trim();
      if (!sel) continue;
      const tokens = sel.match(/[\w-]+/g) || [];
      for (const base of BASES) {
        if (!tokens.includes(base)) continue;
        const key = sel + (mediaStack.length ? '  ' + mediaStack.join(' && ') : '');
        (bySel[key] = bySel[key] || new Set()).add(file);
      }
    }
  });
}

const rows = Object.entries(bySel).sort((a, b) => a[0].localeCompare(b[0]));
for (const [sel, files] of rows) {
  const flag = files.size > 1 ? '  <<< DUP' : '';
  console.log(`${sel}${flag}`);
  console.log(`    ${[...files].join(', ')}`);
}
