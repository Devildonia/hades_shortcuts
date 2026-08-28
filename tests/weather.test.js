// tests/weather.test.js — Tests para WeatherEngine
import { test } from './harness.js';
import { WeatherEngine } from '../js/weather.js';

test('WeatherEngine: getWeatherInfo mapea códigos WMO diurnos y nocturnos', ({ expect }) => {
    const engine = new WeatherEngine();

    const clearDay = engine.getWeatherInfo(0, true);
    expect(clearDay.icon).toBe('☀️');

    const clearNight = engine.getWeatherInfo(0, false);
    expect(clearNight.icon).toBe('🌙');

    const rain = engine.getWeatherInfo(61, true);
    expect(rain.icon).toBe('🌧️');

    const thunder = engine.getWeatherInfo(95, true);
    expect(thunder.icon).toBe('⛈️');

    const snow = engine.getWeatherInfo(71, true);
    expect(snow.icon).toBe('❄️');
});

test('WeatherEngine: renderWeatherUI actualiza lastWeather y estado interno', ({ expect }) => {
    const engine = new WeatherEngine();
    engine.renderWeatherUI('Madrid', 24.5, 0, true);

    expect(engine.lastWeather).toBeTruthy();
    expect(engine.lastWeather.city).toBe('Madrid');
    expect(engine.lastWeather.temp).toBe(24.5);
    expect(engine.lastWeather.code).toBe(0);
    expect(engine.lastWeather.isDay).toBe(true);
});

test('WeatherEngine: destroy limpia intervalos y timeouts activos', ({ expect }) => {
    const engine = new WeatherEngine();
    engine.weatherInterval = setInterval(() => {}, 100000);
    engine.minuteSyncTimeout = setTimeout(() => {}, 100000);

    engine.destroy();
    expect(engine.weatherInterval).toBeNull();
    expect(engine.minuteSyncTimeout).toBeNull();
});
