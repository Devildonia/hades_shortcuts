// tests/spaces.test.js — Tests de integración y persistencia para SpacesEngine
import { test } from './harness.js';
import { SpacesEngine, SPACE_PRESETS } from '../js/spaces.js';
import { state } from '../js/state.js';

test('SpacesEngine: carga espacios predeterminados y estructura inicial', ({ expect }) => {
    const engine = new SpacesEngine();
    expect(engine.data.activeSpaceId).toBe('space_work');
    expect(Array.isArray(engine.data.spaces)).toBe(true);
    expect(engine.data.spaces.length).toBe(6);

    // Los 3 espacios originales conservan su identidad; 4-6 son las nuevas teclas del numpad
    ['space_work', 'space_personal', 'space_3d', 'space_art', 'space_fun', 'space_utils']
        .forEach((id) => expect(engine.data.spaces.some((s) => s.id === id)).toBe(true));

    const workSpace = engine.data.spaces.find(s => s.id === 'space_work');
    expect(workSpace.name).toBe(SPACE_PRESETS.space_work.name);
    expect(workSpace.theme).toBe('cyber');
});

test('SpacesEngine: conmutación de espacio activo y persistencia', ({ expect }) => {
    const engine = new SpacesEngine();
    engine.switchSpace('space_personal');

    expect(engine.data.activeSpaceId).toBe('space_personal');
    expect(engine.getActiveSpace().id).toBe('space_personal');

    const reloaded = new SpacesEngine();
    expect(reloaded.data.activeSpaceId).toBe('space_personal');
});

test('SpacesEngine: espacio devuelve lista correcta de categorías permitidas', ({ expect }) => {
    const engine = new SpacesEngine();
    const personal = engine.data.spaces.find(s => s.id === 'space_personal');
    expect(Array.isArray(personal.categoryIds)).toBe(true);
    expect(personal.categoryIds).toContain('cat_social');
    expect(personal.categoryIds).toContain('cat_gaming');

    const work = engine.data.spaces.find(s => s.id === 'space_work');
    expect(work.categoryIds).toBeNull(); // null significa todas las categorías

    engine.switchSpace('space_personal');
    expect(engine.allowsCategory('cat_social')).toBe(true);
    expect(engine.allowsCategory('cat_code')).toBe(false);
});

// ==================== Perfiles editables (nombre, acento, categorías, orden) ====================

test('SpacesEngine: renameSpace personaliza el nombre y el vacío lo restaura', ({ expect }) => {
    const engine = new SpacesEngine();

    engine.renameSpace('space_work', 'Mi Espacio Pro');
    const sp = engine.getSpace('space_work');
    expect(sp.customName).toBe(true);
    expect(sp.name).toBe('Mi Espacio Pro');
    expect(engine.spaceLabel('space_work')).toBe('Mi Espacio Pro');

    // Sin nombre (vacío/espacios) → vuelve al nombre de fábrica y customName=false
    engine.renameSpace('space_work', '   ');
    const sp2 = engine.getSpace('space_work');
    expect(sp2.customName).toBe(false);
    expect(sp2.name).toBe(SPACE_PRESETS.space_work.name);
});

test('SpacesEngine: setSpaceAccent acepta hex válido y rechaza el resto', ({ expect }) => {
    const engine = new SpacesEngine();

    engine.setSpaceAccent('space_work', '#FF0000');
    expect(engine.getSpace('space_work').accent).toBe('#ff0000'); // normalizado a minúsculas

    engine.setSpaceAccent('space_work', 'red');
    expect(engine.getSpace('space_work').accent).toBe('#ff0000'); // sin cambios

    engine.setSpaceAccent('space_work', '#12345');
    expect(engine.getSpace('space_work').accent).toBe('#ff0000'); // sin cambios
});

test('SpacesEngine: setSpaceCategories normaliza ids, elimina duplicados y vacío→null', ({ expect }) => {
    const engine = new SpacesEngine();

    engine.setSpaceCategories('space_work', ['cat_ai', 'cat_ai', 'not_cat', 'cat_3d']);
    expect(engine.getSpace('space_work').categoryIds).toEqual(['cat_ai', 'cat_3d']);
    engine.switchSpace('space_work');
    expect(engine.allowsCategory('cat_ai')).toBe(true);
    expect(engine.allowsCategory('cat_social')).toBe(false);

    // Vacío o null → todas las categorías (null)
    engine.setSpaceCategories('space_work', []);
    expect(engine.getSpace('space_work').categoryIds).toBeNull();
    expect(engine.allowsCategory('cat_social')).toBe(true);

    engine.setSpaceCategories('space_work', null);
    expect(engine.getSpace('space_work').categoryIds).toBeNull();
});

