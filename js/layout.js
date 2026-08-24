// js/layout.js - Freeform Canvas & Resize Layout Manager (rAF Throttled & Exact Cursor Lock)

import { state } from './state.js';
import { soundFx } from './audio.js';

export class LayoutManager {
    constructor() {
        this.positions = this.loadPositions();
        this.topZIndex = 300;
        this.floatingBar = document.getElementById('floating-edit-bar');
        this.exitBtn = document.getElementById('exit-edit-mode-btn');
        this.resetBtn = document.getElementById('reset-layout-btn-bar');
    }

    loadPositions() {
        try {
            const saved = localStorage.getItem('canvas_positions_v1');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {};
    }

    savePositions() {
        try {
            localStorage.setItem('canvas_positions_v1', JSON.stringify(this.positions));
        } catch (e) {}
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
            if (e.key === 'Escape' && state.editMode) {
                state.setEditMode(false);
            }
        });
    }

    applyPositions() {
        const tiles = document.querySelectorAll('[data-tile-id]');
        tiles.forEach(tile => {
            const id = tile.getAttribute('data-tile-id');
            const pos = this.positions[id];
            if (pos && (pos.x !== undefined || pos.y !== undefined || pos.w || pos.h)) {
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
            }
        });
    }

    bindTileDragEvents(tile) {
        const id = tile.getAttribute('data-tile-id');
        let isDragging = false;
        let grabOffsetX = 0, grabOffsetY = 0;
        let hasMoved = false;
        let rafId = null;

        const onPointerDown = (e) => {
            if (!state.editMode) return;
            if (e.target.closest('.modular-resize-handle') || e.target.closest('.card-action-btn') || e.target.closest('.enlace-icono')) return;

            isDragging = true;
            hasMoved = false;

            const rect = tile.getBoundingClientRect();
            grabOffsetX = e.clientX - rect.left;
            grabOffsetY = e.clientY - rect.top;

            this.topZIndex += 1;
            tile.style.zIndex = this.topZIndex;

            try { tile.setPointerCapture(e.pointerId); } catch (err) {}
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;

            const clientX = e.clientX;
            const clientY = e.clientY;

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                if (!isDragging) return;

                if (!hasMoved) {
                    hasMoved = true;
                    tile.classList.add('tile-is-dragging');
                    tile.classList.add('freeform-positioned');
                    soundFx.play('hover');
                }

                const targetX = clientX - grabOffsetX;
                const targetY = clientY - grabOffsetY;

                const maxX = Math.max(10, window.innerWidth - tile.offsetWidth - 10);
                const maxY = Math.max(10, window.innerHeight - tile.offsetHeight - 10);
                const newX = Math.max(10, Math.min(maxX, targetX));
                const newY = Math.max(10, Math.min(maxY, targetY));

                tile.style.left = `${newX}px`;
                tile.style.top = `${newY}px`;

                if (!this.positions[id]) this.positions[id] = {};
                this.positions[id].x = newX;
                this.positions[id].y = newY;
                this.positions[id].zIndex = this.topZIndex;
            });
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (rafId) cancelAnimationFrame(rafId);
            if (hasMoved) {
                tile.classList.remove('tile-is-dragging');
                this.savePositions();
                soundFx.play('click');
            }
            try { tile.releasePointerCapture(e.pointerId); } catch (err) {}
        };

        tile.onpointerdown = onPointerDown;
        tile.onpointermove = onPointerMove;
        tile.onpointerup = onPointerUp;
        tile.onpointercancel = onPointerUp;
    }

    bindResizeEvents(tile, resizeHandle) {
        const id = tile.getAttribute('data-tile-id');
        let isResizing = false;
        let startClientX = 0, startClientY = 0;
        let startW = 0, startH = 0;
        let resizeRafId = null;

        const onResizeDown = (e) => {
            e.stopPropagation();
            isResizing = true;
            startClientX = e.clientX;
            startClientY = e.clientY;

            const rect = tile.getBoundingClientRect();
            startW = rect.width;
            startH = rect.height;

            tile.classList.add('freeform-positioned');
            tile.classList.add('tile-is-resizing');
            soundFx.play('hover');
            try { resizeHandle.setPointerCapture(e.pointerId); } catch (err) {}
        };

        const onResizeMove = (e) => {
            if (!isResizing) return;
            const clientX = e.clientX;
            const clientY = e.clientY;

            if (resizeRafId) cancelAnimationFrame(resizeRafId);
            resizeRafId = requestAnimationFrame(() => {
                if (!isResizing) return;
                const deltaX = clientX - startClientX;
                const deltaY = clientY - startClientY;

                const newW = Math.max(140, Math.min(window.innerWidth - 30, startW + deltaX));
                const newH = Math.max(60, Math.min(window.innerHeight - 30, startH + deltaY));

                tile.style.width = `${newW}px`;
                tile.style.height = `${newH}px`;

                if (!this.positions[id]) this.positions[id] = {};
                this.positions[id].w = newW;
                this.positions[id].h = newH;
            });
        };

        const onResizeUp = (e) => {
            if (!isResizing) return;
            isResizing = false;
            if (resizeRafId) cancelAnimationFrame(resizeRafId);
            tile.classList.remove('tile-is-resizing');
            this.savePositions();
            soundFx.play('click');
            try { resizeHandle.releasePointerCapture(e.pointerId); } catch (err) {}
        };

        resizeHandle.onpointerdown = onResizeDown;
        resizeHandle.onpointermove = onResizeMove;
        resizeHandle.onpointerup = onResizeUp;
        resizeHandle.onpointercancel = onResizeUp;
    }
}
