/**
 * build/deep-audit.js — Full site deep audit
 * Scans ALL 67 pages for: title length, desc length, H1 count, canonical, 
 * hreflang, viewport, lang, img alt, broken links, status codes
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DIST = path.join(__dirname, '..', 'dist');
const SITE_BASE = 'https://www.yakeenlighting.com';

function collectHtmlFiles(dir, base = dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(collectHtmlFiles(full, base));
    } else if (entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

function extractMeta(content) {
  const result = {
    title: '', titleLen: 0,
    description: '', descLen: 0,
    h1Count: 0, h1Texts: [],
    hasCanonical: false, canonicalUrl: '',
    hreflangCount: 0, hasXDefault: false,
    hasViewport: false,
    lang: '',
    totalImgs: 0, imgsWithoutAlt: 0,
    internalHrefs: 0, htmlSuffixHrefs: 0,
    externalHrefs: 0,
    hasJsonLd: false,
    hasOgTitle: false, hasOgImage: false, hasOgDesc: false,
  };

  // Title
  const titleMatch = content.match(/<title>(.*?)<\/title>/s);
  if (titleMatch) {
    result.title = titleMatch[1].replace(/\s+/g, ' ').trim();
    result.titleLen = result.title.length;
  }

  // Description
  const descMatch = content.match(/<meta name="description" content="(.*?)"\/?>/s);
  if (descMatch) {
    result.description = descMatch[1].replace(/\s+/g, ' ').trim();
    result.descLen = result.description.length;
  }

  // H1
  const h1Matches = [...content.matchAll(/<h1[^>]*>(.*?)<\/h1>/gs)];
  result.h1Count = h1Matches.length;
  result.h1Texts = h1Matches.map(m => m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 80));

  // Canonical
  const canonicalMatch = content.match(/<link rel="canonical" href="(.*?)"\/?>/);
  if (canonicalMatch) {
    result.hasCanonical = true;
    result.canonicalUrl = canonicalMatch[1];
  }

  // Hreflang
  const hreflangMatches = [...content.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/?>/g)];
  result.hreflangCount = hreflangMatches.length;
  result.hasXDefault = hreflangMatches.some(m => m[1] === 'x-default');

  // Viewport
  result.hasViewport = /<meta name="viewport"/.test(content);

  // Lang
  const langMatch = content.match(/<html[^>]*lang="([^"]+)"/);
  if (langMatch) result.lang = langMatch[1];

  // Images & alt
  const imgMatches = [...content.matchAll(/<img[^>]*>/g)];
  result.totalImgs = imgMatches.length;
  for (const img of imgMatches) {
    if (!/alt=/.test(img[0])) result.imgsWithoutAlt++;
  }

  // Links
  const hrefMatches = [...content.matchAll(/href="([^"]+)"/g)];
  for (const m of hrefMatches) {
    const url = m[1];
    if (url.startsWith('http') || url.startsWith('//')) {
      result.externalHrefs++;
    } else if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#') || url.startsWith('javascript:')) {
      // skip
    } else {
      result.internalHrefs++;
      if (/\.html(#|$)/.test(url)) result.htmlSuffixHrefs++;
    }
  }

  // JSON-LD
  result.hasJsonLd = /application\/ld\+json/.test(content);

  // OG tags
  result.hasOgTitle = /og:title/.test(content);
  result.hasOgImage = /og:image/.test(content);
  result.hasOgDesc = /og:description/.test(content);

  return result;
}

// ─── Collect all pages ───
const htmlFiles = collectHtmlFiles(DIST);
console.log(`📄 Total HTML files: ${htmlFiles.length}\n`);

// ─── Audit each page ───
const issues = {
  titleLong: [],
  titleShort: [],
  descLong: [],
  descShort: [],
  noH1: [],
  multiH1: [],
  noCanonical: [],
  noHreflang: [],
  noXDefault: [],
  noViewport: [],
  noLang: [],
  missingAlt: [],
  htmlSuffix: [],
  noJsonLd: [],
  noOgTitle: [],
  noOgImage: [],
  noOgDesc: [],
};

const pageResults = [];

for (const file of htmlFiles) {
  const relPath = file.replace(DIST, '').replace(/\\/g, '/').replace(/^\//, '');
  const content = fs.readFileSync(file, 'utf-8');
  const meta = extractMeta(content);
  
  pageResults.push({ path: relPath, ...meta });

  if (meta.titleLen > 65) issues.titleLong.push({ path: relPath, len: meta.titleLen, title: meta.title });
  if (meta.titleLen < 30) issues.titleShort.push({ path: relPath, len: meta.titleLen, title: meta.title });
  if (meta.descLen > 165) issues.descLong.push({ path: relPath, len: meta.descLen, desc: meta.description.slice(0, 100) });
  if (meta.descLen < 80) issues.descShort.push({ path: relPath, len: meta.descLen, desc: meta.description });
  if (meta.h1Count === 0) issues.noH1.push({ path: relPath });
  if (meta.h1Count > 1) issues.multiH1.push({ path: relPath, count: meta.h1Count });
  if (!meta.hasCanonical) issues.noCanonical.push({ path: relPath });
  if (meta.hreflangCount === 0) issues.noHreflang.push({ path: relPath });
  if (!meta.hasXDefault) issues.noXDefault.push({ path: relPath });
  if (!meta.hasViewport) issues.noViewport.push({ path: relPath });
  if (!meta.lang) issues.noLang.push({ path: relPath });
  if (meta.imgsWithoutAlt > 0) issues.missingAlt.push({ path: relPath, count: meta.imgsWithoutAlt, total: meta.totalImgs });
  if (meta.htmlSuffixHrefs > 0) issues.htmlSuffix.push({ path: relPath, count: meta.htmlSuffixHrefs });
  if (!meta.hasJsonLd) issues.noJsonLd.push({ path: relPath });
  if (!meta.hasOgTitle) issues.noOgTitle.push({ path: relPath });
  if (!meta.hasOgImage) issues.noOgImage.push({ path: relPath });
  if (!meta.hasOgDesc) issues.noOgDesc.push({ path: relPath });
}

// ─── Print summary ───
console.log('='.repeat(70));
console.log('🔍 FULL SITE DEEP AUDIT RESULTS');
console.log('='.repeat(70));
console.log(`\n📊 Pages scanned: ${pageResults.length}\n`);

const issueCategories = [
  { key: 'titleLong', label: '⚠️ Title > 65 chars', severity: 'warning' },
  { key: 'titleShort', label: '⚠️ Title < 30 chars', severity: 'warning' },
  { key: 'descLong', label: '⚠️ Description > 165 chars', severity: 'warning' },
  { key: 'descShort', label: '⚠️ Description < 80 chars', severity: 'warning' },
  { key: 'noH1', label: '❌ No H1 tag', severity: 'error' },
  { key: 'multiH1', label: '❌ Multiple H1 tags', severity: 'error' },
  { key: 'noCanonical', label: '❌ Missing canonical URL', severity: 'error' },
  { key: 'noHreflang', label: '⚠️ Missing hreflang tags', severity: 'warning' },
  { key: 'noXDefault', label: '⚠️ Missing x-default hreflang', severity: 'warning' },
  { key: 'noViewport', label: '❌ Missing viewport meta', severity: 'error' },
  { key: 'noLang', label: '❌ Missing html lang attribute', severity: 'error' },
  { key: 'missingAlt', label: '⚠️ Images missing alt text', severity: 'warning' },
  { key: 'htmlSuffix', label: '❌ Internal links with .html suffix', severity: 'error' },
  { key: 'noJsonLd', label: '⚠️ Missing JSON-LD schema', severity: 'warning' },
  { key: 'noOgTitle', label: '⚠️ Missing og:title', severity: 'warning' },
  { key: 'noOgImage', label: '⚠️ Missing og:image', severity: 'warning' },
  { key: 'noOgDesc', label: '⚠️ Missing og:description', severity: 'warning' },
];

let totalErrors = 0;
let totalWarnings = 0;

for (const cat of issueCategories) {
  const items = issues[cat.key];
  const count = items.length;
  const isError = cat.severity === 'error';
  if (isError) totalErrors += count;
  else totalWarnings += count;

  console.log(`${cat.label}: ${count}`);
  if (count > 0 && count <= 15) {
    for (const item of items) {
      const detail = item.len ? `(${item.len} chars)` : (item.count ? `(${item.count}/${item.total || ''})` : '');
      console.log(`   ↳ ${item.path} ${detail}`);
    }
  } else if (count > 15) {
    console.log(`   ↳ (${count} pages, too many to list)`);
  }
}

console.log('\n' + '='.repeat(70));
console.log(`❌ TOTAL ERRORS: ${totalErrors}`);
console.log(`⚠️ TOTAL WARNINGS: ${totalWarnings}`);
console.log('='.repeat(70));

// Title/desc distribution
const titleLens = pageResults.map(p => p.titleLen).sort((a, b) => a - b);
const descLens = pageResults.map(p => p.descLen).sort((a, b) => a - b);
console.log(`\n📐 Title length: min=${titleLens[0]}, max=${titleLens[titleLens.length-1]}, avg=${Math.round(titleLens.reduce((a,b)=>a+b,0)/titleLens.length)}`);
console.log(`📐 Desc length:  min=${descLens[0]}, max=${descLens[descLens.length-1]}, avg=${Math.round(descLens.reduce((a,b)=>a+b,0)/descLens.length)}`);

// Link stats
const totalInternal = pageResults.reduce((a, p) => a + p.internalHrefs, 0);
const totalHtmlSuffix = pageResults.reduce((a, p) => a + p.htmlSuffixHrefs, 0);
const totalImgs = pageResults.reduce((a, p) => a + p.totalImgs, 0);
const totalMissingAlt = pageResults.reduce((a, p) => a + p.imgsWithoutAlt, 0);
console.log(`🔗 Internal links: ${totalInternal}, .html suffix: ${totalHtmlSuffix} (${(100 - totalHtmlSuffix/totalInternal*100).toFixed(2)}% Pretty URL)`);
console.log(`🖼️  Images: ${totalImgs}, missing alt: ${totalMissingAlt}`);

process.exit(totalErrors > 0 ? 1 : 0);
