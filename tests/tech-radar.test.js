// tests/tech-radar.test.js — Regresión de race-condition entre canales (bug silencioso #5) + escape XSS.
import { test, expect } from './harness.js';
import { TechRadarEngine } from '../js/tech-radar.js';
import { state, safeHttpUrl } from '../js/state.js';
import { getTranslation } from '../js/i18n.js';

const XML_A = '<?xml version="1.0"?><rss version="2.0"><channel>' +
    '<item><title>ARTICULO_A</title><link>https://a.example.com/1</link><pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate></item>' +
    '</channel></rss>';

const XML_B = '<?xml version="1.0"?><rss version="2.0"><channel>' +
    '<item><title>ARTICULO_B</title><link>https://b.example.com/1</link><pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate></item>' +
    '</channel></rss>';

function mockFetchWithDelays(map) {
    const orig = window.fetch;
    window.fetch = (url) => new Promise((resolve) => {
        const entry = map[String(url)];
        if (!entry) {
            resolve(new Response('not found', { status: 404 }));
            return;
        }
        setTimeout(() => resolve(new Response(entry.body, { status: 200, headers: { 'Content-Type': 'application/xml' } })), entry.delay);
    });
    return () => { window.fetch = orig; };
}

test('radar: canal rápido gana a uno lento pendiente (regresión de race-condition)', async () => {
    const restore = mockFetchWithDelays({
        'https://slow.example.com/feed.xml': { body: XML_A, delay: 150 },
        'https://fast.example.com/feed.xml': { body: XML_B, delay: 20 }
    });
    try {
        const engine = new TechRadarEngine();
        engine.feeds = [
            { id: 'slowfeed', name: 'Slow Feed', url: 'https://slow.example.com/feed.xml' },
            { id: 'fastfeed', name: 'Fast Feed', url: 'https://fast.example.com/feed.xml' }
        ];

        engine.activeFeedId = 'slowfeed';
        const p1 = engine.loadAndRender(true); // fetch lento arranca
        engine.activeFeedId = 'fastfeed';     // el usuario cambia de canal…
        const p2 = engine.loadAndRender(true); // …y el rápido arranca
        await Promise.all([p1, p2]);

        const html = document.getElementById('tech-radar-list').innerHTML;
        expect(html).toContain('ARTICULO_B');
        expect(html).not.toContain('ARTICULO_A'); // ← sin la guardia de token, A pisaba a B
    } finally {
        restore();
    }
});

test('radar: títulos maliciosos se renderizan escapados (XSS)', async () => {
    const malicious = '<img src=x onerror=alert(1)>';
    // Un feed RSS real lleva el título escapado dentro del XML
    const xml = '<?xml version="1.0"?><rss version="2.0"><channel>' +
        `<item><title>&lt;img src=x onerror=alert(1)&gt;</title><link>https://x.example.com</link></item>` +
        '</channel></rss>';

    const restore = mockFetchWithDelays({
        'https://fast.example.com/feed.xml': { body: xml, delay: 10 }
    });
    try {
        const engine = new TechRadarEngine();
        engine.feeds = [{ id: 'fastfeed', name: 'Fast Feed', url: 'https://fast.example.com/feed.xml' }];
        engine.activeFeedId = 'fastfeed';
        await engine.loadAndRender(true);

        const listEl = document.getElementById('tech-radar-list');
        expect(listEl.innerHTML).not.toContain('<img');
        expect(listEl.innerHTML).toContain('&lt;img');
        // El título debe estar en texto plano, no como HTML
        expect(listEl.querySelector('.radar-title').textContent).toBe(malicious);
    } finally {
        restore();
    }
});

test('radar: feed caído → artículos de fallback (no pantalla vacía)', async () => {
    const restore = mockFetchWithDelays({
        'https://down.example.com/feed.xml': { body: 'no xml', delay: 10 }
    });
    // Determinista: el texto del fallback se aserta en español
    const prevLang = state.language;
    state.setLanguage('es');
    try {
        const engine = new TechRadarEngine();
        engine.feeds = [{ id: 'downfeed', name: 'Down Feed', url: 'https://down.example.com/feed.xml' }];
        engine.activeFeedId = 'downfeed';
        await engine.loadAndRender(true);

        const listEl = document.getElementById('tech-radar-list');
        // 'no xml' no parsea como RSS/Atom → getFallbackArticles (texto i18n, sin hardcode)
        expect(listEl.querySelector('.radar-item')).toBeTruthy();
        expect(listEl.innerHTML).toContain(getTranslation('tech_radar.fallback_offline', 'es'));
        expect(listEl.innerHTML).not.toContain('🔄'); // sin emoji (norma anti-AI-slop)
    } finally {
        state.setLanguage(prevLang);
        restore();
    }
});

test('radar: el icono del feed se conserva al recargar (no se pisa a vacío)', () => {
    localStorage.setItem('hades_custom_rss_feeds_v1', JSON.stringify([
        { id: 'hackernews', name: 'HackerNews', url: 'https://news.ycombinator.com/rss' },
        { id: 'rss_1', name: 'Mi Blog', icon: '📰', url: 'https://blog.example.com/feed' }
    ]));

    const engine = new TechRadarEngine();
    const mine = engine.feeds.find(f => f.id === 'rss_1');
    expect(mine.icon).toBe('📰'); // ← antes: loadFeeds() sobreescribía icon a ''
});

