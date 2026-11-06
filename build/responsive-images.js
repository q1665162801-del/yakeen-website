/**
 * build/responsive-images.js — Generate 768px mobile variants
 *
 * Mobile screens rarely need a 1600-1920px content image. For every JPG/PNG
 * referenced by an <img>, this creates a `-768.webp` sibling so build/images.js
 * can emit a mobile-only <source> in the <picture> wrapper.
 *
 * Hero images are skipped — build/hero-mobile.js already produces
 * `hero-*-mobile.webp`, and images.js prefers that file when present.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMG_DIR = path.join(__dirname, '..', 'images');
const TARGET_WIDTH = 768;

function isCandidate(filename) {
  if (/-(mobile|768|480)[^.]*\.(webp|jpg|jpeg|png)$/i.test(filename)) return false;
  if (filename.startsWith('hero-')) return false;
  return /\.(jpg|jpeg|png|webp)$/i.test(filename);
}

function getBaseName(filename) {
  return filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
}

async function processImage(file) {
  const baseName = getBaseName(file);
  const srcPath = path.join(IMG_DIR, file);
  const outPath = path.join(IMG_DIR, `${baseName}-768.webp`);

  if (fs.existsSync(outPath)) {
    const srcMtime = fs.statSync(srcPath).mtimeMs;
    const outMtime = fs.statSync(outPath).mtimeMs;
    if (outMtime >= srcMtime) return { skipped: true };
  }

  try {
    const metadata = await sharp(srcPath).metadata();
    if (!metadata.width || metadata.width <= TARGET_WIDTH * 1.15) {
      return { skipped: true, reason: 'narrow' };
    }

    await sharp(srcPath)
      .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
      .webp({ quality: 76, effort: 6 })
      .toFile(outPath);

    const before = fs.statSync(srcPath).size;
    const after = fs.statSync(outPath).size;
    return {
      created: true,
      saved: Math.round(100 - (after / before) * 100),
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function generateMobileImages() {
  if (!fs.existsSync(IMG_DIR)) return { created: 0, skipped: 0 };

  const files = fs.readdirSync(IMG_DIR).filter(isCandidate);
  let created = 0;
  let skipped = 0;
  let savedBytes = 0;

  for (const file of files) {
    const srcSize = fs.statSync(path.join(IMG_DIR, file)).size;
    const result = await processImage(file);
    if (result.created) {
      created++;
      savedBytes += Math.round((srcSize * result.saved) / 100);
    } else if (result.skipped) {
      skipped++;
    } else if (result.error) {
      console.log(`   ⚠️  ${file}: ${result.error}`);
    }
  }

  console.log(
    `   ✅ ${created} new 768w variants, ${skipped} existing (≈${Math.round(
      savedBytes / 1024
    )} KB lighter per mobile view)`
  );
  return { created, skipped };
}

if (require.main === module) {
  generateMobileImages();
}

module.exports = { generateMobileImages };
