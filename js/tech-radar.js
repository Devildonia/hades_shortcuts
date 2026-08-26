// js/tech-radar.js - Multi-Channel Tech Radar & Native RSS/Atom Feed Reader (DOMParser 0 KB)

import { soundFx } from './audio.js';
import { state, escapeHtml } from './state.js';

export class TechRadarEngine {
    constructor() {
        this.cacheKey = 'hades_tech_radar_rss_cache_v2';
        this.feedsKey = 'hades_custom_rss_feeds_v1';
        this.feeds = this.loadFeeds();
        this.activeFeedId = 'hackernews';
        this.radarList = document.getElementById('tech-radar-list');
        this.channelBar = document.getElementById('radar-channel-bar');
        this.refreshBtn = document.getElementById('radar-refresh-btn');
        this.configBtn = document.getElementById('radar-config-btn');
        this.modal = document.getElementById('rss-modal');
    }

    loadFeeds() {
        try {
            const raw = localStorage.getItem(this.feedsKey);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [
            { id: 'hackernews', name: 'HackerNews', icon: '🔥', url: 'https://news.ycombinator.com/rss' },
            { id: 'huggingface', name: 'Hugging Face', icon: '🤖', url: 'https://huggingface.co/blog/feed.xml' },
            { id: 'arstechnica', name: 'Ars Technica', icon: '💻', url: 'https://feeds.arstechnica.com/arstechnica/index' },
            { id: 'blendernation', name: 'Blender & 3D', icon: '🎨', url: 'https://www.blendernation.com/feed/' }
        ];
    }

    saveFeeds() {
        try { localStorage.setItem(this.feedsKey, JSON.stringify(this.feeds)); } catch (e) {}
        this.renderChannelBar();
    }

    parseXMLFeed(xmlText, fallbackSource = 'Web') {
        const items = [];
        try {
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, 'text/xml');
            
            // RSS 2.0 (<item>)
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

            // Atom 1.0 (<entry>)
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
        if (!force && cache[feed.id] && (now - cache[feed.id].timestamp < 30 * 60 * 1000)) {
            return cache[feed.id].items;
        }

        let items = [];
        try {
            if (feed.id === 'hackernews') {
                const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=7');
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
                    const res = await fetch(feed.url);
                    if (res.ok) text = await res.text();
                } catch (e) {
                    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feed.url)}`;
                    const resProxy = await fetch(proxyUrl);
                    if (resProxy.ok) text = await resProxy.text();
                }
                if (text) items = this.parseXMLFeed(text, feed.name);
            }

            if (items.length > 0) {
                cache[feed.id] = { timestamp: now, items: items.slice(0, 6) };
                localStorage.setItem(this.cacheKey, JSON.stringify(cache));
            }
        } catch (err) {}

        return items.slice(0, 6);
    }

    async loadAndRender(force = false) {
        if (!this.radarList) return;
        this.renderChannelBar();
        const currentFeed = this.feeds.find(f => f.id === this.activeFeedId) || this.feeds[0];
        
        this.radarList.innerHTML = '<div class="radar-loading"><span>📡 Sincronizando feed...</span></div>';
        const articles = await this.fetchFeedArticles(currentFeed, force);

        this.radarList.innerHTML = '';
        if (!articles || articles.length === 0) {
            this.radarList.innerHTML = '<div class="radar-empty"><span>No se pudieron cargar artículos. Pulsa 🔄 para reintentar.</span></div>';
            return;
        }

        articles.forEach(art => {
            const row = document.createElement('div');
            row.className = 'radar-item';
            row.innerHTML = `
                <a href="${art.url}" target="_blank" rel="noopener noreferrer" class="radar-link">
                    <span class="radar-bullet">›</span>
                    <span class="radar-title">${escapeHtml(art.title)}</span>
                </a>
                <span class="radar-source-tag">${escapeHtml(art.source || currentFeed.name)}</span>
                <button class="radar-pin-btn" title="Fijar como Post-it">📌</button>
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
        if (!this.channelBar) return;
        this.channelBar.innerHTML = '';

        this.feeds.forEach(f => {
            const btn = document.createElement('button');
            const isActive = f.id === this.activeFeedId;
            btn.className = `radar-channel-pill ${isActive ? 'active' : ''}`;
            btn.innerHTML = `<span class="radar-pill-icon">${f.icon}</span> <span class="radar-pill-name">${f.name}</span>`;
            btn.onclick = () => {
                soundFx.play('click');
                this.activeFeedId = f.id;
                this.loadAndRender();
            };
            this.channelBar.appendChild(btn);
        });
    }

    openModal() {
        if (this.modal) this.modal.classList.remove('hidden');
    }

    closeModal() {
        if (this.modal) this.modal.classList.add('hidden');
    }

    init() {
        this.loadAndRender();
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
                        icon: (iconInp ? iconInp.value.trim() : '') || '📰',
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
