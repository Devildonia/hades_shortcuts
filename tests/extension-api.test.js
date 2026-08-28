// tests/extension-api.test.js — Regresión de importTopSitesToShortcuts (bug #4: new URL sin proteger).
import { test, expect } from './harness.js';
import { state } from '../js/state.js';
import { platform } from '../js/platform.js';
import { extensionApi } from '../js/extension-api.js';

function stubPlatform(sites) {
    const orig = {
        isExtension: platform.isExtension,
        requestPermission: platform.requestPermission,
        getTopSites: platform.getTopSites
    };
    platform.isExtension = true;
    platform.requestPermission = async () => true;
    platform.getTopSites = async () => sites;
    return () => {
        platform.isExtension = orig.isExtension;
        platform.requestPermission = orig.requestPermission;
        platform.getTopSites = orig.getTopSites;
    };
}

test('extension: importTopSites ignora URLs inválidas sin lanzar (regresión #4)', async () => {
    state.soundEnabled = false;
    const restore = stubPlatform([
        { title: 'Ok Site', url: 'https://ok.example.com' },
        { title: 'Evil', url: 'javascript:alert(1)' },
        { title: 'BadProto', url: 'chrome-extension://abc/index.html' },
        { title: 'Dup', url: 'https://ok.example.com' }
    ]);
    const prevShortcuts = state.shortcuts;
    try {
        const before = state.shortcuts.length;
        let added = -1;
        let threw = false;
        try {
            added = await extensionApi.importTopSitesToShortcuts();
        } catch (e) {
            threw = true;
        }
        expect(threw).toBe(false);          // ← el bug original lanzaba aquí
        expect(added).toBe(1);             // solo "Ok Site"; evil/badproto/dup descartados
        expect(state.shortcuts.length).toBe(before + 1);

        const urls = state.shortcuts.map((s) => s.url);
        expect(urls).not.toContain('javascript:alert(1)');
        expect(urls).not.toContain('chrome-extension://abc/index.html');
    } finally {
        restore();
        state.shortcuts = prevShortcuts;
    }
});

test('extension: importTopSites con lista vacía devuelve false', async () => {
    state.soundEnabled = false;
    const restore = stubPlatform([]);
    try {
        expect(await extensionApi.importTopSitesToShortcuts()).toBe(false);
    } finally {
        restore();
    }
});

test('extension: sin permiso topSites devuelve false sin tocar shortcuts', async () => {
    state.soundEnabled = false;
    const orig = { isExtension: platform.isExtension, requestPermission: platform.requestPermission };
    platform.isExtension = true;
    platform.requestPermission = async () => false;
    const prev = state.shortcuts;
    try {
        const before = state.shortcuts.length;
        expect(await extensionApi.importTopSitesToShortcuts()).toBe(false);
        expect(state.shortcuts.length).toBe(before);
    } finally {
        platform.isExtension = orig.isExtension;
        platform.requestPermission = orig.requestPermission;
        state.shortcuts = prev;
    }
});

test('extension: sitios duplicados no se importan dos veces', async () => {
    state.soundEnabled = false;
    // Planta un atajo previo equivalente
    state.shortcuts.push({ id: 'prev_1', title: 'Ya existe', url: 'https://dup.example.com/' });
    const restore = stubPlatform([
        { title: 'Ya existe (otra vez)', url: 'https://dup.example.com' }
    ]);
    try {
        const added = await extensionApi.importTopSitesToShortcuts();
        expect(added).toBe(0);
        const count = state.shortcuts.filter((s) => s.url === 'https://dup.example.com/').length;
        expect(count).toBe(1);
    } finally {
        restore();
        state.shortcuts.pop();
    }
});
