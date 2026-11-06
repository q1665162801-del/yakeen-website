/**
 * build/index.js — Main build orchestrator
 * 
 * Architecture:
 *   config.js    — paths and constants (CSS + JS bundles)
 *   utils.js     — shared helpers (file I/O, walk, front-matter, render)
 *   css.js       — CSS concatenation builder
 *   js.js        — JS bundle builder (concatenate modular source files)
 *   jsonld.js    — JSON-LD schema + GEO meta builders
 *   images.js    — image optimization (WebP, lazy load, dimensions)
 *   nav.js       — navigation renderer (data-driven from nav.json)
 *   page.js      — single page builder + template loader
 *   sitemap.js   — sitemap.xml generator
 * 
 * Usage: node build.js (or node build/index.js)
 */
const fs = require('fs');
const path = require('path');

const { ROOT, DIST, PAGES, STATIC_DIRS, ROOT_FILES } = require('./config');
const { walkDir, copyDir } = require('./utils');
const { buildCSS, purgeCSSFile } = require('./css');
const { buildJS } = require('./js');
const { loadTemplates, buildPage } = require('./page');
const { buildSitemap } = require('./sitemap');

async function build() {
  console.log('🏗️  Yakeen Lighting — Static Site Builder\n');

  // Clean dist
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST, { recursive: true });

  // Load templates
  const templates = loadTemplates();
  const tplCount = Object.keys(templates).length;
  console.log(`📦 Loaded ${tplCount} templates: ${Object.keys(templates).join(', ')}`);

  // Build concatenated CSS from modular source files (must be before pages — pages reference the hashed filename)
  const { cssFile, rtlCssFile } = await buildCSS();

  // Build concatenated JS bundle with content hash (must be before pages — pages reference the hashed filename)
  const jsFile = buildJS();

  // Generate 768px WebP variants for content images before pages are rendered,
  // so build/images.js can reference them in the mobile <source> element.
  console.log('\n📱  Generating mobile image variants...');
  const { generateMobileImages } = require('./responsive-images');
  await generateMobileImages();

  // Build pages (needs cssFile for cache-busted CSS reference)
  const pageFiles = walkDir(PAGES, '.html');
  const built = [];

  for (const page of pageFiles) {
    try {
      const result = buildPage(page, templates, { cssFile, jsFile, rtlCssFile });
      built.push(result);
    } catch (e) {
      console.error(`❌ Failed to build ${path.relative(PAGES, page)}:`, e.message);
      console.error(`\n❌ Build aborted — fix the page error and rebuild.`);
      process.exit(1);
    }
  }

  console.log(`\n📄 Built ${built.length} pages`);

  // Normalize hero image sources BEFORE they are copied into dist/.
  // Guarantees no desktop WebP is ever heavier/wider than its JPG sibling.
  console.log('\n🖼️  Normalizing hero image sources...');
  const { optimizeHeroes } = require('./optimize-hero');
  await optimizeHeroes();

  // Generate mobile-sized hero images (768px WebP) — also before the copy so
  // freshly created variants land in dist/ (previously ran after, so new heroes
  // never got their mobile version published).
  console.log('\n📱  Generating mobile hero images...');
  const { generateMobileHeroes } = require('./hero-mobile');
  await generateMobileHeroes();

  // Copy static asset directories
  for (const dir of STATIC_DIRS) {
    const srcDir = path.join(ROOT, dir);
    if (fs.existsSync(srcDir)) {
      copyDir(srcDir, path.join(DIST, dir));
      console.log(`📁 Copied ${dir}/`);
    }
  }

  // Copy root-level static files
  for (const file of ROOT_FILES) {
    const srcFile = path.join(ROOT, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(DIST, file));
      console.log(`📄 Copied ${file}`);
    }
  }

  // Auto-generate sitemap.xml
  buildSitemap(built);

  // Build internal link network (SEO) — must be BEFORE PurgeCSS
  // so injected CSS classes are preserved in the purged stylesheet
  console.log('\n🔗 Building internal link network...');
  const { buildInternalLinks } = require('./internal-links');
  buildInternalLinks();

  // Skip PurgeCSS — CSS is ~50KB, saving ~25KB is not worth the ongoing risk
  // of PurgeCSS incorrectly removing selectors that ARE used in HTML.
  console.log('\n🧹 PurgeCSS — skipped (CSS small enough, purge risk > benefit)');
  const finalCssFile = cssFile;

  // Update all HTML files to reference the final (purged) CSS filename
  if (finalCssFile !== cssFile) {
    let updated = 0;
    const allHtml = walkDir(DIST, '.html');
    for (const htmlFile of allHtml) {
      let content = fs.readFileSync(htmlFile, 'utf-8');
      if (content.includes(cssFile)) {
        content = content.replace(new RegExp(cssFile.replace(/\./g, '\\.'), 'g'), finalCssFile);
        fs.writeFileSync(htmlFile, content);
        updated++;
      }
    }
    console.log(`   Updated ${updated} HTML files → ${finalCssFile}`);
  }

  // Inject WebP + mobile responsive into hero background images
  console.log('\n🖼️  Injecting WebP hero backgrounds...');
  const { heroWebpInject } = require('./hero-webp');
  heroWebpInject();

  // Mark below-the-fold background images for lazy loading
  console.log('\n🐢  Marking below-the-fold background images for lazy loading...');
  const { bgLazyMark } = require('./bg-lazy');
  bgLazyMark();

  // Inject lazy-loader JS into pages that have lazy-bg elements
  console.log('\n⚡  Injecting background-image lazy loader...');
  const { injectLazyLoader } = require('./bg-lazy-inject');
  injectLazyLoader();

  // Stats
  const distSize = walkDir(DIST).reduce((sum, f) => sum + fs.statSync(f).size, 0);

  console.log(`\n✅ Build complete! Output: dist/ (${(distSize / 1024).toFixed(1)} KB)`);
  console.log(`\n📊 Breakdown:`);
  console.log(`   Pages:     ${built.length}`);
  console.log(`   Templates: ${tplCount}`);
  console.log(`   Static:    ${STATIC_DIRS.filter(d => fs.existsSync(path.join(ROOT, d))).length} dirs`);

  // Build audit (quality gates)
  console.log('\n🔍 Running build audit...');
  try {
    const { runAudit } = require('../scripts/audit-build.js');
    const result = runAudit();
    if (result.errors > 0) {
      console.log(`\n❌ Audit failed with ${result.errors} error(s). Build aborted.`);
      process.exit(1);
    }
  } catch (e) {
    console.log(`⚠️  Audit script error: ${e.message} (continuing anyway)`);
  }

  return built;
}

// Run if called directly
if (require.main === module) {
  build();
}

module.exports = { build };
