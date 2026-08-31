// js/state.js - Central Reactive State & Persistence Manager

// T6.3 (Fase 6): única fuente de verdad de la versión de la app. La importan
// backup.js y crypto-sync.js, y guía el cache-busting de index.html (v=1.0.0-rc-1).
export const APP_VERSION = '1.0.0-rc-1';

export const DEFAULT_CATEGORIES = [
    { id: 'cat_3d', group: 'ia-creativa', color: 'tag-cyan', defaultTitle: 'Modelado 3D' },
    { id: 'cat_ai', group: 'ia-creativa', color: 'tag-magenta', defaultTitle: 'Inteligencia Artificial' },
    { id: 'cat_art', group: 'arte-media', color: 'tag-purple', defaultTitle: 'Arte Digital' },
    { id: 'cat_audio', group: 'arte-media', color: 'tag-yellow', defaultTitle: 'Generación de Audio' },
    { id: 'cat_google', group: 'productividad', color: 'tag-blue', defaultTitle: 'Google' },
    { id: 'cat_tools', group: 'productividad', color: 'tag-emerald', defaultTitle: 'Herramientas' },
    { id: 'cat_social', group: 'social-compras', color: 'tag-cyan', defaultTitle: 'Redes Sociales' },
    { id: 'cat_messaging', group: 'social-compras', color: 'tag-emerald', defaultTitle: 'Mensajería' },
    { id: 'cat_shopping', group: 'social-compras', color: 'tag-orange', defaultTitle: 'Compras & Pagos' },
    { id: 'cat_video', group: 'ia-creativa', color: 'tag-red', defaultTitle: 'Vídeo' },
    { id: 'cat_gaming', group: 'social-compras', color: 'tag-purple', defaultTitle: 'Gaming' }
];

