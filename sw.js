// sw.js - Service Worker for HaDeS' Shortcuts PWA
// Estrategia: NETWORK-FIRST (siempre fresco) para código (HTML/CSS/JS) e imágenes,
// forzando la red con `cache: 'reload'` para que ni un Ctrl+F5 devuelva assets
// caducos de la caché heurística del navegador (python http.server solo envía
// Last-Modified). La caché del SW queda SOLO como respaldo offline.
// Fuentes: cache-first (inmutables, evitan re-descargarlas en cada carga).
// Bump de CACHE_VERSION invalida la caché anterior (assets viejos) al activar.

const CACHE_VERSION = '1.1.0';
const CACHE_NAME = `hades-shortcuts-v${CACHE_VERSION}`;
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
    const req = e.request;
    if (req.method !== 'GET') return; // Solo GET es cachable/servible.

    let url;
    try { url = new URL(req.url); } catch { return; }
    if (url.origin !== self.location.origin) return; // Terceros: deja fluir (no cachear APIs).

    // 1) Fuentes: cache-first con revalidación en 2º plano (inmutables).
    if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url.pathname + url.search)) {
        e.respondWith(
            caches.match(req).then((hit) => hit || fetch(req).then((res) => {
                if (res && res.status === 200) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
                }
                return res;
            }))
        );
        return;
    }

    const isImage =
        url.pathname.includes('/iconos/') ||
        url.pathname.endsWith('.ico') ||
        /\.(webp|png|jpe?g|gif|svg)(\?|$)/i.test(url.pathname + url.search);

    // 2) Código (HTML/CSS/JS) + imágenes: NETWORK-FIRST forzado a red.
    //    `cache: 'reload'` obliga a no leer de la caché HTTP del navegador, de modo
    //    que cada carga (F5 / Ctrl+F5) obtiene la versión actual del servidor.
    //    La caché del SW solo se usa si la red falla (offline).
    e.respondWith(
        fetch(req, { cache: 'reload' })
            .then((res) => {
                if (res && res.status === 200) {
                    const cloneA = res.clone();
                    const cloneB = res.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(req, cloneA);
                        if (url.search) cache.put(url.href, cloneB);
                    });
                }
                return res;
            })
            .catch(() => matchIgnoringSearch(req).then((hit) => {
                if (hit) return hit;
                if (isImage) {
                    return new Response(FALLBACK_ICON_SVG, {
                        status: 200,
                        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' }
                    });
                }
                return new Response('Offline', { status: 503, statusText: 'Offline' });
            }))
    );
});
