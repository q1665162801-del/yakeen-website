/**
 * One-off: point every inquiry form at the /api/lead endpoint.
 *
 * FormSubmit's config inputs (_subject, _template, _captcha, _next, _redirect,
 * _gotcha) are no longer read by the browser — the proxy owns them now — so
 * they are removed, along with the comment that labelled them. The honeypot
 * is kept.
 *
 * Idempotent. Dry run by default; pass --apply to write.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const PAGES = path.join(ROOT, 'src', 'pages');
const APPLY = process.argv.includes('--apply');

const ACTION = /action="https:\/\/formsubmit\.co\/\{\{EMAIL\}\}"/;
const DROP = /^\s*<input type="hidden" name="_(subject|template|captcha|next|redirect|gotcha)"[^>]*>\s*$/;
const STALE_COMMENT = /^\s*<!-- FormSubmit config -->[ \t]*$/m;
const HONEY_STYLE = /(<input type="text" name="_honey") style="display:none"/g;

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

let touched = 0;

for (const file of walk(PAGES, [])) {
  const original = fs.readFileSync(file, 'utf8');
  if (!ACTION.test(original) && !STALE_COMMENT.test(original)) continue;

  const lines = original.split('\n');
  const kept = lines.filter(function (line) {
    return !DROP.test(line) && !STALE_COMMENT.test(line);
  });

  const next = kept
    .join('\n')
    .replace(ACTION, 'action="/api/lead"')
    .replace(HONEY_STYLE, '$1 class="hp-field"');

  if (next === original) continue;

  const rel = path.relative(PAGES, file).replace(/\\/g, '/');
  console.log((APPLY ? 'apply ' : 'dry   ') + rel + '  -' + (lines.length - kept.length) + ' line(s)');

  if (APPLY) fs.writeFileSync(file, next);
  touched++;
}

console.log('\n' + touched + ' file(s) ' + (APPLY ? 'updated.' : 'would be updated.'));
if (!APPLY) console.log('Re-run with --apply to write changes.');
