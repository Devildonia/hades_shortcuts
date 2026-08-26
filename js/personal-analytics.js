// js/personal-analytics.js - 100% Local Personal Analytics & Predictive Context Engine

import { state } from './state.js';
import { soundFx } from './audio.js';
import { i18nDictionaries } from './i18n.js';

export class PersonalAnalyticsEngine {
    constructor() {
        this.storageKey = 'hades_personal_analytics_v1';
        this.data = this.loadData();
    }

    loadData() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {
            totalLaunches: 0,
            streakDays: 1,
            lastActiveDate: new Date().toISOString().slice(0, 10),
            dailyHistory: {},
            hourlyDistribution: {},
            shortcutCounts: {}
        };
    }

    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {}
    }

    logLaunch(shortcutId, shortcutTitle) {
        if (!shortcutId) return;
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const hour = now.getHours().toString();

        this.data.totalLaunches = (this.data.totalLaunches || 0) + 1;
        this.data.shortcutCounts[shortcutId] = (this.data.shortcutCounts[shortcutId] || 0) + 1;

        // Daily history tracking
        if (!this.data.dailyHistory[todayStr]) {
            this.data.dailyHistory[todayStr] = { total: 0, shortcuts: {} };
        }
        this.data.dailyHistory[todayStr].total = (this.data.dailyHistory[todayStr].total || 0) + 1;
        this.data.dailyHistory[todayStr].shortcuts[shortcutId] = (this.data.dailyHistory[todayStr].shortcuts[shortcutId] || 0) + 1;

        // Hourly distribution tracking
        if (!this.data.hourlyDistribution[hour]) {
            this.data.hourlyDistribution[hour] = {};
        }
        this.data.hourlyDistribution[hour][shortcutId] = (this.data.hourlyDistribution[hour][shortcutId] || 0) + 1;

        // Streak check
        if (this.data.lastActiveDate !== todayStr) {
            const lastDate = new Date(this.data.lastActiveDate);
            const diffDays = Math.round((now - lastDate) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) this.data.streakDays = (this.data.streakDays || 1) + 1;
            else if (diffDays > 1) this.data.streakDays = 1;
            this.data.lastActiveDate = todayStr;
        }

        // Prune old days beyond 30 days
        const dayKeys = Object.keys(this.data.dailyHistory).sort();
        if (dayKeys.length > 30) {
            delete this.data.dailyHistory[dayKeys[0]];
        }

        this.saveData();
    }

    getSmartSuggestion() {
        const now = new Date();
        const currentHour = now.getHours().toString();
        const hourStats = this.data.hourlyDistribution[currentHour] || {};
        
        let bestId = null;
        let maxCount = 0;
        for (const [id, count] of Object.entries(hourStats)) {
            if (count > maxCount) {
                maxCount = count;
                bestId = id;
            }
        }

        if (bestId && maxCount >= 2) {
            const sc = (state.shortcuts || []).find(s => s.id === bestId);
            if (sc) return { shortcut: sc, count: maxCount, hour: now.getHours() };
        }
        return null;
    }

    renderSmartChip(containerEl) {
        if (!containerEl) return;
        const suggestion = this.getSmartSuggestion();
        if (!suggestion) {
            containerEl.classList.add('hidden');
            return;
        }

        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).analytics || {};
        const hourFmt = `${suggestion.hour.toString().padStart(2, '0')}:00`;
        const textPrompt = (t.suggestion_text || 'Sueles abrir {title} a las {hour}').replace('{title}', `<strong>${suggestion.shortcut.title}</strong>`).replace('{hour}', hourFmt);

        containerEl.innerHTML = `
            <div class="smart-suggestion-pill">
                <span class="smart-sugg-icon">⚡</span>
                <span class="smart-sugg-msg">${textPrompt}</span>
                <button class="smart-sugg-action-btn" id="smart-sugg-launch">${t.launch_btn || 'Lanzar ahora'}</button>
                <button class="smart-sugg-dismiss-btn" id="smart-sugg-dismiss" title="Descartar">✕</button>
            </div>
        `;
        containerEl.classList.remove('hidden');

        const launchBtn = containerEl.querySelector('#smart-sugg-launch');
        const dismissBtn = containerEl.querySelector('#smart-sugg-dismiss');

        if (launchBtn) {
            launchBtn.onclick = () => {
                soundFx.play('click');
                window.open(suggestion.shortcut.url, '_blank');
                containerEl.classList.add('hidden');
            };
        }
        if (dismissBtn) {
            dismissBtn.onclick = () => {
                soundFx.play('click');
                containerEl.classList.add('hidden');
            };
        }
    }

    generate7DayChartSVG() {
        const days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);
            const count = this.data.dailyHistory[dateStr] ? this.data.dailyHistory[dateStr].total : 0;
            const dayName = d.toLocaleDateString(state.language || 'es', { weekday: 'short' });
            days.push({ date: dateStr, name: dayName, count });
        }

        const maxCount = Math.max(...days.map(d => d.count), 10);
        const chartHeight = 110;
        const chartWidth = 320;
        const barWidth = 28;
        const gap = 16;

        let barsSVG = '';
        days.forEach((day, i) => {
            const h = Math.max(4, Math.round((day.count / maxCount) * (chartHeight - 35)));
            const x = 16 + i * (barWidth + gap);
            const y = chartHeight - 20 - h;

            barsSVG += `
                <g class="chart-bar-group">
                    <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="5" class="chart-bar" />
                    <text x="${x + barWidth/2}" y="${y - 4}" text-anchor="middle" class="chart-bar-val">${day.count}</text>
                    <text x="${x + barWidth/2}" y="${chartHeight - 5}" text-anchor="middle" class="chart-bar-label">${day.name.slice(0, 3)}</text>
                </g>
            `;
        });

        return `
            <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="analytics-svg-chart">
                <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#00f2fe"/>
                        <stop offset="100%" stop-color="#4facfe"/>
                    </linearGradient>
                </defs>
                ${barsSVG}
            </svg>
        `;
    }

    getPeakProductivityHour() {
        let peakHour = 10;
        let maxLaunches = 0;
        for (const [hour, scs] of Object.entries(this.data.hourlyDistribution || {})) {
            const sum = Object.values(scs).reduce((a, b) => a + b, 0);
            if (sum > maxLaunches) {
                maxLaunches = sum;
                peakHour = parseInt(hour);
            }
        }
        return `${peakHour.toString().padStart(2, '0')}:00`;
    }

    resetData() {
        this.data = {
            totalLaunches: 0,
            streakDays: 1,
            lastActiveDate: new Date().toISOString().slice(0, 10),
            dailyHistory: {},
            hourlyDistribution: {},
            shortcutCounts: {}
        };
        this.saveData();
    }
}

export const personalAnalytics = new PersonalAnalyticsEngine();
