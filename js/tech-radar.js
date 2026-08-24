// js/tech-radar.js - Live Tech Radar & Micro-Feeds Bento Widget

import { state, escapeHtml } from './state.js';
import { soundFx } from './audio.js';
import { i18nDictionaries } from './i18n.js';

export class TechRadarEngine {
    constructor() {
        this.containerEl = document.getElementById('techradar-list');
        this.refreshBtn = document.getElementById('techradar-refresh-btn');
        this.feedType = 'hn';
        this.cacheKey = 'techradar_cache_v1';
        this.items = [];
    }

    init() {
        this.loadCachedOrFetch();
        this.bindEvents();
    }

    async loadCachedOrFetch(force = false) {
        const cached = localStorage.getItem(this.cacheKey);
        if (!force && cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < 15 * 60 * 1000 && parsed.items && parsed.items.length > 0) {
                    this.items = parsed.items;
                    this.renderList();
                    return;
                }
            } catch (e) {}
        }
        await this.fetchHackerNews();
    }

    async fetchHackerNews() {
        if (this.containerEl) {
            this.containerEl.innerHTML = `<div class="techradar-loading"><span>📡</span> ${(i18nDictionaries[state.language] || i18nDictionaries.es).tech_radar.loading}</div>`;
        }

        try {
            const topRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
            const topIds = await topRes.json();
            const sliceIds = (topIds || []).slice(0, 5);

            const fetchedItems = await Promise.all(
                sliceIds.map(async (id) => {
                    const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                    return itemRes.json();
                })
            );

            this.items = fetchedItems.filter(Boolean).map(item => ({
                id: item.id,
                title: item.title || 'Tech News',
                url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
                score: item.score || 1,
                by: item.by || 'anon'
            }));

            localStorage.setItem(this.cacheKey, JSON.stringify({ items: this.items, timestamp: Date.now() }));
            this.renderList();
        } catch (e) {
            this.renderFallback();
        }
    }

    renderFallback() {
        this.items = [
            { id: 1, title: 'DeepSeek-R1 open weights release & architecture breakdown', url: 'https://news.ycombinator.com', score: 320, by: 'ai' },
            { id: 2, title: 'WebGPU 1.0 specifications officially shipped across all major browsers', url: 'https://w3.org/TR/webgpu', score: 245, by: 'w3c' },
            { id: 3, title: 'Show HN: HaDeS Shortcuts v6.0 - Zero-Backend Local Agentic Dashboard', url: 'https://github.com/Devildonia/hades_shortcuts', score: 189, by: 'hades' }
        ];
        this.renderList();
    }

    renderList() {
        if (!this.containerEl) return;
        this.containerEl.innerHTML = '';
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).tech_radar || {};

        this.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'techradar-row';
            row.innerHTML = `
                <a href="${item.url}" target="_blank" rel="noopener" class="techradar-title-link" title="${escapeHtml(item.title)}">
                    <span class="techradar-score">▲ ${item.score}</span>
                    <span class="techradar-title-text">${escapeHtml(item.title)}</span>
                </a>
                <button class="techradar-pin-btn" title="${t.pin_tooltip || 'Guardar en Post-it'}" data-title="${escapeHtml(item.title)}" data-url="${item.url}">📌</button>
            `;

            const pinBtn = row.querySelector('.techradar-pin-btn');
            if (pinBtn) {
                pinBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    soundFx.play('click');
                    const noteText = `${item.title}
🔗 ${item.url}`;
                    window.dispatchEvent(new CustomEvent('postit:create', {
                        detail: { text: noteText, x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 80 }
                    }));
                });
            }

            this.containerEl.appendChild(row);
        });
    }

    bindEvents() {
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => {
                soundFx.play('click');
                this.fetchHackerNews();
            });
        }

        state.on('language:changed', () => this.renderList());
    }
}

export const techRadar = new TechRadarEngine();
