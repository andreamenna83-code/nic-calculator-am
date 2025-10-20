const CACHE = 'nic-am-v62';
const ASSETS = [
  '/nic-calculator-am/',
  '/nic-calculator-am/index.html',
  '/nic-calculator-am/styles.css',
  '/nic-calculator-am/manifest.webmanifest',
  '/nic-calculator-am/icons/icon-192.png',
  '/nic-calculator-am/icons/icon-256.png',
  '/nic-calculator-am/icons/icon-384.png',
  '/nic-calculator-am/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/nic-calculator-am/index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
});