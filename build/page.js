/**
 * build/page.js — Single page builder
 * Reads a source page, processes front-matter, assembles templates,
 * and applies post-processing optimizations (WebP, lazy loading, image dimensions).
 */
const fs = require('fs');
const path = require('path');

const { PAGES, DIST, ROOT, SITE_BASE } = require('./config');
const { readFile, writeFile, parseFrontMatter, getBasePath, render } = require('./utils');
const { buildPageSchema, buildBreadcrumbSchema, extractFaqSchema } = require('./jsonld');
const { buildAnalyticsHead } = require('./analytics');
const { renderNav } = require('./nav');
const { optimizeImages } = require('./images');
const { EMAIL, PHONE_DISPLAY, PHONE_TEL, WHATSAPP_NUMBER, WHATSAPP_DISPLAY } = require('./site-config');

// ─── Bilingual counterpart resolver ───
// The site stores bilingual pairs in two layouts:
//   flat:        page.html            / page-ar.html
//   nested dir:  products/x/index.html / products/x/index-ar.html
// Returns page paths (relative to src/pages) AND public URL paths (root-relative).
function resolveCounterparts(normPath) {
  // Root home
  if (normPath === 'index.html' || normPath === 'index-ar.html') {
    return {
      enPath: 'index.html', enUrl: '/',
      arPath: 'index-ar.html', arUrl: '/index-ar',
    };
  }

  // Nested directory index — Arabic lives beside it as index-ar.html
  if (normPath.endsWith('/index.html')) {
    const dir = normPath.slice(0, -'/index.html'.length);
    return {
      enPath: normPath, enUrl: '/' + dir + '/',
      arPath: dir + '/index-ar.html', arUrl: '/' + dir + '/index-ar',
    };
  }
  if (normPath.endsWith('/index-ar.html')) {
    const dir = normPath.slice(0, -'/index-ar.html'.length);
    return {
      enPath: dir + '/index.html', enUrl: '/' + dir + '/',
      arPath: normPath, arUrl: '/' + dir + '/index-ar',
    };
  }

  // Flat page — page.html / page-ar.html
  if (normPath.endsWith('-ar.html')) {
    const enPath = normPath.replace(/-ar\.html$/, '.html');
    return {
      enPath, enUrl: '/' + enPath.replace(/\.html$/, ''),
      arPath: normPath, arUrl: '/' + normPath.replace(/\.html$/, ''),
    };
  }
  return {
    enPath: normPath, enUrl: '/' + normPath.replace(/\.html$/, ''),
    arPath: normPath.replace(/\.html$/, '-ar.html'), arUrl: '/' + normPath.replace(/\.html$/, '-ar'),
  };
}

// ─── Hreflang tag builder ───
function buildHreflang(relPath, lang, canonical) {
  const normPath = relPath.replace(/\\/g, '/');
  const { enPath, enUrl, arPath, arUrl } = resolveCounterparts(normPath);

  const tags = [`  <link rel="alternate" hreflang="${lang}" href="${canonical}">`];
  if (lang === 'en' && fs.existsSync(path.join(PAGES, arPath))) {
    tags.push(`  <link rel="alternate" hreflang="ar" href="${SITE_BASE.replace(/\/$/, '') + arUrl}">`);
  } else if (lang === 'ar' && fs.existsSync(path.join(PAGES, enPath))) {
    tags.push(`  <link rel="alternate" hreflang="en" href="${SITE_BASE.replace(/\/$/, '') + enUrl}">`);
  }
  // x-default must resolve to the page's English version, not the site root.
  // For AR pages it points at the EN counterpart; AR-only pages fall back to root.
  const siteBase = SITE_BASE.replace(/\/$/, '');
  const hasEnVersion = fs.existsSync(path.join(PAGES, enPath));
  const xDefaultUrl = hasEnVersion
    ? siteBase + (enUrl === '/index' ? '/' : enUrl)
    : siteBase + '/';
  tags.push(`  <link rel="alternate" hreflang="x-default" href="${xDefaultUrl}">`);

  const hasArVersion = fs.existsSync(path.join(PAGES, arPath));
  return { tags: tags.join('\n'), hasArVersion };
}

