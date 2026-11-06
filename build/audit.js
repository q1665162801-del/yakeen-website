// build/audit.js — 全站审计脚本
// 运行: node build/audit.js
// 检查: dist完整性 / 标品词混入 / 精准词覆盖 / SEO基础项

const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
// 递归收集全部页面 — 之前只读 dist 根目录，子目录页面（markets/products/solutions/blog 等
// 100+ 页）的 title/description/JSON-LD/hreflang 从未被门禁覆盖，7 处超长 description 漏网。
const HTML = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) HTML.push(p);
  }
})(DIST);

function readAll() {
  return HTML.map(f => ({ file: f, content: fs.readFileSync(f, 'utf8') }));
}

// 1. dist 完整性
function checkDistFiles() {
  const required = ['sitemap.xml', 'robots.txt', 'llms.txt', 'index.html'];
  const missing = required.filter(f => !fs.existsSync(path.join(DIST, f)));
  return { name: 'dist 完整性', ok: missing.length === 0, detail: missing.length ? `缺失: ${missing.join(', ')}` : '所有关键文件存在' };
}

// 2. 标品词混入检测 (裸 factory / wholesale / cheap LED)
// 白名单：经人工复核为「教育读者避坑」语境，非自称标品商。
// 新增内容触发时须人工复核语境，确认误报方可加入。
const WHOLESALE_WHITELIST = [
  // cove/restaurant 指南：警示读者 cheap LED 显色差、调光变色 —— 反面教材
  ['blog/cove-lighting-specification-guide.html', 'cheap led'],
  ['blog/restaurant-lighting-specification-guide.html', 'cheap led'],
  // track 指南：建议「大批量下单前先测样品」—— 采购建议，非自称 bulk 商
  ['blog/track-spotlight-buying-guide.html', 'bulk order'],
];
function checkWholesaleWords() {
  const bad = ['LED lighting factory', 'LED lighting company', 'wholesale lighting', 'cheap LED', 'bulk order'];
  const pages = readAll();
  const hits = [];
  for (const p of pages) {
    const rel = path.relative(DIST, p.file).replace(/\\/g, '/');
    const text = p.content.toLowerCase();
    for (const word of bad) {
      if (text.includes(word.toLowerCase())) {
        if (WHOLESALE_WHITELIST.some(([f, w]) => f === rel && w === word.toLowerCase())) continue;
        hits.push(`${rel}: "${word}"`);
      }
    }
  }
  return { name: '标品词混入', ok: hits.length === 0, detail: hits.length ? hits.slice(0, 5).join('; ') : '无标品词' };
}

// 3. 精准限定词覆盖检查
function checkTargetKeywords() {
  const required = [
    'custom lighting supplier',
    'architectural lighting supplier',
    'bespoke lighting',
    'GCC',
    'IES',
    'DIALux',
    'SASO',
  ];
  const all = readAll().map(p => p.content.toLowerCase()).join('\n');
  const missing = required.filter(w => !all.includes(w.toLowerCase()));
  return { name: '精准词覆盖', ok: missing.length === 0, detail: missing.length ? `缺失: ${missing.join(', ')}` : '所有核心精准词已覆盖' };
}

// 4. Title 长度 (50-60 字符)
function checkTitles() {
  const pages = readAll();
  const bad = [];
  for (const p of pages) {
    const m = p.content.match(/<title>([^<]+)<\/title>/);
    if (m && (m[1].length > 60 || m[1].length < 20)) {
      bad.push(`${path.relative(DIST, p.file)} (${m[1].length})`);
    }
  }
  return { name: 'Title 长度', ok: bad.length === 0, detail: bad.length ? bad.join('; ') : '全部合规' };
}

// 5. Description 长度 (120-160 字符)
function checkDescriptions() {
  const pages = readAll();
  const bad = [];
  for (const p of pages) {
    const m = p.content.match(/<meta name="description" content="([^"]+)"/);
    if (m && (m[1].length > 160 || m[1].length < 80)) {
      bad.push(`${path.relative(DIST, p.file)} (${m[1].length})`);
    }
  }
  return { name: 'Description 长度', ok: bad.length === 0, detail: bad.length ? bad.join('; ') : '全部合规' };
}

