/* ============================================================
   Yakeen Lighting — WhatsApp Floating Widget
   Injects a WhatsApp chat button on all pages
   ============================================================ */
(function() {
  'use strict';

  // Configuration
  var WHATSAPP_NUMBER = '8618103434722';

  // The pre-filled message lands in Alan's WhatsApp, so it must arrive in the
  // visitor's language — an Arabic visitor sending English looks like a mistranslation.
  var IS_AR = document.documentElement.lang === 'ar';
  var WHATSAPP_MESSAGE = IS_AR
    ? 'مرحباً ياكين للإضاءة! أرغب في مناقشة مشروع إضاءة.'
    : 'Hi Yakeen Lighting! I\'d like to discuss a lighting project.';
  var ARIA_LABEL = IS_AR ? 'تواصل عبر واتساب' : 'Chat on WhatsApp';
  var TITLE_TEXT = IS_AR ? 'تواصل معنا عبر واتساب' : 'Chat with us on WhatsApp';

  // Don't double-initialize
  if (document.getElementById('yakeen-whatsapp-btn')) return;

  // Build WhatsApp URL
  var whatsappUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(WHATSAPP_MESSAGE);

  // Create the button element
  var btn = document.createElement('a');
  btn.id = 'yakeen-whatsapp-btn';
  btn.href = whatsappUrl;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.setAttribute('aria-label', ARIA_LABEL);
  btn.title = TITLE_TEXT;

  // SVG WhatsApp icon (white)
  btn.innerHTML = `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="currentColor" d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.063-.32 2.365-1.09.115-.3.13-.56.09-.69-.015-.129-.544-.2-1.133-.387l-.087-.028z"/>
      <path fill="currentColor" d="M22.21 9.595A11.86 11.86 0 0 0 16.014 6C9.56 6 4.35 11.2 4.35 17.643c0 2.067.547 4.085 1.586 5.86L4 28l4.748-1.653a11.82 11.82 0 0 0 7.266 2.492h.001c6.454 0 11.664-5.2 11.664-11.643 0-3.11-1.207-6.034-3.399-8.244zM16.012 25.83h-.002a9.84 9.84 0 0 1-5.02-1.378l-.36-.214-2.82.98.994-2.754-.235-.375a9.81 9.81 0 0 1-1.514-5.246C6.974 12.61 11.02 8.58 16.01 8.58a9.83 9.83 0 0 1 6.98 2.89 9.8 9.8 0 0 1 2.883 6.973c-.002 4.96-4.048 8.99-9.86 8.987z"/>
    </svg>
  `;

  // Add to page after a short delay (not too aggressive)
  function showButton() {
    document.body.appendChild(btn);
    // Trigger pulse animation after initial fade-in
    setTimeout(function() {
      btn.classList.add('show');
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showButton);
  } else {
    showButton();
  }
})();
