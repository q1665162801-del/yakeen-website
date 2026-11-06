/**
 * build/hero-mobile.js — Generate mobile-sized hero images
 * 
 * Creates 768px wide WebP versions of all hero images for mobile devices.
 * Mobile screens don't need 1920px wide images — 768px is enough at 2x DPR.
 * 
 * Output filename: hero-xxx-mobile.webp (sits alongside original)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMG_DIR = path.join(__dirname, '..', 'images');
const MOBILE_WIDTH = 768; // px — covers most mobile screens at 2x DPR

function isHeroImage(filename) {
  if (!filename.startsWith('hero-')) return false;
  if (!filename.endsWith('.jpg') && !filename.endsWith('.webp')) return false;
  if (filename.includes('-mobile.')) return false; // skip already mobile
  return true;
}

function getBaseName(filename) {
  return filename.replace(/\.(jpg|jpeg|webp)$/i, '');
}

async function processImage(file) {
  const baseName = getBaseName(file);
  const srcPath = path.join(IMG_DIR, file);
  const mobilePath = path.join(IMG_DIR, `${baseName}-mobile.webp`);

  // Skip if mobile version already exists and is newer
  if (fs.existsSync(mobilePath)) {
    const srcMtime = fs.statSync(srcPath).mtimeMs;
    const mobMtime = fs.statSync(mobilePath).mtimeMs;
    if (mobMtime >= srcMtime) {
      return { skipped: true, reason: 'up-to-date' };
    }
  }

  try {
    const metadata = await sharp(srcPath).metadata();
    
    // Only resize if image is wider than mobile target
    if (metadata.width <= MOBILE_WIDTH) {
      return { skipped: true, reason: 'already-small' };
    }

    await sharp(srcPath)
      .resize({ width: MOBILE_WIDTH, withoutEnlargement: true })
      .webp({ quality: 78, effort: 6 })
      .toFile(mobilePath);

    const origSize = fs.statSync(srcPath).size;
    const mobSize = fs.statSync(mobilePath).size;

    return {
      created: true,
      original: Math.round(origSize / 1024),
      mobile: Math.round(mobSize / 1024),
      saved: Math.round(100 - mobSize / origSize * 100),
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function generateMobileHeroes() {
  const files = fs.readdirSync(IMG_DIR).filter(isHeroImage);
  console.log(`   Found ${files.length} hero images`);

  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const result = await processImage(file);
    if (result.created) {
      created++;
    } else if (result.skipped) {
      skipped++;
    } else if (result.error) {
      console.log(`   ⚠️  ${file}: ${result.error}`);
    }
  }

  console.log(`   ✅ ${created} new, ${skipped} existing`);
  return { created, skipped };
}

// Run if called directly
if (require.main === module) {
  generateMobileHeroes();
}

module.exports = { generateMobileHeroes };
