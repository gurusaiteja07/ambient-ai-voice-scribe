const CACHE_NAME = "voice-scribe-v1";
const ASSETS = [
  "/mobile/index.html",
  "/mobile/style.css",
  "/mobile/app.js",
  "/mobile/manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
