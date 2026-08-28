// js/backup.js - JSON Backup & Restore Engine

import { state, readJsonStorage, showToast } from './state.js';
import { i18nDictionaries, getTranslation } from './i18n.js';
import { soundFx } from './audio.js';

export class BackupManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.exportBtn = document.getElementById('export-backup-btn');
        this.importInput = document.getElementById('import-backup-file');
        this.resetBtn = document.getElementById('reset-defaults-btn');
    }

    init() {
        if (this.exportBtn) this.exportBtn.addEventListener('click', () => this.exportBackup());
        if (this.importInput) this.importInput.addEventListener('change', (e) => this.importBackup(e));
        if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.resetDefaults());
    }

    exportBackup() {
        const data = {
            version: '1.0.0-rc-1',
            exportedAt: new Date().toISOString(),
            settings: {
                userName: state.userName,
                theme: state.theme,
                soundEnabled: state.soundEnabled,
                language: state.language,
                showShortcutTags: state.showShortcutTags,
                showChromeBezel: state.showChromeBezel,
                weatherCity: localStorage.getItem('weather_manual_city'),
                soundPreset: soundFx.preset
            },
            categoriesOrder: state.categories.map(c => c.id),
            layoutMatrix: state.layoutMatrix,
            postits: readJsonStorage('glass_postits_v1', []),
            canvasPositions: readJsonStorage('canvas_positions_v1', {}),
            customMacros: readJsonStorage('custom_macros_v1', {}),
            shortcuts: state.shortcuts
        };

        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hades_shortcuts_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importBackup(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).settings_hub.backup;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.shortcuts && Array.isArray(data.shortcuts)) {
                    state.saveShortcuts(data.shortcuts);
                    if (data.categoriesOrder && Array.isArray(data.categoriesOrder)) {
                        state.saveCategoriesOrder(data.categoriesOrder);
                    }
                    if (data.canvasPositions) {
                        localStorage.setItem('canvas_positions_v1', JSON.stringify(data.canvasPositions));
                        if (window.layoutManager && typeof window.layoutManager.setPositions === 'function') {
                            window.layoutManager.setPositions(data.canvasPositions);
                        }
                    }
                    if (data.postits) {
                        localStorage.setItem('glass_postits_v1', JSON.stringify(data.postits));
                        if (window.postitsManager && typeof window.postitsManager.setPostIts === 'function') {
                            window.postitsManager.setPostIts(data.postits);
                        }
                    }
                    if (data.customMacros) {
                        localStorage.setItem('custom_macros_v1', JSON.stringify(data.customMacros));
                        if (window.macroEngine && typeof window.macroEngine.setCustomMacros === 'function') {
                            window.macroEngine.setCustomMacros(data.customMacros);
                        }
                    }
                    if (data.layoutMatrix) {
                        state.saveLayoutMatrix(data.layoutMatrix);
                    }
                    if (data.settings) {
                        if (data.settings.userName) state.setUserName(data.settings.userName);
                        if (data.settings.theme) state.setTheme(data.settings.theme);
                        if (data.settings.language) state.setLanguage(data.settings.language);
                        if (typeof data.settings.soundEnabled === 'boolean') state.setSoundEnabled(data.settings.soundEnabled);
                        if (typeof data.settings.showShortcutTags === 'boolean') state.setShowShortcutTags(data.settings.showShortcutTags);
                        if (typeof data.settings.showChromeBezel === 'boolean') state.setShowChromeBezel(data.settings.showChromeBezel);
                        if (data.settings.weatherCity) localStorage.setItem('weather_manual_city', data.settings.weatherCity);
                        if (data.settings.soundPreset && soundFx.setPreset) soundFx.setPreset(data.settings.soundPreset);
                    }
                    showToast(t.import_success, 'success');
                    if (this.renderer && this.renderer.render) this.renderer.render();
                    if (window.layoutManager && typeof window.layoutManager.applyPositions === 'function') {
                        window.layoutManager.applyPositions();
                    }
                } else {
                    showToast(t.import_error, 'error');
                }
            } catch (err) {
                showToast(t.import_error, 'error');
            }
        };
        reader.readAsText(file);
    }

    resetDefaults() {
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).settings_hub.backup;
        if (confirm(t.reset_confirm)) {
            state.resetToDefaults();
            if (this.renderer && this.renderer.render) this.renderer.render();
            showToast(getTranslation('toasts.reset_done') || 'Factory defaults restored.', 'success');
        }
    }
}
