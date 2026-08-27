// js/telemetry.js - Cyberpunk System Telemetry & Network Health Hub

import { state } from './state.js';
import { soundFx } from './audio.js';
import { i18nDictionaries } from './i18n.js';

export class TelemetryEngine {
    constructor() {
        this.capsuleEl = document.getElementById('telemetry-capsule');
        this.pingEl = document.getElementById('telemetry-ping-val');
        this.batteryEl = document.getElementById('telemetry-battery-val');
        this.fpsEl = document.getElementById('telemetry-fps-val');
        this.statusDot = document.getElementById('telemetry-status-dot');
        this.statusBadge = document.getElementById('telemetry-status-badge');
        this.statusText = document.getElementById('telemetry-status-text');
        this.lastPing = 24;
        this.fps = 60;
        this.timer = null;
    }

    init() {
        this.measurePing();
        this.initBatteryMonitor();
        this.measureFPS();
        this.bindOnlineOffline();
        this.startPeriodicSync();
        this.bindModalEvents();
    }

    async measurePing() {
        const endpoints = [
            { url: 'https://www.cloudflare.com/cdn-cgi/trace', mode: 'cors' },
            { url: 'https://1.1.1.1/cdn-cgi/trace', mode: 'no-cors' }
        ];
        for (const ep of endpoints) {
            const start = performance.now();
            try {
                await fetch(ep.url, { mode: ep.mode, cache: 'no-store' });
                this.lastPing = Math.min(Math.round(performance.now() - start), 999);
                if (this.pingEl) this.pingEl.textContent = `${this.lastPing}ms`;
                if (this.statusDot) this.statusDot.className = 'telemetry-dot online';
                if (this.statusBadge) this.statusBadge.className = 'telemetry-status-badge online';
                if (this.statusText) this.statusText.textContent = 'ONLINE';
                return;
            } catch (e) {}
        }
        if (this.pingEl) this.pingEl.textContent = '—';
        if (this.statusDot) this.statusDot.className = 'telemetry-dot offline';
        if (this.statusBadge) this.statusBadge.className = 'telemetry-status-badge offline';
        if (this.statusText) this.statusText.textContent = 'OFFLINE';
    }

    async initBatteryMonitor() {
        if (!navigator.getBattery) return;
        try {
            const battery = await navigator.getBattery();
            const updateBattery = () => {
                const lvl = Math.round(battery.level * 100);
                const charging = battery.charging ? '⚡' : '';
                if (this.batteryEl) this.batteryEl.textContent = `${charging}${lvl}%`;
            };
            updateBattery();
            battery.addEventListener('levelchange', updateBattery);
            battery.addEventListener('chargingchange', updateBattery);
        } catch (e) {}
    }

    measureFPS() {
        let frameCount = 0;
        let lastTime = performance.now();
        const checkFPS = (now) => {
            if (document.hidden) {
                requestAnimationFrame(checkFPS);
                return;
            }
            frameCount++;
            if (now - lastTime >= 1000) {
                this.fps = Math.round((frameCount * 1000) / (now - lastTime));
                if (this.fpsEl) this.fpsEl.textContent = `${this.fps} FPS`;
                frameCount = 0;
                lastTime = now;
            }
            requestAnimationFrame(checkFPS);
        };
        requestAnimationFrame(checkFPS);
    }

    bindOnlineOffline() {
        window.addEventListener('online', () => {
            if (this.statusDot) this.statusDot.className = 'telemetry-dot online';
            if (this.statusBadge) this.statusBadge.className = 'telemetry-status-badge online';
            if (this.statusText) this.statusText.textContent = 'ONLINE';
            this.measurePing();
        });
        window.addEventListener('offline', () => {
            if (this.statusDot) this.statusDot.className = 'telemetry-dot offline';
            if (this.statusBadge) this.statusBadge.className = 'telemetry-status-badge offline';
            if (this.statusText) this.statusText.textContent = 'OFFLINE';
            if (this.pingEl) this.pingEl.textContent = '---';
        });
    }

    startPeriodicSync() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.measurePing(), 30 * 1000);
    }

    bindModalEvents() {
        if (this.capsuleEl) {
            this.capsuleEl.addEventListener('click', () => {
                soundFx.play('click');
                this.measurePing();
            });
        }
    }
}

export const telemetry = new TelemetryEngine();
