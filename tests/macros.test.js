// tests/macros.test.js — Tests de integración y ejecución para MacroEngine
import { test } from './harness.js';
import { MacroEngine, DEFAULT_MACROS } from '../js/macros.js';

test('MacroEngine: carga macros predeterminadas correctamente', ({ expect }) => {
    const engine = new MacroEngine();
    expect(engine.macros['!work']).toBeTruthy();
    expect(engine.macros['!focus']).toBeTruthy();
    expect(engine.macros['!chill']).toBeTruthy();
    expect(engine.macros['!3d']).toBeTruthy();
    expect(engine.macros['!social']).toBeTruthy();

    const workMacro = engine.getMacro('!work');
    expect(workMacro.ambient).toBe('rain');
    expect(workMacro.pomodoro).toBe('start');
    expect(workMacro.shortcuts).toContain('github');
});

test('MacroEngine: creación, persistencia y edición de custom macros', ({ expect }) => {
    const engine = new MacroEngine();
    const custom = {
        '!myroutine': {
            name: 'Mi Rutina Diaria',
            desc: 'Abre Spotify y Discord con sonido ambiental binaural',
            shortcuts: ['spotify', 'discord'],
            ambient: 'binaural',
            pomodoro: 'start',
            icon: '⚡'
        }
    };

    engine.saveCustomMacros(custom);
    expect(engine.getMacro('!myroutine')).toBeTruthy();
    expect(engine.getMacro('!myroutine').name).toBe('Mi Rutina Diaria');

    const reloaded = new MacroEngine();
    expect(reloaded.getMacro('!myroutine')).toBeTruthy();
    expect(reloaded.getMacro('!myroutine').ambient).toBe('binaural');
});

test('MacroEngine: getMacro es case-insensitive y tolera espacios', ({ expect }) => {
    const engine = new MacroEngine();
    expect(engine.getMacro('  !WORK  ')).toBeTruthy();
    expect(engine.getMacro('!Work').ambient).toBe('rain');
    expect(engine.getMacro('!inexistente')).toBeNull();
});

test('MacroEngine: setCustomMacros y reloadCustomMacros sincronizan memoria', ({ expect }) => {
    const engine = new MacroEngine();
    engine.setCustomMacros({
        '!sync_test': {
            name: 'Sync Test',
            desc: 'Test in memory sync',
            shortcuts: [],
            ambient: null,
            pomodoro: null,
            icon: '🧪'
        }
    });

    expect(engine.customMacros['!sync_test']).toBeTruthy();
    expect(engine.macros['!sync_test'].name).toBe('Sync Test');
});
