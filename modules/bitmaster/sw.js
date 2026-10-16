const CACHE_NAME = 'bitmaster-v2.8.8';
const STATIC_ASSETS = [
  './',
  './style.css',
  './style.css?v=2.8.8',
  './app.js',
  './app.js?v=2.8.8',
  './manifest.json',
  '../../shared/styles.css',
  '../../shared/styles.css?v=2.8.8',
  '../../shared/nav.js',
  '../../shared/nav.js?v=2.8.8',
  '../../favicon.svg',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // 1. Pre-fetch and cache the canonical HTML document for both './' and './index.html'
      try {
        const htmlResp = await fetch('./', { cache: 'no-cache' });
        if (htmlResp && htmlResp.status === 200) {
          await cache.put('./', htmlResp.clone());
          await cache.put('./index.html', htmlResp.clone());
        }
      } catch (err) {
        console.warn('BitMaster SW: Failed to pre-cache main HTML document:', err);
      }

      // 2. Cache remaining static subresources safely without failing the whole installation
      await Promise.allSettled(
        STATIC_ASSETS.filter((url) => url !== './').map(async (url) => {
          try {
            const resp = await fetch(url);
            if (resp && resp.status === 200) {
              await cache.put(url, resp);
            }
          } catch (e) {
            console.warn('BitMaster SW: Could not pre-cache asset:', url, e);
          }
        })
      );
    })().then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle standard GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // 1. Navigation requests (Page load / PWA launch / cold start)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        // Try cache first for instant launch and offline support
        const cached =
          (await cache.match('./')) ||
          (await cache.match('./index.html')) ||
          (await cache.match(event.request));

        if (cached) {
          // Revalidate in background when online to update cached assets
          fetch('./', { cache: 'no-cache' })
            .then((fresh) => {
              if (fresh && fresh.status === 200) {
                cache.put('./', fresh.clone());
                cache.put('./index.html', fresh.clone());
              }
            })
            .catch(() => {});
          return cached;
        }

        // Not in cache: fetch from network
        try {
          const netResp = await fetch(event.request);
          if (netResp && netResp.status === 200) {
            cache.put('./', netResp.clone());
            cache.put('./index.html', netResp.clone());
          }
          return netResp;
        } catch (err) {
          // Fallback if offline
          const fallback = (await cache.match('./')) || (await cache.match('./index.html'));
          if (fallback) return fallback;
          return new Response(
            '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>BitMaster Offline</title></head><body style="background:#070b14;color:#f8fafc;font-family:sans-serif;text-align:center;padding:40px 20px;"><h2>BitMaster is currently offline</h2><p>Please connect to the internet to load the app for the first time.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
          );
        }
      })()
    );
    return;
  }

  // 2. Subresources (CSS, JS, Fonts, Images)
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);

      if (cached) {
        // Stale-while-revalidate in background
        fetch(event.request)
          .then((fresh) => {
            if (fresh && fresh.status === 200 && (fresh.type === 'basic' || fresh.type === 'cors')) {
              cache.put(event.request, fresh);
            }
          })
          .catch(() => {});
        return cached;
      }

      try {
        const netResp = await fetch(event.request);
        if (netResp && netResp.status === 200 && (netResp.type === 'basic' || netResp.type === 'cors')) {
          cache.put(event.request, netResp.clone());
        }
        return netResp;
      } catch (err) {
        return new Response('', { status: 408, statusText: 'Offline Asset Unavailable' });
      }
    })()
  );
});
