/* Cascade snapshot verifier.
   For a set of target selectors, computes the EFFECTIVE declaration map at
   several sample viewport widths, in real source order (build/config CSS_FILES).
   Run before and after a refactor; the JSON must be byte-identical. */

const fs = require('fs');
const path = require('path');
const { CSS_FILES } = require('../build/config');

const ROOT = path.resolve(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'css');

const TARGETS = process.argv.slice(2);
if (TARGETS.length === 0) {
  console.error('usage: node scripts/verify-cascade.js .class-a .class-b ...');
  process.exit(1);
}

const WIDTHS = [1440, 1000, 800, 700, 620, 560, 500, 420, 360];

// ── Token resolution (single pass, top-level :root/html/body only) ──
// Media-scoped variable overrides (e.g. @media (prefers-contrast)) must NOT
// leak into the default resolution, otherwise every colour in the snapshot is
// wrong. We only collect declarations from unconditional var scopes.
const varMap = {};
const VAR_SCOPE = /^(:root|html|body)\b/;
function collectVarsFromRule(prelude, body) {
  if (!VAR_SCOPE.test(prelude.trim())) return;
  const re = /(--[\w-]+)\s*:\s*([^;{}]+);/g;
  let m;
  while ((m = re.exec(body)) !== null) varMap[m[1]] = m[2].trim();
}
function resolveVars(value, depth = 0) {
  if (depth > 8 || !value.includes('var(')) return value;
  const out = value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g, (_, name, fallback) => {
    if (varMap[name] !== undefined) return varMap[name];
    return fallback !== undefined ? fallback.trim() : '';
  });
  return out === value ? value : resolveVars(out, depth + 1);
}

// ── Parser: walk CSS, tracking @media context and brace depth ──
function parse(css, onRule) {
  let i = 0;
  const mediaStack = [];

  function skipWs() { while (i < css.length && /\s/.test(css[i])) i++; }
  function skipComment() {
    if (css.substr(i, 2) === '/*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 2;
      return true;
    }
    return false;
  }

  function parseBlock(isTop) {
    while (i < css.length) {
      skipWs();
      if (skipComment()) continue;
      if (i >= css.length) return;

      if (css[i] === '}') {
        i++;
        // A stray `}` at stylesheet top level is discarded by real CSS parsers;
        // inside a block it closes that block.
        if (isTop) continue;
        return;
      }

      // read prelude up to { or ;
      const start = i;
      let depthParen = 0;
      while (i < css.length) {
        const ch = css[i];
        if (ch === '(') depthParen++;
        else if (ch === ')') depthParen--;
        else if (ch === '{' && depthParen === 0) break;
        else if (ch === ';' && depthParen === 0) break;
        i++;
      }
      if (i >= css.length) return;
      const prelude = css.substring(start, i).trim();

      if (css[i] === ';') { i++; continue; }

      // at '{'
      i++;
      if (prelude.startsWith('@')) {
        if (/^@(media|supports|layer)/i.test(prelude)) {
          mediaStack.push(prelude);
          parseBlock(false);
          mediaStack.pop();
        } else {
          // @keyframes / @font-face etc — skip block wholesale
          let d = 1;
          while (i < css.length && d > 0) {
            if (css[i] === '{') d++;
            else if (css[i] === '}') d--;
            i++;
          }
        }
      } else {
        // style rule
        const bodyStart = i;
        let d = 1;
        while (i < css.length && d > 0) {
          if (css[i] === '{') d++;
          else if (css[i] === '}') d--;
          i++;
        }
        const body = css.substring(bodyStart, i - 1);
        onRule(prelude, body, mediaStack.slice());
      }
    }
  }

  parseBlock(true);
}

function declMap(body) {
  const out = [];
  let i = 0;
  while (i < body.length) {
    if (body.substr(i, 2) === '/*') { const e = body.indexOf('*/', i + 2); i = e === -1 ? body.length : e + 2; continue; }
    let j = i, depth = 0;
    while (j < body.length) {
      const ch = body[j];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === ';' && depth === 0) break;
      else if (ch === '{' && depth === 0) break;
      j++;
    }
    const part = body.substring(i, j).trim();
    if (part && part.includes(':')) {
      const idx = part.indexOf(':');
      out.push([part.substring(0, idx).trim(), part.substring(idx + 1).trim()]);
    }
    i = j + 1;
  }
  return out;
}

// ── Normalize a single selector for comparison ──
function norm(sel) {
  return sel.replace(/\s+/g, ' ').trim();
}

