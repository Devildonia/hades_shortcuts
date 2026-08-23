// js/shortcut-manager.js - Add / Edit / Delete Shortcut Modal

import { state } from './state.js';
import { i18nDictionaries } from './i18n.js';

export class ShortcutManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.modal = document.getElementById('shortcut-modal');
        this.titleInput = document.getElementById('sc-title-input');
        this.urlInput = document.getElementById('sc-url-input');
        this.catSelect = document.getElementById('sc-category-select');
        this.iconSelect = document.getElementById('sc-icon-select');
        this.customIconInput = document.getElementById('sc-custom-icon');
        this.descInput = document.getElementById('sc-desc-input');
        this.tagsInput = document.getElementById('sc-tags-input');
        this.saveBtn = document.getElementById('sc-save-btn');
        this.deleteBtn = document.getElementById('sc-delete-btn');
        this.closeBtn = document.getElementById('close-sc-modal');
        this.editingShortcutId = null;
    }

    init() {
        this.populateCategorySelect();
        this.populateIconPresets();
        this.bindEvents();

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

    populateIconPresets() {
        if (!this.iconSelect) return;
        this.iconSelect.innerHTML = '';
        const icons = [
            'chatgpt.webp', 'claude.webp', 'deepseek.webp', 'qwen.webp', 'gemini.webp', 'google.webp',
            'gmail.webp', 'googledrive.webp', 'github.webp', 'discord.webp', 'youtube.webp', 'amazon.webp',
            'aliexpress.webp', 'paypal.webp', 'instagram.webp', 'x.webp', 'tiktok.webp', 'threads.webp',
            'patreon.webp', 'linkedin.webp', 'exophase.webp', 'meshy.webp', 'tripo3d.webp', 'ludoai.webp',
            'civitai.webp', 'shakkerai.webp', 'tensorart.webp', 'seaartai.webp', 'shadertoy.webp', 'MiniMax.webp',
            'suno.webp', 'elevenlabs.webp', 'birme.webp', 'photoroom.webp', 'itchio.webp', 'OptimizeGLB.webp',
            'translate.webp', 'pccomponentes.webp', 'wallapop.webp', 'kling.webp', 'hedra.webp', 'bing.webp',
            'duckduckgo.webp', 'perplexity.webp', 'notebooklm.webp', 'googleaistudio.webp', 'seaverse.webp'
        ];
        icons.forEach(ic => {
            const opt = document.createElement('option');
            opt.value = `iconos/${ic}`;
            opt.textContent = ic.replace('.webp', '');
            this.iconSelect.appendChild(opt);
        });
    }

    openAddModal() {
        this.editingShortcutId = null;
        this.populateCategorySelect();
        this.titleInput.value = '';
        this.urlInput.value = '';
        this.customIconInput.value = '';
        this.descInput.value = '';
        this.tagsInput.value = '';
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
        if (sc.icon.startsWith('iconos/')) {
            this.iconSelect.value = sc.icon;
            this.customIconInput.value = '';
        } else {
            this.customIconInput.value = sc.icon;
        }
        this.descInput.value = sc.desc || '';
        this.tagsInput.value = sc.tags || '';
        if (this.deleteBtn) this.deleteBtn.classList.remove('hidden');
        document.getElementById('sc-modal-title').textContent = (i18nDictionaries[state.language] || i18nDictionaries.es).shortcut_editor.edit_title;
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        if (this.modal) this.modal.classList.add('hidden');
    }

    saveShortcut() {
        const title = this.titleInput.value.trim();
        const url = this.urlInput.value.trim();
        if (!title || !url) return;

        const icon = this.customIconInput.value.trim() || this.iconSelect.value || 'iconos/google.webp';
        const category = this.catSelect.value || 'cat_tools';
        const desc = this.descInput.value.trim();
        const tags = this.tagsInput.value.trim();

        if (this.editingShortcutId) {
            const updated = state.shortcuts.map(s => {
                if (s.id === this.editingShortcutId) {
                    return { ...s, title, url, icon, category, desc, tags };
                }
                return s;
            });
            state.saveShortcuts(updated);
        } else {
            const newSc = {
                id: `custom_${Date.now()}`,
                title, url, icon, category, desc, tags
            };
            state.saveShortcuts([...state.shortcuts, newSc]);
        }

        this.closeModal();
        this.renderer.render();
    }

    deleteShortcut(id) {
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).shortcut_editor;
        if (confirm(t.delete_confirm)) {
            const updated = state.shortcuts.filter(s => s.id !== id);
            state.saveShortcuts(updated);
            this.closeModal();
            this.renderer.render();
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
