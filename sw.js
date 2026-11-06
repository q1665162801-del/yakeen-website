/**
 * Self-destroying service worker
 * 
 * Purpose: Unregister any previously installed service worker and
 * clear all cached assets. This replaces a legacy PWA service worker
 * that was removed from the codebase but remains installed in user
 * browsers, serving stale cached pages.
 * 
 * How it works:
 * 1. Browser detects sw.js has changed (first visit after deploy)
 * 2. New "kill switch" SW is installed and skips waiting
 * 3. On activate, it unregisters itself and clears all caches
 * 4. Next navigation loads directly from the network (fresh content)
 */

const CACHE_NAME = 'yakeen-pwa-v1';

self.addEventListener('install', (event) => {
  // Immediately take control from the old SW
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clear all caches
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map((key) => caches.delete(key))
      );

      // Unregister this service worker completely
      await self.registration.unregister();

      // Claim all clients so they know to reload
      await self.clients.claim();
    })()
  );
});

// Intercept all requests — pass through directly to network
// (no caching, just transparent passthrough while unregistering)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
});
