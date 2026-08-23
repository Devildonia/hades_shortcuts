// js/search.js - Multi-Engine Search & Card Filtering

import { state } from './state.js';
import { i18nDictionaries } from './i18n.js';

export const SEARCH_ENGINES = {
    google: { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'iconos/google.webp' },
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: 'iconos/duckduckgo.webp' },
    perplexity: { name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=', icon: 'iconos/perplexity.webp' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'iconos/bing.webp' },
    youtube: { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=', icon: 'iconos/youtube.webp' },
    github: { name: 'GitHub', url: 'https://github.com/search?q=', icon: 'iconos/github.webp' }
};

export class SearchEngineManager {
    constructor() {
        this.engineBtn = document.getElementById('engine-btn');
        this.engineMenu = document.getElementById('engine-menu');
        this.engineIcon = document.getElementById('current-engine-icon');
        this.engineOptions = document.querySelectorAll('.engine-opt');
        this.searchInput = document.getElementById('main-search');
        this.clearSearchBtn = document.getElementById('clear-search');
        this.pillButtons = document.querySelectorAll('.pill-btn');
        this.noResultsMsg = document.getElementById('no-results');
        this.currentEngineKey = state.searchEngine;
    }

    init() {
        this.setEngine(this.currentEngineKey);
        this.bindEvents();
        this.updatePillCounts();
        state.on('language:changed', () => this.updatePlaceholders());
        state.on('shortcuts:changed', () => {
            this.filterShortcuts();
            this.updatePillCounts();
        });
    }

    setEngine(key) {
        if (!SEARCH_ENGINES[key]) key = 'google';
        this.currentEngineKey = key;
        state.searchEngine = key;
        localStorage.setItem('app_search_engine', key);

        const engine = SEARCH_ENGINES[key];
        if (this.engineIcon) this.engineIcon.src = engine.icon;
        this.updatePlaceholders();

        this.engineOptions.forEach(opt => {
            opt.classList.toggle('active', opt.getAttribute('data-engine') === key);
        });
    }

    updatePlaceholders() {
        const engine = SEARCH_ENGINES[this.currentEngineKey];
        const t = i18nDictionaries[state.language] || i18nDictionaries.es;
        if (this.searchInput) {
            this.searchInput.placeholder = t.search.placeholder.replace('{engine}', engine.name);
        }
    }

    updatePillCounts() {
        const countAll = state.shortcuts.length;
        const pillAllCount = document.querySelector('[data-filter="all"] .pill-count');
        if (pillAllCount) pillAllCount.textContent = countAll;
    }

    filterShortcuts() {
        const query = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
        const allCards = document.querySelectorAll('.enlace-icono');
        const categories = document.querySelectorAll('.categoria');
        let totalVisible = 0;

        categories.forEach(cat => {
            const group = cat.getAttribute('data-group');
            const matchesPill = (state.activeFilter === 'all' || state.activeFilter === group);
            const cardsInCat = cat.querySelectorAll('.enlace-icono');
            let visibleInCat = 0;

            cardsInCat.forEach(card => {
                const title = (card.getAttribute('data-title') || '').toLowerCase();
                const tags = (card.getAttribute('data-tags') || '').toLowerCase();
                const desc = (card.getAttribute('data-desc') || '').toLowerCase();
                const text = (card.innerText || card.textContent || '').toLowerCase();

                const matchesQuery = !query || title.includes(query) || tags.includes(query) || desc.includes(query) || text.includes(query);

                if (matchesPill && matchesQuery) {
                    card.classList.remove('hidden-by-filter', 'no-match');
                    visibleInCat++;
                    totalVisible++;
                } else {
                    card.classList.add('hidden-by-filter', 'no-match');
                }
            });

            if (visibleInCat > 0) {
                cat.classList.remove('hidden-by-pill', 'hidden-by-search');
            } else {
                if (!matchesPill) cat.classList.add('hidden-by-pill');
                else cat.classList.add('hidden-by-search');
            }
        });

        if (this.noResultsMsg) {
            this.noResultsMsg.classList.toggle('hidden', totalVisible > 0);
        }
        if (this.clearSearchBtn) {
            this.clearSearchBtn.classList.toggle('hidden', query.length === 0);
        }
    }

    bindEvents() {
        if (this.engineBtn) {
            this.engineBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.engineMenu.classList.toggle('active');
            });
        }

        this.engineOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                this.setEngine(opt.getAttribute('data-engine'));
                this.engineMenu.classList.remove('active');
            });
        });

        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterShortcuts());
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const q = this.searchInput.value.trim();
                    if (!q) return;
                    const firstVisible = document.querySelector('.enlace-icono:not(.hidden-by-filter):not(.no-match)');
                    if (firstVisible) {
                        window.open(firstVisible.getAttribute('href'), '_blank');
                    } else {
                        const engine = SEARCH_ENGINES[this.currentEngineKey];
                        window.open(`${engine.url}${encodeURIComponent(q)}`, '_blank');
                    }
                } else if (e.key === 'Escape') {
                    this.searchInput.value = '';
                    this.filterShortcuts();
                    this.searchInput.blur();
                }
            });
        }

        if (this.clearSearchBtn) {
            this.clearSearchBtn.addEventListener('click', () => {
                if (this.searchInput) {
                    this.searchInput.value = '';
                    this.filterShortcuts();
                    this.searchInput.focus();
                }
            });
        }

        this.pillButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.pillButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.activeFilter = btn.getAttribute('data-filter') || 'all';
                localStorage.setItem('active_pill_filter', state.activeFilter);
                this.filterShortcuts();
            });
        });
    }
}
