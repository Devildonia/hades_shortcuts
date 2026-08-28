// tests/bangs.test.js — Regresión de bangs (bug crítico #1) y evaluador aritmético (zero-eval).
import { test, expect } from './harness.js';
import { BANGS_MAP, parseBangQuery, evaluateArithmetic } from '../js/bangs.js';

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
