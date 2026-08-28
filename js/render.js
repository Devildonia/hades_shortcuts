import { tagsFilter } from './tags-filter.js';
import { personalAnalytics } from './personal-analytics.js';
import { state, escapeHtml, normalizeTags, safeHttpUrl, bindIconFallback } from './state.js';
import { i18nDictionaries } from './i18n.js';
import { soundFx } from './audio.js';
import { focusMode } from './focus-mode.js';

export class DashboardRenderer {
    constructor() {
        this.gridContainer = document.getElementById('zone-grid') || document.getElementById('shortcuts-grid');
        this.smartTooltip = document.getElementById('smart-tooltip');
        this.tooltipTitle = document.getElementById('tooltip-title');
        this.tooltipDomain = document.getElementById('tooltip-domain');
        this.tooltipDesc = document.getElementById('tooltip-desc');
        this.currentExpandedCategory = null;
        this._categoryPlaceholder = null;

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentExpandedCategory) {
                this.collapseCategory();
            }
        });
    }

    playSound(audio) {
        if (!state.soundEnabled) return;
        try {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        } catch (e) {}
    }

    expandCategory(section) {
        if (this.currentExpandedCategory) {
            this.collapseCategory();
        }

        let backdrop = document.getElementById('category-expand-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'category-expand-backdrop';
            backdrop.className = 'category-expand-backdrop';
            document.body.appendChild(backdrop);
            backdrop.addEventListener('click', () => this.collapseCategory());
        }

        // Placeholder in grid to maintain smooth grid flow without layout shifting
        const rect = section.getBoundingClientRect();
        const placeholder = document.createElement('div');
        placeholder.className = 'categoria-grid-placeholder';
        placeholder.style.width = `${rect.width}px`;
        placeholder.style.height = `${rect.height}px`;
        placeholder.style.gridColumn = window.getComputedStyle(section).gridColumn;
        placeholder.style.gridRow = window.getComputedStyle(section).gridRow;
        section.parentNode.insertBefore(placeholder, section);
        this._categoryPlaceholder = placeholder;

        this.currentExpandedCategory = section;
        backdrop.classList.add('active');
        section.classList.add('is-expanded');
        document.body.classList.add('category-expanded-active');
        soundFx.play('click');
    }

    collapseCategory() {
        if (!this.currentExpandedCategory) return;
        const section = this.currentExpandedCategory;
        const backdrop = document.getElementById('category-expand-backdrop');
        if (backdrop) backdrop.classList.remove('active');

        section.classList.remove('is-expanded');
        document.body.classList.remove('category-expanded-active');

        if (this._categoryPlaceholder && this._categoryPlaceholder.parentNode) {
            this._categoryPlaceholder.parentNode.removeChild(this._categoryPlaceholder);
            this._categoryPlaceholder = null;
        }

        this.currentExpandedCategory = null;
        soundFx.play('click');
    }

    render() {
        if (this.currentExpandedCategory) {
            this.collapseCategory();
        }
        if (!this.gridContainer) return;
        this.gridContainer.innerHTML = '';
        const t = i18nDictionaries[state.language] || i18nDictionaries.es;

        const spaces = window.spacesManager;
        state.categories.forEach(cat => {
            if (spaces && typeof spaces.allowsCategory === 'function' && !spaces.allowsCategory(cat.id)) return;
            const shortcutsInCat = state.shortcuts.filter(s => s.category === cat.id);
            if (!shortcutsInCat.length && !state.editMode) return;
            const section = document.createElement('section');
            const isFeatured = shortcutsInCat.length > 6 || cat.featured;
            section.className = `categoria ${isFeatured ? 'categoria-featured' : ''}`;
            section.setAttribute('data-group', cat.group);
            section.setAttribute('data-cat-id', cat.id);
            section.setAttribute('data-tile-id', `tile-${cat.id}`);

            // Click empty space in category to expand
            section.addEventListener('click', (e) => {
                if (state.editMode) return;
                if (e.target.closest('.enlace-icono') || e.target.closest('.card-action-btn') || e.target.closest('.shortcut-tag-chip')) {
                    return;
                }
                if (section.classList.contains('is-expanded')) {
                    return;
                }
                this.expandCategory(section);
            });

            // Drag handle for Edit Mode
            const dragHandle = '';
            const catTitle = t.categories[cat.id] || cat.defaultTitle;

            section.innerHTML = `
                <div class="categoria-header">
                    ${dragHandle}
                    <div class="cat-tag-indicator ${cat.color}"></div>
                    <h2 data-cat-key="${cat.id}">${escapeHtml(catTitle)}</h2>
                </div>
                <div class="iconos-grupo" data-cat-id="${cat.id}"></div>
            `;

            const grid = section.querySelector('.iconos-grupo');

            shortcutsInCat.forEach(shortcut => {
                const card = document.createElement('a');
                const href = safeHttpUrl(shortcut.url) || '#';
                card.href = href;
                card.target = '_blank';
                card.rel = 'noopener noreferrer';
                card.className = 'enlace-icono';
                card.addEventListener('click', (e) => {
                    if (focusMode && focusMode.isActive && focusMode.isUrlBlocked(href)) {
                        e.preventDefault();
                        focusMode.showZenShield(href);
                        return;
                    }
                    personalAnalytics.logLaunch(shortcut.id, shortcut.title);
                });
                card.setAttribute('data-id', shortcut.id);
                card.setAttribute('data-title', shortcut.title);
                card.setAttribute('data-app-key', shortcut.id);
                const tagList = normalizeTags(shortcut.tags);
                card.setAttribute('data-tags', tagList.join(', '));

                const desc = t.shortcuts[shortcut.id] || shortcut.desc || '';
                card.setAttribute('data-desc', desc);

                const editButtons = state.editMode ? `
                    <div class="card-edit-actions">
                        <button class="card-action-btn edit-btn" data-action="edit" data-id="${escapeHtml(shortcut.id)}" title="Editar">✏️</button>
                        <button class="card-action-btn delete-btn" data-action="delete" data-id="${escapeHtml(shortcut.id)}" title="Eliminar">🗑️</button>
                    </div>
                ` : '';

                const tagsHtml = tagList.length > 0
                    ? `<div class="shortcut-tags-row">${tagList.slice(0, 3).map(tag => `<span class="shortcut-tag-chip" style="--tag-color: ${escapeHtml(tagsFilter.getTagColor(tag))}">#${escapeHtml(tag)}</span>`).join('')}</div>`
                    : '';
                card.innerHTML = `
                    ${editButtons}
                    <div class="icon-img-wrapper">
                        <img src="${escapeHtml(shortcut.icon || '')}" alt="${escapeHtml(shortcut.title)}" width="60" height="60" loading="lazy">
                    </div>
                    <span class="icon-title">${escapeHtml(shortcut.title)}</span>
                    ${tagsHtml}
                `;
                bindIconFallback(card.querySelector('img'), shortcut);

                this.bindCardInteractions(card, shortcut);
                grid.appendChild(card);
            });

            this.gridContainer.appendChild(section);
        });

        this.initSpotlight();
        state.emit('dashboard:rendered');
    }

    bindCardInteractions(card, shortcut) {
        card.setAttribute('aria-describedby', 'smart-tooltip');

        card.addEventListener('mouseenter', () => {
            soundFx.play('hover');
            if (!state.editMode) this.showTooltip(card, shortcut);
        });
        card.addEventListener('mouseleave', () => this.hideTooltip());

        card.addEventListener('focus', () => {
            soundFx.play('hover');
            if (!state.editMode) this.showTooltip(card, shortcut);
        });
        card.addEventListener('blur', () => this.hideTooltip());

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
        if (this._spotlightBound) return;
        this._spotlightBound = true;
        document.addEventListener('pointermove', (e) => {
            const card = e.target.closest('.categoria, .mini-widget-card');
            if (!card) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
            const angle = Math.atan2(y - rect.height / 2, x - rect.width / 2) * (180 / Math.PI);
            if (card.classList.contains('mini-widget-card')) {
                card.style.setProperty('--gold-lx', `${x}px`);
                card.style.setProperty('--gold-ly', `${y}px`);
                card.style.setProperty('--gold-angle', `${angle}deg`);
            } else {
                card.style.setProperty('--chrome-lx', `${x}px`);
                card.style.setProperty('--chrome-ly', `${y}px`);
                card.style.setProperty('--chrome-angle', `${angle}deg`);
            }
        });
    }
}

