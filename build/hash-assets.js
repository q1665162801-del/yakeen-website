/**
 * build/hash-assets.js — 给图片文件名加内容哈希
 *
 * 为什么：_headers 给 /images/* 配的是「1 年 immutable」，但文件名不带内容
 * 版本。换图时 URL 不变 → 浏览器缓存键不变 → 老访客一年内看不到新图。
 * 这里在构建末尾把 images/ 下每个文件重命名为 name.<sha256前8位>.ext，
 * 并把 HTML/CSS/JS/JSON 里的引用一起改掉，让「内容变了地址就变」重新成立。
 *
 * 只改文件名，不删文件；引用改写覆盖三种前缀（相对 / 根相对 / 绝对域名），
 * 因为替换串本身是 `images/<路径>`，三种写法都包含它。
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { DIST } = require('./config');

const HASHED = /^(.*)\.([0-9a-f]{8})(\.(?:jpg|jpeg|png|webp|svg|gif))$/i;
const TEXT_EXT = new Set(['.html', '.css', '.js', '.webmanifest', '.json', '.txt', '.xml']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
  );
}

const hashOf = (file) =>
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 8);

function hashAssets() {
  const imagesDir = path.join(DIST, 'images');
  if (!fs.existsSync(imagesDir)) return { renamed: 0, rewrote: 0, orphans: 0 };

  // ── 1. 重命名 ──────────────────────────────────────────────
  const renames = new Map(); // images/<旧相对路径> → images/<新相对路径>
  let renamed = 0;

  for (const file of walk(imagesDir)) {
    const rel = path.relative(imagesDir, file).split(path.sep).join('/');
    const dir = path.posix.dirname(rel) === '.' ? '' : path.posix.dirname(rel) + '/';
    const base = path.posix.basename(rel);
    const ext = path.posix.extname(base);
    const hash = hashOf(file);

    const m = base.match(HASHED);
    let stem;
    if (m) {
      // 已经带哈希：哈希正确就保留，不正确则用内容哈希纠正
      if (m[2] === hash) continue;
      stem = m[1];
    } else {
      stem = base.slice(0, -ext.length);
    }

    const newBase = `${stem}.${hash}${ext}`;
    const newRel = dir + newBase;
    fs.renameSync(file, path.join(imagesDir, newRel));
    renames.set(`images/${rel}`, `images/${newRel}`);
    renamed++;
  }

  // ── 2. 改写引用 ────────────────────────────────────────────
  // 长者优先，避免 a.jpg 抢先命中 a-768.jpg 这类前缀关系
  const pairs = [...renames.entries()].sort((a, b) => b[0].length - a[0].length);
  let rewrote = 0;

  for (const file of walk(DIST)) {
    if (!TEXT_EXT.has(path.extname(file).toLowerCase())) continue;
    const original = fs.readFileSync(file, 'utf-8');
    let next = original;
    for (const [from, to] of pairs) {
      if (next.includes(from)) next = next.split(from).join(to);
    }
    if (next !== original) {
      fs.writeFileSync(file, next);
      rewrote++;
    }
  }

  // ── 3. 统计未被引用的图片（只报告，不失败） ────────────────
  const referenced = new Set();
  for (const file of walk(DIST)) {
    if (!TEXT_EXT.has(path.extname(file).toLowerCase())) continue;
    const text = fs.readFileSync(file, 'utf-8');
    for (const m of text.matchAll(/images\/([A-Za-z0-9_./\-]+\.[A-Za-z0-9]{2,5})/g)) {
      referenced.add(m[1]);
    }
  }
  const orphans = walk(imagesDir).filter((f) => {
    const rel = path.relative(imagesDir, f).split(path.sep).join('/');
    return !referenced.has(rel);
  }).length;

  // ── 4. 旧图名 → 新哈希名 的 301 跳转 ──────────────────────
  // 图片改成内容哈希后，所有旧的无哈希 URL 都会 404（站外引用、图片搜索缓存）。
  // 给每张图补一条 301，让旧地址跳到当前哈希地址。_redirects 在每次构建时由
  // 根目录静态复制生成，这里追加的规则始终指向本次构建的最新哈希，不会过期。
  const imgRedirects = [];
  for (const file of walk(imagesDir)) {
    const rel = path.relative(imagesDir, file).split(path.sep).join('/');
    const m = rel.match(HASHED);
    if (!m) continue;
    const oldRel = m[1] + m[3];
    imgRedirects.push(`/images/${oldRel}  /images/${rel}  301`);
  }
  const redirectsPath = path.join(DIST, '_redirects');
  if (fs.existsSync(redirectsPath) && imgRedirects.length) {
    fs.appendFileSync(
      redirectsPath,
      `\n# --- Image content-hash redirects (auto-generated, ${imgRedirects.length} rules) ---\n${imgRedirects.join('\n')}\n`
    );
  }

  return { renamed, rewrote, orphans };
}

module.exports = { hashAssets };