// 6. JSON-LD 结构化数据
function checkJsonLd() {
  const pages = readAll();
  const noJsonLd = pages.filter(p => !p.content.includes('application/ld+json'));
  return { name: 'JSON-LD 覆盖', ok: noJsonLd.length === 0, detail: noJsonLd.length ? `${noJsonLd.length} 页无结构化数据` : '全部页面有 JSON-LD' };
}

// 7. Hreflang 多语言
function checkHreflang() {
  const pages = readAll();
  const noHreflang = pages.filter(p => !p.content.includes('hreflang'));
  return { name: 'Hreflang', ok: noHreflang.length === 0, detail: noHreflang.length ? `${noHreflang.length} 页无 hreflang` : '全部页面有 hreflang' };
}

// 8. 身份声明检测 — 禁止结构化数据把 Yakeen 声明为 manufacturer
// 这是唯一会被 AI 爬虫直接采信的机器层身份信号，必须与"供应商"定位一致。
function checkIdentityClaims() {
  const hits = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      const rel = path.relative(DIST, p);
      const html = fs.readFileSync(p, 'utf8');
      // 8a. 结构化数据里的 manufacturer 实体
      for (const m of html.matchAll(/"manufacturer"\s*:\s*\{[^}]*?"name"\s*:\s*"([^"]*)"/g)) {
        if (/yakeen/i.test(m[1])) hits.push(rel + ' → ' + m[1]);
      }
      // 8b. 页面文件名 / canonical 中的 manufacturer slug
      if (/manufacturer/i.test(e.name)) hits.push(rel + ' → 文件名含 manufacturer');
      const c = html.match(/<link rel="canonical" href="([^"]+)"/);
      if (c && /manufacturer/i.test(c[1])) hits.push(rel + ' → canonical 含 manufacturer: ' + c[1]);
    }
  })(DIST);
  return {
    name: '身份声明',
    ok: hits.length === 0,
    detail: hits.length ? `${hits.length} 处仍以 manufacturer 声明身份: ${hits.slice(0, 3).join('; ')}` : '结构化数据与 URL 均未把 Yakeen 声明为制造商',
  };
}

// 9. 第一人称制造商表述检测 — AI 抽取不会区分语境与引号归属
// 页面正文里出现 "we manufacture" / "our factory" 等，会被直接读成"Yakeen 是制造商"。
function checkFirstPersonClaims() {
  const phrases = [
    'we manufacture', 'we produce', 'we fabricate', 'we build in our',
    'our factory', 'our own factory', 'our facility', 'our plant',
    'our workshop', 'our production line',
    'in-house manufacturing', 'manufactured in-house',
    'نصنع', 'مصنعنا', 'منشأتنا', 'منشأة إنتاج',
  ];
  const hits = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      const rel = path.relative(DIST, p);
      const html = fs.readFileSync(p, 'utf8').toLowerCase();
      for (const phrase of phrases) {
        if (html.includes(phrase)) hits.push(rel + ' → "' + phrase + '"');
      }
    }
  })(DIST);
  return {
    name: '第一人称制造商表述',
    ok: hits.length === 0,
    detail: hits.length ? `${hits.length} 处残留: ${hits.slice(0, 3).join('; ')}` : '无第一人称制造 / 自有设施表述',
  };
}

