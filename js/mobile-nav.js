/* Yakeen Lighting — Universal Mobile Navigation (v4)
   Performance optimized: GPU-accelerated transform, lightweight backdrop
   Supports: .nav / .primary-nav / .navbar / .dark-nav
*/
(function() {
  'use strict';

  var IS_AR = document.documentElement.lang === 'ar';
  var COPY = IS_AR
    ? { toggle: 'فتح القائمة', close: 'إغلاق القائمة', menu: 'قائمة التنقل' }
    : { toggle: 'Toggle menu', close: 'Close menu', menu: 'Mobile navigation' };

  // Find the main navigation element
  function findNav() {
    return document.querySelector('.nav') ||
           document.querySelector('.primary-nav') ||
           document.querySelector('.navbar') ||
           document.querySelector('nav');
  }

  // Get all nav links
  function getNavLinks(nav) {
    if (!nav) return [];
    const links = nav.querySelectorAll('a[href]');
    const filtered = [];
    links.forEach(function(link) {
      if (link.classList.contains('nav-logo') ||
          link.classList.contains('nav-logo-img')) return;
      filtered.push(link);
    });
    return filtered;
  }

  // Find or create toggle button
  function getOrCreateToggle(nav) {
    let toggle = nav.querySelector('.nav-toggle');
    if (toggle) return toggle;

    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-label', COPY.toggle);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'mobile-menu');
    toggle.innerHTML = '<span></span><span></span><span></span>';

    const cta = nav.querySelector('.nav-cta');
    if (cta && cta.parentNode) {
      cta.parentNode.insertBefore(toggle, cta);
    } else {
      nav.appendChild(toggle);
    }
    return toggle;
  }

  // Create backdrop element (separate from body to avoid full-page repaint)
  function createBackdrop() {
    var backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);
    return backdrop;
  }

  // Create mobile menu with links cloned from nav
  function createMobileMenu(nav, links) {
    var menu = document.createElement('div');
    menu.id = 'mobile-menu';
    menu.className = 'mobile-menu';
    menu.setAttribute('aria-label', COPY.menu);
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-hidden', 'true');

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'mobile-close';
    closeBtn.setAttribute('aria-label', COPY.close);
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closeMenu);
    menu.appendChild(closeBtn);

    // Use document fragment for bulk append (fewer reflows)
    var fragment = document.createDocumentFragment();
    links.forEach(function(link) {
      var cloned = link.cloneNode(true);

      // A dropdown parent is desktop-only chrome: href="#" with the submenu
      // on hover. Cloned as-is into the flat mobile list it became a dead
      // tap target that closed the menu and jumped to the top. Render it as
      // a non-interactive group label instead; its children follow below.
      if (cloned.getAttribute('href') === '#') {
        cloned.classList.remove('nav-link');
        cloned.classList.add('mobile-group-label');
        cloned.removeAttribute('href');
        cloned.removeAttribute('role');
        cloned.removeAttribute('aria-haspopup');
        cloned.removeAttribute('aria-expanded');
        fragment.appendChild(cloned);
        return;
      }

      cloned.classList.remove('nav-link');
      cloned.classList.add('mobile-link');
      if (cloned.classList.contains('nav-cta')) {
        cloned.classList.add('mobile-cta');
      }
      cloned.addEventListener('click', function() {
        // Fast close — no delay for snappier feel on mobile
        requestAnimationFrame(closeMenu);
      });
      fragment.appendChild(cloned);
    });
    menu.appendChild(fragment);

    document.body.appendChild(menu);
    return menu;
  }

  // Focus management for accessibility
  var lastFocusedElement = null;
  var focusableSelector = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

  function getFocusableElements(container) {
    return Array.prototype.slice.call(container.querySelectorAll(focusableSelector)).filter(
      function(el) { return !el.hasAttribute('disabled') && el.offsetParent !== null; }
    );
  }

  function trapFocus(e) {
    if (e.key !== 'Tab' || !isOpen) return;
    var focusable = getFocusableElements(mobileMenu);
    if (focusable.length === 0) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // State
  var nav, toggle, mobileMenu, backdrop;
  var isOpen = false;
  // Touch handling to prevent background scroll
  var touchStartY = 0;

  function init() {
    nav = findNav();
    if (!nav) return;

    var links = getNavLinks(nav);
    if (links.length === 0) return;

    toggle = getOrCreateToggle(nav);
    backdrop = createBackdrop();
    mobileMenu = createMobileMenu(nav, links);

    toggle.addEventListener('click', toggleMenu);
    backdrop.addEventListener('click', closeMenu);

    // Close on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    // Close on resize to desktop (debounced)
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        if (window.innerWidth > 768 && isOpen) closeMenu();
      }, 100);
    });

    // Prevent body scroll when menu is open (touch devices)
    mobileMenu.addEventListener('touchstart', function(e) {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    mobileMenu.addEventListener('touchmove', function(e) {
      var menu = mobileMenu;
      var currentY = e.touches[0].clientY;
      var diff = touchStartY - currentY;

      // Only prevent default if scrolling would go beyond menu bounds
      if (menu.scrollTop === 0 && diff < 0) {
        e.preventDefault();
      } else if (menu.scrollTop + menu.clientHeight >= menu.scrollHeight && diff > 0) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  function toggleMenu() {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function openMenu() {
    isOpen = true;
    lastFocusedElement = document.activeElement;

    if (toggle) {
      toggle.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
    }

    if (mobileMenu) {
      mobileMenu.classList.add('is-open');
      mobileMenu.setAttribute('aria-hidden', 'false');
    }

    if (backdrop) {
      backdrop.classList.add('is-visible');
    }

    // Lock background scroll. touch-action is deliberately NOT disabled here:
    // it intersects down to the menu itself and would make the (tall) menu
    // unscrollable by touch on mobile.
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Focus first element after transition
    setTimeout(function() {
      if (mobileMenu) {
        var focusable = getFocusableElements(mobileMenu);
        if (focusable.length > 0) focusable[0].focus();
      }
    }, 280);

    document.addEventListener('keydown', trapFocus);
  }

  function closeMenu() {
    isOpen = false;

    if (toggle) {
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    }

    if (mobileMenu) {
      mobileMenu.classList.remove('is-open');
      mobileMenu.setAttribute('aria-hidden', 'true');
    }

    if (backdrop) {
      backdrop.classList.remove('is-visible');
    }

    // Restore body scroll after animation completes
    setTimeout(function() {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }, 280);

    document.removeEventListener('keydown', trapFocus);

    // Return focus to toggle button
    if (lastFocusedElement && lastFocusedElement.focus) {
      setTimeout(function() { lastFocusedElement.focus(); }, 50);
    }
  }

  // Initialize when DOM is ready
  function tryInit() {
    try {
      init();
    } catch (err) {
      console.warn('[Yakeen Nav] Initialization failed:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }
})();
