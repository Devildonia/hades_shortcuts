// js/postits.js - Floating Glass Post-it System

import { soundFx } from './audio.js';
import { persistJson } from './state.js';
import { escapeHtml, showToast } from './utils.js';
import { getTranslation } from './i18n.js';

// Paleta de papel del Bloc de Notas (colores de post-it real).
export const PAPER_COLORS = ['yellow', 'pink', 'green', 'blue', 'orange', 'purple'];

// Mapea el color de papel del widget al tema de los post-its flotantes.
export const PAPER_TO_POSTIT = {
    yellow: 'yellow',
    pink: 'magenta',
    green: 'emerald',
    blue: 'cyan',
    orange: 'orange',
    purple: 'purple'
};

export const PAPER_STORAGE_KEY = 'scratchpad_paper_color';

export class PostItManager {
    constructor() {
        this.container = null;
        this.postits = this.loadPostIts();
        this.MAX_Z_INDEX = 900;
        this.topZIndex = 100;
        this.colors = ['yellow', 'cyan', 'magenta', 'emerald', 'orange', 'purple'];
    }

    _bumpZIndex() {
        // Siempre por encima del máximo existente (incluye notas cargadas desde storage).
        const currentMax = this.postits.length
            ? Math.max(...this.postits.map(p => p.zIndex || 0))
            : 0;
        let base = Math.max(this.topZIndex, currentMax);
        if (base + 1 > this.MAX_Z_INDEX) {
            // Rebaseline preservando el orden relativo: 1..n. El nuevo máximo queda en n+1 (≤ 900).
            const order = [...this.postits].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
            order.forEach((p, i) => { p.zIndex = i + 1; });
            base = order.length;
        }
        base += 1;
        this.topZIndex = base;
        return base;
    }

    init() {
        this.container = document.getElementById('postits-canvas');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'postits-canvas';
            this.container.className = 'postits-canvas-container';
            document.body.appendChild(this.container);
        }

        // Bind Scratchpad "Fix Post-it" button
        const pinBtn = document.getElementById('create-postit-btn');
        const textarea = document.getElementById('scratchpad-input');

