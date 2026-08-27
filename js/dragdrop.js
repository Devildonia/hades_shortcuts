// js/dragdrop.js - Shortcut Cards Inner Drag & Drop Reordering
//
// Design notes:
// - Event delegation on the grid container so handlers survive renderer.render().
// - After every dashboard:rendered (while edit mode is on) we re-stamp draggable.
// - saveShortcutsOrder() MERGES the DOM order into the full state.shortcuts list;
//   shortcuts not present in the DOM (e.g. categories hidden by the active Space)
//   are preserved. Never replace the list with "only what's on screen".

import { state } from './state.js';
import { soundFx } from './audio.js';

export class DragDropManager {
    constructor() {
        this.draggedCard = null;
        this.grid = document.getElementById('zone-grid') || document.getElementById('shortcuts-grid');
        this._delegated = false;
        this._saving = false;
    }

    init() {
        this.bindDelegatedEvents();

        state.on('editmode:changed', (enabled) => {
            // Render listeners also react to this event; stamp attributes after the DOM rebuild.
            queueMicrotask(() => this.syncDraggableAttributes(!!enabled));
        });

        // Canonical post-render hook (emitted by DashboardRenderer.render).
        state.on('dashboard:rendered', () => {
            if (state.editMode) this.syncDraggableAttributes(true);
        });
    }

    bindDelegatedEvents() {
        if (!this.grid || this._delegated) return;
        this._delegated = true;

        this.grid.addEventListener('dragstart', (e) => {
            if (!state.editMode) return;
            const card = e.target.closest?.('.enlace-icono');
            if (!card || !this.grid.contains(card)) return;
            if (e.target.closest?.('.card-action-btn')) {
                e.preventDefault();
                return;
            }

            e.stopPropagation();
            this.draggedCard = card;
            card.classList.add('dragging-card');
            soundFx.play('click');
            e.dataTransfer.effectAllowed = 'move';
            try {
                e.dataTransfer.setData('text/plain', card.getAttribute('data-id') || '');
            } catch (_) { /* IE / locked DT */ }
        });

        this.grid.addEventListener('dragend', () => {
            if (!this.draggedCard) return;
            this.draggedCard.classList.remove('dragging-card');
            this.draggedCard = null;
            // Persist once here (not also on drop) to avoid a mid-gesture re-render.
            this.saveShortcutsOrder();
            soundFx.play('click');
        });

        this.grid.addEventListener('dragover', (e) => {
            if (!state.editMode || !this.draggedCard) return;
            const iconGrid = e.target.closest?.('.iconos-grupo');
            if (!iconGrid || !this.grid.contains(iconGrid)) return;

            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';

            const afterElement = this.getCardAfterElement(iconGrid, e.clientX, e.clientY);
            if (afterElement == null) {
                iconGrid.appendChild(this.draggedCard);
            } else if (afterElement !== this.draggedCard) {
                iconGrid.insertBefore(this.draggedCard, afterElement);
            }
        });

        this.grid.addEventListener('drop', (e) => {
            if (!state.editMode || !this.draggedCard) return;
            e.preventDefault();
            e.stopPropagation();
            // Order is committed on dragend.
        });
    }

    syncDraggableAttributes(enabled) {
        document.querySelectorAll('.enlace-icono').forEach((card) => {
            if (enabled) card.setAttribute('draggable', 'true');
            else card.removeAttribute('draggable');
        });
    }

    getCardAfterElement(container, x, y) {
        // Only use visible cards as drop anchors so filtered-out siblings don't skew placement.
        const draggableElements = [...container.querySelectorAll('.enlace-icono:not(.dragging-card)')]
            .filter((el) => !el.classList.contains('hidden-by-filter') && !el.classList.contains('no-match'));

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = (x - box.left - box.width / 2) + (y - box.top - box.height / 2);
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Rebuild the shortcut list from the current DOM order WITHOUT dropping items
     * that are not rendered (other Spaces' categories, empty cats, etc.).
     */
    saveShortcutsOrder() {
        if (this._saving) return;
        const previous = Array.isArray(state.shortcuts) ? state.shortcuts : [];
        if (!previous.length) return;

        const byId = new Map(previous.map((s) => [s.id, s]));
        const seen = new Set();
        const updatedList = [];

        document.querySelectorAll('.categoria').forEach((cat) => {
            const catId = cat.getAttribute('data-cat-id');
            cat.querySelectorAll('.enlace-icono').forEach((card) => {
                const id = card.getAttribute('data-id');
                if (!id || seen.has(id)) return;
                const existing = byId.get(id);
                if (!existing) return;
                updatedList.push({ ...existing, category: catId });
                seen.add(id);
            });
        });

        // Keep every shortcut that was not on screen, in its prior relative order.
        for (const shortcut of previous) {
            if (!seen.has(shortcut.id)) updatedList.push(shortcut);
        }

        if (this.isSameOrder(previous, updatedList)) return;

        this._saving = true;
        try {
            state.saveShortcuts(updatedList);
        } finally {
            this._saving = false;
        }
    }

    isSameOrder(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i].id !== b[i].id || a[i].category !== b[i].category) return false;
        }
        return true;
    }
}
