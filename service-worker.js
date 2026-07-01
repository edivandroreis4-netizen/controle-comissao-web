const CACHE_VERSION = "comissao-v10-perfil-vendedor";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./offline.html",
  "./assets/edivandro-lima.jpg",
  "./assets/foto-vendedor-padrao.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-icon-512.png"
];

const EXTERNAL_ASSETS = [
  "https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css",
  "https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js",
  "https://cdn.jsdelivr.net/npm/sweetalert2@11.15.10/dist/sweetalert2.all.min.js",
  "https://cdn.jsdelivr.net/npm/dayjs@1.11.13/dayjs.min.js",
  "https://cdn.jsdelivr.net/npm/dayjs@1.11.13/locale/pt-br.js",
  "https://cdn.jsdelivr.net/npm/zod@3.24.2/lib/index.umd.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      await Promise.allSettled(
        EXTERNAL_ASSETS.map(async (url) => {
          const resposta = await fetch(url, { mode: "cors" });
          if (resposta.ok) await cache.put(url, resposta);
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () =>
          (await caches.match(request)) || caches.match("./offline.html")
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (!response || (response.status !== 200 && response.type !== "opaque")) {
          return response;
        }

        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
