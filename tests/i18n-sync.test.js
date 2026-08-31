// tests/i18n-sync.test.js — T4.3: test antidivergencia diccionario embebido ↔ locales/*.json
// El diccionario embebido (js/i18n.js) y locales/{lang}.json son dos copias de la
// misma fuente. Este test PASA hoy y FALLA si alguien edita una copia sin la otra.
// Además garantiza PARIDAD entre idiomas: los 4 idiomas comparten el mismo conjunto
// de claves (ninguna falta en ningún idioma), independientemente de su valor.
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

// T4.3b: PARIDAD entre idiomas. Usa locales/*.json (fuente de runtime vía loadLocaleAsync).
// Si alguna clave existe en un idioma y falta en otro, el test FALLA y nombra el idioma
// y las claves ausentes. Esto cubre el caso que la prueba de arriba NO cubre: añadir una
// clave a `es` y olvidarse de `en/fr/de` (cada idioma seguiría siendo internamente correcto).
test('i18n T4.3b: los 4 idiomas comparten EXACTAMENTE el mismo conjunto de claves (nada falta en ningún idioma)', async () => {
    const keysByLang = {};
    for (const l of LANGS) {
        const res = await fetch(`../locales/${l}.json`);
        expect(res.ok).toBe(true);
        const json = await res.json();
        keysByLang[l] = Object.keys(flatten(json)).sort();
    }

    // Unión de todas las claves presentes en cualquiera de los idiomas.
    const todas = new Set();
    for (const l of LANGS) keysByLang[l].forEach((k) => todas.add(k));

    const problemas = [];
    for (const l of LANGS) {
        const set = new Set(keysByLang[l]);
        const faltan = [...todas].filter((k) => !set.has(k));
        if (faltan.length) {
            problemas.push(`${l} FALTA(n) ${faltan.length}: ${faltan.slice(0, 15).join(', ')}${faltan.length > 15 ? '…' : ''}`);
        }
    }
    expect(problemas).toEqual([]);
});
