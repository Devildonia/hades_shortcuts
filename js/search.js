// js/search.js - Multi-Engine Omnibox, Category Filters, Bangs & DevTools
import { state, escapeHtml, bindIconFallback } from './state.js';
import { tagsFilter } from './tags-filter.js';
import { neuralSearch } from './neural-search.js';
import { macroEngine } from './macros.js';
import { i18nDictionaries } from './i18n.js';
import { parseBangQuery, evaluateArithmetic } from './bangs.js';
import { devTools } from './devtools.js';
import { soundFx } from './audio.js';
import { focusMode } from './focus-mode.js';

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
        this.searchInput = document.getElementById('main-search') || document.getElementById('search-input') || document.querySelector('.search-input');
        this.searchClear = document.getElementById('clear-search') || document.getElementById('search-clear-btn') || document.getElementById('search-clear');
        this.engineBtn = document.getElementById('engine-btn');
        this.engineMenu = document.getElementById('engine-menu');
        this.engineIcon = document.getElementById('engine-icon-current');
        this.engineName = document.getElementById('engine-name-current');
        this.engineOptions = document.querySelectorAll('.engine-opt');
        this.filterPills = document.querySelectorAll('.pill-btn, .filter-pill');
        this.calcBanner = document.getElementById('search-calc-banner');
        this.currentEngineKey = state.searchEngine || 'google';
    }

    init() {
        this.setEngine(this.currentEngineKey);
        this.syncActiveFilterPill();
        this.bindEvents();
        this.updatePillCounts();
        this.filterShortcuts();

        state.on('shortcuts:changed', () => {
            this.updatePillCounts();
            this.filterShortcuts();
        });
        state.on('categories:changed', () => {
            this.updatePillCounts();
            this.filterShortcuts();
        });
        state.on('language:changed', () => {
            this.updatePlaceholders();
            this.updatePillCounts();
        });
        state.on('filter:changed', () => this.filterShortcuts());
    }

    syncActiveFilterPill() {
        if (!this.filterPills) return;
        this.filterPills.forEach(pill => {
            pill.classList.toggle('active', pill.getAttribute('data-filter') === state.activeFilter);
        });
    }

    setEngine(key) {
        if (!SEARCH_ENGINES[key]) key = 'google';
        this.currentEngineKey = key;
        state.searchEngine = key;
        state.setItem('app_search_engine', key);

        const engine = SEARCH_ENGINES[key];
        if (this.engineIcon) {
            const img = this.engineIcon.querySelector('img');
            if (img) {
                img.src = engine.icon;
                img.alt = engine.name;
                bindIconFallback(img, engine.url);
            } else {
                this.engineIcon.innerHTML = `<img src="${escapeHtml(engine.icon)}" class="engine-icon-img" alt="${escapeHtml(engine.name)}">`;
                bindIconFallback(this.engineIcon.querySelector('img'), engine.url);
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
        const rawQuery = this.searchInput ? this.searchInput.value.trim() : '';
        const query = rawQuery.toLowerCase();
        const categories = document.querySelectorAll('.categoria');
        let totalVisible = 0;

        const macro = macroEngine.getMacro(query);
        if (macro) {
            if (this.calcBanner) {
                this.calcBanner.innerHTML = `<div class="devtool-result-row"><span>⚡ <strong>Macro detectada:</strong> ${escapeHtml(macro.icon || '')} ${escapeHtml(macro.name)}</span> <button class="devtool-action-btn" id="run-macro-trigger">🚀 Ejecutar Rutina</button></div>`;
                this.calcBanner.classList.remove('hidden');
                const trigger = document.getElementById('run-macro-trigger');
                if (trigger) trigger.onclick = () => macroEngine.executeMacro(query);
            }
            return;
        }

        // 1. Check DevTools Omnibox Banner (case-sensitive)
        const handledByDevTools = devTools.renderBanner(rawQuery, this.calcBanner);
        if (handledByDevTools) {
            if (this.calcBanner) this.calcBanner.classList.remove('hidden');
            return;
        }

        // 2. Check Arithmetic Calculator
        // Check AI & Translation Commands
        const isAIHandled = neuralSearch.handleAICommands(query, this.calcBanner);
        if (isAIHandled) {
            return;
        }

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
                const sid = card.getAttribute('data-id');
                const shortcut = (state.shortcuts || []).find(item => item.id === sid) || {
                    id: sid,
                    title: card.getAttribute('data-title') || '',
                    tags: card.getAttribute('data-tags') || '',
                    desc: card.getAttribute('data-desc') || '',
                    category: cat.getAttribute('data-cat-id'),
                    url: card.getAttribute('href') || ''
                };
                const title = (card.getAttribute('data-title') || '').toLowerCase();
                const tags = (card.getAttribute('data-tags') || '').toLowerCase();
                const desc = (card.getAttribute('data-desc') || '').toLowerCase();
                const text = (card.innerText || card.textContent || '').toLowerCase();

                const parsedFilter = tagsFilter.parseQuery(query);
                const matchesQuery = !query || tagsFilter.matches(shortcut, parsedFilter) || title.includes(query) || tags.includes(query) || desc.includes(query) || text.includes(query);

                if (matchesPill && matchesQuery) {
                    card.classList.remove('hidden-by-filter', 'no-match');
                    visibleInCat++;
                    totalVisible++;
                } else {
                    card.classList.add('hidden-by-filter', 'no-match');
                }
            });

            if (matchesPill && visibleInCat > 0) {
                cat.classList.remove('hidden-by-pill', 'hidden-by-search');
            } else {
                if (!matchesPill) {
                    cat.classList.add('hidden-by-pill');
                    cat.classList.remove('hidden-by-search');
                } else {
                    cat.classList.add('hidden-by-search');
                    cat.classList.remove('hidden-by-pill');
                }
            }
        });
    }

    executeSearch(query) {
        const trimmed = query.trim();
        if (!trimmed) return;

        if (macroEngine.getMacro(trimmed)) {
            macroEngine.executeMacro(trimmed);
            return;
        }

        const bangInfo = parseBangQuery(trimmed);
        if (bangInfo.isBang && bangInfo.targetUrl) {
            soundFx.play('click');
            this.openExternal(bangInfo.targetUrl);
            return;
        }

        const engine = SEARCH_ENGINES[this.currentEngineKey] || SEARCH_ENGINES.google;
        const searchUrl = `${engine.url}${encodeURIComponent(trimmed)}`;
        soundFx.play('click');
        this.openExternal(searchUrl);
    }

    openExternal(url) {
        if (focusMode && typeof focusMode.openUrl === 'function') focusMode.openUrl(url);
        else window.open(url, '_blank', 'noopener,noreferrer');
    }

    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                if (this.searchClear) {
                    this.searchClear.classList.toggle('hidden', !this.searchInput.value);
                }
                this.filterShortcuts();
            });

            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.executeSearch(this.searchInput.value);
                }
                if (e.key === 'Escape') {
                    this.searchInput.value = '';
                    if (this.searchClear) this.searchClear.classList.add('hidden');
                    this.filterShortcuts();
                }
            });
        }

        if (this.searchClear) {
            this.searchClear.addEventListener('click', () => {
                soundFx.play('click');
                this.searchInput.value = '';
                this.searchClear.classList.add('hidden');
                this.filterShortcuts();
                this.searchInput.focus();
            });
        }

        if (this.engineBtn && this.engineMenu) {
            this.engineBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                soundFx.play('click');
                const isOpen = this.engineMenu.classList.contains('active');
                this.engineMenu.classList.toggle('active', !isOpen);
                this.engineBtn.setAttribute('aria-expanded', String(!isOpen));
            });

            document.addEventListener('click', () => {
                this.engineMenu.classList.remove('active');
                this.engineBtn.setAttribute('aria-expanded', 'false');
            });
        }

        this.engineOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                soundFx.play('click');
                const key = opt.getAttribute('data-engine');
                this.setEngine(key);
                this.engineMenu.classList.remove('active');
                this.engineBtn.setAttribute('aria-expanded', 'false');
            });
        });

        this.filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                soundFx.play('click');
                const filter = pill.getAttribute('data-filter');
                this.filterPills.forEach(p => p.classList.toggle('active', p === pill));
                state.activeFilter = filter;
                state.setItem('active_pill_filter', filter);
                this.filterShortcuts();
            });
        });
    }
}
