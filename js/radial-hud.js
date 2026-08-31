// js/radial-hud.js - Radial HUD Action Wheel (360° Gestural Quick Access)

import { state, escapeHtml, bindIconFallback, faviconForUrl, openSafeUrl } from './state.js';
import { soundFx } from './audio.js';
import { ambientAudio } from './ambient-audio.js';
import { i18nDictionaries } from './i18n.js';
import { personalAnalytics } from './personal-analytics.js';

export class RadialHUDEngine {
    constructor() {
        this.hudOverlay = document.getElementById('radial-hud-overlay');
        this.hudWheel = document.getElementById('radial-hud-wheel');
        this.centerBadge = document.getElementById('radial-hud-center');
        this.isOpen = false;
        this.cursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.previousActiveElement = null;
        this.actions = [
            { id: 'favs', icon: 'iconos/favorito.webp', labelKey: 'favs', action: () => this.toggleFavsSubOrbit() },
            { id: 'audio', icon: 'iconos/audio.webp', labelKey: 'audio', action: () => ambientAudio.toggle() },
            { id: 'pomodoro', icon: 'iconos/pomodoro.webp', labelKey: 'pomodoro', action: () => document.getElementById('pomodoro-start-btn')?.click() },
            { id: 'postit', icon: 'iconos/postit.webp', labelKey: 'postit', action: () => this.createPostitUnderCursor() },
            { id: 'theme', icon: 'iconos/temas.webp', labelKey: 'theme', action: () => state.setTheme(state.theme === 'cyber' ? 'light' : (state.theme === 'light' ? 'nebula' : 'cyber')) },
            { id: 'qr', icon: 'iconos/qr.webp', labelKey: 'qr', action: () => this.openQRQuick() },
            { id: 'search', icon: 'iconos/buscar.webp', labelKey: 'search', action: () => this.focusOmnibox() },
            { id: 'settings', icon: 'iconos/settings.webp', labelKey: 'settings', action: () => document.getElementById('settings-btn')?.click() }
        ];
    }

    init() {
        this.renderRadialNodes();
        this.bindEvents();
    }

    renderRadialNodes() {
        if (!this.hudWheel) return;
        this.hudWheel.innerHTML = '';
        const radius = 160, total = this.actions.length;
        const t = (i18nDictionaries[state.language] || i18nDictionaries.en)?.radial_hud || {};

        this.actions.forEach((act, idx) => {
            const angle = (idx * (360 / total) - 90) * (Math.PI / 180);
            const x = Math.round(radius * Math.cos(angle)), y = Math.round(radius * Math.sin(angle));
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `radial-node-btn radial-node-${act.id}`;
            btn.setAttribute('tabindex', '0');
            btn.setAttribute('role', 'button');
            btn.setAttribute('aria-label', t[act.labelKey] || act.id);
            btn.setAttribute('data-action', act.id);
            btn.setAttribute('title', t[act.labelKey] || act.id);
            btn.style.setProperty('--node-x', `${x}px`);
            btn.style.setProperty('--node-y', `${y}px`);
            // Mismo lenguaje visual que los iconos de categorías: cristal compartido
            // (.icon-img-wrapper) + destello especular al hover (.icon-glint).
            btn.innerHTML = `<span class="icon-img-wrapper radial-node-icon"><span class="icon-glint" aria-hidden="true"></span><img src="${escapeHtml(act.icon)}" alt="" width="60" height="60" loading="eager"></span><span class="radial-node-label">${t[act.labelKey] || act.id}</span>`;

            if (act.id === 'favs') this.renderFavoritesSubOrbit(btn);

            btn.addEventListener('click', (e) => {
                if (e.target.closest('.radial-sub-fav-item')) return;
                e.stopPropagation();
                soundFx.play('click');
                act.action();
                if (act.id !== 'favs') this.close();
            });

            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
            this.hudWheel.appendChild(btn);
        });
    }

    /** Cuerda útil de la burbuja en la vertical exacta donde está la etiqueta. */
    nodeChord(btn, label) {
        const b = btn.getBoundingClientRect();
        const l = label.getBoundingClientRect();
        const d = (l.top + l.height / 2) - (b.top + b.height / 2);
        const R = b.width / 2 - 2; // borde de 2px
        return 2 * Math.sqrt(Math.max(R * R - d * d, 0));
    }

