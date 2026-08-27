// js/widgets.js - Modular Bento Widgets (Scratchpad Notes & Pomodoro Focus Timer)

import { state } from './state.js';
import { soundFx } from './audio.js';
import { i18nDictionaries } from './i18n.js';

export class WidgetsManager {
    constructor() {
        this.scratchpadText = localStorage.getItem('bento_scratchpad_notes') || localStorage.getItem('hades_scratchpad_content') || '';
        this.storageKey = 'hades_pomodoro_state_v1';
        this.pomodoroState = this.loadPomodoroState();
        this._timerId = null;
    }

    loadPomodoroState() {
        const defaultState = {
            duration: 25 * 60,
            remaining: 25 * 60,
            mode: 'focus', // 'focus' | 'break'
            isRunning: false,
            endTime: null
        };

        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return defaultState;

            const saved = JSON.parse(raw);
            if (!saved || typeof saved !== 'object') return defaultState;

            const mode = saved.mode === 'break' ? 'break' : 'focus';
            const duration = typeof saved.duration === 'number' && saved.duration > 0 ? saved.duration : (mode === 'break' ? 5 * 60 : 25 * 60);
            let remaining = typeof saved.remaining === 'number' && saved.remaining >= 0 ? saved.remaining : duration;
            let isRunning = !!saved.isRunning;
            let endTime = typeof saved.endTime === 'number' ? saved.endTime : null;

            if (isRunning && endTime) {
                const now = Date.now();
                if (now < endTime) {
                    remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
                } else {
                    // El temporizador concluyó mientras la pestaña estaba cerrada o inactiva
                    isRunning = false;
                    endTime = null;
                    if (mode === 'focus') {
                        return {
                            duration: 5 * 60,
                            remaining: 5 * 60,
                            mode: 'break',
                            isRunning: false,
                            endTime: null
                        };
                    } else {
                        return {
                            duration: 25 * 60,
                            remaining: 25 * 60,
                            mode: 'focus',
                            isRunning: false,
                            endTime: null
                        };
                    }
                }
            } else {
                isRunning = false;
                endTime = null;
            }

            return {
                duration,
                remaining,
                mode,
                isRunning,
                endTime
            };
        } catch (e) {
            return defaultState;
        }
    }

    savePomodoroState() {
        const { duration, remaining, mode, isRunning, endTime } = this.pomodoroState;
        state.setItem(this.storageKey, JSON.stringify({
            duration,
            remaining,
            mode,
            isRunning,
            endTime,
            savedAt: Date.now()
        }));
    }

    init() {
        this.bindScratchpad();
        this.bindPomodoro();
        state.on('language:changed', () => this.updateWidgetLocalization());

        // Manejar reactivación instantánea cuando la pestaña vuelve al primer plano (anti-throttle)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.pomodoroState.isRunning) {
                this.tick();
            }
        });

        window.addEventListener('beforeunload', () => {
            if (this.pomodoroState.isRunning && this.pomodoroState.endTime) {
                this.pomodoroState.remaining = Math.max(0, Math.ceil((this.pomodoroState.endTime - Date.now()) / 1000));
            }
            this.savePomodoroState();
        });
    }

    bindScratchpad() {
        const textarea = document.getElementById('scratchpad-input');
        if (!textarea) return;

        textarea.value = this.scratchpadText;
        textarea.addEventListener('input', () => {
            this.scratchpadText = textarea.value;
            state.setItem('bento_scratchpad_notes', this.scratchpadText);
            state.setItem('hades_scratchpad_content', this.scratchpadText);
        });
    }

    bindPomodoro() {
        const startBtn = document.getElementById('pomodoro-start-btn');
        const resetBtn = document.getElementById('pomodoro-reset-btn');

        if (!startBtn || !resetBtn) return;

        this.updatePomodoroDisplay();

        // Si estaba corriendo en la sesión anterior, reanudar timer
        if (this.pomodoroState.isRunning) {
            this.startPomodoro(true);
            startBtn.textContent = this.getLabel('pause');
        } else {
            startBtn.textContent = this.getLabel('start');
        }

        startBtn.addEventListener('click', () => {
            soundFx.play('click');
            if (this.pomodoroState.isRunning) {
                this.pausePomodoro();
                startBtn.textContent = this.getLabel('start');
            } else {
                this.startPomodoro();
                startBtn.textContent = this.getLabel('pause');
            }
        });

        resetBtn.addEventListener('click', () => {
            soundFx.play('click');
            this.resetPomodoro();
            startBtn.textContent = this.getLabel('start');
        });
    }

    tick() {
        if (!this.pomodoroState.isRunning) return;

        if (this.pomodoroState.endTime) {
            const now = Date.now();
            this.pomodoroState.remaining = Math.max(0, Math.ceil((this.pomodoroState.endTime - now) / 1000));
        } else {
            this.pomodoroState.remaining--;
        }

        const fm = window.focusMode;
        if (fm && fm.isActive) {
            fm.remainingSeconds = this.pomodoroState.remaining;
            fm.updateShieldTimer();
        }

        if (this.pomodoroState.remaining <= 0) {
            soundFx.play('chime');
            if (fm && fm.isActive && this.pomodoroState.mode === 'focus') {
                fm.deactivateFocus(true);
            }

            if (this.pomodoroState.mode === 'focus') {
                this.pomodoroState.mode = 'break';
                this.pomodoroState.duration = 5 * 60;
                this.pomodoroState.remaining = 5 * 60;
            } else {
                this.pomodoroState.mode = 'focus';
                this.pomodoroState.duration = 25 * 60;
                this.pomodoroState.remaining = 25 * 60;
            }

            // Al finalizar un ciclo, pausar para esperar que el usuario inicie el siguiente bloque
            this.pausePomodoro();
            const startBtn = document.getElementById('pomodoro-start-btn');
            if (startBtn) startBtn.textContent = this.getLabel('start');
        }

        this.updatePomodoroDisplay();
    }

    startPomodoro(isResume = false) {
        this.pomodoroState.isRunning = true;

        if (!isResume || !this.pomodoroState.endTime || this.pomodoroState.endTime <= Date.now()) {
            this.pomodoroState.endTime = Date.now() + (this.pomodoroState.remaining * 1000);
        }

        this.savePomodoroState();

        if (this._timerId) clearInterval(this._timerId);
        this._timerId = setInterval(() => this.tick(), 1000);
        this.updatePomodoroDisplay();
    }

    pausePomodoro() {
        this.pomodoroState.isRunning = false;
        if (this.pomodoroState.endTime) {
            this.pomodoroState.remaining = Math.max(0, Math.ceil((this.pomodoroState.endTime - Date.now()) / 1000));
            this.pomodoroState.endTime = null;
        }
        if (this._timerId) {
            clearInterval(this._timerId);
            this._timerId = null;
        }
        this.savePomodoroState();
        this.updatePomodoroDisplay();
    }

    resetPomodoro() {
        this.pausePomodoro();
        this.pomodoroState.mode = 'focus';
        this.pomodoroState.duration = 25 * 60;
        this.pomodoroState.remaining = 25 * 60;
        this.pomodoroState.endTime = null;
        this.savePomodoroState();
        this.updatePomodoroDisplay();
    }

    updatePomodoroDisplay() {
        const display = document.getElementById('pomodoro-time-display');
        const modeBadge = document.getElementById('pomodoro-mode-badge');
        const progressRing = document.getElementById('pomodoro-progress-circle');

        const m = Math.floor(this.pomodoroState.remaining / 60);
        const s = this.pomodoroState.remaining % 60;
        const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        if (display) display.textContent = timeStr;
        if (modeBadge) {
            modeBadge.textContent = this.pomodoroState.mode === 'focus' ? this.getLabel('focus') : this.getLabel('break');
            modeBadge.className = `pomodoro-badge ${this.pomodoroState.mode}`;
        }

        if (progressRing) {
            const total = this.pomodoroState.duration || (this.pomodoroState.mode === 'break' ? 5 * 60 : 25 * 60);
            const progress = total > 0 ? (total - this.pomodoroState.remaining) / total : 0;
            const circumference = 2 * Math.PI * 36;
            progressRing.style.strokeDasharray = `${circumference}`;
            progressRing.style.strokeDashoffset = `${circumference * (1 - progress)}`;
        }
    }

    getLabel(key) {
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).widgets || {};
        return t[`pomodoro_${key}`] || key;
    }

    updateWidgetLocalization() {
        this.updatePomodoroDisplay();
        const startBtn = document.getElementById('pomodoro-start-btn');
        if (startBtn) {
            startBtn.textContent = this.pomodoroState.isRunning ? this.getLabel('pause') : this.getLabel('start');
        }
        const resetBtn = document.getElementById('pomodoro-reset-btn');
        if (resetBtn) {
            resetBtn.textContent = this.getLabel('reset');
        }
    }
}

export const widgetsManager = new WidgetsManager();
