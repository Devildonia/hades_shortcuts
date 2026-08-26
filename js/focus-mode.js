// js/focus-mode.js - Deep Work Focus Mode & Zen Distraction Shield

import { state } from './state.js';
import { soundFx } from './audio.js';

export class FocusModeEngine {
    constructor() {
        this.storageKey = 'hades_focus_config_v1';
        this.config = this.loadConfig();
        this.isActive = false;
        this.remainingSeconds = 25 * 60;
        this.timerId = null;
        this.shieldScreen = document.getElementById('zen-shield-screen');
        this.blockedAttemptUrl = '';
    }

    loadConfig() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {
            focusCategory: 'ia_3d',
            blockedDomains: ['twitter.com', 'x.com', 'instagram.com', 'reddit.com', 'tiktok.com', 'youtube.com', 'facebook.com'],
            dimBackground: true,
            pauseRadar: true
        };
    }

    saveConfig() {
        try { localStorage.setItem(this.storageKey, JSON.stringify(this.config)); } catch (e) {}
    }

    activateFocus(durationMinutes = 25) {
        if (this.isActive) return;
        this.isActive = true;
        this.remainingSeconds = durationMinutes * 60;
        soundFx.play('chime');

        document.body.classList.add('focus-mode-active');
        state.emit('focus:activated', { duration: durationMinutes });

        // Timer interval
        clearInterval(this.timerId);
        this.timerId = setInterval(() => {
            this.remainingSeconds--;
            this.updateShieldTimer();
            if (this.remainingSeconds <= 0) {
                this.deactivateFocus(true);
            }
        }, 1000);

        this.updateUI();
    }

    deactivateFocus(completed = false) {
        if (!this.isActive) return;
        this.isActive = false;
        clearInterval(this.timerId);
        document.body.classList.remove('focus-mode-active');
        this.hideZenShield();

        if (completed) {
            soundFx.play('chime');
            alert('🎉 ¡Sesión de Deep Work completada con éxito! Tómate un respiro.');
        } else {
            soundFx.play('click');
        }

        state.emit('focus:deactivated', { completed });
        this.updateUI();
    }

    toggleFocus() {
        if (this.isActive) this.deactivateFocus();
        else this.activateFocus();
    }

    isUrlBlocked(url) {
        if (!url || !this.isActive) return false;
        const lower = url.toLowerCase();
        return this.config.blockedDomains.some(d => lower.includes(d));
    }

    showZenShield(attemptedUrl = '') {
        this.blockedAttemptUrl = attemptedUrl;
        soundFx.play('click');
        if (this.shieldScreen) {
            this.shieldScreen.classList.remove('hidden');
            this.updateShieldTimer();
        }
    }

    hideZenShield() {
        if (this.shieldScreen) this.shieldScreen.classList.add('hidden');
        this.blockedAttemptUrl = '';
    }

    updateShieldTimer() {
        const timeEl = document.getElementById('zen-shield-timer-val');
        if (timeEl) {
            const m = Math.floor(this.remainingSeconds / 60).toString().padStart(2, '0');
            const s = (this.remainingSeconds % 60).toString().padStart(2, '0');
            timeEl.textContent = `${m}:${s}`;
        }
    }

    updateUI() {
        const focusBtn = document.getElementById('focus-mode-toggle-btn');
        if (focusBtn) {
            focusBtn.classList.toggle('active', this.isActive);
            focusBtn.textContent = this.isActive ? '🧘 Focus Activo' : '🧘 Focus Mode';
        }
    }

    init() {
        this.shieldScreen = document.getElementById('zen-shield-screen');
        const closeShieldBtn = document.getElementById('zen-shield-return-btn');
        const allowOnceBtn = document.getElementById('zen-shield-allow-btn');
        const focusBtn = document.getElementById('focus-mode-toggle-btn');

        if (closeShieldBtn) closeShieldBtn.onclick = () => this.hideZenShield();
        if (allowOnceBtn) {
            allowOnceBtn.onclick = () => {
                const target = this.blockedAttemptUrl;
                this.hideZenShield();
                if (target) window.open(target, '_blank');
            };
        }
        if (focusBtn) focusBtn.onclick = () => this.toggleFocus();

        // Intercept link clicks on document
        document.addEventListener('click', (e) => {
            if (!this.isActive) return;
            const a = e.target.closest('a');
            if (a && a.href) {
                if (this.isUrlBlocked(a.href)) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showZenShield(a.href);
                }
            }
        }, true);

        // Global hotkey Alt+F
        document.addEventListener('keydown', (e) => {
            if (e.altKey && (e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                this.toggleFocus();
            }
        });
    }
}

export const focusMode = new FocusModeEngine();
