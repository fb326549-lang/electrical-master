const CACHE_NAME = "electrical-master-v1";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon.svg"];
const CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    try { await cache.add(CDN); } catch (e) {}
    self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin || req.url === CDN) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const response = await fetch(req);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, response.clone());
        }
        return response;
      } catch (e) {
        return cached || Response.error();
      }
    })());
  }
});