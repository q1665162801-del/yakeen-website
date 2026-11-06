/* ============================================================
   NEWSLETTER MODAL — Scroll-triggered newsletter signup
   Fires when user scrolls past 35% of page height.
   Uses sessionStorage so it only fires ONCE per browser session.
   ============================================================ */
(function() {
  'use strict';

  var STORAGE_KEY = 'yakeen_newsletter_shown';
  var TRIGGER_RATIO = 0.35; // 35% scroll depth
  var COOLDOWN_MS = 1000;   // debounce after dismiss

  var backdrop;
  var shown = false;

  function init() {
    // Only run on pages that have the modal markup
    backdrop = document.querySelector('.nl-modal-backdrop');
    if (!backdrop) return;

    // Prefer not showing to bots / users who already dismissed
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
    } catch (e) { /* storage disabled — still show */ }

    // Mark modal ready (hide via JS-controlled class, so no-JS users see nothing)
    backdrop.classList.remove('nl-no-modal');

    // Scroll-trigger
    var fired = false;
    var lastCheck = 0;

    window.addEventListener('scroll', function() {
      if (fired) return;
      var now = Date.now();
      if (now - lastCheck < 200) return; // throttle
      lastCheck = now;

      var docH = document.documentElement.scrollHeight - window.innerHeight;
      if (docH <= 0) return;
      var ratio = window.scrollY / docH;

      if (ratio >= TRIGGER_RATIO) {
        fired = true;
        setTimeout(open, 400); // small delay after trigger for smoothness
      }
    }, { passive: true });

    // Close handlers
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) close();
    });

    var closeBtn = backdrop.querySelector('.nl-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', close);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && backdrop.classList.contains('is-open')) {
        close();
      }
    });

    // Auto-close on form success
    var form = backdrop.querySelector('form');
    if (form) {
      form.addEventListener('submit', function() {
        // form-submit.js handles the AJAX; we close after a short delay
        setTimeout(close, 1800);
      });
    }
  }

  function open() {
    if (shown) return;
    shown = true;
    backdrop.classList.add('is-open');
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    // Focus first input for accessibility
    var firstInput = backdrop.querySelector('input[type="email"]');
    if (firstInput) setTimeout(function() { firstInput.focus(); }, 300);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  function close() {
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
