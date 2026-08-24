// js/radial-hud.js - Radial HUD Action Wheel (360° Gestural Quick Access)

import { state } from './state.js';
import { soundFx } from './audio.js';
import { ambientAudio } from './ambient-audio.js';
import { i18nDictionaries } from './i18n.js';

export class RadialHUDEngine {
    constructor() {
        this.hudOverlay = document.getElementById('radial-hud-overlay');
        this.hudWheel = document.getElementById('radial-hud-wheel');
        this.centerBadge = document.getElementById('radial-hud-center');
        this.isOpen = false;
        this.cursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.actions = [
            { id: 'favs', icon: '⭐', labelKey: 'favs', action: () => this.triggerFavs() },
            { id: 'audio', icon: '🎧', labelKey: 'audio', action: () => this.toggleAudio() },
            { id: 'pomodoro', icon: '⏳', labelKey: 'pomodoro', action: () => this.togglePomodoro() },
            { id: 'postit', icon: '📌', labelKey: 'postit', action: () => this.createPostitUnderCursor() },
            { id: 'theme', icon: '🌓', labelKey: 'theme', action: () => this.toggleTheme() },
            { id: 'qr', icon: '📱', labelKey: 'qr', action: () => this.openQRQuick() },
            { id: 'search', icon: '🔍', labelKey: 'search', action: () => this.focusOmnibox() },
            { id: 'settings', icon: '⚙️', labelKey: 'settings', action: () => this.openSettings() }
        ];
    }

    init() {
        this.renderRadialNodes();
        this.bindEvents();
    }

    renderRadialNodes() {
        if (!this.hudWheel) return;
        this.hudWheel.innerHTML = '';
        const radius = 125;
        const total = this.actions.length;
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).radial_hud || {};

        this.actions.forEach((act, idx) => {
            const angle = (idx * (360 / total) - 90) * (Math.PI / 180);
            const x = Math.round(radius * Math.cos(angle));
            const y = Math.round(radius * Math.sin(angle));

            const btn = document.createElement('button');
            btn.className = 'radial-node-btn';
            btn.setAttribute('data-action', act.id);
            btn.setAttribute('title', t[act.labelKey] || act.id);
            btn.style.setProperty('--node-x', `${x}px`);
            btn.style.setProperty('--node-y', `${y}px`);
            btn.innerHTML = `<span class="radial-node-icon">${act.icon}</span><span class="radial-node-label">${t[act.labelKey] || act.id}</span>`;

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                soundFx.play('click');
                act.action();
                this.close();
            });

            this.hudWheel.appendChild(btn);
        });
    }

    open(x, y) {
        soundFx.play('click');
        this.isOpen = true;
        this.cursorPos = { x, y };

        const pad = 140;
        const clampedX = Math.max(pad, Math.min(window.innerWidth - pad, x));
        const clampedY = Math.max(pad, Math.min(window.innerHeight - pad, y));

        if (this.hudWheel) {
            this.hudWheel.style.left = `${clampedX}px`;
            this.hudWheel.style.top = `${clampedY}px`;
        }

        if (this.hudOverlay) {
            this.hudOverlay.classList.remove('hidden');
            this.hudOverlay.setAttribute('aria-hidden', 'false');
        }
    }

    close() {
        if (!this.isOpen) return;
        soundFx.play('click');
        this.isOpen = false;
        if (this.hudOverlay) {
            this.hudOverlay.classList.add('hidden');
            this.hudOverlay.setAttribute('aria-hidden', 'true');
        }
    }

    toggle(x, y) {
        if (this.isOpen) this.close();
        else this.open(x, y);
    }

    triggerFavs() {
        const topSc = state.shortcuts[0];
        if (topSc && topSc.url) window.open(topSc.url, '_blank');
    }

    toggleAudio() {
        ambientAudio.togglePlay();
    }

    togglePomodoro() {
        const pomBtn = document.getElementById('pomodoro-start-btn');
        if (pomBtn) pomBtn.click();
    }

    createPostitUnderCursor() {
        const input = document.getElementById('scratchpad-input');
        const text = input ? input.value.trim() || 'Nota Rápida' : 'Nota Rápida';
        window.dispatchEvent(new CustomEvent('postit:create', {
            detail: { text, x: this.cursorPos.x, y: this.cursorPos.y }
        }));
    }

    toggleTheme() {
        const nextTheme = state.theme === 'cyber' ? 'light' : (state.theme === 'light' ? 'nebula' : 'cyber');
        state.setTheme(nextTheme);
    }

    openQRQuick() {
        const omnibox = document.getElementById('main-search') || document.getElementById('search-input');
        const query = omnibox ? omnibox.value.trim() : '';
        const url = query.startsWith('http') ? query : window.location.href;
        window.dispatchEvent(new CustomEvent('devtools:qr', { detail: { text: url } }));
    }

    focusOmnibox() {
        const omnibox = document.getElementById('main-search') || document.getElementById('search-input');
        if (omnibox) {
            omnibox.focus();
            omnibox.select();
        }
    }

    openSettings() {
        const btn = document.getElementById('settings-btn');
        if (btn) btn.click();
    }

    bindEvents() {
        // Middle click on background triggers radial HUD
        document.addEventListener('auxclick', (e) => {
            if (e.button === 1 && !e.target.closest('input, textarea, select, button, a')) {
                e.preventDefault();
                this.toggle(e.clientX, e.clientY);
            }
        });

        // Shortcut Alt + C or Alt + W triggers Radial HUD
        document.addEventListener('keydown', (e) => {
            if (e.altKey && (e.key === 'c' || e.key === 'C' || e.key === 'w' || e.key === 'W')) {
                e.preventDefault();
                this.toggle(window.innerWidth / 2, window.innerHeight / 2);
            }
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        if (this.hudOverlay) {
            this.hudOverlay.addEventListener('click', (e) => {
                if (e.target === this.hudOverlay || e.target === this.centerBadge) {
                    this.close();
                }
            });
        }

        state.on('language:changed', () => this.renderRadialNodes());
    }
}

export const radialHUD = new RadialHUDEngine();
