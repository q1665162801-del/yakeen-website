/**
 * form-enhance.js — Form conversion optimizations
 *
 * Two progressive enhancements:
 *   1. Auto-fill form from URL params (e.g. ?product=Track+Spotlights)
 *   2. Collapsible "more details" section to reduce perceived form length
 *
 * Principles:
 *   - Progressive enhancement: forms work perfectly without this script
 *   - No side effects: only runs if matching elements exist
 *   - Non-destructive: never removes fields, only hides/reveals
 */

(function () {
  'use strict';

  var isArabic = document.documentElement.lang === 'ar';
  var COPY = isArabic
    ? { interested: 'مهتم بـ: ', more: 'تفاصيل إضافية', less: 'تفاصيل أقل' }
    : { interested: 'Interested in: ', more: 'More details', less: 'Less details' };

  // ------------------------------------------------------------
  // 1. Auto-fill from URL parameters
  // ------------------------------------------------------------
  function autofillFromParams() {
    var params = new URLSearchParams(window.location.search);
    var product = params.get('product');
    var source = params.get('source');

    if (!product && !source) return;

    // Find the message textarea and prepend context
    var textarea = document.querySelector('textarea[name="message"]');
    if (textarea && product) {
      var prefix = COPY.interested + product + '\n\n';
      if (textarea.value) {
        textarea.value = prefix + textarea.value;
      } else {
        textarea.value = prefix;
      }
    }

    // Attribute the lead to the source form only (never the newsletter form)
    if (source && textarea) {
      var form = textarea.closest('form');
      if (form) {
        var hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'source';
        hidden.value = source;
        form.appendChild(hidden);
      }
    }
  }

  // ------------------------------------------------------------
  // 2. Collapsible form details (reduce perceived length)
  // ------------------------------------------------------------
  var panelSeq = 0;

  function setupCollapsibleForm() {
    // Find forms with country select — we wrap country + any optional fields
    var forms = document.querySelectorAll('form');

    forms.forEach(function (form) {
      var countryGroup = form.querySelector('.form-group select[name="country"]');
      if (!countryGroup) return;

      // A required control must never be moved into a hidden container:
      // constraint validation cannot focus a control inside a display:none
      // ancestor, so the browser silently refuses to submit the form and shows
      // the user no error at all. The project forms (start-project,
      // request-sample) mark country as required — skip the collapse there.
      if (countryGroup.required) return;

      var group = countryGroup.closest('.form-group');
      if (!group) return;

      // Create wrapper for collapsible section
      var wrapper = document.createElement('div');
      wrapper.className = 'form-extra';
      wrapper.setAttribute('aria-live', 'polite');

      // Insert wrapper before the country group, then move country group into it
      group.parentNode.insertBefore(wrapper, group);
      wrapper.appendChild(group);

      // Look for the message group — keep it visible (it's core)
      // Only country goes into the collapsed section for now
      // (if there were more optional fields, they'd go here too)

      // Create toggle button
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'form-extra-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span class="form-extra-toggle-text">' + COPY.more + '</span> <span class="form-extra-toggle-icon" aria-hidden="true">+</span>';

      panelSeq += 1;
      wrapper.id = 'form-extra-panel-' + panelSeq;
      toggle.setAttribute('aria-controls', wrapper.id);
      wrapper.hidden = true;

      // Insert toggle BEFORE the wrapper
      wrapper.parentNode.insertBefore(toggle, wrapper);

      toggle.addEventListener('click', function () {
        var expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !expanded);
        wrapper.hidden = expanded;
        toggle.querySelector('.form-extra-toggle-text').textContent =
          expanded ? COPY.more : COPY.less;
        toggle.querySelector('.form-extra-toggle-icon').textContent =
          expanded ? '+' : '−';
      });
    });
  }

  // ------------------------------------------------------------
  // Init
  // ------------------------------------------------------------
  function init() {
    autofillFromParams();
    setupCollapsibleForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
