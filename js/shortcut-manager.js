// js/shortcut-manager.js - Add / Edit / Delete Shortcut Modal with Visual Icon Grid & Smart Favicon HD

import { state } from './state.js';
import { i18nDictionaries } from './i18n.js';
import { soundFx } from './audio.js';

export const PRESET_ICONS = [
    'chatgpt.webp', 'claude.webp', 'deepseek.webp', 'qwen.webp', 'gemini.webp', 'google.webp',
    'gmail.webp', 'googledrive.webp', 'github.webp', 'discord.webp', 'youtube.webp', 'amazon.webp',
    'aliexpress.webp', 'paypal.webp', 'instagram.webp', 'x.webp', 'tiktok.webp', 'threads.webp',
    'patreon.webp', 'linkedin.webp', 'exophase.webp', 'meshy.webp', 'tripo3d.webp', 'ludoai.webp',
    'civitai.webp', 'shakkerai.webp', 'tensorart.webp', 'seaartai.webp', 'shadertoy.webp', 'MiniMax.webp',
    'suno.webp', 'elevenlabs.webp', 'birme.webp', 'photoroom.webp', 'itchio.webp', 'OptimizeGLB.webp',
    'translate.webp', 'pccomponentes.webp', 'wallapop.webp', 'kling.webp', 'hedra.webp', 'bing.webp',
    'duckduckgo.webp', 'perplexity.webp', 'notebooklm.webp', 'googleaistudio.webp', 'seaverse.webp'
];

