/**
 * build/sitemap.js — Auto-generate sitemap.xml from built pages
 */
const fs = require('fs');
const path = require('path');
const { DIST, SITE_BASE, PAGES } = require('./config');

// ─── Find AR counterpart for an EN page (and vice versa) ───
function findArCounterpart(relPath) {
  const normPath = relPath.replace(/\\/g, '/');
  if (normPath.endsWith('-ar.html') || normPath.includes('-ar/')) return null;

  let arPath = null;
  if (normPath.endsWith('/index.html')) {
    const dir = normPath.replace('/index.html', '');
    // Two AR conventions exist: a sibling file (dir/index-ar.html) and a
    // sibling directory (dir-ar/index.html). Check the file form first —
    // products/* pages use it, and without it their EN entries lose their
    // `ar` alternate, breaking hreflang reciprocity.
    const sibling = dir + '/index-ar.html';
    if (fs.existsSync(path.join(PAGES, sibling))) {
      return sibling;
    }
    arPath = dir + '-ar/index.html';
  } else if (normPath === 'index.html') {
    arPath = 'index-ar.html';
  } else {
    arPath = normPath.replace('.html', '-ar.html');
  }

  if (arPath && fs.existsSync(path.join(PAGES, arPath))) {
    return arPath.replace(/\\/g, '/');
  }
  return null;
}

function toUrlPath(relPath) {
  let p = relPath;
  if (p.endsWith('/index.html')) { p = p.slice(0, -10); }
  else if (p === 'index.html') { p = ''; }
  else if (p.endsWith('.html')) { p = p.slice(0, -5); }
  return p;
}

function getPriority(relPath) {
  if (relPath === 'index.html') return '1.0';
  if (relPath.startsWith('products/')) return '0.9';
  if (relPath.startsWith('solutions/')) return '0.9';
  if (relPath.startsWith('specification/')) return '0.9';
  if (relPath === 'engineering-hub.html') return '0.9';
  if (relPath === 'about.html') return '0.9';
  if (relPath.startsWith('markets/')) return '0.8';
  if (relPath.startsWith('blog/') && !relPath.endsWith('/index.html')) return '0.7';
  if (relPath.startsWith('resources/')) return '0.7';
  if (relPath === 'projects.html' || relPath === 'projects-ar.html') return '0.8';
  if (relPath.endsWith('-ar.html') || relPath.endsWith('-ru.html')) return '0.6';
  return '0.7';
}

function getChangefreq(relPath) {
  if (relPath === 'index.html') return 'weekly';
  if (relPath.startsWith('blog/')) return 'weekly';
  return 'monthly';
}

function getLastModified(relPath) {
  try {
    const srcPath = path.join(PAGES, relPath);
    if (fs.existsSync(srcPath)) {
      const stat = fs.statSync(srcPath);
      return stat.mtime.toISOString().split('T')[0];
    }
  } catch (e) {
    // fall through to default
  }
  return new Date().toISOString().split('T')[0];
}

function buildSitemap(pages) {
  const entries = [];

  for (const page of pages) {
    const relPath = page.relPath.replace(/\\/g, '/'); // Normalize to forward slashes for URLs
    if (relPath === '404.html' || relPath === 'offline.html' || relPath === 'thank-you.html') continue;

    const urlPath = toUrlPath(relPath);
    const loc = SITE_BASE + urlPath;
    const lang = page.lang || 'en';

    // Build hreflang alternates
    const alternates = [];
    alternates.push(`    <xhtml:link rel="alternate" hreflang="${lang}" href="${loc}" />`);

    const arCounterpart = findArCounterpart(relPath);
    if (arCounterpart) {
      const arUrl = SITE_BASE + toUrlPath(arCounterpart);
      alternates.push(`    <xhtml:link rel="alternate" hreflang="ar" href="${arUrl}" />`);
    } else if (lang === 'ar') {
      // For AR pages, find and add the EN counterpart
      let enPath = null;
      if (relPath.endsWith('-ar.html')) {
        enPath = relPath.replace('-ar.html', '.html');
      } else if (relPath.endsWith('-ar/index.html')) {
        enPath = relPath.replace('-ar/index.html', '/index.html');
      }
      if (enPath && fs.existsSync(path.join(PAGES, enPath))) {
        const enUrl = SITE_BASE + toUrlPath(enPath);
        alternates.push(`    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />`);
      }
    }

    // x-default resolves to the English version of this page (not the site root)
    const enCounterpart = relPath.endsWith('-ar.html')
      ? relPath.replace(/-ar\.html$/, '.html')
      : relPath.endsWith('-ar/index.html')
        ? relPath.replace(/-ar\/index\.html$/, '/index.html')
        : (lang === 'en' ? relPath : null);
    const xDefaultUrl = (enCounterpart && fs.existsSync(path.join(PAGES, enCounterpart)))
      ? SITE_BASE + toUrlPath(enCounterpart)
      : SITE_BASE;
    alternates.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultUrl}" />`);

    entries.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${getLastModified(relPath)}</lastmod>
    <changefreq>${getChangefreq(relPath)}</changefreq>
    <priority>${getPriority(relPath)}</priority>
${alternates.join('\n')}
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml);
  console.log(`🗺️  Sitemap: ${entries.length} URLs`);

  // Also emit sitemap-index.xml (required by some crawlers like Bing)
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_BASE}sitemap.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
</sitemapindex>
`;
  fs.writeFileSync(path.join(DIST, 'sitemap-index.xml'), indexXml);
  console.log(`🗺️  Sitemap index: sitemap-index.xml`);
}

module.exports = { buildSitemap };
