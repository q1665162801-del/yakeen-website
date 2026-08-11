/**
 * ponytail: fix CSS/JS not copied to output dir on Windows.
 * Astro's build generates CSS in .astro/ but ENOENT from reparse points
 * prevents Vite from copying them to the output dir.
 * This script copies _astro assets manually — zero deps, just fs.
 */
const fs = require('node:fs');
const path = require('node:path');
const { tmpdir } = require('node:os');

const src = path.join(__dirname, '..', '.astro');
const dst = path.join(tmpdir(), 'yakeen-dist', '_astro');

if (!fs.existsSync(src)) {
  console.error('[copy-astro-assets] .astro dir not found, skipping');
  process.exit(0);
}

fs.mkdirSync(dst, { recursive: true });

// ponytail: recursive scan — CSS/JS can be in subdirs like .astro/chunks/
let copied = 0;
function copyDir(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // ponytail: skip corrupted subdirs silently
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      copyDir(path.join(dir, entry.name));
    } else if (entry.name.endsWith('.css') || entry.name.endsWith('.js')) {
      fs.copyFileSync(path.join(dir, entry.name), path.join(dst, entry.name));
      copied++;
    }
  }
}
copyDir(src);
console.log(`[copy-astro-assets] Copied ${copied} CSS/JS files to ${dst}`);

// ponytail: Astro doesn't copy public/ files to custom outDir on Windows — copy them manually
const publicDir = path.join(__dirname, '..', 'public');
const outDir = path.join(tmpdir(), 'yakeen-dist');
if (fs.existsSync(publicDir)) {
  let pubCopied = 0;
  for (const entry of fs.readdirSync(publicDir, { withFileTypes: true })) {
    if (entry.isFile()) {
      fs.copyFileSync(path.join(publicDir, entry.name), path.join(outDir, entry.name));
      pubCopied++;
    }
  }
  console.log(`[copy-astro-assets] Copied ${pubCopied} public files to ${outDir}`);
}
