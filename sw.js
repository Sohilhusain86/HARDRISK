self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 1. ऐप बंद होने पर बैकग्राउंड पुश सिग्नल रिसीव करने का लिसनर
self.addEventListener('push', (event) => {
  let data = {
    title: 'Suhail AI',
    body: 'नया इल्मी नोटिस जारी हुआ है।'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: '/'
    },
    tag: 'suhail-live-push',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Suhail AI', options)
  );
});

// 2. नोटिफिकेशन पर टैप करने पर ऐप को खोलना
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
