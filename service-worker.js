const CACHE_VERSION = "controle-comissao-pwa-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./offline.html",
  "./assets/edivandro-lima.jpg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-icon-512.png",
  "https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css",
  "https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
      return response;
    }).catch(async () => (await caches.match(request)) || caches.match("./offline.html")));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (!response || (response.status !== 200 && response.type !== "opaque")) return response;
      const copy = response.clone();
      caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
      return response;
    });
  }));
});
