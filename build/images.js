/**
 * build/images.js — Image post-processing optimizer
 * 
 * Transforms all <img> tags in built HTML:
 *   - Auto-injects width/height to prevent CLS
 *   - Wraps JPG/PNG in <picture> with WebP source
 *   - Adds loading="lazy" + decoding="async"
 *   - Hero image gets fetchpriority="high" + eager loading
 */

const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size').imageSize;

const { ROOT, DIST } = require('./config');

function resolveImagePath(src, pageOutDir) {
  if (src.startsWith('/')) {
    return path.join(ROOT, src);
  }
  const absInDist = path.resolve(pageOutDir, src);
  const relToDist = path.relative(DIST, absInDist);
  return path.join(ROOT, relToDist);
}

function findMobileSrc(src, pageOutDir) {
  const baseNoExt = src.replace(/\.(jpg|jpeg|png)$/i, '');
  return (
    [`${baseNoExt}-mobile.webp`, `${baseNoExt}-768.webp`].find((candidate) => {
      const p = resolveImagePath(candidate, pageOutDir);
      return p && fs.existsSync(p);
    }) || null
  );
}

function getImageDimensions(src, pageOutDir) {
  const isExternal = /^https?:\/\//.test(src);
  const isDataUri = /^data:/i.test(src);
  if (isExternal || isDataUri) return null;

  const imgPath = resolveImagePath(src, pageOutDir);
  if (!fs.existsSync(imgPath)) return null;

  try {
    const buf = fs.readFileSync(imgPath);
    const dims = sizeOf(buf);
    if (dims && dims.width && dims.height) {
      return { width: dims.width, height: dims.height };
    }
  } catch (e) {
    console.warn(`  ⚠️  Image dimension read failed: ${e.message}`);
  }
  return null;
}

/**
 * Optimize all <img> tags in HTML.
 * @param {string} html - Raw HTML string
 * @param {string} pageOutDir - Absolute path to the page's output directory
 * @param {object} fm - Page front-matter (for heroImage detection)
 * @returns {{ html: string, heroSrc: string|null }} Optimized HTML + hero image src
 */
