// tests/calendar-agenda.test.js — Tests de parser iCal RFC 5545 y eventos locales para CalendarAgendaEngine
import { test } from './harness.js';
import { CalendarAgendaEngine } from '../js/calendar-agenda.js';
import { WidgetsManager } from '../js/widgets.js';
import { state } from '../js/state.js';

// ---------- Fixture: widget agenda + modales (la batería no carga index.html) ----------
function ensureCalendarFixture() {
    if (document.getElementById('widget-calendar-card')) return;
    const host = document.createElement('div');
    host.innerHTML = `
        <div class="mini-widget-card widget-calendar" id="widget-calendar-card" data-tile-id="tile-calendar">
            <button class="calendar-tool-btn" id="calendar-add-event-btn" type="button"></button>
            <button class="calendar-tool-btn" id="calendar-sync-btn" type="button"></button>
            <button class="calendar-tool-btn" id="calendar-config-btn" type="button"></button>
            <div class="calendar-paper-colors" role="radiogroup">
                <button class="scratchpad-swatch calendar-swatch swatch-white" type="button" data-paper="white" aria-pressed="false"></button>
                <button class="scratchpad-swatch calendar-swatch swatch-pink" type="button" data-paper="pink" aria-pressed="false"></button>
            </div>
            <button class="calendar-month-hero" id="calendar-open-btn" type="button">
                <span class="calendar-month-hero-main">
                    <span class="calendar-month-name" id="calendar-month-name"></span>
                    <span class="calendar-month-year" id="calendar-month-year"></span>
                </span>
            </button>
            <div class="calendar-events-list" id="calendar-events-list"></div>
        </div>
        <div class="calendar-modal-backdrop hidden" id="calendar-modal"><input id="calendar-feed-url-input" type="url"></div>
        <div class="calendar-modal-backdrop hidden" id="calendar-event-modal">
            <input id="event-form-title" type="text">
            <input id="event-form-date" type="date">
            <input id="event-form-time" type="time" value="09:30">
            <input id="event-form-link" type="url">
            <select id="event-form-category"><option value="work">Trabajo</option><option value="focus">Enfoque</option></select>
        </div>
        <button id="save-manual-event-btn" type="button"></button>
        <button id="cancel-event-modal" type="button"></button>
        <button id="close-event-modal" type="button"></button>
        <button id="close-calendar-modal" type="button"></button>
        <button id="save-calendar-feed-btn" type="button"></button>
        <div class="agenda-full-backdrop hidden" id="agenda-full-modal" role="dialog">
            <div class="agenda-full-card" id="agenda-full-card">
                <button class="agenda-nav-btn" id="agenda-prev-btn" type="button">‹</button>
                <button class="agenda-nav-btn" id="agenda-today-btn" type="button">Hoy</button>
                <button class="agenda-nav-btn" id="agenda-next-btn" type="button">›</button>
                <h2 class="agenda-month-title" id="agenda-month-title">—</h2>
                <button class="agenda-nav-btn" id="agenda-add-btn" type="button">＋</button>
                <button class="agenda-nav-btn" id="agenda-sync-btn" type="button">⟳</button>
                <button class="agenda-nav-btn" id="agenda-close-btn" type="button">✕</button>
                <div class="agenda-weekhead" id="agenda-weekhead"></div>
                <div class="agenda-grid" id="agenda-full-grid" role="grid"></div>
                <div class="agenda-day-panel">
                    <div class="agenda-day-panel-head"><h3 id="agenda-day-title">—</h3><button class="agenda-day-add-btn" id="agenda-day-add-btn" type="button"></button></div>
                    <div class="agenda-day-events" id="agenda-day-events"></div>
                </div>
                <div class="agenda-upcoming"><h4>Próximos eventos</h4><div class="agenda-upcoming-list" id="agenda-upcoming-list"></div></div>
            </div>
        </div>
    `;
    document.body.appendChild(host); // buscamos por id, la estructura del contenedor es indiferente
    state.setLanguage('es'); // determinismo: las aserciones de etiquetas esperan español (el runner puede detectar 'en')
}

function freshEngine() {
    ensureCalendarFixture();
    const engine = new CalendarAgendaEngine();
    engine.init();
    return engine;
}

