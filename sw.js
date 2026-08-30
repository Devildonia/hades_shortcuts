// sw.js - Service Worker for HaDeS' Shortcuts PWA
// Estrategia: NETWORK-FIRST (siempre fresco) para código (HTML/CSS/JS) e imágenes,
// forzando la red con `cache: 'no-store'` para que NI un Ctrl+F5 devuelva assets
// caducos de la caché heurística del navegador (Brave la mantiene agresiva e
// ignora el Cache-Control). La caché del SW queda SOLO como respaldo offline.
// Fuentes: cache-first (inmutables, evitan re-descargarlas en cada carga).
// Bump de CACHE_VERSION invalida la caché anterior (assets viejos) al activar.
//
// NOTA (fix 2026-08): antes usaba `cache: 'reload'`, que revalida pero puede
// devolver el cuerpo de la caché HTTP local si el servidor contesta 304 (en
// Brave, con caché heurística, ese cuerpo era stale → página "antigua").
// `'no-store'` es el único modo que NUNCA lee/escribe la caché HTTP del
// navegador: garantiza una descarga completa (200) en cada carga.

const CACHE_VERSION = '1.2.0';
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
    //    `cache: 'no-store'` garantiza que NUNCA se lea la caché HTTP del navegador
    //    (ni siquiera revalidada/304), de modo que cada carga (F5 / Ctrl+F5 / nueva
    //    pestaña) obtiene la versión actual completa del servidor. La caché del SW
    //    solo se usa si la red falla (offline).
    //
    //    FIX Brave (2026-08): Brave mantiene su propia capa de red (Shields / Fast
    //    Browser) que ignora hasta `cache: 'no-store'` y usa la URL como clave de
    //    caché. Añadimos un query-string de cache-busting (`__v` = timestamp) a la
    //    petición REAL de red: la URL cambia en cada carga, así que esa caché no
    //    tiene nada que devolver. El resultado se sigue guardando bajo la URL
    //    original (`cache.put(req, ...)`) para que el respaldo offline no se rompa.
    //    (GitHub Pages y la mayoría de servidores ignoran la query en la ruta.)
    const bustUrl = new URL(req.url);
    bustUrl.searchParams.set('__v', Date.now().toString(36));
    e.respondWith(
        fetch(bustUrl.href, { cache: 'no-store' })
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
