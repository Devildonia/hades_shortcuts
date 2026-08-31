// js/tech-radar.js - Multi-Channel Tech Radar & Native RSS/Atom Feed Reader (DOMParser 0 KB)

import { soundFx } from './audio.js';
import { state, persistJson } from './state.js';
import { escapeHtml, fetchTextMaybeProxy, safeHttpUrl, sanitizeIconUrl, showToast } from './utils.js';
import { focusMode } from './focus-mode.js';
import { getTranslation } from './i18n.js';

// Quick RSS presets for the feed modal. Keys map to `data-rss-preset`
// attributes in index.html (inline scripts are banned by the extension CSP).
export const RSS_PRESETS = {
    'verge': { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    'github-blog': { name: 'GitHub Blog', url: 'https://github.blog/feed/' }
};

export class TechRadarEngine {
    constructor() {
        this.cacheKey = 'hades_tech_radar_rss_cache_v2';
        this.feedsKey = 'hades_custom_rss_feeds_v1';
        this.activeFeedKey = 'hades_radar_active_feed_v1';
        this.feeds = this.loadFeeds();
        this.activeFeedId = this.loadActiveFeedId();
        this.radarList = null;
        this.channelBar = null;
        this.refreshBtn = null;
        this.configBtn = null;
        this.modal = null;
        this._loadToken = 0;
    }

    defaultFeeds() {
        return [
            { id: 'hackernews', name: 'HackerNews', url: 'https://news.ycombinator.com/rss' },
            { id: 'huggingface', name: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml' },
            { id: 'arstechnica', name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
            { id: 'blendernation', name: 'Blender & 3D', url: 'https://www.blendernation.com/feed/' }
        ];
    }

    loadFeeds() {
        let feeds = null;
        try {
            const raw = localStorage.getItem(this.feedsKey);
            if (raw) feeds = JSON.parse(raw);
        } catch (e) {}
        if (!Array.isArray(feeds) || !feeds.length) feeds = this.defaultFeeds();
        // Icono por defecto vacío, pero NUNCA sobreescribir uno ya guardado.
        return feeds.map((f) => ({ icon: '', ...f }));
    }

    loadActiveFeedId() {
        let id = '';
        try {
            id = localStorage.getItem(this.activeFeedKey) || '';
        } catch (e) {}
        return this.feeds.some((f) => f.id === id) ? id : this.feeds[0].id;
    }

    persistActiveFeed() {
        try {
            localStorage.setItem(this.activeFeedKey, this.activeFeedId);
        } catch (e) {}
    }

    // Valida un feed nuevo antes de guardarlo. Devuelve null si es válido,
    // o un código de error ('invalid_url' | 'duplicate') para el toast.
    validateNewFeed(rawUrl) {
        const url = safeHttpUrl(rawUrl || '');
        if (!url) return 'invalid_url';
        if (this.feeds.some((f) => safeHttpUrl(f.url) === url)) return 'duplicate';
        return null;
    }

    // Elimina un feed. Si el radar queda vacío, restaura los feeds por defecto.
    removeFeed(feedId) {
        const wasActive = this.activeFeedId === feedId;
        this.feeds = this.feeds.filter((f) => f.id !== feedId);
        if (!this.feeds.length) this.feeds = this.defaultFeeds();
        if (!this.feeds.some((f) => f.id === this.activeFeedId)) {
            this.activeFeedId = this.feeds[0].id;
        }
        this.persistActiveFeed();
        this.saveFeeds(); // re-renderiza la barra de canales
        if (wasActive) this.loadAndRender();
    }

    saveFeeds() {
        persistJson(this.feedsKey, this.feeds);
        this.renderChannelBar();
    }

    getFallbackArticles(feed) {
        // Texto i18n (nada de hardcode) y el enlace apunta a la fuente fallida.
        const url = safeHttpUrl(feed && feed.url);
        const t = (key) => getTranslation(key) || '';
        return [
            { id: 'fb_1', title: t('tech_radar.fallback_offline') || 'Sin conexión con la fuente de noticias.', url, source: 'Offline', isFallback: true },
            { id: 'fb_2', title: t('tech_radar.fallback_cors') || 'Comprueba tu conexión o la configuración CORS del feed.', url, source: 'Offline', isFallback: true }
        ];
    }

    // RSS→JSON vía api.rss2json.com (sin API key, tier gratuito).
    // Devuelve artículos ya parseados: no depende de proxies CORS de texto.
    async fetchFeedViaRss2Json(feed, signal, budgetMs = 10000) {
        const api = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feed.url);
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), budgetMs);
        const onAbort = () => ctrl.abort();
        if (signal) signal.addEventListener('abort', onAbort, { once: true });
        try {
            const res = await fetch(api, { signal: ctrl.signal });
            if (!res.ok) throw new Error('rss2json_http_' + res.status);
            const data = await res.json();
            const rawItems = (data && Array.isArray(data.items)) ? data.items : [];
            return rawItems.slice(0, 6)
                .map((it, i) => ({
                    id: 'r2j_' + (it.guid || it.link || i) + '_' + i,
                    title: (it.title || '').trim(),
                    url: it.link || '',
                    time: it.pubDate || it.isoDate || '',
                    source: feed.name
                }))
                .filter(it => it.title && it.url);
        } finally {
            clearTimeout(timer);
            if (signal) signal.removeEventListener('abort', onAbort);
        }
    }

    parseXMLFeed(xmlText, fallbackSource = 'Web') {
        const items = [];
        try {
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, 'text/xml');
            
            const rssItems = xml.querySelectorAll('item');
            if (rssItems && rssItems.length > 0) {
                rssItems.forEach(el => {
                    const title = el.querySelector('title')?.textContent || '';
                    const link = el.querySelector('link')?.textContent || '';
                    const pubDate = el.querySelector('pubDate')?.textContent || '';
                    if (title && link) items.push({ title: title.trim(), url: link.trim(), time: pubDate, source: fallbackSource });
                });
                return items;
            }

            const atomEntries = xml.querySelectorAll('entry');
            if (atomEntries && atomEntries.length > 0) {
                atomEntries.forEach(el => {
                    const title = el.querySelector('title')?.textContent || '';
                    const link = el.querySelector('link')?.getAttribute('href') || el.querySelector('link')?.textContent || '';
                    const published = el.querySelector('published, updated')?.textContent || '';
                    if (title && link) items.push({ title: title.trim(), url: link.trim(), time: published, source: fallbackSource });
                });
            }
        } catch (e) {}
        return items;
    }

    async fetchFeedArticles(feed, force = false) {
        if (!feed) return [];
        const cacheRaw = localStorage.getItem(this.cacheKey) || '{}';
        let cache = {};
        try { cache = JSON.parse(cacheRaw); } catch (e) {}

        const now = Date.now();
        if (!force && cache[feed.id] && (now - cache[feed.id].timestamp < 30 * 60 * 1000) && cache[feed.id].items?.length > 0) {
            return cache[feed.id].items;
        }

        let items = [];
        const controller = new AbortController();
        // Budget total de la cadena completa: directo (4s) + 2 proxies (10s c/u)
        // + RSS→JSON (10s) + margen. Cada fase corta sola con su presupuesto.
        const timeoutId = setTimeout(() => controller.abort(), 40000);

        try {
            if (feed.id === 'hackernews') {
                const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=7', { signal: controller.signal });
                const data = await res.json();
                items = (data.hits || []).map(h => ({
                    id: h.objectID,
                    title: h.title,
                    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
                    time: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    source: 'HN'
                }));
            } else {
                // Estrategia A: XML/Atom vía fetch directo o cadena de proxies CORS
                let text = '';
                try {
                    text = await fetchTextMaybeProxy(feed.url, controller.signal, {
                        directMs: 4000,
                        proxyMs: 10000
                    });
                } catch (e) {
                    text = '';
                }
                if (text) items = this.parseXMLFeed(text, feed.name);

                // Estrategia B: RSS→JSON (infraestructura independiente; funciona
                // incluso si todos los proxies CORS están caídos)
                if (!items.length) {
                    try {
                        items = await this.fetchFeedViaRss2Json(feed, controller.signal);
                    } catch (e) {
                        items = [];
                    }
                }
            }
        } catch (err) {
            // Si la red falla, usar caché previa válida si existe
            if (cache[feed.id]?.items?.length > 0) {
                return cache[feed.id].items;
            }
            items = this.getFallbackArticles(feed);
        } finally {
            clearTimeout(timeoutId);
        }

        if (!items || items.length === 0) {
            if (cache[feed.id]?.items?.length > 0) {
                return cache[feed.id].items;
            }
            items = this.getFallbackArticles(feed);
        }

        // Solo guardar en caché si obtuvimos artículos reales
        if (items.length > 0 && !items[0].isFallback) {
            cache[feed.id] = { timestamp: now, items: items.slice(0, 6) };
            persistJson(this.cacheKey, cache);
        }

        return items.slice(0, 6);
    }

    async loadAndRender(force = false) {
        if (!force && focusMode && focusMode.isActive && focusMode.config && focusMode.config.pauseRadar) return;
        this.radarList = document.getElementById('tech-radar-list');
        this.channelBar = document.getElementById('radar-channel-bar');
        if (!this.radarList) return;

        this.renderChannelBar();
        const currentFeed = this.feeds.find(f => f.id === this.activeFeedId) || this.feeds[0];
        const targetFeedId = currentFeed.id;
        const reqToken = ++this._loadToken;

        // Estado de carga visible: sin esto, la lista del canal anterior
        // permanecía hasta ~40 s en feeds lentos y la UI parecía muerta.
        this.radarList.innerHTML = `<div class="radar-loading"><span>${escapeHtml(getTranslation('tech_radar.loading') || '')}</span></div>`;

        // Fetch feed articles with race-condition protection
        const articles = await this.fetchFeedArticles(currentFeed, force);

        // Discard result if user has switched channels or triggered a newer fetch
        if (reqToken !== this._loadToken || targetFeedId !== this.activeFeedId) {
            return;
        }

        this.radarList.innerHTML = '';
        if (!articles || articles.length === 0) {
            const emptyLabel = getTranslation('tech_radar.empty') || 'Could not load articles. Press refresh to retry.';
            this.radarList.innerHTML = `<div class="radar-empty"><span>${escapeHtml(emptyLabel)}</span></div>`;
            return;
        }

        articles.forEach(art => {
            const row = document.createElement('div');
            row.className = 'radar-item';
            const href = safeHttpUrl(art.url);
            const pinLabel = getTranslation('tech_radar.pin_tooltip') || 'Pin to Post-it';
            row.innerHTML = `
                <a href="${href ? escapeHtml(href) : '#'}" target="_blank" rel="noopener noreferrer" class="radar-link">
                    <span class="radar-bullet">›</span>
                    <span class="radar-title">${escapeHtml(art.title)}</span>
                </a>
                <span class="radar-source-tag">${escapeHtml(art.source || currentFeed.name)}</span>
                <button class="radar-pin-btn" title="${escapeHtml(pinLabel)}" aria-label="${escapeHtml(pinLabel)}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"></path><path d="M9 3h6l1 7H8L9 3z"></path><path d="M8 10h8v2a4 4 0 0 1-8 0v-2z"></path></svg>
                </button>
            `;
            const pinBtn = row.querySelector('.radar-pin-btn');
            if (pinBtn) {
                pinBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    soundFx.play('click');
                    window.dispatchEvent(new CustomEvent('postit:create', { detail: { text: `[${art.title}](${art.url})` } }));
                });
            }
            this.radarList.appendChild(row);
        });
    }

    renderChannelBar() {
        this.channelBar = document.getElementById('radar-channel-bar');
        if (!this.channelBar) return;
        this.channelBar.innerHTML = '';

        const delLabel = getTranslation('tech_radar.delete_feed') || 'Quitar feed del radar';

        this.feeds.forEach(f => {
            const item = document.createElement('span');
            item.className = 'radar-channel-item';

            const btn = document.createElement('button');
            const isActive = f.id === this.activeFeedId;
            btn.className = `radar-channel-pill ${isActive ? 'active' : ''}`;
            btn.setAttribute('aria-pressed', String(isActive));

            // Icono opcional del feed: badge corto (emoji/texto) o imagen
            // (URL http(s), data:image o iconos/*). Se sanitiza siempre.
            const icon = sanitizeIconUrl(f.icon || '');
            let iconHtml = '';
            if (icon) {
                if (/^(https?:\/\/|data:image\/|iconos\/)/i.test(icon)) {
                    iconHtml = `<span class="radar-pill-icon"><img src="${escapeHtml(icon)}" alt=""></span>`;
                } else {
                    iconHtml = `<span class="radar-pill-icon">${escapeHtml(icon)}</span>`;
                }
            }
            btn.innerHTML = `${iconHtml}<span class="radar-pill-name">${escapeHtml(f.name)}</span>`;
            const iconImg = btn.querySelector('.radar-pill-icon img');
            if (iconImg) {
                iconImg.addEventListener('error', () => iconImg.closest('.radar-pill-icon')?.remove(), { once: true });
            }

            btn.onclick = () => {
                soundFx.play('click');
                this.activeFeedId = f.id;
                this.persistActiveFeed();
                this.loadAndRender();
            };

            // Borrado: hermano del pill (<button> no puede anidar <button>).
            const del = document.createElement('button');
            del.className = 'radar-channel-del';
            del.title = delLabel;
            del.setAttribute('aria-label', delLabel);
            del.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>';
            del.onclick = (e) => {
                e.stopPropagation();
                soundFx.play('click');
                this.removeFeed(f.id);
            };

            item.appendChild(btn);
            item.appendChild(del);
            this.channelBar.appendChild(item);
        });
    }

    openModal() {
        this.modal = document.getElementById('rss-modal');
        if (this.modal) this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal = document.getElementById('rss-modal');
        if (this.modal) this.modal.classList.add('hidden');
    }

    init() {
        this.radarList = document.getElementById('tech-radar-list');
        this.channelBar = document.getElementById('radar-channel-bar');
        this.refreshBtn = document.getElementById('radar-refresh-btn');
        this.configBtn = document.getElementById('radar-config-btn');
        this.modal = document.getElementById('rss-modal');

        this.loadAndRender();
        state.on('language:changed', () => this.loadAndRender());
        state.on('focus:activated', () => {
            if (this.refreshBtn) this.refreshBtn.disabled = true;
        });
        state.on('focus:deactivated', () => {
            if (this.refreshBtn) this.refreshBtn.disabled = false;
        });
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => {
                soundFx.play('click');
                this.loadAndRender(true);
            });
        }
        if (this.configBtn) this.configBtn.onclick = () => this.openModal();
        const closeBtn = document.getElementById('close-rss-modal');
        const addBtn = document.getElementById('add-rss-feed-btn');
        if (closeBtn) closeBtn.onclick = () => this.closeModal();
        document.querySelectorAll('.rss-preset-chip[data-rss-preset]').forEach((chip) => {
            chip.addEventListener('click', () => {
                const preset = RSS_PRESETS[chip.dataset.rssPreset];
                if (!preset) return;
                const nameInp = document.getElementById('rss-feed-name-input');
                const urlInp = document.getElementById('rss-feed-url-input');
                const iconInp = document.getElementById('rss-feed-icon-input');
                if (nameInp) nameInp.value = preset.name;
                if (urlInp) urlInp.value = preset.url;
                if (iconInp) iconInp.value = '';
            });
        });
        if (addBtn) {
            addBtn.onclick = () => {
                const nameInp = document.getElementById('rss-feed-name-input');
                const urlInp = document.getElementById('rss-feed-url-input');
                const iconInp = document.getElementById('rss-feed-icon-input');
                if (!nameInp || !urlInp) return;

                const rawUrl = urlInp.value.trim();
                const err = this.validateNewFeed(rawUrl);
                if (err === 'invalid_url') {
                    soundFx.play('click');
                    showToast(getTranslation('rss_modal.invalid_url') || 'Introduce una URL http(s) válida.', 'error');
                    urlInp.focus();
                    return;
                }
                if (err === 'duplicate') {
                    soundFx.play('click');
                    showToast(getTranslation('rss_modal.duplicate_feed') || 'Ese feed ya está en el radar.', 'error');
                    urlInp.focus();
                    return;
                }

                soundFx.play('chime');
                const newFeed = {
                    id: 'rss_' + Date.now(),
                    name: nameInp.value.trim() || getTranslation('rss_modal.default_name') || 'Feed personalizado',
                    icon: sanitizeIconUrl(iconInp ? iconInp.value.trim() : ''),
                    url: safeHttpUrl(rawUrl)
                };
                this.feeds.push(newFeed);
                this.saveFeeds();
                this.activeFeedId = newFeed.id;
                this.persistActiveFeed();
                this.closeModal();
                // Limpiar los inputs: el siguiente feed no hereda el anterior.
                nameInp.value = '';
                urlInp.value = '';
                if (iconInp) iconInp.value = '';
                this.loadAndRender(true);
            };
        }
    }
}

export const techRadar = new TechRadarEngine();