// ── Normalize a declaration VALUE into a comparable computed form ──
// Two declaration sets that render identically must normalize to the same map,
// otherwise a pure "move the rule" refactor looks like a regression.
const ROOT_FONT_PX = 16;

function normalizeValue(v) {
  let out = resolveVars(v.trim());
  // rem → px (root font-size is 16px)
  out = out.replace(/(-?\d*\.?\d+)rem\b/g, (_, n) => `${parseFloat(n) * ROOT_FONT_PX}px`);
  // collapse whitespace introduced by var() resolution
  return out.replace(/\s+/g, ' ').trim();
}

// Expand `margin` / `padding` shorthands into per-side longhands so that
// `margin: 0 0 28px` and (`margin: 0 0 32px` + `margin-bottom: 28px`) compare equal.
const BOX_SHORTHANDS = { margin: 'margin', padding: 'padding' };

function expandDecl(prop, value) {
  const base = BOX_SHORTHANDS[prop];
  if (!base) return [[prop, value]];
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length < 1 || parts.length > 4) return [[prop, value]];
  let t, r, b, l;
  if (parts.length === 1) t = r = b = l = parts[0];
  else if (parts.length === 2) { t = b = parts[0]; r = l = parts[1]; }
  else if (parts.length === 3) { t = parts[0]; r = l = parts[1]; b = parts[2]; }
  else { t = parts[0]; r = parts[1]; b = parts[2]; l = parts[3]; }
  return [
    [`${base}-top`, t],
    [`${base}-right`, r],
    [`${base}-bottom`, b],
    [`${base}-left`, l],
  ];
}

// ── Specificity (a,b,c) for a simple selector ──
function specificity(sel) {
  const ids = (sel.match(/#[\w-]+/g) || []).length;
  const cls = (sel.match(/\.[\w-]+/g) || []).length
    + (sel.match(/\[[^\]]*\]/g) || []).length
    + (sel.match(/:(?!:)[\w-]+/g) || []).length;
  const els = (sel.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) || []).length
    + (sel.match(/::[\w-]+/g) || []).length;
  return ids * 10000 + cls * 100 + els;
}

function mediaMatches(media, width) {
  if (!media) return true;
  const min = /min-width\s*:\s*(\d+)px/.exec(media);
  const max = /max-width\s*:\s*(\d+)px/.exec(media);
  if (min && width < parseInt(min[1], 10)) return false;
  if (max && width > parseInt(max[1], 10)) return false;
  return true;
}

// ── Build occurrence list ──
const occurrences = []; // { selector, media, decls, order }
let order = 0;

const fileCache = CSS_FILES.map(f => {
  const p = path.join(CSS_DIR, f);
  return fs.existsSync(p) ? { file: f, css: fs.readFileSync(p, 'utf-8') } : null;
}).filter(Boolean);

// Pass 1 — collect every unconditional var definition (last one wins).
for (const { css } of fileCache) {
  parse(css, (prelude, body, mediaStack) => {
    if (mediaStack.length === 0) collectVarsFromRule(prelude, body);
  });
}

// Pass 2 — collect every rule occurrence in source order.
for (const { file, css } of fileCache) {
  parse(css, (prelude, body, mediaStack) => {
    const media = mediaStack.length ? mediaStack.join(' && ') : null;
    for (const raw of prelude.split(',')) {
      const sel = norm(raw);
      if (!sel) continue;
      occurrences.push({
        file,
        selector: sel,
        media,
        decls: declMap(body),
        spec: specificity(sel),
        order: order++,
      });
    }
  });
}

// ── Snapshot ──
const snapshot = {};
for (const target of TARGETS) {
  snapshot[target] = {};
  for (const w of WIDTHS) {
    const eff = {};
    for (const occ of occurrences) {
      if (occ.selector !== target) continue;
      if (!mediaMatches(occ.media, w)) continue;
      for (const [prop, rawVal] of occ.decls) {
        for (const [p, v] of expandDecl(prop, normalizeValue(rawVal))) {
          const prev = eff[p];
          if (!prev || occ.spec >= prev.spec) {
            eff[p] = { value: v, spec: occ.spec, from: occ.file, order: occ.order };
          }
        }
      }
    }
    const clean = {};
    for (const k of Object.keys(eff).sort()) clean[k] = eff[k].value;
    snapshot[target][w] = clean;
  }
}

process.stdout.write(JSON.stringify(snapshot, null, 1));
