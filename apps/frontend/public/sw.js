const CACHE_NAME = 'fwaya-v1';
const OFFLINE_CACHE = 'fwaya-offline-v1';
const DOWNLOAD_CACHE = 'fwaya-downloads-v1';

const urlsToCache = [
  '/',
  '/download',
  '/offline',
  '/manifest.json',
  '/default-cover.jpg',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('Some URLs failed to cache:', err);
        return cache.addAll(urlsToCache.filter(url => url !== '/' && url !== '/offline'));
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== OFFLINE_CACHE && name !== DOWNLOAD_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, then cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external domains
  if (url.origin !== self.location.origin) {
    return;
  }

  // For downloads page and offline page, prioritize cache
  if (url.pathname === '/download' || url.pathname === '/offline') {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request)
            .then((response) => {
              const clonedResponse = response.clone();
              caches.open(OFFLINE_CACHE).then((cache) => {
                cache.put(request, clonedResponse);
              });
              return response;
            })
            .catch(() => {
              return caches.match('/offline') || new Response('Offline');
            })
        );
      })
    );
    return;
  }

  // Network first strategy for API calls
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request) || new Response(JSON.stringify({ error: 'Offline' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // Cache first for static assets
  if (
    request.url.includes('.js') ||
    request.url.includes('.css') ||
    request.url.includes('.svg') ||
    request.url.includes('.png') ||
    request.url.includes('.jpg') ||
    request.url.includes('.woff')
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((response) => {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
            return response;
          })
        );
      })
    );
    return;
  }

  // Default: network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request) || new Response('Offline');
      })
  );
});

// Message handler for cache management from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
