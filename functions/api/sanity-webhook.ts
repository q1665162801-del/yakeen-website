// ponytail: Sanity webhook → GitHub workflow_dispatch relay.
// Sanity POSTs here on content change → we trigger GitHub Actions build.
// GH_PAT stored in Cloudflare env vars — never exposed in Sanity dashboard.

export async function onRequestPost(context) {
  const { env } = context;

  if (!env.GH_PAT) {
    return new Response('GH_PAT not configured', { status: 500 });
  }

  const res = await fetch(
    'https://api.github.com/repos/q1665162801-del/yakeen-website/actions/workflows/deploy.yml/dispatches',
    {
      method: 'POST',
      headers: {
        Authorization: `token ${env.GH_PAT}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    }
  );

  return new Response(res.ok ? 'OK' : 'Failed', {
    status: res.status,
    headers: { 'Content-Type': 'text/plain' },
  });
}
