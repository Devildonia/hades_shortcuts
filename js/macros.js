// js/macros.js - Contextual Multi-Action Macro & Routine Engine

import { state } from './state.js';
import { soundFx } from './audio.js';
import { ambientAudio } from './ambient-audio.js';

export const DEFAULT_MACROS = {
    '!work': {
        name: 'Modo Trabajo & Dev',
        desc: 'Abre GitHub, Claude y ChatGPT, activa Pomodoro y sonido de lluvia',
        shortcuts: ['github', 'claude', 'chatgpt'],
        ambient: 'rain',
        pomodoro: 'start',
        icon: '💻'
    },
    '!chill': {
        name: 'Modo Relax & Audio',
        desc: 'Abre YouTube y Suno, y activa el sonido de oleaje cósmico',
        shortcuts: ['youtube', 'suno'],
        ambient: 'waves',
        pomodoro: 'reset',
        icon: '☕'
    },
    '!3d': {
        name: 'Modo 3D & Generación IA',
        desc: 'Abre Meshy AI, Tripo 3D y Civitai con sonido de espacio profundo',
        shortcuts: ['meshy', 'tripo3d', 'civitai'],
        ambient: 'space',
        pomodoro: 'start',
        icon: '🎨'
    },
    '!social': {
        name: 'Modo Comunidad & Redes',
        desc: 'Abre Discord, X (Twitter) e Instagram',
        shortcuts: ['discord', 'x', 'instagram'],
        ambient: null,
        pomodoro: null,
        icon: '💬'
    }
};

export class MacroEngine {
    constructor() {
        this.macros = this.loadMacros();
    }

    loadMacros() {
        try {
            const saved = localStorage.getItem('custom_macros_v1');
            if (saved) return { ...DEFAULT_MACROS, ...JSON.parse(saved) };
        } catch (e) {}
        return { ...DEFAULT_MACROS };
    }

    saveCustomMacros(customObj) {
        try {
            localStorage.setItem('custom_macros_v1', JSON.stringify(customObj));
            this.macros = { ...DEFAULT_MACROS, ...customObj };
        } catch (e) {}
    }

    getMacro(trigger) {
        const key = trigger.toLowerCase().trim();
        return this.macros[key] || null;
    }

    executeMacro(trigger) {
        const macro = this.getMacro(trigger);
        if (!macro) return false;

        soundFx.play('chime');

        // 1. Open shortcuts
        if (macro.shortcuts && macro.shortcuts.length) {
            macro.shortcuts.forEach(id => {
                const sc = state.shortcuts.find(s => s.id === id);
                if (sc && sc.url) {
                    window.open(sc.url, '_blank', 'noopener,noreferrer');
                }
            });
        }

        // 2. Control Ambient Sound
        if (macro.ambient && ambientAudio) {
            ambientAudio.setPreset(macro.ambient);
            if (!ambientAudio.isPlaying) ambientAudio.play();
        }

        // 3. Control Pomodoro Timer
        if (macro.pomodoro === 'start') {
            const startBtn = document.getElementById('pomodoro-start-btn');
            if (startBtn && startBtn.textContent.includes('Iniciar')) {
                startBtn.click();
            }
        } else if (macro.pomodoro === 'reset') {
            const resetBtn = document.getElementById('pomodoro-reset-btn');
            if (resetBtn) resetBtn.click();
        }

        this.showMacroNotification(macro);
        return true;
    }

    showMacroNotification(macro) {
        const banner = document.getElementById('search-calc-banner');
        if (banner) {
            banner.innerHTML = `<div class="devtool-result-row"><span>${macro.icon} <strong>Macro Ejecutada:</strong> ${macro.name}</span> <span style="font-size:0.8rem; opacity:0.8;">(${macro.desc})</span></div>`;
            banner.classList.remove('hidden');
            setTimeout(() => {
                const searchInput = document.getElementById('main-search');
                if (searchInput && !searchInput.value) banner.classList.add('hidden');
            }, 4000);
        }
    }
}

export const macroEngine = new MacroEngine();
