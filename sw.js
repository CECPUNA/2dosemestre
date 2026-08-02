// ============================================================
// HorarioCentro — Service Worker
// Versión: portal-v2026-08-02-2
// Estrategia: network-first para HTML, cache-first para assets
// ============================================================

const CACHE_NAME = 'portal-v2026-08-02-2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './js/app.js',
  './img/icon-192.png',
  './img/icon-512.png'
];

// ── INSTALL ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── ACTIVATE ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  const isNavigation = request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
  if (isNavigation) {
    event.respondWith(
      fetch(request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }).catch(() =>
        caches.match(request).then(cached => cached || caches.match('./index.html'))
      )
    );
  } else {
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

// ── PUSH: recibir notificaciones de OneSignal ──
self.addEventListener('push', event => {
  let data = { title: 'Info 2do', body: 'Tenés un nuevo aviso.' };
  try {
    const parsed = event.data?.json();
    if (parsed?.headings?.es) data.title = parsed.headings.es;
    else if (parsed?.title) data.title = parsed.title;
    if (parsed?.contents?.es) data.body = parsed.contents.es;
    else if (parsed?.body) data.body = parsed.body;
    if (parsed?.url) data.url = parsed.url;
  } catch(e) {
    data.body = event.data?.text() || data.body;
  }
  const options = {
    body: data.body,
    icon: './img/icon-192.png',
    badge: './img/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || 'https://cecpuna.github.io/2dosemestre/' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ── NOTIFICATION CLICK: abrir/enfocar la app ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || 'https://cecpuna.github.io/2dosemestre/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === target && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
