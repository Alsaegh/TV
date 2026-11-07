/* TV Remote – service worker (network-first).
   index.html registers it only on https copies of the page and never while redirecting.
   It touches only this site's own files: TV traffic (other hosts/ports) is never intercepted.
   The version comes from the registration URL (sw.js?v=<CFG.VERSION>), so bumping CFG.VERSION
   in index.html also replaces this worker and its cache. */
'use strict';

var VERSION = (function () {
  var m = /[?&]v=([^&]+)/.exec(self.location.search);
  return m ? decodeURIComponent(m[1]) : '0';
})();
var CACHE = 'tv-remote-' + VERSION;
var CORE = [
  './', './index.html', './qr-poster.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // add files one by one so a single missing file can't break installation
      return Promise.all(CORE.map(function (url) { return cache.add(url).catch(function () { /* ignore */ }); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('tv-remote-') === 0 && k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request, url;
  if (req.method !== 'GET') return;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;            // never touch the TV or other hosts
  var isPage = req.mode === 'navigate';
  var key = isPage ? url.origin + url.pathname : req;         // one cached copy per page, whatever ?ip= says

  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok && res.type === 'basic') {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { return cache.put(key, copy); }).catch(function () { /* ignore */ });
      }
      return res;
    }).catch(function () {
      return caches.match(key).then(function (hit) {
        if (hit) return hit;
        if (isPage) {
          return caches.match('./index.html').then(function (page) { return page || Response.error(); });
        }
        return Response.error();
      });
    })
  );
});