test('CalendarAgendaEngine: parseICS extrae eventos estándar RFC 5545 con campos clave', ({ expect }) => {
    const engine = new CalendarAgendaEngine();
    const icsSample = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HaDeS//Test//ES
BEGIN:VEVENT
UID:event-123@hades
SUMMARY:Revisión de Arquitectura
DESCRIPTION:Validación de módulos v1.0.0
LOCATION:Google Meet
DTSTART:20260901T100000Z
DTEND:20260901T110000Z
END:VEVENT
END:VCALENDAR
    `.trim();

    const parsed = engine.parseICS(icsSample);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
    expect(parsed[0].title).toBe('Revisión de Arquitectura');
    expect(parsed[0].location).toBe('Google Meet');
    expect(parsed[0].desc).toBe('Validación de módulos v1.0.0');
    expect(parsed[0].start).toContain('2026-09-01');
});

test('CalendarAgendaEngine: guardado y persistencia de configuración y eventos', ({ expect }) => {
    const engine = new CalendarAgendaEngine();
    engine.config.feedUrl = 'https://example.com/calendar.ics';
    engine.saveConfig();

    const reloaded = new CalendarAgendaEngine();
    expect(reloaded.config.feedUrl).toBe('https://example.com/calendar.ics');
});

test('CalendarAgendaEngine: parseICS extrae enlaces de videoconferencia y ubicaciones', ({ expect }) => {
    const engine = new CalendarAgendaEngine();
    const icsSample = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:meet-456@hades
SUMMARY:Demo Sprint
LOCATION:https://meet.google.com/abc-defg-hij
DTSTART:20261010T150000Z
DTEND:20261010T160000Z
END:VEVENT
END:VCALENDAR
    `.trim();

    const parsed = engine.parseICS(icsSample);
    expect(parsed.length).toBe(1);
    expect(parsed[0].title).toBe('Demo Sprint');
    expect(parsed[0].link).toBe('https://meet.google.com/abc-defg-hij');
});

// ===================== Calendario completo (modal papel centrado) =====================

test('Calendario completo: abre al pinchar el widget y renderiza rejilla de 42 celdas con "hoy" marcado', ({ expect }) => {
    const engine = freshEngine();
    expect(engine.fullModal).toBeTruthy();
    expect(engine.fullModal.classList.contains('hidden')).toBe(true);

    engine.openFullCalendar();
    expect(engine.fullModal.classList.contains('hidden')).toBe(false);

    const cells = engine.fullModal.querySelectorAll('#agenda-full-grid .ag-cell');
    expect(cells.length).toBe(42);

    const todayKey = engine.localKey(new Date());
    const todayCell = engine.fullModal.querySelector(`.ag-cell[data-date="${todayKey}"]`);
    expect(todayCell).toBeTruthy();
    expect(todayCell.classList.contains('ag-today')).toBe(true);
    expect(todayCell.classList.contains('ag-selected')).toBe(true); // se abre con hoy seleccionado

    // Héroe del mes: nombre + año actual
    expect(document.getElementById('calendar-month-name').textContent.length).toBeGreaterThan(2);
    expect(document.getElementById('calendar-month-year').textContent).toBe(String(new Date().getFullYear()));

    // Cabecera de 7 días con color por día
    const weekdays = engine.fullModal.querySelectorAll('#agenda-weekhead .agenda-weekday');
    expect(weekdays.length).toBe(7);
    expect(weekdays[0].classList.contains('wd-0')).toBe(true);
    expect(weekdays[0].textContent).toMatch(/lun/i); // empieza en lunes (no viernes)
    expect(weekdays[6].textContent).toMatch(/dom/i); // termina en domingo

    engine.closeFullCalendar();
    expect(engine.fullModal.classList.contains('hidden')).toBe(true);
});

test('Calendario completo: clic sobre el widget (fuera de botones) lo abre y el clic de fondo lo cierra', ({ expect }) => {
    const engine = freshEngine();
    expect(engine.fullModal.classList.contains('hidden')).toBe(true);

    // Clic directo sobre la tarjeta (e.target = tarjeta, no un botón) → abre
    engine.widgetCard.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(engine.fullModal.classList.contains('hidden')).toBe(false);

    // Clic sobre el backdrop (e.target = backdrop) → cierra
    engine.fullModal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(engine.fullModal.classList.contains('hidden')).toBe(true);

    // Clic sobre un botón del widget NO debe abrirlo (guarda de delegación)
    const syncBtn = document.getElementById('calendar-sync-btn');
    const ev = new MouseEvent('click', { bubbles: true });
    // Evitamos que syncFeed intente fetch: sin feedUrl solo abriría el modal de config
    engine.config.feedUrl = '';
    syncBtn.dispatchEvent(ev);
    // El widget no lo abrió (el modal de config sí se abre, que es lo esperado del botón)
    expect(engine.fullModal.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('calendar-modal').classList.contains('hidden')).toBe(false);
    document.getElementById('calendar-modal').classList.add('hidden');
});

test('Calendario completo: navegación de meses (prev/next) y "Hoy" restauran la vista', ({ expect }) => {
    const engine = freshEngine();
    engine.openFullCalendar();
    const titleEl = document.getElementById('agenda-month-title');
    const current = titleEl.textContent;
    expect(current.length).toBeGreaterThan(3);

    engine.nextMonth();
    expect(titleEl.textContent).not.toBe(current);

    engine.prevMonth();
    engine.prevMonth();
    expect(titleEl.textContent).not.toBe(current);

    engine.goToday();
    expect(titleEl.textContent).toBe(current);
    expect(engine.selectedDay).toBe(engine.localKey(new Date()));
    engine.closeFullCalendar();
});

