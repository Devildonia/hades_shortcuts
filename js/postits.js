// js/postits.js - Floating Glass Post-it System

import { soundFx } from './audio.js';
import { escapeHtml, persistJson, showToast } from './state.js';
import { getTranslation } from './i18n.js';

export class PostItManager {
    constructor() {
        this.container = null;
        this.postits = this.loadPostIts();
        this.topZIndex = 1000;
        this.colors = ['cyan', 'yellow', 'magenta', 'emerald'];
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
                    this.createPostIt(text);
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
            zIndex: ++this.topZIndex,
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

        el.innerHTML = `
            <div class="postit-topbar">
                <span class="postit-pin-grip" title="Arrastrar Post-it">📌</span>
                <span class="postit-time">${escapeHtml(note.createdAt || '')}</span>
                <div class="postit-actions">
                    <button class="postit-color-btn" title="Cambiar color">🎨</button>
                    <button class="postit-delete-btn" title="Eliminar Post-it">✕</button>
                </div>
            </div>
            <div class="postit-body" contenteditable="true" spellcheck="false">${escapeHtml(note.text)}</div>
        `;

        this.bindPostItInteractions(el, note);
        this.container.appendChild(el);
    }

    bindPostItInteractions(el, note) {
        // Bring to front on pointer down
        el.addEventListener('pointerdown', () => {
            note.zIndex = ++this.topZIndex;
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
            if (e.target.closest('.postit-actions')) return;
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
    }
}
