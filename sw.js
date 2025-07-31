self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('islamic-books-v1').then(cache => {
            return cache.addAll(['/', '/index.html', '/icon.png']);
        })
    );
});
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});