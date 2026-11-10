/**
 * postdeploy-check.js — 部署后线上自检
 *
 * 目的：build/audit.js 只校验 dist 里的 HTML，从不校验「线上 HTTP 层」。
 * 于是「本地改完没部署」「缓存头写错」「URL 双身份」这类问题只能靠人肉发现。
 * 此脚本在 deploy 末尾跑，任一项不通过即退出码 1。
 *
 * 校验项：
 *  1. 新鲜度：每个页面的线上正文指纹必须等于 dist 中的指纹（改完没部署会立刻报错）
 *  2. URL 身份：.html / index.html 必须 3xx 到 clean URL，不能再出现第二身份
 *  3. 缓存头：HTML 必须 no-cache；/sw.js 必须 ≤4h 且内容一致；哈希化 CSS 必须 immutable
 *  4. sitemap：条目数 = 可索引页面数，且每条 200
 *  5. 图片：dist 中每个被引用的图片，按其所在页面的真实 URL 解析后必须 200，
 *     且带内容哈希的文件名必须命中 1 年 immutable（本地文件存在 ≠ 线上能取到：
 *     相对路径、大小写、URL 编码这类问题只有走真实 URL 才暴露）
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE = 'https://www.yakeenlighting.com';
const DIST = path.join(__dirname, '..', 'dist');
const NON_INDEXABLE = new Set(['404.html', 'offline.html', 'thank-you.html']);

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
  );

/** dist 文件路径 → 线上 URL 路径 */
function toUrl(file) {
  const rel = path.relative(DIST, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel.replace(/\.html$/, '');
}

/**
 * 正文指纹：剥掉脚本/样式/标签，剔除 Cloudflare Email Obfuscation 注入，
 * 再对纯文本做 sha256。CF 会在边缘注入 email-protection 与 insights 脚本，
 * 所以两边都必须先归一再比：邮箱一律折叠成 EMAIL 占位符。
 */
function fingerprint(html) {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // 线上：CF 把 mailto 锚点整段换成 email-protection 锚点
    // 本地：仍是 mailto 锚点。两者都整体折叠成 EMAIL，否则会差出一个空格
    .replace(/<a[^>]*(?:email-protection|mailto:)[^>]*>[\s\S]*?<\/a>/gi, 'EMAIL')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, 'EMAIL');
  s = s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return crypto.createHash('sha256').update(s).digest('hex');
}

async function get(url, opts = {}) {
  return fetch(BASE + url, {
    redirect: 'manual',
    headers: { 'Cache-Control': 'no-cache' },
    ...opts,
  });
}

