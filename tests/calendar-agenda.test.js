// tests/calendar-agenda.test.js — Tests de parser iCal RFC 5545 y eventos locales para CalendarAgendaEngine
import { test } from './harness.js';
import { CalendarAgendaEngine } from '../js/calendar-agenda.js';

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

test('CalendarAgendaEngine: guardado y persistencia de eventos manuales', ({ expect }) => {
    const engine = new CalendarAgendaEngine();
    const newEvent = {
        id: 'ev_' + Date.now(),
        title: 'Daily Standup',
        start: '2026-09-05T09:30',
        end: '2026-09-05T10:00',
        location: 'Discord',
        desc: 'Sincronización matutina'
    };

    engine.saveEvents([newEvent]);
    expect(engine.events.length).toBe(1);
    expect(engine.events[0].title).toBe('Daily Standup');

    const reloaded = new CalendarAgendaEngine();
    expect(reloaded.events.length).toBe(1);
    expect(reloaded.events[0].location).toBe('Discord');
});

test('CalendarAgendaEngine: getLocalDateString devuelve formato YYYY-MM-DD local', ({ expect }) => {
    const engine = new CalendarAgendaEngine();
    const date = new Date(2026, 8, 15, 12, 0, 0); // 15 de Septiembre 2026
    const str = engine.getLocalDateString(date);
    expect(str).toBe('2026-09-15');
});
