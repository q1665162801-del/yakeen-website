/* ============================================================
   Build Audit — Pre-deployment quality checks
   
   Runs after build and verifies:
   1. CSS selectors are actually used in HTML/JS (dead code detection)
   2. HTML class references exist in CSS (missing styles detection)
   3. Redirect rules won't cause loops
   4. No broken internal links
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

let errors = 0;
let warnings = 0;

function log(level, msg) {
  const prefix = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '✅';
  console.log(`  ${prefix} ${msg}`);
  if (level === 'ERROR') errors++;
  if (level === 'WARN') warnings++;
}

// ─── 1. Extract all CSS selectors ───
function extractSelectors(css) {
  const selectors = new Set();
  
  // Remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Match selector blocks (simple regex approach)
  const blockRegex = /([^{}]+)\s*\{/g;
  let match;
  while ((match = blockRegex.exec(css)) !== null) {
    const selectorStr = match[1].trim();
    
    // Skip @-rules (media, keyframes, etc.)
    if (selectorStr.startsWith('@')) continue;
    
    // Split comma-separated selectors
    const parts = selectorStr.split(',').map(s => s.trim()).filter(s => s);
    for (const part of parts) {
      // Clean pseudo-classes/elements for matching purposes
      let clean = part
        .replace(/::?[\w-]+(\([^)]*\))?/g, '')  // :hover, ::before, :nth-child()
        .replace(/\[.*?\]/g, '')                  // [attr=val]
        .replace(/[>+~]/g, ' ')                    // combinators
        .replace(/\s+/g, ' ')
        .trim();
      
      if (clean) selectors.add(part.trim());
    }
  }
  
  return selectors;
}

// ─── 2. Extract all class names from HTML ───
function extractClassesFromHTML(html) {
  const classes = new Set();
  const classRegex = /class="([^"]+)"/g;
  let match;
  while ((match = classRegex.exec(html)) !== null) {
    const classNames = match[1].split(/\s+/).filter(c => c);
    for (const c of classNames) classes.add(c);
  }
  return classes;
}

// Known dynamic classes (added by JS at runtime)
const DYNAMIC_CLASSES = new Set([
  'revealed', 'active', 'open', 'scrolled', 'mobile-open',
  'nav-open', 'is-visible', 'loaded', 'playing', 'paused',
  'current', 'selected', 'focused', 'error',
  'success', 'valid', 'invalid', 'submitted', 'copied',
  'nav--scrolled', 'is-current', 'is-active', 'is-open',
  // added by JS but not always present in runtime JS text
  'show', 'img-loaded'
]);

// ─── 2b. Collect class-name tokens from runtime JS + inline <script> ───
// Runtime JS injects classes (mobile menu, form feedback, card effects, reveal
// animations). Without this, dead-code detection false-positives on every
// class that never appears in a static class="..." attribute.
function collectJSTokens(htmlFiles) {
  const tokens = new Set();

  const jsFiles = [];
  (function walkJs(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walkJs(fullPath);
      else if (entry.name.endsWith('.js')) jsFiles.push(fullPath);
    }
  })(path.join(ROOT, 'js'));

  for (const f of jsFiles) {
    const src = fs.readFileSync(f, 'utf-8');
    for (const t of (src.match(/[a-zA-Z_][a-zA-Z0-9_-]*/g) || [])) tokens.add(t);
  }

  for (const f of htmlFiles) {
    const html = fs.readFileSync(f, 'utf-8');
    const scriptRe = /<script([^>]*)>([\s\S]*?)<\/script>/g;
    let m;
    while ((m = scriptRe.exec(html)) !== null) {
      const attrs = m[1] || '';
      // Skip data blocks (JSON-LD / JSON). They are structured data, not runtime
      // code — counting their keys (e.g. "author") would hide real dead CSS.
      if (/type\s*=\s*["'](application\/(ld\+)?json|application\/json)["']/i.test(attrs)) continue;
      const body = m[2] || '';
      for (const t of (body.match(/[a-zA-Z_][a-zA-Z0-9_-]*/g) || [])) tokens.add(t);
    }
  }

  return tokens;
}

// ─── 3. Extract all href links from HTML ───
function extractLinksFromHTML(html, basePath) {
  const links = new Set();
  const hrefRegex = /href="([^"]+)"/g;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    // Skip external, data URIs, mailto, anchors, javascript, tel
    if (href.startsWith('http') || href.startsWith('mailto:') || 
        href.startsWith('#') || href.startsWith('javascript:') ||
        href.startsWith('tel:') || href.startsWith('data:') ||
        href.startsWith('//')) continue;
    
    // Resolve relative path
    let resolved;
    if (href.startsWith('/')) {
      resolved = href.slice(1); // absolute path from root
    } else {
      const dir = path.dirname(basePath);
      resolved = path.relative(DIST, path.join(dir, href)).replace(/\\/g, '/');
    }
    
    // Remove query string and hash for file existence check
    const clean = resolved.split('?')[0].split('#')[0];
    links.add({ original: href, resolved: clean });
  }
  return links;
}

