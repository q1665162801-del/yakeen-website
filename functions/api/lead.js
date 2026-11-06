/**
 * /api/lead — lead intake endpoint
 *
 * The site's forms POST here (same-origin AJAX). Forwarding to the CRM happens
 * server-side because Zoho's Web-to-Lead endpoint returns no CORS headers and
 * cannot be called from the browser directly.
 *
 * Destination:
 *   ZOHO_XNQSJSDP + ZOHO_XMIWTLD set -> Zoho CRM Web-to-Lead
 *   otherwise                        -> FormSubmit relay, so the form keeps
 *                                       working before Zoho credentials exist
 *
 * Email:
 *   RESEND_API_KEY + LEAD_FROM_EMAIL set -> customer confirmation + internal
 *   notification. Unset -> skipped, zero bytes of extra work.
 *
 * Credentials live in Cloudflare environment variables, never in the HTML.
 */

// Zoho Web-to-Lead lives on the account's data center — crm.zoho.com (US),
// crm.zoho.eu, crm.zoho.in, crm.zoho.jp, crm.zoho.com.au. A form posted to the
// wrong DC is rejected, so ZOHO_ENDPOINT must match the CRM's region.
const ZOHO_ENDPOINT_DEFAULT = 'https://crm.zoho.com/crm/WebToLeadForm';
const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/';
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const SITE_URL = 'https://www.yakeenlighting.com';
const WHATSAPP_DISPLAY = '+86 181 0343 4722';
const DEFAULT_NOTIFY = 'alan@yakeenlighting.com';

// Every field the browser may send. Anything outside this list is discarded,
// so a form that grows a new input must be registered here or its value is
// silently dropped before it ever reaches the CRM.
const LIMITS = {
  name: 120,
  email: 200,
  phone: 60,
  company: 160,
  country: 80,
  project_type: 60,
  project_location: 120,
  timeline: 60,
  resource: 120,
  message: 5000,
  page: 300,
  elapsed: 10,
  source: 80,
  form_type: 40,
  lang: 5,
};

const HONEYPOTS = ['_honey', '_gotcha', '_hp', 'aG9uZXlwb3Q'];

// Form kind drives both validation and how the lead reads downstream:
//   newsletter — email only          (journal signup)
//   resource   — name + email        (gated download, no message field exists)
//   inquiry    — name + email + message (every project form)
const REQUIRED = {
  newsletter: ['email'],
  resource: ['name', 'email'],
  inquiry: ['name', 'email', 'message'],
};

// Values already in the Zoho "Lead Source" picklist. A new label would be
// rejected by Zoho, so resource downloads stay under "Website" and the
// requested file travels in the Description instead.
const LEAD_SOURCE = {
  newsletter: 'Newsletter',
  resource: 'Website',
  inquiry: 'Website',
};

