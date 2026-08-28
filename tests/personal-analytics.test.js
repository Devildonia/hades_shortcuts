// tests/personal-analytics.test.js — Tests para PersonalAnalyticsEngine
import { test } from './harness.js';
import { PersonalAnalyticsEngine, getLocalDateString, getCalendarDayDiff } from '../js/personal-analytics.js';

test('PersonalAnalytics: getLocalDateString y getCalendarDayDiff calculan días exactos', ({ expect }) => {
    const d1 = new Date(2026, 7, 28); // 28 Aug 2026
    const str1 = getLocalDateString(d1);
    expect(str1).toBe('2026-08-28');

    const diff1 = getCalendarDayDiff('2026-08-27', '2026-08-28');
    expect(diff1).toBe(1);

    const diff2 = getCalendarDayDiff('2026-08-20', '2026-08-28');
    expect(diff2).toBe(8);
});

test('PersonalAnalyticsEngine: logLaunch incrementa totalLaunches y shortcutCounts', ({ expect }) => {
    const engine = new PersonalAnalyticsEngine();
    expect(engine.data.totalLaunches).toBe(0);

    engine.logLaunch('github', 'GitHub');
    engine.logLaunch('github', 'GitHub');
    engine.logLaunch('claude', 'Claude');

    expect(engine.data.totalLaunches).toBe(3);
    expect(engine.data.shortcutCounts['github']).toBe(2);
    expect(engine.data.shortcutCounts['claude']).toBe(1);

    const reloaded = new PersonalAnalyticsEngine();
    expect(reloaded.data.totalLaunches).toBe(3);
    expect(reloaded.data.shortcutCounts['github']).toBe(2);
});

test('PersonalAnalyticsEngine: dailyHistory y hourlyDistribution registran la actividad', ({ expect }) => {
    const engine = new PersonalAnalyticsEngine();
    const today = getLocalDateString(new Date());
    const hour = new Date().getHours().toString();

    engine.logLaunch('chatgpt', 'ChatGPT');

    expect(engine.data.dailyHistory[today]).toBeTruthy();
    expect(engine.data.dailyHistory[today].total).toBe(1);
    expect(engine.data.dailyHistory[today].shortcuts['chatgpt']).toBe(1);

    expect(engine.data.hourlyDistribution[hour]).toBeTruthy();
    expect(engine.data.hourlyDistribution[hour]['chatgpt']).toBe(1);
});
