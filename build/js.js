/**
 * build/js.js — JS builder: concatenate + minify source files into content-hashed bundle
 * Outputs content-hashed filename for cache-busting (same strategy as CSS).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ROOT, DIST, JS_BUNDLES } = require('./config');

/**
 * Minify JS without corrupting string, template, or regex literals.
 *
 * The previous whitespace pass ran over the whole source, so it also rewrote
 * the *insides* of literals — e.g. it collapsed the string
 *   '0px 0px -50px 0px'
 * into
 *   '0px 0px-50px 0px'
 * which is an invalid CSS margin and made `new IntersectionObserver(...)`
 * throw at runtime, silently killing the stat counters.
 *
 * This version walks the source once, lifts every literal and comment into a
 * stand-in token, applies the whitespace pass to the remaining code only, then
 * restores the literals byte-for-byte. Workarounds such as splitting
 * '0px 0px ' + '-40px 0px' are no longer needed.
 */
function minifyJS(js) {
  const literals = [];

  function placeholder(text) {
    literals.push(text);
    return '\u0001' + (literals.length - 1) + '\u0001';
  }

  // Pass 1 — extract literals & comments into placeholders.
  let lifted = '';
  let i = 0;
  const n = js.length;
  let prev = ''; // last non-space char emitted outside a literal

  while (i < n) {
    const ch = js[i];
    const next = js[i + 1];

    // Line comment — keep the newline so no two tokens get glued together.
    if (ch === '/' && next === '/') {
      let j = i + 2;
      while (j < n && js[j] !== '\n') j++;
      lifted += '\n';
      i = j;
      continue;
    }

    // Block comment — collapse to a single space for the same reason.
    if (ch === '/' && next === '*') {
      let j = i + 2;
      while (j < n && !(js[j] === '*' && js[j + 1] === '/')) j++;
      j = Math.min(j + 2, n);
      lifted += ' ';
      i = j;
      continue;
    }

    // String / template literal.
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      let j = i + 1;
      while (j < n) {
        if (js[j] === '\\') { j += 2; continue; }
        if (js[j] === quote) { j++; break; }
        j++;
      }
      lifted += placeholder(js.slice(i, Math.min(j, n)));
      i = Math.min(j, n);
      prev = quote;
      continue;
    }

    // Regex literal — only where a value may not legally follow.
    if (ch === '/' && (prev === '' || '(,=:[!&|?{};+-*%^<>~'.indexOf(prev) !== -1)) {
      let j = i + 1;
      let inClass = false;
      while (j < n) {
        const c = js[j];
        if (c === '\\') { j += 2; continue; }
        if (c === '[') inClass = true;
        else if (c === ']') inClass = false;
        else if (c === '/' && !inClass) { j++; break; }
        else if (c === '\n') break;
        j++;
      }
      while (j < n && /[a-z]/i.test(js[j])) j++; // flags
      lifted += placeholder(js.slice(i, Math.min(j, n)));
      i = Math.min(j, n);
      prev = ')';
      continue;
    }

    lifted += ch;
    if (!/\s/.test(ch)) prev = ch;
    i++;
  }

  // Pass 2 — whitespace pass, code only (literals are out of reach now).
  let out = lifted
    .replace(/\n\s*\n/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*([{}();,:=<>+\-*\/!&|?])\s*/g, '$1')
    .trim();

  // Pass 3 — put the literals back, verbatim.
  return out.replace(/\u0001(\d+)\u0001/g, (_, idx) => literals[Number(idx)]);
}

function buildJS() {
  const JS_DIR = path.join(ROOT, 'js');
  const OUT_DIR = path.join(DIST, 'js');

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  let resultFile = null;

  for (const bundle of JS_BUNDLES) {
    let output = '';
    let found = 0;

    for (const file of bundle.files) {
      const filePath = path.join(JS_DIR, file);
      if (fs.existsSync(filePath)) {
        const src = fs.readFileSync(filePath, 'utf-8').trim();
        // Every module is wrapped in its own try/catch. The files are
        // concatenated into one script, so a synchronous throw at the top of
        // any module used to abort the rest of the bundle silently — a nested
        // submit button once killed four unrelated modules that way, including
        // the newsletter modal. The newlines around src matter: without them a
        // trailing line comment would swallow the closing brace and the catch
        // clause.
        output +=
          'try {\n' + src + '\n} catch (e) {\n' +
          '  console.error("[yakeen] ' + file + ' failed to initialise", e);\n' +
          '}\n\n';
        found++;
      } else {
        console.warn(`  ⚠️  JS file not found: ${file}`);
      }
    }

    const minified = minifyJS(output);
    const hash = crypto.createHash('md5').update(minified).digest('hex').slice(0, 8);
    const hashedName = `${bundle.output}.${hash}.js`;

    fs.writeFileSync(path.join(OUT_DIR, hashedName), minified);
    const saved = ((output.length - minified.length) / output.length * 100).toFixed(1);
    console.log(`📦 Built JS: ${found}/${bundle.files.length} files → ${hashedName} (${(minified.length / 1024).toFixed(1)} KB, -${saved}%)`);

    resultFile = hashedName;
  }

  return resultFile;
}

module.exports = { buildJS };
