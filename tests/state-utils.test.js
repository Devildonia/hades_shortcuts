// tests/state-utils.test.js — Utilidades de seguridad y estado (escapeHtml, safeHttpUrl, normalizeTags, openSafeUrl).
import { test, expect } from './harness.js';
import { escapeHtml, safeHttpUrl, normalizeTags, openSafeUrl } from '../js/state.js';

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
