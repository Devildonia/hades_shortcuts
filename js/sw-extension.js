// js/sw-extension.js - Chrome Manifest V3 Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
    // Register Context Menu
    chrome.contextMenus.create({
        id: 'save-to-hades',
        title: '📌 Guardar en HaDeS Shortcuts',
        contexts: ['page', 'link']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'save-to-hades') {
        const targetUrl = info.linkUrl || info.pageUrl || (tab ? tab.url : '');
        const targetTitle = tab ? tab.title : 'Nuevo Atajo';
        if (targetUrl) {
            const domain = new URL(targetUrl).hostname.replace('www.', '');
            const newShortcut = {
                id: 'ctx_' + Date.now(),
                title: targetTitle,
                url: targetUrl,
                category: 'productividad',
                icon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(targetUrl)}&sz=64`,
                desc: 'Guardado desde el menú contextual del navegador',
                tags: 'contextmenu guardado'
            };
            chrome.runtime.sendMessage({ action: 'add_shortcut', data: newShortcut }).catch(() => {});
        }
    }
});
