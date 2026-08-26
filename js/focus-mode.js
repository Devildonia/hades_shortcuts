import { i18nDictionaries, getTranslation } from './i18n.js';
// js/focus-mode.js - Deep Work Focus Mode & Zen Distraction Shield

import { state, persistJson, showToast, openSafeUrl } from './state.js';
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
        persistJson(this.storageKey, this.config);
    }

    getSharedRemaining() {
        const wm = window.widgetsManager;
        if (wm && wm.pomodoroState) return wm.pomodoroState.remaining;
        return this.remainingSeconds;
    }

    activateFocus(durationMinutes = 25) {
        if (this.isActive) return;
        this.isActive = true;
        soundFx.play('chime');

        document.body.classList.add('focus-mode-active');
        state.emit('focus:activated', { duration: durationMinutes });

        const wm = window.widgetsManager;
        if (wm && wm.pomodoroState) {
            if (!wm.pomodoroState.isRunning) {
                wm.pomodoroState.mode = 'focus';
                wm.pomodoroState.duration = durationMinutes * 60;
                wm.pomodoroState.remaining = durationMinutes * 60;
                wm.startPomodoro();
            }
            this.remainingSeconds = wm.pomodoroState.remaining;
            const startBtn = document.getElementById('pomodoro-start-btn');
            if (startBtn) startBtn.textContent = wm.getLabel('pause');
            wm.updatePomodoroDisplay();
        } else {
            this.remainingSeconds = durationMinutes * 60;
            clearInterval(this.timerId);
            this.timerId = setInterval(() => {
                this.remainingSeconds--;
                this.updateShieldTimer();
                if (this.remainingSeconds <= 0) this.deactivateFocus(true);
            }, 1000);
        }

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
            showToast(getTranslation('toasts.focus_complete') || 'Deep Work session complete.', 'success');
        } else {
            soundFx.play('click');
            const wm = window.widgetsManager;
            if (wm && wm.pomodoroState && wm.pomodoroState.isRunning) {
                wm.pausePomodoro();
                const startBtn = document.getElementById('pomodoro-start-btn');
                if (startBtn) startBtn.textContent = wm.getLabel('start');
            }
        }

        state.emit('focus:deactivated', { completed });
        this.updateUI();
    }

    toggleFocus() {
        if (this.isActive) this.deactivateFocus();
        else this.activateFocus();
    }

    openUrl(url, target = '_blank') {
        if (this.isUrlBlocked(url)) {
            this.showZenShield(url);
            return false;
        }
        return openSafeUrl(url, target);
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
            const secs = Math.max(0, this.getSharedRemaining());
            const m = Math.floor(secs / 60).toString().padStart(2, '0');
            const s = (secs % 60).toString().padStart(2, '0');
            timeEl.textContent = `${m}:${s}`;
        }
    }

    updateUI() {
        const focusBtn = document.getElementById('focus-mode-toggle-btn');
        if (focusBtn) {
            focusBtn.classList.toggle('active', this.isActive);
            const lang = state.language || 'es';
            const dict = i18nDictionaries[lang] || i18nDictionaries['es'] || {};
            const label = this.isActive
                ? (dict.nav?.focus_active || 'Focus Activo')
                : (dict.nav?.focus_mode || 'Modo Focus');
            focusBtn.innerHTML = `<span>${label}</span>`;
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
                if (target) openSafeUrl(target, '_blank');
            };
        }
        if (focusBtn) focusBtn.onclick = () => this.toggleFocus();

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

        document.addEventListener('keydown', (e) => {
            if (e.altKey && (e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                this.toggleFocus();
            }
        });

        state.on('language:changed', () => this.updateUI());
        this.updateUI();
    }
}

export const focusMode = new FocusModeEngine();
