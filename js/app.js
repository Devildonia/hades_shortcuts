// js/app.js - Master Orchestrator for HaDeS' Shortcuts Next-Gen
import { state } from './state.js';
import { soundFx } from './audio.js';
import { updateDocumentLocalization, loadLocaleAsync } from './i18n.js';
import { WeatherEngine } from './weather.js';
import { SearchEngineManager } from './search.js';
import { DashboardRenderer } from './render.js';
import { DragDropManager } from './dragdrop.js';
import { LayoutManager } from './layout.js';
import { ShortcutManager } from './shortcut-manager.js';
import { BackupManager } from './backup.js';
import { SettingsHub } from './settings.js';
import { WidgetsManager } from './widgets.js';
import { PostItManager } from './postits.js';
import { ThemeStudio } from './theme-studio.js';
import { BookmarksImporter } from './importer.js';
import { devTools } from './devtools.js';
import { ambientAudio } from './ambient-audio.js';
import { CryptoSyncEngine } from './crypto-sync.js';
import { auroraCanvas, miniHud } from './aurora-canvas.js';
import { radialHUD } from './radial-hud.js';
import { solarEngine } from './solar-engine.js';
import { telemetry } from './telemetry.js';
import { techRadar } from './tech-radar.js';
import { neuralSearch } from './neural-search.js';
import { extensionApi } from './extension-api.js';
import { platform } from './platform.js';
import { personalAnalytics } from './personal-analytics.js';
import { spacesManager } from './spaces.js';
import { calendarAgenda } from './calendar-agenda.js';
import { tagsFilter } from './tags-filter.js';
import { focusMode } from './focus-mode.js';

export function initUserNameSystem(weather, settingsHub) {
    const brandName = document.getElementById('brand-user-name');
    const brandSuffix = document.getElementById('brand-user-suffix');
    const brandTitle = document.querySelector('.brand-title');
    const modal = document.getElementById('user-modal');
    const input = document.getElementById('user-name-input');
    const saveBtn = document.getElementById('user-save-btn');
    const closeBtn = document.getElementById('close-user-modal');
    const preview = document.getElementById('user-preview-text');
    const drawerInput = document.getElementById('drawer-user-name-input');
    const drawerSaveBtn = document.getElementById('drawer-user-save-btn');

    const updateDisplay = (name) => {
        const trimmed = (name || 'HaDeS').trim();
        const suffix = trimmed.toLowerCase().endsWith('s') ? "'" : "'s";
        if (brandName) brandName.textContent = trimmed;
        if (brandSuffix) brandSuffix.textContent = suffix;
        if (drawerInput) drawerInput.value = trimmed;
        if (input) input.value = trimmed;
        document.title = `${trimmed}${suffix} Shortcuts · Command Center`;
        if (weather && weather.updateClockAndGreeting) {
            weather.updateClockAndGreeting();
        }
    };

    state.on('username:changed', (name) => updateDisplay(name));
    updateDisplay(state.userName);

    const openModal = () => {
        soundFx.play('click');
        if (modal) modal.classList.remove('hidden');
        if (input) {
            input.value = state.userName;
            setTimeout(() => { input.focus(); input.select(); }, 50);
        }
        updatePreview();
    };

    const closeModal = () => {
        soundFx.play('click');
        if (modal) modal.classList.add('hidden');
    };

    const updatePreview = () => {
        if (!preview || !input) return;
        const val = input.value.trim() || 'HaDeS';
        const s = val.toLowerCase().endsWith('s') ? "'" : "'s";
        preview.textContent = `${val}${s} Shortcuts`;
    };

    const saveName = (newName) => {
        const trimmed = (newName || '').trim();
        if (trimmed) {
            soundFx.play('chime');
            state.setUserName(trimmed);
            closeModal();
        }
    };

    if (brandTitle) brandTitle.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (input) {
        input.addEventListener('input', updatePreview);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveName(input.value);
            if (e.key === 'Escape') closeModal();
        });
    }
    if (saveBtn) saveBtn.addEventListener('click', () => saveName(input.value));
    if (drawerSaveBtn && drawerInput) drawerSaveBtn.addEventListener('click', () => saveName(drawerInput.value));
}

export function initGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isEditing = activeTag === 'input' || activeTag === 'textarea' || document.activeElement.isContentEditable;

        if (e.key === '/' && !isEditing) {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
            return;
        }

        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal-overlay:not(.hidden)');
            if (modals.length > 0) {
                modals.forEach(m => m.classList.add('hidden'));
                return;
            }
            const drawer = document.getElementById('settings-drawer');
            if (drawer && drawer.classList.contains('open')) {
                drawer.classList.remove('open');
                const overlay = document.getElementById('settings-overlay');
                if (overlay) overlay.classList.add('hidden');
                return;
            }
            const searchInput = document.getElementById('search-input');
            if (searchInput && document.activeElement === searchInput) {
                searchInput.value = '';
                searchInput.blur();
                state.filterQuery = '';
                state.emit('filter:changed', '');
            }
        }
    });
}

export function initApp() {
    document.documentElement.setAttribute('data-theme', state.theme);
    state.on('theme:changed', (newTheme) => {
        document.documentElement.setAttribute('data-theme', newTheme);
        soundFx.play('click');
    });

    const weather = new WeatherEngine();
    const renderer = new DashboardRenderer();
    const layoutManager = new LayoutManager();
    const search = new SearchEngineManager();
    const widgets = new WidgetsManager();
    const shortcutManager = new ShortcutManager();
    const backupManager = new BackupManager();
    const themeStudio = new ThemeStudio();
    const importer = new BookmarksImporter();
    const postits = new PostItManager();
    const dragDropManager = new DragDropManager();
    const cryptoSync = new CryptoSyncEngine();
    const settingsHub = new SettingsHub(weather, themeStudio, importer);

    initUserNameSystem(weather, settingsHub);
    initGlobalShortcuts();

    renderer.render();
    layoutManager.init();
    weather.init();
    search.init();
    widgets.init();
    devTools.init();
    ambientAudio.init();
    postits.init();
    dragDropManager.init();
    shortcutManager.init();
    backupManager.init();
    settingsHub.init();
    cryptoSync.init();
    auroraCanvas.init();
    radialHUD.init();
    solarEngine.init();
    telemetry.init();
    techRadar.init();
    neuralSearch.init();
    spacesManager.init();
    calendarAgenda.init();
    tagsFilter.init();
    focusMode.init();

    window.ambientAudio = ambientAudio;
    window.radialHUD = radialHUD;
    window.solarEngine = solarEngine;
    window.telemetry = telemetry;
    window.techRadar = techRadar;
    window.neuralSearch = neuralSearch;
    window.devTools = devTools;
    window.platform = platform;
    window.extensionApi = extensionApi;
    window.personalAnalytics = personalAnalytics;
    window.spacesManager = spacesManager;
    window.calendarAgenda = calendarAgenda;
    window.tagsFilter = tagsFilter;
    window.focusMode = focusMode;
    extensionApi.init();
    miniHud.init();

    loadLocaleAsync(state.language).then(() => {
        updateDocumentLocalization();
        renderer.render();
        layoutManager.applyPositions();
    });

    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 500);
        }, 150);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
