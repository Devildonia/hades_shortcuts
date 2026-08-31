// js/spaces.js - Arc-Inspired Multi-Profile Contextual Spaces Engine
//
// Perfiles totalmente editables (filosofía del proyecto: "ponlo todo a tu gusto"):
//   · Nombre        → editable (si se deja vacío, vuelve al nombre por idioma)
//   · Color acento  → editable (pinta la tecla del numpad y el acento del espacio)
//   · Categorías    → editable (qué cajones de categorías muestra cada perfil)
//   · Orden         → editable (define la tecla Alt+1…Alt+6)
// La cantidad de perfiles es FIJA en 6 (no se añaden ni se eliminan).
// El tema y el bloc de notas ya eran persistentes por perfil; ahora también lo son
// el resto de campos. Todo se persiste en `hades_spaces_v1` y es 100% local.

import { state, persistJson } from './state.js';
import { escapeHtml } from './utils.js';
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

const ACCENT_RE = /^#[0-9a-fA-F]{6}$/;

export class SpacesEngine {
    constructor() {
        this.storageKey = 'hades_spaces_v1';
        this.data = this.loadSpaces();
    }

    getSpace(spaceId) {
        return this.data.spaces.find((s) => s.id === spaceId) || null;
    }

    // Nombre visible: si el usuario lo personalizó (customName), se muestra tal cual;
    // si no, se usa el nombre traducido por idioma (spaces.<id>).
    spaceLabel(spaceId) {
        const sp = this.getSpace(spaceId);
        if (sp && sp.customName && sp.name) return sp.name;
        return getTranslation(`spaces.${spaceId}`) || (sp && sp.name) || SPACE_PRESETS[spaceId]?.name || spaceId;
    }

    defaultSpaces() {
        return Object.values(SPACE_PRESETS).map((preset) => ({
            id: preset.id,
            name: preset.name,
            theme: preset.theme,
            accent: preset.accent,
            categoryIds: preset.categoryIds ? [...preset.categoryIds] : null,
            scratchpad: preset.scratchpad,
            customName: false
        }));
    }

    // Acepta null (todas las categorías) o un array de ids 'cat_*'.
    // Filtra inválidos, elimina duplicados y devuelve null si el resultado queda vacío.
    _normalizeCategoryIds(value) {
        if (value === null || value === undefined) return null;
        if (!Array.isArray(value)) return null;
        const ids = value.filter((v) => typeof v === 'string' && v.startsWith('cat_'));
        const unique = [...new Set(ids)];
        return unique.length ? unique : null;
    }

