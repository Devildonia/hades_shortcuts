// js/theme-studio.js - Custom Dynamic Color Theme & Dynamic Background Studio

import { soundFx } from './audio.js';
import { persistJson, showToast } from './state.js';

export const UNSPLASH_PRESETS = {
    cyberpunk: [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1920&q=80'
    ],
    space: [
        'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=80'
    ],
    nature: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1920&q=80'
    ],
    architecture: [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1920&q=80'
    ]
};

export function sanitizeCssUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    const str = rawUrl.trim();
    if (/^https?:\/\//i.test(str)) {
        try {
            const parsed = new URL(str);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                return parsed.href.replace(/["'\\\(\)\s]/g, encodeURIComponent);
            }
        } catch (e) {}
    }
    if (/^data:image\/(png|jpeg|jpg|webp|avif|gif);base64,[A-Za-z0-9+/=]+$/i.test(str)) {
        return str;
    }
    return '';
}

export class ThemeStudio {
    constructor() {
        this.primaryInput = document.getElementById('custom-theme-primary');
        this.secondaryInput = document.getElementById('custom-theme-secondary');
        this.resetBtn = document.getElementById('reset-theme-colors-btn');
        this.savedColors = this.loadSavedColors();
        this.bgConfig = this.loadBgConfig();
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
        const saved = persistJson('hades_bg_config_v1', this.bgConfig);
        if (saved) {
            this.applyBackground();
        }
        return saved;
    }

