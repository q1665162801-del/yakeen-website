/**
 * /api/leads — admin endpoint
 *
 * Lists all leads stored in Cloudflare KV when external CRM/email delivery
 * is down. Protected by ADMIN_TOKEN secret (must equal the Bearer token in
 * the Authorization header). Set once in the Pages project secrets, never
 * in HTML.
 *
 * GET  /api/leads         -> JSON array of all stored leads, newest first
 * DELETE /api/leads        -> purge all stored leads (after you've retrieved them)
 */

function auth(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '');
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}

export async function onRequest(context) {
  const { request, env } = context;

  const denied = auth(request, env);
  if (denied) return denied;

  if (!env.LEADS) {
    return new Response(JSON.stringify({ ok: false, error: 'LEADS binding missing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'DELETE') {
    // Purge all leads. Prefix list is paginated; loop until empty.
    let cursor;
    let total = 0;
    do {
      const list = await env.LEADS.list({ prefix: 'lead:', cursor });
      for (const key of list.keys) {
        await env.LEADS.delete(key.name);
        total++;
      }
      cursor = list.list_complete ? null : list.cursor;
    } while (cursor);

    return new Response(JSON.stringify({ ok: true, purged: total }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // GET — list all leads, newest first (KV returns insertion order, so
  // we sort by timestamp descending in JS).
  const results = [];
  let cursor;
  do {
    const list = await env.LEADS.list({ prefix: 'lead:', cursor });
    for (const key of list.keys) {
      const raw = await env.LEADS.get(key.name);
      if (raw) {
        try {
          const obj = JSON.parse(raw);
          obj._key = key.name;
          results.push(obj);
        } catch (e) {
          results.push({ _key: key.name, _raw: raw });
        }
      }
    }
    cursor = list.list_complete ? null : list.cursor;
  } while (cursor);

  results.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });

  return new Response(JSON.stringify({ ok: true, count: results.length, leads: results }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