function kindOf(lead) {
  if (lead.form_type === 'newsletter' || lead.form_type === 'resource') return lead.form_type;
  return 'inquiry';
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Zoho requires Company on a lead. The email domain is the best zero-friction
// substitute for a form that does not ask for one.
function companyFromEmail(email) {
  const domain = (email.split('@')[1] || '').replace(/^www\./i, '');
  return domain || 'Not Provided';
}

// Everything that is not the free-text message: the fields that only some
// forms collect. Kept in one place so the CRM record, the internal alert and
// the fallback relay all describe a lead the same way.
function describe(lead, kind) {
  const lines = [];
  if (kind === 'resource' && lead.resource) lines.push('Requested resource: ' + lead.resource);
  if (lead.project_type) lines.push('Project type: ' + lead.project_type);
  if (lead.project_location) lines.push('Project location: ' + lead.project_location);
  if (lead.timeline) lines.push('Timeline: ' + lead.timeline);
  if (lead.source) lines.push('Source: ' + lead.source);
  if (lead.page) lines.push('Sent from: ' + lead.page);
  return lines.join('\n');
}

function fullDescription(lead, kind) {
  const context = describe(lead, kind);
  if (lead.message) return context ? lead.message + '\n\n---\n' + context : lead.message;
  return context || LEAD_SOURCE[kind] + ' from the website';
}

function mapLead(lead, kind) {
  const record = {
    'Last Name': lead.name || lead.email.split('@')[0] || 'Subscriber',
    'Email': lead.email,
    'Company': lead.company || companyFromEmail(lead.email),
    'Lead Source': LEAD_SOURCE[kind],
    'Description': fullDescription(lead, kind),
  };
  if (lead.phone) record['Phone'] = lead.phone;
  if (lead.country) record['Country'] = lead.country;
  return record;
}

/* ------------------------------------------------------------------
   Email
   ------------------------------------------------------------------ */

function customerEmail(lead, kind) {
  const ar = lead.lang === 'ar';
  const greeting = lead.name ? lead.name.split(' ')[0] : '';

  if (kind === 'newsletter') {
    return ar
      ? {
          subject: 'تم تأكيد اشتراكك — ياكين للإضاءة',
          text: [
            'مرحباً،',
            '',
            'شكراً لاشتراكك في النشرة الإخبارية لياكين للإضاءة. ستصلك ملاحظاتنا الشهرية حول تصميم الإضاءة وتحديثات سوق الشرق الأوسط.',
            '',
            'يمكنك الرد على هذا البريد في أي وقت لإلغاء الاشتراك.',
            '',
            'ياكين للإضاءة',
            SITE_URL,
          ].join('\n'),
        }
      : {
          subject: "You're subscribed — Yakeen Lighting",
          text: [
            'Hello,',
            '',
            'Thanks for subscribing to the Yakeen Lighting newsletter. You will receive our monthly notes on lighting design and GCC market updates.',
            '',
            'Reply to this email at any time to unsubscribe.',
            '',
            'Yakeen Lighting',
            SITE_URL,
          ].join('\n'),
        };
  }

  if (kind === 'resource') {
    const file = lead.resource || 'the resource you requested';
    return ar
      ? {
          subject: 'طلبك وصل — ياكين للإضاءة',
          text: [
            'مرحباً' + (greeting ? ' ' + greeting : '') + '،',
            '',
            'شكراً لطلبك «' + file + '». سيرسله إليك فريقنا خلال 24 ساعة.',
            '',
            'هل تحتاج رداً أسرع؟ رد على هذا البريد أو راسلنا على واتساب: ' + WHATSAPP_DISPLAY,
            '',
            'ياكين للإضاءة',
            SITE_URL,
          ].join('\n'),
        }
      : {
          subject: 'Your request is on its way — Yakeen Lighting',
          text: [
            'Hi' + (greeting ? ' ' + greeting : '') + ',',
            '',
            'Thanks for requesting "' + file + '". Our team will send it over within 24 hours.',
            '',
            'Need it sooner? Reply to this email, or reach us on WhatsApp at ' + WHATSAPP_DISPLAY + '.',
            '',
            'Yakeen Lighting',
            SITE_URL,
          ].join('\n'),
        };
  }

  const location = lead.country || lead.project_location || '—';

  return ar
    ? {
        subject: 'استلمنا استفسارك — ياكين للإضاءة',
        text: [
          'مرحباً' + (greeting ? ' ' + greeting : '') + '،',
          '',
          'شكراً لتواصلك معنا. وصل استفسارك إلى فريق المواصفات لدينا وسنرد عليك خلال 24 ساعة.',
          '',
          'ما أرسلته إلينا',
          '  موقع المشروع: ' + location,
          '  رسالتك: ' + lead.message,
          '',
          'هل تحتاج رداً أسرع؟ رد على هذا البريد أو راسلنا على واتساب: ' + WHATSAPP_DISPLAY,
          '',
          'ياكين للإضاءة',
          SITE_URL,
        ].join('\n'),
      }
    : {
        subject: "We've received your inquiry — Yakeen Lighting",
        text: [
          'Hi' + (greeting ? ' ' + greeting : '') + ',',
          '',
          "Thanks for getting in touch. Your inquiry has reached our specification team and you'll hear back within 24 hours.",
          '',
          'What you sent us',
          '  Project location: ' + location,
          '  Your message: ' + lead.message,
          '',
          'Need a faster answer? Reply to this email, or reach us on WhatsApp at ' + WHATSAPP_DISPLAY + '.',
          '',
          'Yakeen Lighting',
          SITE_URL,
        ].join('\n'),
      };
}

function internalEmail(lead, kind, unverified) {
  const tag = unverified ? '[unverified] ' : '';
  if (kind === 'newsletter') {
    return {
      subject: tag + 'New newsletter subscriber — ' + lead.email,
      text: [
        'New newsletter signup from the website.',
        '',
        'Email: ' + lead.email,
        'Page:  ' + (lead.page || '—'),
        'Lang:  ' + lead.lang,
      ].join('\n'),
    };
  }

  const label = kind === 'resource' ? 'New resource request' : 'New lead';
  const where = lead.country || lead.project_location || 'unknown';
  const subject = tag + label + ' — ' + (lead.name || lead.email) + ' · ' + where;

  const lines = [
    'Name:     ' + (lead.name || '—'),
    'Email:    ' + lead.email,
    'Company:  ' + (lead.company || companyFromEmail(lead.email)),
    'Phone:    ' + (lead.phone || '—'),
    'Country:  ' + (lead.country || '—'),
  ];
  if (lead.resource) lines.push('Resource: ' + lead.resource);
  if (lead.project_type) lines.push('Type:     ' + lead.project_type);
  if (lead.project_location) lines.push('Location: ' + lead.project_location);
  if (lead.timeline) lines.push('Timeline: ' + lead.timeline);
  if (lead.source) lines.push('Source:   ' + lead.source);
  lines.push('Page:     ' + (lead.page || '—'));
  lines.push('Language: ' + lead.lang);
  if (unverified) {
    lines.push('', 'Turnstile: NOT VERIFIED — delivered via degraded path, page open ' + (lead.elapsed || '?') + 'ms before submit.');
  }

  if (lead.message) lines.push('', 'Message:', lead.message);

  return { subject: subject, text: lines.join('\n') };
}

async function sendEmail(env, message) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Display name lifts open rates and spam-folder trust vs a bare
      // noreply@ address. Guard avoids double-wrapping if the env var
      // ever carries its own "Name <addr>" form.
      from: env.LEAD_FROM_EMAIL.indexOf('<') !== -1
        ? env.LEAD_FROM_EMAIL
        : 'Yakeen Lighting <' + env.LEAD_FROM_EMAIL + '>',
      to: [message.to],
      subject: message.subject,
      text: message.text,
      reply_to: message.replyTo,
    }),
  });

  if (res.status >= 400) {
    const detail = await res.text();
    throw new Error('Resend ' + res.status + ': ' + detail.slice(0, 200));
  }
}