    /**
     * Optimiza y comprime una imagen local mediante Canvas antes de guardarla en localStorage.
     * Escala a máximo 1920x1080 manteniendo relación de aspecto y exporta a WebP/JPEG optimizado (~100-350 KB).
     * @param {File} file
     * @returns {Promise<string>} Data URL optimizada
     */
    async optimizeImageFile(file) {
        if (!file || !file.type || !file.type.startsWith('image/')) {
            throw new Error('El archivo seleccionado no es una imagen válida.');
        }

        const MAX_RAW_BYTES = 20 * 1024 * 1024;
        if (file.size > MAX_RAW_BYTES) {
            throw new Error('La imagen es demasiado grande. El límite máximo es de 20 MB.');
        }

        return new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            const img = new Image();

            img.onload = () => {
                URL.revokeObjectURL(objectUrl);

                try {
                    const MAX_WIDTH = 1920;
                    const MAX_HEIGHT = 1080;
                    let { width, height } = img;

                    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, width);
                    canvas.height = Math.max(1, height);

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        throw new Error('No se pudo inicializar el procesador gráfico (Canvas 2D).');
                    }

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Intentar formato WebP (0.80 calidad)
                    let dataUrl = canvas.toDataURL('image/webp', 0.80);
                    if (!dataUrl.startsWith('data:image/webp')) {
                        // Fallback a JPEG si WebP no está disponible
                        dataUrl = canvas.toDataURL('image/jpeg', 0.80);
                    }

                    // Si por alta complejidad gráfica supera ~1.2 MB, aplicar una segunda pasada de compresión
                    if (dataUrl.length > 1200000) {
                        const targetW = Math.round(canvas.width * 0.75);
                        const targetH = Math.round(canvas.height * 0.75);
                        canvas.width = Math.max(1, targetW);
                        canvas.height = Math.max(1, targetH);
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'medium';
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                        dataUrl = canvas.toDataURL('image/webp', 0.65);
                        if (!dataUrl.startsWith('data:image/webp')) {
                            dataUrl = canvas.toDataURL('image/jpeg', 0.65);
                        }
                    }

                    // Límite de seguridad estricto para localStorage (~1.5 MB)
                    if (dataUrl.length > 1800000) {
                        throw new Error('La imagen sigue siendo demasiado pesada para el almacenamiento local.');
                    }

                    resolve(dataUrl);
                } catch (err) {
                    reject(err);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('No se pudo cargar la imagen. El archivo puede estar corrupto.'));
            };

            img.src = objectUrl;
        });
    }

    init() {
        if (this._inited) return;
        this._inited = true;
        this.primaryInput = document.getElementById('custom-theme-primary');
        this.secondaryInput = document.getElementById('custom-theme-secondary');
        this.resetBtn = document.getElementById('reset-theme-colors-btn');

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
        const bgLayer = document.getElementById('custom-bg-layer');
        const dimOverlay = document.getElementById('custom-bg-dim-overlay');
        const auroraCanvas = document.getElementById('aurora-bg-canvas') || document.getElementById('aurora-canvas');

        const { mode, gradient, imageUrl, blur, dim } = this.bgConfig;

        if (auroraCanvas) {
            auroraCanvas.style.display = (mode === 'aurora') ? 'block' : 'none';
        }

        if (!bgLayer) return;

        if (mode === 'aurora') {
            bgLayer.classList.remove('active');
            bgLayer.style.backgroundImage = 'none';
            if (dimOverlay) dimOverlay.style.opacity = '0';
        } else if (mode === 'gradient') {
            bgLayer.classList.add('active');
            bgLayer.style.backgroundImage = gradient || 'linear-gradient(135deg, #0f172a 0%, #020617 100%)';
            bgLayer.style.filter = 'none';
            if (dimOverlay) dimOverlay.style.opacity = '0';
        } else if (mode === 'image') {
            bgLayer.classList.add('active');
            const safeUrl = sanitizeCssUrl(imageUrl) || sanitizeCssUrl(UNSPLASH_PRESETS.cyberpunk[0]);
            bgLayer.style.backgroundImage = safeUrl ? `url("${safeUrl}")` : 'none';
            const safeBlur = Math.max(0, Math.min(50, parseInt(blur, 10) || 0));
            const safeDim = Math.max(0, Math.min(100, parseInt(dim, 10) || 20));
            bgLayer.style.filter = `blur(${safeBlur}px)`;
            if (dimOverlay) dimOverlay.style.opacity = `${safeDim / 100}`;
        }
    }

    bindBgEvents() {
        const chips = document.querySelectorAll('.bg-mode-chip');
        const gradPanel = document.getElementById('bg-panel-gradient');
        const imgPanel = document.getElementById('bg-panel-image');
        const topicSelect = document.getElementById('bg-unsplash-topic-select');
        const fileInput = document.getElementById('bg-file-upload-input');
        const urlInput = document.getElementById('bg-custom-url-input');
        const randomBtn = document.getElementById('bg-refresh-unsplash-btn');
        const blurSlider = document.getElementById('bg-blur-slider');
        const dimSlider = document.getElementById('bg-dim-slider');
        const blurDisplay = document.getElementById('bg-blur-val-display');
        const dimDisplay = document.getElementById('bg-dim-val-display');

        const syncUI = () => {
            chips.forEach(c => {
                const cMode = c.getAttribute('data-bg-mode');
                c.classList.toggle('active', cMode === this.bgConfig.mode);
            });
            if (gradPanel) gradPanel.classList.toggle('hidden', this.bgConfig.mode !== 'gradient');
            if (imgPanel) imgPanel.classList.toggle('hidden', this.bgConfig.mode !== 'image');
            if (topicSelect) topicSelect.value = this.bgConfig.unsplashTopic || 'cyberpunk';
            if (urlInput) urlInput.value = (this.bgConfig.imageType === 'url' ? this.bgConfig.imageUrl : '') || '';
            if (blurSlider) blurSlider.value = this.bgConfig.blur || 0;
            if (dimSlider) dimSlider.value = this.bgConfig.dim || 20;
            if (blurDisplay) blurDisplay.textContent = `${this.bgConfig.blur || 0}px`;
            if (dimDisplay) dimDisplay.textContent = `${this.bgConfig.dim || 20}%`;
        };

        syncUI();

        chips.forEach(c => {
            c.onclick = (e) => {
                e.preventDefault();
                soundFx.play('click');
                const newMode = c.getAttribute('data-bg-mode');
                this.bgConfig.mode = newMode;
                this.saveBgConfig();
                syncUI();
            };
        });

        document.querySelectorAll('.bg-grad-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                soundFx.play('click');
                this.bgConfig.gradient = btn.getAttribute('data-grad');
                this.saveBgConfig();
            };
        });

        if (topicSelect) {
            topicSelect.onchange = (e) => {
                const topic = e.target.value;
                const pool = UNSPLASH_PRESETS[topic] || UNSPLASH_PRESETS.cyberpunk;
                this.bgConfig.unsplashTopic = topic;
                this.bgConfig.imageType = 'unsplash';
                this.bgConfig.imageUrl = pool[0];
                this.saveBgConfig();
                syncUI();
            };
        }

        if (randomBtn) {
            randomBtn.onclick = (e) => {
                e.preventDefault();
                soundFx.play('click');
                const topics = ['cyberpunk', 'space', 'nature', 'architecture'];
                const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                const pool = UNSPLASH_PRESETS[randomTopic] || UNSPLASH_PRESETS.cyberpunk;
                // Escoger una imagen diferente a la actual
                const filtered = pool.filter(url => url !== this.bgConfig.imageUrl);
                const randomUrl = filtered.length ? filtered[Math.floor(Math.random() * filtered.length)] : pool[0];
                this.bgConfig.unsplashTopic = randomTopic;
                this.bgConfig.imageType = 'unsplash';
                this.bgConfig.imageUrl = randomUrl;
                this.saveBgConfig();
                syncUI();
            };
        }

        if (fileInput) {
            fileInput.onchange = async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;

                const previousConfig = { ...this.bgConfig };
                try {
                    const optimizedDataUrl = await this.optimizeImageFile(file);
                    this.bgConfig.mode = 'image';
                    this.bgConfig.imageType = 'local';
                    this.bgConfig.imageUrl = optimizedDataUrl;

                    const saved = this.saveBgConfig();
                    if (!saved) {
                        this.bgConfig = previousConfig;
                        this.applyBackground();
                        showToast('Espacio insuficiente en el navegador para guardar la imagen.', 'error');
                    } else {
                        showToast('Imagen de fondo guardada con éxito.', 'success');
                        syncUI();
                    }
                } catch (err) {
                    console.error('[ThemeStudio] Error al procesar imagen de fondo:', err);
                    this.bgConfig = previousConfig;
                    this.applyBackground();
                    showToast(err.message || 'Error al procesar la imagen.', 'error');
                } finally {
                    fileInput.value = '';
                }
            };
        }

        if (urlInput) {
            urlInput.onchange = (e) => {
                const raw = e.target.value.trim();
                if (!raw) return;
                const safe = sanitizeCssUrl(raw);
                if (!safe) {
                    showToast('Por favor, introduce una URL válida (http/https).', 'error');
                    syncUI();
                    return;
                }
                this.bgConfig.mode = 'image';
                this.bgConfig.imageType = 'url';
                this.bgConfig.imageUrl = safe;
                this.saveBgConfig();
                syncUI();
            };
        }

        if (blurSlider) {
            blurSlider.oninput = (e) => {
                this.bgConfig.blur = parseInt(e.target.value);
                if (blurDisplay) blurDisplay.textContent = `${e.target.value}px`;
                this.saveBgConfig();
            };
        }

        if (dimSlider) {
            dimSlider.oninput = (e) => {
                this.bgConfig.dim = parseInt(e.target.value);
                if (dimDisplay) dimDisplay.textContent = `${e.target.value}%`;
                this.saveBgConfig();
            };
        }
    }
}
