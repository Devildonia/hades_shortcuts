// tests/bangs.test.js — Regresión de bangs (bug crítico #1) y evaluador aritmético (zero-eval).
import { test, expect } from './harness.js';
import { BANGS_MAP, parseBangQuery, evaluateArithmetic, buildBangUrl, resolveBangUrl } from '../js/bangs.js';
import { state } from '../js/state.js';

const DEVTOOL_BANGS = Object.keys(BANGS_MAP).filter((k) => BANGS_MAP[k].isDevTool);

test(`bangs: los ${DEVTOOL_BANGS.length} bangs de devtool sin query NO lanzan TypeError (regresión crítica #1)`, () => {
    for (const bang of DEVTOOL_BANGS) {
        expect(() => parseBangQuery(bang)).not.toThrow();
    }
});

test('bangs: !uuid sin query devuelve targetUrl null y isDevTool true', () => {
    const r = parseBangQuery('!uuid');
    expect(r.isBang).toBe(true);
    expect(r.isDevTool).toBe(true);
    expect(r.bang).toBe('!uuid');
    expect(r.targetUrl).toBeNull();
    expect(r.query).toBe('');
});

test('bangs: devtool bang CON texto conserva el query y no genera "undefined…"', () => {
    const r = parseBangQuery('!b64 hola mundo');
    expect(r.isDevTool).toBe(true);
    expect(r.query).toBe('hola mundo');
    expect(String(r.targetUrl)).not.toContain('undefined');
});

test('bangs: !yt con query construye la URL correcta', () => {
    const r = parseBangQuery('!yt hello world');
    expect(r.isBang).toBe(true);
    expect(r.isDevTool).toBe(false);
    expect(r.targetUrl).toBe('https://www.youtube.com/results?search_query=hello%20world');
    expect(r.query).toBe('hello world');
});

test('bangs: bang sin query usa la base sin el querystring', () => {
    const r = parseBangQuery('!gh');
    expect(r.targetUrl).toBe('https://github.com/search');
});

test('bangs: bang en mayúsculas se normaliza a minúsculas', () => {
    const r = parseBangQuery('!YT video');
    expect(r.isBang).toBe(true);
    expect(r.bang).toBe('!yt');
});

test('bangs: texto que no es bang devuelve isBang false', () => {
    const r = parseBangQuery('hola mundo');
    expect(r.isBang).toBe(false);
});

// ——— T4.2: bang !w resuelve Wikipedia según el idioma activo ———

test('bangs T4.2: !w resuelve el subdominio según state.language (en → en.wikipedia)', () => {
    const prev = state.language;
    try {
        state.language = 'en';
        const r = parseBangQuery('!w hello');
        expect(r.isBang).toBe(true);
        expect(r.targetUrl).toBe('https://en.wikipedia.org/wiki/Special:Search?search=hello');

        state.language = 'fr';
        expect(parseBangQuery('!w bonjour').targetUrl).toContain('fr.wikipedia.org');
    } finally {
        state.language = prev;
    }
});

test('bangs T4.2: !w por defecto es español y respeta el idioma explícito', () => {
    const prev = state.language;
    try {
        state.language = 'es';
        expect(parseBangQuery('!w hola').targetUrl).toBe('https://es.wikipedia.org/wiki/Special:Search?search=hola');
        // El argumento explícito tiene prioridad sobre state.language.
        expect(parseBangQuery('!w hola', 'de').targetUrl).toContain('de.wikipedia.org');
    } finally {
        state.language = prev;
    }
});

test('bangs T4.2: buildBangUrl/resolveBangUrl resuelven {lang} y son no-op sin placeholder', () => {
    expect(buildBangUrl('!w', 'en')).toBe('https://en.wikipedia.org/wiki/Special:Search?search=');
    expect(buildBangUrl('!w')).toBe('https://es.wikipedia.org/wiki/Special:Search?search='); // default es
    expect(buildBangUrl('!yt', 'fr')).toBe('https://www.youtube.com/results?search_query='); // sin {lang}
    expect(resolveBangUrl('https://{lang}.example/x', 'de')).toBe('https://de.example/x');
    expect(buildBangUrl('!nope', 'en')).toBe('');
});

// ——— Evaluador aritmético (CSP-safe, zero eval) ———

test('arithmetic: 2+3*4 = 14 (precedencia)', () => {
    expect(evaluateArithmetic('2+3*4')).toBe('14');
});

test('arithmetic: (2+3)^2 = 25 (paréntesis y potencia)', () => {
    expect(evaluateArithmetic('(2+3)^2')).toBe('25');
});

test('arithmetic: 2^10 = 1024', () => {
    expect(evaluateArithmetic('2^10')).toBe('1024');
});

test('arithmetic: 10/4 = 2.5 (resultado no entero)', () => {
    expect(evaluateArithmetic('10/4')).toBe('2.5');
});

test('arithmetic: 5%3 = 2 (módulo)', () => {
    expect(evaluateArithmetic('5%3')).toBe('2');
});

test('arithmetic: coma decimal se acepta (2,5+2 = 4.5)', () => {
    expect(evaluateArithmetic('2,5+2')).toBe('4.5');
});

test('arithmetic: división por cero devuelve null (no lanza)', () => {
    expect(evaluateArithmetic('10/0')).toBeNull();
});

test('arithmetic: entrada no numérica devuelve null', () => {
    expect(evaluateArithmetic('abc+1')).toBeNull();
    expect(evaluateArithmetic('alert(1)')).toBeNull();
    expect(evaluateArithmetic('')).toBeNull();
});

test('arithmetic: número suelto sin operador devuelve null', () => {
    expect(evaluateArithmetic('42')).toBeNull();
});

test('arithmetic: decimales malformados (1.2.3) se rechazan', () => {
    expect(evaluateArithmetic('1.2.3')).toBeNull();
});

test('arithmetic: decimales válidos con operador funcionan (regresión)', () => {
    expect(evaluateArithmetic('1.5+2.5')).toBe('4');
    expect(evaluateArithmetic('2.5*4')).toBe('10');
    expect(evaluateArithmetic('10.5/2')).toBe('5.25');
});
