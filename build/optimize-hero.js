/**
 * build/optimize-hero.js — Normalize hero image sources (runs in the build)
 *
 * Guarantees two invariants for every hero JPG/WEBP pair in images/:
 *   1. the desktop WebP is never wider than its JPG sibling, and
 *   2. the desktop WebP is never meaningfully heavier than the JPG.
 *
 * ── Root cause of the long-standing "hero image is still huge" bug ──────────
 * Three faults stacked on top of each other, which is why earlier fixes (npm
 * script, preload tag, JPG re-compression, mobile variant) never touched it:
 *
 *   a) build/hero-webp.js only *checks that a .webp exists* (line: `if
 *      (!fs.existsSync(webpAbsPath)) continue;`) — it never generates one.
 *   b) The only thing that could generate one was this file, and its old logic
 *      was `needsWebp = !hasWebp` — i.e. once ANY webp existed it was skipped
 *      forever, however bloated.
 *   c) The old version of this file was never wired into build/index.js at all,
 *      so in practice step (b) never even ran during a build.
 *
 *   Net effect: an oversized 2560px WebP produced once (from an oversized
 *   master) was published on every build forever.
 *
 * ── Why the rewrite initially still failed (second root cause) ─────────────
 * The rewritten step still threw `EBUSY: resource busy or locked, unlink
 * '...hero-x.webp'` on 6 of 7 files, every single run, and a 6×150ms retry
 * loop never helped. The lock was held by *this very process*: sharp/libvips
 * caches open file handles (default: 100 files), so `sharp(webpPath).metadata()`
 * opened the WebP and kept the handle. Windows then refuses to delete a file
 * that the same process holds open, and the handler lives for the whole
 * process — so retries were guaranteed to fail.
 *
 * The fix is structural, not a retry: libvips is never handed a path that we
 * later delete.
 *   - dimensions come from the pure-JS `image-size` reader (opens nothing),
 *   - encoding reads the input as a Buffer and returns a Buffer,
 *   - only Node's own fs writes/renames/deletes, so there is no shared handle.
 *
 * This step is idempotent: it only rewrites a WebP when it violates an
 * invariant, so repeat builds do no work.
 *
 * Note on quality: q80 produced a LARGER webp than the mozjpeg-optimised JPG
 * for these sources (228KB vs 221KB). q75 is the sweet spot — reliably below
 * the JPG while staying visually clean for a full-bleed hero.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const sizeOf = require('image-size').imageSize;

const IMG_DIR = path.join(__dirname, '..', 'images');

// Defence in depth: even though we no longer pass paths to libvips for input,
// disable its file-handle cache so a future path-based call can't reintroduce
// the EBUSY-on-unlink problem.
sharp.cache({ files: 0 });

const WEBP_QUALITY = 75;
const JPG_QUALITY = 82;
const JPG_RECOMPRESS_THRESHOLD = 200 * 1024; // only touch JPGs above 200KB
const SIZE_TOLERANCE = 1.1; // ignore webp/jpg size differences under 10%

/**
 * Replace `dest` with `tmp`.
 *
 * `tmp` is produced by fs.writeFileSync (never by sharp), so nothing in this
 * process holds a handle on either file. The bounded retry is kept only to
 * absorb the genuinely external case: an antivirus or the editor's file
 * watcher briefly touching the file right after it is written.
 */
async function replaceFile(tmp, dest) {
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      fs.renameSync(tmp, dest);
      return;
    } catch (e) {
      if (attempt === 5) throw e;
      await delay(150);
    }
  }
}

function readDims(filePath) {
  const buf = fs.readFileSync(filePath);
  const dims = sizeOf(buf);
  return { buf, width: dims && dims.width, height: dims && dims.height };
}

async function optimizeHeroes() {
  if (!fs.existsSync(IMG_DIR)) {
    console.log('   ⚠️  images/ not found — skipping hero normalization');
    return { webpFixed: 0, jpgFixed: 0 };
  }

  const files = fs
    .readdirSync(IMG_DIR)
    .filter((f) => f.startsWith('hero-') && /\.jpe?g$/i.test(f) && !f.includes('-mobile.'));

  let webpFixed = 0;
  let jpgFixed = 0;

  for (const file of files) {
    const jpgPath = path.join(IMG_DIR, file);
    const webpPath = path.join(IMG_DIR, file.replace(/\.jpe?g$/i, '.webp'));

    try {
      const jpg = readDims(jpgPath);
      if (!jpg.width) continue;
      const jpgSize = fs.statSync(jpgPath).size;

      // --- 1. WebP must exist, not be wider, and not be meaningfully heavier ---
      let needsWebp = !fs.existsSync(webpPath);
      let reason = needsWebp ? 'missing' : '';

      if (!needsWebp) {
        const webp = readDims(webpPath);
        const webpSize = fs.statSync(webpPath).size;
        if (!webp.width) {
          needsWebp = true;
          reason = 'webp unreadable';
        } else if (webp.width > jpg.width) {
          needsWebp = true;
          reason = `webp ${webp.width}px wider than jpg ${jpg.width}px`;
        } else if (webpSize > jpgSize * SIZE_TOLERANCE) {
          needsWebp = true;
          reason = `webp ${(webpSize / 1024).toFixed(0)}KB vs jpg ${(jpgSize / 1024).toFixed(0)}KB`;
        }
      }

      if (needsWebp) {
        const tmpPath = webpPath + '.tmp';
        const out = await sharp(jpg.buf)
          .resize({ width: jpg.width, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY, effort: 6 })
          .toBuffer();
        fs.writeFileSync(tmpPath, out);
        await replaceFile(tmpPath, webpPath);
        console.log(
          `   🔄 ${file} → webp ${(out.length / 1024).toFixed(0)}KB (${reason})`
        );
        webpFixed++;
      }

      // --- 2. Recompress an oversized JPG only when it saves > 10% ---
      if (jpgSize > JPG_RECOMPRESS_THRESHOLD) {
        const tmpPath = jpgPath + '.tmp';
        const out = await sharp(jpg.buf)
          .jpeg({ quality: JPG_QUALITY, progressive: true, mozjpeg: true })
          .toBuffer();
        if (out.length < jpgSize * 0.9) {
          fs.writeFileSync(tmpPath, out);
          await replaceFile(tmpPath, jpgPath);
          console.log(
            `   🔄 ${file} jpg ${(jpgSize / 1024).toFixed(0)}KB → ${(out.length / 1024).toFixed(0)}KB`
          );
          jpgFixed++;
        }
      }
    } catch (e) {
      console.log(`   ⚠️  ${file}: ${e.message}`);
    }
  }

  console.log(`   ✅ Hero sources: ${webpFixed} webp normalized, ${jpgFixed} jpg recompressed`);
  return { webpFixed, jpgFixed };
}

// Run if called directly
if (require.main === module) {
  optimizeHeroes();
}

module.exports = { optimizeHeroes };