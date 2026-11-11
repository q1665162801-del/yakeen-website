/**
 * build/bg-lazy-inject.js — Inject lazy-bg loader into pages
 * 
 * Single inline <script> that:
 * 1. Adds CSS for .lazy-bg (hidden state + fade-in)
 * 2. Sets up IntersectionObserver to load background images on approach
 * 
 * How it works without !important conflicts:
 * - build/bg-lazy.js already removed the inline background-image; the no-JS
 *   fallback lives in a <noscript><style> block instead.
 * - JS runs: reads data-bg, preloads the image, then writes it into the
 *   element's inline style. One file requested, one time.
 * - The "hidden" state uses a wrapper approach: we add a class that sets
 *   opacity:0, then remove it when loaded.
 * 
 * Wait — opacity:0 means the image space is blank but still occupies layout.
 * That's fine for below-the-fold (user hasn't scrolled there yet).
 * For above-the-fold lazy images, the IntersectionObserver rootMargin:500px
 * will trigger them early.
 * 
 * Total payload: ~700 bytes gzipped. Zero extra HTTP requests.
 */

const fs = require('fs');
const path = require('path');
const { DIST } = require('./config');

const LAZY_LOADER_JS = `
<script data-lazy-js="1">
(function(){
  // CSS: start invisible, fade in when loaded
  var s=document.createElement('style');
  s.textContent='.lazy-bg{opacity:0;transition:opacity .4s ease}.lazy-bg.is-loaded{opacity:1}';
  document.head.appendChild(s);

  // Helper: resolve relative data-bg URLs against the element's location
  function resolveUrl(el,url){
    // Use a temporary anchor to resolve relative URLs
    var a=document.createElement('a');
    a.href=url;
    return a.href;
  }

  // Lazy load with IntersectionObserver (500px pre-fetch margin)
  if(!('IntersectionObserver'in window)){
    // No IO support — load everything now, picking the phone variant when it applies
    document.querySelectorAll('.lazy-bg').forEach(function(el){
      var src=el.dataset.bg;
      if(src&&el.dataset.bgMobile&&window.matchMedia('(max-width: 768px)').matches){
        src=el.dataset.bgMobile;
      }
      if(src) el.style.backgroundImage='url('+resolveUrl(el,src)+')';
      el.classList.add('is-loaded');
    });
    return;
  }
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting)return;
      var el=e.target;
      var src=el.dataset.bg;
      // Phones get the 768px variant: the card is only a few hundred px wide
      // there, so the full-size original is pure bandwidth waste.
      if(src&&el.dataset.bgMobile&&window.matchMedia('(max-width: 768px)').matches){
        src=el.dataset.bgMobile;
      }
      if(!src){io.unobserve(el);return;}
      // Resolve URL
      var fullSrc=resolveUrl(el,src);
      // Preload image then set it
      var img=new Image;
      img.onload=function(){
        el.style.backgroundImage='url('+fullSrc+')';
        el.classList.add('is-loaded');
      };
      img.onerror=function(){
        // Failed — fall back to inline style if present, or just show as-is
        el.classList.add('is-loaded');
      };
      img.src=fullSrc;
      io.unobserve(el);
    });
  },{rootMargin:'500px 0px',threshold:0.01});
  document.querySelectorAll('.lazy-bg').forEach(function(el){io.observe(el)});
})();
</script>
`;

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // Only inject if page has lazy-bg elements
  if (!html.includes('lazy-bg')) return false;

  // Inject JS before </body>
  if (!html.includes('data-lazy-js')) {
    html = html.replace('</body>', `  ${LAZY_LOADER_JS.trim()}\n</body>`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  return true;
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += walkDir(fullPath);
    } else if (entry.name.endsWith('.html')) {
      if (processFile(fullPath)) count++;
    }
  }
  return count;
}

function injectLazyLoader() {
  const count = walkDir(DIST);
  console.log(`   ✅ Lazy-loader injected into ${count} pages`);
  return count;
}

// Run if called directly
if (require.main === module) {
  injectLazyLoader();
}

module.exports = { injectLazyLoader };
