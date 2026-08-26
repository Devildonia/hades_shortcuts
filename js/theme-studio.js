// js/theme-studio.js - Custom Dynamic Color Theme & Dynamic Background Studio

import { soundFx } from './audio.js';

export const UNSPLASH_PRESETS = {
    cyberpunk: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80',
    space: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
    nature: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    architecture: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80'
};

export class ThemeStudio {
    constructor() {
        this.primaryInput = document.getElementById('custom-theme-primary');
        this.secondaryInput = document.getElementById('custom-theme-secondary');
        this.resetBtn = document.getElementById('reset-theme-colors-btn');
        this.savedColors = this.loadSavedColors();

        this.bgConfig = this.loadBgConfig();
        this.bgLayer = document.getElementById('custom-bg-layer');
        this.dimOverlay = document.getElementById('custom-bg-dim-overlay');
        this.auroraCanvas = document.getElementById('aurora-bg-canvas') || document.getElementById('aurora-canvas');
    }

    loadSavedColors() {
        try {
            const raw = localStorage.getItem('custom_theme_colors');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    }

    loadBgConfig() {
        try {
            const raw = localStorage.getItem('hades_bg_config_v1');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {
            mode: 'aurora',
            gradient: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
            imageType: 'unsplash',
            unsplashTopic: 'cyberpunk',
            imageUrl: UNSPLASH_PRESETS.cyberpunk,
            blur: 0,
            dim: 20
        };
    }

    saveBgConfig() {
        try { localStorage.setItem('hades_bg_config_v1', JSON.stringify(this.bgConfig)); } catch (e) {}
        this.applyBackground();
    }

    init() {
        if (this.savedColors) {
            this.applyCustomColors(this.savedColors.primary, this.savedColors.secondary);
            if (this.primaryInput) this.primaryInput.value = this.savedColors.primary;
            if (this.secondaryInput) this.secondaryInput.value = this.savedColors.secondary;
        }

        if (this.primaryInput) this.primaryInput.addEventListener('input', () => this.handleColorChange());
        if (this.secondaryInput) this.secondaryInput.addEventListener('input', () => this.handleColorChange());
        if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.resetCustomColors());

        this.bindBgEvents();
        this.applyBackground();
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

    handleColorChange() {
        const primary = this.primaryInput ? this.primaryInput.value : '#00f2fe';
        const secondary = this.secondaryInput ? this.secondaryInput.value : '#4facfe';
        this.applyCustomColors(primary, secondary);
        localStorage.setItem('custom_theme_colors', JSON.stringify({ primary, secondary }));
    }

    resetCustomColors() {
        localStorage.removeItem('custom_theme_colors');
        const root = document.documentElement;
        ['--accent-primary', '--accent-secondary', '--accent-glow', '--card-spotlight', '--card-border-hover', '--accent-gradient'].forEach(p => root.style.removeProperty(p));
        if (this.primaryInput) this.primaryInput.value = '#00f2fe';
        if (this.secondaryInput) this.secondaryInput.value = '#4facfe';
    }

    applyBackground() {
        if (!this.bgLayer) return;
        const { mode, gradient, imageUrl, blur, dim } = this.bgConfig;

        if (this.auroraCanvas) {
            this.auroraCanvas.style.display = (mode === 'aurora') ? 'block' : 'none';
        }

        if (mode === 'aurora') {
            this.bgLayer.classList.remove('active');
            this.bgLayer.style.backgroundImage = 'none';
            if (this.dimOverlay) this.dimOverlay.style.opacity = '0';
        } else if (mode === 'gradient') {
            this.bgLayer.classList.add('active');
            this.bgLayer.style.backgroundImage = gradient;
            this.bgLayer.style.filter = 'none';
            if (this.dimOverlay) this.dimOverlay.style.opacity = '0';
        } else if (mode === 'image') {
            this.bgLayer.classList.add('active');
            this.bgLayer.style.backgroundImage = `url("${imageUrl || UNSPLASH_PRESETS.cyberpunk}")`;
            this.bgLayer.style.filter = `blur(${blur || 0}px)`;
            if (this.dimOverlay) this.dimOverlay.style.opacity = `${(dim || 20) / 100}`;
        }
    }

    bindBgEvents() {
        const chips = document.querySelectorAll('.bg-mode-chip');
        const gradPanel = document.getElementById('bg-panel-gradient');
        const imgPanel = document.getElementById('bg-panel-image');
        const topicSelect = document.getElementById('bg-unsplash-topic-select');
        const fileInput = document.getElementById('bg-file-upload-input');
        const urlInput = document.getElementById('bg-custom-url-input');
        const blurSlider = document.getElementById('bg-blur-slider');
        const dimSlider = document.getElementById('bg-dim-slider');
        const blurDisplay = document.getElementById('bg-blur-val-display');
        const dimDisplay = document.getElementById('bg-dim-val-display');

        const syncUI = () => {
            chips.forEach(c => c.classList.toggle('active', c.getAttribute('data-bg-mode') === this.bgConfig.mode));
            if (gradPanel) gradPanel.classList.toggle('hidden', this.bgConfig.mode !== 'gradient');
            if (imgPanel) imgPanel.classList.toggle('hidden', this.bgConfig.mode !== 'image');
            if (topicSelect) topicSelect.value = this.bgConfig.unsplashTopic || 'cyberpunk';
            if (urlInput) urlInput.value = this.bgConfig.imageUrl || '';
            if (blurSlider) blurSlider.value = this.bgConfig.blur || 0;
            if (dimSlider) dimSlider.value = this.bgConfig.dim || 20;
            if (blurDisplay) blurDisplay.textContent = `${this.bgConfig.blur || 0}px`;
            if (dimDisplay) dimDisplay.textContent = `${this.bgConfig.dim || 20}%`;
        };

        syncUI();

        chips.forEach(c => {
            c.addEventListener('click', () => {
                soundFx.play('click');
                this.bgConfig.mode = c.getAttribute('data-bg-mode');
                this.saveBgConfig();
                syncUI();
            });
        });

        document.querySelectorAll('.bg-grad-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                soundFx.play('click');
                this.bgConfig.gradient = btn.getAttribute('data-grad');
                this.saveBgConfig();
            });
        });

        if (topicSelect) {
            topicSelect.addEventListener('change', (e) => {
                this.bgConfig.unsplashTopic = e.target.value;
                this.bgConfig.imageUrl = UNSPLASH_PRESETS[e.target.value] || UNSPLASH_PRESETS.cyberpunk;
                this.saveBgConfig();
                syncUI();
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.bgConfig.imageUrl = event.target.result;
                        this.saveBgConfig();
                        syncUI();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (urlInput) {
            urlInput.addEventListener('change', (e) => {
                this.bgConfig.imageUrl = e.target.value.trim();
                this.saveBgConfig();
            });
        }

        if (blurSlider) {
            blurSlider.addEventListener('input', (e) => {
                this.bgConfig.blur = parseInt(e.target.value);
                if (blurDisplay) blurDisplay.textContent = `${e.target.value}px`;
                this.saveBgConfig();
            });
        }

        if (dimSlider) {
            dimSlider.addEventListener('input', (e) => {
                this.bgConfig.dim = parseInt(e.target.value);
                if (dimDisplay) dimDisplay.textContent = `${e.target.value}%`;
                this.saveBgConfig();
            });
        }
    }
}