export class ShortcutManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.modal = document.getElementById('shortcut-modal');
        this.titleInput = document.getElementById('sc-title-input');
        this.urlInput = document.getElementById('sc-url-input');
        this.catSelect = document.getElementById('sc-category-select');
        this.iconGrid = document.getElementById('sc-icon-picker-grid');
        this.previewImg = document.getElementById('sc-icon-preview-img');
        this.customIconInput = document.getElementById('sc-custom-icon');
        this.descInput = document.getElementById('sc-desc-input');
        this.tagsInput = document.getElementById('sc-tags-input');
        this.saveBtn = document.getElementById('sc-save-btn');
        this.deleteBtn = document.getElementById('sc-delete-btn');
        this.closeBtn = document.getElementById('close-sc-modal');
        this.editingShortcutId = null;
        this.selectedIcon = 'iconos/chatgpt.webp';
    }

    init() {
        this.populateCategorySelect();
        this.renderVisualIconGrid();
        this.bindEvents();
        this.bindSmartFaviconAutoDerive();

        window.addEventListener('shortcut:edit', (e) => this.openEditModal(e.detail));
        window.addEventListener('shortcut:delete', (e) => this.deleteShortcut(e.detail.id));
    }

    populateCategorySelect() {
        if (!this.catSelect) return;
        this.catSelect.innerHTML = '';
        const t = i18nDictionaries[state.language] || i18nDictionaries.es;
        state.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = t.categories[cat.id] || cat.defaultTitle;
            this.catSelect.appendChild(opt);
        });
    }

    renderVisualIconGrid() {
        if (!this.iconGrid) return;
        this.iconGrid.innerHTML = '';
        PRESET_ICONS.forEach(ic => {
            const path = `iconos/${ic}`;
            const chip = document.createElement('div');
            chip.className = `sc-icon-chip ${this.selectedIcon === path ? 'selected' : ''}`;
            chip.setAttribute('data-icon-path', path);
            chip.setAttribute('title', ic.replace('.webp', ''));
            chip.innerHTML = `<img src="${path}" alt="${ic}" loading="lazy">`;
            
            chip.addEventListener('click', () => {
                soundFx.play('click');
                this.selectIcon(path);
                if (this.customIconInput) this.customIconInput.value = '';
            });
            this.iconGrid.appendChild(chip);
        });
    }

    selectIcon(iconPath) {
        this.selectedIcon = iconPath;
        if (this.previewImg) this.previewImg.src = iconPath;
        if (this.iconGrid) {
            this.iconGrid.querySelectorAll('.sc-icon-chip').forEach(chip => {
                chip.classList.toggle('selected', chip.getAttribute('data-icon-path') === iconPath);
            });
        }
    }

    openAddModal() {
        this.editingShortcutId = null;
        this.populateCategorySelect();
        this.titleInput.value = '';
        this.urlInput.value = '';
        this.customIconInput.value = '';
        this.descInput.value = '';
        this.tagsInput.value = '';
        this.selectIcon('iconos/chatgpt.webp');
        if (this.deleteBtn) this.deleteBtn.classList.add('hidden');
        document.getElementById('sc-modal-title').textContent = (i18nDictionaries[state.language] || i18nDictionaries.es).shortcut_editor.add_title;
        this.modal.classList.remove('hidden');
    }

    openEditModal(sc) {
        this.editingShortcutId = sc.id;
        this.populateCategorySelect();
        this.titleInput.value = sc.title;
        this.urlInput.value = sc.url;
        this.catSelect.value = sc.category;
        this.descInput.value = sc.desc || '';
        this.tagsInput.value = sc.tags || '';

        if (sc.icon.startsWith('iconos/')) {
            this.selectIcon(sc.icon);
            this.customIconInput.value = '';
        } else {
            this.selectedIcon = sc.icon;
            if (this.previewImg) this.previewImg.src = sc.icon;
            this.customIconInput.value = sc.icon;
        }

        if (this.deleteBtn) this.deleteBtn.classList.remove('hidden');
        document.getElementById('sc-modal-title').textContent = (i18nDictionaries[state.language] || i18nDictionaries.es).shortcut_editor.edit_title;
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.editingShortcutId = null;
    }

    saveShortcut() {
        const title = this.titleInput.value.trim();
        const url = this.urlInput.value.trim();
        if (!title || !url) return;

        let icon = this.customIconInput.value.trim() || this.selectedIcon;
        const category = this.catSelect.value;
        const desc = this.descInput.value.trim();
        const tags = this.tagsInput.value.trim();

        if (this.editingShortcutId) {
            const list = state.shortcuts.map(s => {
                if (s.id === this.editingShortcutId) {
                    return { ...s, title, url, icon, category, desc, tags };
                }
                return s;
            });
            state.saveShortcuts(list);
        } else {
            const newId = 'sc_' + Date.now();
            const newSc = { id: newId, title, url, icon, category, desc, tags };
            state.saveShortcuts([...state.shortcuts, newSc]);
        }

        this.closeModal();
        this.renderer.render();
    }

    deleteShortcut(id) {
        const list = state.shortcuts.filter(s => s.id !== id);
        state.saveShortcuts(list);
        this.closeModal();
        this.renderer.render();
    }

    bindSmartFaviconAutoDerive() {
        if (this.urlInput) {
            this.urlInput.addEventListener('input', () => {
                const val = this.urlInput.value.trim();
                if (!val) return;
                try {
                    let formattedUrl = val;
                    if (!val.startsWith('http://') && !val.startsWith('https://')) {
                        formattedUrl = 'https://' + val;
                    }
                    const parsed = new URL(formattedUrl);
                    const domain = parsed.hostname.replace(/^www\./, '');
                    
                    if (this.titleInput && !this.titleInput.value.trim()) {
                        const name = domain.split('.')[0];
                        this.titleInput.value = name.charAt(0).toUpperCase() + name.slice(1);
                    }

                    const hdFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                    if (this.customIconInput) {
                        this.customIconInput.value = hdFavicon;
                    }
                    if (this.previewImg) this.previewImg.src = hdFavicon;
                } catch (e) {}
            });
        }
        if (this.customIconInput) {
            this.customIconInput.addEventListener('input', () => {
                const customVal = this.customIconInput.value.trim();
                if (customVal && this.previewImg) {
                    this.previewImg.src = customVal;
                }
            });
        }
    }

    bindEvents() {
        if (this.saveBtn) this.saveBtn.addEventListener('click', () => this.saveShortcut());
        if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closeModal());
        if (this.deleteBtn) this.deleteBtn.addEventListener('click', () => {
            if (this.editingShortcutId) this.deleteShortcut(this.editingShortcutId);
        });
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
        }
    }
}
