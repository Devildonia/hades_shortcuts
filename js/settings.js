import { personalAnalytics } from './personal-analytics.js';
import { auroraCanvas } from './aurora-canvas.js';
import { macroEngine } from './macros.js';
// js/settings.js - Slide-Over Settings Drawer Hub

import { state } from './state.js';
import { updateDocumentLocalization, loadLocaleAsync } from './i18n.js';
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
        this.auroraToggle = document.getElementById('setting-aurora-toggle');
        this.solarToggle = document.getElementById('setting-solar-toggle');
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
                if (this.auroraToggle) {
            this.auroraToggle.checked = auroraCanvas.enabled;
            this.auroraToggle.addEventListener('change', () => {
                soundFx.play('click');
                auroraCanvas.toggle(this.auroraToggle.checked);
            });
        }
        if (this.glowToggle) {
            const glowOn = localStorage.getItem('ambient_glow_enabled') !== 'false';
            this.glowToggle.checked = glowOn;
            this.applyGlow(glowOn);
            this.glowToggle.addEventListener('change', () => {
                soundFx.play('click');
                this.applyGlow(this.glowToggle.checked);
            });
        }
        if (this.solarToggle) {
            this.solarToggle.checked = localStorage.getItem('solar_lighting_enabled') === 'true';
            this.solarToggle.addEventListener('change', () => {
                soundFx.play('click');
                state.emit('settings:solar_toggle', this.solarToggle.checked);
            });
        }
        const exportAnalyticsBtn = document.getElementById('export-analytics-btn');
        const resetAnalyticsBtn = document.getElementById('reset-analytics-btn');
        if (exportAnalyticsBtn) {
            exportAnalyticsBtn.onclick = () => {
                soundFx.play('click');
                const blob = new Blob([JSON.stringify(personalAnalytics.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'hades-personal-analytics.json';
                a.click();
                URL.revokeObjectURL(url);
            };
        }
        if (resetAnalyticsBtn) {
            resetAnalyticsBtn.onclick = () => {
                soundFx.play('click');
                if (confirm('¿Deseas reiniciar tu historial local de uso y estadísticas?')) {
                    personalAnalytics.resetData();
                    this.renderAnalyticsTab();
                }
            };
        }
        if (this.importer) this.importer.init();
    }

    open() {
        if (!this.drawer) return;
        soundFx.play('click');
        this.syncUIState();
        this.drawer.classList.remove('hidden');
        document.body.classList.add('settings-open');
        this.renderAnalyticsTab();
    }

    close() {
        if (!this.drawer) return;
        soundFx.play('click');
        this.drawer.classList.add('hidden');
        document.body.classList.remove('settings-open');
    }

    applyGlow(enabled) {
        localStorage.setItem('ambient_glow_enabled', enabled ? 'true' : 'false');
        document.querySelectorAll('.ambient-glow').forEach((el) => {
            el.classList.toggle('hidden', !enabled);
        });
    }

    syncUIState() {
        this.themeRadios.forEach(radio => {
            radio.checked = (radio.value === state.theme || (radio.value === 'sunset' && state.theme === 'amber'));
        });

        if (this.soundToggle) this.soundToggle.checked = state.soundEnabled;
        if (this.soundPresetSelect) this.soundPresetSelect.value = soundFx.preset;
        if (this.editModeToggle) this.editModeToggle.checked = state.editMode;

        this.syncWidgetToggles();
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
                    if (targetTab === 'analytics') this.renderAnalyticsTab();
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

        this.bindWidgetToggles();

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

        // Language select or radios
        const langSelect = document.getElementById('setting-lang-select');
        if (langSelect) {
            langSelect.value = state.language;
            langSelect.addEventListener('change', (e) => {
                soundFx.play('click');
                state.setLanguage(e.target.value);
                loadLocaleAsync(e.target.value).then(() => {
                    updateDocumentLocalization();
                    this.renderer.render();
                });
            });
        }
        const langRadios = document.querySelectorAll('input[name="setting-lang"]');
        langRadios.forEach(radio => {
            radio.checked = (radio.value === state.language);
            radio.addEventListener('change', (e) => {
                soundFx.play('click');
                state.setLanguage(e.target.value);
                loadLocaleAsync(e.target.value).then(() => {
                    updateDocumentLocalization();
                    this.renderer.render();
                });
            });
        });
    }

    renderAnalyticsTab() {
        const totalEl = document.getElementById('analytics-total-launches');
        const streakEl = document.getElementById('analytics-streak-days');
        const peakEl = document.getElementById('analytics-peak-hour');
        const chartBox = document.getElementById('analytics-chart-box');

        if (totalEl) totalEl.textContent = personalAnalytics.data.totalLaunches || 0;
        if (streakEl) streakEl.textContent = `${personalAnalytics.data.streakDays || 1} 🔥`;
        if (peakEl) peakEl.textContent = personalAnalytics.getPeakProductivityHour();
        if (chartBox) chartBox.innerHTML = personalAnalytics.generate7DayChartSVG();
    }

    getWidgetMap() {
        return [
            { id: 'toggle-widget-scratchpad', target: 'widget-scratchpad-card', key: 'widget_scratchpad_visible' },
            { id: 'toggle-widget-calendar', target: 'widget-calendar-card', key: 'widget_calendar_visible' },
            { id: 'toggle-widget-ambient', target: 'widget-ambient-card', key: 'widget_ambient_visible' },
            { id: 'toggle-widget-pomodoro', target: 'widget-pomodoro-card', key: 'widget_pomodoro_visible' },
            { id: 'toggle-widget-radar', target: 'widget-tech-radar-card', key: 'widget_tech_radar_visible' },
            { id: 'toggle-widget-telemetry', target: 'telemetry-capsule', key: 'widget_telemetry_visible' }
        ];
    }

    syncWidgetToggles() {
        this.getWidgetMap().forEach(({ id, target, key }) => {
            const toggle = document.getElementById(id);
            const el = document.getElementById(target);
            const isVisible = localStorage.getItem(key) !== 'false';
            if (el) el.classList.toggle('hidden', !isVisible);
            if (toggle) toggle.checked = isVisible;
        });
    }

    bindWidgetToggles() {
        this.syncWidgetToggles();
        this.getWidgetMap().forEach(({ id, target, key }) => {
            const toggle = document.getElementById(id);
            const el = document.getElementById(target);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    soundFx.play('click');
                    if (el) el.classList.toggle('hidden', !e.target.checked);
                    localStorage.setItem(key, e.target.checked ? 'true' : 'false');
                });
            }
        });
    }
}