test('SpacesEngine: moveSpace reordena (tecla Alt+N) sin duplicar ni perder perfiles', ({ expect }) => {
    const engine = new SpacesEngine();
    const before = engine.data.spaces.map((s) => s.id);
    const first = before[0];
    const second = before[1];

    // Bajar el primero → pasa a la posición 2
    engine.moveSpace(first, 1);
    const after = engine.data.spaces.map((s) => s.id);
    expect(after.length).toBe(6);
    expect(after[0]).toBe(second);
    expect(after[1]).toBe(first);
    expect([...after].sort()).toEqual([...before].sort()); // mismo conjunto de ids

    // Límites: el primero no puede subir más; el último no puede bajar más
    engine.moveSpace(after[0], -1);
    expect(engine.data.spaces.map((s) => s.id).join()).toBe(after.join());
    engine.moveSpace(after[5], 1);
    expect(engine.data.spaces.map((s) => s.id).join()).toBe(after.join());
});

test('SpacesEngine: persistencia completa (nombre, acento, categorías y orden) sobrevive al recargo', ({ expect }) => {
    const engine = new SpacesEngine();
    engine.renameSpace('space_work', 'Trabajo v2');
    engine.setSpaceAccent('space_work', '#123456');
    engine.setSpaceCategories('space_personal', ['cat_ai', 'cat_tools']);
    engine.moveSpace('space_art', 1); // reordena

    const expectedOrder = engine.data.spaces.map((s) => s.id);
    const reloaded = new SpacesEngine();

    expect(reloaded.data.spaces.map((s) => s.id)).toEqual(expectedOrder);
    expect(reloaded.getSpace('space_work').name).toBe('Trabajo v2');
    expect(reloaded.getSpace('space_work').customName).toBe(true);
    expect(reloaded.getSpace('space_work').accent).toBe('#123456');
    expect(reloaded.getSpace('space_personal').categoryIds).toEqual(['cat_ai', 'cat_tools']);
});

test('SpacesEngine: resetSpace y resetAllSpaces restauran la fábrica manteniendo 6 perfiles', ({ expect }) => {
    const engine = new SpacesEngine();
    engine.renameSpace('space_work', 'Custom');
    engine.setSpaceAccent('space_work', '#abcdef');
    engine.setSpaceCategories('space_work', ['cat_ai']);

    engine.resetSpace('space_work');
    const sp = engine.getSpace('space_work');
    expect(sp.name).toBe(SPACE_PRESETS.space_work.name);
    expect(sp.customName).toBe(false);
    expect(sp.accent).toBe(SPACE_PRESETS.space_work.accent);
    expect(sp.categoryIds).toBeNull();

    engine.moveSpace('space_fun', -1); // desorden
    engine.resetAllSpaces();
    const after = engine.data.spaces;
    expect(after.length).toBe(6);
    expect(after.map((s) => s.id)).toEqual(Object.keys(SPACE_PRESETS));
    after.forEach((s) => expect(s.customName).toBe(false));
});

test('SpacesEngine: importSpaces aplica un backup válido y persiste en hades_spaces_v1', ({ expect }) => {
    const engine = new SpacesEngine();
    const saved = {
        activeSpaceId: 'space_art',
        spaces: [
            { id: 'space_art', name: 'Arte Custom', customName: true, accent: '#123ABC', theme: 'jade', categoryIds: ['cat_art', 'cat_ai'], scratchpad: 'notas' },
            { id: 'space_fun' }
        ]
    };

    engine.importSpaces(saved);
    expect(engine.data.spaces.length).toBe(6); // los 4 ausentes se completan con fábrica
    expect(engine.data.activeSpaceId).toBe('space_art');
    expect(engine.data.spaces.map((s) => s.id)[0]).toBe('space_art'); // orden respetado

    const art = engine.getSpace('space_art');
    expect(art.customName).toBe(true);
    expect(art.name).toBe('Arte Custom');
    expect(art.accent).toBe('#123abc'); // normalizado a minúsculas
    expect(art.categoryIds).toEqual(['cat_art', 'cat_ai']);

    // Persistido y recargable sin re-importar
    const reloaded = new SpacesEngine();
    expect(reloaded.data.activeSpaceId).toBe('space_art');
    expect(reloaded.getSpace('space_art').name).toBe('Arte Custom');
});

test('SpacesEngine: importSpaces con datos corruptos no lanza y cae a fábrica (6 perfiles)', ({ expect }) => {
    const engine = new SpacesEngine();

    expect(() => engine.importSpaces(null)).not.toThrow();
    expect(engine.data.spaces.length).toBe(6);

    expect(() => engine.importSpaces({ spaces: 'no-array' })).not.toThrow();
    expect(engine.data.spaces.length).toBe(6);

    expect(() => engine.importSpaces({ activeSpaceId: 'space_x', spaces: [{ id: 'space_work' }, { id: 'no-existe' }] })).not.toThrow();
    const ids = engine.data.spaces.map((s) => s.id);
    expect(ids.length).toBe(6);
    expect(ids[0]).toBe('space_work'); // el id válido manda; el inválido se descarta
    expect(engine.data.activeSpaceId).toBe('space_work'); // 'space_x' inválido → fallback seguro
});
