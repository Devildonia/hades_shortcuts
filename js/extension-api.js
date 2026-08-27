// js/extension-api.js - Native Extension Integrations (TopSites Onboarding & Context Menu Sync)

import { platform } from './platform.js';
import { state, showToast } from './state.js';
import { soundFx } from './audio.js';
import { getTranslation } from './i18n.js';

export class ExtensionAPIEngine {
    constructor() {
        this.isReady = false;
    }

    init() {
        this.bindTopSitesButton();
        if (!platform.isExtension) return;
        this.bindBackgroundMessages();
        this.initSyncObserver();
        this.drainPendingShortcuts();
        this.ensureContextMenuPermission();
        state.on('shortcuts:changed', () => this.pushShortcutsToSync());
        this.isReady = true;
    }

    bindTopSitesButton() {
        const btn = document.getElementById('import-topsites-btn');
        if (!btn) return;
        btn.classList.toggle('hidden', !platform.isExtension);
        btn.addEventListener('click', async () => {
            const added = await this.importTopSitesToShortcuts();
            const status = document.getElementById('import-bookmarks-status');
            if (status) {
                status.textContent = added === false
                    ? 'Permiso de TopSites denegado o no disponible.'
                    : (added > 0 ? `Se importaron ${added} sitios frecuentes.` : 'No había sitios nuevos que importar.');
            }
        });
    }

    pushShortcutsToSync() {
        if (!platform.isExtension || !chrome.storage || !chrome.storage.sync) return;
        try {
            chrome.storage.sync.set({ custom_shortcuts_v2: state.shortcuts }, () => {
                if (chrome.runtime && chrome.runtime.lastError) {
                    console.warn('[ExtensionAPI] Sync error:', chrome.runtime.lastError);
                    showToast(getTranslation('toasts.sync_push_error') || 'Could not sync with chrome.storage.', 'error');
                }
            });
        } catch (e) {
            showToast(getTranslation('toasts.sync_push_error') || 'Could not sync with chrome.storage.', 'error');
        }
    }

    drainPendingShortcuts() {
        if (!chrome.storage || !chrome.storage.local) return;
        chrome.storage.local.get({ pending_shortcuts: [] }, (data) => {
            const pending = data.pending_shortcuts || [];
            if (!pending.length) return;
            pending.forEach((item) => {
                if (item && item.url && !state.shortcuts.some((s) => s.url === item.url)) {
                    state.shortcuts.push(item);
                }
            });
            state.saveShortcuts(state.shortcuts);
            chrome.storage.local.set({ pending_shortcuts: [] });
        });
    }

    async ensureContextMenuPermission() {
        const granted = await platform.requestPermission('contextMenus');
        if (granted && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'ensure_context_menu' }).catch(() => {});
        }
    }

    async importTopSitesToShortcuts() {
        const hasPerm = await platform.requestPermission('topSites');
        if (!hasPerm) return false;

        const sites = await platform.getTopSites();
        if (!sites || sites.length === 0) return false;

        soundFx.play('chime');
        let addedCount = 0;
        sites.slice(0, 8).forEach(site => {
            const exists = state.shortcuts.some(s => s.url === site.url);
            if (!exists) {
                const domain = new URL(site.url).hostname.replace('www.', '');
                state.shortcuts.push({
                    id: 'ext_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                    title: site.title || domain,
                    url: site.url,
                category: 'cat_tools',
                    icon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(site.url)}&sz=64`,
                    desc: `Importado de tus sitios frecuentes de Chrome`,
                    tags: 'extension topsites chrome'
                });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            state.saveShortcuts(state.shortcuts);
        }
        return addedCount;
    }

    bindBackgroundMessages() {
        if (!platform.isExtension || !chrome.runtime || !chrome.runtime.onMessage) return;
        chrome.runtime.onMessage.addListener((request) => {
            if (request.action === 'add_shortcut' && request.data) {
                state.shortcuts.push(request.data);
                state.saveShortcuts(state.shortcuts);
                soundFx.play('chime');
            }
        });
    }

    initSyncObserver() {
        if (!platform.isExtension || !chrome.storage || !chrome.storage.onChanged) return;
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync' && changes.custom_shortcuts_v2) {
                const newShortcuts = changes.custom_shortcuts_v2.newValue;
                if (Array.isArray(newShortcuts) && JSON.stringify(newShortcuts) !== JSON.stringify(state.shortcuts)) {
                    state.shortcuts = newShortcuts;
                    localStorage.setItem('custom_shortcuts_v2', JSON.stringify(newShortcuts));
                    state.emit('shortcuts:changed');
                }
            }
        });
    }
}

export const extensionApi = new ExtensionAPIEngine();
