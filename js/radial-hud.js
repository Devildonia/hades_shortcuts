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
            { id: 'favs', icon: '⭐', labelKey: 'favs', action: () => this.toggleFavsSubOrbit() },
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

            const btn = document.createElement('div');
            btn.className = `radial-node-btn radial-node-${act.id}`;
            btn.setAttribute('data-action', act.id);
            btn.setAttribute('title', t[act.labelKey] || act.id);
            btn.style.setProperty('--node-x', `${x}px`);
            btn.style.setProperty('--node-y', `${y}px`);
            btn.innerHTML = `<span class="radial-node-icon">${act.icon}</span><span class="radial-node-label">${t[act.labelKey] || act.id}</span>`;

            if (act.id === 'favs') {
                this.renderFavoritesSubOrbit(btn);
            }

            btn.addEventListener('click', (e) => {
                if (e.target.closest('.radial-sub-fav-item')) return;
                e.stopPropagation();
                soundFx.play('click');
                act.action();
                if (act.id !== 'favs') this.close();
            });

            this.hudWheel.appendChild(btn);
        });
    }

    getMostUsedShortcuts() {
        let stats = {};
        try {
            stats = JSON.parse(localStorage.getItem('shortcut_usage_stats_v1') || '{}');
        } catch (e) {}

        const all = [...(state.shortcuts || [])];
        
        // Sort by recorded click count descending
        all.sort((a, b) => {
            const countA = stats[a.id] || 0;
            const countB = stats[b.id] || 0;
            return countB - countA;
        });

        // If no usage recorded yet, pick the most universally popular icons
        const popularIds = ['google', 'youtube', 'chatgpt', 'github', 'claude'];
        const top3 = [];
        
        // Check if we have user clicks
        const hasClicks = Object.values(stats).some(v => v > 0);
        if (hasClicks) {
            return all.slice(0, 3);
        }

        // Fresh default popular items
        popularIds.forEach(id => {
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
        const offsets = [
            { x: -44, y: -58 },
            { x: 0, y: -74 },
            { x: 44, y: -58 }
        ];

        top3.forEach((sc, i) => {
            const pos = offsets[i] || { x: 0, y: -50 };
            const subBtn = document.createElement('button');
            subBtn.className = 'radial-sub-fav-item';
            subBtn.title = sc.title || 'Favorito';
            subBtn.style.setProperty('--sub-x', `${pos.x}px`);
            subBtn.style.setProperty('--sub-y', `${pos.y}px`);

            const iconSrc = sc.icon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(sc.url)}&sz=64`;
            subBtn.innerHTML = `<img src="${iconSrc}" class="radial-sub-icon-img" alt="${sc.title}" onerror="this.src='iconos/google.webp'"><span class="radial-sub-fav-tooltip">${sc.title}</span>`;

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

    toggleFavsSubOrbit() {
        const topSc = state.shortcuts[0];
        if (topSc && topSc.url) window.open(topSc.url, '_blank');
        this.close();
    }

    toggleAudio() {
        ambientAudio.toggle();
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
        state.on('shortcuts:changed', () => this.renderRadialNodes());
    }
}

export const radialHUD = new RadialHUDEngine();
