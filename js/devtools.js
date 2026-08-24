// js/devtools.js - Built-in DevTools Omnibox Engine & QR Code Visualizer

import { soundFx } from './audio.js';
import { escapeHtml } from './state.js';

export class DevToolsEngine {
    constructor() {
        this.qrModal = document.getElementById('qr-modal');
        this.qrCanvas = document.getElementById('qr-canvas');
        this.qrTextDisplay = document.getElementById('qr-text-display');
        this.qrDownloadBtn = document.getElementById('qr-download-btn');
        this.qrCopyBtn = document.getElementById('qr-copy-btn');
        this.qrCloseBtn = document.getElementById('close-qr-modal');
    }

    init() {
        if (this.qrCloseBtn) this.qrCloseBtn.addEventListener('click', () => this.closeQRModal());
        if (this.qrModal) {
            this.qrModal.addEventListener('click', (e) => {
                if (e.target === this.qrModal) this.closeQRModal();
            });
        }
        if (this.qrDownloadBtn) this.qrDownloadBtn.addEventListener('click', () => this.downloadQR());
        if (this.qrCopyBtn) this.qrCopyBtn.addEventListener('click', () => this.copyQRToClipboard());
    }

    generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    encodeBase64(str) {
        try { return btoa(unescape(encodeURIComponent(str))); } catch (e) { return 'Error Base64'; }
    }

    decodeBase64(str) {
        try { return decodeURIComponent(escape(atob(str))); } catch (e) { return 'Error: Base64 no válida'; }
    }

