/* Accordion — collapsible Q&A toggle.
   Single authoritative implementation for every collapsible block on the site
   (.faq-item on the FAQ pages, .accordion-item on the AR start-project page).
   The trigger is the header element; its parent carries the state class.
   State class is .is-open — the same convention used by nav-dropdown and
   mobile-nav, so the whole site speaks one language for "expanded". */
function toggleAccordion(trigger) {
  var item = trigger.parentElement;
  if (!item) return;
  var open = item.classList.toggle('is-open');
  if (trigger.hasAttribute('aria-expanded')) {
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
}

(function () {
  'use strict';

  // The FAQ pages use <div class="faq-question"> (not a button). Make those
  // triggers keyboard-operable and expose their state, so the accordion is not
  // mouse-only and screen readers announce expanded/collapsed.
  function enhanceTriggers() {
    var triggers = document.querySelectorAll('.faq-question, .accordion-header');

    triggers.forEach(function (trigger, index) {
      var item = trigger.parentElement;
      if (!item) return;

      var isButton = trigger.tagName === 'BUTTON';

      if (!isButton) {
        trigger.setAttribute('role', 'button');
        if (!trigger.hasAttribute('tabindex')) trigger.setAttribute('tabindex', '0');
        trigger.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            toggleAccordion(trigger);
          }
        });
      }

      if (!trigger.hasAttribute('aria-expanded')) {
        trigger.setAttribute('aria-expanded', item.classList.contains('is-open') ? 'true' : 'false');
      }

      var panel = trigger.nextElementSibling;
      if (panel) {
        if (!panel.id) panel.id = 'accordion-panel-' + (index + 1);
        trigger.setAttribute('aria-controls', panel.id);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceTriggers);
  } else {
    enhanceTriggers();
  }
})();
