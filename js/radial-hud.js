// js/radial-hud.js - Radial HUD Action Wheel (360° Gestural Quick Access)

import { state, escapeHtml, bindIconFallback, faviconForUrl } from './state.js';
import { soundFx } from './audio.js';
import { ambientAudio } from './ambient-audio.js';
import { i18nDictionaries } from './i18n.js';
import { personalAnalytics } from './personal-analytics.js';

export class RadialHUDEngine {
    constructor() {
        this.hudOverlay = document.getElementById('radial-hud-overlay');
        this.hudWheel = document.getElementById('radial-hud-wheel');
        this.centerBadge = document.getElementById('radial-hud-center');
        this.isOpen = false;
        this.cursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.previousActiveElement = null;
        this.actions = [
            { id: 'favs', icon: '⭐', labelKey: 'favs', action: () => this.toggleFavsSubOrbit() },
            { id: 'audio', icon: '🎧', labelKey: 'audio', action: () => ambientAudio.toggle() },
            { id: 'pomodoro', icon: '⏳', labelKey: 'pomodoro', action: () => document.getElementById('pomodoro-start-btn')?.click() },
            { id: 'postit', icon: '📌', labelKey: 'postit', action: () => this.createPostitUnderCursor() },
            { id: 'theme', icon: '🌓', labelKey: 'theme', action: () => state.setTheme(state.theme === 'cyber' ? 'light' : (state.theme === 'light' ? 'nebula' : 'cyber')) },
            { id: 'qr', icon: '📱', labelKey: 'qr', action: () => this.openQRQuick() },
            { id: 'search', icon: '🔍', labelKey: 'search', action: () => this.focusOmnibox() },
            { id: 'settings', icon: '⚙️', labelKey: 'settings', action: () => document.getElementById('settings-btn')?.click() }
        ];
    }

    init() {
        this.renderRadialNodes();
        this.bindEvents();
    }

    renderRadialNodes() {
        if (!this.hudWheel) return;
        this.hudWheel.innerHTML = '';
        const radius = 125, total = this.actions.length;
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).radial_hud || {};

