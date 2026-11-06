/* Dump full rule bodies for target selectors, in source order. */
const fs = require('fs');
const path = require('path');
const { CSS_FILES } = require('../build/config');

const ROOT = path.resolve(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'css');
const TARGETS = process.argv.slice(2);

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
        const bodyStart = i;
        let d = 1;
        while (i < css.length && d > 0) { if (css[i] === '{') d++; else if (css[i] === '}') d--; i++; }
        const body = css.substring(bodyStart, i - 1);
        onRule(prelude, body, mediaStack.slice());
      }
    }
  }
  parseBlock(true);
}

let order = 0;
for (const file of CSS_FILES) {
  const p = path.join(CSS_DIR, file);
  if (!fs.existsSync(p)) continue;
  const css = fs.readFileSync(p, 'utf-8');
  parse(css, (prelude, body, mediaStack) => {
    for (const raw of prelude.split(',')) {
      const sel = raw.replace(/\s+/g, ' ').trim();
      if (TARGETS.includes(sel)) {
        console.log(`\n=== ${sel}  @${file}  media=${mediaStack.join(' && ') || '(none)'}  order=${order}`);
        console.log(body.trim().replace(/\n\s+/g, '\n  '));
      }
    }
    order++;
  });
}
