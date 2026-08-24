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

    calculateSolarPhase() {
        const now = new Date();
        const hour = now.getHours() + now.getMinutes() / 60;

        if (hour >= 6 && hour < 10) return SOLAR_PHASES.DAWN;
        if (hour >= 10 && hour < 18) return SOLAR_PHASES.NOON;
        if (hour >= 18 && hour < 22) return SOLAR_PHASES.TWILIGHT;
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
