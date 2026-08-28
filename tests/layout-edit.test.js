// tests/layout-edit.test.js — Sistema de Edición (drag de tiles, resize, edit mode)
// Regresiones cubiertas:
//  - Drag por DELTA sobre el offsetParent real (antes: pageX/pageY sobre absolute → salto de header).
//  - Flush del frame rAF pendiente al soltar (antes: se perdía el último px y el storage quedaba desfasado).
//  - Clamp al VIEWPORT para drag y resize (antes: drag al tamaño del doc → tile perdible; inconsistente).
//  - Resize ancla left/top de tiles nunca-posicionados (antes: left/top auto → deriva de layout).
//  - z-index al frente en resize + resetLayout resetea el contador.
//  - Sin arrastre desde inputs / botón derecho / botones de acción.
//  - Escape no secuestra el flujo cuando se está escribiendo.
//  - Clic en tarjeta en edit mode: sin analítica, sin Zen Shield, sin navegación.
import { test, expect, delay, beforeEach } from './harness.js';
import { state } from '../js/state.js';
import { LayoutManager } from '../js/layout.js';
import { DashboardRenderer } from '../js/render.js';
import { personalAnalytics } from '../js/personal-analytics.js';
import { focusMode } from '../js/focus-mode.js';

const TILE_A = '#lt-tile-a';
const TILE_B = '#lt-tile-b';
const $ = (sel) => document.querySelector(sel);

function fire(el, type, opts = {}) {
    el.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        buttons: 1,
        ...opts
    }));
}

function resetTiles() {
    [TILE_A, TILE_B].forEach(sel => {
        const t = $(sel);
        if (!t) return;
        t.classList.remove('freeform-positioned', 'tile-is-dragging', 'tile-is-resizing', 'modular-tile');
        t.style.cssText = t.getAttribute('data-base-style') || '';
        t.onpointerdown = null;
        t.onpointermove = null;
        t.onpointerup = null;
        t.onpointercancel = null;
        const drag = t.querySelector('.modular-drag-handle');
        if (drag) drag.remove();
        const resize = t.querySelector('.modular-resize-handle');
        if (resize) resize.remove();
    });
    document.body.classList.remove('edit-mode-active');
}

beforeEach(() => {
    state.soundEnabled = false;
    state.setEditMode(false);
    resetTiles();
});

// ============ LayoutManager: estado y almacenamiento ============

test('layout: applyPositions aplica left/top/width/height/z-index guardados', () => {
    localStorage.setItem('canvas_positions_v1', JSON.stringify({
        'lt-tile-a': { x: 15, y: 25, w: 200, h: 120, zIndex: 310 }
    }));
    const lm = new LayoutManager();
    lm.applyPositions();
    const a = $(TILE_A);
    expect(a.classList.contains('freeform-positioned')).toBe(true);
    expect(a.style.left).toBe('15px');
    expect(a.style.top).toBe('25px');
    expect(a.style.width).toBe('200px');
    expect(a.style.height).toBe('120px');
    expect(a.style.zIndex).toBe('310');
    // Tile sin posiciones: no se vuelve absolute ni hereda estilos
    const b = $(TILE_B);
    expect(b.classList.contains('freeform-positioned')).toBe(false);
    expect(b.style.left).toBe('');
});

test('layout: loadPositions descarta storage corrupto (array / JSON inválido)', () => {
    localStorage.setItem('canvas_positions_v1', '[1,2,3]');
    expect(new LayoutManager().positions).toEqual({});
    localStorage.setItem('canvas_positions_v1', '{{roto');
    expect(new LayoutManager().positions).toEqual({});
});

test('layout: valor corrupto por tile no rompe applyPositions ni el drag', () => {
    localStorage.setItem('canvas_positions_v1', JSON.stringify({ 'lt-tile-b': 'basura-string' }));
    const lm = new LayoutManager();
    expect(() => lm.applyPositions()).not.toThrow();
    expect($(TILE_B).classList.contains('freeform-positioned')).toBe(false);
    // El slot corrupto se sanea al escribir
    const slot = lm.slotFor('lt-tile-b');
    slot.x = 1;
    expect(lm.positions['lt-tile-b']).toEqual({ x: 1 });
});

test('layout: setPositions rechaza arrays y strings sin romper', () => {
    const lm = new LayoutManager();
    lm.setPositions('nope');
    expect(lm.positions).toEqual({});
    lm.setPositions([1, 2]);
    expect(lm.positions).toEqual({});
    lm.setPositions({ 'lt-tile-b': { x: 5, y: 5 } });
    expect(lm.positions['lt-tile-b'].x).toBe(5);
});

