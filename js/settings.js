import { personalAnalytics } from './personal-analytics.js';
import { auroraCanvas } from './aurora-canvas.js';
import { macroEngine } from './macros.js';
// js/settings.js - Slide-Over Settings Drawer Hub

import { state } from './state.js';
import { updateDocumentLocalization, loadLocaleAsync, getTranslation, i18nDictionaries } from './i18n.js';
import { soundFx } from './audio.js';
import { spacesManager } from './spaces.js';

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
        this.tagsToggle = document.getElementById('setting-show-tags-toggle');
        this.chromeBezelToggle = document.getElementById('setting-chrome-bezel-toggle');
        this.goldBezelToggle = document.getElementById('setting-gold-bezel-toggle');
        this.blueBezelToggle = document.getElementById('setting-blue-bezel-toggle');
        this.lilacBezelToggle = document.getElementById('setting-lilac-bezel-toggle');
        this.greenBezelToggle = document.getElementById('setting-green-bezel-toggle');
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
                if (confirm(getTranslation('toasts.reset_analytics_confirm') || '¿Deseas reiniciar tu historial local de uso y estadísticas?')) {
                    personalAnalytics.resetData();
                    this.renderAnalyticsTab();
                }
            };
        }

        // Editor de Perfiles: botón de reset total + render inicial del contenedor.
        const resetAllProfilesBtn = document.getElementById('profiles-reset-all-btn');
        if (resetAllProfilesBtn) {
            resetAllProfilesBtn.addEventListener('click', () => {
                soundFx.play('click');
                const msg = getTranslation('settings_hub.profiles.reset_all_confirm') || '¿Restablecer los 6 perfiles a sus valores de fábrica?';
                if (confirm(msg)) {
                    spacesManager.resetAllSpaces();
                    this.renderProfilesEditor();
                }
            });
        }
        this.renderProfilesEditor();

        if (this.importer) this.importer.init();
    }

    open() {
        if (!this.drawer) return;
        soundFx.play('click');
        this.syncUIState();
        this.drawer.classList.remove('hidden');
        document.body.classList.add('settings-open');
        this.renderAnalyticsTab();
        this.renderProfilesEditor();
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
        if (this.tagsToggle) this.tagsToggle.checked = state.showShortcutTags;
        if (this.chromeBezelToggle) this.chromeBezelToggle.checked = state.showChromeBezel !== false;
        if (this.goldBezelToggle) this.goldBezelToggle.checked = state.showGoldBezel !== false;
        if (this.blueBezelToggle) this.blueBezelToggle.checked = state.showBlueBezel !== false;
        if (this.lilacBezelToggle) this.lilacBezelToggle.checked = state.showLilacBezel !== false;
        if (this.greenBezelToggle) this.greenBezelToggle.checked = state.showGreenBezel !== false;

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
                    if (targetTab === 'profiles') this.renderProfilesEditor();
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

        if (this.tagsToggle) {
            this.tagsToggle.addEventListener('change', (e) => {
                soundFx.play('click');
                state.setShowShortcutTags(e.target.checked);
            });
        }

        if (this.chromeBezelToggle) {
            this.chromeBezelToggle.addEventListener('change', (e) => {
                soundFx.play('click');
                state.setShowChromeBezel(e.target.checked);
            });
        }

        if (this.goldBezelToggle) {
            this.goldBezelToggle.addEventListener('change', (e) => {
                soundFx.play('click');
                state.setShowGoldBezel(e.target.checked);
            });
        }

        if (this.blueBezelToggle) {
            this.blueBezelToggle.addEventListener('change', (e) => {
                soundFx.play('click');
                state.setShowBlueBezel(e.target.checked);
            });
        }

        if (this.lilacBezelToggle) {
            this.lilacBezelToggle.addEventListener('change', (e) => {
                soundFx.play('click');
                state.setShowLilacBezel(e.target.checked);
            });
        }

        if (this.greenBezelToggle) {
            this.greenBezelToggle.addEventListener('change', (e) => {
                soundFx.play('click');
                state.setShowGreenBezel(e.target.checked);
            });
        }

        this.bindWidgetToggles();
        this.bindCategoryToggles();

        // Re-aplica la visibilidad de categorías tras cada render del tablero
        // (cambio de espacio, modo edición, etc.) y refresca las etiquetas al cambiar idioma.
        state.on('dashboard:rendered', () => this.syncCategoryToggles());
        state.on('language:changed', () => {
            this.buildCategoryToggles();
            this.syncCategoryToggles();
            this.renderProfilesEditor();
        });

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
        if (streakEl) streakEl.textContent = `${personalAnalytics.data.streakDays || 1} ${getTranslation('analytics.streak_label') || 'días de racha'}`;
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
            { id: 'toggle-widget-telemetry', target: 'telemetry-capsule', key: 'widget_telemetry_visible' },
            // Cajones del tablero: perfiles, agente IA y barra de búsqueda
            { id: 'toggle-panel-spaces', target: 'spaces-switcher-bar', key: 'panel_spaces_visible' },
            { id: 'toggle-panel-ai', target: 'ai-launcher-card', key: 'panel_ai_visible' },
            { id: 'toggle-panel-search', target: 'zone-hero', key: 'panel_search_visible' },
            // Encabezado: hora, tiempo (clima) y título HaDeS' Shortcuts
            { id: 'toggle-panel-clock', target: 'clock-widget', key: 'panel_clock_visible' },
            { id: 'toggle-panel-weather', target: 'weather-widget', key: 'panel_weather_visible' },
            { id: 'toggle-panel-brand', target: 'zone-header-center', key: 'panel_brand_visible' }
        ];
    }

    getPanelCategories() {
        const t = (typeof i18nDictionaries !== 'undefined' && i18nDictionaries[state.language]) || {};
        return state.categories.map(cat => ({
            id: `toggle-cat-${cat.id}`,
            selector: `[data-cat-id="${cat.id}"]`,
            key: `category_visible_${cat.id}`,
            label: (t.categories && t.categories[cat.id]) || cat.defaultTitle
        }));
    }

    buildCategoryToggles() {
        const container = document.getElementById('category-toggles-container');
        if (!container) return;
        const prev = {};
        container.querySelectorAll('input[type="checkbox"]').forEach(cb => { prev[cb.id] = cb.checked; });
        container.innerHTML = '';
        this.getPanelCategories().forEach(({ id, label }) => {
            const row = document.createElement('div');
            row.className = 'settings-toggle-row';
            // margin-top: 10px lo aporta la regla base .settings-toggle-row (css/settings.css)
            const span = document.createElement('span');
            span.className = 'settings-toggle-title';
            span.textContent = label;
            const labelEl = document.createElement('label');
            labelEl.className = 'switch';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = id;
            const slider = document.createElement('span');
            slider.className = 'slider round';
            labelEl.appendChild(input);
            labelEl.appendChild(slider);
            row.appendChild(span);
            row.appendChild(labelEl);
            container.appendChild(row);
            if (prev[id] !== undefined) input.checked = prev[id];
        });
    }

    syncCategoryToggles() {
        this.getPanelCategories().forEach(({ id, selector, key }) => {
            const toggle = document.getElementById(id);
            const el = document.querySelector(selector);
            const isVisible = localStorage.getItem(key) !== 'false';
            if (el) el.classList.toggle('hidden', !isVisible);
            if (toggle) toggle.checked = isVisible;
        });
    }

    bindCategoryToggles() {
        this.buildCategoryToggles();
        this.syncCategoryToggles();
        this.getPanelCategories().forEach(({ id, selector, key }) => {
            const toggle = document.getElementById(id);
            if (!toggle) return;
            toggle.addEventListener('change', (e) => {
                soundFx.play('click');
                const el = document.querySelector(selector);
                if (el) el.classList.toggle('hidden', !e.target.checked);
                localStorage.setItem(key, e.target.checked ? 'true' : 'false');
            });
        });
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

    // ==================== Editor de Perfiles (6 espacios totalmente editables) ====================

    getCategoryList() {
        const t = (typeof i18nDictionaries !== 'undefined' && i18nDictionaries[state.language]) || {};
        return state.categories.map((cat) => ({
            catId: cat.id,
            label: (t.categories && t.categories[cat.id]) || cat.defaultTitle || cat.id
        }));
    }

    _profileIcon(kind) {
        const icons = {
            up: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
            down: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
            reset: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3.2-6.9"/><path d="M3 4v5h5"/></svg>'
        };
        return icons[kind] || '';
    }

    renderProfilesEditor() {
        const container = document.getElementById('profiles-editor-container');
        if (!container) return;
        container.innerHTML = '';

        const t = (key) => getTranslation(key) || '';
        const cats = this.getCategoryList();
        const spaces = spacesManager.data.spaces;

        spaces.forEach((sp, idx) => {
            const card = document.createElement('div');
            card.className = 'profile-card';
            card.setAttribute('data-space-id', sp.id);
            card.style.setProperty('--space-accent', sp.accent || '#3b82f6');

            // Cabecera: punto de acento, nombre y herramientas (color, subir, bajar, reset)
            const head = document.createElement('div');
            head.className = 'profile-card-head';

            const dot = document.createElement('span');
            dot.className = 'profile-accent-dot';
            dot.style.background = sp.accent || '#8892b0';
            dot.setAttribute('aria-hidden', 'true');
            head.appendChild(dot);

            const nameField = document.createElement('div');
            nameField.className = 'profile-name-field';
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'settings-select profile-name-input';
            nameInput.id = `pf-name-${sp.id}`;
            nameInput.maxLength = 24;
            nameInput.value = sp.customName ? sp.name : (getTranslation(`spaces.${sp.id}`) || sp.name);
            nameInput.placeholder = t('settings_hub.profiles.name_placeholder');
            nameInput.setAttribute('aria-label', t('settings_hub.profiles.name_label') || 'Nombre');
            nameInput.addEventListener('change', (e) => {
                soundFx.play('click');
                spacesManager.renameSpace(sp.id, e.target.value);
                this.renderProfilesEditor();
            });
            nameField.appendChild(nameInput);
            head.appendChild(nameField);

            const tools = document.createElement('div');
            tools.className = 'profile-card-tools';

            const accentInput = document.createElement('input');
            accentInput.type = 'color';
            accentInput.className = 'profile-accent-input';
            accentInput.id = `pf-accent-${sp.id}`;
            accentInput.value = sp.accent || '#00f2fe';
            const accentLabel = t('settings_hub.profiles.accent_label') || 'Color de acento';
            accentInput.setAttribute('aria-label', accentLabel);
            accentInput.title = accentLabel;
            accentInput.addEventListener('input', (e) => {
                spacesManager.setSpaceAccent(sp.id, e.target.value);
                const d = card.querySelector('.profile-accent-dot');
                if (d) d.style.background = e.target.value;
            });
            tools.appendChild(accentInput);

            const mkBtn = (action, kind, labelKey, disabled) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'profile-tool-btn';
                b.setAttribute('data-action', action);
                b.setAttribute('data-space-id', sp.id);
                b.innerHTML = this._profileIcon(kind);
                const label = t(labelKey);
                b.setAttribute('aria-label', label);
                b.title = label;
                if (disabled) b.disabled = true;
                b.addEventListener('click', () => {
                    soundFx.play('click');
                    if (action === 'up') spacesManager.moveSpace(sp.id, -1);
                    else if (action === 'down') spacesManager.moveSpace(sp.id, 1);
                    else if (action === 'reset') spacesManager.resetSpace(sp.id);
                    this.renderProfilesEditor();
                });
                return b;
            };

            tools.appendChild(mkBtn('up', 'up', 'settings_hub.profiles.move_up', idx === 0));
            tools.appendChild(mkBtn('down', 'down', 'settings_hub.profiles.move_down', idx === spaces.length - 1));
            tools.appendChild(mkBtn('reset', 'reset', 'settings_hub.profiles.reset_one', false));
            head.appendChild(tools);
            card.appendChild(head);

            // Categorías visibles (ninguna marcada = se muestran todas)
            const catsBox = document.createElement('div');
            catsBox.className = 'profile-cats';
            const catsLabel = document.createElement('span');
            catsLabel.className = 'profile-cats-label';
            catsLabel.textContent = t('settings_hub.profiles.categories_label');
            catsBox.appendChild(catsLabel);

            const selected = Array.isArray(sp.categoryIds) ? sp.categoryIds : [];
            const grid = document.createElement('div');
            grid.className = 'profile-cats-grid';

            cats.forEach((c) => {
                const chip = document.createElement('label');
                chip.className = 'profile-cat-chip';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.setAttribute('data-space-id', sp.id);
                cb.setAttribute('data-cat', c.catId);
                cb.checked = selected.includes(c.catId);
                cb.addEventListener('change', () => {
                    soundFx.play('click');
                    const checked = [...card.querySelectorAll('.profile-cat-chip input:checked')].map((el) => el.getAttribute('data-cat'));
                    spacesManager.setSpaceCategories(sp.id, checked.length ? checked : null);
                    this._updateProfileHint(card);
                });
                const span = document.createElement('span');
                span.textContent = c.label;
                chip.appendChild(cb);
                chip.appendChild(span);
                grid.appendChild(chip);
            });
            catsBox.appendChild(grid);

            const hint = document.createElement('span');
            hint.className = 'profile-cats-hint';
            catsBox.appendChild(hint);
            this._setProfileHint(hint, selected.length === 0);

            card.appendChild(catsBox);
            container.appendChild(card);
        });

        const orderHint = t('settings_hub.profiles.order_hint');
        if (orderHint) {
            const hint = document.createElement('p');
            hint.className = 'settings-hint profile-order-hint';
            hint.textContent = orderHint;
            container.appendChild(hint);
        }
    }

    _setProfileHint(hintEl, allShown) {
        if (!hintEl) return;
        hintEl.textContent = allShown ? (getTranslation('settings_hub.profiles.all_hint') || '') : '';
    }

    _updateProfileHint(card) {
        const hint = card.querySelector('.profile-cats-hint');
        const checked = card.querySelectorAll('.profile-cat-chip input:checked');
        this._setProfileHint(hint, checked.length === 0);
    }
}
