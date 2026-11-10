// functions/_middleware.js — Cloudflare Pages Functions middleware
// Runs on EVERY request (including static files), before _redirects
// Purpose: canonicalize all non-www identities → www.yakeenlighting.com 301

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();

  // ── Case 1: *.pages.dev → 301 → canonical www ──
  //    Blocks Cloudflare's preview + production pages.dev subdomains
  if (host.endsWith(".pages.dev")) {
    const target = new URL(url.pathname + url.search + url.hash, "https://www.yakeenlighting.com");
    return Response.redirect(target.toString(), 301);
  }

  // ── Case 2: bare domain (no-hyphen) defense-in-depth ──
  if (host === "yakeenlighting.com") {
    const target = new URL(url.pathname + url.search + url.hash, "https://www.yakeenlighting.com");
    return Response.redirect(target.toString(), 301);
  }

  // ── Case 3: HYPHENATED domain variant (yakeen-lighting.com) → 301 → canonical ──
  //    This is a *second* domain that was added to the Pages project.
  //    Without this redirect, it serves 200 + runs _redirects against its own hostname,
  //    creating a parallel identity (compare → yakeen-lighting.com/faq, NOT www.yakeenlighting.com/faq).
  //    canonical tags point to www, but crawlers still have to resolve two entry points.
  if (host === "yakeen-lighting.com" || host === "www.yakeen-lighting.com") {
    const target = new URL(url.pathname + url.search + url.hash, "https://www.yakeenlighting.com");
    return Response.redirect(target.toString(), 301);
  }

  // ── Case 4: everything else → serve normally ──
  //    context.next() passes through to _redirects, static files, api/*
  //
  //    NOTE: do NOT try to rewrite Cache-Control here for static assets.
  //    Verified in production: a middleware that set
  //    `Cache-Control: no-cache` on /sw.js still shipped
  //    `max-age=14400, must-revalidate` — Cloudflare Pages re-applies the
  //    asset-layer header policy after the Function returns, so Function
  //    headers cannot override `_headers`/defaults for static files.
  return context.next();
}
