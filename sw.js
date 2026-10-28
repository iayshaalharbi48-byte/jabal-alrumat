// يحفظ التطبيق ليعمل دون اتصال، ويجلب أحدث نسخة متى توفّر الاتصال.
const CACHE = "jabal-v22";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192-v4.png", "icon-512-v4.png", "apple-touch-icon-v4.png", "art/mist-day.webp", "art/mist-night.webp"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); if (r.ok && new URL(e.request.url).origin === location.origin) caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match("index.html"))));
});
// تنبيهات التطبيق: تصل من المهامّ المجدولة على GitHub بمفاتيح VAPID
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "جبل الرماة", {
    body: d.body || "", tag: d.tag || "jabal", icon: "icon-192-v4.png", badge: "icon-192-v4.png",
    lang: "ar", dir: "rtl", data: { url: d.url || "./#today" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./#today", self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if ("focus" in w) { w.navigate ? w.navigate(url).catch(() => {}) : 0; return w.focus(); } }
    return clients.openWindow(url);
  }));
});
