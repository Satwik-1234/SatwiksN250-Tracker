/*
 * N250 Tracker service worker.
 *
 * Purpose: make the installed PWA behave like the live web app:
 *  - The app shell (HTML + JS chunks) always refreshes from the network when
 *    online, so a deployed update reaches the phone the next time it opens.
 *  - A cached copy is kept so the app still opens offline (latest known data
 *    + localStorage-based queue).
 *  - API responses are NEVER cached — reads/writes always hit the server.
 */

const CACHE_NAME = 'n250-static-v2';

self.addEventListener('install', () => {
  // Take over immediately instead of waiting for the old worker to die.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from old versions.
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // mutations always hit the network

  const url = new URL(req.url);

  // 1. API calls: network only, never cached.
  if (url.pathname.startsWith('/api/')) return;

  // 2. Navigations (HTML / app shell): network-first, cache fallback offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
    );
    return;
  }

  // 3. Static assets: cache-first (/_next/static files are content-hashed and
  //    immutable), falling back to the network and caching the result.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => hit || Response.error());
      })
    );
  }
});


// Phone alerts: the server sends a short JSON message; show it, and open the app when tapped.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    /* plain text or empty */
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Pulsar N250', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'n250',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const w of windows) {
        if ('focus' in w) return w.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
