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

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== 'save-to-hades') return;
    const targetUrl = info.linkUrl || info.pageUrl || (tab ? tab.url : '');
    const targetTitle = tab ? tab.title : 'Nuevo Atajo';
    if (!targetUrl) return;
    let domain = '';
    try { domain = new URL(targetUrl).hostname.replace(/^www\./, ''); } catch (e) {}
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
