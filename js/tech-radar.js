// js/tech-radar.js - Multi-Channel Tech Radar & Native RSS/Atom Feed Reader (DOMParser 0 KB)

import { soundFx } from './audio.js';
import { state, escapeHtml, fetchTextMaybeProxy, safeHttpUrl, persistJson } from './state.js';
import { focusMode } from './focus-mode.js';

export class TechRadarEngine {
    constructor() {
        this.cacheKey = 'hades_tech_radar_rss_cache_v2';
        this.feedsKey = 'hades_custom_rss_feeds_v1';
        this.feeds = this.loadFeeds();
        this.activeFeedId = 'hackernews';
        this.radarList = null;
        this.channelBar = null;
        this.refreshBtn = null;
        this.configBtn = null;
        this.modal = null;
    }

    loadFeeds() {
        let feeds = null;
        try {
            const raw = localStorage.getItem(this.feedsKey);
            if (raw) feeds = JSON.parse(raw);
        } catch (e) {}
        if (!Array.isArray(feeds) || !feeds.length) {
            feeds = [
                { id: 'hackernews', name: 'HackerNews', url: 'https://news.ycombinator.com/rss' },
                { id: 'huggingface', name: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml' },
                { id: 'arstechnica', name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
                { id: 'blendernation', name: 'Blender & 3D', url: 'https://www.blendernation.com/feed/' }
            ];
        }
        return feeds.map((f) => ({ ...f, icon: '' }));
    }

    saveFeeds() {
        persistJson(this.feedsKey, this.feeds);
        this.renderChannelBar();
    }

    getFallbackArticles(feedId) {
        if (feedId === 'hackernews') {
            return [
                { id: 'hn_1', title: 'DeepSeek-R1 open-source reasoning model architecture', url: 'https://news.ycombinator.com', source: 'HN' },
                { id: 'hn_2', title: 'WebGPU 1.0 specification finalized across all major browsers', url: 'https://news.ycombinator.com', source: 'HN' },
                { id: 'hn_3', title: 'SQLite in the browser with WebAssembly & OPFS', url: 'https://news.ycombinator.com', source: 'HN' },
                { id: 'hn_4', title: 'Claude 3.5 Sonnet computer use capabilities and safety', url: 'https://news.ycombinator.com', source: 'HN' }
            ];
        }
        return [
            { id: 'fb_1', title: 'Últimas novedades en Inteligencia Artificial y Modelos 3D', url: 'https://huggingface.co', source: 'Radar' },
            { id: 'fb_2', title: 'Avances en síntesis procedural y rendimiento web', url: 'https://arstechnica.com', source: 'Radar' }
        ];
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
        if (!feed) return this.getFallbackArticles('hackernews');
        const cacheRaw = localStorage.getItem(this.cacheKey) || '{}';
        let cache = {};
        try { cache = JSON.parse(cacheRaw); } catch (e) {}

        const now = Date.now();
        if (!force && cache[feed.id] && (now - cache[feed.id].timestamp < 30 * 60 * 1000) && cache[feed.id].items?.length > 0) {
            return cache[feed.id].items;
        }

        let items = [];
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

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
                let text = '';
                try {
                    text = await fetchTextMaybeProxy(feed.url, controller.signal);
                } catch (e) {
                    text = '';
                }
                if (text) items = this.parseXMLFeed(text, feed.name);
            }
        } catch (err) {
            // Network timeout / error -> use fallback
            items = this.getFallbackArticles(feed.id);
        } finally {
            clearTimeout(timeoutId);
        }

        if (!items || items.length === 0) {
            items = this.getFallbackArticles(feed.id);
        }

        cache[feed.id] = { timestamp: now, items: items.slice(0, 6) };
        persistJson(this.cacheKey, cache);

        return items.slice(0, 6);
    }

    async loadAndRender(force = false) {
        if (!force && focusMode && focusMode.isActive && focusMode.config && focusMode.config.pauseRadar) return;
        this.radarList = document.getElementById('tech-radar-list');
        this.channelBar = document.getElementById('radar-channel-bar');
        if (!this.radarList) return;

        this.renderChannelBar();
        const currentFeed = this.feeds.find(f => f.id === this.activeFeedId) || this.feeds[0];
        
        // Show cached or fallback immediately to prevent blank loader
        const articles = await this.fetchFeedArticles(currentFeed, force);

        this.radarList.innerHTML = '';
        if (!articles || articles.length === 0) {
            this.radarList.innerHTML = '<div class="radar-empty"><span>No se pudieron cargar artículos. Pulsa actualizar para reintentar.</span></div>';
            return;
        }

        articles.forEach(art => {
            const row = document.createElement('div');
            row.className = 'radar-item';
            const href = safeHttpUrl(art.url);
            row.innerHTML = `
                <a href="${href ? escapeHtml(href) : '#'}" target="_blank" rel="noopener noreferrer" class="radar-link">
                    <span class="radar-bullet">›</span>
                    <span class="radar-title">${escapeHtml(art.title)}</span>
                </a>
                <span class="radar-source-tag">${escapeHtml(art.source || currentFeed.name)}</span>
                <button class="radar-pin-btn" title="Fijar como Post-it" aria-label="Fijar como Post-it">
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

        this.feeds.forEach(f => {
            const btn = document.createElement('button');
            const isActive = f.id === this.activeFeedId;
            btn.className = `radar-channel-pill ${isActive ? 'active' : ''}`;
            btn.innerHTML = `<span class="radar-pill-name">${escapeHtml(f.name)}</span>`;
            btn.onclick = () => {
                soundFx.play('click');
                this.activeFeedId = f.id;
                this.loadAndRender();
            };
            this.channelBar.appendChild(btn);
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
        if (addBtn) {
            addBtn.onclick = () => {
                const nameInp = document.getElementById('rss-feed-name-input');
                const urlInp = document.getElementById('rss-feed-url-input');
                const iconInp = document.getElementById('rss-feed-icon-input');
                if (nameInp && urlInp && urlInp.value.trim()) {
                    soundFx.play('chime');
                    const newFeed = {
                        id: 'rss_' + Date.now(),
                        name: nameInp.value.trim() || 'Custom Feed',
                        icon: (iconInp ? iconInp.value.trim() : '') || '',
                        url: urlInp.value.trim()
                    };
                    this.feeds.push(newFeed);
                    this.saveFeeds();
                    this.activeFeedId = newFeed.id;
                    this.closeModal();
                    this.loadAndRender(true);
                }
            };
        }
    }
}

export const techRadar = new TechRadarEngine();
