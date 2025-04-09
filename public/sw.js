const CACHE_NAME = 'vision-voice-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/public/css/style.css',
    '/public/js/script.js',
    '/public/js/gestures.js',
    '/public/js/speechSynthesis.js',
    '/public/js/speechRecognition.js',
    '/public/images/hand.svg',
    '/public/images/swipe-horizontal.svg',
    '/public/images/swipe-vertical.svg',
    '/public/sounds/notification.mp3'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
}); 