        if (pinBtn && textarea) {
            pinBtn.addEventListener('click', () => {
                const text = textarea.value.trim();
                if (text) {
                    // El post-it flotante hereda el color de papel elegido en el widget.
                    const paper = localStorage.getItem(PAPER_STORAGE_KEY);
                    this.createPostIt(text, null, null, PAPER_TO_POSTIT[paper] || 'yellow');
                    textarea.value = '';
                    localStorage.removeItem('bento_scratchpad_notes');
                } else {
                    textarea.focus();
                }
            });

            textarea.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    pinBtn.click();
                }
            });
        }

        // Global listener for postit creation from Tech Radar or Radial HUD
        window.addEventListener('postit:create', (e) => {
            if (e.detail && e.detail.text) {
                this.createPostIt(e.detail.text, e.detail.x, e.detail.y, e.detail.color);
            }
        });

        window.addEventListener('resize', () => this.reclampAll());

        this.renderAll();
    }

    reclampAll() {
        const maxX = Math.max(20, window.innerWidth - 260);
        const maxY = Math.max(80, window.innerHeight - 220);
        let changed = false;
        this.postits.forEach(note => {
            if (note.x > maxX || note.y > maxY) {
                note.x = Math.min(maxX, Math.max(20, note.x));
                note.y = Math.min(maxY, Math.max(80, note.y));
                const el = document.getElementById(note.id);
                if (el) {
                    el.style.left = `${note.x}px`;
                    el.style.top = `${note.y}px`;
                }
                changed = true;
            }
        });
        if (changed) this.savePostIts();
    }

    loadPostIts() {
        try {
            const saved = localStorage.getItem('glass_postits_v1');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [];
    }

    savePostIts() {
        persistJson('glass_postits_v1', this.postits);
    }

    setPostIts(newList) {
        this.postits = Array.isArray(newList) ? newList : [];
        this.savePostIts();
        this.renderAll();
    }

    reloadPostIts() {
        this.postits = this.loadPostIts();
        this.renderAll();
    }

    createPostIt(text, x = null, y = null, color = 'cyan') {
        if (this.postits.length >= 25) {
            soundFx.play('click');
            showToast(getTranslation('toasts.postit_limit') || 'You reached the 25 floating-note limit.', 'error');
            return;
        }
        soundFx.play('click');
        const offset = (this.postits.length * 28) % 240;
        const initialX = (x !== null && x !== undefined) ? Math.min(window.innerWidth - 260, Math.max(20, x)) : Math.min(window.innerWidth - 260, Math.max(20, 120 + offset));
        const initialY = (y !== null && y !== undefined) ? Math.min(window.innerHeight - 220, Math.max(80, y)) : Math.min(window.innerHeight - 220, Math.max(80, 160 + offset));
        const rotation = (Math.random() * 4 - 2).toFixed(1); // -2deg to +2deg

        const newNote = {
            id: 'postit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            text: text,
            x: initialX,
            y: initialY,
            color: color || 'cyan',
            rotation: parseFloat(rotation),
            zIndex: this._bumpZIndex(),
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        this.postits.push(newNote);
        this.savePostIts();
        this.renderSingle(newNote, true);
    }

    renderAll() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.postits.forEach(note => this.renderSingle(note, false));
    }

    renderSingle(note, isNew = false) {
        const el = document.createElement('div');
        el.className = `glass-postit color-${note.color} ${isNew ? 'postit-spawn-anim' : ''}`;
        el.id = note.id;
        el.style.left = `${note.x}px`;
        el.style.top = `${note.y}px`;
        el.style.zIndex = note.zIndex || 1000;
        el.style.transform = `rotate(${note.rotation || 0}deg)`;

        if (note.w) el.style.width = `${note.w}px`;
        if (note.h) el.style.height = `${note.h}px`;

        el.innerHTML = `
            <div class="postit-topbar">
                <span class="postit-time" title="Arrastrar el post-it desde cualquier punto">${escapeHtml(note.createdAt || '')}</span>
                <div class="postit-actions">
                    <button class="postit-color-btn" title="Cambiar color">🎨</button>
                    <button class="postit-delete-btn" title="Eliminar Post-it">✕</button>
                </div>
            </div>
            <div class="postit-body" contenteditable="true" spellcheck="false">${escapeHtml(note.text)}</div>
            <span class="postit-resize-handle" title="Redimensionar Post-it">↘</span>
        `;

        this.bindPostItInteractions(el, note);
        if (this.container) this.container.appendChild(el);
    }

    bindPostItInteractions(el, note) {
        // Bring to front on pointer down
        el.addEventListener('pointerdown', () => {
            note.zIndex = this._bumpZIndex();
            el.style.zIndex = note.zIndex;
        });

        // Content editable sync con debounce
        const bodyEl = el.querySelector('.postit-body');
        if (bodyEl) {
            bodyEl.addEventListener('input', () => {
                note.text = bodyEl.innerText;
                if (this._debounceTimer) clearTimeout(this._debounceTimer);
                this._debounceTimer = setTimeout(() => this.savePostIts(), 250);
            });
        }

        // Color toggle
        const colorBtn = el.querySelector('.postit-color-btn');
        if (colorBtn) {
            colorBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                soundFx.play('hover');
                const currentIndex = this.colors.indexOf(note.color);
                const nextColor = this.colors[(currentIndex + 1) % this.colors.length];
                el.classList.remove(`color-${note.color}`);
                note.color = nextColor;
                el.classList.add(`color-${note.color}`);
                this.savePostIts();
            });
        }

        // Delete button
        const deleteBtn = el.querySelector('.postit-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                soundFx.play('click');
                el.classList.add('postit-delete-anim');
                setTimeout(() => {
                    this.postits = this.postits.filter(n => n.id !== note.id);
                    this.savePostIts();
                    el.remove();
                }, 220);
            });
        }

        // Universal Freeform Smooth Dragging (Click anywhere on the postit)
        let isDragging = false;
        let startX = 0, startY = 0;
        let elemInitialX = 0, elemInitialY = 0;
        let hasMoved = false;

        const onPointerDown = (e) => {
            if (e.target.closest('.postit-actions, .postit-resize-handle')) return;
            // If clicking directly into body to edit, allow editing without forcing drag unless moved
            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            elemInitialX = el.offsetLeft;
            elemInitialY = el.offsetTop;
            try { el.setPointerCapture(e.pointerId); } catch (err) {}
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            if (!hasMoved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
                hasMoved = true;
                el.classList.add('is-dragging-postit');
                soundFx.play('hover');
            }

            if (hasMoved) {
                let newX = elemInitialX + deltaX;
                let newY = elemInitialY + deltaY;

                // Constrain within viewport bounds
                const maxX = window.innerWidth - el.offsetWidth - 10;
                const maxY = window.innerHeight - el.offsetHeight - 10;
                newX = Math.max(10, Math.min(maxX, newX));
                newY = Math.max(10, Math.min(maxY, newY));

                el.style.left = `${newX}px`;
                el.style.top = `${newY}px`;
                note.x = newX;
                note.y = newY;
            }
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (hasMoved) {
                el.classList.remove('is-dragging-postit');
                this.savePostIts();
                soundFx.play('click');
            }
            try { el.releasePointerCapture(e.pointerId); } catch (err) {}
        };

        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', onPointerUp);
        el.addEventListener('pointercancel', onPointerUp);

        // Redimensión por la esquina (↘): tamaño persistido en la nota.
        const resizeHandle = el.querySelector('.postit-resize-handle');
        if (resizeHandle) {
            let isResizing = false;
            let startClientX = 0, startClientY = 0, startW = 0, startH = 0;

            const onResizeDown = (e) => {
                if (e.button !== undefined && e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation(); // no arrastra el post-it de fondo
                isResizing = true;
                startClientX = e.clientX;
                startClientY = e.clientY;
                startW = el.offsetWidth;
                startH = el.offsetHeight;
                resizeHandle.classList.add('is-resizing');
                try { resizeHandle.setPointerCapture(e.pointerId); } catch (err) {}
            };

            const onResizeMove = (e) => {
                if (!isResizing) return;
                const MIN_W = 150, MIN_H = 110;
                const maxW = Math.max(MIN_W, window.innerWidth - 16);
                const maxH = Math.max(MIN_H, window.innerHeight - 16);
                const w = Math.max(MIN_W, Math.min(maxW, startW + (e.clientX - startClientX)));
                const h = Math.max(MIN_H, Math.min(maxH, startH + (e.clientY - startClientY)));
                el.style.width = `${w}px`;
                el.style.height = `${h}px`;
                note.w = w;
                note.h = h;
            };

            const onResizeUp = (e) => {
                if (!isResizing) return;
                isResizing = false;
                resizeHandle.classList.remove('is-resizing');
                this.savePostIts();
                soundFx.play('click');
                try { resizeHandle.releasePointerCapture(e.pointerId); } catch (err) {}
            };

            resizeHandle.addEventListener('pointerdown', onResizeDown);
            resizeHandle.addEventListener('pointermove', onResizeMove);
            resizeHandle.addEventListener('pointerup', onResizeUp);
            resizeHandle.addEventListener('pointercancel', onResizeUp);
        }
    }
}
