// js/tags-filter.js - Advanced Multi-Tag Query Engine & Saved Smart Views (Linear-style CMDK)

import { state, normalizeTags, escapeHtml, persistJson, showToast } from './state.js';
import { getTranslation } from './i18n.js';
import { soundFx } from './audio.js';
import { personalAnalytics } from './personal-analytics.js';

export class TagsFilterEngine {
    constructor() {
        this.tagsKey = 'hades_tags_registry_v1';
        this.viewsKey = 'hades_saved_views_v1';
        this.palette = {
            ia: '#00f2fe',
            '3d': '#ffaa00',
            dev: '#a855f7',
            tools: '#10b981',
            social: '#ec4899',
            design: '#f59e0b',
            media: '#3b82f6',
            work: '#06b6d4',
            default: '#64748b'
        };
        this.tagRegistry = this.loadRegistry();
        this.savedViews = this.loadSavedViews();
    }

    loadRegistry() {
        try {
            const raw = localStorage.getItem(this.tagsKey);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return { ...this.palette };
    }

    loadSavedViews() {
        try {
            const raw = localStorage.getItem(this.viewsKey);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [
            { id: 'view_ai_3d', name: 'IA & 3D Top', query: 'tag:ia tag:3d', icon: '✨' }
        ];
    }

    saveViews() {
        persistJson(this.viewsKey, this.savedViews);
        this.renderSavedViews();
    }

    getTagColor(tag) {
        const clean = (tag || '').toLowerCase().replace(/^#/, '');
        return this.tagRegistry[clean] || this.palette[clean] || this.palette.default;
    }

    parseQuery(rawQuery) {
        const tokens = (rawQuery || '').trim().split(/\s+/).filter(Boolean);
        const parsed = {
            text: [],
            tags: [],
            categories: [],
            isFav: false,
            freqTop: false
        };

        tokens.forEach(tok => {
            const lower = tok.toLowerCase();
            if (lower.startsWith('tag:')) {
                parsed.tags.push(lower.slice(4));
            } else if (lower.startsWith('#') && lower.length > 1) {
                parsed.tags.push(lower.slice(1));
            } else if (lower.startsWith('cat:') || lower.startsWith('categoria:')) {
                parsed.categories.push(lower.split(':')[1]);
            } else if (lower === 'is:fav' || lower === 'is:favorite') {
                parsed.isFav = true;
            } else if (lower === 'freq:top' || lower === 'freq:alta' || lower === 'freq:high') {
                parsed.freqTop = true;
            } else {
                parsed.text.push(lower);
            }
        });

        return parsed;
    }

    matches(shortcut, parsedQuery) {
        if (!shortcut || !parsedQuery) return true;

        // 1. Tag matching (AND logic for multiple tags)
        if (parsedQuery.tags.length > 0) {
            const itemTags = normalizeTags(shortcut.tags);
            const matchesAllTags = parsedQuery.tags.every(reqTag => itemTags.includes(reqTag));
            if (!matchesAllTags) return false;
        }

        // 2. Category matching (exact match on normalized ID, avoiding false substring hits)
        if (parsedQuery.categories.length > 0) {
            const rawCat = (shortcut.category || '').toLowerCase();
            const cleanCat = rawCat.replace(/^cat_/, '');
            const matchesCat = parsedQuery.categories.some(c => {
                const cleanC = (c || '').toLowerCase().replace(/^cat_/, '');
                return rawCat === c || cleanCat === cleanC;
            });
            if (!matchesCat) return false;
        }

        // 3. Favorite filter (strictly check favorite status)
        if (parsedQuery.isFav && !shortcut.favorite) {
            return false;
        }

        // 4. Frequency filter
        if (parsedQuery.freqTop) {
            const launches = (personalAnalytics && personalAnalytics.data && personalAnalytics.data.shortcutCounts && personalAnalytics.data.shortcutCounts[shortcut.id]) || shortcut.launchCount || 0;
            if (launches < 3) return false;
        }

        // 5. Free text tokens
        if (parsedQuery.text.length > 0) {
            const title = (shortcut.title || '').toLowerCase();
            const desc = (shortcut.description || shortcut.desc || '').toLowerCase();
            const url = (shortcut.url || '').toLowerCase();
            const tagStr = normalizeTags(shortcut.tags).join(' ');
            const matchesAllText = parsedQuery.text.every(t => title.includes(t) || desc.includes(t) || url.includes(t) || tagStr.includes(t));
            if (!matchesAllText) return false;
        }

        return true;
    }

    saveView(name, query, icon = '🔖') {
        if (!name || !query) return;
        soundFx.play('chime');
        const view = {
            id: 'view_' + Date.now(),
            name: name.trim(),
            query: query.trim(),
            icon: icon.trim()
        };
        this.savedViews.push(view);
        this.saveViews();
    }

    deleteView(id) {
        soundFx.play('click');
        this.savedViews = this.savedViews.filter(v => v.id !== id);
        this.saveViews();
    }

    renderSavedViews() {
        const container = document.getElementById('category-filter-bar') || document.getElementById('filter-pills');
        if (!container) return;

        // Remove old saved view pills
        container.querySelectorAll('.saved-view-pill').forEach(el => el.remove());

        this.savedViews.forEach(view => {
            const pill = document.createElement('button');
            pill.className = 'filter-pill saved-view-pill';
            pill.setAttribute('data-filter-view', view.id);
            pill.innerHTML = `<span class="view-icon">${escapeHtml(view.icon)}</span> <span>${escapeHtml(view.name)}</span> <span class="delete-view-x" title="Eliminar vista">×</span>`;
            
            pill.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-view-x')) {
                    e.stopPropagation();
                    this.deleteView(view.id);
                    return;
                }
                soundFx.play('click');
                const searchInp = document.getElementById('main-search') || document.getElementById('search-input') || document.querySelector('.search-input');
                if (searchInp) {
                    searchInp.value = view.query;
                    searchInp.dispatchEvent(new Event('input', { bubbles: true }));
                    searchInp.focus();
                }
            });

            container.appendChild(pill);
        });
    }

