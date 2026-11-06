/* ============================================================
   Nav scroll effect
   Adds shadow + solid background when page is scrolled past 80px
   ============================================================ */
(function() {
  'use strict';

  const nav = document.querySelector('.nav');
  if (!nav) return;

  let ticking = false;

  function updateNav() {
    const scrolled = window.scrollY > 80;
    if (scrolled) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });
})();
