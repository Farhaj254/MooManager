
// Basic service worker

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Optionally, pre-cache assets here
  // event.waitUntil(
  //   caches.open('moo-manager-cache-v1').then((cache) => {
  //     return cache.addAll([
  //       '/',
  //       // Add other important assets to cache initially
  //     ]);
  //   })
  // );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Optionally, clean up old caches here
  // event.waitUntil(
  //   caches.keys().then((cacheNames) => {
  //     return Promise.all(
  //       cacheNames.map((cacheName) => {
  //         if (cacheName !== 'moo-manager-cache-v1') {
  //           return caches.delete(cacheName);
  //         }
  //       })
  //     );
  //   })
  // );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // console.log('Service Worker: Fetching', event.request.url);
  // Basic cache-first strategy (example)
  // event.respondWith(
  //   caches.match(event.request).then((response) => {
  //     return response || fetch(event.request);
  //   })
  // );
});