// Returns { ok, error }. ok is true when at least one email was accepted by
// Resend. error carries the provider response so a failure stays diagnosable
// instead of silently disappearing.
async function sendEmails(env, lead, kind, unverified) {
  if (!env.RESEND_API_KEY || !env.LEAD_FROM_EMAIL) {
    return { ok: false, error: 'Resend not configured (RESEND_API_KEY / LEAD_FROM_EMAIL)' };
  }

  const notify = env.LEAD_NOTIFY_EMAIL || DEFAULT_NOTIFY;
  const internal = internalEmail(lead, kind, unverified);

  // Internal alert only, by default. The free Resend tier allows 100 sends a
  // day and a bot flood was burning it on addresses that do not exist.
  // Set LEAD_CUSTOMER_CONFIRMATION=true to re-enable the customer auto-reply.
  const tasks = [
    sendEmail(env, { to: notify, subject: internal.subject, text: internal.text, replyTo: lead.email }),
  ];

  if (env.LEAD_CUSTOMER_CONFIRMATION === 'true') {
    const customer = customerEmail(lead, kind);
    tasks.push(sendEmail(env, { to: lead.email, subject: customer.subject, text: customer.text, replyTo: notify }));
  }

  const results = await Promise.allSettled(tasks);

  let sent = 0;
  const errors = [];
  for (const result of results) {
    if (result.status === 'fulfilled') sent++;
    else {
      const message = result.reason && result.reason.message ? result.reason.message : String(result.reason);
      errors.push(message);
      console.error('lead email failed:', message);
    }
  }

  return { ok: sent > 0, error: errors.length ? errors.join(' | ') : null };
}

/* ------------------------------------------------------------------
   CRM delivery
   ------------------------------------------------------------------ */