// ─── 4. Check redirect rules for loops ───
function checkRedirectRules() {
  console.log('\n🔄 Checking redirect rules...');
  
  const redirectsPath = path.join(DIST, '_redirects');
  if (!fs.existsSync(redirectsPath)) {
    log('WARN', 'No _redirects file found');
    return;
  }
  
  const content = fs.readFileSync(redirectsPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
  
  const rules = [];
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      const from = parts[0];
      const to = parts[1];
      const status = parts[2] || '301';
      rules.push({ from, to, status });
    }
  }
  
  if (rules.length === 0) {
    console.log('  ℹ️  No redirect rules found');
    return;
  }
  
  console.log(`  Found ${rules.length} redirect rules`);
  
  // Check for potential loops
  for (const rule of rules) {
    // Check if destination matches another rule's source
    const chain = [rule.from];
    let current = rule.to;
    let depth = 0;
    
    while (depth < 10) {
      const next = rules.find(r => r.from === current || r.from === current.replace(/\/$/, '') || r.from === current + '/');
      if (!next) break;
      if (chain.includes(next.from)) {
        log('ERROR', `Redirect loop detected: ${chain.join(' → ')} → ${next.from}`);
        break;
      }
      chain.push(next.from);
      current = next.to;
      depth++;
    }
    
    if (depth >= 10) {
      log('WARN', `Deep redirect chain (${depth}+): ${chain.join(' → ')}`);
    }
  }
  
  // Check if source files exist (would cause Pretty URL conflict)
  function isFile(p) {
    try { return fs.statSync(p).isFile(); } catch { return false; }
  }
  for (const rule of rules) {
    if (rule.status === '200') continue; // rewrites are fine
    const fromPath = rule.from.replace(/^\//, '').replace(/\/$/, '/index.html');
    const fromFile = path.join(DIST, fromPath);
    const fromHtml = rule.from.replace(/^\//, '').replace(/\/$/, '') + '.html';
    const fromHtmlFile = path.join(DIST, fromHtml);
    
    // `/about.html → /about` is standard canonicalization: Cloudflare Pages
    // serves /about from about.html with a 200, so the chain is a single hop.
    // Verified in production — only flag redirects to a genuinely different page.
    const isSelfCanonical =
      rule.from.endsWith('.html') && rule.to === rule.from.slice(0, -5);

    if (!isSelfCanonical && (isFile(fromFile) || isFile(fromHtmlFile))) {
      // The source file actually exists — check if it redirects to a different path
      const toPath = rule.to.replace(/^\//, '').replace(/\/$/, '/index.html');
      if (fromPath !== toPath && fromHtml !== rule.to.replace(/^\//, '')) {
        log('WARN', `Source "${rule.from}" has a real file AND redirects to "${rule.to}" — potential Pretty URL conflict`);
      }
    }
  }
  
  console.log(`  Redirect check complete`);
}

// ─── Main audit ───
function runAudit() {
  console.log('\n🔍 Build Audit — Pre-deployment quality checks');
  console.log('='.repeat(60));
  
  errors = 0;
  warnings = 0;
  
  // Load all CSS
  const cssDir = path.join(DIST, 'css');
  let allCSS = '';
  if (fs.existsSync(cssDir)) {
    for (const file of fs.readdirSync(cssDir)) {
      if (file.endsWith('.css')) {
        allCSS += fs.readFileSync(path.join(cssDir, file), 'utf-8') + '\n';
      }
    }
  }
  
  // Collect all HTML files
  const htmlFiles = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.html')) {
        htmlFiles.push(fullPath);
      }
    }
  }
  walk(DIST);
  
  console.log(`\n📊 Scan scope:`);
  console.log(`  CSS files: ${fs.existsSync(cssDir) ? fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).length : 0}`);
  console.log(`  HTML files: ${htmlFiles.length}`);
  
  // --- Check 1: Missing styles (HTML classes not in CSS) ---
  console.log('\n🔍 Check 1: Missing CSS definitions for HTML classes');
  
  const cssSelectors = extractSelectors(allCSS);
  const allHTMLClasses = new Set();
  const htmlClassSources = {}; // class -> [files]
  
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf-8');
    const classes = extractClassesFromHTML(html);
    const relPath = path.relative(DIST, file).replace(/\\/g, '/');
    for (const c of classes) {
      allHTMLClasses.add(c);
      if (!htmlClassSources[c]) htmlClassSources[c] = [];
      htmlClassSources[c].push(relPath);
    }
  }
  
  const missingStyles = [];
  for (const cls of allHTMLClasses) {
    // Skip dynamic/JS-added classes
    if (DYNAMIC_CLASSES.has(cls)) continue;

    // Skip build-time generated classes (hero-bg-0, hero-bg-1, ...)
    if (/^hero-bg-\d+$/.test(cls)) continue;

    // Skip page identity classes (page--home, page--about, ...). They are
    // scoping anchors for page-level overrides, not standalone styles.
    if (cls.startsWith('page--')) continue;
    
    // Skip common utility/state classes that might be generated by JS
    if (['reveal-element', 'fade-in', 'slide-up', 'slide-down',
         'stagger-1', 'stagger-2', 'stagger-3', 'stagger-4',
         'dark-mode', 'light-mode', 'is-sticky',
         'has-scrollbar', 'no-scrollbar', 'is-loading',
         'is-expanded', 'is-collapsed', 'is-empty',
         'is-focused', 'is-hovered', 'is-pressed',
         'nav--transparent', 'nav--dark', 'nav--light',
         'nav--fixed', 'nav-link--ar',
         // compound selector .nav-link--ar.nav-link--ar-partial — regex can't match chained classes
         'nav-link--ar-partial',
         // injected by build/page.js as inline hint text, inherits parent <a> styles
         'nav-ar-hint',
         // injected by build/bg-lazy-inject.js — the .lazy-bg base state lives in a
         // runtime JS-created <style>, so it never appears in a css/*.css file.
         'lazy-bg',
         'home-section--alt', 'section-dark', 'section-light',
         'btn-primary', 'btn-secondary', 'btn-outline', 'btn-light',
         'btn-accent', 'btn-lg', 'btn-sm', 'btn-ghost',
         'container', 'container-narrow', 'container-wide',
         'grain-overlay', 'spec-badge-float',
         'products-bento', 'projects-editorial',
         'section-deco-number', 'featured-project',
         'side-projects', 'section-header',
         'cap-content', 'cap-icon',
        ].includes(cls)) continue;
    
    // Check if any CSS selector matches this class
    const escapedCls = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const classPattern = new RegExp(`(^|[\\s,>+~(])\\.${escapedCls}([\\s.:\\[>+~)]|$)`);
    let found = false;
    for (const sel of cssSelectors) {
      if (classPattern.test(sel)) { found = true; break; }
    }
    if (!found) {
      missingStyles.push({ class: cls, files: htmlClassSources[cls].slice(0, 3) });
    }
  }
  
  if (missingStyles.length > 0) {
    log('WARN', `${missingStyles.length} HTML classes may be missing CSS definitions:`);
    for (const m of missingStyles.slice(0, 15)) {
      console.log(`     .${m.class} (used in: ${m.files.join(', ')})`);
    }
    if (missingStyles.length > 15) {
      console.log(`     ... and ${missingStyles.length - 15} more`);
    }
  } else {
    log('OK', 'All HTML classes have CSS definitions');
  }
  
  // --- Check 2: Dead CSS selectors ---
  console.log('\n🔍 Check 2: Dead CSS selectors (not used in any HTML or JS)');
  
  const jsTokens = collectJSTokens(htmlFiles);
  const usedClasses = new Set([...allHTMLClasses, ...jsTokens, ...DYNAMIC_CLASSES]);
  
  const deadSelectors = [];
  for (const sel of cssSelectors) {
    // Skip pseudo-only selectors
    if (!sel.includes('.')) continue; // only check class selectors
    if (sel.startsWith(':')) continue;
    if (sel.startsWith('::')) continue;
    
    // Extract class names from selector
    const classMatches = sel.match(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g);
    if (!classMatches) continue;
    
    const classes = classMatches.map(c => c.slice(1));
    // A selector is "dead" only if ALL its classes are unused in HTML, JS, or
    // the known dynamic-state set
    const allDead = classes.every(c => !usedClasses.has(c));
    if (allDead) {
      deadSelectors.push(sel);
    }
  }
  
  if (deadSelectors.length > 0) {
    log('WARN', `${deadSelectors.length} potentially dead CSS selectors:`);
    const showAll = process.env.SHOW_ALL_DEAD === '1';
    const limit = showAll ? deadSelectors.length : 20;
    for (const s of deadSelectors.slice(0, limit)) {
      console.log(`     ${s}`);
    }
    if (deadSelectors.length > limit) {
      console.log(`     ... and ${deadSelectors.length - limit} more`);
    }
  } else {
    log('OK', 'No dead CSS selectors found');
  }
  
  // --- Check 3: Broken internal links ---
  console.log('\n🔍 Check 3: Broken internal links');
  
  const brokenLinks = [];
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf-8');
    const links = extractLinksFromHTML(html, file);
    const relPath = path.relative(DIST, file).replace(/\\/g, '/');
    
    for (const link of links) {
      const targetPath = path.join(DIST, link.resolved);
      // Check if it's a directory with index.html
      const indexPath = path.join(targetPath, 'index.html');
      
      if (!fs.existsSync(targetPath) && !fs.existsSync(indexPath)) {
        // Check if it's a .html file without extension (pretty URL)
        const htmlPath = targetPath + '.html';
        if (!fs.existsSync(htmlPath)) {
          brokenLinks.push({ page: relPath, link: link.original, resolved: link.resolved });
        }
      }
    }
  }
  
  // Deduplicate
  const uniqueBroken = [...new Map(brokenLinks.map(b => [b.page + '|' + b.link, b])).values()];
  
  if (uniqueBroken.length > 0) {
    log('ERROR', `${uniqueBroken.length} broken internal link(s):`);
    for (const b of uniqueBroken.slice(0, 15)) {
      console.log(`     [${b.page}] → ${b.link} (${b.resolved})`);
    }
    if (uniqueBroken.length > 15) {
      console.log(`     ... and ${uniqueBroken.length - 15} more`);
    }
  } else {
    log('OK', 'No broken internal links found');
  }
  
  // --- Check 4: Broken anchor links ---
  console.log('\n🔍 Check 4: Broken anchor links');
  
  const brokenAnchors = [];
  const fileCache = {};
  
  for (const file of htmlFiles) {
    const html = fileCache[file] || (fileCache[file] = fs.readFileSync(file, 'utf-8'));
    const relPath = path.relative(DIST, file).replace(/\\/g, '/');
    
    // Collect all id values from this file
    const ids = new Set();
    const idRegex = /\bid="([^"]+)"/g;
    let idMatch;
    while ((idMatch = idRegex.exec(html)) !== null) {
      ids.add(idMatch[1]);
    }
    const nameRegex = /<a\s+[^>]*\bname="([^"]+)"/g;
    let nameMatch;
    while ((nameMatch = nameRegex.exec(html)) !== null) {
      ids.add(nameMatch[1]);
    }
    
    // Same-page anchors: href="#anchor"
    const samePageRegex = /href="#([a-zA-Z][\w-]*)"/g;
    let am;
    while ((am = samePageRegex.exec(html)) !== null) {
      const anchor = am[1];
      if (!ids.has(anchor)) {
        brokenAnchors.push({ page: relPath, link: `#${anchor}`, type: 'same-page' });
      }
    }
    
    // Cross-page anchors: href="path#anchor"
    const crossPageRegex = /href="([^"#]+)#([a-zA-Z][\w-]*)"/g;
    let cm;
    while ((cm = crossPageRegex.exec(html)) !== null) {
      const pagePath = cm[1];
      const anchor = cm[2];
      
      if (pagePath.startsWith('http') || pagePath.startsWith('//') ||
          pagePath.startsWith('mailto:') || pagePath.startsWith('tel:') ||
          pagePath.startsWith('javascript:') || pagePath.startsWith('data:')) continue;
      
      let targetFile;
      if (pagePath.startsWith('/')) {
        targetFile = path.join(DIST, pagePath.slice(1));
      } else {
        targetFile = path.resolve(path.dirname(file), pagePath);
      }
      
      let realTarget = targetFile;
      if (!fs.existsSync(realTarget)) {
        realTarget = targetFile + '.html';
        if (!fs.existsSync(realTarget)) {
          realTarget = path.join(targetFile, 'index.html');
          if (!fs.existsSync(realTarget)) continue;
        }
      }
      
      const targetHtml = fileCache[realTarget] || (fileCache[realTarget] = fs.readFileSync(realTarget, 'utf-8'));
      const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const targetIdRegex = new RegExp(`\\bid="${escaped}"`);
      const targetNameRegex = new RegExp(`<a\\s+[^>]*\\bname="${escaped}"`);
      
      if (!targetIdRegex.test(targetHtml) && !targetNameRegex.test(targetHtml)) {
        brokenAnchors.push({ page: relPath, link: `${pagePath}#${anchor}`, type: 'cross-page' });
      }
    }
  }
  
  const uniqueBrokenAnchors = [...new Map(brokenAnchors.map(b => [b.page + '|' + b.link, b])).values()];
  
  if (uniqueBrokenAnchors.length > 0) {
    log('WARN', `${uniqueBrokenAnchors.length} broken anchor link(s):`);
    for (const b of uniqueBrokenAnchors.slice(0, 15)) {
      console.log(`     [${b.page}] → ${b.link} (${b.type})`);
    }
    if (uniqueBrokenAnchors.length > 15) {
      console.log(`     ... and ${uniqueBrokenAnchors.length - 15} more`);
    }
  } else {
    log('OK', 'No broken anchor links found');
  }
  
  // --- Check 5: Inline <style> tags (design system violation) ---
  console.log('\n🔍 Check 5: Inline style tags');
  
  const inlineStyleFiles = [];
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    // Count <style> tags EXCEPT build-system injected ones (data-hero-styles, data-build-*, etc.)
    const styleMatches = html.match(/<style(?![^>]*data-(?:hero-styles|build-)[^>]*>)[^>]*>/gi);
    if (styleMatches && styleMatches.length > 0) {
      const relPath = path.relative(DIST, file).replace(/\\/g, '/');
      inlineStyleFiles.push({ file: relPath, count: styleMatches.length });
    }
  }
  
  if (inlineStyleFiles.length > 0) {
    log('ERROR', `${inlineStyleFiles.length} page(s) contain inline <style> tags (design system violation):`);
    for (const f of inlineStyleFiles.slice(0, 10)) {
      console.log(`     ${f.file} (${f.count} tag(s))`);
    }
    if (inlineStyleFiles.length > 10) {
      console.log(`     ... and ${inlineStyleFiles.length - 10} more`);
    }
  } else {
    log('OK', 'No inline <style> tags found');
  }

  // --- Check 6: Emoji in icon containers (should be SVG) ---
  console.log('\n🔍 Check 6: Emoji icons in icon containers');
  
  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;
  // Decorative symbols commonly used as design elements, not emoji icons
  const decorativeExempt = new Set(['✦', '❖', '✧', '✩', '✪', '✫', '✬', '✭', '✮', '✯', '❂', '❃', '❁', '✿', '❀', '✾', '✽', '❋', '❊', '❉', '❈', '❇']);
  const emojiIconFiles = [];
  let totalEmojiIcons = 0;
  
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const iconDivRegex = /<div[^>]*class="[^"]*icon[^"]*"[^>]*>([^<]*)<\/div>/g;
    let match;
    let fileCount = 0;
    while ((match = iconDivRegex.exec(html)) !== null) {
      const content = match[1].trim();
      if (content && !content.startsWith('<svg') && content.length < 30 && emojiRegex.test(content)) {
        // Skip single regional indicator letters (half-flag emoji fragments)
        if (/^[\u{1F1E6}-\u{1F1FF}]$/u.test(content.trim())) continue;
        // Skip decorative geometric symbols used as design elements
        if (decorativeExempt.has(content.trim())) continue;
        fileCount++;
        totalEmojiIcons++;
      }
    }
    if (fileCount > 0) {
      const relPath = path.relative(DIST, file).replace(/\\/g, '/');
      emojiIconFiles.push({ file: relPath, count: fileCount });
    }
  }
  
  if (emojiIconFiles.length > 0) {
    log('WARN', `${totalEmojiIcons} emoji icon(s) found in ${emojiIconFiles.length} page(s) — replace with SVG:`);
    for (const f of emojiIconFiles.slice(0, 10)) {
      console.log(`     ${f.file} (${f.count})`);
    }
    if (emojiIconFiles.length > 10) {
      console.log(`     ... and ${emojiIconFiles.length - 10} more`);
    }
  } else {
    log('OK', 'No emoji icons found in icon containers');
  }

  // --- Check 7: Duplicate CSS class definitions (component duplication debt) ---
  console.log('\n🔍 Check 7: Duplicate CSS class definitions in source');
  
  const cssSourceDir = path.join(ROOT, 'css');
  const duplicateClasses = {};
  
  if (fs.existsSync(cssSourceDir)) {
    const sourceCssFiles = [];
    (function walkCss(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) walkCss(fullPath);
        else if (entry.name.endsWith('.css')) sourceCssFiles.push(fullPath);
      }
    })(cssSourceDir);
    
    const classDefinitions = {}; // className -> Set of files
    
    for (const cssFile of sourceCssFiles) {
      const css = fs.readFileSync(cssFile, 'utf8');
      const relFile = path.relative(ROOT, cssFile).replace(/\\/g, '/');
      
      // Remove comments first
      let cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '');
      
      // Track top-level class definitions only (not nested in @media, @supports, etc.)
      // We track brace depth: depth 0 = top level
      let depth = 0;
      let i = 0;
      const fileTopLevelClasses = new Set();
      
      while (i < cleanCss.length) {
        const char = cleanCss[i];
        
        if (char === '{') {
          depth++;
          i++;
          continue;
        }
        if (char === '}') {
          depth = Math.max(0, depth - 1);
          i++;
          continue;
        }
        
        // At depth 0, look for standalone .classname { 
        // Must be a single class selector (not part of .parent .child chain)
        if (depth === 0 && char === '.') {
          // Check what comes before this position (back up to find start of selector)
          let before = '';
          let j = i - 1;
          while (j >= 0 && cleanCss[j] !== '\n' && cleanCss[j] !== ',') {
            before = cleanCss[j] + before;
            j--;
          }
          // If there's non-whitespace content before, it's part of a selector chain
          if (before.trim() !== '') {
            i++;
            continue;
          }
          
          // Check if this is a simple class selector followed by {
          const rest = cleanCss.substring(i);
          const match = rest.match(/^\.([a-zA-Z_][\w-]*)\s*\{/);
          if (match) {
            fileTopLevelClasses.add(match[1]);
            i += match[0].length;
            depth++; // we just entered a block
            continue;
          }
        }
        
        // Skip @-rule headers at depth 0
        if (depth === 0 && char === '@') {
          const rest = cleanCss.substring(i);
          const atMatch = rest.match(/^@[^{]+\{/);
          if (atMatch) {
            i += atMatch[0].length;
            depth++;
            continue;
          }
        }
        
        i++;
      }
      
      for (const cls of fileTopLevelClasses) {
        if (!classDefinitions[cls]) classDefinitions[cls] = new Set();
        classDefinitions[cls].add(relFile);
      }
    }
    
    // Find classes defined in 2+ different files
    for (const [cls, files] of Object.entries(classDefinitions)) {
      if (files.size < 2) continue;
      
      // Skip intentionally additive utility classes
      if (cls.startsWith('btn-')) continue;
      if (cls === 'container' || cls.startsWith('container-')) continue;
      
      // Skip if ALL duplicates are in known override files (responsive, themes,
      // utilities). These files exist specifically to override/add to base
      // styles — not duplication debt. refinements.css is excluded here because
      // Check 13 governs it separately by freezing its rule count.
      const nonOverrideFiles = [...files].filter(f => 
        !f.includes('responsive.css') && 
        !f.includes('/themes/') && 
        !f.includes('utilities.css') &&
        !f.includes('refinements.css')
      );
      if (nonOverrideFiles.length < 2) continue;
      
      duplicateClasses[cls] = files;
    }
  }
  
  const dupCount = Object.keys(duplicateClasses).length;
  if (dupCount > 0) {
    log('WARN', `${dupCount} CSS class(es) defined in multiple files (component duplication debt):`);
    const entries = Object.entries(duplicateClasses).sort((a, b) => b[1].size - a[1].size);
    for (const [cls, fileSet] of entries.slice(0, 15)) {
      const sources = [...fileSet].join(', ');
      console.log(`     .${cls} (${fileSet.size} files: ${sources})`);
    }
    if (dupCount > 15) {
      console.log(`     ... and ${dupCount - 15} more`);
    }
  } else {
    log('OK', 'No duplicate CSS class definitions found');
  }

  // --- Check 8: Unreplaced template placeholders (build wiring failure) ---
  console.log('\n🔍 Check 8: Unreplaced template placeholders');

  const placeholderFiles = [];
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const matches = html.match(/\{\{[a-zA-Z0-9_]+\}\}/g);
    if (matches && matches.length > 0) {
      const relPath = path.relative(DIST, file).replace(/\\/g, '/');
      placeholderFiles.push({ file: relPath, tokens: [...new Set(matches)] });
    }
  }

  if (placeholderFiles.length > 0) {
    log('ERROR', `${placeholderFiles.length} page(s) contain unreplaced {{template}} placeholders:`);
    for (const f of placeholderFiles.slice(0, 10)) {
      console.log(`     ${f.file} — ${f.tokens.join(', ')}`);
    }
    if (placeholderFiles.length > 10) {
      console.log(`     ... and ${placeholderFiles.length - 10} more`);
    }
  } else {
    log('OK', 'No unreplaced template placeholders found');
  }

  // --- Check 9: Dead inline event handlers ---
  console.log('\n🔍 Check 9: Dead inline event handlers');

  const jsSources = [];
  (function walkJs(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkJs(full);
      else if (entry.name.endsWith('.js')) jsSources.push(full);
    }
  })(path.join(ROOT, 'js'));

  const scriptCorpus = jsSources.map(f => fs.readFileSync(f, 'utf-8')).join('\n') + '\n' +
    htmlFiles.map(f => {
      const html = fs.readFileSync(f, 'utf-8');
      return (html.match(/<script[^>]*>[\s\S]*?<\/script>/g) || []).join('\n');
    }).join('\n');

  const handlerNames = new Set();
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf-8');
    const re = /\son(?:click|submit|change|input|load|error|focus|blur)\s*=\s*"([A-Za-z_$][\w$]*)\s*\(/g;
    let m;
    while ((m = re.exec(html)) !== null) handlerNames.add(m[1]);
  }

  function isHandlerDefined(name) {
    const n = name.replace(/\$/g, '\\$');
    return [
      new RegExp('function\\s+' + n + '\\s*\\('),
      new RegExp('(?:var|let|const)\\s+' + n + '\\s*='),
      new RegExp('window\\.' + n + '\\s*='),
      new RegExp('(?:^|[\\s,{])\\s*' + n + '\\s*[:=]\\s*function'),
    ].some(re => re.test(scriptCorpus));
  }

  const deadHandlers = [...handlerNames].filter(n => !isHandlerDefined(n));

  if (deadHandlers.length > 0) {
    log('ERROR', `${deadHandlers.length} inline event handler(s) call an undefined function:`);
    for (const n of deadHandlers) console.log(`     ${n}()`);
  } else {
    log('OK', `${handlerNames.size} inline event handler(s) all resolve to a defined function`);
  }

  // --- Check 10: CSS specificity leaks (global text/heading color must NOT use ID selectors) ---
  // 
  // PRINCIPLE: Global default colors for h1-h5 / p / span / a must use tag-level selectors only.
  // Putting color inside body#yakeen-page (specificity 0101) means every component's
  // title/desc color (class-level, 0010) gets overridden — dark sections end up with
  // dark text on dark backgrounds.
  // 
  // If you need to set font-family or font-size globally, body#yakeen-page is fine.
  // But color must stay at tag-level so component styles can cascade properly.
  console.log('\n🔍 Check 10: Global color specificity leak');
  
  const globalColorLeaks = [];
  
  // Check for color in body#yakeen-page h1-h5 rules
  const headingColorRegex = /body#yakeen-page\s+h[1-6][^{]*\{[^}]*color\s*:/gi;
  let hMatch;
  while ((hMatch = headingColorRegex.exec(allCSS)) !== null) {
    const rule = hMatch[0].replace(/\s+/g, ' ').trim();
    globalColorLeaks.push(rule.substring(0, 120));
  }
  
  // Check for color in body#yakeen-page p/span/li/a rules (if they set a specific color, not inherit)
  const textColorRegex = /body#yakeen-page\s+(p|span|li|a|div)\s*,\s*body#yakeen-page[^{]*\{[^}]*color\s*:\s*(?!inherit)[^;}]+/gi;
  let tMatch;
  while ((tMatch = textColorRegex.exec(allCSS)) !== null) {
    const rule = tMatch[0].replace(/\s+/g, ' ').trim();
    globalColorLeaks.push(rule.substring(0, 120));
  }
  
  if (globalColorLeaks.length > 0) {
    log('ERROR', `Global color uses ID selector (body#yakeen-page) — ${globalColorLeaks.length} rule(s) found:`);
    for (const leak of globalColorLeaks.slice(0, 5)) {
      console.log(`       → ${leak}`);
    }
    if (globalColorLeaks.length > 5) {
      console.log(`       ... and ${globalColorLeaks.length - 5} more`);
    }
    console.log(`       Fix: move color property out of body#yakeen-page into a tag-only selector`);
    console.log(`       (font-family/font-weight can stay in body#yakeen-page, color must not)`);
  } else {
    log('OK', 'No global color specificity leaks — tag-level defaults, components can cascade');
  }

  // --- Check 11: -webkit-text-fill-color hard rule (2026-10-21 root-cause protection) ---
  // fill-color outranks every `color` declaration at paint phase. The 2026-10-21
  // bug was a global fill-color in themes/light.css silently defeating every
  // `color: white` on dark sections site-wide. Only two legitimate uses exist:
  //   (a) fill:transparent with background-clip:text for gradient text
  //   (b) fill:inherit on <em> to keep accent visible inside gradient text
  // Any other fill-color value or any fill-color in a non-whitelisted file
  // blocks the build. See css/README.md for full policy.
  console.log('\n🔍 Check 11: -webkit-text-fill-color usage (hard rule)');
  const fillWhitelist = new Set(['animations.css', 'cta.css']);
  const fillOkValues = new Set(['transparent', 'inherit']);
  let fillErrors = 0;
  const srcCssDir = path.resolve(__dirname, '..', 'css');
  if (fs.existsSync(srcCssDir)) {
    const srcFiles = [];
    function walk(dir) {
      for (const f of fs.readdirSync(dir)) {
        const fp = path.join(dir, f);
        if (fs.statSync(fp).isDirectory()) walk(fp);
        else if (f.endsWith('.css')) srcFiles.push(fp);
      }
    }
    walk(srcCssDir);
    for (const fp of srcFiles) {
      const src = fs.readFileSync(fp, 'utf8');
      const re = /-webkit-text-fill-color\s*:\s*([^;]+)\s*;/g;
      let m;
      while ((m = re.exec(src)) !== null) {
        const val = m[1].trim();
        const fname = path.basename(fp);
        if (!fillOkValues.has(val) && !fillWhitelist.has(fname)) {
          log('ERR', `${fp.replace(/.*yakeen-site[\\/]/, '')}: -webkit-text-fill-color: ${val} — NOT allowed`);
          log('   ', 'Only transparent/inherit permitted; see css/README.md');
          fillErrors++;
        }
      }
    }
  }
  if (fillErrors > 0) {
    errors += fillErrors;
    console.log(`\n   ❌ ${fillErrors} fill-color violation(s) — BLOCKED.`);
  } else {
    log('OK', 'All -webkit-text-fill-color uses are on the whitelist (gradient text only)');
  }

  // --- Check 12: Inline style attribute budget (ratchet) ---
  // Historical debt is frozen per page. Any page that adds new style=""
  // attributes above its recorded budget fails the build (incremental-zero
  // rule, PRINCIPLES §6.4). Lower a budget only after actually removing styles.
  console.log('\n🔍 Check 12: Inline style attribute budget');
  const styleBudgetPath = path.join(ROOT, 'scripts', 'style-baseline.json');
  const styleBudget = fs.existsSync(styleBudgetPath)
    ? JSON.parse(fs.readFileSync(styleBudgetPath, 'utf-8').replace(/^\uFEFF/, ''))
    : null;

  if (!styleBudget) {
    log('WARN', 'No scripts/style-baseline.json — inline style budget not enforced');
  } else {
    const styleCurrent = {};
    for (const file of htmlFiles) {
      const html = fs.readFileSync(file, 'utf-8');
      const matches = html.match(/\sstyle="/g);
      if (matches && matches.length) {
        styleCurrent[path.relative(DIST, file).replace(/\\/g, '/')] = matches.length;
      }
    }

    const regressions = [];
    for (const [relPath, count] of Object.entries(styleCurrent)) {
      const budget = styleBudget[relPath] || 0;
      if (count > budget) regressions.push(`${relPath}: ${count} > budget ${budget}`);
    }

    const totalCurrent = Object.values(styleCurrent).reduce((a, b) => a + b, 0);
    const totalBudget = Object.values(styleBudget).reduce((a, b) => a + b, 0);

    if (regressions.length > 0) {
      log('ERROR', `${regressions.length} page(s) exceeded their inline-style budget:`);
      for (const r of regressions.slice(0, 15)) console.log(`     ${r}`);
      if (regressions.length > 15) console.log(`     ... and ${regressions.length - 15} more`);
    } else if (totalCurrent < totalBudget) {
      log('WARN', `Inline styles reduced ${totalBudget} → ${totalCurrent}. Lower scripts/style-baseline.json to lock the gain.`);
    } else {
      log('OK', `Inline style attributes within budget (${totalCurrent}/${totalBudget})`);
    }
  }

  // --- Check 13: Refinements overlay freeze ---
  // refinements.css is the final arbitration layer (loaded last, uses #id-level
  // specificity). It cannot be split without changing the cascade, so it is
  // frozen instead of rewritten: new component styling belongs in the owning
  // component file, never here.
  console.log('\n🔍 Check 13: Refinements overlay freeze');
  const refinementsPath = path.join(ROOT, 'css', 'refinements.css');
  if (fs.existsSync(refinementsPath)) {
    const refinementsCss = fs.readFileSync(refinementsPath, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
    const refinementsRules = (refinementsCss.match(/\{/g) || []).length;
    const REFINEMENTS_BUDGET = 50;
    if (refinementsRules > REFINEMENTS_BUDGET) {
      log('ERROR', `refinements.css grew to ${refinementsRules} rules (budget ${REFINEMENTS_BUDGET}). Add styles to the owning component file, not the overlay.`);
    } else {
      log('OK', `refinements.css frozen at ${refinementsRules}/${REFINEMENTS_BUDGET} rules`);
    }
  }

  // --- Check 14: Image reference integrity ---
  // 图片改成内容哈希命名后，任何一处漏改写都会变成线上 404 且只在用户侧暴露。
  // 这里把「HTML/CSS 里引用的每个 images/* 是否真实存在」变成构建期的硬门禁。
  console.log('\n🔍 Check 14: Image reference integrity');
  {
    const imagesDir = path.join(DIST, 'images');
    const missing = new Map(); // 引用路径 → 出现在哪些文件
    if (fs.existsSync(imagesDir)) {
      for (const file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf-8');
        for (const m of html.matchAll(/images\/([A-Za-z0-9_./\-]+\.[A-Za-z0-9]{2,5})/g)) {
          const target = path.join(imagesDir, m[1]);
          if (!fs.existsSync(target)) {
            const rel = path.relative(DIST, file);
            if (!missing.has(m[1])) missing.set(m[1], new Set());
            missing.get(m[1]).add(rel);
          }
        }
      }
    }
    if (missing.size) {
      for (const [ref, files] of missing) {
        log('ERROR', `引用的图片不存在：images/${ref}（${[...files].slice(0, 3).join(', ')}${files.size > 3 ? ' …' : ''}）`);
      }
    } else {
      log('OK', '所有 HTML 中引用的图片文件都存在');
    }
  }

  // --- Check 15: Hashed filename must match file content ---
  // 防止「手改文件名骗过缓存」或「改了图但忘了重新构建」。
  console.log('\n🔍 Check 15: Hashed image filename ↔ content');
  {
    const imagesDir = path.join(DIST, 'images');
    const hashedName = /^(.*)\.([0-9a-f]{8})\.(jpg|jpeg|png|webp|svg|gif)$/i;
    let bad = 0;
    let total = 0;
    if (fs.existsSync(imagesDir)) {
      const stack = [imagesDir];
      while (stack.length) {
        const dir = stack.pop();
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) { stack.push(p); continue; }
          const m = e.name.match(hashedName);
          if (!m) {
            log('ERROR', `图片文件名缺少内容哈希：${path.relative(DIST, p)}`);
            bad++;
            continue;
          }
          total++;
          const actual = require('crypto').createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 8);
          if (actual !== m[2]) {
            log('ERROR', `图片哈希与内容不符：${path.relative(DIST, p)}（文件名 ${m[2]}，实际 ${actual}）`);
            bad++;
          }
        }
      }
    }
    if (!bad) log('OK', `${total} 个图片文件名与内容哈希一致`);
  }

  // --- Check 16: Orphan images (report only) ---
  console.log('\n🔍 Check 16: Unreferenced images');
  {
    const imagesDir = path.join(DIST, 'images');
    if (fs.existsSync(imagesDir)) {
      const referenced = new Set();
      for (const file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf-8');
        for (const m of html.matchAll(/images\/([A-Za-z0-9_./\-]+\.[A-Za-z0-9]{2,5})/g)) referenced.add(m[1]);
      }
      let orphans = 0;
      let bytes = 0;
      const stack = [imagesDir];
      while (stack.length) {
        const dir = stack.pop();
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) { stack.push(p); continue; }
          if (!referenced.has(path.relative(imagesDir, p).split(path.sep).join('/'))) {
            orphans++;
            bytes += fs.statSync(p).size;
          }
        }
      }
      if (orphans) log('WARN', `${orphans} 个图片未被任何 HTML 引用（约 ${(bytes / 1024 / 1024).toFixed(1)} MB）`);
      else log('OK', '没有未被引用的图片');
    }
  }

  // --- Check 17: Redirect rules ---
  checkRedirectRules();
  
  // --- Summary ---
  console.log('\n' + '='.repeat(60));
  console.log('📋 Audit Summary:');
  console.log(`  Errors:   ${errors}`);
  console.log(`  Warnings: ${warnings}`);
  console.log(`  Files scanned: ${htmlFiles.length} HTML, ${fs.existsSync(cssDir) ? fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).length : 0} CSS`);
  
  if (errors > 0) {
    console.log('\n❌ BUILD FAILED — fix errors and rebuild');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  Build passed with warnings');
  } else {
    console.log('\n✅ All checks passed!');
  }
  
  return { errors, warnings };
}

// Run if called directly
if (require.main === module) {
  runAudit();
}

module.exports = { runAudit };