export const DEFAULT_SHORTCUTS = [
    // 3D
    { id: 'meshy', title: 'Meshy AI', url: 'https://www.meshy.ai/discover', icon: 'iconos/meshy.webp', category: 'cat_3d', tags: '3d, ai, modelado, mesh' },
    { id: 'tripo3d', title: 'Tripo 3D', url: 'https://studio.tripo3d.ai/', icon: 'iconos/tripo3d.webp', category: 'cat_3d', tags: '3d, ai, studio, mesh' },
    { id: 'ludoai', title: 'Ludo.ai', url: 'https://ludo.ai', icon: 'iconos/ludoai.webp', category: 'cat_3d', tags: '3d, gamedev, ai, research' },
    { id: 'sketchfab', title: 'Sketchfab', url: 'https://sketchfab.com/', icon: 'iconos/sketchfab.webp', category: 'cat_3d', tags: '3d, modelos, viewer, assets, marketplace, escaneo' },
    // AI
    { id: 'chatgpt', title: 'ChatGPT', url: 'https://chatgpt.com/', icon: 'iconos/chatgpt.webp', category: 'cat_ai', tags: 'ai, openai, gpt4, chat' },
    { id: 'deepseek', title: 'DeepSeek', url: 'https://chat.deepseek.com/', icon: 'iconos/deepseek.webp', category: 'cat_ai', tags: 'ai, code, reasoning, llm' },
    { id: 'claude', title: 'Claude', url: 'https://claude.ai/', icon: 'iconos/claude.webp', category: 'cat_ai', tags: 'ai, anthropic, sonnet, coding' },
    { id: 'qwen', title: 'Qwen', url: 'https://chat.qwen.ai/', icon: 'iconos/qwen.webp', category: 'cat_ai', tags: 'ai, alibaba, qwen, chat' },
    { id: 'seaverse', title: 'SeaVerse', url: 'https://seaverse.ai/', icon: 'iconos/seaverse.webp', category: 'cat_ai', tags: 'ai, 3d, tools, virtual' },
    { id: 'kimi', title: 'Kimi', url: 'https://kimi.com/', icon: 'iconos/kimi.webp', category: 'cat_ai', tags: 'ai, llm, moonshot, kimi, chat, razonamiento, contexto largo' },
    // Arte
    { id: 'civitai', title: 'Civitai', url: 'https://civitai.com/', icon: 'iconos/civitai.webp', category: 'cat_art', tags: 'arte, models, lora, checkpoints' },
    { id: 'shakker', title: 'Shakker', url: 'https://www.shakker.ai/', icon: 'iconos/shakkerai.webp', category: 'cat_art', tags: 'arte, ai, image, hd' },
    { id: 'tensorart', title: 'Tensor Art', url: 'https://tensor.art/', icon: 'iconos/tensorart.webp', category: 'cat_art', tags: 'arte, ai, image, generation' },
    { id: 'seaart', title: 'Sea Art', url: 'https://www.seaart.ai/', icon: 'iconos/seaartai.webp', category: 'cat_art', tags: 'arte, ai, renderer, studio' },
    { id: 'shadertoy', title: 'Shadertoy', url: 'https://www.shadertoy.com/', icon: 'iconos/shadertoy.webp', category: 'cat_art', tags: 'glsl, shader, webgl, code' },
    // Audio
    { id: 'minimax', title: 'Minimax', url: 'https://www.minimax.io/audio/voices', icon: 'iconos/MiniMax.webp', category: 'cat_audio', tags: 'audio, voice, tts, clone' },
    { id: 'suno', title: 'Suno', url: 'https://app.suno.ai/', icon: 'iconos/suno.webp', category: 'cat_audio', tags: 'audio, music, ai, songs' },
    { id: 'elevenlabs', title: 'Eleven Labs', url: 'https://elevenlabs.io/es', icon: 'iconos/elevenlabs.webp', category: 'cat_audio', tags: 'audio, voice, tts, speech' },
    { id: 'spotify', title: 'Spotify', url: 'https://open.spotify.com/', icon: 'iconos/spotify.webp', category: 'cat_audio', tags: 'audio, musica, streaming, podcasts, spotify' },
    // Google
    { id: 'google', title: 'Google', url: 'https://www.google.es/', icon: 'iconos/google.webp', category: 'cat_google', tags: 'search, web, google' },
    { id: 'gmail', title: 'Gmail', url: 'https://mail.google.com/', icon: 'iconos/gmail.webp', category: 'cat_google', tags: 'email, mail, google' },
    { id: 'googledrive', title: 'Google Drive', url: 'https://workspace.google.com/intl/es/products/drive/', icon: 'iconos/googledrive.webp', category: 'cat_google', tags: 'cloud, storage, files' },
    { id: 'gemini', title: 'Gemini', url: 'https://gemini.google.com/', icon: 'iconos/gemini.webp', category: 'cat_google', tags: 'ai, google, gemini, multimodal' },
    { id: 'googleaistudio', title: 'AI Studio', url: 'https://aistudio.google.com/', icon: 'iconos/googleaistudio.webp', category: 'cat_google', tags: 'ai, api, gemini, dev' },
    { id: 'notebooklm', title: 'NotebookLM', url: 'https://notebooklm.google.com/', icon: 'iconos/notebooklm.webp', category: 'cat_google', tags: 'notes, ai, audio, summary' },
    // Tools & Dev (Original 6)
    { id: 'birme', title: 'Birme', url: 'https://birme.net', icon: 'iconos/birme.webp', category: 'cat_tools', tags: 'birme redimensionar imagenes recortar fotos lote' },
    { id: 'photoroom', title: 'Photoroom', url: 'https://www.photoroom.com/es/herramientas/eliminador-de-fondos', icon: 'iconos/photoroom.webp', category: 'cat_tools', tags: 'photoroom fondo quitar transparent cutout' },
    { id: 'github', title: 'GitHub', url: 'https://github.com/Devildonia', icon: 'iconos/github.webp', category: 'cat_tools', tags: 'github codigo repositorios git devildonia dev' },
    { id: 'optimizeglb', title: 'OptimizeGLB', url: 'https://optimizeglb.com/dashboard', icon: 'iconos/OptimizeGLB.webp', category: 'cat_tools', tags: 'optimizeglb glb gltf 3d optimizador compresion dev 3dmodel' },
    { id: 'translate', title: 'Traductor', url: 'https://translate.google.com/', icon: 'iconos/translate.webp', category: 'cat_tools', tags: 'traductor google translate idiomas' },
    { id: 'onedrive', title: 'OneDrive', url: 'https://onedrive.com/', icon: 'iconos/onedrive.webp', category: 'cat_tools', tags: 'onedrive microsoft cloud storage archivos sync' },
    // Social
    { id: 'instagram', title: 'Instagram', url: 'https://www.instagram.com/', icon: 'iconos/instagram.webp', category: 'cat_social', tags: 'social, fotos, meta, feed' },
    { id: 'facebook', title: 'Facebook', url: 'https://www.facebook.com/', icon: 'iconos/facebook.webp', category: 'cat_social', tags: 'social, amigos, meta' },
    { id: 'x', title: 'X', url: 'https://x.com/', icon: 'iconos/x.webp', category: 'cat_social', tags: 'social, noticias, feed, microblogging' },
    { id: 'tiktok', title: 'TikTok', url: 'https://www.tiktok.com/', icon: 'iconos/tiktok.webp', category: 'cat_social', tags: 'social, video, short, reels' },
    { id: 'threads', title: 'Threads', url: 'https://www.threads.net/', icon: 'iconos/threads.webp', category: 'cat_social', tags: 'social, meta, microblogging, feed' },
    { id: 'patreon', title: 'Patreon', url: 'https://www.patreon.com/', icon: 'iconos/patreon.webp', category: 'cat_social', tags: 'creadores, suscripcion, crowdfunding' },
    { id: 'reddit', title: 'Reddit', url: 'https://www.reddit.com/', icon: 'iconos/reddit.webp', category: 'cat_social', tags: 'social reddit foros comunidad noticias karma' },
    { id: 'linkedin', title: 'LinkedIn', url: 'https://www.linkedin.com/', icon: 'iconos/linkedin.webp', category: 'cat_social', tags: 'empleo, trabajo, network, profesional' },
    // Mensajería
    { id: 'discord', title: 'Discord', url: 'https://discord.com/app', icon: 'iconos/discord.webp', category: 'cat_messaging', tags: 'chat, voice, gamedev, community, mensajeria' },
    { id: 'whatsapp', title: 'WhatsApp', url: 'https://web.whatsapp.com/', icon: 'iconos/whatsapp.webp', category: 'cat_messaging', tags: 'chat, mensajeria, whatsapp, mensajes, video' },
    { id: 'telegram', title: 'Telegram', url: 'https://web.telegram.org/', icon: 'iconos/telegram.webp', category: 'cat_messaging', tags: 'chat, mensajeria, telegram, mensajes, bots, canales' },
    // Shopping
    { id: 'amazon', title: 'Amazon', url: 'https://www.amazon.es/', icon: 'iconos/amazon.webp', category: 'cat_shopping', tags: 'compras, tienda, retail' },
    { id: 'aliexpress', title: 'AliExpress', url: 'https://es.aliexpress.com/', icon: 'iconos/aliexpress.webp', category: 'cat_shopping', tags: 'compras, importacion, tienda' },
    { id: 'pccomponentes', title: 'PcComponentes', url: 'https://www.pccomponentes.com/', icon: 'iconos/pccomponentes.webp', category: 'cat_shopping', tags: 'hardware, tecnologia, pc, componentes' },
    { id: 'paypal', title: 'PayPal', url: 'https://www.paypal.com/', icon: 'iconos/paypal.webp', category: 'cat_shopping', tags: 'pagos, cartera, transferencias' },
    { id: 'wallapop', title: 'Wallapop', url: 'https://es.wallapop.com/', icon: 'iconos/wallapop.webp', category: 'cat_shopping', tags: 'segunda mano, compras, ventas' },
    { id: 'ebay', title: 'eBay', url: 'https://www.ebay.es/', icon: 'iconos/ebay.webp', category: 'cat_shopping', tags: 'compras, subastas, marketplace, segunda mano' },
    // Gaming
    { id: 'steam', title: 'Steam', url: 'https://store.steampowered.com/', icon: 'iconos/steam.webp', category: 'cat_gaming', tags: 'gaming steam valve tienda juegos pc store' },
    { id: 'epic', title: 'Epic Games', url: 'https://store.epicgames.com/', icon: 'iconos/epic.webp', category: 'cat_gaming', tags: 'gaming epic store juegos unreal fortnite' },
    { id: 'gog', title: 'GOG.com', url: 'https://www.gog.com/', icon: 'iconos/gog.webp', category: 'cat_gaming', tags: 'gaming gog drmfree cdprojekt juegos retro' },
    { id: 'xbox', title: 'Xbox', url: 'https://www.xbox.com/', icon: 'iconos/xbox.webp', category: 'cat_gaming', tags: 'gaming xbox microsoft gamepass consola juegos' },
    { id: 'itchio', title: 'itch.io', url: 'https://itch.io/', icon: 'iconos/itchio.webp', category: 'cat_gaming', tags: 'gaming itchio juegos assets indie sprites dev gamedev' },
    { id: 'exophase', title: 'Exophase', url: 'https://www.exophase.com/', icon: 'iconos/exophase.webp', category: 'cat_gaming', tags: 'gaming exophase logros trofeos tracking stats perfiles' },
    // Video
    { id: 'youtube', title: 'YouTube', url: 'https://www.youtube.com/', icon: 'iconos/youtube.webp', category: 'cat_video', tags: 'video, streaming, google, tutoriales' },
    { id: 'kling', title: 'Kling', url: 'https://klingai.com/', icon: 'iconos/kling.webp', category: 'cat_video', tags: 'video, ai, generacion, cinemica' },
    { id: 'hedra', title: 'Hedra', url: 'https://www.hedra.com/', icon: 'iconos/hedra.webp', category: 'cat_video', tags: 'video, ai, avatar, talking' }
];

