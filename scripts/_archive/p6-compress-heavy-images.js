/**
 * p6-B1: 压缩超重 JPG（>300KB → 目标 <150KB）+ 补齐缺失的 WebP
 * 一次性脚本 — 跑完后由常规 build 流程接管
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', '..');
const IMG = path.join(ROOT, 'images');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

(async () => {
  const files = walk(IMG).filter(f => /\.jpe?g$/i.test(f));
  let compressed = 0, webpMade = 0, savedKB = 0;

  for (const file of files) {
    const kb = fs.statSync(file).size / 1024;
    const isHero = path.basename(file).startsWith('hero-');
    const maxW = isHero ? 1920 : 1600;

    // 先读入内存，释放文件句柄（Windows 上 sharp 管道与写回同路径会冲突）
    const input = fs.readFileSync(file);

    // 1) 压缩超重 JPG
    if (kb > 300) {
      let quality = 78;
      let buf = await sharp(input)
        .resize({ width: maxW, withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      // 仍超 200KB 则再降一档
      if (buf.length / 1024 > 200) {
        quality = 70;
        buf = await sharp(input)
          .resize({ width: maxW, withoutEnlargement: true })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
      }
      const newKb = buf.length / 1024;
      // 临时文件 + 替换，避免句柄/同步锁
      const tmp = file + '.tmp';
      fs.writeFileSync(tmp, buf);
      fs.rmSync(file);
      fs.renameSync(tmp, file);
      savedKB += kb - newKb;
      compressed++;
      console.log(`🗜️  ${path.relative(IMG, file)}: ${kb.toFixed(0)}KB → ${newKb.toFixed(0)}KB (q${quality})`);
    }

    // 2) 补齐缺失的 WebP（与 jpg 同名同目录；og 仍用 jpg，页面 img 由构建流程选用 webp）
    const webpPath = file.replace(/\.jpe?g$/i, '.webp');
    if (!fs.existsSync(webpPath)) {
      await sharp(input)
        .resize({ width: maxW, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(webpPath);
      webpMade++;
      console.log(`✨ webp: ${path.relative(IMG, webpPath)} (${(fs.statSync(webpPath).size/1024).toFixed(0)}KB)`);
    }
  }

  console.log(`\n✅ 压缩 ${compressed} 张，节省 ${(savedKB/1024).toFixed(1)}MB；新增 webp ${webpMade} 张`);
})();
