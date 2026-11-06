/* ============================================================
   FORM AJAX SUBMIT — all inquiry forms on the site

   Posts to /api/lead, which forwards to the CRM server-side. Posting
   directly to Zoho is not possible from the browser: Web-to-Lead returns
   no CORS headers.
   ============================================================ */

(function () {
  'use strict';

  const FALLBACK_EMAIL = 'alan@yakeenlighting.com';

  const MESSAGES = {
    en: {
      sending: 'Sending...',
      successTitle: 'Message sent!',
      successText: "Thank you for reaching out. We'll get back to you within 24 hours.",
      subscribedTitle: "You're subscribed!",
      subscribedText: 'Thanks for subscribing — look out for our next note.',
      resourceTitle: 'Request received!',
      resourceText: "We'll send it over within 24 hours. Check your inbox.",
      errorTitle: 'Oops, something went wrong',
      errorText: 'You can also email us directly at',
      networkError: 'Network error. Please try again or email us directly.',
      genericError: 'Something went wrong. Please try again.',
    },
    ar: {
      sending: 'جارٍ الإرسال...',
      successTitle: 'تم إرسال الرسالة!',
      successText: 'شكراً لتواصلك معنا. سنرد عليك خلال 24 ساعة.',
      subscribedTitle: 'تم تأكيد اشتراكك!',
      subscribedText: 'شكراً لاشتراكك — ستصلك نشرتنا القادمة.',
      resourceTitle: 'تم استلام طلبك!',
      resourceText: 'سنرسله إليك خلال 24 ساعة. تابع بريدك الوارد.',
      errorTitle: 'حدث خطأ ما',
      errorText: 'يمكنك أيضاً مراسلتنا مباشرة على',
      networkError: 'خطأ في الشبكة. حاول مرة أخرى أو راسلنا بالبريد مباشرة.',
      genericError: 'حدث خطأ ما. حاول مرة أخرى.',
    },
  };

  const t = MESSAGES[document.documentElement.lang === 'ar' ? 'ar' : 'en'];

  // Cloudflare Turnstile site key, injected via <meta name="turnstile-sitekey">.
  // Empty until the widget is configured — the form then posts as before.
  const siteKeyMeta = document.querySelector('meta[name="turnstile-sitekey"]');
  const SITEKEY = (siteKeyMeta && siteKeyMeta.content) || '';
  const widgets = new WeakMap();

  // Set when the Turnstile script fails to load (blocked network, GFW).
  // The form then submits without a token and the server falls back to
  // behavioural signals — a blocked visitor must never be locked out.
  let turnstileFailed = false;
  const pageLoadedAt = Date.now();

  // Matches the kinds /api/lead validates and describes.
  const FEEDBACK = {
    newsletter: { title: 'subscribedTitle', text: 'subscribedText' },
    resource: { title: 'resourceTitle', text: 'resourceText' },
    inquiry: { title: 'successTitle', text: 'successText' },
  };

  function loadTurnstile() {
    if (!SITEKEY || document.querySelector('script[data-turnstile]')) return;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.setAttribute('data-turnstile', '1');
    script.onerror = function () { turnstileFailed = true; };
    document.head.appendChild(script);
  }

  // Mounted lazily on each lead form's first interaction. Loading api.js and
  // rendering the widget at page load pulled challenges.cloudflare.com into
  // the load timeline and held the window load event for seconds from slow
  // regions; a submit always follows an interaction, so the challenge is
  // still mandatory wherever it matters.
  function mountTurnstile(form) {
    if (!SITEKEY || form.dataset.turnstileMounted) return;
    form.dataset.turnstileMounted = '1';

    const holder = document.createElement('div');
    holder.className = 'cf-turnstile-holder';
    const submit = form.querySelector('button[type="submit"]');
    // The button can sit inside a row wrapper (e.g. the newsletter form);
    // insert into its actual parent — form.insertBefore throws NotFoundError
    // on nested buttons, and an uncaught throw here kills every script that
    // follows in the bundle.
    if (submit) submit.parentNode.insertBefore(holder, submit);
    else form.appendChild(holder);

    loadTurnstile();

    // Retry for up to 10s while api.js loads; without a cap a blocked
    // script would spin this timer forever.
    let attempts = 0;
    const render = function () {
      if (turnstileFailed) return;
      if (!window.turnstile) {
        if (attempts++ < 40) setTimeout(render, 250);
        return;
      }
      widgets.set(form, window.turnstile.render(holder, {
        sitekey: SITEKEY,
        appearance: 'interaction-only',
      }));
    };
    render();
  }

  function initForms() {
    document.querySelectorAll('form[action*="/api/lead"]').forEach(setupForm);
  }

  function formKind(form) {
    const field = form.querySelector('input[name="form_type"]');
    const value = field ? field.value : '';
    return FEEDBACK[value] ? value : 'inquiry';
  }

  function setupForm(form) {
    // Mount the challenge lazily on first interaction with the form.
    if (SITEKEY) {
      const arm = function () { mountTurnstile(form); };
      form.addEventListener('focusin', arm, { once: true });
      form.addEventListener('pointerdown', arm, { once: true });
    }

    let feedback = form.querySelector('.form-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'form-feedback';
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      form.appendChild(feedback);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn ? btn.innerHTML : '';

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-spinner"></span>' + t.sending;
      }

      feedback.className = 'form-feedback';

      const formData = new FormData(form);
      formData.set('page', window.location.pathname);
      formData.set('lang', document.documentElement.lang || 'en');
      formData.set('elapsed', String(Date.now() - pageLoadedAt));

      // Wait up to 2.5s for the security check; if it never produces a token
      // (blocked script, very slow network), submit without one — the server
      // applies behavioural checks instead of locking the visitor out.
      if (SITEKEY && !turnstileFailed) {
        mountTurnstile(form); // no-op when already mounted; covers programmatic submits
        waitForToken(form, 2500).then(function (token) {
          if (token) formData.set('cf-turnstile-response', token);
          postForm(form, formData, feedback, btn, originalText);
        });
      } else {
        postForm(form, formData, feedback, btn, originalText);
      }
    });
  }

  // Polls briefly for a Turnstile token. Resolves with '' when the widget
  // has not produced one within the timeout (slow or blocked script) —
  // the server-side degraded path decides what to do with such posts.
  function waitForToken(form, timeoutMs) {
    return new Promise(function (resolve) {
      const start = Date.now();
      (function poll() {
        const widgetId = widgets.get(form);
        const token = widgetId !== undefined && window.turnstile
          ? window.turnstile.getResponse(widgetId)
          : '';
        if (token || turnstileFailed || Date.now() - start >= timeoutMs) {
          resolve(token);
          return;
        }
        setTimeout(poll, 200);
      })();
    });
  }

  function postForm(form, formData, feedback, btn, originalText) {
    const kind = formKind(form);

    fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    })
      .then(function (response) {
        if (response.ok) {
          showSuccess(feedback, kind);
          trackLead(form, kind);
          form.reset();
          if (SITEKEY && window.turnstile) {
            const widgetId = widgets.get(form);
            if (widgetId !== undefined) window.turnstile.reset(widgetId);
          }
          return;
        }
        return response.json()
          .then(function (data) {
            showError(feedback, data.message || t.genericError);
          })
          .catch(function () {
            showError(feedback, t.genericError);
          });
      })
      .catch(function () {
        showError(feedback, t.networkError);
      })
      .finally(function () {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      });
  }

  function showSuccess(container, kind) {
    const copy = FEEDBACK[kind];
    container.className = 'form-feedback form-feedback--success show';
    container.innerHTML =
      '<span class="form-feedback-icon" aria-hidden="true">✓</span>' +
      '<div class="form-feedback-title">' + t[copy.title] + '</div>' +
      '<div class="form-feedback-text">' + t[copy.text] + '</div>';
  }

  function showError(container, message) {
    container.className = 'form-feedback form-feedback--error show';
    container.innerHTML =
      '<span class="form-feedback-icon" aria-hidden="true">✕</span>' +
      '<div class="form-feedback-title">' + t.errorTitle + '</div>' +
      '<div class="form-feedback-text">' + message + '<br>' + t.errorText + ' ' +
      '<a href="mailto:' + FALLBACK_EMAIL + '">' + FALLBACK_EMAIL + '</a></div>';
  }

  const EVENTS = {
    newsletter: 'newsletter_signup',
    resource: 'resource_request',
    inquiry: 'generate_lead',
  };

  function trackLead(form, kind) {
    if (typeof window.ykTrack !== 'function') return;
    window.ykTrack(EVENTS[kind], {
      form_name: form.id || form.className || 'inquiry',
      page_path: window.location.pathname,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForms);
  } else {
    initForms();
  }
})();