async function sendToZoho(lead, env, kind) {
  const body = new URLSearchParams();
  body.set('xnQsjsdp', env.ZOHO_XNQSJSDP);
  body.set('xmIwtLD', env.ZOHO_XMIWTLD);
  body.set('actionType', env.ZOHO_ACTION_TYPE || 'TGVhZHM=');
  body.set('returnURL', env.ZOHO_RETURN_URL || SITE_URL + '/thank-you');
  body.set('aG9uZXlwb3Q', '');

  for (const [key, value] of Object.entries(mapLead(lead, kind))) {
    body.set(key, value);
  }

  const res = await fetch(env.ZOHO_ENDPOINT || ZOHO_ENDPOINT_DEFAULT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (res.status >= 400) throw new Error('Zoho responded ' + res.status);
}

async function sendToFormSubmit(lead, env, kind) {
  const to = env.LEAD_FALLBACK_EMAIL || DEFAULT_NOTIFY;

  const subject = kind === 'newsletter'
    ? 'New Newsletter Subscriber'
    : kind === 'resource'
      ? 'New Resource Request — ' + (lead.resource || 'Yakeen Lighting')
      : 'New Project Inquiry — Yakeen Lighting';

  const body = new URLSearchParams();
  body.set('name', lead.name || lead.email.split('@')[0]);
  body.set('email', lead.email);
  if (lead.phone) body.set('phone', lead.phone);
  if (lead.company) body.set('company', lead.company);
  if (lead.country) body.set('country', lead.country);
  body.set('message', fullDescription(lead, kind));
  body.set('_subject', subject);
  body.set('_template', 'table');
  body.set('_captcha', 'false');
  body.set('_replyto', lead.email);

  // FormSubmit is the last-resort free relay. Requires the destination
  // email to be activated (first submission triggers a confirmation email).
  // Falls through to KV if this also fails — see the handler.
  const res = await fetch(FORMSUBMIT_ENDPOINT + to, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Origin': SITE_URL,
      'Referer': SITE_URL + '/',
      'User-Agent': 'Mozilla/5.0 YakeenLighting-Backend',
    },
    body: body.toString(),
  });

  if (res.status >= 400) throw new Error('FormSubmit responded ' + res.status);
}

/* ------------------------------------------------------------------
   Handler
   ------------------------------------------------------------------ */

function fail(lang, en, ar, status) {
  return json({ ok: false, message: lang === 'ar' ? ar : en }, status);
}

/* ------------------------------------------------------------------
   Bot defences
   ------------------------------------------------------------------ */

const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_PER_HOUR = 3;

