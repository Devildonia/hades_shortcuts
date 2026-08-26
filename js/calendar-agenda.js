// js/calendar-agenda.js - Bento Calendar & Agenda Engine (RFC 5545 iCal Parser & Manual Event Creator)

import { state, escapeHtml, fetchTextMaybeProxy, safeHttpUrl, persistJson } from './state.js';
import { soundFx } from './audio.js';

export class CalendarAgendaEngine {
    constructor() {
        this.storageKey = 'hades_calendar_config_v1';
        this.cacheKey = 'hades_calendar_events_cache_v1';
        this.config = this.loadConfig();
        this.events = this.loadCachedEvents();
        this.widgetCard = document.getElementById('widget-calendar-card');
        this.eventsList = document.getElementById('calendar-events-list');
        this.modal = document.getElementById('calendar-modal');
        this.eventModal = document.getElementById('calendar-event-modal');
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
        persistJson(this.storageKey, this.config);
    }

    loadCachedEvents() {
        try {
            const raw = localStorage.getItem(this.cacheKey);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        const today = new Date();
        const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
        return [
            { id: 'ev_1', title: 'Daily Standup & Sync', start: new Date(y, m, d, 9, 30).toISOString(), end: new Date(y, m, d, 10, 0).toISOString(), link: 'https://meet.google.com/abc-defg-hij', category: 'work', source: 'demo' },
            { id: 'ev_2', title: 'Deep Work & Code Review', start: new Date(y, m, d, 11, 0).toISOString(), end: new Date(y, m, d, 13, 0).toISOString(), category: 'focus', source: 'demo' },
            { id: 'ev_3', title: 'Diseño 3D & AI Pipelines', start: new Date(y, m, d + 1, 16, 0).toISOString(), end: new Date(y, m, d + 1, 17, 30).toISOString(), link: 'https://zoom.us/j/123456789', category: 'creative', source: 'demo' }
        ];
    }

    saveEvents(evList) {
        this.events = evList;
        persistJson(this.cacheKey, evList);
        this.render();
    }

    parseICS(icsText) {
        const events = [];
        const unfolded = String(icsText || '').replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
        const lines = unfolded.split('\n');
        let inEvent = false, current = {};

        lines.forEach(line => {
            if (line.startsWith('BEGIN:VEVENT')) { inEvent = true; current = {}; }
            else if (line.startsWith('END:VEVENT')) {
                if (current.title && current.start) events.push(current);
                inEvent = false;
            }             else if (inEvent) {
                if (line.startsWith('SUMMARY:')) current.title = line.slice(8).trim();
                if (line.startsWith('LOCATION:')) current.location = line.slice(9).trim();
                if (line.startsWith('DESCRIPTION:')) current.desc = line.slice(12).trim();
                if (line.startsWith('DTSTART')) current.start = this.parseICSDate((line.split(':').pop() || '').trim());
                if (line.startsWith('DTEND')) current.end = this.parseICSDate((line.split(':').pop() || '').trim());
            }
        });

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
            const text = await fetchTextMaybeProxy(this.config.feedUrl);
            const parsed = this.parseICS(text).map((ev, i) => ({ ...ev, id: ev.id || ('ics_' + i + '_' + (ev.start || '')), source: 'ics' }));
            if (parsed.length > 0) {
                this.config.lastSync = Date.now();
                this.saveConfig();
                const manuals = (this.events || []).filter((e) => e.source === 'manual');
                this.saveEvents([...manuals, ...parsed]);
                soundFx.play('chime');
            }
        } catch (e) {
            alert('No se pudo sincronizar el feed iCal. Verifica la URL o CORS.');
        }
    }

    deleteEvent(id) {
        soundFx.play('click');
        const updated = this.events.filter(e => e.id !== id);
        this.saveEvents(updated);
    }

    openEventModal() {
        if (!this.eventModal) return;
        const now = new Date();
        const dateInput = document.getElementById('event-form-date');
        if (dateInput) dateInput.value = now.toISOString().split('T')[0];
        const titleInput = document.getElementById('event-form-title');
        if (titleInput) titleInput.value = '';
        const linkInput = document.getElementById('event-form-link');
        if (linkInput) linkInput.value = '';
        this.eventModal.classList.remove('hidden');
    }

