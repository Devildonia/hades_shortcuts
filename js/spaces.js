// js/spaces.js - Arc-Inspired Multi-Profile Contextual Spaces Engine

import { state, persistJson, escapeHtml } from './state.js';
import { soundFx } from './audio.js';
import { getTranslation } from './i18n.js';

export const SPACE_PRESETS = {
    space_work: {
        id: 'space_work',
        name: 'Work & Dev',
        theme: 'cyber',
        accent: '#00f2fe',
        categoryIds: null,
        scratchpad: 'Work notes and active projects...'
    },
    space_personal: {
        id: 'space_personal',
        name: 'Personal & Leisure',
        theme: 'nebula',
        accent: '#c084fc',
        categoryIds: ['cat_social', 'cat_shopping', 'cat_gaming', 'cat_google', 'cat_tools', 'cat_video'],
        scratchpad: 'Personal ideas, shopping and reading list...'
    },
    space_3d: {
        id: 'space_3d',
        name: '3D & AI Creation',
        theme: 'sunset',
        accent: '#fb923c',
        categoryIds: ['cat_3d', 'cat_ai', 'cat_art', 'cat_audio', 'cat_video', 'cat_google'],
        scratchpad: 'Creative prompts, textures and modeling references...'
    },
    space_art: {
        id: 'space_art',
        name: 'Arte & Audio',
        theme: 'jade',
        accent: '#34d399',
        categoryIds: ['cat_3d', 'cat_art', 'cat_audio', 'cat_ai'],
        scratchpad: 'Ideas creativas: renders, mezclas y referencias...'
    },
    space_fun: {
        id: 'space_fun',
        name: 'Social & Gaming',
        theme: 'abyss',
        accent: '#e2e8f0',
        categoryIds: ['cat_social', 'cat_gaming', 'cat_video', 'cat_shopping'],
        scratchpad: 'Partidas, streams y planes de ocio...'
    },
    space_utils: {
        id: 'space_utils',
        name: 'Herramientas & Web',
        theme: 'light',
        accent: '#0284c7',
        categoryIds: ['cat_tools', 'cat_google', 'cat_video', 'cat_ai'],
        scratchpad: 'Utilities, APIs y consultas rápidas...'
    }
};

export class SpacesEngine {
    constructor() {
        this.storageKey = 'hades_spaces_v1';
        this.data = this.loadSpaces();
    }

    spaceLabel(spaceId) {
        return getTranslation(`spaces.${spaceId}`) || SPACE_PRESETS[spaceId]?.name || spaceId;
    }

    defaultSpaces() {
        return Object.values(SPACE_PRESETS).map((preset) => ({
            id: preset.id,
            name: preset.name,
            theme: preset.theme,
            accent: preset.accent,
            categoryIds: preset.categoryIds ? [...preset.categoryIds] : null,
            scratchpad: preset.scratchpad
        }));
    }

