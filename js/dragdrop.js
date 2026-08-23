// js/dragdrop.js - Native HTML5 Drag & Drop for Categories & Icons

import { state } from './state.js';

export class DragDropManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.draggedCard = null;
        this.draggedCategory = null;
    }

    init() {
        state.on('editmode:changed', (enabled) => {
            this.renderer.render();
            if (enabled) {
                this.enableDragDrop();
            }
        });
    }

    enableDragDrop() {
        const categories = document.querySelectorAll('.categoria');
        const cards = document.querySelectorAll('.enlace-icono');

        // Category Drag & Drop
        categories.forEach(cat => {
            const handle = cat.querySelector('.cat-drag-handle');
            if (handle) {
                handle.setAttribute('draggable', 'true');
                handle.addEventListener('dragstart', (e) => {
                    this.draggedCategory = cat;
                    cat.classList.add('dragging-cat');
                    e.dataTransfer.effectAllowed = 'move';
                });
                handle.addEventListener('dragend', () => {
                    if (this.draggedCategory) this.draggedCategory.classList.remove('dragging-cat');
                    this.draggedCategory = null;
                    this.saveCategoryOrder();
                });
            }

            cat.addEventListener('dragover', (e) => {
                if (!this.draggedCategory || this.draggedCategory === cat) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const grid = cat.parentElement;
                const nextSibling = (e.clientY > cat.getBoundingClientRect().top + cat.offsetHeight / 2) ? cat.nextSibling : cat;
                grid.insertBefore(this.draggedCategory, nextSibling);
            });
        });

        // Icon Card Drag & Drop
        cards.forEach(card => {
            card.setAttribute('draggable', 'true');
            card.addEventListener('dragstart', (e) => {
                this.draggedCard = card;
                card.classList.add('dragging-card');
                e.dataTransfer.effectAllowed = 'move';
            });

            card.addEventListener('dragend', () => {
                if (this.draggedCard) this.draggedCard.classList.remove('dragging-card');
                this.draggedCard = null;
                this.saveShortcutsOrder();
            });
        });

        const grids = document.querySelectorAll('.iconos-grupo');
        grids.forEach(grid => {
            grid.addEventListener('dragover', (e) => {
                if (!this.draggedCard) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const afterElement = this.getDragAfterElement(grid, e.clientX, e.clientY);
                if (afterElement == null) {
                    grid.appendChild(this.draggedCard);
                } else {
                    grid.insertBefore(this.draggedCard, afterElement);
                }
            });
        });
    }

    getDragAfterElement(container, x, y) {
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

    saveCategoryOrder() {
        const catEls = document.querySelectorAll('.categoria');
        const catIds = Array.from(catEls).map(el => el.getAttribute('data-cat-id')).filter(Boolean);
        state.saveCategoriesOrder(catIds);
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
