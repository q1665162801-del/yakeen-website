/**
 * build/bg-lazy.js — Mark below-the-fold background images for lazy loading
 * 
 * Adds data-bg attribute + lazy-bg class to elements with inline
 * background-image (non-hero only). data-bg points at the WebP twin when
 * one exists; the inline JPG style stays as the no-JS fallback.
 * 
 * IMPORTANT: The inline style is PRESERVED — this is the no-JS fallback.
 * The lazy-loader JS injects a CSS rule with !important that overrides
 * the inline style when JS is enabled.
 * 
 * Hero elements (page-hero-bg, home-hero-bg, hero-bg-*) are skipped
 * because they're above-the-fold and should load immediately.
 */

const fs = require('fs');
const path = require('path');
const { DIST } = require('./config');

// Classes that should NOT be lazy-loaded (hero / above-the-fold)
const SKIP_CLASSES = ['page-hero-bg', 'home-hero-bg', 'hero-bg-'];

function shouldSkip(classAttr) {
  if (!classAttr) return false;
  return SKIP_CLASSES.some(cls => classAttr.includes(cls));
}

/**
 * Return the WebP twin URL for a JPG background, or null if it doesn't exist.
 * The inline style keeps the JPG (no-JS fallback); only data-bg is switched,
 * so the browser never downloads the JPG when JS runs.
 */
function webpTwin(bgUrl, filePath) {
  if (/\.webp$/i.test(bgUrl)) return null;
  const candidate = bgUrl.replace(/\.(jpg|jpeg)$/i, '.webp');
  const absPath = candidate.startsWith('/')
    ? path.join(DIST, candidate.slice(1))
    : path.resolve(path.dirname(filePath), candidate);
  return fs.existsSync(absPath) ? candidate : null;
}

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  let count = 0;

  // Match elements with inline background-image (jpg or webp)
  const re = /<([a-zA-Z0-9]+)([^>]*\sstyle="[^"]*background-image:\s*url\(['"]?([^'")]+\.(?:jpg|webp))['"]?\)[^"]*"[^>]*)>/gi;

  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[1];
    const attrs = m[2];
    const bgUrl = m[3];
    const fullMatch = m[0];

    // Extract class attribute
    const classMatch = attrs.match(/class="([^"]*)"/);
    const classAttr = classMatch ? classMatch[1] : '';

    // Skip hero elements
    if (shouldSkip(classAttr)) continue;

    // Build new attrs: add lazy-bg class + data-bg attribute
    // (inline style stays for no-JS fallback)
    let newAttrs = attrs;

    // Add lazy-bg class
    if (classMatch) {
      newAttrs = newAttrs.replace(/class="([^"]*)"/, `class="$1 lazy-bg"`);
    } else {
      newAttrs = ` class="lazy-bg"${newAttrs}`;
    }

    // Add data-bg attribute — prefer the WebP twin when it exists.
    // The inline JPG style above stays as the no-JS fallback, so only JS
    // clients (which can decode WebP) ever request the WebP file.
    const lazyUrl = webpTwin(bgUrl, filePath) || bgUrl;
    newAttrs = newAttrs + ` data-bg="${lazyUrl}"`;

    const newTag = `<${tag}${newAttrs}>`;
    html = html.substring(0, m.index) + newTag + html.substring(m.index + fullMatch.length);
    
    // Adjust regex lastIndex for the replacement
    re.lastIndex = m.index + newTag.length;
    count++;
  }

  if (count === 0) return 0;

  fs.writeFileSync(filePath, html, 'utf8');
  return count;
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let totalCount = 0;
  let pageCount = 0;
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const result = walkDir(fullPath);
      totalCount += result.totalCount;
      pageCount += result.pageCount;
    } else if (entry.name.endsWith('.html')) {
      const count = processFile(fullPath);
      if (count > 0) {
        totalCount += count;
        pageCount++;
      }
    }
  }
  return { totalCount, pageCount };
}

function bgLazyMark() {
  const { totalCount, pageCount } = walkDir(DIST);
  console.log(`   ✅ ${totalCount} images across ${pageCount} pages marked for lazy loading`);
  return { totalCount, pageCount };
}

// Run if called directly
if (require.main === module) {
  bgLazyMark();
}

module.exports = { bgLazyMark };
