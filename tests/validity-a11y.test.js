// tests/validity-a11y.test.js — Fase 5: validez HTML + accesibilidad (P2)
// Cubre T5.1 (tarjetas <div role="link">), T5.2 (<noscript>), T5.3 (teclado de
// la marca de usuario) y T5.4 (recorrido de roles: weather ya tiene teclado).
import { test } from './harness.js';
import { state } from '../js/state.js';
import { DashboardRenderer } from '../js/render.js';
import { focusMode } from '../js/focus-mode.js';
import { personalAnalytics } from '../js/personal-analytics.js';

let renderer = null;
function getRenderer() {
    if (!renderer) renderer = new DashboardRenderer();
    return renderer;
}

// Crea una única tarjeta conocida, espía window.open / logLaunch y restaura todo.
// `fn` recibe la tarjeta y un objeto de contadores { opens(), launches() }.
function withCard(fn) {
    const prevShortcuts = state.shortcuts;
    const prevSpaces = window.spacesManager;
    const prevEdit = state.editMode;
    const prevActive = focusMode.isActive;
    const prevBlocked = focusMode.config.blockedDomains;
    const prevOpen = window.open;
    let opens = 0;
    let launches = 0;
    window.open = () => { opens++; return null; };
    const origLog = personalAnalytics.logLaunch;
    personalAnalytics.logLaunch = () => { launches++; };
    const restore = () => {
        state.shortcuts = prevShortcuts;
        window.spacesManager = prevSpaces;
        state.setEditMode(prevEdit);
        focusMode.isActive = prevActive;
        focusMode.config.blockedDomains = prevBlocked;
        window.open = prevOpen;
        personalAnalytics.logLaunch = origLog;
    };
    try {
        state.shortcuts = [{
            id: 'v5_sc',
            title: 'Prueba',
            url: 'https://example.com/',
            icon: '',
            category: state.categories[0].id,
            tags: []
        }];
        window.spacesManager = undefined;
        state.setEditMode(false);
        focusMode.isActive = false;
        getRenderer().render();
        const card = document.querySelector('#shortcuts-grid .enlace-icono');
        return fn(card, { opens: () => opens, launches: () => launches });
    } finally {
        restore();
    }
}

test('Fase 5 · T5.1: la tarjeta es <div role="link"> (no <a>) con data-href', ({ expect }) => {
    withCard((card, spy) => {
        expect(card).toBeTruthy();
        expect(card.tagName).toBe('DIV');
        expect(card.getAttribute('role')).toBe('link');
        expect(card.getAttribute('tabindex')).toBe('0');
        expect(card.getAttribute('data-href')).toBe('https://example.com/');
        // HTML válido: no hay ningún <a> ancestro entre la tarjeta y la grilla.
        let n = card;
        while (n && n.id !== 'shortcuts-grid') {
            expect(n.tagName).not.toBe('A');
            n = n.parentElement;
        }
    });
});

test('Fase 5 · T5.1: Enter y Space (teclado) abren la URL y registran analítica', ({ expect }) => {
    withCard((card, spy) => {
        card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        expect(spy.opens()).toBe(1);
        expect(spy.launches()).toBe(1);

        card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
        expect(spy.opens()).toBe(2);
        expect(spy.launches()).toBe(2);
    });
});

test('Fase 5 · T5.1: clic en MODO NORMAL abre la URL y registra analítica', ({ expect }) => {
    withCard((card, spy) => {
        card.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        expect(spy.opens()).toBe(1);
        expect(spy.launches()).toBe(1);
    });
});

test('Fase 5 · T5.1: con Focus activo, una URL bloqueada NO abre (Zen Shield)', ({ expect }) => {
    withCard((card, spy) => {
        focusMode.isActive = true;
        focusMode.config.blockedDomains = ['example.com'];
        card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        expect(spy.opens()).toBe(0);
        expect(spy.launches()).toBe(0);
        expect(focusMode.blockedAttemptUrl).toBe('https://example.com/');
    });
});

test('Fase 5 · T5.1: en MODO EDICIÓN, Enter no abre ni registra analítica', ({ expect }) => {
    withCard((card, spy) => {
        state.setEditMode(true);
        card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        expect(spy.opens()).toBe(0);
        expect(spy.launches()).toBe(0);
    });
});

test('Fase 5 · T5.2: index.html declara <noscript> con aviso de JavaScript', async ({ expect }) => {
    const res = await fetch('../index.html');
    const html = await res.text();
    expect(html).toContain('<noscript>');
    expect(html).toContain('noscript-banner');
    expect(html).toContain('JavaScript');
});

test('Fase 5 · T5.3: #brand-user-name (role="button") tiene handler de teclado', async ({ expect }) => {
    const res = await fetch('../js/app.js');
    const src = await res.text();
    expect(src).toMatch(/brandName\.addEventListener\(\s*['"]keydown['"]/);
    expect(src).toContain('Enter');
});

test('Fase 5 · T5.4: weather-widget (role="button") ya tiene handler de teclado', async ({ expect }) => {
    const res = await fetch('../js/weather.js');
    const src = await res.text();
    expect(src).toMatch(/weatherWidget\.addEventListener\(\s*['"]keydown['"]/);
    expect(src).toContain('Enter');
});
