/* ============================================================
   Scroll reveal animation
   Fades + slides elements into view as they enter the viewport.

   - One shared entrance curve for the whole site (see css/animations.css)
   - Stagger is derived from the element's position among its reveal
     siblings, so every grid on every page cascades — no hand-maintained
     list of grid class names to keep in sync.
   - The selector list below only contains class names that actually exist
     in the markup. Dead entries here would also mask the build audit's
     dead-CSS check (it counts JS tokens as "used").
   ============================================================ */
(function() {
  'use strict';

  if (!('IntersectionObserver' in window)) return;

  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const SELECTOR = [
    '.reveal',
    '[data-reveal]',
    '.section-header',
    '.product-card',
    '.project-card',
    '.value-card',
    '.market-card',
    '.hp-card',
    '.cap-card',
    '.app-card',
    '.wgcc-card',
    '.journal-card',
    '.cert-card',
    '.team-card',
    '.stat-card',
    '.resource-card',
    '.resource-landing-card',
    '.cta-final-content',
    '.about-image-wrap',
    '.hm-card',
    // Long-form article pages (blog) — these carry the highest content value
    // and previously had no entrance motion at all, making them feel dead.
    '.article-title',
    '.article-subtitle',
    '.article-meta',
    '.article-toc',
    '.article-content > *',
    '.spec-box',
    '.article-cta-inner',
    // Utility / conversion pages
    '.page-hero-inner',
    '.faq-group',
    '.faq-item',
    '.thank-you-card',
    '.next-steps',
    '.step-item',
  ].join(', ');

  const elements = document.querySelectorAll(SELECTOR);
  if (!elements.length) return;

  // Mark body as ready — CSS will hide reveal elements (only when JS works)
  document.body.classList.add('reveal-ready');

  elements.forEach(function(el) {
    el.classList.add('reveal-element');
  });

  const STAGGER_STEP = 60;   // ms per item
  const STAGGER_CAP = 6;     // items beyond this share the last delay

  // Delay an element by its index among the reveal elements sharing its parent,
  // so rows and grids cascade in. Lone elements (e.g. a section header) get none.
  function staggerDelay(el) {
    const parent = el.parentElement;
    if (!parent) return 0;

    const kids = parent.children;
    let index = 0;
    let group = 0;
    for (let i = 0; i < kids.length; i++) {
      if (!kids[i].classList.contains('reveal-element')) continue;
      if (kids[i] === el) index = group;
      group++;
    }

    if (group < 2) return 0;
    return Math.min(index, STAGGER_CAP) * STAGGER_STEP;
  }

  const ROOT_MARGIN = '0px 0px -40px 0px';
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const delay = staggerDelay(entry.target);
        if (delay) entry.target.style.transitionDelay = delay + 'ms';
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: ROOT_MARGIN });

  elements.forEach(function(el) { observer.observe(el); });
})();
