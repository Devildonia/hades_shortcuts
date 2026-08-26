// js/macros.js - Contextual Multi-Action Macro & Routine Engine (Visual No-Code Studio)

import { state, escapeHtml, persistJson } from './state.js';
import { soundFx } from './audio.js';
import { ambientAudio } from './ambient-audio.js';
import { focusMode } from './focus-mode.js';

export const DEFAULT_MACROS = {
    '!work': {
        name: 'Modo Trabajo & Dev',
        desc: 'Abre GitHub, Claude y ChatGPT, activa Pomodoro y sonido de lluvia',
        shortcuts: ['github', 'claude', 'chatgpt'],
        ambient: 'rain',
        pomodoro: 'start',
        icon: '💻'
    },
    '!focus': {
        name: 'Modo Focus',
        desc: 'Alias de !work: Deep Focus + herramientas de desarrollo',
        shortcuts: ['github', 'claude', 'chatgpt'],
        ambient: 'rain',
        pomodoro: 'start',
        icon: '🎯'
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
        this.storageKey = 'custom_macros_v1';
        this.customMacros = this.loadCustomMacros();
        this.macros = { ...DEFAULT_MACROS, ...this.customMacros };
        this.modal = document.getElementById('macro-editor-modal');
        this.editingTrigger = null;
    }

    loadCustomMacros() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {};
    }

    saveCustomMacros(customObj) {
        persistJson(this.storageKey, customObj);
        this.customMacros = customObj;
        this.macros = { ...DEFAULT_MACROS, ...customObj };
    }

    getMacro(trigger) {
        return this.macros[(trigger || '').toLowerCase().trim()] || null;
    }

    executeMacro(trigger) {
        const macro = this.getMacro(trigger);
        if (!macro) return false;

        soundFx.play('chime');
        if (macro.ambient && ambientAudio) {
            if (ambientAudio.setPreset) ambientAudio.setPreset(macro.ambient);
            if (ambientAudio.play && !ambientAudio.isPlaying) ambientAudio.play();
        }

        if (macro.pomodoro) {
            const startBtn = document.getElementById('pomodoro-start-btn');
            const resetBtn = document.getElementById('pomodoro-reset-btn');
            if (macro.pomodoro === 'start' && startBtn) startBtn.click();
            if (macro.pomodoro === 'reset' && resetBtn) resetBtn.click();
        }

        if (Array.isArray(macro.shortcuts)) {
            macro.shortcuts.forEach((key) => {
                const s = (state.shortcuts || []).find(item => (item.id || item.title.toLowerCase().replace(/\s+/g, '')) === key.toLowerCase() || item.title.toLowerCase() === key.toLowerCase());
                if (s && s.url) {
                    if (focusMode && focusMode.openUrl) focusMode.openUrl(s.url);
                    else window.open(s.url, '_blank', 'noopener,noreferrer');
                }
            });
        }
        return true;
    }

    renderMacroList() {
        const container = document.getElementById('macros-list-container');
        if (!container) return;
        container.innerHTML = '';

        Object.entries(this.macros).forEach(([trigger, macro]) => {
            const card = document.createElement('div');
            card.className = 'macro-item-card';
            const isCustom = !!this.customMacros[trigger];

            card.innerHTML = `
                <div class="macro-item-header">
                    <span class="macro-badge">${escapeHtml(trigger)}</span>
                    <span style="font-size: 1.2rem;">${macro.icon || '⚡'}</span>
                    <h4 style="margin: 0; font-size: 0.95rem; color: var(--text-primary);">${escapeHtml(macro.name)}</h4>
                </div>
                <p class="macro-item-desc">${escapeHtml(macro.desc || (macro.shortcuts || []).join(', '))}</p>
                <div class="macro-card-actions">
                    <button class="control-btn macro-run-btn" data-trigger="${escapeHtml(trigger)}">▶ Ejecutar</button>
                    <button class="control-btn macro-edit-btn" data-trigger="${escapeHtml(trigger)}">✏️ Editar</button>
                    ${isCustom ? `<button class="control-btn macro-del-btn" data-trigger="${escapeHtml(trigger)}">🗑️ Eliminar</button>` : ''}
                </div>
            `;

            card.querySelector('.macro-run-btn')?.addEventListener('click', () => this.executeMacro(trigger));
            card.querySelector('.macro-edit-btn')?.addEventListener('click', () => this.openEditor(trigger));
            card.querySelector('.macro-del-btn')?.addEventListener('click', () => this.deleteMacro(trigger));
            container.appendChild(card);
        });
    }

    openEditor(trigger = null) {
        this.editingTrigger = trigger;
        this.modal = document.getElementById('macro-editor-modal');
        if (!this.modal) return;

        const macro = trigger ? this.getMacro(trigger) : { name: '', icon: '🎮', shortcuts: [], ambient: '', pomodoro: '' };
        document.getElementById('macro-form-trigger').value = trigger || '!';
        document.getElementById('macro-form-name').value = macro.name || '';
        document.getElementById('macro-form-icon').value = macro.icon || '⚡';
        document.getElementById('macro-form-ambient').value = macro.ambient || '';
        document.getElementById('macro-form-pomodoro').value = macro.pomodoro || '';

        this.populateShortcutsGrid(macro.shortcuts || []);
        this.modal.classList.remove('hidden');
    }

    populateShortcutsGrid(selectedKeys = []) {
        const grid = document.getElementById('macro-form-shortcuts-grid');
        if (!grid) return;
        grid.innerHTML = '';

        (state.shortcuts || []).forEach(s => {
            const key = (s.id || s.title.toLowerCase().replace(/\s+/g, '')).toLowerCase();
            const isChecked = selectedKeys.map(k => k.toLowerCase()).includes(key) || selectedKeys.map(k => k.toLowerCase()).includes(s.title.toLowerCase());

            const item = document.createElement('label');
            item.className = `macro-shortcut-checkbox-item ${isChecked ? 'selected' : ''}`;
            item.innerHTML = `
                <input type="checkbox" value="${escapeHtml(key)}" ${isChecked ? 'checked' : ''}>
                <span class="macro-shortcut-name">${escapeHtml(s.title)}</span>
                <span class="macro-shortcut-cat">#${escapeHtml(s.category)}</span>
            `;
            item.querySelector('input').addEventListener('change', (e) => {
                item.classList.toggle('selected', e.target.checked);
            });
            grid.appendChild(item);
        });
    }

    saveFromForm() {
        const triggerInput = document.getElementById('macro-form-trigger');
        let trigger = (triggerInput.value || '').trim().toLowerCase();
        if (!trigger.startsWith('!')) trigger = '!' + trigger;
        if (trigger.length <= 1) return;

        const name = (document.getElementById('macro-form-name').value || '').trim() || trigger;
        const icon = (document.getElementById('macro-form-icon').value || '').trim() || '⚡';
        const ambient = document.getElementById('macro-form-ambient').value || null;
        const pomodoro = document.getElementById('macro-form-pomodoro').value || null;

        const checkedShortcuts = [];
        document.querySelectorAll('#macro-form-shortcuts-grid input:checked').forEach(cb => {
            checkedShortcuts.push(cb.value);
        });

        const custom = this.loadCustomMacros();
        custom[trigger] = {
            name,
            desc: `Abre ${checkedShortcuts.join(', ')}`,
            shortcuts: checkedShortcuts,
            ambient,
            pomodoro,
            icon
        };

        this.saveCustomMacros(custom);
        soundFx.play('chime');
        this.closeEditor();
        this.renderMacroList();
    }

    deleteMacro(trigger) {
        const custom = this.loadCustomMacros();
        delete custom[trigger];
        this.saveCustomMacros(custom);
        soundFx.play('click');
        this.renderMacroList();
    }

    closeEditor() {
        if (this.modal) this.modal.classList.add('hidden');
    }

    init() {
        this.renderMacroList();
        const createBtn = document.getElementById('create-macro-btn');
        const saveBtn = document.getElementById('macro-form-save-btn');
        const cancelBtn = document.getElementById('cancel-macro-modal') || document.getElementById('close-macro-modal');
        const closeX = document.getElementById('close-macro-modal');

        if (createBtn) createBtn.addEventListener('click', () => this.openEditor(null));
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveFromForm());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeEditor());
        if (closeX && closeX !== cancelBtn) closeX.addEventListener('click', () => this.closeEditor());
    }
}

export const macroEngine = new MacroEngine();
