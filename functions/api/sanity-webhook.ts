// ponytail: Sanity webhook → GitHub workflow_dispatch relay.
// Sanity POSTs here on content change → we trigger GitHub Actions build.
// GH_PAT stored in Cloudflare env vars — never exposed in Sanity dashboard.

export async function onRequestPost(context) {
  const { env } = context;

  // ponytail: trim whitespace — PowerShell pipe adds trailing newline to secret
  const token = (env.GH_PAT || '').trim();
  if (!token) {
    return new Response('ERROR: GH_PAT not configured', { status: 500 });
  }

  try {
    const res = await fetch(
      'https://api.github.com/repos/q1665162801-del/yakeen-website/actions/workflows/deploy.yml/dispatches',
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' }),
      }
    );

    return new Response(
      res.ok ? `OK: GitHub build triggered (${res.status})` : `FAIL: GitHub returned ${res.status}`,
      {
        status: res.ok ? 200 : res.status,
        headers: { 'Content-Type': 'text/plain' },
      }
    );
  } catch (err) {
    return new Response(`ERROR: ${err.message}`, { status: 500 });
  }
}
