// js/dragdrop.js - Shortcut Cards Inner Drag & Drop Reordering

import { state } from './state.js';
import { soundFx } from './audio.js';

export class DragDropManager {
    constructor(renderer, layoutManager) {
        this.renderer = renderer;
        this.layoutManager = layoutManager;
        this.draggedCard = null;
    }

    init() {
        state.on('editmode:changed', (enabled) => {
            if (enabled) {
                this.enableCardDragDrop();
            } else {
                this.disableCardDragDrop();
            }
        });
    }

    enableCardDragDrop() {
        const cards = document.querySelectorAll('.enlace-icono');
        cards.forEach(card => {
            card.setAttribute('draggable', 'true');
            card.ondragstart = (e) => {
                e.stopPropagation();
                this.draggedCard = card;
                card.classList.add('dragging-card');
                soundFx.play('click');
                e.dataTransfer.effectAllowed = 'move';
            };

            card.ondragend = () => {
                if (this.draggedCard) this.draggedCard.classList.remove('dragging-card');
                this.draggedCard = null;
                this.saveShortcutsOrder();
                soundFx.play('click');
            };
        });

        const iconGrids = document.querySelectorAll('.iconos-grupo');
        iconGrids.forEach(grid => {
            grid.ondragover = (e) => {
                if (!this.draggedCard) return;
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                const afterElement = this.getCardAfterElement(grid, e.clientX, e.clientY);
                if (afterElement == null) {
                    grid.appendChild(this.draggedCard);
                } else {
                    grid.insertBefore(this.draggedCard, afterElement);
                }
            };

            grid.ondrop = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.saveShortcutsOrder();
                soundFx.play('click');
            };
        });
    }

    disableCardDragDrop() {
        const cards = document.querySelectorAll('.enlace-icono');
        cards.forEach(card => {
            card.removeAttribute('draggable');
            card.ondragstart = null;
            card.ondragend = null;
        });

        const iconGrids = document.querySelectorAll('.iconos-grupo');
        iconGrids.forEach(grid => {
            grid.ondragover = null;
            grid.ondrop = null;
        });
    }

    getCardAfterElement(container, x, y) {
        const draggableElements = [...container.querySelectorAll('.enlace-icono:not(.dragging-card)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = (x - box.left - box.width / 2) + (y - box.top - box.height / 2);
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    saveShortcutsOrder() {
        const updatedList = [];
        const categories = document.querySelectorAll('.categoria');
        categories.forEach(cat => {
            const catId = cat.getAttribute('data-cat-id');
            const cards = cat.querySelectorAll('.enlace-icono');
            cards.forEach(card => {
                const id = card.getAttribute('data-id');
                const existing = state.shortcuts.find(s => s.id === id);
                if (existing) {
                    updatedList.push({ ...existing, category: catId });
                }
            });
        });
        state.saveShortcuts(updatedList);
    }
}
