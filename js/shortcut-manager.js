// js/shortcut-manager.js - Add / Edit / Delete Shortcut Modal with Alphabetical Icon Dropdown (A-Z with Left Thumbnails)

import { state } from './state.js';
import { i18nDictionaries } from './i18n.js';
import { soundFx } from './audio.js';

export const SORTED_PRESET_ICONS = [
    'aliexpress.webp', 'amazon.webp', 'bing.webp', 'birme.webp', 'chatgpt.webp', 'civitai.webp',
    'claude.webp', 'deepseek.webp', 'discord.webp', 'duckduckgo.webp', 'elevenlabs.webp', 'epic.webp',
    'exophase.webp', 'facebook.webp', 'gemini.webp', 'github.webp', 'gmail.webp', 'gog.webp',
    'google.webp', 'googleaistudio.webp', 'googledrive.webp', 'hedra.webp', 'instagram.webp', 'itchio.webp',
    'kling.webp', 'linkedin.webp', 'ludoai.webp', 'meshy.webp', 'MiniMax.webp', 'notebooklm.webp',
    'OptimizeGLB.webp', 'patreon.webp', 'paypal.webp', 'pccomponentes.webp', 'perplexity.webp', 'photoroom.webp',
    'qwen.webp', 'reddit.webp', 'seaartai.webp', 'seaverse.webp', 'shadertoy.webp', 'shakkerai.webp',
    'steam.webp', 'suno.webp', 'tensorart.webp', 'threads.webp', 'tiktok.webp', 'translate.webp',
    'tripo3d.webp', 'wallapop.webp', 'x.webp', 'xbox.webp', 'youtube.webp'
];

export class ShortcutManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.modal = document.getElementById('shortcut-modal');
        this.titleInput = document.getElementById('sc-title-input');
        this.urlInput = document.getElementById('sc-url-input');
        this.catSelect = document.getElementById('sc-category-select');
        this.dropdownTrigger = document.getElementById('sc-icon-dropdown-trigger');
        this.dropdownList = document.getElementById('sc-icon-dropdown-list');
        this.currentIconImg = document.getElementById('sc-dropdown-current-icon');
        this.currentIconText = document.getElementById('sc-dropdown-current-text');
        this.customIconInput = document.getElementById('sc-custom-icon');
        this.descInput = document.getElementById('sc-desc-input');
        this.tagsInput = document.getElementById('sc-tags-input');
        this.saveBtn = document.getElementById('sc-save-btn');
        this.deleteBtn = document.getElementById('sc-delete-btn');
        this.closeBtn = document.getElementById('close-sc-modal');
        this.editingShortcutId = null;
        this.selectedIcon = 'iconos/aliexpress.webp';
    }

    init() {
        this.populateCategorySelect();
        this.buildAlphabeticalIconList();
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

    buildAlphabeticalIconList() {
        if (!this.dropdownList) return;
        this.dropdownList.innerHTML = '';
        SORTED_PRESET_ICONS.forEach(ic => {
            const path = `iconos/${ic}`;
            const label = ic.replace('.webp', '');
            const opt = document.createElement('div');
            opt.className = `custom-dropdown-opt ${this.selectedIcon === path ? 'active' : ''}`;
            opt.setAttribute('data-icon-path', path);
            opt.setAttribute('role', 'option');
            opt.innerHTML = `
                <img src="${path}" class="dropdown-opt-thumb" alt="${label}" loading="lazy">
                <span class="dropdown-opt-text">${label}</span>
            `;
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                soundFx.play('click');
                this.selectIcon(path, label);
                this.closeDropdown();
                if (this.customIconInput) this.customIconInput.value = '';
            });
            this.dropdownList.appendChild(opt);
        });
    }

    selectIcon(path, label) {
        this.selectedIcon = path;
        const name = label || path.replace('iconos/', '').replace('.webp', '');
        if (this.currentIconImg) this.currentIconImg.src = path;
        if (this.currentIconText) this.currentIconText.textContent = name;
        if (this.dropdownList) {
            this.dropdownList.querySelectorAll('.custom-dropdown-opt').forEach(opt => {
                opt.classList.toggle('active', opt.getAttribute('data-icon-path') === path);
            });
        }
    }

    toggleDropdown() {
        soundFx.play('click');
        const isClosed = this.dropdownList.classList.contains('hidden');
        if (isClosed) {
            this.dropdownList.classList.remove('hidden');
            this.dropdownTrigger.setAttribute('aria-expanded', 'true');
            // Scroll to active option
            const activeOpt = this.dropdownList.querySelector('.custom-dropdown-opt.active');
            if (activeOpt) activeOpt.scrollIntoView({ block: 'nearest' });
        } else {
            this.closeDropdown();
        }
    }

    closeDropdown() {
        if (this.dropdownList) this.dropdownList.classList.add('hidden');
        if (this.dropdownTrigger) this.dropdownTrigger.setAttribute('aria-expanded', 'false');
    }

    openAddModal() {
        this.editingShortcutId = null;
        this.populateCategorySelect();
        this.titleInput.value = '';
        this.urlInput.value = '';
        this.customIconInput.value = '';
        this.descInput.value = '';
        this.tagsInput.value = '';
        this.selectIcon('iconos/aliexpress.webp', 'aliexpress');
        this.closeDropdown();
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
        this.closeDropdown();

        if (sc.icon.startsWith('iconos/')) {
            this.selectIcon(sc.icon);
            this.customIconInput.value = '';
        } else {
            this.selectedIcon = sc.icon;
            if (this.currentIconImg) this.currentIconImg.src = sc.icon;
            if (this.currentIconText) this.currentIconText.textContent = sc.title || 'Personalizado';
            this.customIconInput.value = sc.icon;
        }

        if (this.deleteBtn) this.deleteBtn.classList.remove('hidden');
        document.getElementById('sc-modal-title').textContent = (i18nDictionaries[state.language] || i18nDictionaries.es).shortcut_editor.edit_title;
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.closeDropdown();
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
                    if (this.currentIconImg) this.currentIconImg.src = hdFavicon;
                    if (this.currentIconText) this.currentIconText.textContent = domain;
                } catch (e) {}
            });
        }
    }

    bindEvents() {
        if (this.dropdownTrigger) {
            this.dropdownTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        document.addEventListener('click', (e) => {
            if (this.dropdownList && !e.target.closest('#sc-icon-dropdown')) {
                this.closeDropdown();
            }
        });

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