test('layout: resetLayout limpia posiciones, estilos y el contador de z-index', () => {
    localStorage.setItem('canvas_positions_v1', JSON.stringify({ 'lt-tile-a': { x: 1, y: 2 } }));
    const lm = new LayoutManager();
    lm.topZIndex = 800;
    lm.applyPositions();
    expect($(TILE_A).classList.contains('freeform-positioned')).toBe(true);

    lm.resetLayout();

    expect(lm.positions).toEqual({});
    expect(lm.topZIndex).toBe(300);
    expect(localStorage.getItem('canvas_positions_v1')).toBeNull();
    expect($(TILE_A).classList.contains('freeform-positioned')).toBe(false);
    expect($(TILE_A).style.left).toBe('');
});

test('layout: toggleEditVisuals crea/retira tiradores y muestra/oculta la barra', () => {
    const lm = new LayoutManager();
    const a = $(TILE_A);
    const bar = document.getElementById('floating-edit-bar');

    lm.toggleEditVisuals(true);
    expect(a.querySelector('.modular-drag-handle')).toBeTruthy();
    expect(a.querySelector('.modular-resize-handle')).toBeTruthy();
    expect(document.body.classList.contains('edit-mode-active')).toBe(true);
    expect(bar.classList.contains('hidden')).toBe(false);

    lm.toggleEditVisuals(false);
    expect(a.querySelector('.modular-drag-handle')).toBeNull();
    expect(a.querySelector('.modular-resize-handle')).toBeNull();
    expect(bar.classList.contains('hidden')).toBe(true);
});

// ============ Drag: motor de movimiento ============

test('layout: drag mueve el tile por DELTA (sin salto de coordenadas) y persiste', async () => {
    state.setEditMode(true);
    try {
        const lm = new LayoutManager();
        lm.toggleEditVisuals(true);
        const b = $(TILE_B);
        const baseLeft = b.offsetLeft;
        const baseTop = b.offsetTop;

        fire(b, 'pointerdown', { clientX: 100, clientY: 100 });
        fire(b, 'pointermove', { clientX: 160, clientY: 90 }); // dx=+60, dy=-10
        await delay(80); // deja correr el rAF
        fire(b, 'pointerup', { clientX: 160, clientY: 90 });

        expect(b.style.left).toBe(`${baseLeft + 60}px`);
        expect(b.style.top).toBe(`${baseTop - 10}px`);
        const saved = JSON.parse(localStorage.getItem('canvas_positions_v1'));
        expect(saved['lt-tile-b'].x).toBe(baseLeft + 60);
        expect(saved['lt-tile-b'].y).toBe(baseTop - 10);
    } finally {
        state.setEditMode(false);
    }
});

test('layout: soltar con frame rAF pendiente NO pierde el último desplazamiento', () => {
    state.setEditMode(true);
    try {
        const lm = new LayoutManager();
        lm.toggleEditVisuals(true);
        const b = $(TILE_B);
        const baseLeft = b.offsetLeft;

        fire(b, 'pointerdown', { clientX: 100, clientY: 100 });
        fire(b, 'pointermove', { clientX: 190, clientY: 100 }); // rAF aún pendiente
        fire(b, 'pointerup', { clientX: 190, clientY: 100 });   // sin esperar el rAF

        expect(b.style.left).toBe(`${baseLeft + 90}px`);
        const saved = JSON.parse(localStorage.getItem('canvas_positions_v1'));
        expect(saved['lt-tile-b'].x).toBe(baseLeft + 90);
    } finally {
        state.setEditMode(false);
    }
});

test('layout: drag NO puede sacar el tile del viewport (clamp de borde)', async () => {
    state.setEditMode(true);
    try {
        const lm = new LayoutManager();
        lm.toggleEditVisuals(true);
        const b = $(TILE_B);
        const prect = b.offsetParent.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const expClientX = Math.max(10, vw - b.offsetWidth - 10);
        const expClientY = Math.max(10, vh - b.offsetHeight - 10);

        fire(b, 'pointerdown', { clientX: 100, clientY: 100 });
        fire(b, 'pointermove', { clientX: 6000, clientY: 6000 });
        await delay(80);
        fire(b, 'pointerup', { clientX: 6000, clientY: 6000 });

        expect(b.style.left).toBe(`${expClientX - prect.left}px`);
        expect(b.style.top).toBe(`${expClientY - prect.top}px`);
        const saved = JSON.parse(localStorage.getItem('canvas_positions_v1'));
        expect(saved['lt-tile-b'].x).toBe(expClientX - prect.left);
    } finally {
        state.setEditMode(false);
    }
});

