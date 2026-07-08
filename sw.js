// Service worker do Painel de Sistemas
// Estratégia: network-first para o HTML (sempre tenta buscar a versão mais nova
// e os dados do Firebase em tempo real), com fallback para cache quando offline.

const CACHE_NAME = 'painel-sistemas-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon-16x16.png',
  './favicon-32x32.png',
  './favicon.ico',
  './apple-touch-icon.png',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Não interceptar chamadas ao Firebase (precisam sempre ir para a rede,
  // senão o painel para de atualizar em tempo real).
  if (req.url.includes('firebaseio.com') || req.url.includes('firebase') || req.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