async function main() {
  const files = walk(DIST).filter((f) => f.endsWith('.html'));
  const pages = files.map((f) => ({ file: f, url: toUrl(f) }));
  const failures = [];

  // ── 1. 新鲜度 ──────────────────────────────────────────────
  let checked = 0;
  const queue = pages.filter((p) => !NON_INDEXABLE.has(path.basename(p.file)));
  const worker = async () => {
    while (queue.length) {
      const page = queue.shift();
      const local = fingerprint(fs.readFileSync(page.file, 'utf8'));
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await get(page.url + (attempt ? `?r=${attempt}` : ''));
        if (res.status !== 200) {
          failures.push(`${page.url} 返回 ${res.status}`);
          break;
        }
        const live = fingerprint(await res.text());
        if (live === local) break;
        if (attempt === 2) failures.push(`${page.url} 线上正文与 dist 不一致（未部署或被缓存）`);
        else await new Promise((r) => setTimeout(r, 3000));
      }
      checked++;
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));

  // ── 2. URL 身份 ────────────────────────────────────────────
  for (const p of ['/about.html', '/products/downlights/index.html', '/index.html']) {
    const res = await get(p);
    if (!(res.status >= 300 && res.status < 400)) {
      failures.push(`${p} 应为 3xx 跳转到 clean URL，实际 ${res.status}`);
    }
  }

  // ── 3. 缓存头 ──────────────────────────────────────────────
  const html = await get('/');
  const htmlCC = (html.headers.get('cache-control') || '').toLowerCase();
  if (!htmlCC.includes('no-cache')) failures.push(`HTML Cache-Control 缺少 no-cache：${htmlCC}`);

  const sw = await get('/sw.js');
  const swCC = (sw.headers.get('cache-control') || '').toLowerCase();
  const swMaxAge = Number((swCC.match(/max-age=(\d+)/) || [])[1] || 0);
  // Pages 会对 .js 强制 max-age=14400（_headers 与 Functions 都改不动），
  // 所以只要求「有上限 + 允许重新验证 + 内容与 dist 一致」。
  // 真正的兜底是 head 模板里的 SW purge 脚本 + sw.js 自注销。
  if (swMaxAge > 14400 || !swCC.includes('must-revalidate')) {
    failures.push(`/sw.js 缓存窗口异常：${swCC}`);
  }
  const swLocal = fs.readFileSync(path.join(DIST, 'sw.js'), 'utf8');
  if ((await sw.text()) !== swLocal) failures.push('/sw.js 线上内容与 dist 不一致');

  const cssName = fs.readdirSync(path.join(DIST, 'css')).find((f) => f.endsWith('.css'));
  const css = await get('/css/' + cssName);
  const cssCC = (css.headers.get('cache-control') || '').toLowerCase();
  if (!cssCC.includes('immutable')) failures.push(`哈希化 CSS 缺少 immutable：${cssCC}`);

  // ── 4. sitemap ────────────────────────────────────────────
  const sitemap = await (await get('/sitemap.xml')).text();
  const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const expected = pages.length - NON_INDEXABLE.size;
  if (locs.length !== expected) failures.push(`sitemap ${locs.length} 条，应为 ${expected} 条`);
  for (const loc of locs) {
    const res = await get(loc.replace(BASE, '') || '/');
    if (res.status !== 200) failures.push(`sitemap 中的 ${loc} 返回 ${res.status}`);
    res.body?.cancel?.();
  }

  // ── 5. 图片可达性 ──────────────────────────────────────────
  // 按「图片出现在哪个页面」解析相对路径，再走真实 URL 取一次。
  const imgRefs = new Map(); // 绝对 URL → 首个来源页面
  for (const page of pages) {
    const html = fs.readFileSync(page.file, 'utf8');
    const raw = [
      ...[...html.matchAll(/(?:src|href|data-bg(?:-mobile)?|content)="([^"]+\.(?:jpg|jpeg|png|webp|svg|gif))"/gi)].map((m) => m[1]),
      ...[...html.matchAll(/srcset="([^"]+)"/gi)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0])),
      ...[...html.matchAll(/url\(['"]?([^)'"]+\.(?:jpg|jpeg|png|webp|svg|gif))['"]?\)/gi)].map((m) => m[1]),
    ];
    for (const ref of raw) {
      if (!ref || /^data:/i.test(ref)) continue;
      try {
        const abs = new URL(ref, BASE + page.url).href;
        if (!imgRefs.has(abs)) imgRefs.set(abs, page.url);
      } catch { /* ignore malformed */ }
    }
  }
  const imgQueue = [...imgRefs.entries()];
  let imgChecked = 0;
  const imgWorker = async () => {
    while (imgQueue.length) {
      const [url, from] = imgQueue.shift();
      const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
      res.body?.cancel?.();
      if (res.status !== 200) failures.push(`${url} 返回 ${res.status}（引用自 ${from}）`);
      const isHashed = /\.[0-9a-f]{8}\.(?:jpg|jpeg|png|webp|svg|gif)$/i.test(url);
      if (isHashed && !/immutable/.test((res.headers.get('cache-control') || '').toLowerCase())) {
        failures.push(`${url} 缺少 immutable（内容已哈希却只缓存 ${res.headers.get('cache-control')}）`);
      }
      imgChecked++;
    }
  };
  await Promise.all(Array.from({ length: 8 }, imgWorker));

  // ── 结果 ──────────────────────────────────────────────────
  console.log(
    `\n线上自检：${checked} 页正文指纹 + 3 项 URL 身份 + 3 项缓存头 + ${locs.length} 条 sitemap + ${imgChecked} 张图片`
  );
  if (failures.length) {
    console.error('\n❌ 线上自检失败：');
    failures.forEach((f) => console.error('   - ' + f));
    process.exit(1);
  }
  console.log('✅ 线上与 dist 完全一致\n');
}

main().catch((e) => {
  console.error('❌ 自检脚本异常：' + e.message);
  process.exit(1);
});
