/**
 * build/hero-webp.js — Optimize hero background images
 * 
 * 1. Moves background-image from inline style to a page-level <style> block
 *    using unique classes. Prevents double-download (JPG + WebP).
 * 2. Adds responsive mobile hero (768px wide WebP) for screens ≤ 768px.
 * 3. Injects <link rel="preload"> for the hero WebP image.
 * 
 * Mobile hero images are ~80% smaller than desktop versions, making a huge
 * difference on mobile data plans and slower networks.
 */
const fs = require('fs');
const path = require('path');
const { DIST } = require('./config');

const MOBILE_BREAKPOINT = '768px';

function findHeroBgImages(html) {
  // Find all hero bg divs with JPG background-image in inline style
  const re = /<div([^>]*class="[^"]*(?:page-hero-bg|home-hero-bg)[^"]*"[^>]*style="[^"]*background-image:\s*url\(['"]?([^'")]+\.jpg)['"]?\)[^"]*"[^>]*)>/gi;
  const results = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    results.push({
      fullMatch: m[0],
      attrs: m[1],
      jpgUrl: m[2],
    });
  }
  return results;
}

function mobileWebpExists(jpgUrl) {
  // Hero-specific 768px render first, then the generic -768.webp sibling
  // that build/responsive-images.js creates for content images.
  const base = jpgUrl.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  for (const candidate of [`${base}-mobile.webp`, `${base}-768.webp`]) {
    const rel = candidate.startsWith('/') ? candidate.slice(1) : candidate;
    if (fs.existsSync(path.join(DIST, rel))) return candidate;
  }
  return null;
}

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Build CSS rules and update each div
  const cssRules = [];
  const heroBgs = findHeroBgImages(html);
  let heroIndex = 0;
  let firstHeroWebp = null;
  let firstHeroMobileWebp = null;

  for (const bg of heroBgs) {
    const jpgUrl = bg.jpgUrl;
    const webpUrl = jpgUrl.replace(/\.jpg$/, '.webp');
    const webpRelPath = webpUrl.startsWith('/') ? webpUrl.slice(1) : webpUrl;
    const webpAbsPath = path.join(DIST, webpRelPath);

    if (!fs.existsSync(webpAbsPath)) {
      // No desktop WebP twin. Keep the inline JPG for desktop and only swap in
      // the 768px variant on phones — !important is required because the
      // inline style would otherwise win over this rule.
      const mobileOnly = mobileWebpExists(jpgUrl);
      if (!mobileOnly) continue;
      const cls = `hero-bg-${heroIndex++}`;
      cssRules.push(
        `@media (max-width: ${MOBILE_BREAKPOINT}) { .${cls} { background-image: url('${mobileOnly}') !important; } }`
      );
      const attrs = bg.attrs.replace(/(class="[^"]*)/, `$1 ${cls}`);
      html = html.replace(bg.fullMatch, `<div${attrs}>`);
      changed = true;
      continue;
    }

    const className = `hero-bg-${heroIndex}`;
    heroIndex++;

    // Desktop: plain WebP url. Do NOT wrap this in image-set(): a single-candidate
    // image-set() adds nothing but breaks every browser older than Safari 17 /
    // Chrome 112 (iOS 16 and below), where the declaration is dropped and the
    // hero background disappears — including inside the Instagram in-app browser.
    let cssRule = `.${className} { background-image: url('${webpUrl}'); }`;

    // Mobile: smaller 768px WebP if available
    const mobileUrl = mobileWebpExists(jpgUrl);
    if (mobileUrl) {
      cssRule += `\n@media (max-width: ${MOBILE_BREAKPOINT}) { .${className} { background-image: url('${mobileUrl}'); } }`;
    }

    cssRules.push(cssRule);

    // Update the div: add class, remove inline background-image
    const newAttrs = bg.attrs
      .replace(/(class="[^"]*)/, `$1 ${className}`)
      .replace(/background-image:\s*url\(['"]?[^'")]+['"]?\)\s*;?\s*/, '')
      .replace(/style="\s*"/, ''); // remove empty style attribute

    const newTag = `<div${newAttrs}>`;
    html = html.replace(bg.fullMatch, newTag);
    changed = true;

    if (!firstHeroWebp) {
      firstHeroWebp = webpUrl;
      firstHeroMobileWebp = mobileUrl;
    }
  }

  if (!changed) return false;

  // Inject <style> block before </head>
  if (cssRules.length) {
    const styleBlock = `<style data-hero-styles="1">\n${cssRules.join('\n')}\n</style>`;
    html = html.replace('</head>', `  ${styleBlock}\n</head>`);
  }

  // Inject preload for first hero WebP
  if (firstHeroWebp && !html.includes('data-hero-preload')) {
    // Desktop preload (for non-mobile)
    const preloadDesktop = `<link rel="preload" as="image" href="${firstHeroWebp}" fetchpriority="high" media="(min-width: ${MOBILE_BREAKPOINT})" data-hero-preload="1">`;
    html = html.replace('</head>', `  ${preloadDesktop}\n</head>`);

    // Mobile preload (for small screens) — only if mobile version exists
    if (firstHeroMobileWebp) {
      const preloadMobile = `<link rel="preload" as="image" href="${firstHeroMobileWebp}" fetchpriority="high" media="(max-width: ${MOBILE_BREAKPOINT})" data-hero-preload-mobile="1">`;
      html = html.replace('</head>', `  ${preloadMobile}\n</head>`);
    }
  }

  fs.writeFileSync(filePath, html, 'utf8');
  return true;
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += walkDir(fullPath);
    } else if (entry.name.endsWith('.html')) {
      if (processFile(fullPath)) count++;
    }
  }
  return count;
}

function heroWebpInject() {
  const count = walkDir(DIST);
  console.log(`   ✅ ${count} pages optimized (WebP + mobile hero + preload)`);
  return count;
}

// Run if called directly
if (require.main === module) {
  heroWebpInject();
}

module.exports = { heroWebpInject };
