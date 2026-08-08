// ponytail: Cloudflare Pages Function — GitHub OAuth proxy for Decap CMS
// Dual-flow: popup (postMessage+localStorage relay) AND full-page redirect (netlify-cms-user)

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  // Step 1: no code → redirect to GitHub authorization page
  if (!code) {
    if (!env.OAUTH_CLIENT_ID) {
      return new Response('OAuth not configured: OAUTH_CLIENT_ID env var missing', { status: 500 });
    }
    const redirectUri = `${url.origin}/api/oauth`;
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', env.OAUTH_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'repo,user');
    return Response.redirect(authUrl.toString(), 302);
  }

  // Step 2: have code → exchange for access_token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.OAUTH_CLIENT_ID,
      client_secret: env.OAUTH_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    const err = encodeURIComponent(String(tokenData.error_description || tokenData.error || 'Unknown error'));
    return Response.redirect(`${url.origin}/admin/#error=${err}`, 302);
  }

  const token = tokenData.access_token;

  // Build HTML that handles both popup and full-page redirect flows:
  // - Popup flow: window.opener exists → postMessage + localStorage relay for CMS
  // - Redirect flow: window.opener is null → set netlify-cms-user + redirect to /admin/
  const html = `<!DOCTYPE html><html><body>
<p style="font-family:sans-serif;text-align:center;padding:40px">Authenticating…</p>
<script>
var P=${JSON.stringify(JSON.stringify({token,provider:'github'}))};
var U=${JSON.stringify(JSON.stringify({token,backendName:'github'}))};
var p='github',m='authorization:'+p+':success:'+P;
if(window.opener&&!window.opener.closed){
try{window.opener.postMessage('authorizing:'+p,'*');window.addEventListener('message',function(e){if(e.data==='authorizing:'+p)window.opener.postMessage(m,'*')})}catch(e){}
localStorage.setItem('decap_cms_oauth',P);setTimeout(function(){window.close()},2000)
}else{
localStorage.setItem('netlify-cms-user',U);location.href='/admin/'
}
</script></body></html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
