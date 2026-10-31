// EnFormaFit Service Worker — modo avión
// Versión del cache (cambiar para forzar actualización)
const CACHE_NAME = 'ef-v20261031b';
// Solo cacheamos index.html — los JS/CSS se cachean dinámicamente con sus ?v= params
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// ── INSTALL: pre-cachear assets estáticos ───────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cachear con versión actual (los ?v= params se incluyen en la URL real)
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] No se pudo pre-cachear:', err);
      });
    })
  );
});

// ── ACTIVATE: limpiar caches viejos ─────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: estrategia por tipo de request ───────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // No interceptar peticiones a la API de Railway
  if (url.hostname.includes('railway.app') || url.hostname.includes('railway')) {
    // Network-first para API: intentar red, si falla devolver error offline
    e.respondWith(
      fetch(e.request.clone()).catch(() => {
        return new Response(
          JSON.stringify({ error: 'sin_conexion', offline: true }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Para assets de la propia app: cache-first con fallback a red
  if (e.request.method === 'GET') {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;

        return fetch(e.request.clone()).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        }).catch(() => {
          // Si falla y es HTML, devolver index.html cacheado
          if (e.request.destination === 'document') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
    );
  }
});

// ── MENSAJE: para comunicarse con la app ────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
