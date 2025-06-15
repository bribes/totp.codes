const CACHE_NAME = 'v1';

// Install phase: optional, just cache index.html to ensure initial offline
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('/'))
  );
});

// Activate: clean up old caches (optional best practice)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }))
    )
  );
});

// Fetch handler: dynamic caching
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        const clonedResponse = networkResponse.clone();
        const validResponse =
          networkResponse &&
          (networkResponse.type === 'basic' || networkResponse.type === 'cors') &&
          networkResponse.status === 200;

        if (validResponse) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
        }

        return networkResponse;
      }).catch(() => {
        // fallback for navigation (e.g. offline reload)
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
