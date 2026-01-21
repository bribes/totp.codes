const CACHE_NAME = 'totp.codes-v1.1';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Make this SW activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('/'))
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim(); // Take control of clients immediately
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  // Always try the network first
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const cloned = networkResponse.clone();

        // If it's a good response, cache it
        if (
          networkResponse &&
          (networkResponse.type === 'basic' || networkResponse.type === 'cors') &&
          networkResponse.status === 200
        ) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
        }

        return networkResponse;
      })
      .catch(() => {
        // If network fails, use cache
        return caches.match(event.request).then((cachedResponse) => {
          // For navigation fallback
          if (!cachedResponse && event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return cachedResponse;
        });
      })
  );
});