        this.actions.forEach((act, idx) => {
            const angle = (idx * (360 / total) - 90) * (Math.PI / 180);
            const x = Math.round(radius * Math.cos(angle)), y = Math.round(radius * Math.sin(angle));
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `radial-node-btn radial-node-${act.id}`;
            btn.setAttribute('tabindex', '0');
            btn.setAttribute('role', 'button');
            btn.setAttribute('aria-label', t[act.labelKey] || act.id);
            btn.setAttribute('data-action', act.id);
            btn.setAttribute('title', t[act.labelKey] || act.id);
            btn.style.setProperty('--node-x', `${x}px`);
            btn.style.setProperty('--node-y', `${y}px`);
            btn.innerHTML = `<span class="radial-node-icon">${act.icon}</span><span class="radial-node-label">${t[act.labelKey] || act.id}</span>`;

            if (act.id === 'favs') this.renderFavoritesSubOrbit(btn);

            btn.addEventListener('click', (e) => {
                if (e.target.closest('.radial-sub-fav-item')) return;
                e.stopPropagation();
                soundFx.play('click');
                act.action();
                if (act.id !== 'favs') this.close();
            });

            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
            this.hudWheel.appendChild(btn);
        });
    }

    getMostUsedShortcuts() {
        const stats = (personalAnalytics && personalAnalytics.data && personalAnalytics.data.shortcutCounts) || {};
        const all = [...(state.shortcuts || [])];
        all.sort((a, b) => (stats[b.id] || 0) - (stats[a.id] || 0));

        if (Object.values(stats).some(v => v > 0)) return all.slice(0, 3);

        const popular = ['google', 'youtube', 'chatgpt', 'github', 'claude'];
        const top3 = [];
        popular.forEach(id => {
            if (top3.length < 3) {
                const found = all.find(s => s.id === id || s.title.toLowerCase().includes(id));
                if (found && !top3.includes(found)) top3.push(found);
            }
        });
        while (top3.length < 3 && all.length > top3.length) {
            const next = all.find(s => !top3.includes(s));
            if (next) top3.push(next);
        }
        return top3.slice(0, 3);
    }

    renderFavoritesSubOrbit(parentBtn) {
        const subContainer = document.createElement('div');
        subContainer.className = 'radial-sub-favs';
        const top3 = this.getMostUsedShortcuts();
        const offsets = [{ x: -44, y: -58 }, { x: 0, y: -74 }, { x: 44, y: -58 }];

        top3.forEach((sc, i) => {
            const pos = offsets[i] || { x: 0, y: -50 };
            const subBtn = document.createElement('button');
            subBtn.className = 'radial-sub-fav-item';
            subBtn.title = sc.title || 'Favorito';
            subBtn.style.setProperty('--sub-x', `${pos.x}px`);
            subBtn.style.setProperty('--sub-y', `${pos.y}px`);
            const iconSrc = sc.icon && (sc.icon.startsWith('http') || sc.icon.startsWith('data:')) ? sc.icon : faviconForUrl(sc.url);
            const img = document.createElement('img');
            img.className = 'radial-sub-icon-img';
            img.alt = sc.title || '';
            img.src = sc.icon || iconSrc;
            bindIconFallback(img, sc);
            const tip = document.createElement('span');
            tip.className = 'radial-sub-fav-tooltip';
            tip.textContent = sc.title || '';
            subBtn.appendChild(img);
            subBtn.appendChild(tip);
            subBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                soundFx.play('click');
                window.open(sc.url, '_blank');
                this.close();
            });
            subContainer.appendChild(subBtn);
        });
        parentBtn.appendChild(subContainer);
    }

    open(x, y) {
        soundFx.play('click');
        this.isOpen = true;
        this.cursorPos = { x, y };
        this.previousActiveElement = document.activeElement;
        const pad = 150;
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
        setTimeout(() => {
            const firstBtn = this.hudWheel ? this.hudWheel.querySelector('.radial-node-btn, button') : null;
            if (firstBtn) firstBtn.focus();
        }, 50);
    }

    close() {
        if (!this.isOpen) return;
        soundFx.play('click');
        this.isOpen = false;
        if (this.hudOverlay) {
            this.hudOverlay.classList.add('hidden');
            this.hudOverlay.setAttribute('aria-hidden', 'true');
        }
        if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
            this.previousActiveElement.focus();
        }
    }

    toggle(x, y) {
        this.isOpen ? this.close() : this.open(x, y);
    }

    toggleFavsSubOrbit() {
        const topSc = this.getMostUsedShortcuts()[0] || state.shortcuts[0];
        if (topSc && topSc.url) window.open(topSc.url, '_blank');
        this.close();
    }

    createPostitUnderCursor() {
        const input = document.getElementById('scratchpad-input');
        const text = input ? input.value.trim() || 'Nota Rápida' : 'Nota Rápida';
        window.dispatchEvent(new CustomEvent('postit:create', { detail: { text, x: this.cursorPos.x, y: this.cursorPos.y } }));
    }

    openQRQuick() {
        const omnibox = document.getElementById('main-search') || document.getElementById('search-input');
        if (omnibox) {
            omnibox.value = '!qr ';
            omnibox.focus();
            omnibox.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    focusOmnibox() {
        const omnibox = document.getElementById('main-search') || document.getElementById('search-input');
        if (omnibox) {
            omnibox.focus();
            omnibox.select();
        }
    }

    bindEvents() {
        document.addEventListener('auxclick', (e) => {
            if (e.button === 1 && !e.target.closest('input, textarea, select, button, a')) {
                e.preventDefault();
                this.toggle(e.clientX, e.clientY);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.altKey && (e.key === 'c' || e.key === 'C' || e.key === 'w' || e.key === 'W')) {
                e.preventDefault();
                this.toggle(window.innerWidth / 2, window.innerHeight / 2);
                return;
            }
            if (this.isOpen) {
                if (e.key === 'Escape') {
                    this.close();
                    return;
                }
                if (e.key === 'Tab') {
                    const focusables = Array.from(this.hudWheel ? this.hudWheel.querySelectorAll('.radial-node-btn, .radial-sub-fav-item, button:not([disabled]), [tabindex="0"]') : []);
                    if (focusables.length > 0) {
                        const first = focusables[0], last = focusables[focusables.length - 1];
                        const activeEl = document.activeElement;
                        if (!focusables.includes(activeEl)) {
                            e.preventDefault();
                            (e.shiftKey ? last : first).focus();
                        } else if (e.shiftKey && activeEl === first) {
                            e.preventDefault();
                            last.focus();
                        } else if (!e.shiftKey && activeEl === last) {
                            e.preventDefault();
                            first.focus();
                        }
                    }
                }
            }
        });

        if (this.hudOverlay) {
            this.hudOverlay.addEventListener('click', (e) => {
                if (e.target === this.hudOverlay || e.target === this.centerBadge) this.close();
            });
        }

        state.on('language:changed', () => this.renderRadialNodes());
        state.on('shortcuts:changed', () => this.renderRadialNodes());
    }
}

export const radialHUD = new RadialHUDEngine();
