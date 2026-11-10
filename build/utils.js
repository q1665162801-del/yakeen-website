/**
 * build/utils.js — Shared helper functions (file I/O, walk, etc.)
 */
const fs = require('fs');
const path = require('path');

function readFile(p) {
  let content = fs.readFileSync(p, 'utf-8');
  // Strip ALL leading UTF-8 BOMs — external editors (e.g. PowerShell
  // Set-Content -Encoding UTF8) prepend one BOM per write, so files that
  // pass through repeated edits accumulate stacked BOMs. Stripping only one
  // leaves the rest in place and silently breaks front-matter parsing.
  content = content.replace(/^(\uFEFF)+/, '');
  // Normalize line endings to LF (handles CRLF from Windows editors)
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return content;
}

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf-8');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function walkDir(dir, ext = '.html', files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, ext, files);
    } else if (entry.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

// ─── Front-matter parser ───
function parseFrontMatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { data: {}, content };

  const fmText = match[1];
  const data = {};

  for (const line of fmText.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      } else if (val === 'true') {
        val = true;
      } else if (val === 'false') {
        val = false;
      }
      data[m[1]] = val;
    }
  }

  return { data, content: content.slice(match[0].length) };
}

// ─── Calculate relative base path ───
function getBasePath(pageRelPath) {
  const depth = pageRelPath.split(path.sep).length - 1;
  return '../'.repeat(depth);
}

// ─── Simple {{var}} template engine ───
function render(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

// ─── Image references in src/ ───
/**
 * Which images the source templates actually reference, split by usage.
 *
 * The image generators used to walk images/ and emit a variant for every
 * file, which produced derivatives nobody could request (a 768px sibling
 * for an og:image, a -mobile.webp for a hero that is no longer a hero).
 * Those showed up in the orphan gate forever and could not be deleted —
 * the next build recreated them. Generating only what is referenced fixes
 * the cause instead of the symptom.
 *
 * - img:  used by <img src> (build/images.js can emit a mobile <source>)
 * - bg:   used by inline background-image (wired via data-bg-mobile)
 * - hero: subset of bg on page-hero-bg / home-hero-bg (hero pipelines)
 */
function collectImageRefs() {
  const srcDir = path.join(__dirname, '..', 'src');
  const img = new Set();
  const bg = new Set();
  const hero = new Set();

  const strip = (url) => url.replace(/[?#].*$/, '');
  const toRel = (url) => {
    const i = url.indexOf('images/');
    return i === -1 ? null : strip(url.slice(i + 'images/'.length));
  };

  for (const file of walkDir(srcDir, '.html')) {
    const text = readFile(file);

    for (const m of text.matchAll(/<img\b[^>]*>/gi)) {
      const src = (m[0].match(/\ssrc\s*=\s*["']([^"']+)["']/i) || [])[1];
      const rel = src && toRel(src);
      if (rel) img.add(rel);
    }

    for (const m of text.matchAll(/<div\b[^>]*>/gi)) {
      const tag = m[0];
      const url = (tag.match(/background-image\s*:\s*url\(\s*["']?([^"')]+)/i) || [])[1];
      const rel = url && toRel(url);
      if (!rel) continue;
      bg.add(rel);
      if (/page-hero-bg|home-hero-bg/.test(tag)) hero.add(rel);
    }
  }

  return { img, bg, hero };
}

module.exports = {
  readFile,
  writeFile,
  copyDir,
  walkDir,
  parseFrontMatter,
  getBasePath,
  render,
  collectImageRefs,
};
