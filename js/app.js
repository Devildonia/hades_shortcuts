import { devTools } from './devtools.js';
// js/app.js - Master Orchestrator for HaDeS' Shortcuts Next-Gen

import { state } from './state.js';
import { updateDocumentLocalization, loadLocaleAsync } from './i18n.js';
import { soundFx } from './audio.js';
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

    // Listen to reactive state changes
    state.on('username:changed', (name) => updateDisplay(name));

    // Initial render
    updateDisplay(state.userName);

    const openModal = () => {
        soundFx.play('click');
        if (modal) modal.classList.remove('hidden');
        if (input) {
            input.value = state.userName;
            setTimeout(() => {
                input.focus();
                input.select();
            }, 50);
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
        const suffix = val.toLowerCase().endsWith('s') ? "'" : "'s";
        preview.textContent = `${val}${suffix} SHORTCUTS`;
    };

    const applyNewName = (rawName) => {
        soundFx.play('click');
        const newName = (rawName || 'HaDeS').trim();
        state.setUserName(newName);
        updateDisplay(newName);
    };

    if (brandName) brandName.addEventListener('click', openModal);
    if (brandTitle) brandTitle.addEventListener('click', openModal);
    if (brandName) {
        brandName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal();
            }
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            applyNewName(input ? input.value : 'HaDeS');
            closeModal();
        });
    }

    if (drawerSaveBtn) {
        drawerSaveBtn.addEventListener('click', () => {
            applyNewName(drawerInput ? drawerInput.value : 'HaDeS');
            drawerSaveBtn.textContent = '✓ Guardado';
            setTimeout(() => {
                drawerSaveBtn.textContent = 'Guardar';
            }, 2000);
        });
    }
    if (drawerInput) {
        drawerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                applyNewName(drawerInput.value);
                if (drawerSaveBtn) {
                    drawerSaveBtn.textContent = '✓ Guardado';
                    setTimeout(() => {
                        drawerSaveBtn.textContent = 'Guardar';
                    }, 2000);
                }
            }
        });
    }

    if (input) {
        input.addEventListener('input', updatePreview);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                applyNewName(input.value);
                closeModal();
            }
            if (e.key === 'Escape') closeModal();
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
}

export function initGlobalKeybindings(search, settingsHub) {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            soundFx.play('hover');
            if (search.searchInput) {
                search.searchInput.focus();
                search.searchInput.select();
            }
        } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            soundFx.play('hover');
            if (search.searchInput) search.searchInput.focus();
        } else if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            settingsHub.open();
        }
    });
}

export function initApp() {
    // 1. Initialize Visual Theme & Custom Theme Studio
    document.documentElement.setAttribute('data-theme', state.theme);
    state.on('theme:changed', (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
    });

    const themeStudio = new ThemeStudio();
    themeStudio.init();

    // 2. Initialize Core Subsystems
    const renderer = new DashboardRenderer();
    const weather = new WeatherEngine();
    const search = new SearchEngineManager();
    const widgets = new WidgetsManager();
    const postits = new PostItManager();
    const layoutManager = new LayoutManager();
    const shortcutManager = new ShortcutManager(renderer);
    const backupManager = new BackupManager(renderer);
    const importer = new BookmarksImporter(renderer);
    const dragDropManager = new DragDropManager(renderer, layoutManager);
    const settingsHub = new SettingsHub(renderer, shortcutManager, backupManager, importer, themeStudio);

    // 3. Render Dashboard & Init Subsystems
    renderer.render();
    layoutManager.init();
    weather.init();
    search.init();
    widgets.init();
    devTools.init();
    postits.init();
    dragDropManager.init();
    shortcutManager.init();
    backupManager.init();
    settingsHub.init();

    loadLocaleAsync(state.language).then(() => {
        updateDocumentLocalization();
        renderer.render();
        layoutManager.applyPositions();
    });

    // 4. User Name Interactive Modal & Drawer Sync
    initUserNameSystem(weather, settingsHub);

    // 5. Global Keyboard Shortcuts
    initGlobalKeybindings(search, settingsHub);

    // 6. User Interaction Audio Unlock (Browser Autoplay Compliance)
    const unlockAudio = () => {
        soundFx.getAudioContext();
        document.removeEventListener('pointerdown', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
    };
    document.addEventListener('pointerdown', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    // 7. Register Service Worker for PWA
    if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
