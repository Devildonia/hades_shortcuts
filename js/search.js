// js/search.js - Multi-Engine Search, Bangs, Safe Calculator & Arrow Navigation

import { state } from './state.js';
import { i18nDictionaries } from './i18n.js';
import { parseBangQuery, evaluateArithmetic, BANGS_MAP } from './bangs.js';
import { soundFx } from './audio.js';

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
        this.engineIcon = document.querySelector('#engine-icon-current img') || document.getElementById('engine-icon-current');
        this.engineName = document.getElementById('engine-name-current');
        this.engineOptions = document.querySelectorAll('.engine-opt');
        this.searchInput = document.getElementById('main-search');
        this.clearSearchBtn = document.getElementById('clear-search');
        this.pillButtons = document.querySelectorAll('.pill-btn');
        this.noResultsMsg = document.getElementById('no-results-msg') || document.getElementById('no-results');
        this.calcBanner = document.getElementById('search-calc-banner');
        this.currentEngineKey = state.searchEngine;
        this.focusedCardIndex = -1;
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
        if (this.engineIcon) {
            if (this.engineIcon.tagName === 'IMG') {
                this.engineIcon.src = engine.icon;
                this.engineIcon.alt = engine.name;
            } else {
                this.engineIcon.innerHTML = `<img src="${engine.icon}" class="engine-icon-img" alt="${engine.name}">`;
            }
        }
        if (this.engineName) this.engineName.textContent = engine.name;
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

        // Check arithmetic evaluation
        const calcResult = evaluateArithmetic(query);
        if (this.calcBanner) {
            if (calcResult !== null) {
                const t = (i18nDictionaries[state.language] || i18nDictionaries.es).bangs || {};
                this.calcBanner.innerHTML = `<span>🔢 <strong>${t.calc_title || 'Resultado'}:</strong></span> <span class="calc-val">${calcResult}</span>`;
                this.calcBanner.classList.remove('hidden');
            } else {
                this.calcBanner.classList.add('hidden');
            }
        }

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
        this.focusedCardIndex = -1;
    }

    bindEvents() {
        if (this.engineBtn) {
            this.engineBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                soundFx.play('click');
                this.engineMenu.classList.toggle('active');
            });
        }

        this.engineOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                soundFx.play('click');
                this.setEngine(opt.getAttribute('data-engine'));
                this.engineMenu.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (this.engineMenu && this.engineMenu.classList.contains('active') && !this.engineMenu.contains(e.target) && !this.engineBtn.contains(e.target)) {
                this.engineMenu.classList.remove('active');
            }
        });

        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterShortcuts());
            this.searchInput.addEventListener('keydown', (e) => this.handleSearchKeydown(e));
        }

        if (this.clearSearchBtn) {
            this.clearSearchBtn.addEventListener('click', () => {
                soundFx.play('click');
                if (this.searchInput) {
                    this.searchInput.value = '';
                    this.filterShortcuts();
                    this.searchInput.focus();
                }
            });
        }

        this.pillButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                soundFx.play('click');
                this.pillButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.activeFilter = btn.getAttribute('data-filter') || 'all';
                localStorage.setItem('active_pill_filter', state.activeFilter);
                this.filterShortcuts();
            });
        });
    }

    handleSearchKeydown(e) {
        const visibleCards = Array.from(document.querySelectorAll('.enlace-icono:not(.hidden-by-filter):not(.no-match)'));

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            if (visibleCards.length > 0) {
                e.preventDefault();
                this.focusedCardIndex = (this.focusedCardIndex + 1) % visibleCards.length;
                visibleCards[this.focusedCardIndex].focus();
                soundFx.play('hover');
            }
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            if (visibleCards.length > 0) {
                e.preventDefault();
                this.focusedCardIndex = (this.focusedCardIndex - 1 + visibleCards.length) % visibleCards.length;
                visibleCards[this.focusedCardIndex].focus();
                soundFx.play('hover');
            }
        } else if (e.key === 'Enter') {
            const raw = this.searchInput.value.trim();
            if (!raw) return;

            // 1. Check Bang Command
            const bangParsed = parseBangQuery(raw);
            if (bangParsed.isBang) {
                soundFx.play('click');
                window.open(bangParsed.targetUrl, '_blank');
                return;
            }

            // 2. If card is focused or visible
            const firstVisible = visibleCards[0];
            if (firstVisible && !raw.includes(' ') && raw.length <= 15) {
                soundFx.play('click');
                window.open(firstVisible.getAttribute('href'), '_blank');
            } else {
                // Search active engine
                soundFx.play('click');
                const engine = SEARCH_ENGINES[this.currentEngineKey];
                window.open(`${engine.url}${encodeURIComponent(raw)}`, '_blank');
            }
        } else if (e.key === 'Escape') {
            this.searchInput.value = '';
            this.filterShortcuts();
            this.searchInput.blur();
        }
    }
}
