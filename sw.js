const CACHE_NAME = 'jamia-pwa-v3';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // क्रोम PWA इंस्टॉलेशन के लिए फ़ेच हैंडलर का होना ज़रूरी है
  e.respondWith(
    fetch(e.request).catch(() => new Response("Offline"))
  );
});
