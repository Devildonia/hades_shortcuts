// js/calendar-agenda.js - Bento Calendar & Agenda Engine (RFC 5545 iCal Parser & Proximity Alert)

import { state } from './state.js';
import { soundFx } from './audio.js';
import { i18nDictionaries } from './i18n.js';

export class CalendarAgendaEngine {
    constructor() {
        this.storageKey = 'hades_calendar_config_v1';
        this.cacheKey = 'hades_calendar_events_cache_v1';
        this.config = this.loadConfig();
        this.events = this.loadCachedEvents();
        this.widgetCard = document.getElementById('widget-calendar-card');
        this.eventsList = document.getElementById('calendar-events-list');
        this.modal = document.getElementById('calendar-modal');
        this.feedInput = document.getElementById('calendar-feed-url-input');
    }

    loadConfig() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return { feedUrl: '', lastSync: null };
    }

    saveConfig() {
        try { localStorage.setItem(this.storageKey, JSON.stringify(this.config)); } catch (e) {}
    }

    loadCachedEvents() {
        try {
            const raw = localStorage.getItem(this.cacheKey);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        // Default curated starter schedule
        const today = new Date();
        const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
        return [
            { id: 'ev_1', title: 'Daily Standup & Sync', start: new Date(y, m, d, 9, 30).toISOString(), end: new Date(y, m, d, 10, 0).toISOString(), link: 'https://meet.google.com/abc-defg-hij', category: 'work' },
            { id: 'ev_2', title: 'Deep Work & Code Review', start: new Date(y, m, d, 11, 0).toISOString(), end: new Date(y, m, d, 13, 0).toISOString(), category: 'focus' },
            { id: 'ev_3', title: 'Diseño 3D & AI Pipelines', start: new Date(y, m, d + 1, 16, 0).toISOString(), end: new Date(y, m, d + 1, 17, 30).toISOString(), link: 'https://zoom.us/j/123456789', category: 'creative' }
        ];
    }

    saveEvents(evList) {
        this.events = evList;
        try { localStorage.setItem(this.cacheKey, JSON.stringify(evList)); } catch (e) {}
        this.render();
    }

    parseICS(icsText) {
        const events = [];
        const lines = icsText.split(/\r?\n/);
        let inEvent = false, current = {};

        lines.forEach(line => {
            if (line.startsWith('BEGIN:VEVENT')) { inEvent = true; current = {}; }
            else if (line.startsWith('END:VEVENT')) {
                if (current.title && current.start) events.push(current);
                inEvent = false;
            } else if (inEvent) {
                if (line.startsWith('SUMMARY:')) current.title = line.slice(8).trim();
                if (line.startsWith('LOCATION:')) current.location = line.slice(9).trim();
                if (line.startsWith('DESCRIPTION:')) current.desc = line.slice(12).trim();
                if (line.startsWith('DTSTART')) {
                    const val = line.split(':')[1] || '';
                    current.start = this.parseICSDate(val);
                }
                if (line.startsWith('DTEND')) {
                    const val = line.split(':')[1] || '';
                    current.end = this.parseICSDate(val);
                }
            }
        });

        // Detect meeting links
        events.forEach(ev => {
            const raw = `${ev.location || ''} ${ev.desc || ''}`;
            const meetMatch = raw.match(/https:\/\/(meet\.google\.com|zoom\.us\/j|teams\.microsoft\.com)\/[^\s]+/i);
            if (meetMatch) ev.link = meetMatch[0];
        });

        return events;
    }

    parseICSDate(str) {
        if (!str) return new Date().toISOString();
        if (str.length >= 8) {
            const y = parseInt(str.slice(0, 4)), m = parseInt(str.slice(4, 6)) - 1, d = parseInt(str.slice(6, 8));
            const hr = str.includes('T') ? parseInt(str.slice(9, 11) || 0) : 9;
            const min = str.includes('T') ? parseInt(str.slice(11, 13) || 0) : 0;
            return new Date(Date.UTC(y, m, d, hr, min)).toISOString();
        }
        return new Date().toISOString();
    }

    async syncFeed() {
        if (!this.config.feedUrl) { this.openConfigModal(); return; }
        soundFx.play('click');
        try {
            const res = await fetch(this.config.feedUrl);
            if (!res.ok) throw new Error('Error al descargar calendario');
            const text = await res.text();
            const parsed = this.parseICS(text);
            if (parsed.length > 0) {
                this.config.lastSync = Date.now();
                this.saveConfig();
                this.saveEvents(parsed);
                soundFx.play('chime');
            }
        } catch (e) {
            alert('No se pudo sincronizar el feed iCal. Verifica la URL.');
        }
    }

    render() {
        if (!this.eventsList) return;
        this.eventsList.innerHTML = '';
        const now = new Date();
        let hasImminentMeeting = false;

        // Sort chronological
        const sorted = [...this.events].sort((a, b) => new Date(a.start) - new Date(b.start));

        sorted.slice(0, 5).forEach(ev => {
            const startD = new Date(ev.start);
            const diffMin = Math.round((startD - now) / 60000);
            const isImminent = diffMin >= 0 && diffMin <= 15;
            if (isImminent) hasImminentMeeting = true;

            const timeFmt = `${startD.getHours().toString().padStart(2, '0')}:${startD.getMinutes().toString().padStart(2, '0')}`;
            const dayLabel = startD.toLocaleDateString(state.language || 'es', { weekday: 'short' });

            const row = document.createElement('div');
            row.className = `calendar-event-item ${isImminent ? 'imminent' : ''}`;
            row.innerHTML = `
                <span class="event-time-badge">${dayLabel} ${timeFmt}</span>
                <div class="event-info">
                    <strong class="event-title">${ev.title}</strong>
                    ${isImminent ? `<span class="event-alert-tag">⏰ En ${diffMin}m</span>` : ''}
                </div>
                ${ev.link ? `<a href="${ev.link}" target="_blank" rel="noopener noreferrer" class="meet-link-btn" title="Entrar a reunión">🚀</a>` : ''}
            `;
            this.eventsList.appendChild(row);
        });

        if (this.widgetCard) {
            this.widgetCard.classList.toggle('meeting-pulse-alert', hasImminentMeeting);
        }
    }

    openConfigModal() {
        if (this.feedInput) this.feedInput.value = this.config.feedUrl || '';
        if (this.modal) this.modal.classList.remove('hidden');
    }

    closeConfigModal() {
        if (this.modal) this.modal.classList.add('hidden');
    }

    init() {
        this.render();
        const syncBtn = document.getElementById('calendar-sync-btn');
        const cfgBtn = document.getElementById('calendar-config-btn');
        const saveCfgBtn = document.getElementById('save-calendar-feed-btn');
        const closeCfgBtn = document.getElementById('close-calendar-modal');

        if (syncBtn) syncBtn.onclick = () => this.syncFeed();
        if (cfgBtn) cfgBtn.onclick = () => this.openConfigModal();
        if (closeCfgBtn) closeCfgBtn.onclick = () => this.closeConfigModal();
        if (saveCfgBtn) {
            saveCfgBtn.onclick = () => {
                soundFx.play('click');
                this.config.feedUrl = (this.feedInput ? this.feedInput.value.trim() : '');
                this.saveConfig();
                this.closeConfigModal();
                if (this.config.feedUrl) this.syncFeed();
            };
        }

        // Proximity polling every 60s
        setInterval(() => this.render(), 60000);
        state.on('language:changed', () => this.render());
    }
}

export const calendarAgenda = new CalendarAgendaEngine();
