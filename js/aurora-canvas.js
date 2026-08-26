// js/aurora-canvas.js - Interactive Aurora Fluid Canvas Mesh & Mini-HUD Launcher (Phase 5)

import { state, escapeHtml, safeHttpUrl, normalizeTags } from './state.js';
import { soundFx } from './audio.js';

export class AuroraCanvasEngine {
    constructor() {
        this.canvas = document.getElementById('aurora-bg-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.enabled = localStorage.getItem('aurora_canvas_enabled') !== 'false';
        this.width = 0;
        this.height = 0;
        this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.time = 0;
        this.rafId = null;
        this.colorA = '#00f2fe';
        this.colorB = '#4facfe';
    }

    init() {
        if (!this.canvas || !this.ctx) return;
        this.resize();
        this.updateThemeColors();
        this.bindEvents();

        if (this.enabled) this.start();
        state.on('theme:changed', () => this.updateThemeColors());
    }

    resize() {
        if (!this.canvas) return;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.pointer.x = this.width / 2;
        this.pointer.y = this.height / 2;
        this.pointer.targetX = this.width / 2;
        this.pointer.targetY = this.height / 2;
    }

    updateThemeColors() {
        const root = getComputedStyle(document.documentElement);
        this.colorA = root.getPropertyValue('--accent-primary').trim() || '#00f2fe';
        this.colorB = root.getPropertyValue('--accent-glow').trim() || '#4facfe';
    }

    start() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.render = this.render.bind(this);
        this.rafId = requestAnimationFrame(this.render);
    }

    stop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
    }

    toggle(enable) {
        this.enabled = enable;
        localStorage.setItem('aurora_canvas_enabled', enable.toString());
        enable ? this.start() : this.stop();
    }

    render() {
        if (!this.enabled || !this.ctx) return;

        this.time += 0.008;
        this.pointer.x += (this.pointer.targetX - this.pointer.x) * 0.05;
        this.pointer.y += (this.pointer.targetY - this.pointer.y) * 0.05;

        this.ctx.clearRect(0, 0, this.width, this.height);

        const grad = this.ctx.createRadialGradient(
            this.pointer.x, this.pointer.y, 10,
            this.pointer.x, this.pointer.y, Math.max(this.width, this.height) * 0.75
        );
        grad.addColorStop(0, this.hexToRgba(this.colorA, 0.12));
        grad.addColorStop(0.5, this.hexToRgba(this.colorB, 0.04));
        grad.addColorStop(1, 'transparent');

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Render 2 Harmonic Organic Aurora Sine Waves
        this.drawWave(0.002, 45, 0.4, this.colorA, 0.08);
        this.drawWave(0.003, 30, -0.6, this.colorB, 0.06);

        this.rafId = requestAnimationFrame(this.render);
    }

    drawWave(freq, amp, speed, colorHex, alpha) {
        this.ctx.beginPath();
        const baseY = this.height * 0.65;
        this.ctx.moveTo(0, baseY);

        for (let x = 0; x < this.width; x += 16) {
            const distFromPointer = Math.abs(x - this.pointer.x) / this.width;
            const pointerInfluence = (1 - distFromPointer) * 20;
            const y = baseY + Math.sin(x * freq + this.time * speed) * (amp + pointerInfluence)
                            + Math.cos(x * freq * 0.5 + this.time) * 15;
            this.ctx.lineTo(x, y);
        }

        this.ctx.lineTo(this.width, this.height);
        this.ctx.lineTo(0, this.height);
        this.ctx.closePath();

        const waveGrad = this.ctx.createLinearGradient(0, baseY - amp, 0, this.height);
        waveGrad.addColorStop(0, this.hexToRgba(colorHex, alpha));
        waveGrad.addColorStop(1, 'transparent');

        this.ctx.fillStyle = waveGrad;
        this.ctx.fill();
    }

    hexToRgba(hex, alpha) {
        let c = hex.replace('#', '');
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const num = parseInt(c, 16);
        if (isNaN(num)) return `rgba(0, 242, 254, ${alpha})`;
        return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stop();
            else if (this.enabled) this.start();
        });
        window.addEventListener('pointermove', (e) => {
            this.pointer.targetX = e.clientX;
            this.pointer.targetY = e.clientY;
        }, { passive: true });
    }
}

export class MiniHudManager {
    constructor() {
        this.hudModal = document.getElementById('mini-hud-modal');
        this.hudInput = document.getElementById('hud-search-input');
        this.hudCloseBtn = document.getElementById('close-hud-modal');
        this.hudResults = document.getElementById('hud-results-grid');
    }

    init() {
        this.bindEvents();
    }

    open() {
        if (!this.hudModal) return;
        soundFx.play('click');
        this.hudModal.classList.remove('hidden');
        if (this.hudInput) {
            this.hudInput.value = '';
            this.renderHudShortcuts('');
            setTimeout(() => this.hudInput.focus(), 50);
        }
    }

    close() {
        if (!this.hudModal) return;
        soundFx.play('click');
        this.hudModal.classList.add('hidden');
    }

    renderHudShortcuts(query) {
        if (!this.hudResults) return;
        const q = query.toLowerCase().trim();
        const list = state.shortcuts.filter((s) => {
            if (!q) return true;
            const tags = normalizeTags(s.tags).join(' ');
            return (s.title || '').toLowerCase().includes(q) || tags.includes(q);
        }).slice(0, 8);

        this.hudResults.innerHTML = list.map((s) => {
            const href = safeHttpUrl(s.url) || '#';
            return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="hud-item-chip">
                <img src="${escapeHtml(s.icon || '')}" alt="${escapeHtml(s.title)}" class="hud-item-icon">
                <span>${escapeHtml(s.title)}</span>
            </a>`;
        }).join('');
        this.hudResults.querySelectorAll('img').forEach((img, i) => {
            img.addEventListener('error', () => { img.src = 'favicon.ico'; }, { once: true });
            if (list[i]) img.alt = list[i].title || '';
        });
    }

    bindEvents() {
        if (this.hudCloseBtn) this.hudCloseBtn.addEventListener('click', () => this.close());
        if (this.hudModal) {
            this.hudModal.addEventListener('click', (e) => {
                if (e.target === this.hudModal) this.close();
            });
        }
        if (this.hudInput) {
            this.hudInput.addEventListener('input', () => {
                this.renderHudShortcuts(this.hudInput.value);
            });
            this.hudInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.close();
            });
        }

        // Global hotkey: Alt + Space or Ctrl + Space opens Mini HUD
        window.addEventListener('keydown', (e) => {
            if ((e.altKey && e.code === 'Space') || (e.ctrlKey && e.code === 'Space')) {
                e.preventDefault();
                this.hudModal && !this.hudModal.classList.contains('hidden') ? this.close() : this.open();
            }
        });
    }
}

export const auroraCanvas = new AuroraCanvasEngine();
export const miniHud = new MiniHudManager();
