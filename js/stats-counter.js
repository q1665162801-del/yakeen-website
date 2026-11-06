/**
 * stats-counter.js — Animated number counting for stat displays
 *
 * Progressive enhancement: the final value ships in the HTML (the page reads
 * correctly with JS disabled). When the element scrolls into view, the number
 * counts up from 0 with an ease-out curve.
 *
 * Markup contract — data-target goes on the element that owns the number:
 *   Flat text       <div class="stat-big" data-target="10" data-suffix="+ yrs">10+ yrs</div>
 *   Number + markup <div class="stat-number" data-target="150">150<em>+</em></div>
 *                   (only the leading text node is animated; sibling markup
 *                    such as a styled <em> suffix is left untouched)
 *
 * Attributes:
 *   data-target  required — integer to count to (0 is left static)
 *   data-prefix  optional — leading string, flat mode only
 *   data-suffix  optional — trailing string, flat mode only
 *   data-digits  "ar"  — render Arabic-Indic numerals (١٢٣) plus the Arabic
 *                        thousands separator (٬); any other value keeps the
 *                        plain Western digits this page already uses
 */

(function () {
  'use strict';

  var DURATION = 1800; /* ms */

  /* Trigger slightly before the number reaches the very bottom of the viewport. */
  var BOTTOM_MARGIN = '0px 0px -50px 0px';

  /* Arabic-Indic digits (U+0660–U+0669) and the Arabic thousands separator (U+066C) */
  var AR_MAP = {
    '0': '\u0660', '1': '\u0661', '2': '\u0662', '3': '\u0663', '4': '\u0664',
    '5': '\u0665', '6': '\u0666', '7': '\u0667', '8': '\u0668', '9': '\u0669',
    ',': '\u066C'
  };

  function format(value, arabic) {
    var s = Math.round(value).toLocaleString('en-US');
    if (!arabic) return s;
    return s.replace(/[0-9,]/g, function (c) { return AR_MAP[c]; });
  }

  /* Newer browsers ship a string-argument replaceAll; this project keeps the
     ES5-friendly callback form, so no dependency on it. */

  function write(el, text) {
    var first = el.firstChild;
    if (el.children.length > 0) {
      /* Number + markup: only the leading text node carries the value. */
      if (first && first.nodeType === 3) {
        first.nodeValue = text;
      } else {
        el.insertBefore(document.createTextNode(text), first);
      }
      return;
    }
    /* Flat text: own the whole content, prefix/suffix included. */
    el.textContent = (el.dataset.prefix || '') + text + (el.dataset.suffix || '');
  }

  function animate(el, target, arabic) {
    var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / DURATION, 1);
      var eased = 1 - Math.pow(1 - progress, 3); /* ease-out cubic */
      write(el, format(target * eased, arabic));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        write(el, format(target, arabic));
      }
    }
    requestAnimationFrame(step);
  }

  function init() {
    var candidates = document.querySelectorAll('[data-target]');
    if (!candidates.length) return;

    var els = [];
    Array.prototype.forEach.call(candidates, function (el) {
      var target = parseInt(el.dataset.target, 10);
      if (!isNaN(target) && target > 0) els.push(el);
    });
    if (!els.length) return;

    /* No IntersectionObserver — just show the final values. */
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        write(el, format(parseInt(el.dataset.target, 10), el.dataset.digits === 'ar'));
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        animate(el, parseInt(el.dataset.target, 10), el.dataset.digits === 'ar');
        io.unobserve(el);
      });
    }, {
      threshold: 0.4,
      rootMargin: BOTTOM_MARGIN
    });

    els.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
