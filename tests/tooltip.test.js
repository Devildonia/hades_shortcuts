// tests/tooltip.test.js — Smart Tooltip: al activar una tarjeta el tooltip NO debe
// quedar anclado (regresión del bug "sigue la descripción en pantalla" al abrir
// el enlace en otra pestaña).
import { test } from './harness.js';
import { state, DEFAULT_SHORTCUTS } from '../js/state.js';
import { DashboardRenderer } from '../js/render.js';

test('Tooltip: al activar una tarjeta (click) se oculta antes de abrir la URL', ({ expect }) => {
    const renderer = new DashboardRenderer();
    state.editMode = false;
    const kimi = DEFAULT_SHORTCUTS.find((s) => s.id === 'kimi');
    expect(kimi).toBeTruthy();
    state.shortcuts = [kimi];
    renderer.render();

    const card = document.querySelector('.enlace-icono[data-id="kimi"]');
    expect(card).toBeTruthy();

    // Simular hover: el tooltip queda visible sobre la tarjeta
    renderer.showTooltip(card, kimi);
    expect(renderer.smartTooltip.classList.contains('visible')).toBe(true);

    // Capturar window.open para no abrir pestañas reales durante el test
    const origOpen = window.open;
    let opened = null;
    window.open = (url) => { opened = url; return null; };
    try {
        card.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    } finally {
        window.open = origOpen;
    }

    // La URL sí se abre…
    expect(opened).toBe(kimi.url);
    // …y el tooltip queda oculto, sin quedar anclado en pantalla
    expect(renderer.smartTooltip.classList.contains('visible')).toBe(false);
    expect(renderer.smartTooltip.classList.contains('hidden')).toBe(true);
});

test('Tooltip: el hide es idempotente (blur/visibilitychange + click no rompen el estado)', ({ expect }) => {
    const renderer = new DashboardRenderer();
    state.editMode = false;
    const kimi = DEFAULT_SHORTCUTS.find((s) => s.id === 'kimi');
    state.shortcuts = [kimi];
    renderer.render();

    const card = document.querySelector('.enlace-icono[data-id="kimi"]');
    renderer.showTooltip(card, kimi);
    // Simular la malla de seguridad del constructor (pérdida de foco de ventana)
    window.dispatchEvent(new Event('blur'));
    expect(renderer.smartTooltip.classList.contains('visible')).toBe(false);
    // Y un hide adicional (click) no debe lanzar ni cambiar el estado
    renderer.hideTooltip();
    expect(renderer.smartTooltip.classList.contains('hidden')).toBe(true);
});
