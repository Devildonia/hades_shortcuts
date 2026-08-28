// js/layout.js - Freeform Canvas & Resize Layout Manager (rAF Throttled & Exact Cursor Lock)
//
// Design notes (post-audit AAA pass):
// - MOVIMIENTO POR DELTA: el tile se mueve `offsetLeft/offsetTop + delta` en el
//   sistema de su offsetParent (el bloque contenedor real, `.dashboard-wrapper`).
//   El código anterior usaba pageX/pageY (coordenadas de página) sobre un tile
//   `position: absolute` anclado al wrapper: el primer arrastre hacía saltar el
//   módulo por la altura del header y el margen de centrado, y las posiciones
//   guardadas eran incoherentes entre anchos de pantalla.
// - CLAMP AL VIEWPORT: ni el drag ni el resize permiten sacar el tile de la
//   ventana (antes: drag clampaba al tamaño del documento → tile "perdido"
//   fuera de pantalla; resize clampaba a window → inconsistente).
// - FLUSH EN RELEASE: si hay un frame rAF pendiente al soltar, se aplica
//   síncronamente antes de guardar (antes: cancelAnimationFrame perdía el
//   último desplazamiento y el storage quedaba desfasado del visual).
// - RESIZE ANCLA ORIGEN: redimensionar un tile que nunca se movió fija su
//   left/top actuales (antes: `left/top: auto` → el grid reflujo y el layout
//   derivaba entre renders).
// - GESTOS: solo botón primario, sin arrastre desde inputs/labels/botones de
//   acción, z-index "traer al frente" en drag Y resize, y resetLayout resetea
//   el contador de z-index.

import { state, persistJson } from './state.js';
import { soundFx } from './audio.js';

const EDGE_MARGIN = 10;
const MIN_TILE_W = 140;
const MIN_TILE_H = 60;
const MAX_Z_INDEX = 900;
const BASE_Z_INDEX = 300;

export class LayoutManager {
    constructor() {
        this.positions = this.loadPositions();
        this.topZIndex = BASE_Z_INDEX;
        this.floatingBar = document.getElementById('floating-edit-bar');
        this.exitBtn = document.getElementById('exit-edit-mode-btn');
        this.resetBtn = document.getElementById('reset-layout-btn-bar');
    }

    /** Solo acepta objetos planos: storage manipulado o payloads corruptos no deben romper el motor. */
    static sanitizePositions(value) {
        return (value && typeof value === 'object' && !Array.isArray(value)) ? value : {};
    }

    loadPositions() {
        try {
            const saved = localStorage.getItem('canvas_positions_v1');
            if (saved) {
                const parsed = JSON.parse(saved);
                const clean = LayoutManager.sanitizePositions(parsed);
                if (Object.keys(clean).length) return clean;
            }
        } catch (e) {}
        return {};
    }

    savePositions() {
        persistJson('canvas_positions_v1', this.positions);
    }

    setPositions(newPositions) {
        this.positions = LayoutManager.sanitizePositions(newPositions);
        this.savePositions();
        this.applyPositions();
    }

    reloadPositions() {
        this.positions = this.loadPositions();
        this.applyPositions();
    }