test('radar: el icono se renderiza en la píldora del canal', () => {
    localStorage.setItem('hades_custom_rss_feeds_v1', JSON.stringify([
        { id: 'rss_1', name: 'Mi Blog', icon: '📰', url: 'https://blog.example.com/feed' }
    ]));

    const engine = new TechRadarEngine();
    engine.activeFeedId = 'rss_1';
    engine.renderChannelBar();

    const bar = document.getElementById('radar-channel-bar');
    expect(bar.querySelector('.radar-pill-icon')).toBeTruthy();
    expect(bar.innerHTML).toContain('📰');
});

test('radar: estado de carga visible mientras el fetch está pendiente', async () => {
    const restore = mockFetchWithDelays({
        'https://slow.example.com/feed.xml': { body: XML_A, delay: 150 }
    });
    try {
        const engine = new TechRadarEngine();
        engine.feeds = [{ id: 'slowfeed', name: 'Slow Feed', url: 'https://slow.example.com/feed.xml' }];
        engine.activeFeedId = 'slowfeed';

        const p = engine.loadAndRender(true); // sin await: inspeccionar el estado intermedio
        const listEl = document.getElementById('tech-radar-list');
        expect(listEl.querySelector('.radar-loading')).toBeTruthy(); // ← antes: lista anterior sin feedback

        await p;
        expect(listEl.querySelector('.radar-loading')).toBeFalsy();
        expect(listEl.innerHTML).toContain('ARTICULO_A');
    } finally {
        restore();
    }
});

test('radar: borrar un feed y restaurar defaults al vaciar el radar', () => {
    const engine = new TechRadarEngine();
    expect(engine.feeds.length).toBe(4);

    // Dejar un solo feed (el activo)
    while (engine.feeds.length > 1) engine.removeFeed(engine.feeds[engine.feeds.length - 1].id);
    expect(engine.feeds.length).toBe(1);
    expect(engine.feeds[0].id).toBe('hackernews');

    // Borrar el último → no puede quedar radar vacío: defaults restaurados
    const restore = mockFetchWithDelays({}); // la recarga del activo no toca red real
    try {
        engine.removeFeed('hackernews');
        expect(engine.feeds.length).toBeGreaterThan(1);
        expect(engine.feeds.some(f => f.id === 'hackernews')).toBeTruthy();
        expect(engine.feeds.some(f => f.id === engine.activeFeedId)).toBeTruthy();
    } finally {
        restore();
    }
});

test('radar: el canal activo persiste entre recargas', () => {
    const engine = new TechRadarEngine();
    const target = engine.feeds[1];
    engine.activeFeedId = target.id;
    engine.persistActiveFeed();

    const reloaded = new TechRadarEngine(); // simula recarga de página
    expect(reloaded.activeFeedId).toBe(target.id);
});

test('radar: validación de feed nuevo (URL inválida / duplicado)', () => {
    const engine = new TechRadarEngine();
    expect(engine.validateNewFeed('nota')).toBe('invalid_url');
    expect(engine.validateNewFeed('javascript:alert(1)')).toBe('invalid_url');
    expect(engine.validateNewFeed('https://a.example.com/feed')).toBeNull();

    engine.feeds.push({ id: 'dup', name: 'Dup', url: 'https://a.example.com/feed' });
    expect(engine.validateNewFeed('https://a.example.com/feed')).toBe('duplicate');
});

test('radar: safeHttpUrl rechaza URLs relativas (no se resuelven contra el origen)', () => {
    // Regresión: new URL('nota', location.href) las validaba como URL del propio dominio.
    expect(safeHttpUrl('nota')).toBe('');
    expect(safeHttpUrl('/feed.xml')).toBe('');
    expect(safeHttpUrl('  https://ok.example.com/feed  ')).toContain('https://ok.example.com/feed');
});

test('radar: parseXMLFeed soporta RSS y Atom', () => {
    const engine = new TechRadarEngine();

    const rss = engine.parseXMLFeed(XML_A, 'RSS');
    expect(rss.length).toBe(1);
    expect(rss[0].title).toBe('ARTICULO_A');
    expect(rss[0].url).toBe('https://a.example.com/1');
    expect(rss[0].source).toBe('RSS');

    const atom = engine.parseXMLFeed(
        '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">' +
        '<entry><title>ATOM_ENTRY</title><link href="https://atom.example.com/1"/><published>2024-01-01T00:00:00Z</published></entry>' +
        '</feed>',
        'ATOM'
    );
    expect(atom.length).toBe(1);
    expect(atom[0].title).toBe('ATOM_ENTRY');
    expect(atom[0].url).toBe('https://atom.example.com/1');
});

test('radar: parseXMLFeed con basura devuelve [] (no lanza)', () => {
    const engine = new TechRadarEngine();
    expect(engine.parseXMLFeed('esto no es XML <>>')).toEqual([]);
    expect(engine.parseXMLFeed('')).toEqual([]);
});
