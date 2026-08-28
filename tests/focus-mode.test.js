// tests/focus-mode.test.js — Tests de activación y Distraction Shield para FocusModeEngine
import { test } from './harness.js';
import { FocusModeEngine } from '../js/focus-mode.js';

test('FocusModeEngine: carga de configuración y defaults de bloqueo', ({ expect }) => {
    const engine = new FocusModeEngine();
    expect(engine.isActive).toBe(false);
    expect(Array.isArray(engine.config.blockedDomains)).toBe(true);
    expect(engine.config.blockedDomains).toContain('youtube.com');
    expect(engine.config.blockedDomains).toContain('x.com');
    expect(engine.config.dimBackground).toBe(true);
});

test('FocusModeEngine: activación y desactivación de modo foco', ({ expect }) => {
    const engine = new FocusModeEngine();
    engine.activateFocus(15);

    expect(engine.isActive).toBe(true);
    expect(engine.remainingSeconds).toBe(15 * 60);

    engine.deactivateFocus(false);
    expect(engine.isActive).toBe(false);
});

test('FocusModeEngine: isUrlBlocked detecta dominios bloqueados durante el foco', ({ expect }) => {
    const engine = new FocusModeEngine();
    engine.isActive = true;

    expect(engine.isUrlBlocked('https://x.com/home')).toBe(true);
    expect(engine.isUrlBlocked('https://youtube.com/watch?v=123')).toBe(true);
    expect(engine.isUrlBlocked('https://github.com/Devildonia')).toBe(false);
    expect(engine.isUrlBlocked('https://claude.ai/chat')).toBe(false);

    engine.isActive = false;
    expect(engine.isUrlBlocked('https://x.com/home')).toBe(false);
});
