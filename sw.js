const CACHE = 'deeponycap-v27';
const ASSETS = [
  './css/capricorn-core.css','./', './index.html', './landing.html', './presentation.html', './pitch.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png', './js/pony-db.js', './js/photo-store.js', './js/app.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
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
