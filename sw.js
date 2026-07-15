/* Service Worker – Campus Informativo 2do Semestre */
const CACHE_NAME = 'campus-2do-v3';

// Rutas relativas al scope del SW (funciona tanto en la raíz de un dominio
// como en un project site de GitHub Pages, ej: usuario.github.io/horariocentro/)
const ASSETS_ESTATICOS = [
  './',
  './index.html',
  './css/main.css',
  './js/app.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
];

// Archivos de datos: siempre network-first (nunca del caché viejo)
const DATOS_DINAMICOS = [
  '/data/2do.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(ASSETS_ESTATICOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Network-first para datos dinámicos (JSON del campus)
  const esDato = DATOS_DINAMICOS.some(p => url.pathname.includes(p)) ||
                 url.searchParams.has('_v'); // cache-busting param

  if (esDato) {
    e.respondWith(
      fetch(e.request)
        .catch(() => caches.match('/data/2do.json')) // fallback offline
    );
    return;
  }

  // Cache-first para estáticos
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