// Inyección del mensaje de error de storage (evita dependencia circular state → i18n).
// La capa superior (app.js) registra aquí el texto traducido; por defecto queda el español.
let storageFullMsg = null;
export function setStorageFullMsg(fn) { storageFullMsg = fn; }

export class AppState {
    constructor() {
        this.shortcuts = this.loadShortcuts();
        this.categories = this.loadCategories();
        this.userName = this.getItem('custom_user_name', 'HaDeS');
        this.theme = this.getItem('app_theme', 'cyber');
        this.soundEnabled = this.getItem('sound_enabled', 'true') !== 'false';
        this.language = this.detectLanguage();
        this.activeFilter = this.getItem('active_pill_filter', 'all');
        this.searchEngine = this.getItem('app_search_engine', 'google');
        this.editMode = false;
        this.showShortcutTags = this.getItem('show_shortcut_tags', 'false') === 'true';
        this.showChromeBezel = this.getItem('show_chrome_bezel', 'true') !== 'false';
        this.showGoldBezel = this.getItem('show_gold_bezel', 'true') !== 'false';
        this.showBlueBezel = this.getItem('show_blue_bezel', 'true') !== 'false';
        this.showLilacBezel = this.getItem('show_lilac_bezel', 'true') !== 'false';
        this.showGreenBezel = this.getItem('show_green_bezel', 'false') === 'true';
        this.layoutMatrix = this.loadLayoutMatrix();
        this.listeners = new Map();
    }

