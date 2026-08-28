// tests/pomodoro.test.js — Máquina de estados del Pomodoro (regresión de bug crítico #2 + persistencia).
import { test, expect } from './harness.js';
import { state } from '../js/state.js';
import { widgetsManager } from '../js/widgets.js';

const STORAGE_KEY = 'hades_pomodoro_state_v1';

function resetPomodoro() {
    if (widgetsManager._timerId) {
        clearInterval(widgetsManager._timerId);
        widgetsManager._timerId = null;
    }
    widgetsManager.pomodoroState = {
        duration: 25 * 60,
        remaining: 25 * 60,
        mode: 'focus',
        isRunning: false,
        endTime: null
    };
    localStorage.removeItem(STORAGE_KEY);
}

test('pomodoro: transición focus→break NO pisa remaining a 0 (regresión crítica #2)', () => {
    state.soundEnabled = false;
    resetPomodoro();
    widgetsManager.pomodoroState.mode = 'focus';
    widgetsManager.pomodoroState.isRunning = true;
    widgetsManager.pomodoroState.remaining = 1; // último segundo
    widgetsManager.pomodoroState.endTime = null;

    widgetsManager.tick();

    expect(widgetsManager.pomodoroState.mode).toBe('break');
    expect(widgetsManager.pomodoroState.remaining).toBe(5 * 60);   // ← el bug lo dejaba en 0
    expect(widgetsManager.pomodoroState.duration).toBe(5 * 60);
    expect(widgetsManager.pomodoroState.isRunning).toBe(false);
    expect(widgetsManager.pomodoroState.endTime).toBeNull();
});

test('pomodoro: transición break→focus restaura 25 min', () => {
    state.soundEnabled = false;
    resetPomodoro();
    widgetsManager.pomodoroState.mode = 'break';
    widgetsManager.pomodoroState.isRunning = true;
    widgetsManager.pomodoroState.remaining = 1;
    widgetsManager.pomodoroState.endTime = null;

    widgetsManager.tick();

    expect(widgetsManager.pomodoroState.mode).toBe('focus');
    expect(widgetsManager.pomodoroState.remaining).toBe(25 * 60);
    expect(widgetsManager.pomodoroState.isRunning).toBe(false);
});

test('pomodoro: la transición persiste remaining correcto en localStorage', () => {
    state.soundEnabled = false;
    resetPomodoro();
    widgetsManager.pomodoroState.mode = 'focus';
    widgetsManager.pomodoroState.isRunning = true;
    widgetsManager.pomodoroState.remaining = 1;
    widgetsManager.pomodoroState.endTime = null;

    widgetsManager.tick();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.mode).toBe('break');
    expect(stored.remaining).toBe(5 * 60); // ← el bug persistía 0
    expect(stored.isRunning).toBe(false);
});

test('pomodoro: pause con endTime futuro conserva remaining (±1 s)', () => {
    state.soundEnabled = false;
    resetPomodoro();
    widgetsManager.pomodoroState.isRunning = true;
    widgetsManager.pomodoroState.remaining = 123;
    widgetsManager.pomodoroState.endTime = Date.now() + 123 * 1000;

    widgetsManager.pausePomodoro();

    const r = widgetsManager.pomodoroState.remaining;
    expect(r).toBeGreaterThanOrEqual(121);
    expect(r).toBeLessThanOrEqual(123);
    expect(widgetsManager.pomodoroState.isRunning).toBe(false);
    expect(widgetsManager.pomodoroState.endTime).toBeNull();
});

test('pomodoro: pause con endTime YA expirado no anula remaining', () => {
    state.soundEnabled = false;
    resetPomodoro();
    widgetsManager.pomodoroState.isRunning = true;
    widgetsManager.pomodoroState.remaining = 45;
    widgetsManager.pomodoroState.endTime = Date.now() - 500; // expiró

    widgetsManager.pausePomodoro();

    expect(widgetsManager.pomodoroState.remaining).toBe(45);
});

test('pomodoro: start crea intervalo y pause lo limpia (sin fugas de timer)', () => {
    state.soundEnabled = false;
    resetPomodoro();

    widgetsManager.startPomodoro();
    expect(widgetsManager._timerId).toBeTruthy();

    widgetsManager.pausePomodoro();
    expect(widgetsManager._timerId).toBeNull();
});

test('pomodoro: resetPomodoro vuelve a focus/25 min', () => {
    state.soundEnabled = false;
    resetPomodoro();
    widgetsManager.pomodoroState.mode = 'break';
    widgetsManager.pomodoroState.remaining = 12;

    widgetsManager.resetPomodoro();

    expect(widgetsManager.pomodoroState.mode).toBe('focus');
    expect(widgetsManager.pomodoroState.remaining).toBe(25 * 60);
    expect(widgetsManager.pomodoroState.isRunning).toBe(false);
});

test('pomodoro: recarga tras expirar en background → estado pausado en el siguiente modo', () => {
    state.soundEnabled = false;
    localStorage.removeItem(STORAGE_KEY);
    // Simula un estado guardado que expiró mientras la pestaña estaba cerrada
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode: 'focus',
        remaining: 5,
        duration: 25 * 60,
        isRunning: true,
        endTime: Date.now() - 1000
    }));

    const fresh = new widgetsManager.constructor();
    expect(fresh.pomodoroState.isRunning).toBe(false);
    expect(fresh.pomodoroState.mode).toBe('break');
    expect(fresh.pomodoroState.remaining).toBe(5 * 60);
});
