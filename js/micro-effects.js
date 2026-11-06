/* ============================================================
   Interactive micro-effects
   - Ripple effect on gold buttons
   - Hero parallax (desktop)
   - Smooth image load fade-in
   ============================================================ */
(function() {
  'use strict';

  // ─── Ripple effect on gold buttons ───
  document.querySelectorAll('.btn-accent, .submit-btn, .nav-cta').forEach(function(btn) {
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    
    btn.addEventListener('click', function(e) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
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

  // ─── Hero parallax (desktop) ───
  // Targets the layer that actually exists in the markup: .home-hero-bg on the
  // home page, .page-hero-bg on every inner page. The previous target,
  // .hero-visual, only ever existed in a dead CSS block, so the effect never
  // ran on any page.
  //
  // Both layers sit at inset:0 inside an overflow:hidden hero, so a plain
  // downward drift would uncover the hero's own background along its top edge.
  // Scaling the layer by exactly the distance it travels keeps it covered.
  var heroBg = document.querySelector('.home-hero-bg, .page-hero-bg');
  var heroBgHeight = heroBg ? heroBg.offsetHeight : 0;
  if (heroBg && heroBgHeight && window.innerWidth > 768 &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var DRIFT = 60;                                     // px the layer travels
    var driftScale = 1 + (2 * DRIFT) / heroBgHeight;    // covers DRIFT at both edges
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
  }

  // ─── Smooth image load fade-in ───
  document.querySelectorAll('img').forEach(function(img) {
    if (img.complete) {
      img.classList.add('img-loaded');
    } else {
      img.addEventListener('load', function() {
        img.classList.add('img-loaded');
      });
    }
  });
})();
