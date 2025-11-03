const CACHE_NAME = 'map-generator-cache-v1';
// Use root-relative paths
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/components/Controls.tsx',
  '/components/EditorCanvas.tsx',
  '/types.ts',
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
      return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
        // Cache hit - return response
        if (response) {
            return response;
        }

        // Clone the request to fetch and cache it
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200) {
                return networkResponse;
            }
            
            // Only cache responses from http/https protocols.
            // This is to avoid caching chrome-extension:// requests etc.
            if(!event.request.url.startsWith('http')) {
                return networkResponse;
            }

            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
            });

            return networkResponse;
        });
    })
  );
});
