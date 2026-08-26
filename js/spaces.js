// js/spaces.js - Arc-Inspired Multi-Profile Contextual Spaces Engine

import { state } from './state.js';
import { soundFx } from './audio.js';
import { i18nDictionaries } from './i18n.js';

export class SpacesEngine {
    constructor() {
        this.storageKey = 'hades_spaces_v1';
        this.data = this.loadSpaces();
    }

    loadSpaces() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) return JSON.parse(raw);
        } catch (e) {}

        // Default Initial Preset Spaces
        const defaultShortcuts = state.shortcuts || [];
        return {
            activeSpaceId: 'space_work',
            spaces: [
                {
                    id: 'space_work',
                    name: 'Trabajo & Dev',
                    icon: '💼',
                    theme: 'cyber',
                    shortcuts: defaultShortcuts,
                    scratchpad: 'Notas de trabajo y proyectos activos...'
                },
                {
                    id: 'space_personal',
                    name: 'Personal & Ocio',
                    icon: '🏠',
                    theme: 'nebula',
                    shortcuts: defaultShortcuts.filter(s => ['social-compras', 'productividad'].includes(s.category) || ['google', 'youtube', 'amazon'].some(k => s.id.includes(k))),
                    scratchpad: 'Ideas personales, compras y lecturas pendientes...'
                },
                {
                    id: 'space_3d',
                    name: '3D & Creación IA',
                    icon: '🎨',
                    theme: 'sunset',
                    shortcuts: defaultShortcuts.filter(s => ['ia-creativa', 'arte-media'].includes(s.category) || ['meshy', 'tripo', 'suno', 'kling'].some(k => s.id.includes(k))),
                    scratchpad: 'Prompts creativos, texturas y referencias de modelado...'
                }
            ]
        };
    }

    saveSpaces() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {}
    }

    getActiveSpace() {
        return this.data.spaces.find(s => s.id === this.data.activeSpaceId) || this.data.spaces[0];
    }

    switchSpace(spaceId) {
        if (spaceId === this.data.activeSpaceId) return;
        const target = this.data.spaces.find(s => s.id === spaceId);
        if (!target) return;

        soundFx.play('chime');

        // 1. Save current active space state
        const current = this.getActiveSpace();
        if (current) {
            current.shortcuts = [...(state.shortcuts || [])];
            current.theme = state.theme;
            const padInput = document.getElementById('scratchpad-input');
            if (padInput) current.scratchpad = padInput.value;
        }

        // 2. Set new active space ID
        this.data.activeSpaceId = spaceId;
        this.saveSpaces();

        // 3. Hydrate state with target space data
        if (target.shortcuts && target.shortcuts.length > 0) {
            state.shortcuts = [...target.shortcuts];
            state.saveShortcuts(state.shortcuts);
        }
        if (target.theme) {
            state.setTheme(target.theme);
        }

        // 4. Update Scratchpad
        const padInput = document.getElementById('scratchpad-input');
        if (padInput && target.scratchpad !== undefined) {
            padInput.value = target.scratchpad;
            localStorage.setItem('hades_scratchpad_content', target.scratchpad);
        }

        // 5. Emit events and re-render
        state.emit('shortcuts:changed');
        this.renderHeaderSwitcher();

        // Visual flash morph feedback
        document.body.classList.add('space-transition-flash');
        setTimeout(() => document.body.classList.remove('space-transition-flash'), 300);
    }

    renderHeaderSwitcher(containerEl) {
        const container = containerEl || document.getElementById('spaces-switcher-bar');
        if (!container) return;

        const activeId = this.data.activeSpaceId;
        container.innerHTML = '';

        const capsule = document.createElement('div');
        capsule.className = 'spaces-capsule';

        this.data.spaces.forEach((sp, idx) => {
            const btn = document.createElement('button');
            const isActive = sp.id === activeId;
            btn.className = `space-pill ${isActive ? 'active' : ''}`;
            btn.setAttribute('data-space-id', sp.id);
            btn.setAttribute('title', `${sp.name} (Alt+${idx + 1})`);
            btn.innerHTML = `<span class="space-icon">${sp.icon}</span><span class="space-name">${sp.name}</span>`;
            
            btn.addEventListener('click', () => {
                soundFx.play('click');
                this.switchSpace(sp.id);
            });
            capsule.appendChild(btn);
        });

        container.appendChild(capsule);
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.altKey && !e.ctrlKey && !e.shiftKey) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= this.data.spaces.length) {
                    e.preventDefault();
                    const targetSpace = this.data.spaces[num - 1];
                    if (targetSpace) this.switchSpace(targetSpace.id);
                }
            }
        });
    }

    init() {
        this.renderHeaderSwitcher();
        this.bindKeyboardShortcuts();
    }
}

export const spacesManager = new SpacesEngine();
