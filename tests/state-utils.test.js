// tests/state-utils.test.js — Utilidades de seguridad y estado (escapeHtml, safeHttpUrl, normalizeTags, openSafeUrl).
import { test, expect } from './harness.js';
import { escapeHtml, safeHttpUrl, normalizeTags, openSafeUrl, sanitizeIconUrl, state } from '../js/state.js';

test('escapeHtml: neutraliza HTML y atributos (XSS básico)', () => {
    const out = escapeHtml('<img src=x onerror=alert(1)>');
    expect(out).not.toContain('<img');
    expect(out).toBe('&lt;img src=x onerror=alert(1)&gt;');
});

test('escapeHtml: escapa comillas (atributos)', () => {
    const out = escapeHtml('" onmouseover="alert(1)');
    expect(out).not.toContain('" on');
    expect(out).toContain('&quot;');
});

test('escapeHtml: entrada null/undefined no lanza', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
});

test('safeHttpUrl: rechaza javascript: (vector XSS)', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBe('');
});

test('safeHttpUrl: rechaza data: y protocols no http(s)', () => {
    expect(safeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    expect(safeHttpUrl('ftp://ejemplo.com/archivo')).toBe('');
    expect(safeHttpUrl('chrome-extension://abc/index.html')).toBe('');
});

test('safeHttpUrl: acepta http/https y normaliza', () => {
    expect(safeHttpUrl('https://ejemplo.com/ruta?a=1')).toBe('https://ejemplo.com/ruta?a=1');
    expect(safeHttpUrl('http://ejemplo.com')).toBe('http://ejemplo.com/');
});

test('safeHttpUrl: entrada vacía devuelve ""', () => {
    expect(safeHttpUrl('')).toBe('');
    expect(safeHttpUrl(null)).toBe('');
});

test('normalizeTags: string con comas y # se normaliza (y espeja ia/ai)', () => {
    expect(normalizeTags('IA, #Diseño ,  web')).toEqual(['ia', 'diseño', 'web', 'ai']);
});

test('normalizeTags: ia/ai se espejan sin duplicados', () => {
    expect(normalizeTags('ia')).toEqual(['ia', 'ai']);
    expect(normalizeTags(['ia', 'ai'])).toEqual(['ia', 'ai']);
});

test('normalizeTags: entrada nula devuelve []', () => {
    expect(normalizeTags(null)).toEqual([]);
    expect(normalizeTags(undefined)).toEqual([]);
});

test('openSafeUrl: rechaza javascript: sin abrir nada', () => {
    const calls = [];
    const origOpen = window.open;
    window.open = (href) => { calls.push(href); return {}; };
    try {
        expect(openSafeUrl('javascript:alert(1)')).toBe(false);
        expect(calls).toEqual([]);
    } finally {
        window.open = origOpen;
    }
});

test('openSafeUrl: abre URL https con noopener,noreferrer', () => {
    const calls = [];
    const origOpen = window.open;
    window.open = (href, target, features) => { calls.push({ href, target, features }); return {}; };
    try {
        expect(openSafeUrl('https://ok.example.com/x')).toBe(true);
        expect(calls.length).toBe(1);
        expect(calls[0].href).toBe('https://ok.example.com/x');
        expect(calls[0].features).toContain('noopener');
        expect(calls[0].features).toContain('noreferrer');
    } finally {
        window.open = origOpen;
    }
});

test('sanitizeIconUrl: acepta badges cortos (emoji/texto) sin scheme', () => {
    expect(sanitizeIconUrl('⚡')).toBe('⚡');
    expect(sanitizeIconUrl('💻')).toBe('💻');
    expect(sanitizeIconUrl('Work')).toBe('Work');
});

test('sanitizeIconUrl: acepta URLs http(s), data:image base64 y presets iconos/*', () => {
    expect(sanitizeIconUrl('https://ejemplo.com/logo.png')).toBe('https://ejemplo.com/logo.png');
    expect(sanitizeIconUrl('http://ejemplo.com/a.png')).toBe('http://ejemplo.com/a.png');
    expect(sanitizeIconUrl('data:image/png;base64,iVBORw0KGgo=')).toContain('data:image/png;base64,');
    expect(sanitizeIconUrl('iconos/gmail.webp')).toBe('iconos/gmail.webp');
    expect(sanitizeIconUrl('iconos/MiniMax.webp')).toBe('iconos/MiniMax.webp');
});

test('sanitizeIconUrl: rechaza markup XSS y schemes peligrosos', () => {
    expect(sanitizeIconUrl('<img src=x onerror=alert(1)>')).toBe('');
    expect(sanitizeIconUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeIconUrl('vbscript:msgbox(1)')).toBe('');
    expect(sanitizeIconUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe('');
    expect(sanitizeIconUrl('chrome-extension://abc/index.html')).toBe('');
    expect(sanitizeIconUrl('file:///etc/passwd')).toBe('');
});

test('sanitizeIconUrl: entrada null/undefined/vacío devuelve ""', () => {
    expect(sanitizeIconUrl(null)).toBe('');
    expect(sanitizeIconUrl(undefined)).toBe('');
    expect(sanitizeIconUrl('')).toBe('');
    expect(sanitizeIconUrl('   ')).toBe('');
});

test('loadShortcuts: migra el título guardado "X (Twitter)" a "X"', () => {
    // Simula un localStorage con la entrada antigua ya persistida.
    const saved = [
        { id: 'x', title: 'X (Twitter)', url: 'https://x.com/', icon: 'iconos/x.webp', category: 'cat_social', tags: 'social' },
        { id: 'instagram', title: 'Instagram', url: 'https://www.instagram.com/', icon: 'iconos/instagram.webp', category: 'cat_social', tags: 'social' }
    ];
    localStorage.setItem('custom_shortcuts_v2', JSON.stringify(saved));
    const list = state.loadShortcuts();
    const x = list.find(s => s.id === 'x');
    expect(x.title).toBe('X');
    // El resto de la lista no se toca.
    expect(list.find(s => s.id === 'instagram').title).toBe('Instagram');
    // Un título personalizado distinto no se sobreescribe.
    localStorage.setItem('custom_shortcuts_v2', JSON.stringify([
        { id: 'x', title: 'Mi X personal', url: 'https://x.com/', icon: '', category: 'cat_social', tags: '' }
    ]));
    expect(state.loadShortcuts().find(s => s.id === 'x').title).toBe('Mi X personal');
});
