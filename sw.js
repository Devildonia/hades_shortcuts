// sw.js - Service Worker for HaDeS' Shortcuts PWA (Network-First with Offline Cache & Stale-While-Revalidate Icons)

const CACHE_NAME = 'hades-shortcuts-v6-0-cache';
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './og-preview.png',
    './favicon.ico',
    './site.webmanifest',
    './manifest.json',
    './js/app.js',
    './iconos/pwa-192.png',
    './iconos/pwa-512.png',
    './locales/es.json',
    './locales/en.json',
    './locales/fr.json',
    './locales/de.json'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(() => {});
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((k) => {
                    if (k !== CACHE_NAME) {
                        return caches.delete(k);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Stale-While-Revalidate strategy for icons (.webp, .png, .ico, /iconos/)
    if (url.pathname.includes('/iconos/') || url.pathname.endsWith('.webp') || url.pathname.endsWith('.png') || url.pathname.endsWith('.ico')) {
        e.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(e.request).then((cachedResponse) => {
                    const fetchPromise = fetch(e.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(e.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => cachedResponse);
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // Network-First strategy for core app files
    e.respondWith(
        fetch(e.request)
            .then((res) => {
                if (res && res.status === 200 && e.request.method === 'GET') {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                }
                return res;
            })
            .catch(() => caches.match(e.request))
    );
});
