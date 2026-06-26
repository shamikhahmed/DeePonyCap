importScripts('./js/version.js');

const CACHE = self.SW_CACHE || 'deeponycap-v41';
const ASSETS = [
  './css/app.css', './css/capricorn-core.css', './css/identity.css',
  './', './index.html', './landing.html', './presentation.html', './pitch.html',
  './manifest.json', './icon.svg', './icon-192.png', './icon-512.png', './icon-1024.png',
  './js/version.js', './js/data-store.js', './js/migrations.js', './js/collector-suite.js', './js/pony-db.js', './js/photo-store.js',
  './js/app.js', './js/excellence.js', './js/app-update.js',
  './js/capricorn-motion.js',
  './js/capricorn-premium-nav.js',
  './js/capricorn-cinematic.js',
  './js/capricorn-deck.js',
  './js/capricorn-deck-pro.js',
  './js/capricorn-pitch.js',
  './js/vendor/gsap.min.js',
  './js/vendor/ScrollTrigger.min.js',
  './privacy.html',
  './changelog.html',
  './VERSION.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).catch(() => caches.match('./index.html'))
    )
  );
});