// Cloudflare Turnstile as a signal, not a gate. Three outcomes:
//   'pass'   — token verified, or no secret configured
//   'absent' — no token presented (widget script blocked on the visitor's
//              network) or an expired token from a real page: nothing to
//              hold against the visitor, so the handler applies behavioural
//              checks instead of rejecting
//   'fail'   — Cloudflare explicitly rejected a presented token: bot
async function turnstileCheck(env, request, form) {
  if (!env.TURNSTILE_SECRET_KEY) return 'pass';

  const token = clean(form.get('cf-turnstile-response'), 2048);
  if (!token) return 'absent';

  const body = new URLSearchParams();
  body.set('secret', env.TURNSTILE_SECRET_KEY);
  body.set('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.set('remoteip', ip);

  try {
    const res = await fetch(TURNSTILE_VERIFY, { method: 'POST', body: body });
    const data = await res.json();
    if (data.success) return 'pass';
    const codes = data['error-codes'] || [];
    // A real visitor whose token aged out (>5 min on the page) is not a bot.
    if (codes.indexOf('timeout-or-duplicate') !== -1) return 'absent';
    return 'fail';
  } catch (e) {
    // Verify endpoint unreachable — never let a Cloudflare hiccup cost a lead.
    console.error('turnstile verify failed:', e.message);
    return 'absent';
  }
}

// Per-IP throttle. A bot flood is what exhausted the Resend daily quota, so
// even a few submissions per hour per address is the ceiling. Degraded-path
// posts (no Turnstile token) get their own stricter bucket.
async function rateLimited(env, request, prefix, max) {
  if (!env.LEADS) return false;

  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return false;

  const key = prefix + Math.floor(Date.now() / 3600000) + ':' + ip;
  try {
    const current = parseInt((await env.LEADS.get(key)) || '0', 10) || 0;
    if (current >= max) return true;
    await env.LEADS.put(key, String(current + 1), { expirationTtl: 7200 });
  } catch (e) {
    console.error('rate limit check failed:', e.message);
    return false;
  }
  return false;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return fail('en', 'Invalid submission.', 'إرسال غير صالح.', 400);
  }

  // Honeypot: bots fill hidden fields. Accept silently so they do not retry.
  for (const field of HONEYPOTS) {
    if (clean(form.get(field), 200)) return json({ ok: true });
  }

  const lead = {};
  for (const key of Object.keys(LIMITS)) {
    lead[key] = clean(form.get(key), LIMITS[key]);
  }
  lead.lang = lead.lang === 'ar' ? 'ar' : 'en';

  const kind = kindOf(lead);

  if (REQUIRED[kind].some(function (k) { return !lead[k]; })) {
    return fail(lead.lang,
      'Please complete every required field.',
      'يرجى إكمال جميع الحقول المطلوبة.', 400);
  }
  if (!isValidEmail(lead.email)) {
    return fail(lead.lang,
      'Please enter a valid email address.',
      'يرجى إدخال بريد إلكتروني صحيح.', 400);
  }

  // Dry run — verifies field mapping without creating a lead.
  if (new URL(request.url).searchParams.has('test')) {
    return json({
      ok: true,
      test: true,
      kind: kind,
      mapped: mapLead(lead, kind),
      customer: customerEmail(lead, kind),
      internal: internalEmail(lead, kind),
    });
  }

  // Bot checks run after the dry-run so diagnostics stay usable.
  const verdict = await turnstileCheck(env, request, form);

  // Cloudflare rejected a presented token — a bot. Drop silently.
  if (verdict === 'fail') return json({ ok: true });

  if (verdict === 'absent') {
    // Degraded path: the visitor's network could not run the Turnstile
    // script (e.g. mainland China), or a real token aged out. Honeypot was
    // already checked above; now require human-like time on page and a
    // stricter per-IP ceiling. Anything that fails is dropped silently so
    // probing bots cannot tell the checks apart.
    const elapsed = parseInt(lead.elapsed, 10);
    if (!elapsed || elapsed < 2000) return json({ ok: true });
    if (await rateLimited(env, request, 'rl2:', 2)) return json({ ok: true });
  } else if (await rateLimited(env, request, 'rl:', MAX_PER_HOUR)) {
    return fail(lead.lang,
      'Too many submissions from this connection. Please try again later or email us directly at ' + DEFAULT_NOTIFY,
      'عدد كبير جداً من الطلبات من هذا الاتصال. يرجى المحاولة لاحقاً أو مراسلتنا مباشرة على ' + DEFAULT_NOTIFY,
      429);
  }

  // Delivery runs in the background via waitUntil: the visitor gets an
  // answer in milliseconds — speed is a feature. Lead safety is unchanged:
  // CRM and email are attempted, and if both fail the lead lands in KV.
  const deliver = (async () => {
    // Delivery is three independent channels: CRM (Zoho or FormSubmit),
    // Resend emails, and Cloudflare KV. The last one is a local fallback
    // so the lead is never lost regardless of external service status.
    let crmOk = false;
    let crmError = null;
    try {
      if (env.ZOHO_XNQSJSDP && env.ZOHO_XMIWTLD) {
        await sendToZoho(lead, env, kind);
      } else {
        await sendToFormSubmit(lead, env, kind);
      }
      crmOk = true;
    } catch (e) {
      crmError = e;
      console.error('crm delivery failed:', e.message);
    }

    // Always attempt email notification, regardless of CRM outcome.
    // Returns false if Resend is not configured (no-op) or both emails failed.
    let emailOk = false;
    let emailError = null;
    try {
      const emailResult = await sendEmails(env, lead, kind, verdict === 'absent');
      emailOk = emailResult.ok;
      emailError = emailResult.error;
    } catch (e) {
      emailError = e.message;
      console.error('lead email error:', e);
    }

    // If both external channels are down, persist in KV so nothing is lost.
    if (!crmOk && !emailOk && env.LEADS) {
      try {
        const ts = Date.now();
        const key = 'lead:' + ts + ':' + (lead.email.replace(/[^a-z0-9]/gi, '') || 'anon');
        const value = JSON.stringify({
          ts: ts,
          iso: new Date(ts).toISOString(),
          lead: lead,
          kind: kind,
          crmError: crmError && crmError.message,
          emailError: emailError,
        });
        await env.LEADS.put(key, value, { expirationTtl: 30 * 24 * 60 * 60 }); // 30 days
        console.warn('lead saved to KV — external delivery down');
      } catch (e) {
        console.error('kv fallback failed:', e.message);
      }
    }

    if (!crmOk && !emailOk && !env.LEADS) {
      console.error('lead delivery completely failed. crm:', crmError && crmError.message,
                    'email (Resend not configured?):', !env.RESEND_API_KEY,
                    'kv (LEADS binding?):', !!env.LEADS);
    }
  })();

  if (typeof context.waitUntil === 'function') context.waitUntil(deliver);
  return json({ ok: true });
}
