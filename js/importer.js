// js/importer.js - Universal Bookmarks.html Parser & Importer

import { state, faviconForUrl, showToast } from './state.js';
import { i18nDictionaries } from './i18n.js';

export function normalizeBookmarkUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();
    try {
        const u = new URL(trimmed);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
        let pathname = u.pathname;
        if (pathname.length > 1 && pathname.endsWith('/')) {
            pathname = pathname.slice(0, -1);
        }
        return `${u.protocol}//${u.host.toLowerCase()}${pathname}${u.search}${u.hash}`;
    } catch {
        return null;
    }
}

export function sanitizeBookmarkTitle(rawTitle, fallbackUrl) {
    let title = (rawTitle || '').replace(/\s+/g, ' ').trim();
    if (!title) {
        try {
            const u = new URL(fallbackUrl);
            title = u.hostname.replace(/^www\./, '') || fallbackUrl;
        } catch {
            title = fallbackUrl || 'Bookmark';
        }
    }
    // Preservar títulos completos razonables sin truncar agresivamente a 30 caracteres
    if (title.length > 100) {
        title = title.slice(0, 97).trim() + '...';
    }
    return title;
}

export class BookmarksImporter {
    constructor(renderer) {
        this.renderer = renderer;
        this.fileInput = document.getElementById('bookmark-file-input');
        this.importBtn = document.getElementById('import-bookmarks-btn');
        this.statusMsg = document.getElementById('import-bookmarks-status');
    }

    init() {
        if (this.importBtn && this.fileInput) {
            this.importBtn.addEventListener('click', () => this.fileInput.click());
            this.fileInput.addEventListener('change', (e) => this.handleFileSelected(e));
        }
    }

    handleFileSelected(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const htmlContent = evt.target.result;
            this.parseBookmarks(htmlContent);
        };
        reader.readAsText(file);
    }

    parseBookmarks(html) {
        if (!html || typeof html !== 'string') {
            this.showStatus(this.getMsg('error_msg'), 'error');
            return;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a');

        if (!links || links.length === 0) {
            this.showStatus(this.getMsg('error_msg'), 'error');
            return;
        }

        // Set de URLs ya existentes normalizadas para evitar duplicados
        const existingUrls = new Set(
            (state.shortcuts || [])
                .map(s => normalizeBookmarkUrl(s.url))
                .filter(Boolean)
        );

        const seenInImport = new Set();
        const imported = [];
        let duplicateCount = 0;

        links.forEach((a, idx) => {
            const rawHref = a.getAttribute('href');
            const normUrl = normalizeBookmarkUrl(rawHref);
            if (!normUrl) return;

            // Evitar duplicar URLs existentes en el catálogo o repetidas dentro del mismo archivo
            if (existingUrls.has(normUrl) || seenInImport.has(normUrl)) {
                duplicateCount++;
                return;
            }

            seenInImport.add(normUrl);

            const title = sanitizeBookmarkTitle(a.textContent, normUrl);

            imported.push({
                id: `imp_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
                title: title,
                url: normUrl,
                icon: faviconForUrl(normUrl),
                category: 'cat_tools',
                tags: 'imported, bookmark',
                desc: a.getAttribute('title') || title
            });
        });

        if (imported.length === 0) {
            if (duplicateCount > 0) {
                const dupMsg = (state.language === 'en' ? 'All bookmarks already exist in your shortcuts.' :
                               state.language === 'fr' ? 'Tous les marque-pages existent déjà dans vos raccourcis.' :
                               state.language === 'de' ? 'Alle Lesezeichen sind bereits in Ihren Verknüpfungen vorhanden.' :
                               'Todos los marcadores ya existen en tus accesos directos.');
                this.showStatus(dupMsg, 'info');
                showToast(dupMsg, 'info');
            } else {
                this.showStatus(this.getMsg('error_msg'), 'error');
            }
            if (this.fileInput) this.fileInput.value = '';
            return;
        }

        // Merge de los nuevos atajos únicos
        const updated = [...state.shortcuts, ...imported];
        state.saveShortcuts(updated);
        if (this.renderer && this.renderer.render) this.renderer.render();

        let successText = this.getMsg('success_msg').replace('{count}', imported.length);
        if (duplicateCount > 0) {
            const skipSuffix = (state.language === 'en' ? ` (${duplicateCount} duplicates skipped)` :
                               state.language === 'fr' ? ` (${duplicateCount} doublons ignorés)` :
                               state.language === 'de' ? ` (${duplicateCount} Duplikate übersprungen)` :
                               ` (${duplicateCount} duplicados omitidos)`);
            successText += skipSuffix;
        }

        this.showStatus(successText, 'success');
        showToast(successText, 'success');
        if (this.fileInput) this.fileInput.value = '';
    }

    getMsg(key) {
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).importer || {};
        return t[key] || key;
    }

    showStatus(msg, type) {
        if (!this.statusMsg) return;
        this.statusMsg.textContent = msg;
        this.statusMsg.className = `import-status-msg ${type}`;
        setTimeout(() => {
            if (this.statusMsg) this.statusMsg.textContent = '';
        }, 5000);
    }
}