// ─── Language switch URL builder (root-relative, base-proof) ───
function buildArSwitch(lang, normPath) {
  const { enPath, enUrl, arPath, arUrl } = resolveCounterparts(normPath);

  if (lang === 'en') {
    const hasCounterpart = fs.existsSync(path.join(PAGES, arPath));
    return { switchUrl: hasCounterpart ? arUrl : '/index-ar', hasCounterpart };
  }

  const hasCounterpart = fs.existsSync(path.join(PAGES, enPath));
  // An Arabic page without an English counterpart must send visitors to the
  // English home, never back to the Arabic home.
  return { switchUrl: hasCounterpart ? enUrl : '/', hasCounterpart };
}

// ─── Build a single page ───
function buildPage(pagePath, templates, buildAssets = {}) {
  const relPath = path.relative(PAGES, pagePath);
  const raw = readFile(pagePath);
  const { data: fm, content: pageContent } = parseFrontMatter(raw);

  const base = getBasePath(relPath);
  const lang = fm.lang || 'en';
  const navVariant = fm.navVariant || 'transparent';

  // Auto-generate canonical URL (always Pretty URL format)
  let canonical = fm.canonical || '';
  if (canonical) {
    // Normalize manually-specified canonical to Pretty URL format
    // Case 1: /path/index.html → /path/
    canonical = canonical.replace(/\/index\.html(#.*)?$/, '/$1');
    // Case 2: /path.html → /path
    canonical = canonical.replace(/\.html(#.*)?$/, '$1');
    // Clean up: if anchor only remains after /, keep the slash
    canonical = canonical.replace(/\/#/, '#');
  } else {
    let urlPath = relPath.replace(/\\/g, '/');
    if (urlPath.endsWith('/index.html')) {
      urlPath = urlPath.slice(0, -10);
    } else if (urlPath === 'index.html') {
      urlPath = '';
    } else if (urlPath.endsWith('.html')) {
      urlPath = urlPath.slice(0, -5);
    }
    canonical = SITE_BASE + urlPath;
  }

  // Hreflang + Arabic nav switch
  const normPath = relPath.replace(/\\/g, '/');

  // Every page gets a stable identity class on <body> so page-level overrides
  // can be scoped (`.page--about .card`) instead of reaching for #id-level
  // specificity or inline styles. Purely additive — no rule targets page--*
  // today, so rendering is unchanged.
  const autoPageClass = 'page--' + (
    normPath === 'index.html'
      ? 'home'
      : normPath.replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\//g, '-')
  );

  const { tags: hreflangTags, hasArVersion } = buildHreflang(relPath, lang, canonical);
  const { switchUrl: arSwitchUrl } = buildArSwitch(lang, normPath);

  // Build breadcrumb from URL path
  const breadcrumbItems = [];
  const pathParts = relPath.replace(/\\/g, '/').split('/').filter(p => p && p !== 'index.html');
  if (pathParts.length > 0 || normPath !== 'index.html') {
    breadcrumbItems.push({ name: 'Home', url: SITE_BASE });
    let accumPath = '';
    for (let i = 0; i < pathParts.length; i++) {
      let part = pathParts[i];
      const isLast = i === pathParts.length - 1;
      let name = part;
      if (part === 'blog') name = 'Insights';
      else if (part === 'products') name = 'Products';
      else if (part === 'solutions') name = 'Solutions';
      else if (part === 'markets') name = 'Markets';
      else if (part === 'resources') name = 'Resources';
      else if (part.endsWith('.html')) name = fm.title || part.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      else if (part === 'index.html') name = 'Home';
      else name = part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      accumPath += '/' + part;
      const itemUrl = isLast ? null : SITE_BASE + accumPath.replace(/\.html$/, '').replace(/\/index$/, '/');
      breadcrumbItems.push({ name, url: itemUrl });
    }
    // Fix last item: use page title, no URL (current page)
    if (breadcrumbItems.length > 1) {
      const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
      lastItem.name = fm.title || lastItem.name;
      lastItem.url = undefined;
    }
  }
  const breadcrumbSchema = breadcrumbItems.length > 1
    ? buildBreadcrumbSchema(breadcrumbItems, canonical)
    : '';

  // Template variables
  const vars = {
    title: fm.title || 'Yakeen Lighting',
    description: fm.description || 'Custom architectural lighting for GCC projects.',
    ogImage: fm.ogImage || `${SITE_BASE}images/logo-yakeen.png`,
    // Hero image preload is handled by build/hero-webp.js (post-build step)
    // which injects WebP-aware preload + image-set for all hero backgrounds.
    heroPreload: '',
    navVariant,
    lang,
    base,
    content: pageContent.trim(),
    pageClass: `${autoPageClass}${fm.pageClass ? ' ' + fm.pageClass : ''}${fm.type === 'country' ? ' gcc-country-page' : ''}`.trim(),
    canonical,
    hreflangTags,
    pageSchema: buildPageSchema({ ...fm, canonical }, base),
    breadcrumbSchema,
    // Pages that declare `faq: true` already get a curated FAQPage schema from
    // buildPageSchema — skip auto-extraction to avoid emitting it twice.
    faqSchema: fm.faq === true ? '' : extractFaqSchema(pageContent, canonical),
    arSwitchUrl,
    hasArVersion,
    arPartialClass: hasArVersion ? '' : 'nav-link--ar-partial',
    arHintHtml: hasArVersion ? '' : '<span class="nav-ar-hint">Home</span>',
    ogLocale: lang === 'ar' ? 'ar_SA' : 'en_US',
    ogLocaleAlternate: lang === 'ar' ? 'en_US' : 'ar_SA',
    robots: fm.robots || 'index, follow',
    arabicFont: lang === 'ar'
      ? `<link rel="preload" href="${base}assets/fonts/tajawal-arabic-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${base}assets/fonts/tajawal-arabic-700.woff2" as="font" type="font/woff2" crossorigin>`
      : '',
    rtlCss: lang === 'ar'
      ? `<link rel="stylesheet" href="${base}css/${buildAssets.rtlCssFile || 'rtl.css'}">`
      : '',
    analyticsHead: buildAnalyticsHead(),
    cssFile: buildAssets.cssFile || 'yakeen.css',
    jsFile: buildAssets.jsFile || 'yakeen.js',
    EMAIL,
    PHONE_DISPLAY,
    PHONE_TEL,
    WHATSAPP_NUMBER,
    WHATSAPP_DISPLAY,
  };

  // Select templates by language
  const headTpl = templates[`head-${lang}`] || templates.head || '';
  const footerTpl = templates[`footer-${lang}`] || templates.footer || '';
  const ctaTpl = templates[`cta-${lang}`] || templates.cta || '';
  const scriptsTpl = templates.scripts || '';

  // Render sub-templates
  const head = render(headTpl, vars);
  const nav = fm.hideNav ? '' : render(renderNav(base, navVariant, lang), vars);
  const footer = fm.hideFooter ? '' : render(footerTpl, vars);
  const cta = fm.hideCta ? '' : render(ctaTpl, vars);
  const scripts = render(scriptsTpl, vars);

  // Assemble full page — render page content too so {{EMAIL}} etc. get resolved
  let html = `<!DOCTYPE html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head>
${head}
</head>
<body id="yakeen-page" class="${vars.pageClass}">
  <a href="#main-content" class="skip-link">Skip to main content</a>
${nav}
  <main id="main-content">
${render(vars.content, vars)}
${cta}
  </main>
${footer}
${scripts}
</body>
</html>
`;

  // Post-processing: image optimization
  const pageOutDir = path.dirname(path.join(DIST, relPath));
  const imgResult = optimizeImages(html, pageOutDir, fm);
  html = imgResult.html;

  // Hero image preload is handled by build/hero-webp.js (post-build step)
  // which injects WebP-only preload + image-set for all hero backgrounds.
  // Old logic below disabled to avoid double preload (JPG + WebP).

  // Post-processing: convert internal links to Pretty URL format
  // Removes .html suffix so Cloudflare Pretty URLs don't trigger 308 redirects
  html = html.replace(/href="([^"]+)\.html(#[^"]*)?"/gi, (match, urlPath, anchor) => {
    // Skip external URLs and non-http protocols
    if (urlPath.startsWith('http') || urlPath.startsWith('//') || urlPath.startsWith('mailto:') || 
        urlPath.startsWith('tel:') || urlPath.startsWith('#') || urlPath.startsWith('javascript:')) {
      return match;
    }
    // Skip absolute URLs to our own domain that have full path (handled by relative)
    if (urlPath.includes('yakeenlighting.com')) return match;
    
    let pretty = urlPath;
    // NOTE: the capture group above already consumed the trailing ".html",
    // so these checks must test the stripped form ("/index", bare "index").
    // Directory index → keep the trailing slash so Cloudflare serves it directly
    // instead of issuing a 308 redirect (e.g. products/downlights/index → products/downlights/).
    if (pretty.endsWith('/index.html')) {
      pretty = pretty.slice(0, -10);
    } else if (pretty.endsWith('/index')) {
      pretty = pretty.slice(0, -5);
    } else if (pretty === 'index.html' || pretty === 'index') {
      pretty = './';
    } else if (pretty.endsWith('.html')) {
      pretty = pretty.slice(0, -5);
    }
    return `href="${pretty}${anchor || ''}"`;
  });

  // Post-processing: fix heading anchor IDs (slug from text)
  html = fixHeadingAnchors(html);

  const outPath = path.join(DIST, relPath);
  writeFile(outPath, html);

  return { relPath, title: fm.title, lang, navVariant };
}

// ─── Load templates from disk ───
function loadTemplates() {
  const { TEMPLATES } = require('./config');
  const templates = {};
  if (!fs.existsSync(TEMPLATES)) return templates;

  for (const file of fs.readdirSync(TEMPLATES)) {
    if (file.endsWith('.html')) {
      const name = path.basename(file, '.html');
      templates[name] = readFile(path.join(TEMPLATES, file));
    }
  }
  return templates;
}

// ─── Fix heading anchor IDs ───
// 1. Generates consistent slugs from h2/h3 text
// 2. Fuzzy-matches TOC links to h2 headings and fixes hrefs
function fixHeadingAnchors(html) {
  // Only process pages with <article> tags (blog articles with TOC)
  // Non-article pages (products, solutions, etc.) have their own anchor IDs
  // that should not be slugified or remapped.
  if (!/<article[\s>]/i.test(html)) return html;

  // Collect ALL existing IDs first to avoid collisions
  const usedIds = new Set();
  const existingIdRegex = /id="([^"]+)"/g;
  let idMatch;
  while ((idMatch = existingIdRegex.exec(html)) !== null) {
    usedIds.add(idMatch[1]);
  }
  
  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  function makeUnique(base) {
    let id = base;
    let i = 2;
    while (usedIds.has(id)) {
      id = `${base}-${i}`;
      i++;
    }
    usedIds.add(id);
    return id;
  }
  
  // Step 1: Collect all h2/h3 headings. Authored IDs are kept verbatim —
  // slug generation is only a fallback for headings without one. This matters
  // for Arabic headings, where slugify() returns '' and would otherwise
  // collapse the slug list and corrupt the positional TOC remap below.
  const headings = [];
  const h2h3Regex = /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/g;
  let match;
  while ((match = h2h3Regex.exec(html)) !== null) {
    const tag = match[1];
    const attrs = match[2];
    const innerText = match[3];
    const text = innerText.replace(/<[^>]+>/g, '').trim();
    if (!text) continue;
    const existingId = (attrs.match(/id="([^"]*)"/) || [])[1];
    if (existingId) {
      headings.push({ tag, text, slug: existingId, fullMatch: match[0], attrs, innerText, hasId: true });
      continue;
    }
    let slug = slugify(text);
    if (!slug) slug = `section-${headings.length + 1}`;
    const uniqueId = makeUnique(slug);
    headings.push({ tag, text, slug: uniqueId, fullMatch: match[0], attrs, innerText, hasId: false });
  }

  // Step 2: Add generated IDs to headings that lack one. Headings with
  // authored IDs are left untouched.
  let result = html;
  for (const h of headings) {
    if (h.hasId) continue;
    const newTag = `<${h.tag} id="${h.slug}"${h.attrs}>${h.innerText}</${h.tag}>`;
    result = result.replace(h.fullMatch, newTag);
  }
  
  // Step 3: Fix TOC anchor links — map by position (i-th TOC link → i-th h2)
  // Iterate ALL TOC links in order; remap only broken ones to h2 at same position
  const tocLinkRegex = /href="#([a-z0-9][a-z0-9-]*)"/g;
  const skipAnchors = new Set(['main-content', 'top', '']);
  const h2Slugs = headings.filter(h => h.tag === 'h2').map(h => h.slug);

  // Collect TOC anchor links in order (within article body)
  const bodyMatch = result.match(/<article[\s\S]*?<\/article>/i) || [result];
  const bodyHtml = bodyMatch[0] || result;

  let tocIdx = 0;
  let lm;
  while ((lm = tocLinkRegex.exec(bodyHtml)) !== null) {
    const slug = lm[1];
    if (skipAnchors.has(slug)) continue;
    // If this TOC link doesn't match any h2 slug, remap by position
    if (!h2Slugs.includes(slug) && tocIdx < h2Slugs.length) {
      result = result.replace(lm[0], `href="#${h2Slugs[tocIdx]}"`);
    }
    tocIdx++;
  }

  return result;
}

module.exports = { buildPage, loadTemplates };
