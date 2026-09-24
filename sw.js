const CACHE_NAME = 'potraviny-v4';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/db.js',
  './js/ai.js',
  './js/zones.js',
  './js/shopping.js',
  './js/items.js',
  './js/scanner.js',
  './js/voice.js',
  './js/recipes.js',
  './js/sync.js',
  './js/notifications.js',
  './js/waste.js',
  './js/prices.js',
  './js/unpack.js',
  './js/chat.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-512.svg'
];

const CDN_ASSETS = [
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache local assets first (must succeed)
        return cache.addAll(ASSETS_TO_CACHE)
          .then(() => {
            // Try to cache CDN assets (optional, don't fail install if CDN is down)
            return Promise.allSettled(
              CDN_ASSETS.map(url => 
                fetch(url).then(response => {
                  if (response.ok) {
                    return cache.put(url, response);
                  }
                }).catch(() => {})
              )
            );
          });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // API calls (Open Food Facts, Google Sheets, OpenAI) — network only
  if (url.hostname.includes('openfoodfacts.org') || 
      url.hostname.includes('googleapis.com') || 
      url.hostname.includes('openai.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Static assets — stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Potraviny', body: 'Zkontrolujte své zásoby!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: './icons/icon-512.svg',
    badge: './icons/icon-512.svg',
    vibrate: [200, 100, 200],
    tag: data.tag || 'potraviny-notification',
    renotify: true,
    data: {
      url: data.url || './',
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open', title: 'Otevřít' },
      { action: 'dismiss', title: 'Zavřít' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-items') {
    event.waitUntil(
      // Notify clients to trigger sync
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_REQUIRED' });
        });
      })
    );
  }
});
