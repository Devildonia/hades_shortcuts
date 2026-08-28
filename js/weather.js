// js/weather.js - Clock & Weather Engine

import { state, escapeHtml, showToast } from './state.js';
import { i18nDictionaries, getTranslation } from './i18n.js';

export class WeatherEngine {
    constructor() {
        this.liveTimeEl = document.getElementById('live-time');
        this.liveDateEl = document.getElementById('live-date');
        this.greetingTextEl = document.getElementById('greeting-text');
        this.weatherWidget = document.getElementById('weather-widget');
        this.weatherTempEl = document.getElementById('weather-temp');
        this.weatherCityEl = document.getElementById('weather-city');
        this.weatherIconEl = document.getElementById('weather-icon');
        this.weatherConditionEl = document.getElementById('weather-condition');
        this.weatherModal = document.getElementById('weather-modal');
        this.closeWeatherModalBtn = document.getElementById('close-weather-modal');
        this.weatherCityInput = document.getElementById('weather-city-input');
        this.weatherSearchBtn = document.getElementById('weather-search-btn');
        this.weatherCityResults = document.getElementById('weather-city-results');
        this.weatherAutoBtn = document.getElementById('weather-auto-btn');
        this.lastWeather = null;
        this.weatherInterval = null;
        this.minuteSyncTimeout = null;
        this._inited = false;
    }

    init() {
        if (this._inited) {
            this.destroy();
        }
        this._inited = true;

        this.updateClockAndGreeting();
        this.scheduleMinuteSync();
        this.detectLocationAndWeather();
        this.bindModalEvents();
        this.weatherInterval = setInterval(() => this.detectLocationAndWeather(), 15 * 60 * 1000);

        state.on('language:changed', () => {
            this.updateClockAndGreeting();
            if (this.lastWeather) {
                this.renderWeatherUI(this.lastWeather.city, this.lastWeather.temp, this.lastWeather.code, this.lastWeather.isDay);
            }
        });
        state.on('username:changed', () => this.updateClockAndGreeting());
    }

    destroy() {
        if (this.weatherInterval) {
            clearInterval(this.weatherInterval);
            this.weatherInterval = null;
        }
        if (this.minuteSyncTimeout) {
            clearTimeout(this.minuteSyncTimeout);
            this.minuteSyncTimeout = null;
        }
    }

    updateClockAndGreeting() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        if (this.liveTimeEl) this.liveTimeEl.textContent = `${hours}:${minutes}`;

        // Localized Date Format
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        const localeMap = { es: 'es-ES', en: 'en-US', fr: 'fr-FR', de: 'de-DE' };
        if (this.liveDateEl) {
            const dateStr = now.toLocaleDateString(localeMap[state.language] || 'es-ES', options);
            this.liveDateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        }

