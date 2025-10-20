self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('nic-am-v1').then(cache => cache.addAll([
      './',
      './index.html',
      './app.js',
      './styles.css',
      './manifest.webmanifest',
      './icons/icon-192.png',
      './icons/icon-512.png'
    ]))
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});