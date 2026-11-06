/* ============================================================
   CONVERSION TRACKING — unified event layer for every lead action

   Exposes window.ykTrack(name, params). Forwards to whichever analytics
   providers are present. No-ops silently when none are configured.
   ============================================================ */

(function () {
  'use strict';

  function ykTrack(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
    if (typeof window.clarity === 'function') {
      window.clarity('event', name);
    }
  }

  window.ykTrack = ykTrack;

  // Outbound contact channels — WhatsApp, email, phone
  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!target || typeof target.closest !== 'function') return;

    var link = target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href') || '';

    if (href.indexOf('wa.me') !== -1) {
      ykTrack('contact_whatsapp', { channel: 'whatsapp' });
    } else if (href.indexOf('mailto:') === 0) {
      ykTrack('contact_email', { channel: 'email' });
    } else if (href.indexOf('tel:') === 0) {
      ykTrack('contact_phone', { channel: 'phone' });
    }
  });
})();
