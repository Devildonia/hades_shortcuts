// js/calendar-agenda.js - Bento Calendar & Agenda Engine (RFC 5545 iCal Parser & Manual Event Creator)

import { state, escapeHtml, fetchTextMaybeProxy, safeHttpUrl, persistJson, showToast } from './state.js';
import { soundFx } from './audio.js';
import { getTranslation } from './i18n.js';

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
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {}
        return [];
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
                if (line.startsWith('DTSTART')) current.start = this.parseIcsDateProperty(line);
                if (line.startsWith('DTEND')) current.end = this.parseIcsDateProperty(line);
            }
        });

        events.forEach(ev => {
            const raw = `${ev.location || ''} ${ev.desc || ''}`;
            const meetMatch = raw.match(/https:\/\/(meet\.google\.com|zoom\.us\/j|teams\.microsoft\.com)\/[^\s]+/i);
            if (meetMatch) ev.link = meetMatch[0];
        });

        return events;
    }

    parseIcsDateProperty(line) {
        const colon = line.indexOf(':');
        if (colon < 0) return new Date().toISOString();
        const meta = line.slice(0, colon);
        const value = (line.slice(colon + 1) || '').trim();
        let tzid = null;
        const tzMatch = meta.match(/TZID=([^;]+)/i);
        if (tzMatch) tzid = tzMatch[1].replace(/^["']|["']$/g, '').trim();
        return this.parseICSDate(value, tzid);
    }

    zonedWallTimeToDate(year, monthIndex, day, hour, minute, second, timeZone) {
        const utcGuess = Date.UTC(year, monthIndex, day, hour, minute, second);
        const dtf = new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        });
        const asUtcParts = (ms) => {
            const bag = {};
            dtf.formatToParts(new Date(ms)).forEach((part) => {
                if (part.type !== 'literal') bag[part.type] = part.value;
            });
            return Date.UTC(
                parseInt(bag.year, 10),
                parseInt(bag.month, 10) - 1,
                parseInt(bag.day, 10),
                parseInt(bag.hour, 10) % 24,
                parseInt(bag.minute, 10),
                parseInt(bag.second, 10)
            );
        };
        let utc = utcGuess - (asUtcParts(utcGuess) - utcGuess);
        const drift = asUtcParts(utc) - utcGuess;
        if (drift) utc -= drift;
        return new Date(utc);
    }

    parseICSDate(str, tzid) {
        if (!str) return new Date().toISOString();
        const zulu = /Z$/i.test(str);
        const compact = str.replace(/Z$/i, '').replace(/[-:]/g, '');
        if (compact.length < 8) return new Date().toISOString();
        const y = parseInt(compact.slice(0, 4), 10);
        const m = parseInt(compact.slice(4, 6), 10) - 1;
        const d = parseInt(compact.slice(6, 8), 10);
        const hr = compact.includes('T') ? parseInt(compact.slice(9, 11) || '0', 10) : 0;
        const min = compact.includes('T') ? parseInt(compact.slice(11, 13) || '0', 10) : 0;
        const sec = compact.includes('T') ? parseInt(compact.slice(13, 15) || '0', 10) : 0;
        if (zulu) return new Date(Date.UTC(y, m, d, hr, min, sec)).toISOString();
        if (tzid) {
            try {
                return this.zonedWallTimeToDate(y, m, d, hr, min, sec, tzid).toISOString();
            } catch (e) {
                return new Date(y, m, d, hr, min, sec).toISOString();
            }
        }
        return new Date(y, m, d, hr, min, sec).toISOString();
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
            showToast(getTranslation('toasts.ical_error') || 'Could not sync the iCal feed.', 'error');
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
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const dateInput = document.getElementById('event-form-date');
        if (dateInput) dateInput.value = `${y}-${m}-${d}`;
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
            const imminentLabel = (getTranslation('calendar_modal.imminent') || 'In {n}m').replace('{n}', String(diffMin));
            const meetLabel = getTranslation('calendar_modal.meet_join') || 'Join meeting';
            const deleteLabel = getTranslation('calendar_modal.delete_event') || 'Delete event';
            row.innerHTML = `
                <span class="event-time-badge">${escapeHtml(dayLabel)} ${escapeHtml(timeFmt)}</span>
                <div class="event-info">
                    <strong class="event-title">${escapeHtml(ev.title)}</strong>
                    ${isImminent ? `<span class="event-alert-tag">${escapeHtml(imminentLabel)}</span>` : ''}
                </div>
                <div class="event-actions">
                    ${ev.link && safeHttpUrl(ev.link) ? `<a href="${escapeHtml(safeHttpUrl(ev.link))}" target="_blank" rel="noopener noreferrer" class="meet-link-btn" title="${escapeHtml(meetLabel)}" aria-label="${escapeHtml(meetLabel)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L11 5"></path><path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.12a5 5 0 0 0 7.07 7.07L13 19"></path></svg></a>` : ''}
                    <button class="event-del-btn" data-ev-id="${ev.id}" title="${escapeHtml(deleteLabel)}" aria-label="${escapeHtml(deleteLabel)}">✕</button>
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
        if (this._inited) return;
        this._inited = true;

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

        if (this._renderInterval) clearInterval(this._renderInterval);
        this._renderInterval = setInterval(() => this.render(), 60000);
        state.on('language:changed', () => this.render());
    }
}

export const calendarAgenda = new CalendarAgendaEngine();
