// BibliApp service worker (web / installed web app only; never registered in the native app).
// BUILD is stamped by scripts/pwa-precache.mjs after each build, so a new deploy installs a
// new worker and refreshes the cache.
const BUILD = '__BUILD__';
const CACHE = `bibliapp-${BUILD}`;

// Large files that are fetched on demand instead of at install time.
// Original photo folders (hero, moods) are not loaded; their optimized copies live in photos/.
const SKIP_PRECACHE = [
  // Mood photos (photos/mood-*) are precached: the Ánimo tiles show them.
  /^assets\/churches\//, /^assets\/photos\/verse-/, /^assets\/hero\//,
  /^assets\/moods\/.*\.(jpe?g|png)$/i, /^assets\/icon\//,
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(['./', 'index.html']);
    try {
      const res = await fetch('files.json', { cache: 'no-store' });
      const files = (await res.json()).filter((f) => !SKIP_PRECACHE.some((re) => re.test(f)));
      // One failed file must not abort the whole install.
      await Promise.allSettled(files.map((f) => cache.add(f)));
    } catch {
      // No file list (e.g. local dev build): runtime caching still works.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('bibliapp-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // maps, geocoding: always network

  // Pages: network first, so a new deploy shows up immediately; cache when offline.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put('index.html', res.clone());
        return res;
      } catch {
        return (await caches.match('index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Everything else: cache first, refresh in the background.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => undefined);
    if (cached) {
      event.waitUntil(network);
      return cached;
    }
    return (await network) || Response.error();
  })());
});
