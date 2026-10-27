// يحفظ التطبيق ليعمل دون اتصال، ويجلب أحدث نسخة متى توفّر الاتصال.
const CACHE = "jabal-v11";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192-v2.png", "icon-512-v2.png", "apple-touch-icon-v2.png", "fonts/thmanyah-serif-text-regular.woff2", "art/bg-morning.webp", "art/bg-night.webp", "art/rider.webp"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); if (r.ok && new URL(e.request.url).origin === location.origin) caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match("index.html"))));
});