    /** Ajusta cada etiqueta al diámetro de su burbuja, midiendo con la fuente
        real (Outfit): si aún está cargando, espera a document.fonts.ready
        (la fuente fallback distorsiona el ancho ~25 %). Adaptativo por locale:
        solo las más largas reducen, y solo lo justo. Si alguna no entra ni en
        el mínimo, el ellipsis de CSS actúa de red de seguridad. */
    fitNodeLabels() {
        if (!this.hudWheel) return;
        const MIN_PX = 8, STEP = 0.25;
        const fit = () => {
            this.hudWheel.querySelectorAll('.radial-node-btn').forEach(btn => {
                const label = btn.querySelector('.radial-node-label');
                if (!label) return;
                label.style.fontSize = ''; // resetea ajustes previos y remide
                let size = parseFloat(getComputedStyle(label).fontSize);
                if (!Number.isFinite(size) || size <= 0) return;
                let guard = 0;
                while (label.scrollWidth > this.nodeChord(btn, label) + 0.5) {
                    if (size <= MIN_PX || guard++ > 32) break;
                    size = Math.max(MIN_PX, size - STEP);
                    label.style.fontSize = `${size}px`;
                }
            });
        };
        if (document.fonts && document.fonts.status !== 'loaded') {
            document.fonts.ready.then(() => { if (this.isOpen) fit(); });
            return;
        }
        fit();
    }

    getMostUsedShortcuts() {
        const stats = (personalAnalytics && personalAnalytics.data && personalAnalytics.data.shortcutCounts) || {};
        const all = [...(state.shortcuts || [])];
        all.sort((a, b) => (stats[b.id] || 0) - (stats[a.id] || 0));

        if (Object.values(stats).some(v => v > 0)) return all.slice(0, 3);

        const popular = ['google', 'youtube', 'chatgpt', 'github', 'claude'];
        const top3 = [];
        popular.forEach(id => {
            if (top3.length < 3) {
                const found = all.find(s => s.id === id || s.title.toLowerCase().includes(id));
                if (found && !top3.includes(found)) top3.push(found);
            }
        });
        while (top3.length < 3 && all.length > top3.length) {
            const next = all.find(s => !top3.includes(s));
            if (next) top3.push(next);
        }
        return top3.slice(0, 3);
    }