test('layout: el botón derecho NO inicia arrastre de tile', async () => {
    state.setEditMode(true);
    try {
        const lm = new LayoutManager();
        lm.toggleEditVisuals(true);
        const b = $(TILE_B);

        fire(b, 'pointerdown', { clientX: 100, clientY: 100, button: 2, buttons: 2 });
        fire(b, 'pointermove', { clientX: 300, clientY: 300 });
        await delay(60);
        fire(b, 'pointerup', { clientX: 300, clientY: 300 });

        expect(b.style.left).toBe('');
        expect(b.classList.contains('tile-is-dragging')).toBe(false);
        expect(localStorage.getItem('canvas_positions_v1')).toBeNull();
    } finally {
        state.setEditMode(false);
    }
});

test('layout: arrastrar desde un <input> dentro del tile NO mueve el tile', async () => {
    state.setEditMode(true);
    try {
        const lm = new LayoutManager();
        lm.toggleEditVisuals(true);
        const b = $(TILE_B);
        const input = document.getElementById('lt-tile-b-input');

        fire(input, 'pointerdown', { clientX: 50, clientY: 50 });
        fire(b, 'pointermove', { clientX: 300, clientY: 300 });
        await delay(60);
        fire(b, 'pointerup', { clientX: 300, clientY: 300 });

        expect(b.style.left).toBe('');
        expect(b.classList.contains('freeform-positioned')).toBe(false);
        expect(localStorage.getItem('canvas_positions_v1')).toBeNull();
    } finally {
        state.setEditMode(false);
    }
});

test('layout: drag trae el tile al frente (z-index monótono)', () => {
    state.setEditMode(true);
    try {
        const lm = new LayoutManager();
        lm.toggleEditVisuals(true);
        const b = $(TILE_B);

        fire(b, 'pointerdown', { clientX: 100, clientY: 100 });
        expect(b.style.zIndex).toBe('301');
        fire(b, 'pointerup', { clientX: 100, clientY: 100 });
    } finally {
        state.setEditMode(false);
    }
});

test('layout: al arrastrar se CONSERVA el tamaño de grilla (no se sobredimensiona)', async () => {
    state.setEditMode(true);
    try {
        const lm = new LayoutManager();
        lm.toggleEditVisuals(true);
        const b = $(TILE_B);
        const gridW = b.offsetWidth;
        const gridH = b.offsetHeight;
        expect(gridW).toBeGreaterThan(0);

        fire(b, 'pointerdown', { clientX: 100, clientY: 100 });
        fire(b, 'pointermove', { clientX: 140, clientY: 120 });
        await delay(80);
        fire(b, 'pointerup', { clientX: 140, clientY: 120 });

        // Sale del flujo con tamaño EXPLÍCITO idéntico al que tenía en grilla
        expect(b.classList.contains('freeform-positioned')).toBe(true);
        expect(b.style.width).toBe(`${gridW}px`);
        expect(b.style.height).toBe(`${gridH}px`);
        const saved = JSON.parse(localStorage.getItem('canvas_positions_v1'));
        expect(saved['lt-tile-b'].w).toBe(gridW);
        expect(saved['lt-tile-b'].h).toBe(gridH);
    } finally {
        state.setEditMode(false);
    }
});

test('layout: posiciones antiguas sin w/h se fijan al tamaño de grilla (applyPositions)', () => {
    localStorage.setItem('canvas_positions_v1', JSON.stringify({ 'lt-tile-a': { x: 5, y: 5 } }));
    const a = $(TILE_A);
    const gridW = a.offsetWidth;
    const gridH = a.offsetHeight;

    const lm = new LayoutManager();
    lm.applyPositions();

    expect(a.classList.contains('freeform-positioned')).toBe(true);
    expect(a.style.width).toBe(`${gridW}px`);
    expect(a.style.height).toBe(`${gridH}px`);
    expect(lm.positions['lt-tile-a'].w).toBe(gridW);
    expect(lm.positions['lt-tile-a'].h).toBe(gridH);
});

// ============ Resize: motor de redimensión ============

