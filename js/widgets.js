// js/widgets.js - Modular Bento Widgets (Scratchpad Notes & Pomodoro Focus Timer)

import { state } from './state.js';
import { soundFx } from './audio.js';
import { i18nDictionaries } from './i18n.js';

export class WidgetsManager {
    constructor() {
        this.scratchpadText = localStorage.getItem('bento_scratchpad_notes') || localStorage.getItem('hades_scratchpad_content') || '';
        this.pomodoroState = {
            duration: 25 * 60,
            remaining: 25 * 60,
            mode: 'focus', // 'focus' or 'break'
            isRunning: false,
            timerId: null
        };
    }

    init() {
        this.bindScratchpad();
        this.bindPomodoro();
        state.on('language:changed', () => this.updateWidgetLocalization());
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
        const modePill = document.getElementById('pomodoro-mode-badge');
        const display = document.getElementById('pomodoro-time-display');

        if (!startBtn || !resetBtn) return;

        this.updatePomodoroDisplay();

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

    startPomodoro() {
        this.pomodoroState.isRunning = true;
        this.pomodoroState.timerId = setInterval(() => {
            this.pomodoroState.remaining--;
            if (this.pomodoroState.remaining <= 0) {
                soundFx.play('chime');
                if (this.pomodoroState.mode === 'focus') {
                    this.pomodoroState.mode = 'break';
                    this.pomodoroState.duration = 5 * 60;
                    this.pomodoroState.remaining = 5 * 60;
                } else {
                    this.pomodoroState.mode = 'focus';
                    this.pomodoroState.duration = 25 * 60;
                    this.pomodoroState.remaining = 25 * 60;
                }
            }
            this.updatePomodoroDisplay();
        }, 1000);
    }

    pausePomodoro() {
        this.pomodoroState.isRunning = false;
        if (this.pomodoroState.timerId) {
            clearInterval(this.pomodoroState.timerId);
            this.pomodoroState.timerId = null;
        }
    }

    resetPomodoro() {
        this.pausePomodoro();
        this.pomodoroState.mode = 'focus';
        this.pomodoroState.duration = 25 * 60;
        this.pomodoroState.remaining = 25 * 60;
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
            const total = this.pomodoroState.duration;
            const progress = (total - this.pomodoroState.remaining) / total;
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
