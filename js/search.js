// js/search.js - Multi-Engine Omnibox, Category Filters, Bangs & DevTools
import { state, escapeHtml, bindIconFallback, openSafeUrl } from './state.js';
import { tagsFilter } from './tags-filter.js';
import { neuralSearch } from './neural-search.js';
import { macroEngine } from './macros.js';
import { i18nDictionaries, getTranslation } from './i18n.js';
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
        this.searchBox = document.querySelector('.search-box-wrapper');
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
        this.syncClearButton();
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
            this.filterShortcuts();
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
        if (this.searchClear) {
            const clearLabel = (t.search && t.search.clear) || 'Limpiar búsqueda';
            this.searchClear.setAttribute('aria-label', clearLabel);
            this.searchClear.setAttribute('title', clearLabel);
        }
    }

    syncClearButton() {
        const hasValue = !!(this.searchInput && this.searchInput.value);
        if (this.searchClear) this.searchClear.classList.toggle('hidden', !hasValue);
        if (this.searchBox) this.searchBox.classList.toggle('is-filled', hasValue);
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

        let commandMode = false;
        const macro = macroEngine.getMacro(query);
        if (macro) {
            if (this.calcBanner) {
                const copy = macroEngine.displayCopy(query, macro);
                const detected = getTranslation('bangs.macro_detected') || 'Macro detected:';
                const runLabel = getTranslation('bangs.run_routine') || 'Run routine';
                this.calcBanner.innerHTML = `<div class="devtool-result-row"><span>⚡ <strong>${escapeHtml(detected)}</strong> ${escapeHtml(macro.icon || '')} ${escapeHtml(copy.name)}</span> <button class="devtool-action-btn" id="run-macro-trigger">🚀 ${escapeHtml(runLabel)}</button></div>`;
                this.calcBanner.classList.remove('hidden');
                const trigger = document.getElementById('run-macro-trigger');
                if (trigger) trigger.onclick = () => macroEngine.executeMacro(query);
            }
            commandMode = true;
        }

        const handledByDevTools = !commandMode && devTools.renderBanner(rawQuery, this.calcBanner);
        if (handledByDevTools) {
            if (this.calcBanner) this.calcBanner.classList.remove('hidden');
            commandMode = true;
        }

        const isAIHandled = !commandMode && neuralSearch.handleAICommands(query, this.calcBanner);
        if (isAIHandled) commandMode = true;

        if (!commandMode) {
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
        }

        const semanticHits = (!commandMode && query.length >= 3) ? (neuralSearch.semanticSearch(rawQuery) || []) : [];
        const semanticIds = new Set(semanticHits.filter((h) => h.score >= 35).map((h) => h.id));

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
                const matchesQuery = !commandMode && (!query || tagsFilter.matches(shortcut, parsedFilter) || title.includes(query) || tags.includes(query) || desc.includes(query) || text.includes(query) || semanticIds.has(sid));

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

        const noRes = document.getElementById('no-results-msg');
        if (noRes) noRes.classList.toggle('hidden', commandMode || !query || totalVisible > 0);
    }

    executeSearch(query) {
        const trimmed = query.trim();
        if (!trimmed) return;

        if (macroEngine.getMacro(trimmed)) {
            macroEngine.executeMacro(trimmed);
            return;
        }

        const bangInfo = parseBangQuery(trimmed);
        if (bangInfo.isBang) {
            if (bangInfo.isDevTool) {
                if (bangInfo.bang === '!qr' && bangInfo.query) {
                    devTools.openQRModal(bangInfo.query);
                    return;
                }
                devTools.renderBanner(trimmed, this.calcBanner);
                if (this.calcBanner) this.calcBanner.classList.remove('hidden');
                soundFx.play('click');
                return;
            }
            if (bangInfo.targetUrl) {
                soundFx.play('click');
                this.openExternal(bangInfo.targetUrl);
                return;
            }
        }

        const engine = SEARCH_ENGINES[this.currentEngineKey] || SEARCH_ENGINES.google;
        const searchUrl = `${engine.url}${encodeURIComponent(trimmed)}`;
        soundFx.play('click');
        this.openExternal(searchUrl);
    }

    openExternal(url) {
        if (focusMode && typeof focusMode.openUrl === 'function') focusMode.openUrl(url);
        else openSafeUrl(url, '_blank');
    }

    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                this.syncClearButton();
                this.filterShortcuts();
            });

            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const focused = document.querySelector('.enlace-icono.bento-kbd-focus:not(.hidden-by-filter)');
                    if (focused && focused.href) {
                        this.openExternal(focused.href);
                        return;
                    }
                    this.executeSearch(this.searchInput.value);
                }
                if (e.key === 'Escape') {
                    this.searchInput.value = '';
                    this.syncClearButton();
                    this.filterShortcuts();
                }
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.moveCardFocus(e.key);
                }
            });
        }

        if (this.searchClear) {
            this.searchClear.addEventListener('click', () => {
                soundFx.play('click');
                this.searchInput.value = '';
                this.syncClearButton();
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

        document.addEventListener('keydown', (e) => {
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
            const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
            if (tag === 'input' || tag === 'textarea' || (document.activeElement && document.activeElement.isContentEditable)) return;
            e.preventDefault();
            this.moveCardFocus(e.key);
        });
    }

    visibleCards() {
        return [...document.querySelectorAll('.enlace-icono')].filter((c) =>
            !c.classList.contains('hidden-by-filter') && !c.classList.contains('no-match') && c.offsetParent
        );
    }

    moveCardFocus(key) {
        const cards = this.visibleCards();
        if (!cards.length) return;
        let idx = cards.findIndex((c) => c.classList.contains('bento-kbd-focus'));
        if (idx < 0) idx = (key === 'ArrowLeft' || key === 'ArrowUp') ? cards.length - 1 : 0;
        else if (key === 'ArrowRight' || key === 'ArrowDown') idx = (idx + 1) % cards.length;
        else idx = (idx - 1 + cards.length) % cards.length;
        cards.forEach((c) => c.classList.remove('bento-kbd-focus'));
        cards[idx].classList.add('bento-kbd-focus');
        cards[idx].setAttribute('tabindex', '0');
        cards[idx].focus();
        cards[idx].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
}
