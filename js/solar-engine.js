// js/solar-engine.js - Dynamic Solar Lighting & Circadian Lighting Engine

import { state } from './state.js';
import { i18nDictionaries } from './i18n.js';

export const SOLAR_PHASES = {
    DAWN: 'dawn',
    NOON: 'noon',
    TWILIGHT: 'twilight',
    MIDNIGHT: 'midnight'
};

export class SolarEngine {
    constructor() {
        this.enabled = state.getItem('solar_lighting_enabled', 'false') === 'true';
        this.currentPhase = SOLAR_PHASES.NOON;
        this.timer = null;
    }

    init() {
        this.syncSolarState();
        this.startSolarClock();

        state.on('settings:solar_toggle', (enabled) => {
            this.enabled = enabled;
            state.setItem('solar_lighting_enabled', enabled ? 'true' : 'false');
            this.syncSolarState();
        });
    }

    calculateSolarElevation(lat, lon, date) {
        const rad = Math.PI / 180;
        const start = Date.UTC(date.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((date.getTime() - start) / 86400000);
        const decl = 23.44 * Math.sin((360 / 365) * (dayOfYear - 81) * rad);
        const tzHours = -date.getTimezoneOffset() / 60;
        const lstm = 15 * tzHours;
        const B = (360 / 365) * (dayOfYear - 81) * rad;
        const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
        const tc = 4 * (lon - lstm) + eot;
        const lst = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60 + tc;
        const ha = (lst / 60 - 12) * 15;
        return Math.asin(
            Math.sin(lat * rad) * Math.sin(decl * rad) +
            Math.cos(lat * rad) * Math.cos(decl * rad) * Math.cos(ha * rad)
        ) / rad;
    }

    getObserverCoords() {
        try {
            const cache = JSON.parse(localStorage.getItem('weather_cache_v2') || '{}');
            if (typeof cache.lat === 'number' && typeof cache.lon === 'number') {
                return { lat: cache.lat, lon: cache.lon };
            }
            const manual = JSON.parse(localStorage.getItem('weather_manual_city') || 'null');
            if (manual && typeof manual.lat === 'number' && typeof manual.lon === 'number') {
                return { lat: manual.lat, lon: manual.lon };
            }
        } catch (e) {}
        return { lat: 42.2328, lon: -8.7226 };
    }

    calculateSolarPhase() {
        const { lat, lon } = this.getObserverCoords();
        const elev = this.calculateSolarElevation(lat, lon, new Date());
        if (elev >= 40) return SOLAR_PHASES.NOON;
        if (elev >= 0) return new Date().getHours() < 12 ? SOLAR_PHASES.DAWN : SOLAR_PHASES.TWILIGHT;
        if (elev >= -6) return SOLAR_PHASES.TWILIGHT;
        return SOLAR_PHASES.MIDNIGHT;
    }

    syncSolarState() {
        if (!this.enabled) {
            document.documentElement.removeAttribute('data-solar-phase');
            return;
        }

        const phase = this.calculateSolarPhase();
        this.currentPhase = phase;
        document.documentElement.setAttribute('data-solar-phase', phase);
    }

    startSolarClock() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.syncSolarState(), 5 * 60 * 1000);
    }

    getPhaseLabel() {
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).solar || {};
        return t[this.currentPhase] || this.currentPhase;
    }
}

export const solarEngine = new SolarEngine();
