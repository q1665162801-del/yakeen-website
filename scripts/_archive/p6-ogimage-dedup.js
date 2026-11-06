/**
 * p6-B2: ogImage 去重 + 断链修复
 * 每页专属 ogImage（EN/AR 语言对共用一张）。替换后逐项报告。
 */
const fs = require('fs');
const path = require('path');

const PAGES = path.join(__dirname, '..', '..', 'src', 'pages');
const IMG = path.join(__dirname, '..', '..', 'images');
const CDN = 'https://www.yakeenlighting.com/images/';

// [页面文件, 新ogImage]（旧值不限定，统一整行替换 front-matter 里的 ogImage）
const MAP = [
  // ── 断链修复 ──
  ['products/custom-chandeliers/index.html', 'villa-palm-hero.jpg'],
  ['products/custom-chandeliers/index-ar.html', 'villa-palm-hero.jpg'],
  ['products/track-spotlights/index.html', 'product-track-retail.jpg'],
  ['products/track-spotlights/index-ar.html', 'product-track-retail.jpg'],
  ['products/linear-lighting/index.html', 'product-linear-systems.jpg'],
  ['products/linear-lighting/index-ar.html', 'product-linear-systems.jpg'],
  // ── 首页 ──
  ['index.html', 'hero-home-majestic.jpg'],
  ['index-ar.html', 'hero-home-majestic.jpg'],
  // ── Comparison 5 页 ──
  ['bega-alternatives.html', 'project-showroom-gallery.jpg'],
  ['erco-alternatives.html', 'project-automotive-showroom.jpg'],
  ['flos-alternatives.html', 'project-fine-dining.jpg'],
  ['iguzzini-alternatives.html', 'project-corporate-office.jpg'],
  ['erco-iguzzini-bega-alternatives.html', 'project-premium-foodhall.jpg'],
  // ── 城市 blog（hero-gcc-v3 / hero-uae-v3 释放）──
  ['blog/lighting-kuwait-city.html', 'blog/lighting-kuwait-city.jpg'],
  ['blog/lighting-manama-bahrain.html', 'blog/lighting-manama-bahrain.jpg'],
  ['blog/lighting-muscat-oman.html', 'blog/lighting-muscat-oman.jpg'],
  ['blog/lighting-suppliers-doha.html', 'blog/lighting-suppliers-doha.jpg'],
  ['blog/mosque-lighting-specification-guide.html', 'blog/mosque-islamic-lighting.jpg'],
  ['blog/lighting-companies-abu-dhabi.html', 'blog/lighting-companies-abu-dhabi.jpg'],
  // ── 认证/资源 ──
  ['certifications.html', 'hero-certifications-lab.jpg'],
  ['certifications-ar.html', 'hero-certifications-lab.jpg'],
  ['certifications-resources.html', 'journal-saso-compliance.jpg'],
  ['blog/outdoor-architectural-lighting-guide.html', 'blog/facade-night-lighting.jpg'],
  // ── 定制/工程/测试 ──
  ['custom-lighting.html', 'hero-custom-engineered.jpg'],
  ['custom-lighting-ar.html', 'hero-custom-engineered.jpg'],
  ['engineering-hub.html', 'lab/engineer-working.jpg'],
  ['engineering-hub-ar.html', 'lab/engineer-working.jpg'],
  ['testing-quality.html', 'hero-testing-quality-v3.jpg'],
  ['testing-quality-ar.html', 'hero-testing-quality-v3.jpg'],
  // ── 规格/对比 ──
  ['china-vs-european-lighting.html', 'detail-track-spotlight-closeup.jpg'],
  ['zumtobel-comparison.html', 'project-coworking-office.jpg'],
  ['delta-light-comparison.html', 'product-track-spotlights.jpg'],
  ['louis-poulsen-comparison.html', 'marina-penthouse.jpg'],
  ['trilux-comparison.html', 'product-linear-office.jpg'],
  // ── 方案/blog ──
  ['blog/hotel-lighting-specification-guide.html', 'blog/hotel-lobby-lighting.jpg'],
  ['blog/restaurant-lighting-specification-guide.html', 'blog/restaurant-lighting.jpg'],
  ['blog/retail-lighting-specification-guide.html', 'blog/retail-lighting.jpg'],
  ['blog/hotel-lighting-middle-east.html', 'project-hospitality-lobby.jpg'],
  ['blog/riyadh-boutique-case-study.html', 'blog/riyadh-boutique-case.jpg'],
  ['blog/retail-lighting-design.html', 'project-luxury-retail.jpg'],
  ['blog/jeddah-flagship-case-study.html', 'blog/jeddah-flagship-case.jpg'],
  ['blog/linear-lighting-system-guide.html', 'blog/linear-lighting-system.jpg'],
  ['blog/cove-lighting-specification-guide.html', 'detail-linear-cove-lighting.jpg'],
  ['blog/downlight-buying-guide.html', 'detail-downlight-ceiling.jpg'],
  ['blog/how-long-does-custom-lighting-take.html', 'lab/measurement.jpg'],
  // ── resources ──
  ['resources/dialux-lighting-calculation-guide.html', 'lab/scientific-equipment.jpg'],
  ['resources/saso-2902-compliance-checklist.html', 'blog/saso-certification.jpg'],
  ['resources/lighting-specification-template.html', 'editorial-linear-lighting.jpg'],
];

let ok = 0, fail = 0, missingImg = 0;

for (const [page, img] of MAP) {
  const imgPath = path.join(IMG, img);
  if (!fs.existsSync(imgPath)) {
    console.log(`❌ 图片不存在: ${img}  (${page})`);
    missingImg++;
    continue;
  }
  const fp = path.join(PAGES, page);
  if (!fs.existsSync(fp)) {
    console.log(`❌ 页面不存在: ${page}`);
    fail++;
    continue;
  }
  let content = fs.readFileSync(fp, 'utf-8');
  const re = /^ogImage:\s*".*"$/m;
  if (!re.test(content)) {
    console.log(`⚠️  无 ogImage 行: ${page}`);
    fail++;
    continue;
  }
  const before = content.match(re)[0];
  content = content.replace(re, `ogImage: "${CDN}${img}"`);
  fs.writeFileSync(fp, content);
  console.log(`✅ ${page}\n   ${before}  →  ${img}`);
  ok++;
}

console.log(`\n📊 成功 ${ok} / 失败 ${fail} / 缺图 ${missingImg}`);

// 复查：全站 ogImage 重复度
console.log('\n── 复查：仍被多页共用的 ogImage（EN/AR 对除外）──');
const { walkDir } = require('../../build/utils');
const counts = {};
for (const f of walkDir(PAGES, '.html')) {
  const c = fs.readFileSync(f, 'utf-8');
  const m = c.match(/^ogImage:\s*"https:\/\/www\.yakeenlighting\.com\/images\/(.+?)"$/m);
  if (m) {
    counts[m[1]] = counts[m[1]] || [];
    counts[m[1]].push(path.relative(PAGES, f));
  }
}
let dup = 0;
for (const [img, pages] of Object.entries(counts)) {
  // EN/AR 语言对视为同一页
  const uniq = [...new Set(pages.map(p => p.replace(/-ar\.html$/, '.html')))];
  if (uniq.length > 1) {
    dup++;
    console.log(`🔗 ${img} → ${pages.join(', ')}`);
  }
}
console.log(dup === 0 ? '✅ 无跨页重复' : `\n⚠️  仍有 ${dup} 张跨页重复`);
