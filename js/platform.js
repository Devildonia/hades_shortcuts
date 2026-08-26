// js/platform.js - Universal Platform Abstraction Layer (Web/PWA vs Chrome/Firefox Extension)

export const platform = {
    isExtension: typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id,
    
    async getStorage(key, fallback = null) {
        if (this.isExtension && chrome.storage && chrome.storage.sync) {
            return new Promise((resolve) => {
                chrome.storage.sync.get([key], (result) => {
                    if (result && result[key] !== undefined) resolve(result[key]);
                    else resolve(localStorage.getItem(key) || fallback);
                });
            });
        }
        return localStorage.getItem(key) || fallback;
    },

    async setStorage(key, value) {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        if (this.isExtension && chrome.storage && chrome.storage.sync) {
            const obj = {};
            obj[key] = value;
            return new Promise((resolve) => chrome.storage.sync.set(obj, resolve));
        }
    },

    async getTopSites() {
        if (!this.isExtension || !chrome.topSites) return [];
        return new Promise((resolve) => {
            chrome.topSites.get((sites) => resolve(sites || []));
        });
    },

    async requestPermission(permName) {
        if (!this.isExtension || !chrome.permissions) return false;
        return new Promise((resolve) => {
            chrome.permissions.request({ permissions: [permName] }, (granted) => resolve(granted));
        });
    }
};