    getItem(k, def) {
        try {
            return (typeof localStorage !== 'undefined' && localStorage.getItem(k)) || def;
        } catch (e) {
            return def;
        }
    }

    setItem(k, v) {
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
            return true;
        } catch (e) {
            showToast((typeof storageFullMsg === 'function' ? (storageFullMsg() || null) : null) || 'No se pudo guardar (almacenamiento lleno o bloqueado).', 'error');
            return false;
        }
    }

    removeItem(k) {
        try {
            if (typeof localStorage !== 'undefined') localStorage.removeItem(k);
        } catch (e) {}
    }

    loadShortcuts() {
        try {
            const saved = this.getItem('custom_shortcuts_v2', null);
            if (saved) {
                const list = JSON.parse(saved);
                if (Array.isArray(list)) {
                    list.forEach(existing => {
                        if (existing && (existing.id === 'itchio' || existing.id === 'exophase') && existing.category !== 'cat_gaming') {
                            existing.category = 'cat_gaming';
                        }
                        // Migración de nombre: 'X (Twitter)' → 'X' (solo la entrada por defecto)
                        if (existing && existing.id === 'x' && existing.title === 'X (Twitter)') {
                            existing.title = 'X';
                        }
                    });
                    return list;
                }
            }
        } catch (e) {}
        return [...DEFAULT_SHORTCUTS];
    }

    loadCategories() {
        try {
            const order = this.getItem('category_order_v2', null);
            if (order) {
                const ids = JSON.parse(order);
                DEFAULT_CATEGORIES.forEach(dc => {
                    if (!ids.includes(dc.id)) ids.push(dc.id);
                });
                return [...DEFAULT_CATEGORIES].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
            }
        } catch (e) {}
        return [...DEFAULT_CATEGORIES];
    }

    loadLayoutMatrix() {
        try {
            const saved = this.getItem('dashboard_layout_v3', null);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return null;
    }

    saveLayoutMatrix(matrix) {
        this.layoutMatrix = matrix;
        this.setItem('dashboard_layout_v3', JSON.stringify(matrix));
        this.emit('layout:changed', matrix);
    }

    detectLanguage() {
        const saved = this.getItem('app_language', null);
        if (saved && ['es', 'en', 'fr', 'de'].includes(saved)) return saved;
        if (typeof navigator !== 'undefined') {
            const navLang = (navigator.language || navigator.userLanguage || 'es').toLowerCase();
            if (navLang.startsWith('fr')) return 'fr';
            if (navLang.startsWith('de')) return 'de';
            if (navLang.startsWith('en')) return 'en';
        }
        return 'es';
    }

    setUserName(name) {
        this.userName = (name || 'HaDeS').trim();
        this.setItem('custom_user_name', this.userName);
        this.emit('username:changed', this.userName);
    }

    setTheme(themeName) {
        this.theme = themeName;
        this.setItem('app_theme', themeName);
        this.emit('theme:changed', themeName);
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        this.setItem('sound_enabled', enabled ? 'true' : 'false');
        this.emit('sound:changed', enabled);
    }

    setLanguage(langCode) {
        if (!['es', 'en', 'fr', 'de'].includes(langCode)) langCode = 'es';
        this.language = langCode;
        this.setItem('app_language', langCode);
        if (typeof document !== 'undefined') document.documentElement.lang = langCode;
        this.emit('language:changed', langCode);
    }

    setEditMode(enabled) {
        this.editMode = enabled;
        this.emit('editmode:changed', enabled);
    }

    applyShortcutTagsVisibility() {
        if (typeof document === 'undefined') return;
        document.documentElement.classList.toggle('show-shortcut-tags', this.showShortcutTags);
    }

    setShowShortcutTags(enabled) {
        this.showShortcutTags = !!enabled;
        this.setItem('show_shortcut_tags', this.showShortcutTags ? 'true' : 'false');
        this.applyShortcutTagsVisibility();
        this.emit('tags:visibility', this.showShortcutTags);
    }

    applyChromeBezel() {
        if (typeof document === 'undefined') return;
        document.documentElement.classList.toggle('no-chrome-bezel', !this.showChromeBezel);
    }

    setShowChromeBezel(enabled) {
        this.showChromeBezel = !!enabled;
        this.setItem('show_chrome_bezel', this.showChromeBezel ? 'true' : 'false');
        this.applyChromeBezel();
        this.emit('chrome:visibility', this.showChromeBezel);
    }

    applyGoldBezel() {
        if (typeof document === 'undefined') return;
        document.documentElement.classList.toggle('no-gold-bezel', !this.showGoldBezel);
    }

    setShowGoldBezel(enabled) {
        this.showGoldBezel = !!enabled;
        this.setItem('show_gold_bezel', this.showGoldBezel ? 'true' : 'false');
        this.applyGoldBezel();
        this.emit('gold:visibility', this.showGoldBezel);
    }

    applyBlueBezel() {
        if (typeof document === 'undefined') return;
        document.documentElement.classList.toggle('no-blue-bezel', !this.showBlueBezel);
    }

    setShowBlueBezel(enabled) {
        this.showBlueBezel = !!enabled;
        this.setItem('show_blue_bezel', this.showBlueBezel ? 'true' : 'false');
        this.applyBlueBezel();
        this.emit('blue:visibility', this.showBlueBezel);
    }

    applyLilacBezel() {
        if (typeof document === 'undefined') return;
        document.documentElement.classList.toggle('no-lilac-bezel', !this.showLilacBezel);
    }

    setShowLilacBezel(enabled) {
        this.showLilacBezel = !!enabled;
        this.setItem('show_lilac_bezel', this.showLilacBezel ? 'true' : 'false');
        this.applyLilacBezel();
        this.emit('lilac:visibility', this.showLilacBezel);
    }

    applyGreenBezel() {
        if (typeof document === 'undefined') return;
        document.documentElement.classList.toggle('no-green-bezel', !this.showGreenBezel);
    }

    setShowGreenBezel(enabled) {
        this.showGreenBezel = !!enabled;
        this.setItem('show_green_bezel', this.showGreenBezel ? 'true' : 'false');
        this.applyGreenBezel();
        this.emit('green:visibility', this.showGreenBezel);
    }

    saveShortcuts(list) {
        const next = Array.isArray(list) ? list : this.shortcuts;
        this.shortcuts = [...next];
        this.setItem('custom_shortcuts_v2', JSON.stringify(this.shortcuts));
        this.emit('shortcuts:changed', this.shortcuts);
    }

    saveCategories(catsOrIds) {
        if (!Array.isArray(catsOrIds) || catsOrIds.length === 0) return;
        if (typeof catsOrIds[0] === 'string') {
            this.saveCategoriesOrder(catsOrIds);
            return;
        }
        this.categories = catsOrIds.map((c) => ({ ...c }));
        this.setItem('category_order_v2', JSON.stringify(this.categories.map((c) => c.id)));
        this.emit('categories:changed', this.categories);
    }

    saveCategoriesOrder(catIds) {
        this.categories = [...this.categories].sort((a, b) => catIds.indexOf(a.id) - catIds.indexOf(b.id));
        this.setItem('category_order_v2', JSON.stringify(catIds));
        this.emit('categories:changed', this.categories);
    }

    resetToDefaults() {
        this.removeItem('custom_shortcuts_v2');
        this.removeItem('category_order_v2');
        this.removeItem('dashboard_layout_v3');
        this.removeItem('canvas_positions_v1');
        this.layoutMatrix = null;
        this.shortcuts = [...DEFAULT_SHORTCUTS];
        this.categories = [...DEFAULT_CATEGORIES];
        this.emit('shortcuts:changed', this.shortcuts);
        this.emit('categories:changed', this.categories);
    }

    on(event, callback) {
        if (!this.listeners.has(event)) this.listeners.set(event, []);
        this.listeners.get(event).push(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        if (!callback) {
            this.listeners.delete(event);
            return;
        }
        this.listeners.set(event, this.listeners.get(event).filter((cb) => cb !== callback));
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => cb(data));
        }
    }
}

export const state = new AppState();

// persistJson: bridge between the reactive store and JSON serialization.
// Kept here because it depends on `state.setItem`.
export function persistJson(key, value) {
    return state.setItem(key, JSON.stringify(value));
}