test('Calendario completo: seleccionar día resalta la celda, muestra su panel y sus eventos', ({ expect }) => {
    const engine = freshEngine();
    engine.openFullCalendar();

    // Evento manual dentro del mes visible
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), Math.min(now.getDate() + 2, 28));
    const key = engine.localKey(target);
    engine.events.push({
        id: 'test-ev-day',
        title: 'Revisión AAA',
        start: new Date(target.getFullYear(), target.getMonth(), target.getDate(), 15, 0).toISOString(),
        end: new Date(target.getFullYear(), target.getMonth(), target.getDate(), 16, 0).toISOString(),
        category: 'focus',
        source: 'manual'
    });
    engine.saveEvents(engine.events);

    // Al haber guardado con el modal abierto, el panel se actualiza solo
    engine.selectDay(key);
    const sel = engine.fullModal.querySelector(`.ag-cell[data-date="${key}"]`);
    expect(sel.classList.contains('ag-selected')).toBe(true);
    expect(sel.querySelectorAll('.ag-dot').length).toBeGreaterThanOrEqual(1);

    const dayEvents = document.getElementById('agenda-day-events');
    expect(dayEvents.textContent).toContain('Revisión AAA');
    expect(document.getElementById('agenda-day-title').textContent.length).toBeGreaterThan(3);

    engine.deleteEvent('test-ev-day');
    engine.closeFullCalendar();
});

test('Calendario completo: "Añadir evento este día" pre-rellena la fecha seleccionada', ({ expect }) => {
    const engine = freshEngine();
    engine.openFullCalendar();

    const target = new Date(2026, 5, 17); // 17 de junio de 2026
    engine.viewDate = new Date(2026, 5, 1);
    engine.renderFullCalendar();
    engine.selectDay(engine.localKey(target));

    engine.openEventModalForDate(engine.selectedDay);
    const dateInput = document.getElementById('event-form-date');
    expect(dateInput.value).toBe('2026-06-17');
    expect(engine.eventModal.classList.contains('hidden')).toBe(false);

    engine.closeEventModal();
    engine.closeFullCalendar();
});

test('Calendario completo: guardar un evento actualiza el panel del día en vivo y permite borrarlo', ({ expect }) => {
    const engine = freshEngine();
    engine.openFullCalendar();

    const target = new Date(2026, 5, 17);
    engine.viewDate = new Date(2026, 5, 1);
    engine.selectDay(engine.localKey(target));

    // Relleno del formulario (mismo flujo que saveManualEventFromForm)
    document.getElementById('event-form-title').value = 'Sprint Demo';
    document.getElementById('event-form-date').value = '2026-06-17';
    document.getElementById('event-form-time').value = '10:00';
    document.getElementById('event-form-link').value = 'https://meet.google.com/abc-defg-hij';
    document.getElementById('event-form-category').value = 'work';

    engine.saveManualEventFromForm();
    expect(engine.eventModal.classList.contains('hidden')).toBe(true);
    expect(engine.events.some(e => e.title === 'Sprint Demo')).toBe(true);

    // El panel del día lo muestra en vivo (renderFullCalendar re-ejecutado desde render)
    const dayEvents = document.getElementById('agenda-day-events');
    expect(dayEvents.textContent).toContain('Sprint Demo');
    const join = dayEvents.querySelector('.agenda-ev-link');
    expect(join).toBeTruthy();
    expect(join.getAttribute('href')).toContain('meet.google.com');

    // Borrar desde el panel del día
    const del = dayEvents.querySelector('.agenda-ev-del');
    expect(del).toBeTruthy();
    const delId = del.dataset.evId;
    del.click();
    expect(engine.events.some(e => e.id === delId)).toBe(false);
    engine.closeFullCalendar();
});

test('Widget agenda: la paleta de papel persiste y el modal completo hereda el color', ({ expect }) => {
    const engine = freshEngine();
    const wm = new WidgetsManager();
    wm.bindCalendarPaper();

    const card = document.getElementById('widget-calendar-card');
    expect(card.classList.contains('paper-white')).toBe(true); // papel blanco por defecto

    const pink = card.querySelector('.calendar-swatch[data-paper="pink"]');
    pink.click();
    expect(card.classList.contains('paper-pink')).toBe(true);
    expect(localStorage.getItem('calendar_paper_color')).toBe('pink');
    expect(pink.getAttribute('aria-pressed')).toBe('true');

    // El modal completo hereda el papel del widget al abrirse
    engine.openFullCalendar();
    expect(engine.fullCard.classList.contains('paper-pink')).toBe(true);
    engine.closeFullCalendar();

    // Limpieza para no contaminar otros tests
    localStorage.removeItem('calendar_paper_color');
    card.classList.remove('paper-pink');
});
