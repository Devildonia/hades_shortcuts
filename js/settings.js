// js/settings.js - Unified Settings Slide-Over Drawer

import { state } from './state.js';
import { i18nDictionaries, updateDocumentLocalization } from './i18n.js';

export class SettingsHub {
    constructor(renderer, shortcutManager, backupManager) {
        this.renderer = renderer;
        this.shortcutManager = shortcutManager;
        this.backupManager = backupManager;
        this.settingsBtn = document.getElementById('settings-btn');
        this.drawer = document.getElementById('settings-drawer');
        this.closeDrawerBtn = document.getElementById('close-settings-drawer');
        this.tabButtons = document.querySelectorAll('.settings-tab-btn');
        this.tabContents = document.querySelectorAll('.settings-tab-pane');
        this.themeRadios = document.querySelectorAll('input[name="setting-theme"]');
        this.soundCheckbox = document.getElementById('setting-sound-toggle');
        this.glowCheckbox = document.getElementById('setting-glow-toggle');
        this.langSelect = document.getElementById('setting-lang-select');
        this.editModeToggle = document.getElementById('setting-edit-mode-toggle');
        this.addShortcutBtn = document.getElementById('drawer-add-shortcut-btn');
    }

    init() {
        this.bindEvents();
        this.syncUIState();
    }

    openDrawer() {
        if (!this.drawer) return;
        this.drawer.classList.remove('hidden');
        this.drawer.classList.add('open');
        this.syncUIState();
    }

    closeDrawer() {
        if (!this.drawer) return;
        this.drawer.classList.remove('open');
        setTimeout(() => this.drawer.classList.add('hidden'), 250);
    }

    switchTab(tabId) {
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        this.tabContents.forEach(pane => {
            pane.classList.toggle('active', pane.getAttribute('id') === `tab-pane-${tabId}`);
        });
    }

    syncUIState() {
        if (this.soundCheckbox) this.soundCheckbox.checked = state.soundEnabled;
        if (this.langSelect) this.langSelect.value = state.language;
        if (this.editModeToggle) this.editModeToggle.checked = state.editMode;

        this.themeRadios.forEach(radio => {
            radio.checked = radio.value === state.theme;
        });
    }

    bindEvents() {
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.openDrawer());
        }
        if (this.closeDrawerBtn) {
            this.closeDrawerBtn.addEventListener('click', () => this.closeDrawer());
        }
        if (this.drawer) {
            this.drawer.addEventListener('click', (e) => {
                if (e.target === this.drawer) this.closeDrawer();
            });
        }

        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.getAttribute('data-tab'));
            });
        });

        this.themeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                state.setTheme(radio.value);
            });
        });

        if (this.soundCheckbox) {
            this.soundCheckbox.addEventListener('change', () => {
                state.setSoundEnabled(this.soundCheckbox.checked);
            });
        }

        if (this.glowCheckbox) {
            this.glowCheckbox.addEventListener('change', () => {
                document.querySelectorAll('.ambient-glow').forEach(glow => {
                    glow.style.display = this.glowCheckbox.checked ? 'block' : 'none';
                });
            });
        }

        if (this.langSelect) {
            this.langSelect.addEventListener('change', () => {
                state.setLanguage(this.langSelect.value);
                updateDocumentLocalization();
                this.renderer.render();
            });
        }

        if (this.editModeToggle) {
            this.editModeToggle.addEventListener('change', () => {
                state.setEditMode(this.editModeToggle.checked);
            });
        }

        if (this.addShortcutBtn) {
            this.addShortcutBtn.addEventListener('click', () => {
                this.closeDrawer();
                this.shortcutManager.openAddModal();
            });
        }
    }
}
