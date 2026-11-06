/**
 * product-cta.js — Auto-append product context to CTA links on product pages
 *
 * Detects if current page is a product page and adds `?product=...`
 * query param to all "Start Your Project" / "Request a Quote" links.
 * The form page reads this param and auto-fills the message field.
 *
 * Progressive enhancement:
 *   - Links work perfectly without this script
 *   - Only runs if product-name element + CTA links exist
 */

(function () {
  'use strict';

  function getProductName() {
    // Try specific product name element first
    var nameEl = document.querySelector('[data-product-name]');
    if (nameEl) return nameEl.dataset.productName;

    // Try H1 in the hero. Product H1s read "Product Name<br><em>Tagline</em>",
    // so only the first line is the product name — textContent would glue the
    // tagline onto it with no space.
    var heroH1 = document.querySelector('.page-hero h1, .hero-title, .product-hero h1');
    if (heroH1) {
      var firstLine = '';
      for (var node = heroH1.firstChild; node; node = node.nextSibling) {
        if (node.nodeType === 3) {
          firstLine += node.nodeValue;
          continue;
        }
        if (node.nodeType !== 1) continue;
        var tag = node.tagName.toLowerCase();
        if (tag === 'br' || tag === 'em') break;
        firstLine += node.textContent;
      }
      firstLine = firstLine.replace(/\s+/g, ' ').trim();
      if (firstLine) return firstLine;

      var full = heroH1.textContent.replace(/\s+/g, ' ').trim();
      if (full) return full;
    }

    // Fallback: page title
    if (document.title) {
      var parts = document.title.split('—');
      if (parts[0]) return parts[0].trim();
    }

    return null;
  }

  function init() {
    var productName = getProductName();
    if (!productName) return;

    // Check if we're on a product page (has products/ in path)
    var isProductPage = window.location.pathname.indexOf('/products/') !== -1;
    if (!isProductPage) return;

    // Find all links that point to start-project or contact
    var links = document.querySelectorAll('a[href*="start-project"], a[href*="contact"]');
    if (links.length === 0) return;

    links.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;

      // Only modify internal links (not external)
      if (href.indexOf('http') === 0 && href.indexOf(window.location.hostname) === -1) return;

      // Parse URL and add param
      try {
        var url = new URL(href, window.location.origin);
        url.searchParams.set('product', productName);
        url.searchParams.set('source', 'product-page');
        link.setAttribute('href', url.pathname + url.search + url.hash);
      } catch (e) {
        // Ignore malformed URLs
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