    parseColor(input) {
        const str = input.trim();
        const testEl = document.createElement('div');
        testEl.style.color = str;
        if (!testEl.style.color) return null;

        document.body.appendChild(testEl);
        const computed = window.getComputedStyle(testEl).color;
        document.body.removeChild(testEl);

        const rgbMatch = computed.match(/\d+/g);
        if (!rgbMatch || rgbMatch.length < 3) return null;

        const r = parseInt(rgbMatch[0], 10), g = parseInt(rgbMatch[1], 10), b = parseInt(rgbMatch[2], 10);
        const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        
        const rN = r / 255, gN = g / 255, bN = b / 255;
        const max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case rN: h = (gN - bN) / d + (gN < bN ? 6 : 0); break;
                case gN: h = (bN - rN) / d + 2; break;
                case bN: h = (rN - gN) / d + 4; break;
            }
            h /= 6;
        }

        const hsl = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
        return { hex, rgb: `rgb(${r}, ${g}, ${b})`, hsl };
    }

    parseEpoch(input) {
        const val = input.trim().toLowerCase();
        let date = new Date();

        if (val && val !== 'now') {
            const num = parseInt(val, 10);
            if (!isNaN(num)) {
                date = num < 10000000000 ? new Date(num * 1000) : new Date(num);
            } else {
                date = new Date(val);
            }
        }
        if (isNaN(date.getTime())) return null;

        return {
            epochSec: Math.floor(date.getTime() / 1000),
            iso: date.toISOString(),
            local: date.toLocaleString()
        };
    }

    renderBanner(query, bannerEl) {
        if (!bannerEl) return false;

        if (query.startsWith('!uuid')) {
            const uuid = this.generateUUID();
            bannerEl.innerHTML = `<div class="devtool-result-row"><span>🔑 <strong>UUIDv4:</strong></span> <code class="devtool-code">${uuid}</code> <button class="devtool-copy-btn" data-copy="${uuid}">📋 Copiar</button></div>`;
            this.bindCopyBtns(bannerEl);
            return true;
        }
        if (query.startsWith('!b64d ')) {
            const decoded = this.decodeBase64(query.slice(6).trim());
            bannerEl.innerHTML = `<div class="devtool-result-row"><span>🔓 <strong>Base64 Decoded:</strong></span> <code class="devtool-code">${escapeHtml(decoded)}</code> <button class="devtool-copy-btn" data-copy="${escapeHtml(decoded)}">📋 Copiar</button></div>`;
            this.bindCopyBtns(bannerEl);
            return true;
        }
        if (query.startsWith('!b64 ')) {
            const encoded = this.encodeBase64(query.slice(5).trim());
            bannerEl.innerHTML = `<div class="devtool-result-row"><span>🔒 <strong>Base64 Encoded:</strong></span> <code class="devtool-code">${encoded}</code> <button class="devtool-copy-btn" data-copy="${encoded}">📋 Copiar</button></div>`;
            this.bindCopyBtns(bannerEl);
            return true;
        }
        if (query.startsWith('!color ')) {
            const color = this.parseColor(query.slice(7).trim());
            if (color) {
                bannerEl.innerHTML = `<div class="devtool-result-row"><span class="color-preview-chip" style="background: ${color.hex}"></span> <span><strong>${color.hex}</strong> | ${color.rgb} | ${color.hsl}</span> <button class="devtool-copy-btn" data-copy="${color.hex}">📋 Copiar</button></div>`;
            } else {
                bannerEl.innerHTML = `<span>🎨 <em>Color no reconocido (ej: !color #00f2fe, rgb(0,242,254), cyan)</em></span>`;
            }
            this.bindCopyBtns(bannerEl);
            return true;
        }
        if (query.startsWith('!epoch') || query.startsWith('!time')) {
            const tInfo = this.parseEpoch(query.replace(/^!(epoch|time)\s*/, ''));
            if (tInfo) {
                bannerEl.innerHTML = `<div class="devtool-result-row"><span>⏰ <strong>Fecha:</strong> ${tInfo.local}</span> <span>(UNIX: <code>${tInfo.epochSec}</code>)</span> <button class="devtool-copy-btn" data-copy="${tInfo.epochSec}">📋 Copiar</button></div>`;
                this.bindCopyBtns(bannerEl);
                return true;
            }
        }
        if (query.startsWith('!qr ')) {
            const text = query.slice(4).trim();
            bannerEl.innerHTML = `<div class="devtool-result-row"><span>📱 <strong>Código QR para:</strong> <em>${escapeHtml(text)}</em></span> <button class="devtool-action-btn" id="open-qr-trigger">⚡ Abrir QR</button></div>`;
            const trigger = document.getElementById('open-qr-trigger');
            if (trigger) trigger.onclick = () => this.openQRModal(text);
            return true;
        }
        return false;
    }

    bindCopyBtns(container) {
        container.querySelectorAll('.devtool-copy-btn').forEach(btn => {
            btn.onclick = () => {
                const text = btn.getAttribute('data-copy');
                if (text && navigator.clipboard) {
                    navigator.clipboard.writeText(text);
                    soundFx.play('click');
                    const original = btn.textContent;
                    btn.textContent = '✓ Copiado';
                    setTimeout(() => { btn.textContent = original; }, 1800);
                }
            };
        });
    }

    openQRModal(text) {
        if (!text) return;
        soundFx.play('click');
        if (this.qrTextDisplay) this.qrTextDisplay.textContent = text;
        this.renderQR(text);
        if (this.qrModal) this.qrModal.classList.remove('hidden');
    }

    closeQRModal() {
        soundFx.play('click');
        if (this.qrModal) this.qrModal.classList.add('hidden');
    }

    renderQR(text) {
        if (!this.qrCanvas) return;
        const ctx = this.qrCanvas.getContext('2d');
        const size = 256;
        this.qrCanvas.width = size;
        this.qrCanvas.height = size;

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => ctx.drawImage(img, 0, 0, size, size);
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=0a0f1d&color=00f2fe&margin=10`;
    }

    downloadQR() {
        if (!this.qrCanvas) return;
        soundFx.play('click');
        const link = document.createElement('a');
        link.download = 'hades-qr-code.png';
        link.href = this.qrCanvas.toDataURL('image/png');
        link.click();
    }

    async copyQRToClipboard() {
        if (!this.qrCanvas) return;
        soundFx.play('click');
        try {
            this.qrCanvas.toBlob(async (blob) => {
                if (blob && navigator.clipboard && navigator.clipboard.write) {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    if (this.qrCopyBtn) {
                        const original = this.qrCopyBtn.textContent;
                        this.qrCopyBtn.textContent = '✓ ¡Copiado!';
                        setTimeout(() => { this.qrCopyBtn.textContent = original; }, 2000);
                    }
                }
            });
        } catch (e) {}
    }
}

export const devTools = new DevToolsEngine();