    loadSpaces() {
        let parsed = null;
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) parsed = JSON.parse(raw);
        } catch (e) {}
        return this.parseSpacesObject(parsed);
    }

    // Valida y normaliza un objeto de espacios (backup/sync o storage) y devuelve
    // { activeSpaceId, spaces } SIEMPRE con los 6 perfiles, sin lanzar errores.
    parseSpacesObject(parsed) {
        const defaults = this.defaultSpaces();
        const defaultIds = defaults.map((d) => d.id);
        const byId = new Map(defaults.map((d) => [d.id, d]));

        if (!parsed || !Array.isArray(parsed.spaces) || !parsed.spaces.length) {
            return { activeSpaceId: 'space_work', spaces: defaults };
        }

        const savedById = new Map();
        for (const s of parsed.spaces) {
            if (s && typeof s.id === 'string' && byId.has(s.id) && !savedById.has(s.id)) savedById.set(s.id, s);
        }

        const buildSpace = (id) => {
            const preset = byId.get(id);
            const saved = savedById.get(id) || {};

            const name = (typeof saved.name === 'string' && saved.name.trim()) ? saved.name.trim() : preset.name;
            const customName = !!saved.customName && name !== preset.name;
            const accent = (typeof saved.accent === 'string' && ACCENT_RE.test(saved.accent)) ? saved.accent.toLowerCase() : preset.accent;
            const theme = (typeof saved.theme === 'string' && saved.theme) ? saved.theme : preset.theme;
            const rawCats = saved.categoryIds !== undefined ? saved.categoryIds : preset.categoryIds;
            const categoryIds = this._normalizeCategoryIds(rawCats);
            const scratchpad = (saved.scratchpad !== undefined) ? saved.scratchpad : preset.scratchpad;

            return { id, name, theme, accent, categoryIds, scratchpad, customName };
        };

        // Orden: respeta el orden guardado (solo ids válidos y únicos) y añade al final
        // cualquier id que falte, garantizando SIEMPRE los 6 perfiles.
        const order = [];
        const seen = new Set();
        for (const s of parsed.spaces) {
            if (s && typeof s.id === 'string' && byId.has(s.id) && !seen.has(s.id)) { order.push(s.id); seen.add(s.id); }
        }
        for (const id of defaultIds) if (!seen.has(id)) order.push(id);

        const spaces = order.map((id) => buildSpace(id));

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

    // ==================== Mutaciones editables ====================

    renameSpace(spaceId, name) {
        const sp = this.getSpace(spaceId);
        if (!sp) return;
        const preset = SPACE_PRESETS[spaceId];
        const trimmed = (name || '').trim();
        if (trimmed) {
            sp.name = trimmed;
            sp.customName = true;
        } else if (preset) {
            sp.name = preset.name;
            sp.customName = false;
        }
        this._commit(spaceId);
    }

    setSpaceAccent(spaceId, accent) {
        const sp = this.getSpace(spaceId);
        if (!sp) return;
        if (typeof accent === 'string' && ACCENT_RE.test(accent)) sp.accent = accent.toLowerCase();
        this._commit(spaceId);
    }

    setSpaceCategories(spaceId, categoryIds) {
        const sp = this.getSpace(spaceId);
        if (!sp) return;
        sp.categoryIds = this._normalizeCategoryIds(categoryIds);
        this._commit(spaceId);
    }

    // dir = -1 (subir) | +1 (bajar). Reordena el array, que define la tecla Alt+1…6.
    moveSpace(spaceId, dir) {
        const idx = this.data.spaces.findIndex((s) => s.id === spaceId);
        const to = idx + dir;
        if (idx < 0 || to < 0 || to >= this.data.spaces.length) return;
        const arr = this.data.spaces;
        const [moved] = arr.splice(idx, 1);
        arr.splice(to, 0, moved);
        this._commit(spaceId);
    }

    resetSpace(spaceId) {
        const preset = SPACE_PRESETS[spaceId];
        const sp = this.getSpace(spaceId);
        if (!preset || !sp) return;
        sp.name = preset.name;
        sp.customName = false;
        sp.theme = preset.theme;
        sp.accent = preset.accent;
        sp.categoryIds = preset.categoryIds ? [...preset.categoryIds] : null;
        sp.scratchpad = preset.scratchpad;
        this._commit(spaceId);
    }

    resetAllSpaces() {
        const defaults = this.defaultSpaces();
        this.data.spaces = defaults;
        if (!this.data.spaces.some((s) => s.id === this.data.activeSpaceId)) {
            this.data.activeSpaceId = defaults[0].id;
        }
        this._commit(this.data.activeSpaceId);
    }

    // Importa un objeto de espacios desde un backup o sync (validado con la misma
    // normalización que loadSpaces), persiste y refresca la UI. Nunca lanza.
    importSpaces(saved) {
        this.data = this.parseSpacesObject(saved);
        this.saveSpaces();
        this.applySpaceChrome();
        this.renderNumpad();
        state.emit('spaces:updated', this.data.activeSpaceId);
    }

    // Persiste, refresca el acento, el numpad y avisa a la app para re-render del tablero.
    _commit(spaceId) {
        this.saveSpaces();
        this.applySpaceChrome();
        this.renderNumpad();
        state.emit('spaces:updated', spaceId);
    }

    // ==================== Chrome, conmutación, numpad, atajos ====================

    applySpaceChrome() {
        const space = this.getActiveSpace();
        if (typeof document === 'undefined') return;
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
            const padInput = typeof document !== 'undefined' ? document.getElementById('scratchpad-input') : null;
            if (padInput) current.scratchpad = padInput.value;
        }

        this.data.activeSpaceId = spaceId;
        this.saveSpaces();
        this.applySpaceChrome();

        if (target.theme) state.setTheme(target.theme);

        const padInput = typeof document !== 'undefined' ? document.getElementById('scratchpad-input') : null;
        if (padInput && target.scratchpad !== undefined) {
            padInput.value = target.scratchpad;
            localStorage.setItem('bento_scratchpad_notes', target.scratchpad);
            localStorage.setItem('hades_scratchpad_content', target.scratchpad);
        }

        this.renderNumpad();
        state.emit('space:changed', spaceId);

        if (typeof document !== 'undefined') {
            document.body.classList.add('space-transition-flash');
            setTimeout(() => document.body.classList.remove('space-transition-flash'), 300);
        }
    }

    // Numpad de 6 perfiles: teclas 1-6, la activa se ve "pulsada"
    renderNumpad(containerEl) {
        if (typeof document === 'undefined') return;
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
        if (typeof document === 'undefined') return;
        document.addEventListener('keydown', (e) => {
            if (e.altKey && !e.ctrlKey && !e.shiftKey) {
                // Guardia: no capturar si el usuario está escribiendo en un campo
                const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
                const isEditing = activeTag === 'input' || activeTag === 'textarea' || (document.activeElement && document.activeElement.isContentEditable);
                if (isEditing) return;

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
