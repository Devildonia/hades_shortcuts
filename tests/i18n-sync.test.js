// tests/i18n-sync.test.js — T4.3: test antidivergencia diccionario embebido ↔ locales/*.json
// El diccionario embebido (js/i18n.js) y locales/{lang}.json son dos copias de la
// misma fuente. Este test PASA hoy y FALLA si alguien edita una copia sin la otra.
import { test, expect } from './harness.js';
import { i18nDictionaries } from '../js/i18n.js';

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

test('i18n T4.3: los 4 diccionarios embebidos existen y no están vacíos', () => {
    for (const l of LANGS) {
        expect(i18nDictionaries[l] && typeof i18nDictionaries[l] === 'object').toBeTruthy();
        expect(Object.keys(flatten(i18nDictionaries[l])).length).toBeGreaterThan(0);
    }
});

test('i18n T4.3: locales/*.json y el diccionario embebido NO divergen (claves y valores)', async () => {
    for (const l of LANGS) {
        const res = await fetch(`../locales/${l}.json`);
        expect(res.ok).toBe(true);
        const json = await res.json();

        const emb = flatten(i18nDictionaries[l]);
        const loc = flatten(json);
        const keysEmb = Object.keys(emb).sort();
        const keysLoc = Object.keys(loc).sort();

        // (a) Mismo conjunto de claves (recursivas) en ambas copias.
        expect(JSON.stringify(keysEmb)).toBe(JSON.stringify(keysLoc));

        // (b) Mismo valor en cada clave.
        const valueMismatch = keysEmb.filter((k) => emb[k] !== loc[k]);
        expect(valueMismatch).toEqual([]);
    }
});
