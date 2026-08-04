// ============================================================
// Campus Informativo — Service Worker
// Versión: portal-v2026-08-04-2
// Estrategia: network-first para HTML/CSS/JS, cache-first para imágenes
// El CACHE_NAME debe actualizarse con cada deploy para forzar refresh.
// ============================================================

const CACHE_NAME = 'portal-v2026-08-04-2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './js/app.js',
  './img/icon-192.png',
  './img/icon-512.png'
];

// ── INSTALL: precachea assets y activa inmediatamente ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); // activa este SW aunque haya uno anterior corriendo
});

// ── ACTIVATE: borra caches viejos y toma control de todos los clientes ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()) // toma control inmediato de todas las pestañas abiertas
  );
});

// ── MESSAGE: el cliente puede pedir skipWaiting manualmente ──
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── FETCH ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar peticiones del mismo origen
  if (url.origin !== location.origin) return;

  const isNavigation = request.mode === 'navigate' ||
    request.headers.get('accept')?.includes('text/html');

  // CSS y JS: siempre network-first para recibir actualizaciones
  const isCriticalAsset = url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js');

  if (isNavigation || isCriticalAsset) {
    // Network-first: intenta red, si falla usa cache
    event.respondWith(
      fetch(request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() =>
        caches.match(request).then(cached => cached || caches.match('./index.html'))
      )
    );
  } else {
    // Cache-first para imágenes y otros assets estáticos
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});