    init() {
        this.renderSavedViews();
        const saveViewBtn = document.getElementById('save-search-view-btn');
        const saveModal = document.getElementById('save-view-modal');
        const closeSaveModal = document.getElementById('close-save-view-modal');
        const confirmSaveBtn = document.getElementById('confirm-save-view-btn');
        const viewQueryInp = document.getElementById('saved-view-query-input');
        const viewNameInp = document.getElementById('saved-view-name-input');
        const viewIconInp = document.getElementById('saved-view-icon-input');

        if (saveViewBtn) {
            saveViewBtn.addEventListener('click', () => {
                const searchInp = document.getElementById('main-search') || document.getElementById('search-input') || document.querySelector('.search-input');
                const q = searchInp ? searchInp.value.trim() : '';
                if (!q) { showToast(getTranslation('toasts.save_view_empty') || 'Type a search or tags first to save a smart view.', 'error'); return; }
                if (viewQueryInp) viewQueryInp.value = q;
                if (saveModal) saveModal.classList.remove('hidden');
            });
        }

        if (closeSaveModal && saveModal) {
            closeSaveModal.addEventListener('click', () => saveModal.classList.add('hidden'));
        }

        if (confirmSaveBtn && saveModal) {
            confirmSaveBtn.addEventListener('click', () => {
                const q = viewQueryInp ? viewQueryInp.value.trim() : '';
                const name = viewNameInp ? viewNameInp.value.trim() : 'Vista';
                const icon = (viewIconInp ? viewIconInp.value.trim() : '') || '🔖';
                if (name && q) {
                    this.saveView(name, q, icon);
                    saveModal.classList.add('hidden');
                }
            });
        }
    }
}

export const tagsFilter = new TagsFilterEngine();
