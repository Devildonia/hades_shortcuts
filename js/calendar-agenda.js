// js/calendar-agenda.js - Bento Calendar & Agenda Engine (RFC 5545 iCal Parser & Manual Event Creator)

import { state, persistJson } from './state.js';
import { escapeHtml, fetchTextMaybeProxy, safeHttpUrl, showToast } from './utils.js';
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

        // Calendario completo (modal centrado con zoom)
        this.fullModal = document.getElementById('agenda-full-modal');
        this.fullCard = document.getElementById('agenda-full-card');
        const now = new Date();
        this.viewDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1º del mes visible
        this.selectedDay = this.localKey(now); // YYYY-MM-DD local
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
        // Héroe del mes y modal completo (si está abierto) siempre al día, incluso con la lista vacía
        this.updateCalendarHero();
        if (this.fullModal && !this.fullModal.classList.contains('hidden')) this.renderFullCalendar();

        this.eventsList.innerHTML = '';
        const now = new Date();
        let hasImminentMeeting = false;

        const sorted = [...this.events].sort((a, b) => new Date(a.start) - new Date(b.start));

        if (sorted.length === 0) {
            const emptyMsg = getTranslation('widgets.calendar_empty') || 'Sin eventos próximos';
            const addLabel = getTranslation('calendar_modal.add_tooltip') || '+ Añadir Evento';
            this.eventsList.innerHTML = `
                <div class="calendar-empty">
                    <p class="calendar-empty-text">${escapeHtml(emptyMsg)}</p>
                    <button class="calendar-empty-btn" id="calendar-empty-add-btn">${escapeHtml(addLabel)}</button>
                </div>
            `;
            const emptyAddBtn = this.eventsList.querySelector('#calendar-empty-add-btn');
            if (emptyAddBtn) {
                emptyAddBtn.onclick = () => this.openEventModal();
            }
            if (this.widgetCard) this.widgetCard.classList.remove('meeting-pulse-alert');
            return;
        }

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
                    <button class="event-del-btn" data-ev-id="${escapeHtml(ev.id)}" title="${escapeHtml(deleteLabel)}" aria-label="${escapeHtml(deleteLabel)}">✕</button>
                </div>
            `;
            row.querySelector('.event-del-btn')?.addEventListener('click', () => this.deleteEvent(ev.id));
            this.eventsList.appendChild(row);
        });

        if (this.widgetCard) this.widgetCard.classList.toggle('meeting-pulse-alert', hasImminentMeeting);
    }

    // ===================== Calendario completo (modal papel) =====================

    localKey(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    eventsForDay(key) {
        return (this.events || [])
            .filter(ev => {
                const d = new Date(ev.start);
                if (isNaN(d.getTime())) return false;
                return this.localKey(d) === key;
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start));
    }

    updateCalendarHero() {
        const nameEl = document.getElementById('calendar-month-name');
        const yearEl = document.getElementById('calendar-month-year');
        if (nameEl || yearEl) {
            const now = new Date();
            const lang = state.language || 'es';
            try {
                if (nameEl) nameEl.textContent = now.toLocaleDateString(lang, { month: 'long' });
            } catch (e) { if (nameEl) nameEl.textContent = now.toLocaleDateString('es', { month: 'long' }); }
            if (yearEl) yearEl.textContent = String(now.getFullYear());
        }
    }

    openFullCalendar() {
        if (!this.fullModal) return;
        const now = new Date();
        this.viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
        this.selectedDay = this.localKey(now);
        this.renderFullCalendar();
        this.fullModal.classList.remove('hidden');
        // Hereda el papel del widget para que ambas vistas comparten el mismo cuaderno
        const card = document.getElementById('widget-calendar-card');
        if (card && this.fullCard) {
            ['white', 'pink', 'green', 'blue', 'orange', 'purple'].forEach(p => this.fullCard.classList.remove('paper-' + p));
            const m = Array.from(card.classList).find(c => c && c.startsWith('paper-'));
            if (m) this.fullCard.classList.add(m);
        }
        soundFx.play('click');
    }

    closeFullCalendar() {
        if (this.fullModal) this.fullModal.classList.add('hidden');
    }

    prevMonth() {
        this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
        this.renderFullCalendar();
    }

    nextMonth() {
        this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
        this.renderFullCalendar();
    }

    goToday() {
        const now = new Date();
        this.viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
        this.selectedDay = this.localKey(now);
        this.renderFullCalendar();
    }

    selectDay(key) {
        this.selectedDay = key;
        this.renderFullCalendar();
    }

    openEventModalForDate(key) {
        if (!this.eventModal) return;
        const titleInput = document.getElementById('event-form-title');
        const linkInput = document.getElementById('event-form-link');
        const dateInput = document.getElementById('event-form-date');
        if (titleInput) titleInput.value = '';
        if (linkInput) linkInput.value = '';
        if (dateInput && key) dateInput.value = key;
        this.eventModal.classList.remove('hidden');
    }

    renderFullCalendar() {
        if (!this.fullModal || !this.fullModal.querySelector('#agenda-full-grid')) return;
        const lang = state.language || 'es';
        const t = (k, fb) => getTranslation(k) || fb;

        // Título del mes visible
        const monthTitle = document.getElementById('agenda-month-title');
        if (monthTitle) {
            try { monthTitle.textContent = this.viewDate.toLocaleDateString(lang, { month: 'long', year: 'numeric' }); }
            catch (e) { monthTitle.textContent = this.viewDate.toLocaleDateString('es', { month: 'long', year: 'numeric' }); }
        }

        // Cabecera de días (lunes → domingo), colores por día como en un cuaderno
        const weekhead = document.getElementById('agenda-weekhead');
        if (weekhead && !weekhead.childElementCount) {
            const refMonday = new Date(2024, 0, 1); // 1 de enero de 2024 fue lunes
            let html = '';
            for (let i = 0; i < 7; i++) {
                const d = new Date(refMonday.getFullYear(), refMonday.getMonth(), refMonday.getDate() + i);
                let label;
                try { label = d.toLocaleDateString(lang, { weekday: 'short' }); }
                catch (e) { label = d.toLocaleDateString('es', { weekday: 'short' }); }
                html += `<span class="agenda-weekday wd-${i}">${escapeHtml(label.charAt(0).toUpperCase() + label.slice(1))}</span>`;
            }
            weekhead.innerHTML = html;
        }

        // Rejilla de 42 celdas (6 semanas, altura estable)
        const first = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1);
        const offset = (first.getDay() + 6) % 7; // lunes = 0
        const todayKey = this.localKey(new Date());
        const grid = document.getElementById('agenda-full-grid');
        let html = '';
        for (let i = 0; i < 42; i++) {
            const d = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1 - offset + i);
            const key = this.localKey(d);
            const inMonth = d.getMonth() === this.viewDate.getMonth();
            const evs = this.eventsForDay(key);
            const dots = evs.slice(0, 3).map(ev => `<i class="ag-dot ${escapeHtml(ev.category || 'work')}"></i>`).join('');
            html += `<div class="ag-cell${inMonth ? '' : ' ag-out'}${key === todayKey ? ' ag-today' : ''}${key === this.selectedDay ? ' ag-selected' : ''}" role="gridcell" tabindex="0" data-date="${key}" aria-selected="${key === this.selectedDay}">
                <span class="ag-num">${d.getDate()}</span>
                ${evs.length ? `<span class="ag-dots">${dots}${evs.length > 3 ? `<i class="ag-more">+${evs.length - 3}</i>` : ''}</span>` : ''}
            </div>`;
        }
        grid.innerHTML = html;

        // Panel del día seleccionado
        const dayTitle = document.getElementById('agenda-day-title');
        const dayEvents = document.getElementById('agenda-day-events');
        if (dayTitle && dayEvents) {
            const selDate = new Date(this.selectedDay + 'T12:00:00');
            try { dayTitle.textContent = selDate.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' }); }
            catch (e) { dayTitle.textContent = selDate.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }); }

            const dayEvs = this.eventsForDay(this.selectedDay);
            if (dayEvs.length === 0) {
                dayEvents.innerHTML = `<p class="agenda-no-events">${escapeHtml(t('calendar_full.no_events', 'Sin eventos este día'))}</p>`;
            } else {
                dayEvents.innerHTML = dayEvs.map(ev => {
                    const sd = new Date(ev.start);
                    const time = `${String(sd.getHours()).padStart(2, '0')}:${String(sd.getMinutes()).padStart(2, '0')}`;
                    const safe = safeHttpUrl(ev.link);
                    return `<div class="agenda-ev-row">
                        <span class="agenda-ev-time">${escapeHtml(time)}</span>
                        <strong class="agenda-ev-title">${escapeHtml(ev.title)}</strong>
                        <span class="agenda-ev-cat ag-cat-${escapeHtml(ev.category || 'work')}" aria-hidden="true"></span>
                        ${safe ? `<a class="agenda-ev-link" href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(t('calendar_modal.meet_join', 'Join meeting'))}">↗</a>` : ''}
                        <button class="agenda-ev-del" data-ev-id="${escapeHtml(ev.id)}" title="${escapeHtml(t('calendar_modal.delete_event', 'Delete event'))}" aria-label="${escapeHtml(t('calendar_modal.delete_event', 'Delete event'))}">✕</button>
                    </div>`;
                }).join('');
            }

            // Próximos eventos (desde ahora, máx. 5)
            const upcoming = document.getElementById('agenda-upcoming-list');
            if (upcoming) {
                const now = new Date();
                const future = (this.events || [])
                    .filter(ev => new Date(ev.start) >= now)
                    .sort((a, b) => new Date(a.start) - new Date(b.start))
                    .slice(0, 5);
                if (future.length === 0) {
                    upcoming.innerHTML = `<p class="agenda-no-events">${escapeHtml(t('widgets.calendar_empty', 'Sin eventos próximos'))}</p>`;
                } else {
                    upcoming.innerHTML = future.map(ev => {
                        const sd = new Date(ev.start);
                        const time = `${String(sd.getHours()).padStart(2, '0')}:${String(sd.getMinutes()).padStart(2, '0')}`;
                        const safe = safeHttpUrl(ev.link);
                        return `<div class="agenda-up-row">
                            <span class="agenda-up-time">${escapeHtml(time)}</span>
                            <strong class="agenda-up-title">${escapeHtml(ev.title)}</strong>
                            ${safe ? `<a class="agenda-ev-link" href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">↗</a>` : ''}
                        </div>`;
                    }).join('');
                }
            }
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

        // ---- Calendario completo (modal papel centrado) ----
        const heroBtn = document.getElementById('calendar-open-btn');
        if (heroBtn) heroBtn.onclick = (e) => { e.stopPropagation(); soundFx.play('click'); this.openFullCalendar(); };

        // Clic sobre el widget (fuera de botones/swatches/eventos) también lo abre
        if (this.widgetCard) {
            this.widgetCard.addEventListener('click', (e) => {
                if (state.editMode) return;
                if (e.target.closest('button, a, input, select, textarea, .calendar-event-item, .scratchpad-swatch')) return;
                soundFx.play('click');
                this.openFullCalendar();
            });
        }

        if (this.fullModal) {
            const prevBtn = document.getElementById('agenda-prev-btn');
            const nextBtn = document.getElementById('agenda-next-btn');
            const todayBtn = document.getElementById('agenda-today-btn');
            const closeBtn = document.getElementById('agenda-close-btn');
            const addBtnFull = document.getElementById('agenda-add-btn');
            const syncBtnFull = document.getElementById('agenda-sync-btn');
            const dayAddBtn = document.getElementById('agenda-day-add-btn');
            const grid = this.fullModal.querySelector('#agenda-full-grid');
            const dayEvents = this.fullModal.querySelector('#agenda-day-events');

            if (prevBtn) prevBtn.onclick = () => { soundFx.play('hover'); this.prevMonth(); };
            if (nextBtn) nextBtn.onclick = () => { soundFx.play('hover'); this.nextMonth(); };
            if (todayBtn) todayBtn.onclick = () => { soundFx.play('click'); this.goToday(); };
            if (closeBtn) closeBtn.onclick = () => { soundFx.play('click'); this.closeFullCalendar(); };
            if (addBtnFull) addBtnFull.onclick = () => this.openEventModalForDate(this.selectedDay);
            if (syncBtnFull) syncBtnFull.onclick = () => this.syncFeed();
            if (dayAddBtn) dayAddBtn.onclick = () => this.openEventModalForDate(this.selectedDay);

            // Clic de fondo (backdrop) cierra el modal
            this.fullModal.addEventListener('click', (e) => {
                if (e.target === this.fullModal) this.closeFullCalendar();
            });

            if (grid) {
                grid.addEventListener('click', (e) => {
                    const cell = e.target.closest('.ag-cell');
                    if (!cell) return;
                    soundFx.play('hover');
                    this.selectDay(cell.dataset.date);
                });
                grid.addEventListener('keydown', (e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    const cell = e.target.closest('.ag-cell');
                    if (!cell) return;
                    e.preventDefault();
                    this.selectDay(cell.dataset.date);
                });
            }

            if (dayEvents) {
                dayEvents.addEventListener('click', (e) => {
                    const del = e.target.closest('.agenda-ev-del');
                    if (del) this.deleteEvent(del.dataset.evId);
                });
            }
        }

        this.updateCalendarHero();
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
