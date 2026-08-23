// js/app.js - Master Orchestrator for HaDeS' Shortcuts

import { state } from './state.js';
import { updateDocumentLocalization } from './i18n.js';
import { WeatherEngine } from './weather.js';
import { SearchEngineManager } from './search.js';
import { DashboardRenderer } from './render.js';
import { DragDropManager } from './dragdrop.js';
import { ShortcutManager } from './shortcut-manager.js';
import { BackupManager } from './backup.js';
import { SettingsHub } from './settings.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Visual Theme
    document.documentElement.setAttribute('data-theme', state.theme);
    state.on('theme:changed', (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
    });

    // 2. Initialize Core Subsystems
    const renderer = new DashboardRenderer();
    const weather = new WeatherEngine();
    const search = new SearchEngineManager();
    const shortcutManager = new ShortcutManager(renderer);
    const backupManager = new BackupManager(renderer);
    const dragDropManager = new DragDropManager(renderer);
    const settingsHub = new SettingsHub(renderer, shortcutManager, backupManager);

    // 3. Render Dashboard
    renderer.render();
    weather.init();
    search.init();
    dragDropManager.init();
    shortcutManager.init();
    backupManager.init();
    settingsHub.init();
    updateDocumentLocalization();

    // 4. User Name Interactive Modal
    initUserNameModal(weather);

    // 5. Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
            e.preventDefault();
            const input = document.getElementById('main-search');
            if (input) {
                input.focus();
                input.select();
            }
        } else if (e.key === 'Escape') {
            const input = document.getElementById('main-search');
            if (document.activeElement === input) {
                input.blur();
            }
        }
    });

    console.log("⚡ HaDeS' Shortcuts: Master Modular Architecture Initialized.");
});

function initUserNameModal(weather) {
    const brandUserNameEl = document.getElementById('brand-user-name');
    const brandUserSuffixEl = document.getElementById('brand-user-suffix');
    const userModal = document.getElementById('user-modal');
    const closeUserModalBtn = document.getElementById('close-user-modal');
    const userNameInput = document.getElementById('user-name-input');
    const userSaveBtn = document.getElementById('user-save-btn');
    const userPreviewText = document.getElementById('user-preview-text');

    const formatTitle = (name) => {
        const trimmed = (name || 'HaDeS').trim();
        if (!trimmed) return { name: 'HaDeS', suffix: "'", full: "HaDeS' SHORTCUTS" };
        const suffix = trimmed.slice(-1).toLowerCase() === 's' ? "'" : "'s";
        return { name: trimmed, suffix, full: `${trimmed}${suffix} SHORTCUTS` };
    };

    const updateUI = (name) => {
        const formatted = formatTitle(name);
        if (brandUserNameEl) brandUserNameEl.textContent = formatted.name;
        if (brandUserSuffixEl) brandUserSuffixEl.textContent = formatted.suffix;
        document.title = `${formatted.name}${formatted.suffix} Shortcuts · Command Center`;
        weather.updateClockAndGreeting();
    };

    updateUI(state.userName);

    if (brandUserNameEl) {
        brandUserNameEl.addEventListener('click', () => {
            if (userModal) {
                userModal.classList.remove('hidden');
                if (userNameInput) {
                    userNameInput.value = state.userName;
                    const formatted = formatTitle(state.userName);
                    if (userPreviewText) userPreviewText.textContent = formatted.full;
                    userNameInput.focus();
                }
            }
        });
    }

    if (userNameInput) {
        userNameInput.addEventListener('input', () => {
            const formatted = formatTitle(userNameInput.value);
            if (userPreviewText) userPreviewText.textContent = formatted.full;
        });
    }

    const saveName = () => {
        const val = userNameInput?.value.trim() || 'HaDeS';
        state.setUserName(val);
        updateUI(val);
        if (userModal) userModal.classList.add('hidden');
    };

    if (userSaveBtn) userSaveBtn.addEventListener('click', saveName);
    if (closeUserModalBtn) closeUserModalBtn.addEventListener('click', () => userModal?.classList.add('hidden'));
    if (userModal) {
        userModal.addEventListener('click', (e) => {
            if (e.target === userModal) userModal.classList.add('hidden');
        });
    }
}
