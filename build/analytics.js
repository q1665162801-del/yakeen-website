/**
 * build/analytics.js — Analytics injection (config-driven)
 *
 * Emits vendor snippets ONLY for providers that have an ID configured in
 * build/config.js. With no IDs configured this returns an empty string,
 * so a site with analytics disabled ships exactly zero extra bytes.
 */
const { ANALYTICS } = require('./config');

function ga4Snippet(id) {
  return `<!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id}');
  </script>`;
}

function claritySnippet(id) {
  return `<!-- Microsoft Clarity -->
  <script>
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${id}");
  </script>`;
}

function cloudflareSnippet(token) {
  return `<!-- Cloudflare Web Analytics -->
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${token}"}'></script>`;
}

function buildAnalyticsHead() {
  const ga4 = (ANALYTICS.ga4MeasurementId || '').trim();
  const clarity = (ANALYTICS.clarityProjectId || '').trim();
  const cloudflare = (ANALYTICS.cloudflareBeaconToken || '').trim();

  const blocks = [];
  if (ga4) blocks.push(ga4Snippet(ga4));
  if (clarity) blocks.push(claritySnippet(clarity));
  if (cloudflare) blocks.push(cloudflareSnippet(cloudflare));

  return blocks.join('\n  ');
}

module.exports = { buildAnalyticsHead };
