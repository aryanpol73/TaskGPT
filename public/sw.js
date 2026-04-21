const CACHE_NAME = 'taskgpt-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clear old caches
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Never intercept OAuth/auth callback URLs - they must always hit the network
// and stay in the same browsing context so the auth session is preserved.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/~oauth') ||
    url.pathname.startsWith('/auth') ||
    url.search.includes('code=') ||
    url.hash.includes('access_token')
  ) {
    return; // let browser handle directly, no SW intervention
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'TaskGPT', body: 'You have a notification', icon: '/logo.png' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'taskgpt-notification',
      data: data.url || '/',
      actions: data.actions || [],
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
