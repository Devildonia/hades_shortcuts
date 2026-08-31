// tests/import-sync.test.js — Regresión de desincronización memoria↔localStorage
// (bug silencioso #3: importBackup / applyPackagePayload escribían storage sin actualizar los managers).
import { test, expect, delay } from './harness.js';
import { state } from '../js/state.js';
import { LayoutManager } from '../js/layout.js';
import { PostItManager } from '../js/postits.js';
import { MacroEngine } from '../js/macros.js';
import { CryptoSyncEngine } from '../js/crypto-sync.js';
import { BackupManager } from '../js/backup.js';
import { SpacesEngine } from '../js/spaces.js';

// Mock de confirm() para headless browser (evita bloqueo del event loop)
window.confirm = () => true;

// Reproduce lo que app.js expone en el navegador real
function installManagers() {
    window.layoutManager = new LayoutManager();
    window.postitsManager = new PostItManager();
    window.macroEngine = new MacroEngine();
    window.spacesManager = new SpacesEngine();
}

const SHARED_PAYLOAD = {
    canvasPositions: { 'tile_a': { x: 111, y: 222, zIndex: 5 } },
    postits: [{ id: 'p_1', text: 'Nota sincronizada', color: 'cyan', x: 10, y: 20, zIndex: 1 }],
    customMacros: {
        '!prueba': { name: 'Macro Prueba', desc: '', shortcuts: ['github'], ambient: null, pomodoro: null, icon: '🧪' }
    }
};

const SPACES_PAYLOAD = {
    activeSpaceId: 'space_art',
    spaces: [
        { id: 'space_art', name: 'Arte Custom', customName: true, accent: '#123abc', theme: 'jade', categoryIds: ['cat_art', 'cat_ai'], scratchpad: 'notas' },
        { id: 'space_fun' }
    ]
};

test('crypto-sync: applyPackagePayload actualiza memoria Y localStorage', () => {
    state.soundEnabled = false;
    installManagers();
    const sync = new CryptoSyncEngine({ render() {} });

    sync.applyPackagePayload({ ...SHARED_PAYLOAD });

    // Memoria (lo que ve la UI)
    expect(window.layoutManager.positions).toEqual(SHARED_PAYLOAD.canvasPositions);
    expect(window.postitsManager.postits).toEqual(SHARED_PAYLOAD.postits);
    expect(window.macroEngine.customMacros['!prueba']).toBeTruthy();
    expect(window.macroEngine.getMacro('!prueba')).toBeTruthy();

    // Storage
    expect(JSON.parse(localStorage.getItem('canvas_positions_v1'))).toEqual(SHARED_PAYLOAD.canvasPositions);
    expect(JSON.parse(localStorage.getItem('glass_postits_v1'))).toEqual(SHARED_PAYLOAD.postits);
    expect(JSON.parse(localStorage.getItem('custom_macros_v1'))['!prueba']).toBeTruthy();
});

test('crypto-sync: applyPackagePayload sincroniza los perfiles (memoria Y storage)', () => {
    state.soundEnabled = false;
    installManagers();
    const sync = new CryptoSyncEngine({ render() {} });

    sync.applyPackagePayload({ spaces: SPACES_PAYLOAD });

    // Memoria (lo que ve la UI)
    const sp = window.spacesManager.getSpace('space_art');
    expect(sp.customName).toBe(true);
    expect(sp.name).toBe('Arte Custom');
    expect(sp.accent).toBe('#123abc');
    expect(sp.categoryIds).toEqual(['cat_art', 'cat_ai']);
    expect(window.spacesManager.data.spaces.length).toBe(6); // los 4 ausentes se completan
    expect(window.spacesManager.data.activeSpaceId).toBe('space_art');

    // Storage
    expect(JSON.parse(localStorage.getItem('hades_spaces_v1')).activeSpaceId).toBe('space_art');
    expect(JSON.parse(localStorage.getItem('hades_spaces_v1')).spaces.length).toBe(6);
});

test('backup: importBackup aplica los perfiles incluidos en el archivo', async () => {
    state.soundEnabled = false;
    installManagers();

    const backup = {
        version: '1.0.0-rc-1',
        shortcuts: [{ id: 'sc_1', title: 'GitHub', url: 'https://github.com', category: 'cat_dev' }],
        spaces: SPACES_PAYLOAD
    };

    const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });
    const bm = new BackupManager({ render() {} });
    bm.importBackup({ target: { files: [file] } }); // simula <input type=file> change
    await delay(80); // deja correr FileReader.onload

    const sp = window.spacesManager.getSpace('space_art');
    expect(sp.name).toBe('Arte Custom');
    expect(sp.customName).toBe(true);
    expect(JSON.parse(localStorage.getItem('hades_spaces_v1')).activeSpaceId).toBe('space_art');
});

test('crypto-sync: payload corrupto no corrompe los managers', () => {
    installManagers();
    const sync = new CryptoSyncEngine({ render() {} });

    sync.applyPackagePayload({
        canvasPositions: 'esto-no-es-objeto',
        postits: 'tampoco-array',
        customMacros: 42
    });

    expect(window.layoutManager.positions).toEqual({});
    expect(window.postitsManager.postits).toEqual([]);
    expect(window.macroEngine.getMacro('!prueba')).toBeNull();
});

test('backup: importBackup (File real) actualiza memoria Y localStorage (regresión #3)', async () => {
    state.soundEnabled = false;
    installManagers();

    const backup = {
        version: '1.0.0-rc-1',
        shortcuts: [{ id: 'sc_1', title: 'GitHub', url: 'https://github.com', category: 'cat_dev' }],
        canvasPositions: SHARED_PAYLOAD.canvasPositions,
        postits: SHARED_PAYLOAD.postits,
        customMacros: SHARED_PAYLOAD.customMacros
    };

    const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });
    const bm = new BackupManager({ render() {} });
    bm.importBackup({ target: { files: [file] } }); // simula <input type=file> change
    await delay(80); // deja correr FileReader.onload

    expect(window.layoutManager.positions).toEqual(SHARED_PAYLOAD.canvasPositions);
    expect(window.postitsManager.postits).toEqual(SHARED_PAYLOAD.postits);
    expect(window.macroEngine.customMacros['!prueba']).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('canvas_positions_v1'))).toEqual(SHARED_PAYLOAD.canvasPositions);

    // Los shortcuts importados deben estar en memoria y storage
    expect(state.shortcuts.length).toBe(1);
    expect(state.shortcuts[0].title).toBe('GitHub');
});

test('backup: importBackup con JSON inválido NO lanza y no corrompe estado', async () => {
    installManagers();
    const before = state.shortcuts.length;

    const badFile = new File(['{{no-json'], 'bad.json', { type: 'application/json' });
    const bm = new BackupManager({ render() {} });
    expect(() => bm.importBackup({ target: { files: [badFile] } })).not.toThrow();
    await delay(80);

    expect(state.shortcuts.length).toBe(before);
});

test('backup: importBackup sin archivo (usuario cancela el diálogo) NO lanza', () => {
    installManagers();
    expect(() => new BackupManager({ render() {} }).importBackup({ target: { files: [] } })).not.toThrow();
    expect(() => new BackupManager({ render() {} }).importBackup({ target: {} })).not.toThrow();
});