function optimizeImages(html, pageOutDir, fm) {
  let imgCount = 0;
  let heroSrc = null;
  const jpgImages = []; // collect JPG/PNG info for hero detection

  // First pass: collect all JPG/PNG images with their dimensions
  const collectRegex = /<img([^>]*)>/gi;
  let collectMatch;
  while ((collectMatch = collectRegex.exec(html)) !== null) {
    const attrs = collectMatch[1];
    if (/data-no-webp/.test(attrs)) continue;
    const srcMatch = attrs.match(/src\s*=\s*["']([^"']+)["']/);
    if (!srcMatch) continue;
    const src = srcMatch[1];
    if (!/\.(jpg|jpeg|png)$/i.test(src) || /^https?:\/\//.test(src)) continue;
    const dims = getImageDimensions(src, pageOutDir);
    jpgImages.push({ src, width: dims?.width || 0, height: dims?.height || 0 });
  }

  // Also collect background-image URLs from inline styles (hero sections, etc.)
  const bgRegex = /style\s*=\s*["'][^"']*background-image\s*:\s*url\(\s*["']?([^"')]+)["']?\s*\)[^"']*["']/gi;
  let bgMatch;
  while ((bgMatch = bgRegex.exec(html)) !== null) {
    const src = bgMatch[1];
    if (!/\.(jpg|jpeg|png|webp)$/i.test(src) || /^https?:\/\//.test(src)) continue;
    const dims = getImageDimensions(src, pageOutDir);
    if (dims && dims.width >= 400) {
      jpgImages.push({ src, width: dims.width, height: dims.height, isBg: true });
    }
  }

  // Determine hero image:
  // 1. Explicit heroImage front-matter flag
  // 2. First large background-image (usually hero section banners)
  // 3. First large <img> tag (fallback)
  let heroIndex = -1;
  let heroIsBg = false;
  if (fm?.heroImage) {
    heroIndex = 0;
  } else {
    // First pass: look for background images (hero section banners)
    for (let i = 0; i < jpgImages.length; i++) {
      if (jpgImages[i].isBg && jpgImages[i].width >= 800) {
        heroIndex = i;
        heroIsBg = true;
        break;
      }
    }
    // Fallback: first large <img>
    if (heroIndex < 0) {
      for (let i = 0; i < jpgImages.length; i++) {
        if (!jpgImages[i].isBg && jpgImages[i].width >= 400) {
          heroIndex = i;
          heroIsBg = false;
          break;
        }
      }
    }
  }

  // If hero is a background image, set heroSrc directly (no <img> tag to process)
  if (heroIsBg && heroIndex >= 0) {
    heroSrc = jpgImages[heroIndex].src;
  }

  let currentJpgIndex = -1;

  // Hand-authored <picture> blocks already exist in a few templates. Inject the
  // mobile <source> in place and mark the inner <img>, otherwise the main pass
  // wraps it in a second <picture> whose unconditional first <source> would win
  // over the mobile one.
  html = html.replace(/<picture>([\s\S]*?)<\/picture>/gi, (block, inner) => {
    const imgSrc = inner.match(/src\s*=\s*["']([^"']+)["']/);
    if (!imgSrc || /data-no-webp/.test(inner)) return block;
    const src = imgSrc[1];
    if (!/\.(jpg|jpeg|png)$/i.test(src) || /^https?:\/\//.test(src)) return block;

    const markedInner = inner.replace('<img', '<img data-picture-wrapped="1"');
    const mobileSrc = findMobileSrc(src, pageOutDir);
    if (!mobileSrc || inner.includes('max-width: 768px')) {
      return block.replace(inner, markedInner);
    }
    return `<picture>\n    <source media="(max-width: 768px)" srcset="${mobileSrc}" type="image/webp">${markedInner}</picture>`;
  });

  const result = html.replace(/<img([^>]*)>/gi, function(match, attrs) {
    if (/data-no-webp/.test(attrs)) return match;

    const srcMatch = attrs.match(/src\s*=\s*["']([^"']+)["']/);
    if (!srcMatch) return match;

    const src = srcMatch[1];
    const alreadyInPicture = /data-picture-wrapped/.test(attrs);
    let sizedAttrs = attrs.replace(/\sdata-picture-wrapped="[^"]*"/g, '');
    const hasWidth = /\swidth\s*=/.test(sizedAttrs);
    const hasHeight = /\sheight\s*=/.test(sizedAttrs);

    // Auto-inject width/height to prevent CLS
    if (!hasWidth || !hasHeight) {
      const dims = getImageDimensions(src, pageOutDir);
      if (dims) {
        if (!hasWidth) sizedAttrs += ` width="${dims.width}"`;
        if (!hasHeight) sizedAttrs += ` height="${dims.height}"`;
      }
    }

    // Non-JPG/PNG or external or already wrapped: just add lazy load + async decoding
    if (!/\.(jpg|jpeg|png)$/i.test(src) || /^https?:\/\//.test(src) || alreadyInPicture) {
      let result = `<img${sizedAttrs}>`;
      if (!/loading\s*=/.test(sizedAttrs)) {
        result = result.replace('<img', '<img loading="lazy"');
      }
      if (!/decoding\s*=/.test(sizedAttrs)) {
        result = result.replace('<img', '<img decoding="async"');
      }
      return result;
    }

    // JPG/PNG: wrap in <picture> with WebP source (only if WebP exists)
    currentJpgIndex++;
    const isHero = currentJpgIndex === heroIndex;
    if (isHero) heroSrc = src;

    const loadingAttr = isHero
      ? 'loading="eager" fetchpriority="high"'
      : 'loading="lazy"';

    const finalImgAttrs = sizedAttrs
      .replace(/\sloading\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\sdecoding\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\sfetchpriority\s*=\s*["'][^"']*["']/gi, '');

    const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const webpPath = resolveImagePath(webpSrc, pageOutDir);

    if (webpPath && fs.existsSync(webpPath)) {
      // Mobile source: prefer the hero-specific -mobile.webp (768px) and fall
      // back to the generic -768.webp generated for content images.
      const mobileSrc = findMobileSrc(src, pageOutDir);
      const mobileSource = mobileSrc
        ? `\n    <source media="(max-width: 768px)" srcset="${mobileSrc}" type="image/webp">`
        : '';

      return `<picture>${mobileSource}
    <source srcset="${webpSrc}" type="image/webp">
    <img ${loadingAttr} decoding="async"${finalImgAttrs}>
  </picture>`;
    }

    return `<img ${loadingAttr} decoding="async"${finalImgAttrs}>`;
  });

  return { html: result, heroSrc, heroIsBg };
}

module.exports = { optimizeImages, getImageDimensions, resolveImagePath };