    init() {
        this.applyPositions();
        state.on('dashboard:rendered', () => this.applyPositions());
        state.on('editmode:changed', (enabled) => this.toggleEditVisuals(enabled));

        if (this.exitBtn) {
            this.exitBtn.addEventListener('click', () => {
                soundFx.play('click');
                state.setEditMode(false);
            });
        }

        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                soundFx.play('click');
                this.resetLayout();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape' || !state.editMode) return;
            // Escape no debe secuestrar el flujo si el usuario está escribiendo
            // (editor de atajos, buscador) o tiene abierto un modal/drawer.
            const ae = document.activeElement;
            if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable)) return;
            if (document.querySelector('.modal-overlay:not(.hidden), [role="dialog"]:not(.hidden)')) return;
            const drawer = document.getElementById('settings-drawer');
            if (drawer && !drawer.classList.contains('hidden')) return;
            state.setEditMode(false);
        });
    }

    applyPositions() {
        const tiles = document.querySelectorAll('[data-tile-id]');
        tiles.forEach(tile => {
            const id = tile.getAttribute('data-tile-id');
            const pos = this.positions[id];
            if (pos && (pos.x !== undefined || pos.y !== undefined || pos.w || pos.h)) {
                // Posiciones antiguas guardadas solo con x/y: el tile salía del
                // flujo con tamaño auto ("sobredimensionado"). Fijamos el tamaño
                // de grilla real ANTES de salir del flujo (el tile aún está en él).
                this.pinGridSize(tile, pos);
                tile.classList.add('freeform-positioned');
                if (pos.x !== undefined) tile.style.left = `${pos.x}px`;
                if (pos.y !== undefined) tile.style.top = `${pos.y}px`;
                if (pos.w) tile.style.width = `${pos.w}px`;
                if (pos.h) tile.style.height = `${pos.h}px`;
                if (pos.zIndex) tile.style.zIndex = pos.zIndex;
            } else {
                tile.classList.remove('freeform-positioned');
                tile.style.removeProperty('left');
                tile.style.removeProperty('top');
                tile.style.removeProperty('width');
                tile.style.removeProperty('height');
                tile.style.removeProperty('z-index');
            }
        });

        this.toggleEditVisuals(state.editMode);
    }

    resetLayout() {
        this.positions = {};
        this.topZIndex = BASE_Z_INDEX; // resetea el contador (antes seguía creciendo)
        localStorage.removeItem('canvas_positions_v1');
        localStorage.removeItem('dashboard_layout_v3');
        this.applyPositions();
        soundFx.play('chime');
    }

    toggleEditVisuals(enabled) {
        document.body.classList.toggle('edit-mode-active', enabled);
        if (this.floatingBar) {
            this.floatingBar.classList.toggle('hidden', !enabled);
        }

        const tiles = document.querySelectorAll('[data-tile-id]');
        tiles.forEach(tile => {
            tile.classList.toggle('modular-tile', enabled);

            // Drag Handle
            let handle = tile.querySelector('.modular-drag-handle');
            if (enabled && !handle) {
                handle = document.createElement('span');
                handle.className = 'modular-drag-handle';
                handle.setAttribute('title', 'Arrastrar módulo a cualquier posición');
                handle.textContent = '⠿';
                tile.prepend(handle);
            } else if (!enabled && handle) {
                handle.remove();
            }

            // Resize Handle (Bottom Right Corner)
            let resizeHandle = tile.querySelector('.modular-resize-handle');
            if (enabled && !resizeHandle) {
                resizeHandle = document.createElement('span');
                resizeHandle.className = 'modular-resize-handle';
                resizeHandle.setAttribute('title', 'Redimensionar módulo');
                resizeHandle.textContent = '↘';
                tile.appendChild(resizeHandle);
                this.bindResizeEvents(tile, resizeHandle);
            } else if (!enabled && resizeHandle) {
                resizeHandle.remove();
            }

            if (enabled) {
                this.bindTileDragEvents(tile);
            } else {
                tile.onpointerdown = null;
                tile.onpointermove = null;
                tile.onpointerup = null;
                tile.onpointercancel = null;
            }
        });
    }

    /** Trae el tile al frente de la pila (acotado para no crecer sin límite). */
    bringToFront(tile) {
        this.topZIndex = Math.min(this.topZIndex + 1, MAX_Z_INDEX);
        tile.style.zIndex = this.topZIndex;
    }

    /**
     * Cuando un tile sale del flujo de grilla (absolute), su width/height pasan
     * a "auto" (shrink-to-fit) y el tamaño cambia solo (antes: "se sobredimensiona").
     * Captura el tamaño real que ocupaba en la grilla y lo fija explícitamente,
     * de modo que al arrastrarlo se mueve SIN cambiar de tamaño.
     */
    pinGridSize(tile, slot) {
        if (tile.classList.contains('freeform-positioned')) return; // ya estaba posicionado: conserva su w/h
        const w = tile.offsetWidth;
        const h = tile.offsetHeight;
        if (w && h) {
            tile.style.width = `${w}px`;
            tile.style.height = `${h}px`;
            if (!slot.w) slot.w = w;
            if (!slot.h) slot.h = h;
        }
    }

    /** Devuelve un slot de posiciones válido para `id`, saneando valores corruptos. */
    slotFor(id) {
        const cur = this.positions[id];
        if (!cur || typeof cur !== 'object' || Array.isArray(cur)) this.positions[id] = {};
        return this.positions[id];
    }

    /**
     * Convierte coordenadas del tile (sistema de offsetParent) a coordenadas de
     * viewport, aplica el clamp de borde y devuelve al sistema del tile.
     * Funciona con cualquier bloque contenedor, sin depender del scroll.
     */
    clampTileOrigin(tile, x, y) {
        const parent = (tile.offsetParent && typeof tile.offsetParent.getBoundingClientRect === 'function')
            ? tile.offsetParent
            : document.documentElement;
        const prect = parent.getBoundingClientRect();
        const vw = window.innerWidth || 1024;
        const vh = window.innerHeight || 768;
        const w = tile.offsetWidth || 100;
        const h = tile.offsetHeight || 60;

        // max >= min garantizado aunque el tile sea más grande que el viewport.
        const maxClientX = Math.max(EDGE_MARGIN, vw - w - EDGE_MARGIN);
        const maxClientY = Math.max(EDGE_MARGIN, vh - h - EDGE_MARGIN);
        const clientX = Math.max(EDGE_MARGIN, Math.min(maxClientX, prect.left + x));
        const clientY = Math.max(EDGE_MARGIN, Math.min(maxClientY, prect.top + y));

        return { x: clientX - prect.left, y: clientY - prect.top };
    }

    bindTileDragEvents(tile) {
        const id = tile.getAttribute('data-tile-id');
        let isDragging = false;
        let hasMoved = false;
        let rafId = null;
        let startClientX = 0, startClientY = 0;
        let startTileX = 0, startTileY = 0;
        let lastClientX = 0, lastClientY = 0;

        // Superficies interactivas: no inician arrastre de tile.
        const blocksDrag = (target) => !!(target && target.closest && target.closest(
            '.modular-resize-handle, .card-action-btn, .enlace-icono, ' +
            'input, textarea, select, label, [contenteditable="true"], [contenteditable=""]'
        ));

        const applyMove = (clientX, clientY) => {
            if (!hasMoved) {
                hasMoved = true;
                // Fijar ANTES de salir del flujo: el tamaño de grilla se conserva.
                this.pinGridSize(tile, this.slotFor(id));
                tile.classList.add('tile-is-dragging');
                tile.classList.add('freeform-positioned');
                soundFx.play('hover');
            }

            // Delta sobre el origen capturado: continuo en ambos sistemas
            // (in-flow → absolute) y sin saltos por offset del header.
            const target = this.clampTileOrigin(
                tile,
                startTileX + (clientX - startClientX),
                startTileY + (clientY - startClientY)
            );
            tile.style.left = `${target.x}px`;
            tile.style.top = `${target.y}px`;

            const slot = this.slotFor(id);
            slot.x = target.x;
            slot.y = target.y;
            slot.zIndex = this.topZIndex;
        };

        const onPointerDown = (e) => {
            if (!state.editMode) return;
            if (e.button !== undefined && e.button !== 0) return;
            if (blocksDrag(e.target)) return;

            isDragging = true;
            hasMoved = false;
            startClientX = lastClientX = e.clientX;
            startClientY = lastClientY = e.clientY;
            // offsetLeft/offsetTop ya están en el sistema del bloque contenedor:
            // mismo sistema que left/top absolute. Capturado ANTES de posicionar.
            startTileX = tile.offsetLeft;
            startTileY = tile.offsetTop;

            this.bringToFront(tile);

            try { tile.setPointerCapture(e.pointerId); } catch (err) {}
            e.preventDefault(); // evita selección de texto / drag de imágenes
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            lastClientX = e.clientX;
            lastClientY = e.clientY;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                rafId = null;
                if (!isDragging) return;
                applyMove(lastClientX, lastClientY);
            });
        };

        const endDrag = () => {
            // Flush: aplica el frame pendiente antes de guardar (no se pierde el último px).
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
                applyMove(lastClientX, lastClientY);
            }
            tile.classList.remove('tile-is-dragging');
            if (hasMoved) {
                this.savePositions();
                soundFx.play('click');
            }
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            endDrag();
            try { tile.releasePointerCapture(e.pointerId); } catch (err) {}
        };

        const onPointerCancel = () => {
            if (!isDragging) return;
            isDragging = false;
            endDrag();
        };

        tile.onpointerdown = onPointerDown;
        tile.onpointermove = onPointerMove;
        tile.onpointerup = onPointerUp;
        tile.onpointercancel = onPointerCancel;
    }

    bindResizeEvents(tile, resizeHandle) {
        const id = tile.getAttribute('data-tile-id');
        let isResizing = false;
        let hasResized = false;
        let rafId = null;
        let startClientX = 0, startClientY = 0;
        let startW = 0, startH = 0;
        let startTileX = 0, startTileY = 0;
        let lastClientX = 0, lastClientY = 0;

        const applyResize = (clientX, clientY) => {
            if (!hasResized) {
                hasResized = true;
                tile.classList.add('freeform-positioned');
                tile.classList.add('tile-is-resizing');
                soundFx.play('hover');
            }

            const dx = clientX - startClientX;
            const dy = clientY - startClientY;
            const vw = window.innerWidth || 1024;
            const vh = window.innerHeight || 768;

            // Clamp min→max coherente: en ventanas estrechas gana el mínimo
            // (antes: max < min → el tile "saltaba" al presionar el tirador).
            const newW = Math.max(MIN_TILE_W, Math.min(Math.max(MIN_TILE_W, vw - EDGE_MARGIN * 2), startW + dx));
            const newH = Math.max(MIN_TILE_H, Math.min(Math.max(MIN_TILE_H, vh - EDGE_MARGIN * 2), startH + dy));

            const slot = this.slotFor(id);
            // Si el tile nunca se movió, ancla su origen (left/top auto → el
            // grid reflujo y el layout derivaba). Ahora queda determinista.
            if (slot.x === undefined && slot.y === undefined) {
                slot.x = startTileX;
                slot.y = startTileY;
                if (!tile.style.left) tile.style.left = `${startTileX}px`;
                if (!tile.style.top) tile.style.top = `${startTileY}px`;
            }
            slot.w = newW;
            slot.h = newH;
            slot.zIndex = this.topZIndex;

            // El tamaño se fija una sola vez (aquí, con el nuevo valor), para
            // evitar doble escritura de estilo por frame.
            tile.style.width = `${slot.w}px`;
            tile.style.height = `${slot.h}px`;
        };

        const onResizeDown = (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation(); // el tile padre no inicia arrastre simultáneo

            isResizing = true;
            hasResized = false;
            startClientX = lastClientX = e.clientX;
            startClientY = lastClientY = e.clientY;
            startTileX = tile.offsetLeft;
            startTileY = tile.offsetTop;
            startW = tile.offsetWidth || MIN_TILE_W;
            startH = tile.offsetHeight || MIN_TILE_H;

            this.bringToFront(tile); // antes solo el drag subía z-index

            try { resizeHandle.setPointerCapture(e.pointerId); } catch (err) {}
        };

        const onResizeMove = (e) => {
            if (!isResizing) return;
            lastClientX = e.clientX;
            lastClientY = e.clientY;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                rafId = null;
                if (!isResizing) return;
                applyResize(lastClientX, lastClientY);
            });
        };

        const onResizeUp = (e) => {
            if (!isResizing) return;
            isResizing = false;
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
                applyResize(lastClientX, lastClientY);
            }
            tile.classList.remove('tile-is-resizing');
            if (hasResized) {
                this.savePositions();
                soundFx.play('click');
            }
            try { resizeHandle.releasePointerCapture(e.pointerId); } catch (err) {}
        };

        resizeHandle.onpointerdown = onResizeDown;
        resizeHandle.onpointermove = onResizeMove;
        resizeHandle.onpointerup = onResizeUp;
        resizeHandle.onpointercancel = onResizeUp;
    }
}
