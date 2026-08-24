// sw.js - Service Worker for HaDeS' Shortcuts PWA

const CACHE_NAME = 'hades-shortcuts-v2-cache';
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './favicon.ico',
    './manifest.json',
    './js/app.js',
    './js/state.js',
    './js/i18n.js',
    './js/weather.js',
    './js/search.js',
    './js/render.js',
    './js/dragdrop.js',
    './js/shortcut-manager.js',
    './js/backup.js',
    './js/settings.js',
    './js/audio.js',
    './js/bangs.js',
    './js/widgets.js',
    './js/theme-studio.js',
    './js/importer.js',
    './locales/es.json',
    './locales/en.json',
    './locales/fr.json',
    './locales/de.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(() => {});
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Cache-first strategy for static assets
    e.respondWith(
        caches.match(e.request).then((cached) => {
            if (cached) return cached;
            return fetch(e.request).then((res) => {
                return res;
            }).catch(() => {
                return cached;
            });
        })
    );
});
