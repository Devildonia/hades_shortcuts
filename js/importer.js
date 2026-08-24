// js/importer.js - Universal Bookmarks.html Parser & Importer

import { state } from './state.js';
import { i18nDictionaries } from './i18n.js';

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
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a');
        const imported = [];

        links.forEach((a, idx) => {
            const url = a.getAttribute('href');
            const title = (a.textContent || '').trim();
            if (url && (url.startsWith('http://') || url.startsWith('https://')) && title) {
                // Determine icon or use default
                imported.push({
                    id: `imp_${Date.now()}_${idx}`,
                    title: title.slice(0, 30),
                    url: url,
                    icon: 'iconos/google.webp',
                    category: 'cat_tools',
                    tags: 'imported, bookmark',
                    desc: title
                });
            }
        });

        if (imported.length === 0) {
            this.showStatus(this.getMsg('error_msg'), 'error');
            return;
        }

        // Merge mode
        const updated = [...state.shortcuts, ...imported];
        state.saveShortcuts(updated);
        this.renderer.render();

        const successText = this.getMsg('success_msg').replace('{count}', imported.length);
        this.showStatus(successText, 'success');
        this.fileInput.value = '';
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
