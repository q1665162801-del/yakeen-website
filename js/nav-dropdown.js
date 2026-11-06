/* Nav Dropdown — Click support for desktop dropdowns
   Adds click-to-toggle behavior on top of CSS :hover
   Useful for touch devices and keyboard accessibility
*/
(function() {
  'use strict';

  const dropdowns = document.querySelectorAll('.nav-dropdown');
  if (!dropdowns.length) return;

  let openDropdown = null;

  function closeOpen() {
    if (openDropdown) {
      openDropdown.classList.remove('is-open');
      const link = openDropdown.querySelector('.nav-link');
      if (link) link.setAttribute('aria-expanded', 'false');
      openDropdown = null;
    }
  }

  dropdowns.forEach(function(dropdown) {
    const link = dropdown.querySelector('.nav-link');
    if (!link) return;

    link.setAttribute('aria-haspopup', 'true');
    link.setAttribute('aria-expanded', 'false');

    link.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = dropdown.classList.contains('is-open');
      closeOpen();

      if (!isOpen) {
        dropdown.classList.add('is-open');
        link.setAttribute('aria-expanded', 'true');
        openDropdown = dropdown;
      }
    });

    link.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        link.click();
      }
      if (e.key === 'Escape') {
        closeOpen();
        link.focus();
      }
    });
  });

  document.addEventListener('click', function(e) {
    if (openDropdown && !openDropdown.contains(e.target)) {
      closeOpen();
    }
  }, true);

  window.addEventListener('scroll', function() {
    if (openDropdown) closeOpen();
  }, { passive: true });

})();
