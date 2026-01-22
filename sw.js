const CACHE_NAME = 'totp.codes-v1.7';
const FETCH_TIMEOUT = 5000; // 5 seconds

function fetchWithTimeout(request) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), FETCH_TIMEOUT)
    )
  ]);
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('/'))
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
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
  event.respondWith(
    fetchWithTimeout(event.request)
      .then((networkResponse) => {
        const cloned = networkResponse.clone();

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
        return caches.match(event.request).then((cachedResponse) => {
          if (!cachedResponse && event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return cachedResponse;
        });
      })
  );
});