    renderFavoritesSubOrbit(parentBtn) {
        const subContainer = document.createElement('div');
        subContainer.className = 'radial-sub-favs';
        const top3 = this.getMostUsedShortcuts();
        // 3 sub-favoritos en arco sobre FAVORITOS, más cerca del nodo que antes.
        // IMPORTANTE: los sub-items son hijos del nodo, y el nodo está en
        // scale(1.18) en hover (= justo cuando el sub-menú se ve). Eso infla por 1.18
        // tanto el tamaño como estos offsets. Por tanto trabajo en el espacio LOCAL
        // del nodo (radio 50, item 28) y el gap visual = 1.18 * gap_local:
        //   centro (0,-88):  gap local 10 -> visual ~12px
        //   lados (±64,-66): gap local ~14 -> visual ~16px
        //   centro-lado:     gap local ~12 -> visual ~14px  (sin solapes, arco que bulge arriba)
        const offsets = [{ x: -64, y: -66 }, { x: 0, y: -88 }, { x: 64, y: -66 }];

        top3.forEach((sc, i) => {
            const pos = offsets[i] || { x: 0, y: -88 };
            const subBtn = document.createElement('button');
            subBtn.className = 'radial-sub-fav-item';
            subBtn.title = sc.title || 'Favorito';
            subBtn.style.setProperty('--sub-x', `${pos.x}px`);
            subBtn.style.setProperty('--sub-y', `${pos.y}px`);
            const img = document.createElement('img');
            img.className = 'radial-sub-icon-img';
            img.alt = sc.title || '';
            img.src = sc.icon || faviconForUrl(sc.url);
            bindIconFallback(img, sc);
            const tip = document.createElement('span');
            tip.className = 'radial-sub-fav-tooltip';
            tip.textContent = sc.title || '';
            subBtn.appendChild(img);
            subBtn.appendChild(tip);
            subBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                soundFx.play('click');
                openSafeUrl(sc.url, '_blank');
                this.close();
            });
            subContainer.appendChild(subBtn);
        });
        parentBtn.appendChild(subContainer);
    }

    open(x, y) {
        soundFx.play('click');
        this.isOpen = true;
        this.cursorPos = { x, y };
        this.previousActiveElement = document.activeElement;
        const pad = 150;
        const clampedX = Math.max(pad, Math.min(window.innerWidth - pad, x));
        const clampedY = Math.max(pad, Math.min(window.innerHeight - pad, y));

        if (this.hudWheel) {
            this.hudWheel.style.left = `${clampedX}px`;
            this.hudWheel.style.top = `${clampedY}px`;
        }
        if (this.hudOverlay) {
            this.hudOverlay.classList.remove('hidden');
            this.hudOverlay.setAttribute('aria-hidden', 'false');
        }
        // El overlay está en display:none hasta aquí: solo ahora las etiquetas
        // son medibles y se ajustan al diámetro de su burbuja (por locale).
        requestAnimationFrame(() => this.fitNodeLabels());
        setTimeout(() => {
            const firstBtn = this.hudWheel ? this.hudWheel.querySelector('.radial-node-btn, button') : null;
            if (firstBtn) firstBtn.focus();
        }, 50);
    }

    close() {
        if (!this.isOpen) return;
        soundFx.play('click');
        this.isOpen = false;
        if (this.hudOverlay) {
            this.hudOverlay.classList.add('hidden');
            this.hudOverlay.setAttribute('aria-hidden', 'true');
        }
        if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
            this.previousActiveElement.focus();
        }
    }

    toggle(x, y) {
        this.isOpen ? this.close() : this.open(x, y);
    }

    toggleFavsSubOrbit() {
        const sub = this.hudWheel ? this.hudWheel.querySelector('.radial-sub-favs') : null;
        if (sub) {
            soundFx.play('hover');
            sub.classList.toggle('force-visible');
        }
    }

    createPostitUnderCursor() {
        const input = document.getElementById('scratchpad-input');
        const text = input ? input.value.trim() || 'Nota Rápida' : 'Nota Rápida';
        window.dispatchEvent(new CustomEvent('postit:create', { detail: { text, x: this.cursorPos.x, y: this.cursorPos.y } }));
    }

    openQRQuick() {
        const omnibox = document.getElementById('main-search') || document.getElementById('search-input');
        if (omnibox) {
            omnibox.value = '!qr ';
            omnibox.focus();
            omnibox.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    focusOmnibox() {
        const omnibox = document.getElementById('main-search') || document.getElementById('search-input');
        if (omnibox) {
            omnibox.focus();
            omnibox.select();
        }
    }

    bindEvents() {
        document.addEventListener('auxclick', (e) => {
            if (e.button === 1 && !e.target.closest('input, textarea, select, button, a')) {
                e.preventDefault();
                this.toggle(e.clientX, e.clientY);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.altKey && (e.key === 'c' || e.key === 'C' || e.key === 'w' || e.key === 'W')) {
                // Guardia: no capturar si el usuario está escribiendo en un campo
                const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
                const isEditing = activeTag === 'input' || activeTag === 'textarea' || (document.activeElement && document.activeElement.isContentEditable);
                if (isEditing) return;

                e.preventDefault();
                this.toggle(window.innerWidth / 2, window.innerHeight / 2);
                return;
            }
            if (this.isOpen) {
                if (e.key === 'Escape') {
                    this.close();
                    return;
                }
                if (e.key === 'Tab') {
                    const focusables = Array.from(this.hudWheel ? this.hudWheel.querySelectorAll('.radial-node-btn, .radial-sub-fav-item, button:not([disabled]), [tabindex="0"]') : []);
                    if (focusables.length > 0) {
                        const first = focusables[0], last = focusables[focusables.length - 1];
                        const activeEl = document.activeElement;
                        if (!focusables.includes(activeEl)) {
                            e.preventDefault();
                            (e.shiftKey ? last : first).focus();
                        } else if (e.shiftKey && activeEl === first) {
                            e.preventDefault();
                            last.focus();
                        } else if (!e.shiftKey && activeEl === last) {
                            e.preventDefault();
                            first.focus();
                        }
                    }
                }
            }
        });

        if (this.hudOverlay) {
            this.hudOverlay.addEventListener('click', (e) => {
                if (e.target === this.hudOverlay || e.target === this.centerBadge) this.close();
            });
        }

        state.on('language:changed', () => this.renderRadialNodes());
        state.on('shortcuts:changed', () => this.renderRadialNodes());
    }
}

export const radialHUD = new RadialHUDEngine();
