// js/sw-extension.js - Chrome Manifest V3 Background Service Worker

function ensureContextMenu() {
    if (!chrome.contextMenus) return;
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'save-to-hades',
            title: 'Guardar en HaDeS Shortcuts',
            contexts: ['page', 'link']
        });
    });
}

chrome.runtime.onInstalled.addListener(() => {
    ensureContextMenu();
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request && request.action === 'ensure_context_menu') {
        ensureContextMenu();
        sendResponse({ ok: true });
    }
    return false;
});

// Resolves a human-friendly title for the shortcut being saved.
// Priority order (each level degrades gracefully without extra permissions):
//   1. info.linkText  - anchor text when right-clicking a link (always available).
//   2. tab.title      - only populated if the "tabs" permission is granted.
//   3. chrome.tabs.get(tab.id) - "activeTab" is granted by the context menu
//      invocation itself, so the clicked (active) tab's title is readable.
//   4. The domain derived from the URL, or a generic default.
async function resolveShortcutTitle(info, tab, fallbackDomain) {
    if (info && info.linkText && info.linkText.trim()) return info.linkText.trim();
    if (tab && tab.title) return tab.title;
    if (tab && tab.id !== undefined && chrome.tabs && chrome.tabs.get) {
        try {
            const current = await chrome.tabs.get(tab.id);
            if (current && current.title) return current.title;
        } catch (e) {
            // activeTab not available for this tab; fall back to the domain.
        }
    }
    return fallbackDomain || 'Nuevo Atajo';
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== 'save-to-hades') return;
    const targetUrl = info.linkUrl || info.pageUrl || (tab ? tab.url : '');
    if (!targetUrl) return;
    let domain = '';
    try { domain = new URL(targetUrl).hostname.replace(/^www\./, ''); } catch (e) {}
    resolveShortcutTitle(info, tab, domain).then((targetTitle) => {
        const newShortcut = {
            id: 'ctx_' + Date.now(),
            title: targetTitle || domain || 'Nuevo Atajo',
            url: targetUrl,
            category: 'cat_tools',
            icon: domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : '',
            desc: 'Guardado desde el menú contextual del navegador',
            tags: 'contextmenu, guardado'
        };
        chrome.storage.local.get({ pending_shortcuts: [] }, (data) => {
            const list = data.pending_shortcuts || [];
            list.push(newShortcut);
            chrome.storage.local.set({ pending_shortcuts: list }, () => {
                chrome.runtime.sendMessage({ action: 'add_shortcut', data: newShortcut }).catch(() => {});
            });
        });
    });
});
