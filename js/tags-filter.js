// js/tags-filter.js - Advanced Multi-Tag Query Engine (Linear-style CMDK)

import { normalizeTags } from './state.js';
import { personalAnalytics } from './personal-analytics.js';

export class TagsFilterEngine {
    constructor() {
        this.tagsKey = 'hades_tags_registry_v1';
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
    }

    loadRegistry() {
        try {
            const raw = localStorage.getItem(this.tagsKey);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return { ...this.palette };
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
}

export const tagsFilter = new TagsFilterEngine();