test('layout: resize de tile nunca-posicionado ancla left/top (sin deriva de layout)', async () => {
    state.setEditMode(true);
    try {
        const lm = new LayoutManager();
        lm.toggleEditVisuals(true);
        const b = $(TILE_B);
        const handle = b.querySelector('.modular-resize-handle');
        expect(handle).toBeTruthy();
        const baseLeft = b.offsetLeft;
        const baseTop = b.offsetTop;
        const baseW = b.offsetWidth;
        const baseH = b.offsetHeight;

        fire(handle, 'pointerdown', { clientX: 200, clientY: 200 });
        fire(handle, 'pointermove', { clientX: 260, clientY: 240 }); // dx=+60, dy=+40
        await delay(80);
        fire(handle, 'pointerup', { clientX: 260, clientY: 240 });

        expect(b.style.width).toBe(`${baseW + 60}px`);
        // El origen queda fijado y persistido (antes: left/top auto → deriva)
        expect(b.style.left).toBe(`${baseLeft}px`);
        expect(b.style.top).toBe(`${baseTop}px`);
        const saved = JSON.parse(localStorage.getItem('canvas_positions_v1'));
        expect(saved['lt-tile-b'].x).toBe(baseLeft);
        expect(saved['lt-tile-b'].y).toBe(baseTop);
        expect(saved['lt-tile-b'].w).toBe(baseW + 60);
        expect(saved['lt-tile-b'].h).toBe(baseH + 40);
    } finally {
        state.setEditMode(false);
    }
});

test('layout: resize respeta el tamaño mínimo aunque el delta sea gigante', async () => {
    state.setEditMode(true);
    try {
        const lm = new LayoutManager();
        lm.toggleEditVisuals(true);
        const b = $(TILE_B);
        const handle = b.querySelector('.modular-resize-handle');

        fire(handle, 'pointerdown', { clientX: 200, clientY: 200 });
        fire(handle, 'pointermove', { clientX: -9000, clientY: -9000 });
        await delay(80);
        fire(handle, 'pointerup', { clientX: -9000, clientY: -9000 });

        expect(b.style.width).toBe('140px');
        expect(b.style.height).toBe('60px');
    } finally {
        state.setEditMode(false);
    }
});

test('layout: resize trae el tile al frente (z-index, igual que el drag)', () => {
    state.setEditMode(true);
    try {
        const lm = new LayoutManager();
        lm.toggleEditVisuals(true);
        const b = $(TILE_B);
        const handle = b.querySelector('.modular-resize-handle');

        fire(handle, 'pointerdown', { clientX: 200, clientY: 200 });
        expect(b.style.zIndex).toBe('301');
        fire(handle, 'pointerup', { clientX: 200, clientY: 200 });
    } finally {
        state.setEditMode(false);
    }
});

// ============ Modo edición: teclados y clicks ============

test('layout: Escape NO sale del modo edición si estás escribiendo en un input', () => {
    state.setEditMode(true);
    try {
        const lm = new LayoutManager();
        lm.init(); // registra el handler de Escape en document

        const input = document.getElementById('lt-tile-b-input');
        input.focus();
        expect(document.activeElement).toBe(input);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(state.editMode).toBe(true); // guardado: el Escape va al input

        input.blur();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(state.editMode).toBe(false); // sin input activo: sale de edición
    } finally {
        state.setEditMode(false);
    }
});

// ============ Render: clicks en tarjetas durante la edición ============

let rendererSingleton = null;
function getRenderer() {
    if (!rendererSingleton) rendererSingleton = new DashboardRenderer();
    return rendererSingleton;
}

function withTestCard(fn) {
    const prevShortcuts = state.shortcuts;
    const prevSpaces = window.spacesManager;
    const prevActive = focusMode.isActive;
    let calls = 0;
    const origLog = personalAnalytics.logLaunch;
    personalAnalytics.logLaunch = () => { calls++; };
    const restore = () => {
        state.shortcuts = prevShortcuts;
        window.spacesManager = prevSpaces;
        focusMode.isActive = prevActive;
        personalAnalytics.logLaunch = origLog;
    };
    try {
        state.shortcuts = [{
            id: 'lt_sc',
            title: 'Prueba',
            url: 'https://example.com/',
            icon: '',
            category: state.categories[0].id,
            tags: []
        }];
        window.spacesManager = undefined;
        focusMode.isActive = false;
        getRenderer().render();
        const card = document.querySelector('#shortcuts-grid .enlace-icono');
        expect(card).toBeTruthy();
        return fn(card, () => calls);
    } finally {
        restore();
    }
}

test('render: clic en tarjeta en MODO EDICIÓN no registra analítica ni navega', () => {
    state.setEditMode(true);
    try {
        withTestCard((card, calls) => {
            const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
            card.dispatchEvent(evt);
            expect(calls()).toBe(0);            // sin rastro en analytics
            expect(evt.defaultPrevented).toBe(true); // sin navegación
        });
    } finally {
        state.setEditMode(false);
    }
});

test('render: clic en tarjeta en MODO NORMAL sí registra analítica', () => {
    state.setEditMode(false);
    withTestCard((card, calls) => {
        card.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        expect(calls()).toBe(1);
    });
});
