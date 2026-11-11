/**
 * build/bg-lazy.js — Lazy-load below-the-fold background images
 *
 * Every non-hero card background is written as an inline
 * `style="background-image: url(...)"`. The previous implementation kept that
 * declaration as the no-JS fallback, which meant the browser fetched the
 * full-size original while parsing the page and only then asked the loader for
 * the WebP / 768px variant — every card image was downloaded twice.
 *
 * New approach: the inline declaration is replaced by a generated class whose
 * rules live in a <noscript><style> block, so
 *   - no-JS visitors still see the image (and phones get the 768px variant
 *     through the media query),
 *   - JS visitors download nothing until the element approaches the viewport,
 *   - only one file is ever requested per element.
 *
 * Hero elements (page-hero-bg, home-hero-bg, hero-bg-*) are skipped — they are
 * above the fold and must paint immediately.
 */

const fs = require('fs');
const path = require('path');
const { DIST } = require('./config');

const MOBILE_BREAKPOINT = '768px';

// Classes that should NOT be lazy-loaded (hero / above-the-fold)
const SKIP_CLASSES = ['page-hero-bg', 'home-hero-bg', 'hero-bg-'];

function shouldSkip(classAttr) {
  if (!classAttr) return false;
  return SKIP_CLASSES.some(cls => classAttr.includes(cls));
}

function resolveAgainstPage(candidate, filePath) {
  return candidate.startsWith('/')
    ? path.join(DIST, candidate.slice(1))
    : path.resolve(path.dirname(filePath), candidate);
}

/**
 * Return the WebP twin URL for a JPG background, or null if it doesn't exist.
 */
function webpTwin(bgUrl, filePath) {
  if (/\.webp$/i.test(bgUrl)) return null;
  const candidate = bgUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  return fs.existsSync(resolveAgainstPage(candidate, filePath)) ? candidate : null;
}

/**
 * Return the 768px WebP variant for a background image, or null.
 * Content cards are full-size URLs on desktop but only ~400-700px wide on
 * phones; without this the phone downloads the 1600px original.
 */
function mobileTwin(bgUrl, filePath) {
  const base = bgUrl.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  if (/-(mobile|768|480)$/i.test(base)) return null;
  const candidate = `${base}-768.webp`;
  return fs.existsSync(resolveAgainstPage(candidate, filePath)) ? candidate : null;
}

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  let count = 0;
  const rules = [];

  // Elements carrying an inline background-image (jpg / png / webp)
  const re = /<([a-zA-Z0-9]+)([^>]*\sstyle="[^"]*background-image:\s*url\(['"]?([^'")]+\.(?:jpg|jpeg|png|webp))['"]?\)[^>]*"[^>]*)>/gi;

  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[1];
    const attrs = m[2];
    const bgUrl = m[3];
    const fullMatch = m[0];

    const classMatch = attrs.match(/class="([^"]*)"/);
    const classAttr = classMatch ? classMatch[1] : '';

    // Skip hero elements — above the fold, must load immediately
    if (shouldSkip(classAttr)) continue;

    const desktopUrl = webpTwin(bgUrl, filePath) || bgUrl;
    const mobileUrl = mobileTwin(desktopUrl, filePath);

    const cls = `bg-img-${count}`;
    count++;

    let newAttrs = attrs;
    if (classMatch) {
      newAttrs = newAttrs.replace(/class="([^"]*)"/, `class="$1 lazy-bg ${cls}"`);
    } else {
      newAttrs = ` class="lazy-bg ${cls}"${newAttrs}`;
    }

    // Drop only the background-image declaration; any other inline style stays.
    newAttrs = newAttrs
      .replace(/background-image:\s*url\(['"]?[^'")]+['"]?\)\s*;?\s*/, '')
      .replace(/style="\s*"/, '');

    newAttrs += ` data-bg="${desktopUrl}"`;
    if (mobileUrl) newAttrs += ` data-bg-mobile="${mobileUrl}"`;

    let rule = `.${cls}{background-image:url('${desktopUrl}')}`;
    if (mobileUrl) {
      rule += `@media (max-width:${MOBILE_BREAKPOINT}){.${cls}{background-image:url('${mobileUrl}')}}`;
    }
    rules.push(rule);

    const newTag = `<${tag}${newAttrs}>`;
    html = html.substring(0, m.index) + newTag + html.substring(m.index + fullMatch.length);
    re.lastIndex = m.index + newTag.length;
  }

  if (count === 0) return 0;

  // The class rules are the no-JS fallback. JS visitors never fetch them: the
  // loader writes the URL inline only once the element is near the viewport.
  if (rules.length) {
    html = html.replace('</head>', `  <noscript><style data-build-bg="1">${rules.join('')}</style></noscript>\n</head>`);
  }

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
