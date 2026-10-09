// MontaPC shares its GitHub Pages origin with several other products.
// Cache only our published shell; never retain build links, session query URLs or external resources.
const CACHE = 'montapc-v3';
const ASSETS = [
  './', './index.html', './style.css', './app.js', './i18n.js',
  './supabase-config.js', './ads-config.js', './ads.js',
  './live-update.js', './catalog.snapshot.json', './pwa.js',
  './analytics.js', './manifest.webmanifest', './icon.svg'
];
const SCOPE = new URL(self.registration.scope);
const ASSET_PATHS = new Set(ASSETS.map(name => new URL(name, self.registration.scope).pathname));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('montapc-v') && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;

  const navigation = event.request.mode === 'navigate';
  const canCache = !url.search && ASSET_PATHS.has(url.pathname);
  if (!navigation && !canCache) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (canCache && response.ok && response.type === 'basic') {
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      if (canCache) {
        const cached = await cache.match(event.request);
        if (cached) return cached;
      }
      if (navigation) {
        const shellPath = ASSET_PATHS.has(url.pathname)
          ? url.pathname
          : new URL('./index.html', self.registration.scope).pathname;
        const shell = await cache.match(SCOPE.origin + shellPath);
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
});
