/**
 * build/css.js — CSS builder: concatenate + minify + purge unused
 * Outputs content-hashed filename for cache-busting.
 *
 * Two-phase usage:
 *   1. buildCSS()                  — concat + minify (fast, for initial page build)
 *   2. purgeCSSFile(name, htmlDir) — purge based on built HTML, return new hashed name
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PurgeCSS } = require('purgecss');
const { ROOT, DIST, CSS_FILES } = require('./config');

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, ext));
    } else if (!ext || entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

// Safelist: selectors PurgeCSS must keep even if not found in content
const SAFELIST = {
  // [dir="rtl"] is set on <html> by the build system
  greedy: [/\[dir=.rtl.\]/],
  // Dynamic state classes added by JS at runtime
  standard: [
    'revealed', 'is-open', 'is-visible', 'show', 'active',
    'nav--scrolled', 'img-loaded',
    'section-cta',
    'cta-banner', 'cta-banner-glow', 'cta-banner-inner',
    'cta-banner-text', 'cta-banner-eyebrow', 'cta-banner-title',
    'cta-banner-desc', 'cta-banner-action', 'cta-banner-sub',
  ],
  // Pseudo-class / pseudo-element patterns on dynamic components
  deep: [
    /nth-child/,
    /::before/,
    /::after/,
  ],
};

/**
 * Phase 1: Concatenate all CSS files and minify (no purge).
 * Used for the initial page build so HTML has a CSS file to reference.
 */
async function buildCSS() {
  const CSS_DIR = path.join(ROOT, 'css');
  const OUT_DIR = path.join(DIST, 'css');

  let output = '';
  let found = 0;

  for (const file of CSS_FILES) {
    const filePath = path.join(CSS_DIR, file);
    if (fs.existsSync(filePath)) {
      output += fs.readFileSync(filePath, 'utf-8').trim() + '\n\n';
      found++;
    } else {
      console.warn(`  ⚠️  CSS file not found: ${file}`);
    }
  }

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const minified = minifyCSS(output);
  const hash = crypto.createHash('md5').update(minified).digest('hex').slice(0, 8);
  const hashedName = `yakeen.${hash}.css`;

  fs.writeFileSync(path.join(OUT_DIR, hashedName), minified);
  const totalSaved = ((output.length - minified.length) / output.length * 100).toFixed(1);

  console.log(`🎨 Built CSS: ${found}/${CSS_FILES.length} files → ${hashedName}`);
  console.log(`   Minify: -${totalSaved}%  ·  Final: ${(minified.length / 1024).toFixed(1)} KB`);

  // Standalone files (not bundled). These are content-hashed too: the
  // `_headers` rule caches /css/*.css as immutable for one year, which is
  // only safe when every CSS file carries its own hash in the filename.
  const standaloneFiles = ['themes/rtl.css'];
  let rtlCssFile = null;
  for (const file of standaloneFiles) {
    const srcPath = path.join(CSS_DIR, file);
    if (!fs.existsSync(srcPath)) continue;
    const content = fs.readFileSync(srcPath, 'utf-8').trim() + '\n';
    const standaloneHash = crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
    const standaloneName = `${path.basename(file, '.css')}.${standaloneHash}.css`;
    fs.writeFileSync(path.join(OUT_DIR, standaloneName), content);
    if (file === 'themes/rtl.css') rtlCssFile = standaloneName;
  }
  if (rtlCssFile) console.log(`🎨 Built standalone CSS: rtl.css → ${rtlCssFile}`);

  return { cssFile: hashedName, rtlCssFile };
}

/**
 * Phase 2: Purge an already-built CSS file using HTML from dist/ as content source.
 * Writes a new hashed file and returns its name.
 *
 * @param {string} currentName — current CSS filename (in dist/css/)
 * @param {string} htmlDir — directory of built HTML files to scan (usually DIST)
 * @returns {string} new hashed filename
 */
async function purgeCSSFile(currentName, htmlDir) {
  const OUT_DIR = path.join(DIST, 'css');
  const cssPath = path.join(OUT_DIR, currentName);
  const css = fs.readFileSync(cssPath, 'utf-8');

  // Collect all HTML files from the built output
  const htmlFiles = walk(htmlDir, '.html');
  const content = htmlFiles.map(p => ({
    raw: fs.readFileSync(p, 'utf-8'),
    extension: 'html',
  }));

  // Also scan runtime JS for dynamic class names
  const jsFiles = walk(path.join(ROOT, 'js'), '.js');
  for (const p of jsFiles) {
    content.push({ raw: fs.readFileSync(p, 'utf-8'), extension: 'js' });
  }

  const result = await new PurgeCSS().purge({
    content,
    css: [{ raw: css }],
    safelist: SAFELIST,
    fontFace: true,
    keyframes: true,
    variables: false,
  });

  const purged = result[0].css;
  const purgeSaved = ((css.length - purged.length) / css.length * 100).toFixed(1);

  // Re-minify (purge output may have whitespace)
  const minified = minifyCSS(purged);
  const hash = crypto.createHash('md5').update(minified).digest('hex').slice(0, 8);
  const newName = `yakeen.${hash}.css`;

  if (newName === currentName) {
    // Same content — nothing changed, keep original file
    console.log(`   Purge: 0% (no change)`);
    return currentName;
  }

  fs.writeFileSync(path.join(OUT_DIR, newName), minified);
  // Remove old file
  try { fs.unlinkSync(cssPath); } catch (_) {}

  console.log(`   Purge: -${purgeSaved}%  →  ${newName} (${(minified.length / 1024).toFixed(1)} KB)`);

  return newName;
}

module.exports = { buildCSS, purgeCSSFile, minifyCSS };
