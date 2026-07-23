// ============================================================
// HorarioCentro — Service Worker
// Versión: portal-v2026-07-23-1
// Estrategia: network-first para HTML, cache-first para assets
// ============================================================

const CACHE_NAME = 'portal-v2026-07-23-1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './img/icon-192.png',
  './img/icon-512.png'
];

// ── INSTALL: pre-cachea assets estáticos y activa inmediatamente ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // toma control sin esperar que se cierren pestañas
});

// ── ACTIVATE: elimina cachés viejos y reclama clientes ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim(); // controla todas las pestañas abiertas de inmediato
});

// ── FETCH: estrategia según tipo de recurso ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar peticiones del mismo origen
  if (url.origin !== location.origin) return;

  const isNavigation =
    request.mode === 'navigate' ||
    request.headers.get('accept')?.includes('text/html');

  if (isNavigation) {
    // Network-first para HTML: siempre intenta la red primero
    event.respondWith(
      fetch(request)
        .then(response => {
          // Actualiza la caché con la respuesta fresca
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Solo cae a caché si la red falla (offline)
          return caches.match(request).then(cached => {
            return cached || caches.match('./index.html');
          });
        })
    );
  } else {
    // Cache-first para assets estáticos (CSS, JS, imágenes)
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
  }
});