        // Localized Contextual Greeting
        const t = i18nDictionaries[state.language] || i18nDictionaries.es;
        const hour = now.getHours();
        let greeting = t.brand_greeting;
        const uName = state.userName || 'HaDeS';
        if (hour >= 6 && hour < 13) {
            greeting = t.greetings.morning.replace('HaDeS', uName);
        } else if (hour >= 13 && hour < 21) {
            greeting = t.greetings.afternoon.replace('HaDeS', uName);
        } else {
            greeting = t.greetings.night.replace('HaDeS', uName);
        }
        if (this.greetingTextEl) this.greetingTextEl.textContent = greeting;
    }

    scheduleMinuteSync() {
        if (this.minuteSyncTimeout) clearTimeout(this.minuteSyncTimeout);
        const now = new Date();
        const msToNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50;
        this.minuteSyncTimeout = setTimeout(() => {
            this.updateClockAndGreeting();
            this.scheduleMinuteSync();
        }, msToNext);
    }

    getWeatherInfo(code, isDay) {
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).weather.conditions;
        switch (code) {
            case 0: return { desc: t.clear, icon: isDay ? '☀️' : '🌙' };
            case 1: return { desc: t.mostly_clear, icon: isDay ? '🌤️' : '🌙' };
            case 2: return { desc: t.partly_cloudy, icon: isDay ? '⛅' : '☁️' };
            case 3: return { desc: t.cloudy, icon: '☁️' };
            case 45: case 48: return { desc: t.fog, icon: '🌫️' };
            case 51: case 53: case 55: return { desc: t.drizzle, icon: '🌦️' };
            case 61: case 63: return { desc: t.rain, icon: '🌧️' };
            case 65: return { desc: t.heavy_rain, icon: '🌧️' };
            case 71: case 73: case 75: case 77: return { desc: t.snow, icon: '❄️' };
            case 80: case 81: case 82: return { desc: t.showers, icon: '🌧️' };
            case 85: case 86: return { desc: t.snow_showers, icon: '🌨️' };
            case 95: return { desc: t.thunderstorm, icon: '⛈️' };
            case 96: case 99: return { desc: t.hail_thunderstorm, icon: '⛈️' };
            default: return { desc: t.clear, icon: isDay ? '☀️' : '🌙' };
        }
    }

    renderWeatherUI(city, temp, code, isDay) {
        this.lastWeather = { city, temp, code, isDay };
        if (this.weatherCityEl) this.weatherCityEl.textContent = city;
        if (this.weatherTempEl) this.weatherTempEl.textContent = `${Math.round(temp)}°C`;
        const info = this.getWeatherInfo(code, isDay);
        if (this.weatherIconEl) this.weatherIconEl.textContent = info.icon;
        if (this.weatherConditionEl) this.weatherConditionEl.textContent = info.desc;
    }

    async fetchWeatherForCoords(lat, lon, cityName) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
            const res = await fetch(url);
            const data = await res.json();
            if (data && data.current) {
                const temp = data.current.temperature_2m;
                const code = data.current.weather_code;
                const isDay = data.current.is_day === 1;
                this.renderWeatherUI(cityName, temp, code, isDay);
                localStorage.setItem('weather_cache_v2', JSON.stringify({
                    city: cityName, temp, code, isDay, timestamp: Date.now(), lat, lon
                }));
            }
        } catch (e) {
            showToast(getTranslation('toasts.weather_error') || 'Could not refresh weather.', 'error');
        }
    }

    async detectLocationAndWeather() {
        const manualCity = localStorage.getItem('weather_manual_city');
        if (manualCity) {
            try {
                const parsed = JSON.parse(manualCity);
                if (parsed.lat && parsed.lon) {
                    await this.fetchWeatherForCoords(parsed.lat, parsed.lon, parsed.name || 'Mi Ciudad');
                    return;
                }
            } catch (e) {}
        }

        let detectedCity = 'Vigo';
        let detectedLat = 42.2328;
        let detectedLon = -8.7226;
        let resolved = false;

        try {
            const ipRes = await fetch('https://ipwho.is/');
            const ipData = await ipRes.json();
            if (ipData && ipData.success !== false && ipData.latitude) {
                detectedCity = ipData.city || 'Tu Zona';
                detectedLat = ipData.latitude;
                detectedLon = ipData.longitude;
                resolved = true;
            }
        } catch (e) {}

        if (!resolved) {
            try {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';
                const parts = tz.split('/');
                const tzCity = (parts[1] || 'Madrid').replace(/_/g, ' ');
                const geoSearchRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(tzCity)}&count=1&language=es&format=json`);
                const geoSearchData = await geoSearchRes.json();
                if (geoSearchData.results && geoSearchData.results.length > 0) {
                    detectedCity = geoSearchData.results[0].name;
                    detectedLat = geoSearchData.results[0].latitude;
                    detectedLon = geoSearchData.results[0].longitude;
                    resolved = true;
                }
            } catch (e) {}
        }

        await this.fetchWeatherForCoords(detectedLat, detectedLon, detectedCity);
    }

    bindModalEvents() {
        const openModal = () => {
            if (!this.weatherModal) return;
            this.weatherModal.classList.remove('hidden');
            if (this.weatherCityInput) {
                this.weatherCityInput.value = '';
                this.weatherCityInput.focus();
            }
            if (this.weatherCityResults) {
                this.weatherCityResults.classList.add('hidden');
                this.weatherCityResults.innerHTML = '';
            }
        };

        const closeModal = () => {
            if (this.weatherModal) this.weatherModal.classList.add('hidden');
        };

        if (this.weatherWidget) {
            this.weatherWidget.addEventListener('click', openModal);
            this.weatherWidget.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openModal();
                }
            });
        }

        if (this.closeWeatherModalBtn) this.closeWeatherModalBtn.addEventListener('click', closeModal);
        if (this.weatherModal) {
            this.weatherModal.addEventListener('click', (e) => {
                if (e.target === this.weatherModal) closeModal();
            });
        }

        const searchCity = async () => {
            if (!this.weatherCityInput) return;
            const query = this.weatherCityInput.value.trim();
            if (!query) return;

            if (this.weatherSearchBtn) this.weatherSearchBtn.textContent = '...';
            try {
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json`);
                const data = await res.json();
                if (this.weatherCityResults) {
                    this.weatherCityResults.innerHTML = '';
                    if (data.results && data.results.length > 0) {
                        data.results.forEach(loc => {
                            const item = document.createElement('div');
                            item.className = 'weather-city-item';
                            const admin = loc.admin1 ? `${loc.admin1}, ` : '';
                            item.innerHTML = `
                                <span>📍 <strong>${escapeHtml(loc.name)}</strong></span>
                                <span class="weather-city-country">${escapeHtml(admin)}${escapeHtml(loc.country || '')}</span>
                            `;
                            item.addEventListener('click', async () => {
                                localStorage.setItem('weather_manual_city', JSON.stringify({
                                    name: loc.name,
                                    lat: loc.latitude,
                                    lon: loc.longitude
                                }));
                                localStorage.removeItem('weather_cache_v2');
                                await this.fetchWeatherForCoords(loc.latitude, loc.longitude, loc.name);
                                closeModal();
                            });
                            this.weatherCityResults.appendChild(item);
                        });
                        this.weatherCityResults.classList.remove('hidden');
                    } else {
                        this.weatherCityResults.innerHTML = `<div style="padding: 8px 12px; font-size: 0.82rem; color: var(--text-muted); text-align: center;">${escapeHtml(getTranslation('weather.no_cities') || 'No cities found.')}</div>`;
                        this.weatherCityResults.classList.remove('hidden');
                    }
                }
            } catch (err) {
                if (this.weatherCityResults) {
                    this.weatherCityResults.innerHTML = `<div style="padding: 8px 12px; font-size: 0.82rem; color: #ff6b6b; text-align: center;">${escapeHtml(getTranslation('weather.search_error') || 'Could not search for that city.')}</div>`;
                    this.weatherCityResults.classList.remove('hidden');
                }
            } finally {
                if (this.weatherSearchBtn) this.weatherSearchBtn.textContent = getTranslation('weather.search_btn') || 'Search';
            }
        };

        if (this.weatherSearchBtn) this.weatherSearchBtn.addEventListener('click', searchCity);
        if (this.weatherCityInput) {
            this.weatherCityInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchCity();
                }
            });
        }

        if (this.weatherAutoBtn) {
            this.weatherAutoBtn.addEventListener('click', async () => {
                localStorage.removeItem('weather_manual_city');
                localStorage.removeItem('weather_cache_v2');
                await this.detectLocationAndWeather();
                closeModal();
            });
        }
    }
}

