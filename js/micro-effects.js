/* ============================================================
   Interactive micro-effects
   - Ripple effect on gold buttons
   - Hero parallax (desktop)
   - Smooth image load fade-in

   All DOM reads deferred to after first paint (rAF) so we never force
   synchronous layouts during the critical LCP window — mobile CPUs on
   4x slowdown showed 275ms of forced reflow here previously.
   ============================================================ */
(function() {
  'use strict';

  function initRipple() {
    document.querySelectorAll('.btn-accent, .submit-btn, .nav-cta').forEach(function(btn) {
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';

      btn.addEventListener('click', function(e) {
        // Defer getBoundingClientRect to the next frame so the click handler
        // doesn't block the interaction paint (prevents INP regression).
        requestAnimationFrame(function() {
          var rect = btn.getBoundingClientRect();
          var ripple = document.createElement('span');
          var size = Math.max(rect.width, rect.height);
          var x = e.clientX - rect.left - size / 2;
          var y = e.clientY - rect.top - size / 2;

          ripple.style.cssText =
            'position:absolute;' +
            'left:' + x + 'px;' +
            'top:' + y + 'px;' +
            'width:' + size + 'px;' +
            'height:' + size + 'px;' +
            'background:rgba(255,255,255,0.4);' +
            'border-radius:50%;' +
            'transform:scale(0);' +
            'animation:ripple 0.6s ease-out;' +
            'pointer-events:none;';

          btn.appendChild(ripple);
          setTimeout(function() { ripple.remove(); }, 600);
        });
      });
    });
  }

  function initParallax() {
    // Targets the layer that actually exists in the markup: .home-hero-bg on the
    // home page, .page-hero-bg on every inner page. Both layers sit at inset:0
    // inside an overflow:hidden hero, so a plain downward drift would uncover
    // the hero's own background — scaling by DRIFT keeps it covered.
    var heroBg = document.querySelector('.home-hero-bg, .page-hero-bg');
    if (!heroBg) return;
    if (window.innerWidth <= 768) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Read offsetHeight AFTER first paint. Reading it synchronously at init
    // forces the browser to flush style/layout mid-parsing — the #1 source of
    // forced reflow on mobile CPUs.
    requestAnimationFrame(function() {
      var heroBgHeight = heroBg.offsetHeight;
      if (!heroBgHeight) return;
      var DRIFT = 60;
      var driftScale = 1 + (2 * DRIFT) / heroBgHeight;
      var parallaxTicking = false;

      window.addEventListener('scroll', function() {
        if (parallaxTicking) return;
        parallaxTicking = true;
        requestAnimationFrame(function() {
          var scrolled = window.scrollY;
          if (scrolled < window.innerHeight) {
            var drift = Math.min(scrolled * 0.12, DRIFT);
            heroBg.style.transform = 'translateY(' + drift + 'px) scale(' + driftScale + ')';
          }
          parallaxTicking = false;
        });
      }, { passive: true });
    });
  }

  function initImgFade() {
    document.querySelectorAll('img').forEach(function(img) {
      if (img.complete) {
        img.classList.add('img-loaded');
      } else {
        img.addEventListener('load', function() {
          img.classList.add('img-loaded');
        });
      }
    });
  }

  // Defer ALL init until after the first paint so none of these DOM queries
  // can force synchronous layout during LCP.
  requestAnimationFrame(function() {
    initRipple();
    initParallax();
    initImgFade();
  });
})();
