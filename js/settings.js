import { macroEngine } from './macros.js';
// js/settings.js - Slide-Over Settings Drawer Hub

import { state } from './state.js';
import { updateDocumentLocalization } from './i18n.js';
import { soundFx } from './audio.js';

export class SettingsHub {
    constructor(renderer, shortcutManager, backupManager, importer, themeStudio) {
        this.renderer = renderer;
        this.shortcutManager = shortcutManager;
        this.backupManager = backupManager;
        this.importer = importer;
        this.themeStudio = themeStudio;
        this.drawer = document.getElementById('settings-drawer');
        this.settingsBtn = document.getElementById('settings-btn');
        this.closeBtn = document.getElementById('close-settings-drawer');
        this.tabBtns = document.querySelectorAll('.settings-tab-btn');
        this.tabPanes = document.querySelectorAll('.settings-tab-pane');
        this.themeRadios = document.querySelectorAll('input[name="setting-theme"]');
        this.soundToggle = document.getElementById('setting-sound-toggle');
        this.soundPresetSelect = document.getElementById('sound-preset-select');
        this.glowToggle = document.getElementById('setting-glow-toggle');
        this.editModeToggle = document.getElementById('setting-edit-mode-toggle');
        this.addShortcutBtn = document.getElementById('drawer-add-shortcut-btn');
        this.layoutResetBtn = document.getElementById('layout-reset-defaults-btn');
        this.toggleScratchpad = document.getElementById('toggle-widget-scratchpad');
        this.togglePomodoro = document.getElementById('toggle-widget-pomodoro');
    }

    init() {
        this.bindEvents();
        this.syncUIState();
                // Macro test run buttons in settings
        const macroRunBtns = document.querySelectorAll('.macro-run-btn');
        macroRunBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const trigger = btn.getAttribute('data-macro');
                if (trigger) {
                    this.close();
                    macroEngine.executeMacro(trigger);
                }
            });
        });
        if (this.importer) this.importer.init();
        if (this.themeStudio) this.themeStudio.init();
    }

    open() {
        if (!this.drawer) return;
        soundFx.play('click');
        this.syncUIState();
        this.drawer.classList.remove('hidden');
    }

    close() {
        if (!this.drawer) return;
        soundFx.play('click');
        this.drawer.classList.add('hidden');
    }

    syncUIState() {
        this.themeRadios.forEach(radio => {
            radio.checked = (radio.value === state.theme || (radio.value === 'sunset' && state.theme === 'amber'));
        });

        if (this.soundToggle) this.soundToggle.checked = state.soundEnabled;
        if (this.soundPresetSelect) this.soundPresetSelect.value = soundFx.preset;
        if (this.editModeToggle) this.editModeToggle.checked = state.editMode;

        const scratchpadVisible = localStorage.getItem('widget_scratchpad_visible') !== 'false';
        const pomodoroVisible = localStorage.getItem('widget_pomodoro_visible') !== 'false';
        if (this.toggleScratchpad) this.toggleScratchpad.checked = scratchpadVisible;
        if (this.togglePomodoro) this.togglePomodoro.checked = pomodoroVisible;
    }

    bindEvents() {
        if (this.settingsBtn) this.settingsBtn.addEventListener('click', () => this.open());
        if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());

        if (this.drawer) {
            this.drawer.addEventListener('click', (e) => {
                if (e.target === this.drawer) this.close();
            });
        }

        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                soundFx.play('click');
                const targetTab = btn.getAttribute('data-tab');
                this.tabBtns.forEach(b => b.classList.toggle('active', b === btn));
                this.tabPanes.forEach(pane => {
                    pane.classList.toggle('active', pane.id === `tab-pane-${targetTab}`);
                });
            });
        });

        this.themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                soundFx.play('click');
                state.setTheme(e.target.value);
            });
        });

        if (this.soundToggle) {
            this.soundToggle.addEventListener('change', (e) => {
                state.setSoundEnabled(e.target.checked);
                soundFx.play('click');
            });
        }

        if (this.soundPresetSelect) {
            this.soundPresetSelect.addEventListener('change', (e) => {
                soundFx.setPreset(e.target.value);
                soundFx.play('click');
            });
        }

        if (this.editModeToggle) {
            this.editModeToggle.addEventListener('change', (e) => {
                soundFx.play('click');
                state.setEditMode(e.target.checked);
            });
        }

        if (this.toggleScratchpad) {
            this.toggleScratchpad.addEventListener('change', (e) => {
                const el = document.getElementById('widget-scratchpad-card');
                if (el) el.classList.toggle('hidden', !e.target.checked);
                localStorage.setItem('widget_scratchpad_visible', e.target.checked ? 'true' : 'false');
            });
        }

        if (this.togglePomodoro) {
            this.togglePomodoro.addEventListener('change', (e) => {
                const el = document.getElementById('widget-pomodoro-card');
                if (el) el.classList.toggle('hidden', !e.target.checked);
                localStorage.setItem('widget_pomodoro_visible', e.target.checked ? 'true' : 'false');
            });
        }

        if (this.layoutResetBtn) {
            this.layoutResetBtn.addEventListener('click', () => {
                soundFx.play('click');
                this.backupManager.resetDefaults();
            });
        }

        if (this.addShortcutBtn) {
            this.addShortcutBtn.addEventListener('click', () => {
                this.close();
                this.shortcutManager.openAddModal();
            });
        }

        // Language Radios in Settings
        const langRadios = document.querySelectorAll('input[name="setting-lang"]');
        langRadios.forEach(radio => {
            radio.checked = (radio.value === state.language);
            radio.addEventListener('change', (e) => {
                soundFx.play('click');
                state.setLanguage(e.target.value);
                updateDocumentLocalization();
                this.renderer.render();
            });
        });
    }
}