    closeEventModal() {
        if (this.eventModal) this.eventModal.classList.add('hidden');
    }

    saveManualEventFromForm() {
        const title = (document.getElementById('event-form-title').value || '').trim();
        const dateVal = document.getElementById('event-form-date').value;
        const timeVal = document.getElementById('event-form-time').value || '09:00';
        const link = (document.getElementById('event-form-link').value || '').trim();
        const category = document.getElementById('event-form-category').value || 'work';

        if (!title || !dateVal) return;

        const [y, m, d] = dateVal.split('-').map(Number);
        const [hr, min] = timeVal.split(':').map(Number);
        const start = new Date(y, m - 1, d, hr, min).toISOString();
        const end = new Date(y, m - 1, d, hr + 1, min).toISOString();

        const newEv = { id: 'ev_' + Date.now(), title, start, end, link: safeHttpUrl(link), category, source: 'manual' };
        const updated = [...this.events, newEv];
        this.saveEvents(updated);
        soundFx.play('chime');
        this.closeEventModal();
    }

    render() {
        if (!this.eventsList) return;
        this.eventsList.innerHTML = '';
        const now = new Date();
        let hasImminentMeeting = false;

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
                <span class="event-time-badge">${escapeHtml(dayLabel)} ${escapeHtml(timeFmt)}</span>
                <div class="event-info">
                    <strong class="event-title">${escapeHtml(ev.title)}</strong>
                    ${isImminent ? `<span class="event-alert-tag">⏰ En ${diffMin}m</span>` : ''}
                </div>
                <div style="display: flex; gap: 4px; align-items: center;">
                    ${ev.link && safeHttpUrl(ev.link) ? `<a href="${escapeHtml(safeHttpUrl(ev.link))}" target="_blank" rel="noopener noreferrer" class="meet-link-btn" title="Entrar a reunión">🚀</a>` : ''}
                    <button class="event-del-btn" data-ev-id="${ev.id}" title="Eliminar evento" style="background:none; border:none; color:rgba(255,255,255,0.4); cursor:pointer; font-size:0.75rem; padding:2px 4px;">✕</button>
                </div>
            `;
            row.querySelector('.event-del-btn')?.addEventListener('click', () => this.deleteEvent(ev.id));
            this.eventsList.appendChild(row);
        });

        if (this.widgetCard) this.widgetCard.classList.toggle('meeting-pulse-alert', hasImminentMeeting);
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
        const addBtn = document.getElementById('calendar-add-event-btn');
        const syncBtn = document.getElementById('calendar-sync-btn');
        const cfgBtn = document.getElementById('calendar-config-btn');
        const saveCfgBtn = document.getElementById('save-calendar-feed-btn');
        const closeCfgBtn = document.getElementById('close-calendar-modal');
        const saveEvBtn = document.getElementById('save-manual-event-btn');
        const closeEvBtn = document.getElementById('close-event-modal');
        const cancelEvBtn = document.getElementById('cancel-event-modal');

        if (addBtn) addBtn.onclick = () => this.openEventModal();
        if (syncBtn) syncBtn.onclick = () => this.syncFeed();
        if (cfgBtn) cfgBtn.onclick = () => this.openConfigModal();
        if (closeCfgBtn) closeCfgBtn.onclick = () => this.closeConfigModal();
        if (closeEvBtn) closeEvBtn.onclick = () => this.closeEventModal();
        if (cancelEvBtn) cancelEvBtn.onclick = () => this.closeEventModal();
        if (saveEvBtn) saveEvBtn.onclick = () => this.saveManualEventFromForm();
        if (saveCfgBtn) {
            saveCfgBtn.onclick = () => {
                soundFx.play('click');
                this.config.feedUrl = (this.feedInput ? this.feedInput.value.trim() : '');
                this.saveConfig();
                this.closeConfigModal();
                if (this.config.feedUrl) this.syncFeed();
            };
        }

        setInterval(() => this.render(), 60000);
        state.on('language:changed', () => this.render());
    }
}

export const calendarAgenda = new CalendarAgendaEngine();
