// js/render.js - Dynamic Bento Grid & Shortcut Card Renderer

import { state, escapeHtml } from './state.js';
import { i18nDictionaries } from './i18n.js';
import { soundFx } from './audio.js';

export class DashboardRenderer {
    constructor() {
        this.gridContainer = document.getElementById('zone-grid') || document.getElementById('shortcuts-grid');
        this.smartTooltip = document.getElementById('smart-tooltip');
        this.tooltipTitle = document.getElementById('tooltip-title');
        this.tooltipDomain = document.getElementById('tooltip-domain');
        this.tooltipDesc = document.getElementById('tooltip-desc');

    }

    playSound(audio) {
        if (!state.soundEnabled) return;
        try {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        } catch (e) {}
    }

    render() {
        if (!this.gridContainer) return;
        this.gridContainer.innerHTML = '';
        const t = i18nDictionaries[state.language] || i18nDictionaries.es;

        state.categories.forEach(cat => {
            const shortcutsInCat = state.shortcuts.filter(s => s.category === cat.id);
            const section = document.createElement('section');
            const isFeatured = shortcutsInCat.length > 6 || cat.featured;
            section.className = `categoria ${isFeatured ? 'categoria-featured' : ''}`;
            section.setAttribute('data-group', cat.group);
            section.setAttribute('data-cat-id', cat.id);
            section.setAttribute('data-tile-id', `tile-${cat.id}`);

            // Drag handle for Edit Mode
            const dragHandle = '';
            const catTitle = t.categories[cat.id] || cat.defaultTitle;
            const badgeText = `${shortcutsInCat.length} ${t.badges.apps}`;

            section.innerHTML = `
                <div class="categoria-header">
                    ${dragHandle}
                    <div class="cat-tag-indicator ${cat.color}"></div>
                    <h2 data-cat-key="${cat.id}">${escapeHtml(catTitle)}</h2>
                    <span class="cat-badge">${badgeText}</span>
                </div>
                <div class="iconos-grupo" data-cat-id="${cat.id}"></div>
            `;

            const grid = section.querySelector('.iconos-grupo');

            shortcutsInCat.forEach(shortcut => {
                const card = document.createElement('a');
                card.href = shortcut.url;
                card.target = '_blank';
                card.rel = 'noopener noreferrer';
                card.className = 'enlace-icono';
                card.setAttribute('data-id', shortcut.id);
                card.setAttribute('data-title', shortcut.title);
                card.setAttribute('data-app-key', shortcut.id);
                card.setAttribute('data-tags', shortcut.tags || '');

                const desc = t.shortcuts[shortcut.id] || shortcut.desc || '';
                card.setAttribute('data-desc', desc);

                // Edit / Delete buttons in edit mode
                const editButtons = state.editMode ? `
                    <div class="card-edit-actions">
                        <button class="card-action-btn edit-btn" data-action="edit" data-id="${shortcut.id}" title="Editar">✏️</button>
                        <button class="card-action-btn delete-btn" data-action="delete" data-id="${shortcut.id}" title="Eliminar">🗑️</button>
                    </div>
                ` : '';

                card.innerHTML = `
                    ${editButtons}
                    <div class="icon-img-wrapper">
                        <img src="${shortcut.icon}" alt="${escapeHtml(shortcut.title)}" width="60" height="60" loading="lazy">
                    </div>
                    <span class="icon-title">${escapeHtml(shortcut.title)}</span>
                `;

                this.bindCardInteractions(card, shortcut);
                grid.appendChild(card);
            });

            this.gridContainer.appendChild(section);
        });

        this.initSpotlight();
        state.emit('dashboard:rendered');
    }

    bindCardInteractions(card, shortcut) {
        card.addEventListener('mouseenter', (e) => {
            soundFx.play('hover');
            if (!state.editMode) this.showTooltip(card, shortcut);
        });

        card.addEventListener('mouseleave', () => this.hideTooltip());
        card.addEventListener('click', (e) => {
            if (state.editMode) {
                e.preventDefault();
                return;
            }
            soundFx.play('click');
        });

        // Edit Mode Actions
        const editBtn = card.querySelector('.edit-btn');
        const deleteBtn = card.querySelector('.delete-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('shortcut:edit', { detail: shortcut }));
            });
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('shortcut:delete', { detail: shortcut }));
            });
        }
    }

    showTooltip(card, shortcut) {
        if (!this.smartTooltip) return;
        const t = i18nDictionaries[state.language] || i18nDictionaries.es;
        const desc = t.shortcuts[shortcut.id] || shortcut.desc || card.getAttribute('data-desc') || '';
        let domain = '';
        try { domain = new URL(shortcut.url).hostname.replace('www.', ''); } catch (e) {}

        if (this.tooltipTitle) this.tooltipTitle.textContent = shortcut.title;
        if (this.tooltipDomain) this.tooltipDomain.textContent = domain;
        if (this.tooltipDesc) this.tooltipDesc.textContent = desc;

        const rect = card.getBoundingClientRect();
        const tipWidth = 260;
        let left = rect.left + rect.width / 2 - tipWidth / 2;
        let top = rect.top - 100;

        if (left < 10) left = 10;
        if (left + tipWidth > window.innerWidth - 10) left = window.innerWidth - tipWidth - 10;
        if (top < 10) top = rect.bottom + 12;

        this.smartTooltip.style.left = `${left}px`;
        this.smartTooltip.style.top = `${top}px`;
        this.smartTooltip.classList.remove('hidden');
        this.smartTooltip.classList.add('visible');
        this.smartTooltip.setAttribute('aria-hidden', 'false');
    }

    hideTooltip() {
        if (this.smartTooltip) {
            this.smartTooltip.classList.remove('visible');
            this.smartTooltip.classList.add('hidden');
            this.smartTooltip.setAttribute('aria-hidden', 'true');
        }
    }

    initSpotlight() {
        const cards = document.querySelectorAll('.enlace-icono, .categoria, .nav-widget, .search-container');
        cards.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                el.style.setProperty('--mouse-x', `${x}px`);
                el.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    }
}

