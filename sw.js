// sw.js - Service Worker for HaDeS' Shortcuts PWA (Network-First with Offline Cache Fallback)

const CACHE_NAME = 'hades-shortcuts-v4-cache';
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './og-preview.png',
    './favicon.ico',
    './manifest.json',
    './js/bundle.js',
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
    // Network-first strategy: always get latest from server, fallback to cache if offline
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
