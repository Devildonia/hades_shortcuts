// sw.js - Service Worker for HaDeS' Shortcuts PWA (Network-First with Offline Cache & Stale-While-Revalidate Icons)

const CACHE_NAME = 'hades-shortcuts-v1.0.0-cache';
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './og-preview.png',
    './favicon.ico',
    './site.webmanifest',
    './js/app.js',
    './js/state.js',
    './js/i18n.js',
    './js/audio.js',
    './js/ambient-audio.js',
    './js/weather.js',
    './js/search.js',
    './js/render.js',
    './js/dragdrop.js',
    './js/layout.js',
    './js/shortcut-manager.js',
    './js/backup.js',
    './js/settings.js',
    './js/widgets.js',
    './js/postits.js',
    './js/theme-studio.js',
    './js/importer.js',
    './js/devtools.js',
    './js/qrcode.js',
    './js/crypto-sync.js',
    './js/aurora-canvas.js',
    './js/radial-hud.js',
    './js/solar-engine.js',
    './js/telemetry.js',
    './js/tech-radar.js',
    './js/neural-search.js',
    './js/extension-api.js',
    './js/platform.js',
    './js/personal-analytics.js',
    './js/spaces.js',
    './js/macros.js',
    './js/ai-agent.js',
    './js/calendar-agenda.js',
    './js/tags-filter.js',
    './js/focus-mode.js',
    './js/bangs.js',
    './iconos/pwa-192.png',
    './iconos/pwa-512.png',
    './locales/es.json',
    './locales/en.json',
    './locales/fr.json',
    './locales/de.json',
    './fonts/outfit-latin-400-normal.woff2',
    './fonts/outfit-latin-600-normal.woff2',
    './fonts/outfit-latin-700-normal.woff2',
    './fonts/audiowide-latin-400-normal.woff2',
    './fonts/plus-jakarta-sans-latin-400-normal.woff2',
    './fonts/plus-jakarta-sans-latin-600-normal.woff2',
    './fonts/plus-jakarta-sans-latin-700-normal.woff2',
    './fonts/jetbrains-mono-latin-400-normal.woff2',
    './fonts/jetbrains-mono-latin-500-normal.woff2'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(() =>
                Promise.all(STATIC_ASSETS.map((url) => cache.add(url).catch(() => undefined)))
            );
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

function matchIgnoringSearch(request) {
    return caches.match(request).then((hit) => {
        if (hit) return hit;
        const url = new URL(request.url);
        if (!url.search) return undefined;
        url.search = '';
        return caches.match(url.href);
    });
}

const FALLBACK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#00f2fe" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="4" fill="#0f172a"/><circle cx="12" cy="12" r="4" fill="#00f2fe"/></svg>`;

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    if (url.pathname.includes('/iconos/') || url.pathname.endsWith('.webp') || url.pathname.endsWith('.png') || url.pathname.endsWith('.ico')) {
        e.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(e.request).then((cachedResponse) => {
                    const fetchPromise = fetch(e.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(e.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        return cachedResponse || new Response(FALLBACK_ICON_SVG, {
                            status: 200,
                            headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' }
                        });
                    });
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    e.respondWith(
        fetch(e.request)
            .then((res) => {
                if (res && res.status === 200 && e.request.method === 'GET') {
                    // Solo cachear same-origin (evita cachear APIs de terceros)
                    const reqUrl = new URL(e.request.url);
                    const isSameOrigin = reqUrl.origin === self.location.origin;
                    if (isSameOrigin) {
                        const cloneA = res.clone();
                        const cloneB = res.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(e.request, cloneA);
                            if (reqUrl.search) cache.put(reqUrl.href, cloneB);
                        });
                    }
                }
                return res;
            })
            .catch(() => matchIgnoringSearch(e.request))
    );
});
