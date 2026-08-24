// js/theme-studio.js - Custom Dynamic Color Theme Studio

import { state } from './state.js';

export class ThemeStudio {
    constructor() {
        this.primaryInput = document.getElementById('custom-theme-primary');
        this.secondaryInput = document.getElementById('custom-theme-secondary');
        this.resetBtn = document.getElementById('reset-theme-colors-btn');
        this.savedColors = this.loadSavedColors();
    }

    init() {
        if (this.savedColors) {
            this.applyCustomColors(this.savedColors.primary, this.savedColors.secondary);
            if (this.primaryInput) this.primaryInput.value = this.savedColors.primary;
            if (this.secondaryInput) this.secondaryInput.value = this.savedColors.secondary;
        }

        if (this.primaryInput) {
            this.primaryInput.addEventListener('input', () => this.handleColorChange());
        }
        if (this.secondaryInput) {
            this.secondaryInput.addEventListener('input', () => this.handleColorChange());
        }
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetCustomColors());
        }
    }

    loadSavedColors() {
        try {
            const raw = localStorage.getItem('custom_theme_colors');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    }

    handleColorChange() {
        const primary = this.primaryInput ? this.primaryInput.value : '#00f2fe';
        const secondary = this.secondaryInput ? this.secondaryInput.value : '#4facfe';
        this.applyCustomColors(primary, secondary);
        localStorage.setItem('custom_theme_colors', JSON.stringify({ primary, secondary }));
    }

    applyCustomColors(primary, secondary) {
        const root = document.documentElement;
        root.style.setProperty('--accent-primary', primary);
        root.style.setProperty('--accent-secondary', secondary);
        root.style.setProperty('--accent-glow', `${primary}4d`);
        root.style.setProperty('--card-spotlight', `${primary}1a`);
        root.style.setProperty('--card-border-hover', `${primary}66`);
        root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`);
    }

    resetCustomColors() {
        localStorage.removeItem('custom_theme_colors');
        const root = document.documentElement;
        root.style.removeProperty('--accent-primary');
        root.style.removeProperty('--accent-secondary');
        root.style.removeProperty('--accent-glow');
        root.style.removeProperty('--card-spotlight');
        root.style.removeProperty('--card-border-hover');
        root.style.removeProperty('--accent-gradient');

        if (this.primaryInput) this.primaryInput.value = '#00f2fe';
        if (this.secondaryInput) this.secondaryInput.value = '#4facfe';
    }
}
