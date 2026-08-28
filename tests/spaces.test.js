// tests/spaces.test.js — Tests de integración y persistencia para SpacesEngine
import { test } from './harness.js';
import { SpacesEngine, SPACE_PRESETS } from '../js/spaces.js';
import { state } from '../js/state.js';

test('SpacesEngine: carga espacios predeterminados y estructura inicial', ({ expect }) => {
    const engine = new SpacesEngine();
    expect(engine.data.activeSpaceId).toBe('space_work');
    expect(Array.isArray(engine.data.spaces)).toBe(true);
    expect(engine.data.spaces.length).toBe(3);

    const workSpace = engine.getSpace('space_work');
    expect(workSpace.name).toBe(SPACE_PRESETS.space_work.name);
    expect(workSpace.theme).toBe('cyber');
});

test('SpacesEngine: conmutación de espacio activo y persistencia', ({ expect }) => {
    const engine = new SpacesEngine();
    engine.setActiveSpace('space_personal');

    expect(engine.data.activeSpaceId).toBe('space_personal');
    expect(state.activeSpaceId).toBe('space_personal');

    const reloaded = new SpacesEngine();
    expect(reloaded.data.activeSpaceId).toBe('space_personal');
});

test('SpacesEngine: espacio devuelve lista correcta de categorías permitidas', ({ expect }) => {
    const engine = new SpacesEngine();
    const personal = engine.getSpace('space_personal');
    expect(Array.isArray(personal.categoryIds)).toBe(true);
    expect(personal.categoryIds).toContain('cat_social');
    expect(personal.categoryIds).toContain('cat_gaming');

    const work = engine.getSpace('space_work');
    expect(work.categoryIds).toBeNull(); // null significa todas las categorías
});
