// js/devtools.js - Built-in DevTools Omnibox Engine & QR Code Visualizer

import { soundFx } from './audio.js';
import { escapeHtml } from './state.js';
import { renderQrToCanvas } from './qrcode.js';

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
        const str = (input || '').trim();
        if (!str) return null;
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.fillStyle = '#010203';
            ctx.fillStyle = str;
            if (ctx.fillStyle === '#010203' && str.toLowerCase() !== '#010203') return null;

            ctx.fillRect(0, 0, 1, 1);
            const data = ctx.getImageData(0, 0, 1, 1).data;
            const r = data[0], g = data[1], b = data[2];
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
        } catch (e) {
            return null;
        }
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

        if (/^!uuid(\s|$)/i.test(query)) {
            const uuid = this.generateUUID();
            bannerEl.innerHTML = `<div class="devtool-result-row"><span>🔑 <strong>UUIDv4:</strong></span> <code class="devtool-code">${uuid}</code> <button class="devtool-copy-btn" data-copy="${uuid}">📋 Copiar</button></div>`;
            this.bindCopyBtns(bannerEl);
            return true;
        }
        if (/^!b64d\s+/i.test(query)) {
            const decoded = this.decodeBase64(query.replace(/^!b64d\s+/i, '').trim());
            bannerEl.innerHTML = `<div class="devtool-result-row"><span>🔓 <strong>Base64 Decoded:</strong></span> <code class="devtool-code">${escapeHtml(decoded)}</code> <button class="devtool-copy-btn" data-copy="${escapeHtml(decoded)}">📋 Copiar</button></div>`;
            this.bindCopyBtns(bannerEl);
            return true;
        }
        if (/^!b64\s+/i.test(query)) {
            const encoded = this.encodeBase64(query.replace(/^!b64\s+/i, '').trim());
            bannerEl.innerHTML = `<div class="devtool-result-row"><span>🔒 <strong>Base64 Encoded:</strong></span> <code class="devtool-code">${encoded}</code> <button class="devtool-copy-btn" data-copy="${encoded}">📋 Copiar</button></div>`;
            this.bindCopyBtns(bannerEl);
            return true;
        }
        if (/^!color\s+/i.test(query)) {
            const color = this.parseColor(query.replace(/^!color\s+/i, '').trim());
            if (color) {
                bannerEl.innerHTML = `<div class="devtool-result-row"><span class="color-preview-chip" style="background: ${color.hex}"></span> <span><strong>${color.hex}</strong> | ${color.rgb} | ${color.hsl}</span> <button class="devtool-copy-btn" data-copy="${color.hex}">📋 Copiar</button></div>`;
            } else {
                bannerEl.innerHTML = `<span>🎨 <em>Color no reconocido (ej: !color #00f2fe, rgb(0,242,254), cyan)</em></span>`;
            }
            this.bindCopyBtns(bannerEl);
            return true;
        }
        if (/^!(epoch|time)(\s|$)/i.test(query)) {
            const tInfo = this.parseEpoch(query.replace(/^!(epoch|time)\s*/i, ''));
            if (tInfo) {
                bannerEl.innerHTML = `<div class="devtool-result-row"><span>⏰ <strong>Fecha:</strong> ${tInfo.local}</span> <span>(UNIX: <code>${tInfo.epochSec}</code>)</span> <button class="devtool-copy-btn" data-copy="${tInfo.epochSec}">📋 Copiar</button></div>`;
                this.bindCopyBtns(bannerEl);
                return true;
            }
        }
        if (/^!qr\s+/i.test(query)) {
            const text = query.replace(/^!qr\s+/i, '').trim();
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
                    navigator.clipboard.writeText(text).catch(() => {});
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
        // Real, spec-compliant QR (ISO/IEC 18004), rendered 100% locally.
        // We target ~256 px, ECC level M, quiet zone = 4 modules (spec-required).
        try {
            renderQrToCanvas(text || '', this.qrCanvas, {
                size: 400,
                quietZone: 4,
                darkColor: '#00f2fe',
                lightColor: '#0a0f1d',
                ecl: 'M',
            });
        } catch (err) {
            // Fallback: if the input is too long for even v40 with ECC boost,
            // paint a solid background + short error message so it's visually obvious.
            const ctx = this.qrCanvas.getContext('2d');
            this.qrCanvas.width = 256;
            this.qrCanvas.height = 256;
            ctx.fillStyle = '#0a0f1d';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '14px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Texto demasiado largo para QR', 128, 120);
            ctx.fillStyle = '#8892a6';
            ctx.font = '11px system-ui, sans-serif';
            ctx.fillText(String(err && err.message || err), 128, 142);
        }
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
