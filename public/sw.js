const CACHE_NAME = 'çocuk-oyunu-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/main.ts',
    '/src/styles/main.css',
    '/assets/images/icons/icon.png',
    '/assets/images/categories/animals-icon.png',
    '/assets/images/categories/fruits-icon.png',
    '/assets/images/categories/vehicles-icon.png',
    '/assets/images/ads/banner_test.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
