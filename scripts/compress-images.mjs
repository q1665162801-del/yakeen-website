import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const imagesDir = path.join(projectRoot, 'public', 'assets', 'images');

const MAX_WIDTH = 1400;
const JPEG_QUALITY = 78;
const PNG_QUALITY = 80;

let totalOriginal = 0;
let totalCompressed = 0;
let fileCount = 0;

async function compressImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;

  const originalSize = fs.statSync(filePath).size;
  const image = sharp(filePath);
  const meta = await image.metadata();

  let needsResize = meta.width > MAX_WIDTH;
  let pipeline = sharp(filePath);
  if (needsResize) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  const tempPath = filePath + '.tmp';

  if (ext === '.png') {
    await pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9, palette: true }).toFile(tempPath);
  } else {
    await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true }).toFile(tempPath);
  }

  const compressedSize = fs.statSync(tempPath).size;

  // Only replace if compressed is actually smaller
  if (compressedSize < originalSize) {
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    const origMB = (originalSize / 1048576).toFixed(2);
    const compMB = (compressedSize / 1048576).toFixed(2);
    const resizeNote = needsResize ? ` [resized ${meta.width}->${MAX_WIDTH}]` : '';
    console.log(`  ${path.relative(imagesDir, filePath)}: ${origMB}MB -> ${compMB}MB (-${ratio}%)${resizeNote}`);
    // ponytail: rename is atomic on same fs; avoids copyfile lock issues on Windows
    fs.unlinkSync(filePath);
    fs.renameSync(tempPath, filePath);
    totalOriginal += originalSize;
    totalCompressed += compressedSize;
    fileCount++;
  } else {
    // Compressed version is larger — keep original
    fs.unlinkSync(tempPath);
    totalOriginal += originalSize;
    totalCompressed += originalSize;
  }
}

async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else {
      await compressImage(fullPath);
    }
  }
}

console.log('=== Image Compression Started ===\n');
const start = Date.now();
await processDirectory(imagesDir);
const elapsed = ((Date.now() - start) / 1000).toFixed(1);

console.log('\n=== Summary ===');
console.log(`Files compressed: ${fileCount}`);
console.log(`Original total: ${(totalOriginal / 1048576).toFixed(2)} MB`);
console.log(`Compressed total: ${(totalCompressed / 1048576).toFixed(2)} MB`);
console.log(`Saved: ${((totalOriginal - totalCompressed) / 1048576).toFixed(2)} MB (${((1 - totalCompressed / totalOriginal) * 100).toFixed(1)}%)`);
console.log(`Time: ${elapsed}s`);