    loadSpaces() {
        let parsed = null;
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) parsed = JSON.parse(raw);
        } catch (e) {}

        const defaults = this.defaultSpaces();
        if (!parsed || !Array.isArray(parsed.spaces) || !parsed.spaces.length) {
            return { activeSpaceId: 'space_work', spaces: defaults };
        }

        const byId = new Map(parsed.spaces.map((s) => [s.id, s]));
        const spaces = defaults.map((preset) => {
            const saved = byId.get(preset.id) || {};
            return {
                ...preset,
                theme: saved.theme || preset.theme,
                accent: preset.accent,
                categoryIds: preset.categoryIds ? [...preset.categoryIds] : null,
                scratchpad: saved.scratchpad !== undefined ? saved.scratchpad : preset.scratchpad
            };
        });

        const activeSpaceId = spaces.some((s) => s.id === parsed.activeSpaceId)
            ? parsed.activeSpaceId
            : 'space_work';
        return { activeSpaceId, spaces };
    }

    saveSpaces() {
        persistJson(this.storageKey, this.data);
    }

    getActiveSpace() {
        return this.data.spaces.find((s) => s.id === this.data.activeSpaceId) || this.data.spaces[0];
    }

    allowsCategory(catId) {
        const space = this.getActiveSpace();
        if (!space || !Array.isArray(space.categoryIds) || space.categoryIds.length === 0) return true;
        return space.categoryIds.includes(catId);
    }

    applySpaceChrome() {
        const space = this.getActiveSpace();
        document.body.setAttribute('data-active-space', space ? space.id : 'space_work');
        if (space && space.accent) {
            document.body.style.setProperty('--space-accent', space.accent);
        }
    }

    switchSpace(spaceId) {
        if (spaceId === this.data.activeSpaceId) return;
        const target = this.data.spaces.find((s) => s.id === spaceId);
        if (!target) return;

        soundFx.play('chime');

        const current = this.getActiveSpace();
        if (current) {
            current.theme = state.theme;
            const padInput = document.getElementById('scratchpad-input');
            if (padInput) current.scratchpad = padInput.value;
        }

        this.data.activeSpaceId = spaceId;
        this.saveSpaces();
        this.applySpaceChrome();

        if (target.theme) state.setTheme(target.theme);

        const padInput = document.getElementById('scratchpad-input');
        if (padInput && target.scratchpad !== undefined) {
            padInput.value = target.scratchpad;
            localStorage.setItem('bento_scratchpad_notes', target.scratchpad);
            localStorage.setItem('hades_scratchpad_content', target.scratchpad);
        }

        this.renderNumpad();
        state.emit('space:changed', spaceId);

        document.body.classList.add('space-transition-flash');
        setTimeout(() => document.body.classList.remove('space-transition-flash'), 300);
    }

    // Numpad de 6 perfiles: teclas 1-6, la activa se ve "pulsada"
    renderNumpad(containerEl) {
        const container = containerEl || document.getElementById('spaces-switcher-bar');
        if (!container) return;

        const activeId = this.data.activeSpaceId;
        container.innerHTML = '';

        const label = document.createElement('span');
        label.className = 'spaces-label';
        label.textContent = getTranslation('spaces.label') || 'Profiles';
        container.appendChild(label);

        const grid = document.createElement('div');
        grid.className = 'space-numpad-grid';
        grid.setAttribute('role', 'tablist');
        grid.setAttribute('aria-label', getTranslation('spaces.aria') || 'Independent profiles');

        this.data.spaces.forEach((sp, idx) => {
            const btn = document.createElement('button');
            const isActive = sp.id === activeId;
            const name = this.spaceLabel(sp.id);
            btn.type = 'button';
            btn.className = `space-key ${isActive ? 'active' : ''}`;
            btn.setAttribute('data-space-id', sp.id);
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', String(isActive));
            btn.setAttribute('title', `${name} · Alt+${idx + 1}`);
            if (sp.accent) btn.style.setProperty('--key-accent', sp.accent);
            btn.innerHTML = `<span class="space-key-num" aria-hidden="true">${idx + 1}</span><span class="visually-hidden">${escapeHtml(name)}</span>`;

            btn.addEventListener('click', () => {
                soundFx.play('click');
                this.switchSpace(sp.id);
            });
            grid.appendChild(btn);
        });

        container.appendChild(grid);
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.altKey && !e.ctrlKey && !e.shiftKey) {
                const num = parseInt(e.key, 10);
                if (num >= 1 && num <= this.data.spaces.length) {
                    e.preventDefault();
                    const targetSpace = this.data.spaces[num - 1];
                    if (targetSpace) this.switchSpace(targetSpace.id);
                }
            }
        });
    }

    init() {
        this.applySpaceChrome();
        this.renderNumpad();
        this.bindKeyboardShortcuts();
        this.saveSpaces();
        state.on('language:changed', () => this.renderNumpad());
    }
}

export const spacesManager = new SpacesEngine();

