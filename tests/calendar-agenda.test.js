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
