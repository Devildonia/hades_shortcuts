// js/backup.js - JSON Backup & Restore Engine

import { state } from './state.js';
import { i18nDictionaries } from './i18n.js';

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
            version: '3.0.0',
            exportedAt: new Date().toISOString(),
            settings: {
                userName: state.userName,
                theme: state.theme,
                soundEnabled: state.soundEnabled,
                language: state.language,
                weatherCity: localStorage.getItem('weather_manual_city')
            },
            categoriesOrder: state.categories.map(c => c.id),
            layoutMatrix: state.layoutMatrix,
            postits: JSON.parse(localStorage.getItem('glass_postits_v1') || '[]'),
            canvasPositions: JSON.parse(localStorage.getItem('canvas_positions_v1') || '{}'),
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
                    }
                    if (data.postits) {
                        localStorage.setItem('glass_postits_v1', JSON.stringify(data.postits));
                    }
                    if (data.layoutMatrix) {
                        state.saveLayoutMatrix(data.layoutMatrix);
                    }
                    if (data.settings) {
                        if (data.settings.userName) state.setUserName(data.settings.userName);
                        if (data.settings.theme) state.setTheme(data.settings.theme);
                        if (data.settings.language) state.setLanguage(data.settings.language);
                    }
                    alert(t.import_success);
                    this.renderer.render();
                } else {
                    alert(t.import_error);
                }
            } catch (err) {
                alert(t.import_error);
            }
        };
        reader.readAsText(file);
    }

    resetDefaults() {
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).settings_hub.backup;
        if (confirm(t.reset_confirm)) {
            state.resetToDefaults();
            this.renderer.render();
            alert('Valores restablecidos.');
        }
    }
}
