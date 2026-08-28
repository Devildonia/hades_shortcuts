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