// 10. sitemap 指向有效性 — URL 改名后最容易静默产生的死链
function checkSitemapTargets() {
  const smPath = path.join(DIST, 'sitemap.xml');
  if (!fs.existsSync(smPath)) return { name: 'sitemap 指向有效性', ok: false, detail: 'sitemap.xml 缺失' };
  const locs = [...fs.readFileSync(smPath, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const missing = [];
  for (const loc of locs) {
    let p = loc.replace('https://www.yakeenlighting.com', '').split('#')[0].split('?')[0];
    let cands;
    if (p === '' || p === '/') cands = [path.join(DIST, 'index.html')];
    else if (p.endsWith('/')) cands = [path.join(DIST, p, 'index.html')];
    else cands = [path.join(DIST, p), path.join(DIST, p + '.html'), path.join(DIST, p, 'index.html')];
    if (!cands.some(c => fs.existsSync(c))) missing.push(loc);
  }
  return {
    name: 'sitemap 指向有效性',
    ok: missing.length === 0,
    detail: missing.length ? `${missing.length} 条 URL 无对应文件: ${missing.slice(0, 3).join(', ')}` : `${locs.length} 条 URL 全部有对应页面`,
  };
}

// 11. 价格泄漏 — 全站任何位置不得出现货币金额
function checkPriceLeak() {
  const pats = [/\$\s?\d[\d,]*(\.\d+)?/, /\b(?:USD|AED|SAR|QAR)\s?\d[\d,]*/, /(?:ريال|درهم)\s?\d/];
  const hits = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      const rel = path.relative(DIST, p);
      const text = fs.readFileSync(p, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
      for (const re of pats) {
        const m = text.match(re);
        if (m) { hits.push(rel + ' → "' + m[0] + '"'); break; }
      }
    }
  })(DIST);
  return { name: '价格泄漏', ok: hits.length === 0, detail: hits.length ? `${hits.length} 处: ${hits.slice(0, 5).join('; ')}` : '无任何货币金额' };
}

// 12. 站内引用完整性 — href/src/action 必须指向存在的产物（/api/ 由 Pages Functions 接管，豁免）
function resolveDistPath(urlPath, fromFile) {
  let p = urlPath.split('#')[0].split('?')[0];
  if (!p) return true;
  try { p = decodeURIComponent(p); } catch (e) {}
  const full = p.startsWith('/') ? path.join(DIST, p) : path.resolve(path.dirname(fromFile), p);
  if (!full.startsWith(DIST)) return true;
  return [full, full + '.html', path.join(full, 'index.html')].some(c => fs.existsSync(c));
}
function checkInternalRefs() {
  const hits = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      const rel = path.relative(DIST, p);
      const html = fs.readFileSync(p, 'utf8');
      for (const m of html.matchAll(/(?:href|src|action)="([^"]+)"/g)) {
        const u = m[1];
        if (/^(https?:)?\/\//.test(u) || /^(mailto|tel|javascript|data|sms):/.test(u) || u.startsWith('#') || u === '') continue;
        if (u.includes('{{') || u.startsWith('/api/')) continue;
        if (!resolveDistPath(u, p)) hits.push(rel + ' → ' + u);
      }
    }
  })(DIST);
  return { name: '站内引用完整性', ok: hits.length === 0, detail: hits.length ? `${hits.length} 处断引用: ${[...new Set(hits)].slice(0, 5).join('; ')}` : '全部 href/src 可解析' };
}

// 13. 日期不越界 — datePublished/dateModified 不得晚于今天
function checkDates() {
  const today = new Date(); today.setHours(23, 59, 59, 999);
  const hits = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      const rel = path.relative(DIST, p);
      const html = fs.readFileSync(p, 'utf8');
      for (const m of html.matchAll(/"date(?:Published|Modified)"\s*:\s*"(\d{4}-\d{2}-\d{2})"/g)) {
        if (new Date(m[1]) > today) hits.push(rel + ' → ' + m[1]);
      }
    }
  })(DIST);
  return { name: '日期不越界', ok: hits.length === 0, detail: hits.length ? `${hits.length} 处未来日期: ${hits.slice(0, 5).join('; ')}` : '无未来日期' };
}

// 运行全部检查
const checks = [
  checkDistFiles(),
  checkWholesaleWords(),
  checkTargetKeywords(),
  checkTitles(),
  checkDescriptions(),
  checkJsonLd(),
  checkHreflang(),
  checkIdentityClaims(),
  checkFirstPersonClaims(),
  checkSitemapTargets(),
  checkPriceLeak(),
  checkInternalRefs(),
  checkDates(),
];

console.log('\n🔍 全站审计报告\n' + '='.repeat(50));
let pass = 0, fail = 0;
for (const c of checks) {
  const icon = c.ok ? '✅' : '❌';
  console.log(`${icon} ${c.name}: ${c.detail}`);
  if (c.ok) pass++; else fail++;
}
console.log('='.repeat(50));
console.log(`通过: ${pass}/${checks.length}`);
if (fail > 0) {
  console.log(`\n❌ ${fail} 项未通过，请修复后重新构建`);
  process.exit(1);
} else {
  console.log('\n✅ 全部通过');
}
