// tests/i18n-sync.test.js — T4.3: test de paridad entre idiomas (locales/*.json)
// Los locales/*.json son la única fuente de verdad de las traducciones.
// Este test garantiza:
//   (a) Los 4 idiomas existen, son válidos y no están vacíos.
//   (b) PARIDAD: los 4 idiomas comparten exactamente el mismo conjunto de claves.
import { test, expect } from './harness.js';

const LANGS = ['es', 'en', 'fr', 'de'];

// Aplana recursivamente un objeto a { 'a.b.c': valor } conservando solo las hojas.
const flatten = (obj, pre = '', out = {}) => {
    for (const k of Object.keys(obj)) {
        const v = obj[k];
        const key = pre ? pre + '.' + k : k;
        if (v !== null && typeof v === 'object') flatten(v, key, out);
        else out[key] = v;
    }
    return out;
};

test('i18n: los 4 archivos locales/*.json existen, son válidos y no están vacíos', async () => {
    for (const l of LANGS) {
        const res = await fetch(`../locales/${l}.json`);
        expect(res.ok).toBe(true);
        const json = await res.json();
        expect(typeof json === 'object' && json !== null).toBeTruthy();
        expect(Object.keys(flatten(json)).length).toBeGreaterThan(0);
    }
});

test('i18n: los 4 idiomas comparten EXACTAMENTE el mismo conjunto de claves (nada falta en ningún idioma)', async () => {
    const keysByLang = {};
    for (const l of LANGS) {
        const res = await fetch(`../locales/${l}.json`);
        expect(res.ok).toBe(true);
        const json = await res.json();
        keysByLang[l] = Object.keys(flatten(json)).sort();
    }

    const base = keysByLang['es'];
    for (const l of LANGS.slice(1)) {
        const missing = base.filter((k) => !keysByLang[l].includes(k));
        const extra = keysByLang[l].filter((k) => !base.includes(k));
        if (missing.length || extra.length) {
            console.error(`[${l}] missing:`, missing.slice(0, 10));
            console.error(`[${l}] extra:  `, extra.slice(0, 10));
        }
        expect(JSON.stringify(keysByLang[l])).toBe(JSON.stringify(base));
    }
});
