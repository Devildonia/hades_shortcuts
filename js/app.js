// js/app.js - Master Orchestrator for HaDeS' Shortcuts Next-Gen
import { macroEngine } from './macros.js';
import { aiAgent } from './ai-agent.js';
import { state, setStorageFullMsg } from './state.js';
import { soundFx } from './audio.js';
import { updateDocumentLocalization, loadLocaleAsync, getTranslation } from './i18n.js';
import { WeatherEngine } from './weather.js';
import { SearchEngineManager } from './search.js';
import { DashboardRenderer } from './render.js';
import { DragDropManager } from './dragdrop.js';
import { LayoutManager } from './layout.js';
import { ShortcutManager } from './shortcut-manager.js';
import { BackupManager } from './backup.js';
import { SettingsHub } from './settings.js';
import { widgetsManager } from './widgets.js';
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
    // T5.3 (Fase 5): #brand-user-name declara role="button" tabindex="0" en index.html,
    // así que debe responder a teclado (Enter/Space) además del click.
    if (brandName) brandName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); }
    });
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
            const searchInput = document.getElementById('main-search') || document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
            return;
        }

        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal-overlay:not(.hidden), .settings-drawer-backdrop:not(.hidden), [role="dialog"]:not(.hidden)');
            const drawer = document.getElementById('settings-drawer');
            if (drawer && !drawer.classList.contains('hidden')) {
                drawer.classList.add('hidden');
                return;
            }
            if (modals.length > 0) {
                modals.forEach(m => m.classList.add('hidden'));
                return;
            }
            const searchInput = document.getElementById('main-search') || document.getElementById('search-input');
            if (searchInput && document.activeElement === searchInput) {
                searchInput.value = '';
                searchInput.blur();
                state.emit('filter:changed', '');
            }
        }

        if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            const searchInput = document.getElementById('main-search') || document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            document.getElementById('settings-btn')?.click();
        }
    });
}

export function initApp() {
    document.documentElement.setAttribute('data-theme', state.theme);
    state.applyShortcutTagsVisibility();
    state.applyChromeBezel();
    state.applyGoldBezel();
    state.applyBlueBezel();
    state.on('theme:changed', (newTheme) => {
        document.documentElement.setAttribute('data-theme', newTheme);
        soundFx.play('click');
    });

    const weather = new WeatherEngine();
    const renderer = new DashboardRenderer();
    const layoutManager = new LayoutManager();
    const search = new SearchEngineManager();
    const widgets = widgetsManager;
    const shortcutManager = new ShortcutManager(renderer);
    const backupManager = new BackupManager(renderer);
    const themeStudio = new ThemeStudio();
    const importer = new BookmarksImporter(renderer);
    const postits = new PostItManager();
    const dragDropManager = new DragDropManager();
    const cryptoSync = new CryptoSyncEngine(renderer);
    const settingsHub = new SettingsHub(renderer, shortcutManager, backupManager, importer, themeStudio);

    initUserNameSystem(weather, settingsHub);
    initGlobalShortcuts();

    window.widgetsManager = widgetsManager;
    window.focusMode = focusMode;

    window.spacesManager = spacesManager;
    spacesManager.init();
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
    themeStudio.init();
    settingsHub.init();
    cryptoSync.init();
    auroraCanvas.init();
    radialHUD.init();
    solarEngine.init();
    telemetry.init();
    techRadar.init();
    neuralSearch.init();
    macroEngine.init();
    aiAgent.init();
    calendarAgenda.init();
    focusMode.init();

    state.on('shortcuts:changed', () => {
        renderer.render();
        layoutManager.applyPositions();
        search.filterShortcuts();
    });
    state.on('space:changed', () => {
        renderer.render();
        layoutManager.applyPositions();
        search.filterShortcuts();
        search.updatePillCounts();
    });
    state.on('editmode:changed', () => {
        renderer.render();
        layoutManager.applyPositions();
        search.filterShortcuts();
    });

    const suggestionBanner = document.getElementById('smart-suggestion-banner');
    if (suggestionBanner) personalAnalytics.renderSmartChip(suggestionBanner);

    const glowOn = localStorage.getItem('ambient_glow_enabled') !== 'false';
    document.querySelectorAll('.ambient-glow').forEach((el) => el.classList.toggle('hidden', !glowOn));

    window.themeStudio = themeStudio;
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
    window.macroEngine = macroEngine;
    window.layoutManager = layoutManager;
    window.postitsManager = postits;
    window.aiAgent = aiAgent;
    window.calendarAgenda = calendarAgenda;
    window.tagsFilter = tagsFilter;
    window.focusMode = focusMode;
    window.widgetsManager = widgetsManager;
    extensionApi.init();
    miniHud.init();

    // Registra el mensaje traducido de error de storage en la capa base (state.js).
    setStorageFullMsg(() => getTranslation('toasts.storage_full') || 'No se pudo guardar (almacenamiento lleno o bloqueado).');

    loadLocaleAsync(state.language).then(() => {
        document.documentElement.lang = state.language || 'es';
        updateDocumentLocalization();
        search.updatePlaceholders();
        renderer.render();
        layoutManager.applyPositions();
        if (suggestionBanner) personalAnalytics.renderSmartChip(suggestionBanner);
    });

    if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
