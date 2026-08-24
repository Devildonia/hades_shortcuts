(() => {
'use strict';

// --- Module: js/state.js ---
// js/state.js - Central Reactive State & Persistence Manager

const DEFAULT_CATEGORIES = [
    { id: 'cat_3d', group: 'ia-creativa', color: 'tag-cyan', defaultTitle: '3D Modeling & AI' },
    { id: 'cat_ai', group: 'ia-creativa', color: 'tag-magenta', defaultTitle: 'Inteligencia Artificial' },
    { id: 'cat_art', group: 'arte-media', color: 'tag-purple', defaultTitle: 'Arte Digital & Modelos' },
    { id: 'cat_audio', group: 'arte-media', color: 'tag-yellow', defaultTitle: 'Generación de Audio' },
    { id: 'cat_google', group: 'productividad', color: 'tag-blue', defaultTitle: 'Google Workspace & AI' },
    { id: 'cat_tools', group: 'productividad', color: 'tag-emerald', defaultTitle: 'Herramientas & Dev' },
    { id: 'cat_social', group: 'social-compras', color: 'tag-cyan', defaultTitle: 'Comunidad & Redes' },
    { id: 'cat_shopping', group: 'social-compras', color: 'tag-orange', defaultTitle: 'Compras & Pagos' },
    { id: 'cat_video', group: 'ia-creativa', color: 'tag-red', defaultTitle: 'Vídeo & Generación IA' }
];

const DEFAULT_SHORTCUTS = [
    // 3D
    { id: 'meshy', title: 'Meshy AI', url: 'https://www.meshy.ai/discover', icon: 'iconos/meshy.webp', category: 'cat_3d', tags: '3d, ai, modelado, mesh' },
    { id: 'tripo3d', title: 'Tripo 3D', url: 'https://studio.tripo3d.ai/', icon: 'iconos/tripo3d.webp', category: 'cat_3d', tags: '3d, ai, studio, mesh' },
    { id: 'ludoai', title: 'Ludo.ai', url: 'https://ludo.ai', icon: 'iconos/ludoai.webp', category: 'cat_3d', tags: '3d, gamedev, ai, research' },
    // AI
    { id: 'chatgpt', title: 'ChatGPT', url: 'https://chatgpt.com/', icon: 'iconos/chatgpt.webp', category: 'cat_ai', tags: 'ai, openai, gpt4, chat' },
    { id: 'deepseek', title: 'DeepSeek', url: 'https://chat.deepseek.com/', icon: 'iconos/deepseek.webp', category: 'cat_ai', tags: 'ai, code, reasoning, llm' },
    { id: 'claude', title: 'Claude', url: 'https://claude.ai/', icon: 'iconos/claude.webp', category: 'cat_ai', tags: 'ai, anthropic, sonnet, coding' },
    { id: 'qwen', title: 'Qwen', url: 'https://chat.qwen.ai/', icon: 'iconos/qwen.webp', category: 'cat_ai', tags: 'ai, alibaba, qwen, chat' },
    { id: 'seaverse', title: 'SeaVerse', url: 'https://seaverse.ai/', icon: 'iconos/seaverse.webp', category: 'cat_ai', tags: 'ai, 3d, tools, virtual' },
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
    { id: 'itchio', title: 'itch.io', url: 'https://itch.io/', icon: 'iconos/itchio.webp', category: 'cat_tools', tags: 'itchio juegos assets indie sprites dev gamedev' },
    { id: 'optimizeglb', title: 'OptimizeGLB', url: 'https://optimizeglb.com/dashboard', icon: 'iconos/OptimizeGLB.webp', category: 'cat_tools', tags: 'optimizeglb glb gltf 3d optimizador compresion dev 3dmodel' },
    { id: 'translate', title: 'Traductor', url: 'https://translate.google.com/', icon: 'iconos/translate.webp', category: 'cat_tools', tags: 'traductor google translate idiomas' },
    // Social
    { id: 'instagram', title: 'Instagram', url: 'https://www.instagram.com/', icon: 'iconos/instagram.webp', category: 'cat_social', tags: 'social, fotos, meta, feed' },
    { id: 'facebook', title: 'Facebook', url: 'https://www.facebook.com/', icon: 'iconos/facebook.webp', category: 'cat_social', tags: 'social, amigos, meta' },
    { id: 'x', title: 'X (Twitter)', url: 'https://x.com/', icon: 'iconos/x.webp', category: 'cat_social', tags: 'social, noticias, feed, microblogging' },
    { id: 'tiktok', title: 'TikTok', url: 'https://www.tiktok.com/', icon: 'iconos/tiktok.webp', category: 'cat_social', tags: 'social, video, short, reels' },
    { id: 'threads', title: 'Threads', url: 'https://www.threads.net/', icon: 'iconos/threads.webp', category: 'cat_social', tags: 'social, meta, microblogging, feed' },
    { id: 'patreon', title: 'Patreon', url: 'https://www.patreon.com/', icon: 'iconos/patreon.webp', category: 'cat_social', tags: 'creadores, suscripcion, crowdfunding' },
    { id: 'discord', title: 'Discord', url: 'https://discord.com/app', icon: 'iconos/discord.webp', category: 'cat_social', tags: 'chat, voice, gamedev, community' },
    { id: 'linkedin', title: 'LinkedIn', url: 'https://www.linkedin.com/', icon: 'iconos/linkedin.webp', category: 'cat_social', tags: 'empleo, trabajo, network, profesional' },
    { id: 'exophase', title: 'Exophase', url: 'https://www.exophase.com/', icon: 'iconos/exophase.webp', category: 'cat_social', tags: 'gaming, logros, trofeos, tracking' },
    // Shopping
    { id: 'amazon', title: 'Amazon', url: 'https://www.amazon.es/', icon: 'iconos/amazon.webp', category: 'cat_shopping', tags: 'compras, tienda, retail' },
    { id: 'aliexpress', title: 'AliExpress', url: 'https://es.aliexpress.com/', icon: 'iconos/aliexpress.webp', category: 'cat_shopping', tags: 'compras, importacion, tienda' },
    { id: 'pccomponentes', title: 'PcComponentes', url: 'https://www.pccomponentes.com/', icon: 'iconos/pccomponentes.webp', category: 'cat_shopping', tags: 'hardware, tecnologia, pc, componentes' },
    { id: 'paypal', title: 'PayPal', url: 'https://www.paypal.com/', icon: 'iconos/paypal.webp', category: 'cat_shopping', tags: 'pagos, cartera, transferencias' },
    { id: 'wallapop', title: 'Wallapop', url: 'https://es.wallapop.com/', icon: 'iconos/wallapop.webp', category: 'cat_shopping', tags: 'segunda mano, compras, ventas' },
    // Video
    { id: 'youtube', title: 'YouTube', url: 'https://www.youtube.com/', icon: 'iconos/youtube.webp', category: 'cat_video', tags: 'video, streaming, google, tutoriales' },
    { id: 'kling', title: 'Kling', url: 'https://klingai.com/', icon: 'iconos/kling.webp', category: 'cat_video', tags: 'video, ai, generacion, cinemica' },
    { id: 'hedra', title: 'Hedra', url: 'https://www.hedra.com/', icon: 'iconos/hedra.webp', category: 'cat_video', tags: 'video, ai, avatar, talking' }
];

class AppState {
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
        } catch (e) {}
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
                // Clean invalid tool shortcuts regression
                const hasInvalidIcons = list.some(s => s.id === 'iloveimg' || s.id === 'tinypng' || s.id === 'ezgif' || s.id === 'svgminify' || s.id === 'vectorizer');
                if (hasInvalidIcons) {
                    this.setItem('custom_shortcuts_v2', JSON.stringify(DEFAULT_SHORTCUTS));
                    return [...DEFAULT_SHORTCUTS];
                }
                return list;
            }
        } catch (e) {}
        return [...DEFAULT_SHORTCUTS];
    }

    loadCategories() {
        try {
            const order = this.getItem('category_order_v2', null);
            if (order) {
                const ids = JSON.parse(order);
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
        this.emit('language:changed', langCode);
    }

    setEditMode(enabled) {
        this.editMode = enabled;
        this.emit('editmode:changed', enabled);
    }

    saveShortcuts(list) {
        this.shortcuts = [...list];
        this.setItem('custom_shortcuts_v2', JSON.stringify(this.shortcuts));
        this.emit('shortcuts:changed', this.shortcuts);
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
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => cb(data));
        }
    }
}

const state = new AppState();

const escapeHtml = (str) => {
    return String(str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};


// --- Module: js/i18n.js ---
// js/i18n.js - Internationalization Engine


const i18nDictionaries = {"es": {"brand_greeting": "Bienvenido al Centro de Mando", "greetings": {"morning": "¡Buenos días, HaDeS!", "afternoon": "¡Buenas tardes, HaDeS!", "night": "¡Buenas noches, HaDeS!"}, "controls": {"sound_title": "Efectos de sonido (Activado/Desactivado)", "theme_title": "Cambiar Tema Visual", "lang_title": "Cambiar Idioma", "cmdk_btn": "Buscar", "cmdk_badge": "Ctrl K"}, "search": {"placeholder": "Buscar con {engine} o filtrar atajos...", "clear": "Limpiar búsqueda"}, "filters": {"all": "Todos", "ia_creativa": "IA & 3D", "arte_media": "Arte & Multimedia", "productividad": "Google & Herramientas", "social_compras": "Social & Compras"}, "categories": {"cat_3d": "3D Modeling & AI", "cat_ai": "Inteligencia Artificial", "cat_art": "Arte Digital & Modelos", "cat_audio": "Generación de Audio", "cat_google": "Google Workspace & AI", "cat_tools": "Herramientas & Dev", "cat_social": "Comunidad & Redes", "cat_shopping": "Compras & Pagos", "cat_video": "Vídeo & Generación IA"}, "badges": {"apps": "apps"}, "shortcuts": {"meshy": "Generación de modelos 3D y texturas con IA a partir de texto o imagen", "tripo3d": "Estudio rápido para generar modelos 3D listos para producción", "ludoai": "Plataforma de IA para ideación, análisis de mercado e investigación de videojuegos", "chatgpt": "Asistente conversacional avanzado y razonamiento con GPT-4o", "deepseek": "Modelo de razonamiento profundo y generación de código de alta precisión", "claude": "Modelo de IA de Anthropic con gran ventana de contexto y análisis de código", "qwen": "Modelos fundacionales y chat de Alibaba Cloud (Qwen 2.5)", "seaverse": "Herramientas y generadores de IA para mundos virtuales y multimedia", "civitai": "Comunidad y repositorio de modelos, Checkpoints y LoRAs para Stable Diffusion", "shakker": "Plataforma de generación y mezcla de imágenes de alta definición con IA", "tensorart": "Generador online de arte y modelos con créditos diarios gratuitos", "seaart": "Estudio de creación y renderizado artístico asistido por IA", "shadertoy": "Plataforma para programar, visualizar y compartir shaders GLSL en WebGL", "minimax": "Generación y clonación de voces ultrarrealistas con IA", "suno": "Composición y generación de canciones completas con música y letra por IA", "elevenlabs": "Síntesis de voz líder en el sector y traducción de audio", "google": "Motor de búsqueda web global y servicios integrados", "gmail": "Servicio de correo electrónico seguro y sincronizado", "googledrive": "Almacenamiento en la nube y gestión de archivos colaborativa", "gemini": "Modelo multimodal de Google integrado en su ecosistema", "googleaistudio": "Entorno de desarrollo y prototipado rápido con APIs de Gemini", "notebooklm": "Cuaderno inteligente de notas y resúmenes de audio con IA", "birme": "Redimensionador y recortador por lotes flexible de imágenes", "photoroom": "Eliminador de fondos profesional y edición rápida de fotos", "github": "Plataforma de desarrollo colaborativo y repositorios Git", "itchio": "Mercado indie de videojuegos, assets, música y sprites", "optimizeglb": "Compresión Draco y optimización de archivos 3D GLB/glTF", "translate": "Traducción instantánea de textos y páginas web en múltiples idiomas", "instagram": "Red social para compartir fotos, vídeos, historias y reels", "facebook": "Red social para conectar con amigos, grupos y comunidades", "x": "Red de microblogging para noticias y tendencias en tiempo real", "tiktok": "Plataforma de vídeos cortos en formato vertical", "threads": "Plataforma de microblogging y debate vinculada a Instagram", "patreon": "Membresías y suscripciones para creadores de contenido", "discord": "Servidores de chat de texto, voz y vídeo para comunidades", "linkedin": "Red social profesional para networking y empleo", "exophase": "Seguimiento de logros, trofeos y estadísticas de perfiles gaming", "amazon": "Tienda online global de productos con entrega rápida", "aliexpress": "Plataforma de compras online con variedad y precios de fábrica", "pccomponentes": "Tienda especializada en informática, hardware y tecnología", "paypal": "Pasarela de pagos en línea segura y transferencias", "wallapop": "Plataforma de compraventa de productos de segunda mano", "youtube": "Plataforma de vídeo en streaming, tutoriales y directos", "kling": "Generación de vídeo cinemático con movimiento realista por IA", "hedra": "Creación de avatares hablantes y personajes animados con IA"}, "no_results": {"title": "No se encontraron accesos directos", "desc": "Prueba con otros términos o busca directamente en la web pulsando Enter."}, "weather": {"title": "Configurar Ciudad del Clima", "desc": "Escribe el nombre de tu ciudad para ver el pronóstico meteorológico en vivo:", "input_placeholder": "Ej: Vigo, Madrid, Barcelona, Valencia...", "search_btn": "Buscar", "auto_btn": "Detectar automáticamente por IP", "loading": "Cargando...", "offline": "Sin conexión", "conditions": {"clear": "Despejado", "mostly_clear": "Mayormente despejado", "partly_cloudy": "Parcialmente nublado", "cloudy": "Nublado", "fog": "Niebla", "drizzle": "Llovizna ligera", "rain": "Lluvia", "heavy_rain": "Lluvia intensa", "snow": "Nieve", "showers": "Chubascos", "snow_showers": "Chubascos de nieve", "thunderstorm": "Tormenta", "hail_thunderstorm": "Tormenta con granizo"}}, "cmdk": {"placeholder": "Buscar atajo, herramienta o comando rápido...", "direct_search_prefix": "Buscar en {engine}:", "direct_search_cat": "Búsqueda Web Directa", "action_open": "Abrir", "action_search": "Buscar", "tip_nav": "Navegar", "tip_open": "Abrir enlace", "tip_close": "Cerrar"}, "user_modal": {"title": "Cambiar Nombre de Usuario", "desc": "Personaliza el nombre que aparece en el título y en los saludos de tu Centro de Mando:", "input_placeholder": "Tu nombre o alias...", "save_btn": "Guardar", "preview_label": "Vista previa:", "tooltip_title": "Haz clic para cambiar tu nombre de usuario", "doc_title_suffix": "· Centro de Mando"}, "settings_hub": {"title": "Ajustes del Centro de Mando", "btn_title": "Configuración y Personalización", "tabs": {"appearance": "Apariencia", "language": "Idioma", "weather": "Clima", "layout": "Diseño & Atajos", "backup": "Copia de Seguridad"}, "appearance": {"themes_label": "Tema Visual", "sound_label": "Efectos de Sonido Hápticos", "glow_label": "Resplandor Ambiental (Aurora)", "themes": {"cyber": "Cyber Neon", "nebula": "Deep Nebula", "amber": "Sunset Amber", "light": "Crystal Light", "sunset": "Sunset Amber"}}, "layout": {"edit_mode_title": "Modo Edición del Tablero", "edit_mode_desc": "Activa para arrastrar cajones, reordenar iconos, editarlos o eliminarlos.", "edit_mode_toggle": "Activar Modo Edición", "add_shortcut_btn": "➕ Añadir Nuevo Acceso Directo", "editing_active_badge": "Modo Edición Activado", "reset_layout_title": "Restablecer Diseño Original", "reset_layout_desc": "¿Has modificado mucho el tablero? Vuelve a empezar de cero con la disposición y accesos directos originales de fábrica.", "reset_layout_btn": "🔄 Restaurar Diseño de Fábrica"}, "backup": {"export_title": "Exportar Configuración", "export_desc": "Descarga un archivo JSON con todos tus atajos, orden personalizado y preferencias.", "export_btn": "📥 Descargar Copia (*.json)", "import_title": "Restaurar Configuración", "import_desc": "Carga un archivo de respaldo JSON previamente exportado.", "import_btn": "📤 Restaurar desde Archivo", "reset_title": "Restablecer de Fábrica", "reset_desc": "Restaura los 45 accesos directos originales predeterminados.", "reset_btn": "⚠️ Restablecer Valores", "reset_confirm": "¿Estás seguro de que deseas restablecer los valores de fábrica? Se perderán las personalizaciones.", "import_success": "¡Copia de seguridad restaurada con éxito!", "import_error": "El archivo de respaldo no es válido o está dañado."}, "profile": {"title": "Perfil de Usuario", "desc": "Personaliza tu nombre o alias para el Centro de Mando y saludos:"}}, "shortcut_editor": {"add_title": "Añadir Nuevo Acceso Directo", "edit_title": "Editar Acceso Directo", "title_label": "Nombre del Atajo", "title_placeholder": "Ej: Notion, Figma, Spotify...", "url_label": "URL de Destino", "url_placeholder": "https://ejemplo.com", "category_label": "Categoría Bento", "icon_label": "Icono de la Aplicación", "icon_preset": "Elegir icono incluido:", "icon_custom": "O URL de icono personalizada:", "desc_label": "Descripción (para el Tooltip)", "desc_placeholder": "Breve resumen de la herramienta...", "tags_label": "Etiquetas de Búsqueda", "tags_placeholder": "separadas por comas (ej: musica, streaming)", "save_btn": "Guardar Atajo", "delete_btn": "Eliminar Atajo", "delete_confirm": "¿Seguro que deseas eliminar este acceso directo?", "cancel_btn": "Cancelar"}, "bangs": {"calc_title": "Resultado Calculado", "direct_search": "Buscar en {service}", "suggestions_title": "Comandos Bang Rápidos"}, "widgets": {"scratchpad_title": "Bloc de Notas Glass", "scratchpad_placeholder": "Escribe ideas, tareas o notas rápidas aquí...", "scratchpad_saved": "Guardado automáticamente", "pomodoro_title": "Temporizador Focus", "pomodoro_focus": "Enfoque", "pomodoro_break": "Descanso", "pomodoro_start": "Iniciar", "pomodoro_pause": "Pausar", "pomodoro_reset": "Reiniciar", "toggle_widgets_title": "Mini-Widgets Bento", "toggle_scratchpad": "Mostrar Bloc de Notas", "toggle_pomodoro": "Mostrar Temporizador Pomodoro", "scratchpad_pin": "Fijar Post-it"}, "audio": {"preset_label": "Efecto de Sonido Háptico", "preset_scifi": "Sci-Fi Soft Pop (Sintetizado)", "preset_mech": "Click Mecánico Táctil", "preset_bubble": "Burbuja Acústica"}, "theme_studio": {"title": "Theme Studio Personalizado", "desc": "Personaliza los colores de acento y resplandor neón en tiempo real:", "primary_label": "Color Primario (Acento):", "secondary_label": "Color Secundario:", "reset_colors_btn": "Restablecer Colores Predeterminados"}, "importer": {"title": "Importar Marcadores de Navegador", "desc": "Importa un archivo bookmarks.html exportado desde Chrome, Firefox, Edge o Brave:", "select_file_btn": "📁 Seleccionar Archivo HTML", "merge_mode": "Combinar con mis atajos actuales", "replace_mode": "Reemplazar todos los atajos", "import_btn": "Importar Marcadores", "success_msg": "¡Se han importado {count} accesos directos con éxito!", "error_msg": "No se encontraron marcadores válidos en el archivo seleccionado."}}, "en": {"brand_greeting": "Welcome to the Command Center", "greetings": {"morning": "Good morning, HaDeS!", "afternoon": "Good afternoon, HaDeS!", "night": "Good evening, HaDeS!"}, "controls": {"sound_title": "Sound Effects (Enabled/Disabled)", "theme_title": "Switch Visual Theme", "lang_title": "Switch Language", "cmdk_btn": "Search", "cmdk_badge": "Ctrl K"}, "search": {"placeholder": "Search with {engine} or filter shortcuts...", "clear": "Clear search"}, "filters": {"all": "All", "ia_creativa": "AI & 3D", "arte_media": "Art & Multimedia", "productividad": "Google & Tools", "social_compras": "Social & Shopping"}, "categories": {"cat_3d": "3D Modeling & AI", "cat_ai": "Artificial Intelligence", "cat_art": "Digital Art & Models", "cat_audio": "Audio Generation", "cat_google": "Google Workspace & AI", "cat_tools": "Tools & Dev", "cat_social": "Community & Social", "cat_shopping": "Shopping & Payments", "cat_video": "Video & AI Generation"}, "badges": {"apps": "apps"}, "shortcuts": {"meshy": "AI-powered 3D model and texture generation from text or image", "tripo3d": "Fast 3D studio generating production-ready 3D models with AI", "ludoai": "AI platform for game ideation, market analysis, and research", "chatgpt": "Advanced conversational AI assistant and reasoning with GPT-4o", "deepseek": "Deep reasoning AI model with high precision coding capabilities", "claude": "Anthropic's frontier AI model with vast context window and deep analysis", "qwen": "Alibaba Cloud foundational models and conversational AI (Qwen 2.5)", "seaverse": "AI creative tools and generators for virtual worlds and multimedia", "civitai": "Community model hub, Checkpoints and LoRAs for Stable Diffusion", "shakker": "High-definition image generation and AI image fusion platform", "tensorart": "Online generative art studio with free daily generation credits", "seaart": "AI-assisted art creation studio and image rendering platform", "shadertoy": "Platform to build, view, and share GLSL shaders in WebGL", "minimax": "Ultra-realistic voice cloning and text-to-speech AI generation", "suno": "Full song and music composition with lyrics generated by AI", "elevenlabs": "Industry-leading voice synthesis and multilingual audio translation", "google": "Global web search engine and integrated Google ecosystem services", "gmail": "Secure and synchronized webmail and communications service", "googledrive": "Cloud storage and collaborative document file management", "gemini": "Google multimodal AI model integrated across its workspace ecosystem", "googleaistudio": "Rapid prototyping environment and API access for Gemini models", "notebooklm": "Smart personalized notebook with AI-powered audio overviews", "birme": "Flexible batch image resizer and smart focal crop utility", "photoroom": "Professional background remover and quick photo editing suite", "github": "Collaborative software development platform and Git repositories", "itchio": "Indie marketplace for video games, assets, game music, and sprites", "optimizeglb": "Draco compression and performance optimizer for 3D GLB/glTF files", "translate": "Instant text and web page translations across multiple languages", "instagram": "Visual social media platform for photos, videos, stories, and reels", "facebook": "Social network to connect with friends, groups, and communities", "x": "Real-time microblogging network for global news, tech, and trends", "tiktok": "Short-form vertical video streaming and creative content platform", "threads": "Text-based conversation and microblogging platform linked to Instagram", "patreon": "Membership platform for creators to build recurring fan support", "discord": "Voice, video, and text communication platform for communities", "linkedin": "Professional networking platform for careers, jobs, and businesses", "exophase": "Gaming achievement, trophy, and multi-platform profile tracking", "amazon": "Global online shopping marketplace with fast delivery options", "aliexpress": "Global e-commerce platform offering factory-direct products", "pccomponentes": "Specialized computer hardware, electronics, and tech store", "paypal": "Secure digital wallet and online payment transfer system", "wallapop": "Peer-to-peer secondhand marketplace for buying and selling goods", "youtube": "Global streaming video platform, tutorials, music, and live broadcasts", "kling": "Cinematic video generation with realistic physics and camera motion", "hedra": "AI-powered expressive talking avatar and animated video generation"}, "no_results": {"title": "No shortcuts found", "desc": "Try different search terms or press Enter to search directly on the web."}, "weather": {"title": "Configure Weather City", "desc": "Enter the name of your city to view real-time weather forecasts:", "input_placeholder": "e.g. London, New York, Tokyo, Madrid...", "search_btn": "Search", "auto_btn": "Auto-detect via IP", "loading": "Loading...", "offline": "Offline", "conditions": {"clear": "Clear sky", "mostly_clear": "Mostly clear", "partly_cloudy": "Partly cloudy", "cloudy": "Overcast", "fog": "Fog", "drizzle": "Light drizzle", "rain": "Rain", "heavy_rain": "Heavy rain", "snow": "Snow", "showers": "Rain showers", "snow_showers": "Snow showers", "thunderstorm": "Thunderstorm", "hail_thunderstorm": "Thunderstorm with hail"}}, "cmdk": {"placeholder": "Search shortcut, tool or quick command...", "direct_search_prefix": "Search on {engine}:", "direct_search_cat": "Direct Web Search", "action_open": "Open", "action_search": "Search", "tip_nav": "Navigate", "tip_open": "Open link", "tip_close": "Close"}, "user_modal": {"title": "Change Username", "desc": "Customize the name displayed in the title and greetings of your Command Center:", "input_placeholder": "Your name or handle...", "save_btn": "Save", "preview_label": "Preview:", "tooltip_title": "Click to change your username", "doc_title_suffix": "· Command Center"}, "settings_hub": {"title": "Command Center Settings", "btn_title": "Configuration & Customization", "tabs": {"appearance": "Appearance", "language": "Language", "weather": "Weather", "layout": "Layout & Shortcuts", "backup": "Backup & Restore"}, "appearance": {"themes_label": "Visual Theme", "sound_label": "Haptic Sound Effects", "glow_label": "Ambient Aurora Glow", "themes": {"cyber": "Cyber Neon", "nebula": "Deep Nebula", "amber": "Sunset Amber", "light": "Crystal Light", "sunset": "Sunset Amber"}}, "layout": {"edit_mode_title": "Dashboard Edit Mode", "edit_mode_desc": "Enable to drag categories, reorder icons, edit or delete them.", "edit_mode_toggle": "Enable Edit Mode", "add_shortcut_btn": "➕ Add New Shortcut", "editing_active_badge": "Edit Mode Active", "reset_layout_title": "Reset Original Layout", "reset_layout_desc": "Extensively customized your dashboard? Start fresh anytime with the original factory layout and default shortcuts.", "reset_layout_btn": "🔄 Restore Factory Layout"}, "backup": {"export_title": "Export Configuration", "export_desc": "Download a JSON file containing all your shortcuts, custom layout, and preferences.", "export_btn": "📥 Download Backup (*.json)", "import_title": "Restore Configuration", "import_desc": "Load a previously exported JSON backup file.", "import_btn": "📤 Restore from File", "reset_title": "Factory Reset", "reset_desc": "Reset dashboard back to the original 45 default shortcuts.", "reset_btn": "⚠️ Reset to Default", "reset_confirm": "Are you sure you want to restore factory defaults? Customizations will be lost.", "import_success": "Backup successfully restored!", "import_error": "The backup file is invalid or corrupted."}, "profile": {"title": "User Profile", "desc": "Customize your name or alias for the Command Center and greetings:"}}, "shortcut_editor": {"add_title": "Add New Shortcut", "edit_title": "Edit Shortcut", "title_label": "Shortcut Name", "title_placeholder": "e.g. Notion, Figma, Spotify...", "url_label": "Target URL", "url_placeholder": "https://example.com", "category_label": "Bento Category", "icon_label": "Application Icon", "icon_preset": "Choose bundled icon:", "icon_custom": "Or custom icon URL:", "desc_label": "Description (for Tooltip)", "desc_placeholder": "Brief tool overview...", "tags_label": "Search Tags", "tags_placeholder": "comma separated (e.g. music, streaming)", "save_btn": "Save Shortcut", "delete_btn": "Delete Shortcut", "delete_confirm": "Are you sure you want to delete this shortcut?", "cancel_btn": "Cancel"}, "bangs": {"calc_title": "Calculation Result", "direct_search": "Search on {service}", "suggestions_title": "Quick Bang Commands"}, "widgets": {"scratchpad_title": "Glass Scratchpad", "scratchpad_placeholder": "Write thoughts, tasks or quick notes here...", "scratchpad_saved": "Auto-saved locally", "pomodoro_title": "Focus Timer", "pomodoro_focus": "Focus", "pomodoro_break": "Break", "pomodoro_start": "Start", "pomodoro_pause": "Pause", "pomodoro_reset": "Reset", "toggle_widgets_title": "Bento Mini-Widgets", "toggle_scratchpad": "Show Scratchpad", "toggle_pomodoro": "Show Pomodoro Timer", "scratchpad_pin": "Pin Post-it"}, "audio": {"preset_label": "Haptic Sound Preset", "preset_scifi": "Sci-Fi Soft Pop (Procedural)", "preset_mech": "Mechanical Switch Click", "preset_bubble": "Acoustic Bubble"}, "theme_studio": {"title": "Custom Theme Studio", "desc": "Customize accent colors and neon spotlight in real-time:", "primary_label": "Primary Accent Color:", "secondary_label": "Secondary Color:", "reset_colors_btn": "Reset Default Colors"}, "importer": {"title": "Import Browser Bookmarks", "desc": "Import a bookmarks.html file exported from Chrome, Firefox, Edge or Brave:", "select_file_btn": "📁 Select HTML File", "merge_mode": "Merge with my existing shortcuts", "replace_mode": "Replace all shortcuts", "import_btn": "Import Bookmarks", "success_msg": "Successfully imported {count} shortcuts!", "error_msg": "No valid bookmarks found in selected file."}}, "fr": {"brand_greeting": "Bienvenue au Centre de Commande", "greetings": {"morning": "Bonjour, HaDeS !", "afternoon": "Bon après-midi, HaDeS !", "night": "Bonsoir, HaDeS !"}, "controls": {"sound_title": "Effets sonores (Activé/Désactivé)", "theme_title": "Changer de Thème Visuel", "lang_title": "Changer de Langue", "cmdk_btn": "Rechercher", "cmdk_badge": "Ctrl K"}, "search": {"placeholder": "Rechercher avec {engine} ou filtrer les raccourcis...", "clear": "Effacer la recherche"}, "filters": {"all": "Tous", "ia_creativa": "IA & 3D", "arte_media": "Art & Multimédia", "productividad": "Google & Outils", "social_compras": "Social & Achats"}, "categories": {"cat_3d": "Modélisation 3D & IA", "cat_ai": "Intelligence Artificielle", "cat_art": "Art Numérique & Modèles", "cat_audio": "Génération Audio", "cat_google": "Google Workspace & IA", "cat_tools": "Outils & Développeur", "cat_social": "Communauté & Réseaux", "cat_shopping": "Achats & Paiements", "cat_video": "Vidéo & Génération IA"}, "badges": {"apps": "apps"}, "shortcuts": {"meshy": "Génération de modèles 3D et textures par IA à partir de texte ou image", "tripo3d": "Studio rapide pour générer des modèles 3D prêts pour la production", "ludoai": "Plateforme d'IA pour l'idéation et l'analyse de marché des jeux vidéo", "chatgpt": "Assistant conversationnel avancé et raisonnement avec GPT-4o", "deepseek": "Modèle d'IA de raisonnement profond et génération de code de haute précision", "claude": "Modèle d'IA d'Anthropic avec grande fenêtre de contexte et analyse de code", "qwen": "Modèles fondateurs et chat d'Alibaba Cloud (Qwen 2.5)", "seaverse": "Outils et générateurs d'IA pour mondes virtuels et multimédia", "civitai": "Dépôt communautaire de modèles, Checkpoints et LoRAs pour Stable Diffusion", "shakker": "Plateforme de génération et de fusion d'images haute définition par IA", "tensorart": "Générateur d'art en ligne avec crédits de création quotidiens gratuits", "seaart": "Studio de création et de rendu artistique assisté par IA", "shadertoy": "Plateforme pour programmer et partager des shaders GLSL en WebGL", "minimax": "Génération et clonage de voix ultra-réalistes par IA", "suno": "Composition musicale complète avec paroles et mélodie générées par IA", "elevenlabs": "Synthèse vocale de pointe et traduction audio multilingue", "google": "Moteur de recherche mondial et services intégrés de Google", "gmail": "Service de messagerie électronique sécurisé et synchronisé", "googledrive": "Stockage cloud et gestion collaborative de fichiers", "gemini": "Modèle multimodal de Google intégré à son écosystème", "googleaistudio": "Environnement de prototypage rapide avec les API Gemini", "notebooklm": "Carnet de notes intelligent avec résumés audio générés par IA", "birme": "Outil de redimensionnement et recadrage d'images par lots flexible", "photoroom": "Suppression professionnelle d'arrière-plan et retouche photo rapide", "github": "Plateforme de développement collaboratif et dépôts Git", "itchio": "Marché indépendant de jeux vidéo, assets, musique et sprites", "optimizeglb": "Compression Draco et optimisation de fichiers 3D GLB/glTF", "translate": "Traduction instantanée de textes et pages web en plusieurs langues", "instagram": "Réseau social pour partager photos, vidéos, stories et reels", "facebook": "Réseau social pour connecter avec amis, groupes et communautés", "x": "Réseau de microblogging pour actualités et tendances en temps réel", "tiktok": "Plateforme de vidéos courtes au format vertical", "threads": "Plateforme de microblogging et débat liée à Instagram", "patreon": "Abonnements et soutien participatif pour créateurs de contenu", "discord": "Serveurs de discussion textuelle, vocale et vidéo pour communautés", "linkedin": "Réseau social professionnel pour l'emploi et le networking", "exophase": "Suivi des succès, trophées et profils multi-plateformes de jeu", "amazon": "Boutique en ligne mondiale de produits avec livraison rapide", "aliexpress": "Plateforme d'achats en ligne avec prix directs d'usine", "pccomponentes": "Boutique spécialisée en informatique, hardware et technologie", "paypal": "Portefeuille numérique sécurisé et plateforme de paiement", "wallapop": "Plateforme d'achat et vente de produits d'occasion", "youtube": "Plateforme de streaming vidéo, tutoriels et diffusions en direct", "kling": "Génération de vidéos cinématographiques avec mouvements réalistes", "hedra": "Création d'avatars expressifs parlants et de personnages animés par IA"}, "no_results": {"title": "Aucun raccourci trouvé", "desc": "Essayez d'autres termes ou recherchez directement sur le Web en appuyant sur Entrée."}, "weather": {"title": "Configurer la Ville Météo", "desc": "Saisissez le nom de votre ville pour voir les prévisions en direct :", "input_placeholder": "Ex : Paris, Lyon, Montréal, Madrid...", "search_btn": "Chercher", "auto_btn": "Détecter automatiquement par IP", "loading": "Chargement...", "offline": "Hors ligne", "conditions": {"clear": "Ciel dégagé", "mostly_clear": "Généralement dégagé", "partly_cloudy": "Partiellement nuageux", "cloudy": "Couvert", "fog": "Brouillard", "drizzle": "Bruine légère", "rain": "Pluie", "heavy_rain": "Pluie battante", "snow": "Neige", "showers": "Averses de pluie", "snow_showers": "Averses de neige", "thunderstorm": "Orage", "hail_thunderstorm": "Orage avec grêle"}}, "cmdk": {"placeholder": "Rechercher un raccourci, un outil ou une commande rapide...", "direct_search_prefix": "Rechercher sur {engine} :", "direct_search_cat": "Recherche Web Directe", "action_open": "Ouvrir", "action_search": "Chercher", "tip_nav": "Naviguer", "tip_open": "Ouvrir le lien", "tip_close": "Fermer"}, "user_modal": {"title": "Changer de Nom d'Utilisateur", "desc": "Personnalisez le nom affiché dans le titre et les salutations de votre Centre de Commande :", "input_placeholder": "Votre nom ou pseudo...", "save_btn": "Enregistrer", "preview_label": "Aperçu :", "tooltip_title": "Cliquez pour changer votre nom d'utilisateur", "doc_title_suffix": "· Centre de Commande"}, "settings_hub": {"title": "Paramètres du Centre de Commande", "btn_title": "Configuration & Personnalisation", "tabs": {"appearance": "Apparence", "language": "Langue", "weather": "Météo", "layout": "Mise en page & Raccourcis", "backup": "Sauvegarde"}, "appearance": {"themes_label": "Thème Visuel", "sound_label": "Effets Sonores Haptiques", "glow_label": "Lueur Ambiante Aurora", "themes": {"cyber": "Cyber Neon", "nebula": "Deep Nebula", "amber": "Sunset Amber", "light": "Crystal Light", "sunset": "Sunset Amber"}}, "layout": {"edit_mode_title": "Mode Édition du Tableau", "edit_mode_desc": "Activez pour glisser les catégories, réorganiser les icônes, les modifier ou les supprimer.", "edit_mode_toggle": "Activer le Mode Édition", "add_shortcut_btn": "➕ Ajouter un Nouveau Raccourci", "editing_active_badge": "Mode Édition Activé", "reset_layout_title": "Réinitialiser la Disposition", "reset_layout_desc": "Vous avez beaucoup personnalisé votre tableau ? Repartez de zéro avec la disposition et les raccourcis d'usine.", "reset_layout_btn": "🔄 Restaurer la Disposition d'Usine"}, "backup": {"export_title": "Exporter la Configuration", "export_desc": "Téléchargez un fichier JSON avec tous vos raccourcis et préférences.", "export_btn": "📥 Télécharger la Sauvegarde (*.json)", "import_title": "Restaurer la Configuration", "import_desc": "Chargez un fichier de sauvegarde JSON préalablement exporté.", "import_btn": "📤 Restaurer depuis le Fichier", "reset_title": "Réinitialisation d'Usine", "reset_desc": "Restaure les 45 raccourcis originaux par défaut.", "reset_btn": "⚠️ Réinitialiser par Défaut", "reset_confirm": "Êtes-vous sûr de vouloir réinitialiser ? Les personnalisations seront perdues.", "import_success": "Sauvegarde restaurée avec succès !", "import_error": "Le fichier de sauvegarde est invalide ou corrompu."}, "profile": {"title": "Profil Utilisateur", "desc": "Personnalisez votre nom ou pseudo pour le Centre de Commande et les salutations :"}}, "shortcut_editor": {"add_title": "Ajouter un Nouveau Raccourci", "edit_title": "Modifier le Raccourci", "title_label": "Nom du Raccourci", "title_placeholder": "Ex : Notion, Figma, Spotify...", "url_label": "URL de Destination", "url_placeholder": "https://exemple.com", "category_label": "Catégorie Bento", "icon_label": "Icône de l'Application", "icon_preset": "Choisir une icône incluse :", "icon_custom": "Ou URL d'icône personnalisée :", "desc_label": "Description (pour le Tooltip)", "desc_placeholder": "Bref résumé de l'outil...", "tags_label": "Mots-clés de Recherche", "tags_placeholder": "séparés par des virgules (ex : musique, streaming)", "save_btn": "Enregistrer le Raccourci", "delete_btn": "Supprimer le Raccourci", "delete_confirm": "Êtes-vous sûr de vouloir supprimer ce raccourci ?", "cancel_btn": "Annuler"}, "bangs": {"calc_title": "Résultat du Calcul", "direct_search": "Rechercher sur {service}", "suggestions_title": "Commandes Bang Rapides"}, "widgets": {"scratchpad_title": "Bloc-notes Glass", "scratchpad_placeholder": "Écrivez vos idées ou notes rapides ici...", "scratchpad_saved": "Enregistré automatiquement", "pomodoro_title": "Minuteur Focus", "pomodoro_focus": "Concentration", "pomodoro_break": "Pause", "pomodoro_start": "Démarrer", "pomodoro_pause": "Pause", "pomodoro_reset": "Réinitialiser", "toggle_widgets_title": "Mini-Widgets Bento", "toggle_scratchpad": "Afficher le Bloc-notes", "toggle_pomodoro": "Afficher le Minuteur Pomodoro", "scratchpad_pin": "Épingler Post-it"}, "audio": {"preset_label": "Effet Sonore Haptique", "preset_scifi": "Sci-Fi Soft Pop (Synthétisé)", "preset_mech": "Clic Mécanique Tactile", "preset_bubble": "Bulle Acoustique"}, "theme_studio": {"title": "Studio de Thème Personnalisé", "desc": "Personnalisez les couleurs d'accent et les reflets néon en temps réel :", "primary_label": "Couleur Primaire (Accent) :", "secondary_label": "Couleur Secondaire :", "reset_colors_btn": "Réinitialiser les Couleurs"}, "importer": {"title": "Importer les Favoris du Navigateur", "desc": "Importez un fichier bookmarks.html exporté depuis Chrome, Firefox, Edge ou Brave :", "select_file_btn": "📁 Sélectionner un Fichier HTML", "merge_mode": "Fusionner avec mes raccourcis actuels", "replace_mode": "Remplacer tous les raccourcis", "import_btn": "Importer les Favoris", "success_msg": "{count} raccourcis importés avec succès !", "error_msg": "Aucun favori valide trouvé dans le fichier sélectionné."}}, "de": {"brand_greeting": "Willkommen im Kontrollzentrum", "greetings": {"morning": "Guten Morgen, HaDeS!", "afternoon": "Guten Tag, HaDeS!", "night": "Guten Abend, HaDeS!"}, "controls": {"sound_title": "Soundeffekte (Ein/Aus)", "theme_title": "Visuelles Design wechseln", "lang_title": "Sprache wechseln", "cmdk_btn": "Suchen", "cmdk_badge": "Ctrl K"}, "search": {"placeholder": "Mit {engine} suchen oder Verknüpfungen filtern...", "clear": "Suche löschen"}, "filters": {"all": "Alle", "ia_creativa": "KI & 3D", "arte_media": "Kunst & Medien", "productividad": "Google & Tools", "social_compras": "Social & Shopping"}, "categories": {"cat_3d": "3D-Modellierung & KI", "cat_ai": "Künstliche Intelligenz", "cat_art": "Digitale Kunst & Modelle", "cat_audio": "Audio-Generierung", "cat_google": "Google Workspace & KI", "cat_tools": "Tools & Entwickler", "cat_social": "Community & Soziales", "cat_shopping": "Shopping & Bezahlen", "cat_video": "Video & KI-Generierung"}, "badges": {"apps": "Apps"}, "shortcuts": {"meshy": "KI-gestützte Generierung von 3D-Modellen und Texturen aus Text oder Bild", "tripo3d": "Schnelles Studio zur Erstellung produktionsbereiter 3D-Modelle mit KI", "ludoai": "KI-Plattform für Spielideen, Marktanalysen und Videospielforschung", "chatgpt": "Fortschrittlicher KI-Assistent und logisches Denken mit GPT-4o", "deepseek": "Tiefgreifendes KI-Modell mit hoher Präzision bei der Codegenerierung", "claude": "Anthropics KI-Modell mit riesigem Kontextfenster und Codeanalyse", "qwen": "Basis-KI-Modelle und Chatbot von Alibaba Cloud (Qwen 2.5)", "seaverse": "KI-Tools und Generatoren für virtuelle Welten und Multimedia", "civitai": "Community-Repository für Modelle, Checkpoints und LoRAs für Stable Diffusion", "shakker": "Plattform zur hochauflösenden Bildgenerierung und KI-Bildfusion", "tensorart": "Online-Kunstgenerator mit kostenlosen täglichen Generierungsguthaben", "seaart": "KI-unterstütztes Studio für künstlerische Erstellung und Bildrendering", "shadertoy": "Plattform zum Programmieren, Visualisieren und Teilen von GLSL-Shadern in WebGL", "minimax": "Ultrarealistische Stimmengenerierung und Sprachklonung mit KI", "suno": "Vollständige Song- und Musikkomposition mit von KI erstellten Texten", "elevenlabs": "Branchenführende Sprachsynthese und mehrsprachige Audioübersetzung", "google": "Globale Websuchmaschine und integrierte Google-Dienste", "gmail": "Sicherer und synchronisierter E-Mail-Dienst von Google", "googledrive": "Cloud-Speicher und kollaborative Dateiverwaltung", "gemini": "Multimodales Google-KI-Modell im Arbeitsbereich-Ökosystem", "googleaistudio": "Schnelle Prototyping-Umgebung für Entwickler mit Gemini-APIs", "notebooklm": "Intelligentes Notizbuch mit KI-generierten Audio-Zusammenfassungen", "birme": "Flexibler Stapel-Bildverkleinerer und smarter Zuschnitt", "photoroom": "Professioneller Hintergrundentferner und schnelle Fotobearbeitung", "github": "Kollaborative Entwicklungsplattform und Git-Repositories", "itchio": "Indie-Marktplatz für Videospiele, Assets, Musik und Sprites", "optimizeglb": "Draco-Kompression und Optimierung für 3D-GLB/glTF-Dateien", "translate": "Sofortige Text- und Webseitenübersetzung in mehreren Sprachen", "instagram": "Soziales Netzwerk für Fotos, Videos, Stories und Reels", "facebook": "Soziales Netzwerk zum Verbinden mit Freunden, Gruppen und Communities", "x": "Echtzeit-Microblogging-Netzwerk für Nachrichten und globale Trends", "tiktok": "Plattform für kurze vertikale Videos und kreative Clips", "threads": "Konversations- und Microblogging-Plattform verknüpft mit Instagram", "patreon": "Abonnements und Mitgliedschaftsplattform für Content-Ersteller", "discord": "Sprach-, Video- und Text-Chatserver für Communities", "linkedin": "Professionelles soziales Netzwerk für Karriere und Networking", "exophase": "Gaming-Erfolgs-, Trophäen- und plattformübergreifendes Profil-Tracking", "amazon": "Globaler Online-Marktplatz mit schneller Produktlieferung", "aliexpress": "Online-Shopping-Plattform mit Artikeln zu Fabrikpreisen", "pccomponentes": "Fachgeschäft für Computer, Hardware und Technik", "paypal": "Sichere Online-Zahlungsplattform und digitale Geldbörse", "wallapop": "Marktplatz für den Kauf und Verkauf von gebrauchten Artikeln", "youtube": "Streaming-Videoplattform, Tutorials, Musik und Live-Übertragungen", "kling": "Kinoreife Videogenerierung mit realistischen Bewegungen durch KI", "hedra": "Erstellung sprechender Avatare und animierter Charaktere mit KI"}, "no_results": {"title": "Keine Verknüpfungen gefunden", "desc": "Versuchen Sie andere Suchbegriffe oder drücken Sie Enter, um direkt im Web zu suchen."}, "weather": {"title": "Wetter-Stadt konfigurieren", "desc": "Geben Sie den Namen Ihrer Stadt ein, um die Live-Wettervorhersage zu sehen:", "input_placeholder": "z. B. Berlin, Wien, Zürich, München...", "search_btn": "Suchen", "auto_btn": "Automatisch über IP ermitteln", "loading": "Laden...", "offline": "Offline", "conditions": {"clear": "Klarer Himmel", "mostly_clear": "Überwiegend klar", "partly_cloudy": "Teilweise bewölkt", "cloudy": "Bedeckt", "fog": "Nebel", "drizzle": "Leichter Nieselregen", "rain": "Regen", "heavy_rain": "Starker Regen", "snow": "Schnee", "showers": "Regenschauer", "snow_showers": "Schneeschauer", "thunderstorm": "Gewitter", "hail_thunderstorm": "Gewitter mit Hagel"}}, "cmdk": {"placeholder": "Verknüpfung, Tool oder Schnellbefehl suchen...", "direct_search_prefix": "Auf {engine} suchen:", "direct_search_cat": "Direkte Websuche", "action_open": "Öffnen", "action_search": "Suchen", "tip_nav": "Navigieren", "tip_open": "Link öffnen", "tip_close": "Schließen"}, "user_modal": {"title": "Benutzername ändern", "desc": "Passen Sie den Namen an, der im Titel und in den Begrüßungen Ihres Kontrollzentrums angezeigt wird:", "input_placeholder": "Ihr Name oder Pseudonym...", "save_btn": "Speichern", "preview_label": "Vorschau:", "tooltip_title": "Klicken, um Ihren Benutzernamen zu ändern", "doc_title_suffix": "· Kontrollzentrum"}, "settings_hub": {"title": "Kontrollzentrum Einstellungen", "btn_title": "Konfiguration & Anpassung", "tabs": {"appearance": "Erscheinungsbild", "language": "Sprache", "weather": "Wetter", "layout": "Layout & Verknüpfungen", "backup": "Sicherung & Wiederherstellung"}, "appearance": {"themes_label": "Visuelles Design", "sound_label": "Haptische Soundeffekte", "glow_label": "Ambientes Aurora-Leuchten", "themes": {"cyber": "Cyber Neon", "nebula": "Deep Nebula", "amber": "Sunset Amber", "light": "Crystal Light", "sunset": "Sunset Amber"}}, "layout": {"edit_mode_title": "Dashboard-Bearbeitungsmodus", "edit_mode_desc": "Aktivieren, um Kategorien zu ziehen, Symbole neu anzuordnen, zu bearbeiten oder zu löschen.", "edit_mode_toggle": "Bearbeitungsmodus aktivieren", "add_shortcut_btn": "➕ Neue Verknüpfung hinzufügen", "editing_active_badge": "Bearbeitungsmodus Aktiv", "reset_layout_title": "Ursprüngliches Layout wiederherstellen", "reset_layout_desc": "Haben Sie Ihr Dashboard stark angepasst? Fangen Sie jederzeit mit dem ursprünglichen Werkslayout und den Standardverknüpfungen von vorne an.", "reset_layout_btn": "🔄 Werkslayout wiederherstellen"}, "backup": {"export_title": "Konfiguration exportieren", "export_desc": "Laden Sie eine JSON-Datei mit all Ihren Verknüpfungen und Einstellungen herunter.", "export_btn": "📥 Sicherung herunterladen (*.json)", "import_title": "Konfiguration wiederherstellen", "import_desc": "Laden Sie eine zuvor exportierte JSON-Sicherungsdatei.", "import_btn": "📤 Aus Datei wiederherstellen", "reset_title": "Werkseinstellungen", "reset_desc": "Stellt die ursprünglichen 45 Standard-Verknüpfungen wieder her.", "reset_btn": "⚠️ Auf Standard zurücksetzen", "reset_confirm": "Möchten Sie wirklich die Werkseinstellungen wiederherstellen?", "import_success": "Sicherung erfolgreich wiederhergestellt!", "import_error": "Die Sicherungsdatei ist ungültig oder beschädigt."}, "profile": {"title": "Benutzerprofil", "desc": "Passen Sie Ihren Namen oder Alias für das Command Center und die Begrüßungen an:"}}, "shortcut_editor": {"add_title": "Neue Verknüpfung hinzufügen", "edit_title": "Verknüpfung bearbeiten", "title_label": "Name der Verknüpfung", "title_placeholder": "z. B. Notion, Figma, Spotify...", "url_label": "Ziel-URL", "url_placeholder": "https://beispiel.com", "category_label": "Bento-Kategorie", "icon_label": "Anwendungssymbol", "icon_preset": "Enthaltenes Symbol wählen:", "icon_custom": "Oder benutzerdefinierte Symbol-URL:", "desc_label": "Beschreibung (für Tooltip)", "desc_placeholder": "Kurze Übersicht über das Tool...", "tags_label": "Suchbegriffe", "tags_placeholder": "kommagetrennt (z. B. Musik, Streaming)", "save_btn": "Verknüpfung speichern", "delete_btn": "Verknüpfung löschen", "delete_confirm": "Möchten Sie diese Verknüpfung wirklich löschen?", "cancel_btn": "Abbrechen"}, "bangs": {"calc_title": "Berechnungsergebnis", "direct_search": "Auf {service} suchen", "suggestions_title": "Schnelle Bang-Befehle"}, "widgets": {"scratchpad_title": "Glass-Notizblock", "scratchpad_placeholder": "Gedanken, Aufgaben oder schnelle Notizen hier schreiben...", "scratchpad_saved": "Automatisch gespeichert", "pomodoro_title": "Fokus-Timer", "pomodoro_focus": "Fokus", "pomodoro_break": "Pause", "pomodoro_start": "Starten", "pomodoro_pause": "Pause", "pomodoro_reset": "Zurücksetzen", "toggle_widgets_title": "Bento Mini-Widgets", "toggle_scratchpad": "Notizblock anzeigen", "toggle_pomodoro": "Pomodoro-Timer anzeigen", "scratchpad_pin": "Post-it anheften"}, "audio": {"preset_label": "Haptischer Sound-Effekt", "preset_scifi": "Sci-Fi Soft Pop (Synthetisiert)", "preset_mech": "Mechanischer Klick", "preset_bubble": "Akustische Blase"}, "theme_studio": {"title": "Individuelles Theme-Studio", "desc": "Akzentfarben und Neon-Leuchten in Echtzeit anpassen:", "primary_label": "Primäre Akzentfarbe:", "secondary_label": "Sekundärfarbe:", "reset_colors_btn": "Standardfarben wiederherstellen"}, "importer": {"title": "Browser-Lesezeichen importieren", "desc": "Importieren Sie eine aus Chrome, Firefox, Edge oder Brave exportierte bookmarks.html-Datei:", "select_file_btn": "📁 HTML-Datei auswählen", "merge_mode": "Mit meinen vorhandenen Verknüpfungen zusammenführen", "replace_mode": "Alle Verknüpfungen ersetzen", "import_btn": "Lesezeichen importieren", "success_msg": "Erfolgreich {count} Verknüpfungen importiert!", "error_msg": "Keine gültigen Lesezeichen in der ausgewählten Datei gefunden."}}};

const getTranslation = (path, lang = state.language) => {
    const dict = i18nDictionaries[lang] || i18nDictionaries.es;
    const keys = path.split('.');
    let current = dict;
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            let fallback = i18nDictionaries.es;
            for (const fKey of keys) {
                if (fallback && typeof fallback === 'object' && fKey in fallback) {
                    fallback = fallback[fKey];
                } else {
                    return null;
                }
            }
            return fallback;
        }
    }
    return current;
};

const updateDocumentLocalization = () => {
    const lang = state.language;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const trans = getTranslation(key, lang);
        if (trans && typeof trans === 'string') {
            el.textContent = trans;
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const trans = getTranslation(key, lang);
        if (trans && typeof trans === 'string') {
            el.placeholder = trans;
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const trans = getTranslation(key, lang);
        if (trans && typeof trans === 'string') {
            el.title = trans;
        }
    });
};

async function loadLocaleAsync(lang) {
    if (i18nDictionaries[lang]) return i18nDictionaries[lang];
    try {
        const res = await fetch(`./locales/${lang}.json`);
        if (res.ok) {
            const data = await res.json();
            i18nDictionaries[lang] = data;
            return data;
        }
    } catch (e) {}
    return i18nDictionaries.es;
}


// --- Module: js/audio.js ---
// js/audio.js - Procedural Web Audio API Sound Synthesizer (0 KB, Zero Latency)


class AudioSynthesizer {
    constructor() {
        this.ctx = null;
        this.preset = localStorage.getItem('sound_preset') || 'scifi';
    }

    getAudioContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    setPreset(preset) {
        this.preset = preset;
        localStorage.setItem('sound_preset', preset);
    }

    play(type = 'hover') {
        if (!state.soundEnabled) return;
        const ctx = this.getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'hover') {
            if (this.preset === 'scifi') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.exponentialRampToValueAtTime(980, now + 0.05);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (this.preset === 'mech') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(280, now);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
            } else {
                // bubble
                osc.type = 'sine';
                osc.frequency.setValueAtTime(700, now);
                osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                osc.start(now);
                osc.stop(now + 0.06);
            }
        } else if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(380, now);
            osc.frequency.exponentialRampToValueAtTime(760, now + 0.07);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            osc.start(now);
            osc.stop(now + 0.07);
        } else if (type === 'chime') {
            this.playTone(523.25, 0.4, 0.25, 0);   // C5
            this.playTone(659.25, 0.5, 0.25, 0.1); // E5
            this.playTone(783.99, 0.7, 0.3, 0.2);  // G5
        }
    }

    playTone(freq, duration, volume, delay = 0) {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }
}

const soundFx = new AudioSynthesizer();


// --- Module: js/ambient-audio.js ---
// js/ambient-audio.js - Procedural Web Audio API Ambient Focus Generator (0 KB, 100% Offline)


class AmbientSoundEngine {
    constructor() {
        this.ctx = null;
        this.currentPreset = localStorage.getItem('ambient_preset_v1') || 'rain';
        this.volume = parseFloat(localStorage.getItem('ambient_volume_v1') || '0.5');
        this.isPlaying = false;
        this.activeNodes = [];
        this.masterGain = null;

        this.card = document.getElementById('widget-ambient-card');
        this.playBtn = document.getElementById('ambient-play-btn');
        this.playIcon = document.getElementById('ambient-play-icon');
        this.playText = document.getElementById('ambient-play-text');
        this.chips = document.querySelectorAll('.ambient-chip');
        this.slider = document.getElementById('ambient-volume-slider');
        this.volDisplay = document.getElementById('ambient-vol-val');
    }

    init() {
        this.syncUI();
        this.bindEvents();
    }

    getAudioContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    syncUI() {
        if (this.slider) this.slider.value = Math.round(this.volume * 100);
        if (this.volDisplay) this.volDisplay.textContent = `${Math.round(this.volume * 100)}%`;
        if (this.chips) {
            this.chips.forEach(chip => {
                chip.classList.toggle('active', chip.getAttribute('data-preset') === this.currentPreset);
            });
        }
        this.updatePlayBtnVisuals();
    }

    updatePlayBtnVisuals() {
        if (this.playIcon) this.playIcon.textContent = this.isPlaying ? '⏸' : '▶';
        if (this.playText) this.playText.textContent = this.isPlaying ? 'Pausar' : 'Reproducir';
        if (this.card) this.card.classList.toggle('is-playing', this.isPlaying);
    }

    setPreset(preset) {
        soundFx.play('click');
        this.currentPreset = preset;
        localStorage.setItem('ambient_preset_v1', preset);
        this.syncUI();
        if (this.isPlaying) {
            this.stopNodes();
            this.startPreset(preset);
        }
    }

    setVolume(volFloat) {
        this.volume = Math.max(0, Math.min(1, volFloat));
        localStorage.setItem('ambient_volume_v1', this.volume.toString());
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
        }
        if (this.volDisplay) this.volDisplay.textContent = `${Math.round(this.volume * 100)}%`;
    }

    toggle() {
        soundFx.play('click');
        this.isPlaying ? this.stop() : this.play();
    }

    play() {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        this.stopNodes();
        this.masterGain = ctx.createGain();
        this.masterGain.gain.setValueAtTime(0, ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(this.volume, ctx.currentTime + 0.3);
        this.masterGain.connect(ctx.destination);

        this.startPreset(this.currentPreset);
        this.isPlaying = true;
        this.updatePlayBtnVisuals();
    }

    stop() {
        if (!this.isPlaying) return;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
            setTimeout(() => {
                this.stopNodes();
                this.isPlaying = false;
                this.updatePlayBtnVisuals();
            }, 350);
        } else {
            this.stopNodes();
            this.isPlaying = false;
            this.updatePlayBtnVisuals();
        }
    }

    stopNodes() {
        this.activeNodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                node.disconnect();
            } catch (e) {}
        });
        this.activeNodes = [];
    }

    startPreset(preset) {
        const ctx = this.getAudioContext();
        if (!ctx || !this.masterGain) return;
        if (preset === 'rain') this.buildRain(ctx);
        else if (preset === 'space') this.buildSpace(ctx);
        else if (preset === 'binaural') this.buildBinaural(ctx);
        else if (preset === 'waves') this.buildWaves(ctx);
    }

    buildRain(ctx) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, ctx.currentTime);

        noise.connect(filter);
        filter.connect(this.masterGain);
        noise.start();
        this.activeNodes.push(noise, filter);
    }

    buildSpace(ctx) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buf.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < data.length; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }

        const brown = ctx.createBufferSource();
        brown.buffer = buf;
        brown.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, ctx.currentTime);

        brown.connect(filter);
        filter.connect(this.masterGain);
        brown.start();
        this.activeNodes.push(brown, filter);
    }

    buildBinaural(ctx) {
        const oscL = ctx.createOscillator(), oscR = ctx.createOscillator();
        oscL.type = 'sine'; oscR.type = 'sine';
        oscL.frequency.setValueAtTime(432, ctx.currentTime);
        oscR.frequency.setValueAtTime(440, ctx.currentTime);

        const panL = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
        const panR = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
        if (panL.pan) panL.pan.setValueAtTime(-0.8, ctx.currentTime);
        if (panR.pan) panR.pan.setValueAtTime(0.8, ctx.currentTime);

        const gainL = ctx.createGain(), gainR = ctx.createGain();
        gainL.gain.setValueAtTime(0.18, ctx.currentTime);
        gainR.gain.setValueAtTime(0.18, ctx.currentTime);

        oscL.connect(gainL); gainL.connect(panL); panL.connect(this.masterGain);
        oscR.connect(gainR); gainR.connect(panR); panR.connect(this.masterGain);
        oscL.start(); oscR.start();

        this.activeNodes.push(oscL, oscR, gainL, gainR, panL, panR);
    }

    buildWaves(ctx) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < data.length; i++) {
            const w = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + w * 0.0555179;
            b1 = 0.99332 * b1 + w * 0.0750759;
            b2 = 0.96900 * b2 + w * 0.1538520;
            data[i] = (b0 + b1 + b2) * 0.7;
        }

        const pink = ctx.createBufferSource();
        pink.buffer = buf;
        pink.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.1, ctx.currentTime);

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(250, ctx.currentTime);
        filter.frequency.setValueAtTime(350, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        pink.connect(filter);
        filter.connect(this.masterGain);
        pink.start();
        lfo.start();

        this.activeNodes.push(pink, filter, lfo, lfoGain);
    }

    bindEvents() {
        if (this.playBtn) this.playBtn.addEventListener('click', () => this.toggle());
        if (this.chips) {
            this.chips.forEach(chip => {
                chip.addEventListener('click', () => {
                    const preset = chip.getAttribute('data-preset');
                    if (preset) this.setPreset(preset);
                });
            });
        }
        if (this.slider) {
            this.slider.addEventListener('input', (e) => {
                this.setVolume(parseInt(e.target.value, 10) / 100);
            });
        }
    }
}

const ambientAudio = new AmbientSoundEngine();


// --- Module: js/bangs.js ---
// js/bangs.js - Bang Query Parser & Zero-Eval CSP-Compliant Math Evaluator

const BANGS_MAP = {
    '!yt': { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=' },
    '!gh': { name: 'GitHub', url: 'https://github.com/search?q=' },
    '!w': { name: 'Wikipedia', url: 'https://es.wikipedia.org/wiki/Special:Search?search=' },
    '!r': { name: 'Reddit', url: 'https://www.reddit.com/search/?q=' },
    '!m': { name: 'Google Maps', url: 'https://www.google.com/maps/search/' },
    '!civitai': { name: 'Civitai', url: 'https://civitai.com/?query=' },
    '!tr': { name: 'Traductor', url: 'https://translate.google.com/?text=' },
    '!npm': { name: 'NPM', url: 'https://www.npmjs.com/search?q=' },
    '!ddg': { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
    '!uuid': { name: 'UUID Generator', isDevTool: true },
    '!qr': { name: 'QR Code Generator', isDevTool: true },
    '!color': { name: 'Color Converter', isDevTool: true },
    '!b64': { name: 'Base64 Encode', isDevTool: true },
    '!b64d': { name: 'Base64 Decode', isDevTool: true },
    '!epoch': { name: 'Epoch Time Converter', isDevTool: true },
    '!time': { name: 'Date & Time', isDevTool: true }
};

const parseBangQuery = (rawQuery) => {
    const trimmed = rawQuery.trim();
    const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
    if (BANGS_MAP[firstWord]) {
        const queryRest = trimmed.slice(firstWord.length).trim();
        return {
            isBang: true,
            bang: firstWord,
            service: BANGS_MAP[firstWord].name,
            targetUrl: queryRest ? `${BANGS_MAP[firstWord].url}${encodeURIComponent(queryRest)}` : BANGS_MAP[firstWord].url.split('?')[0],
            query: queryRest
        };
    }
    return { isBang: false };
};

// Pure Recursive-Descent Math Parser (100% CSP Safe: Zero eval, Zero new Function)
const evaluateArithmetic = (expression) => {
    const sanitized = expression.trim().replace(/,/g, '.');
    if (!/^[0-9\.\+\-\*/\%\^\(\)\s]+$/.test(sanitized)) return null;
    if (!/[\+\-\*/\%\^]/.test(sanitized)) return null;

    try {
        let pos = 0;
        const str = sanitized.replace(/\s+/g, '');

        const peek = () => str[pos];
        const get = () => str[pos++];

        const parseNumber = () => {
            let start = pos;
            if (peek() === '-' || peek() === '+') get();
            while (pos < str.length && /[0-9\.]/.test(peek())) get();
            const numStr = str.slice(start, pos);
            const val = parseFloat(numStr);
            if (isNaN(val)) throw new Error('Invalid number');
            return val;
        };

        const parseFactor = () => {
            if (peek() === '(') {
                get(); // consume '('
                const val = parseExpression();
                if (get() !== ')') throw new Error('Missing closing parenthesis');
                return val;
            }
            return parseNumber();
        };

        const parseExponent = () => {
            let val = parseFactor();
            while (pos < str.length && peek() === '^') {
                get();
                val = Math.pow(val, parseFactor());
            }
            return val;
        };

        const parseTerm = () => {
            let val = parseExponent();
            while (pos < str.length && (peek() === '*' || peek() === '/' || peek() === '%')) {
                const op = get();
                const next = parseExponent();
                if (op === '*') val *= next;
                else if (op === '/') {
                    if (next === 0) throw new Error('Division by zero');
                    val /= next;
                } else if (op === '%') {
                    val %= next;
                }
            }
            return val;
        };

        const parseExpression = () => {
            let val = parseTerm();
            while (pos < str.length && (peek() === '+' || peek() === '-')) {
                const op = get();
                const next = parseTerm();
                if (op === '+') val += next;
                else if (op === '-') val -= next;
            }
            return val;
        };

        const result = parseExpression();
        if (pos < str.length) return null; // Trailing unparsed tokens
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            return Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, '');
        }
    } catch (e) {}
    return null;
};


// --- Module: js/devtools.js ---
// js/devtools.js - Built-in DevTools Omnibox Engine & QR Code Visualizer


class DevToolsEngine {
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

const devTools = new DevToolsEngine();


// --- Module: js/weather.js ---
// js/weather.js - Clock & Weather Engine


class WeatherEngine {
    constructor() {
        this.liveTimeEl = document.getElementById('live-time');
        this.liveDateEl = document.getElementById('live-date');
        this.greetingTextEl = document.getElementById('greeting-text');
        this.weatherWidget = document.getElementById('weather-widget');
        this.weatherTempEl = document.getElementById('weather-temp');
        this.weatherCityEl = document.getElementById('weather-city');
        this.weatherIconEl = document.getElementById('weather-icon');
        this.weatherConditionEl = document.getElementById('weather-condition');
        this.weatherModal = document.getElementById('weather-modal');
        this.closeWeatherModalBtn = document.getElementById('close-weather-modal');
        this.weatherCityInput = document.getElementById('weather-city-input');
        this.weatherSearchBtn = document.getElementById('weather-search-btn');
        this.weatherCityResults = document.getElementById('weather-city-results');
        this.weatherAutoBtn = document.getElementById('weather-auto-btn');
        this.lastWeather = null;
    }

    init() {
        this.updateClockAndGreeting();
        this.scheduleMinuteSync();
        this.detectLocationAndWeather();
        this.bindModalEvents();
        setInterval(() => this.detectLocationAndWeather(), 15 * 60 * 1000);

        state.on('language:changed', () => {
            this.updateClockAndGreeting();
            if (this.lastWeather) {
                this.renderWeatherUI(this.lastWeather.city, this.lastWeather.temp, this.lastWeather.code, this.lastWeather.isDay);
            }
        });
        state.on('username:changed', () => this.updateClockAndGreeting());
    }

    updateClockAndGreeting() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        if (this.liveTimeEl) this.liveTimeEl.textContent = `${hours}:${minutes}`;

        // Localized Date Format
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        const localeMap = { es: 'es-ES', en: 'en-US', fr: 'fr-FR', de: 'de-DE' };
        if (this.liveDateEl) {
            const dateStr = now.toLocaleDateString(localeMap[state.language] || 'es-ES', options);
            this.liveDateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        }

        // Localized Contextual Greeting
        const t = i18nDictionaries[state.language] || i18nDictionaries.es;
        const hour = now.getHours();
        let greeting = t.brand_greeting;
        const uName = state.userName || 'HaDeS';
        if (hour >= 6 && hour < 13) {
            greeting = t.greetings.morning.replace('HaDeS', uName);
        } else if (hour >= 13 && hour < 21) {
            greeting = t.greetings.afternoon.replace('HaDeS', uName);
        } else {
            greeting = t.greetings.night.replace('HaDeS', uName);
        }
        if (this.greetingTextEl) this.greetingTextEl.textContent = greeting;
    }

    scheduleMinuteSync() {
        const now = new Date();
        const msToNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50;
        setTimeout(() => {
            this.updateClockAndGreeting();
            this.scheduleMinuteSync();
        }, msToNext);
    }

    getWeatherInfo(code, isDay) {
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).weather.conditions;
        switch (code) {
            case 0: return { desc: t.clear, icon: isDay ? '☀️' : '🌙' };
            case 1: return { desc: t.mostly_clear, icon: isDay ? '🌤️' : '🌙' };
            case 2: return { desc: t.partly_cloudy, icon: isDay ? '⛅' : '☁️' };
            case 3: return { desc: t.cloudy, icon: '☁️' };
            case 45: case 48: return { desc: t.fog, icon: '🌫️' };
            case 51: case 53: case 55: return { desc: t.drizzle, icon: '🌦️' };
            case 61: case 63: return { desc: t.rain, icon: '🌧️' };
            case 65: return { desc: t.heavy_rain, icon: '🌧️' };
            case 71: case 73: case 75: case 77: return { desc: t.snow, icon: '❄️' };
            case 80: case 81: case 82: return { desc: t.showers, icon: '🌧️' };
            case 85: case 86: return { desc: t.snow_showers, icon: '🌨️' };
            case 95: return { desc: t.thunderstorm, icon: '⛈️' };
            case 96: case 99: return { desc: t.hail_thunderstorm, icon: '⛈️' };
            default: return { desc: t.clear, icon: isDay ? '☀️' : '🌙' };
        }
    }

    renderWeatherUI(city, temp, code, isDay) {
        this.lastWeather = { city, temp, code, isDay };
        if (this.weatherCityEl) this.weatherCityEl.textContent = city;
        if (this.weatherTempEl) this.weatherTempEl.textContent = `${Math.round(temp)}°C`;
        const info = this.getWeatherInfo(code, isDay);
        if (this.weatherIconEl) this.weatherIconEl.textContent = info.icon;
        if (this.weatherConditionEl) this.weatherConditionEl.textContent = info.desc;
    }

    async fetchWeatherForCoords(lat, lon, cityName) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
            const res = await fetch(url);
            const data = await res.json();
            if (data && data.current) {
                const temp = data.current.temperature_2m;
                const code = data.current.weather_code;
                const isDay = data.current.is_day === 1;
                this.renderWeatherUI(cityName, temp, code, isDay);
                localStorage.setItem('weather_cache_v2', JSON.stringify({
                    city: cityName, temp, code, isDay, timestamp: Date.now()
                }));
            }
        } catch (e) {}
    }

    async detectLocationAndWeather() {
        const manualCity = localStorage.getItem('weather_manual_city');
        if (manualCity) {
            try {
                const parsed = JSON.parse(manualCity);
                if (parsed.lat && parsed.lon) {
                    await this.fetchWeatherForCoords(parsed.lat, parsed.lon, parsed.name || 'Mi Ciudad');
                    return;
                }
            } catch (e) {}
        }

        let detectedCity = 'Vigo';
        let detectedLat = 42.2328;
        let detectedLon = -8.7226;
        let resolved = false;

        try {
            const ipRes = await fetch('https://ipwho.is/');
            const ipData = await ipRes.json();
            if (ipData && ipData.success !== false && ipData.latitude) {
                detectedCity = ipData.city || 'Tu Zona';
                detectedLat = ipData.latitude;
                detectedLon = ipData.longitude;
                resolved = true;
            }
        } catch (e) {}

        if (!resolved) {
            try {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';
                const parts = tz.split('/');
                const tzCity = (parts[1] || 'Madrid').replace(/_/g, ' ');
                const geoSearchRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(tzCity)}&count=1&language=es&format=json`);
                const geoSearchData = await geoSearchRes.json();
                if (geoSearchData.results && geoSearchData.results.length > 0) {
                    detectedCity = geoSearchData.results[0].name;
                    detectedLat = geoSearchData.results[0].latitude;
                    detectedLon = geoSearchData.results[0].longitude;
                    resolved = true;
                }
            } catch (e) {}
        }

        await this.fetchWeatherForCoords(detectedLat, detectedLon, detectedCity);
    }

    bindModalEvents() {
        const openModal = () => {
            if (!this.weatherModal) return;
            this.weatherModal.classList.remove('hidden');
            if (this.weatherCityInput) {
                this.weatherCityInput.value = '';
                this.weatherCityInput.focus();
            }
            if (this.weatherCityResults) {
                this.weatherCityResults.classList.add('hidden');
                this.weatherCityResults.innerHTML = '';
            }
        };

        const closeModal = () => {
            if (this.weatherModal) this.weatherModal.classList.add('hidden');
        };

        if (this.weatherWidget) {
            this.weatherWidget.addEventListener('click', openModal);
            this.weatherWidget.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openModal();
                }
            });
        }

        if (this.closeWeatherModalBtn) this.closeWeatherModalBtn.addEventListener('click', closeModal);
        if (this.weatherModal) {
            this.weatherModal.addEventListener('click', (e) => {
                if (e.target === this.weatherModal) closeModal();
            });
        }

        const searchCity = async () => {
            if (!this.weatherCityInput) return;
            const query = this.weatherCityInput.value.trim();
            if (!query) return;

            if (this.weatherSearchBtn) this.weatherSearchBtn.textContent = '...';
            try {
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json`);
                const data = await res.json();
                if (this.weatherCityResults) {
                    this.weatherCityResults.innerHTML = '';
                    if (data.results && data.results.length > 0) {
                        data.results.forEach(loc => {
                            const item = document.createElement('div');
                            item.className = 'weather-city-item';
                            const admin = loc.admin1 ? `${loc.admin1}, ` : '';
                            item.innerHTML = `
                                <span>📍 <strong>${escapeHtml(loc.name)}</strong></span>
                                <span class="weather-city-country">${escapeHtml(admin)}${escapeHtml(loc.country || '')}</span>
                            `;
                            item.addEventListener('click', async () => {
                                localStorage.setItem('weather_manual_city', JSON.stringify({
                                    name: loc.name,
                                    lat: loc.latitude,
                                    lon: loc.longitude
                                }));
                                localStorage.removeItem('weather_cache_v2');
                                await this.fetchWeatherForCoords(loc.latitude, loc.longitude, loc.name);
                                closeModal();
                            });
                            this.weatherCityResults.appendChild(item);
                        });
                        this.weatherCityResults.classList.remove('hidden');
                    } else {
                        this.weatherCityResults.innerHTML = '<div style="padding: 8px 12px; font-size: 0.82rem; color: var(--text-muted); text-align: center;">No se encontraron ciudades.</div>';
                        this.weatherCityResults.classList.remove('hidden');
                    }
                }
            } catch (err) {
                if (this.weatherCityResults) {
                    this.weatherCityResults.innerHTML = '<div style="padding: 8px 12px; font-size: 0.82rem; color: #ff6b6b; text-align: center;">Error al buscar ciudad.</div>';
                    this.weatherCityResults.classList.remove('hidden');
                }
            } finally {
                if (this.weatherSearchBtn) this.weatherSearchBtn.textContent = 'Buscar';
            }
        };

        if (this.weatherSearchBtn) this.weatherSearchBtn.addEventListener('click', searchCity);
        if (this.weatherCityInput) {
            this.weatherCityInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchCity();
                }
            });
        }

        if (this.weatherAutoBtn) {
            this.weatherAutoBtn.addEventListener('click', async () => {
                localStorage.removeItem('weather_manual_city');
                localStorage.removeItem('weather_cache_v2');
                await this.detectLocationAndWeather();
                closeModal();
            });
        }
    }
}



// --- Module: js/widgets.js ---
// js/widgets.js - Modular Bento Widgets (Scratchpad Notes & Pomodoro Focus Timer)


class WidgetsManager {
    constructor() {
        this.scratchpadText = localStorage.getItem('bento_scratchpad_notes') || '';
        this.pomodoroState = {
            duration: 25 * 60,
            remaining: 25 * 60,
            mode: 'focus', // 'focus' or 'break'
            isRunning: false,
            timerId: null
        };
    }

    init() {
        this.bindScratchpad();
        this.bindPomodoro();
        state.on('language:changed', () => this.updateWidgetLocalization());
    }

    bindScratchpad() {
        const textarea = document.getElementById('scratchpad-input');
        if (!textarea) return;

        textarea.value = this.scratchpadText;
        textarea.addEventListener('input', () => {
            this.scratchpadText = textarea.value;
            localStorage.setItem('bento_scratchpad_notes', this.scratchpadText);
        });
    }

    bindPomodoro() {
        const startBtn = document.getElementById('pomodoro-start-btn');
        const resetBtn = document.getElementById('pomodoro-reset-btn');
        const modePill = document.getElementById('pomodoro-mode-badge');
        const display = document.getElementById('pomodoro-time-display');

        if (!startBtn || !resetBtn) return;

        this.updatePomodoroDisplay();

        startBtn.addEventListener('click', () => {
            soundFx.play('click');
            if (this.pomodoroState.isRunning) {
                this.pausePomodoro();
                startBtn.textContent = this.getLabel('start');
            } else {
                this.startPomodoro();
                startBtn.textContent = this.getLabel('pause');
            }
        });

        resetBtn.addEventListener('click', () => {
            soundFx.play('click');
            this.resetPomodoro();
            startBtn.textContent = this.getLabel('start');
        });
    }

    startPomodoro() {
        this.pomodoroState.isRunning = true;
        this.pomodoroState.timerId = setInterval(() => {
            this.pomodoroState.remaining--;
            if (this.pomodoroState.remaining <= 0) {
                soundFx.play('chime');
                if (this.pomodoroState.mode === 'focus') {
                    this.pomodoroState.mode = 'break';
                    this.pomodoroState.duration = 5 * 60;
                    this.pomodoroState.remaining = 5 * 60;
                } else {
                    this.pomodoroState.mode = 'focus';
                    this.pomodoroState.duration = 25 * 60;
                    this.pomodoroState.remaining = 25 * 60;
                }
            }
            this.updatePomodoroDisplay();
        }, 1000);
    }

    pausePomodoro() {
        this.pomodoroState.isRunning = false;
        if (this.pomodoroState.timerId) {
            clearInterval(this.pomodoroState.timerId);
            this.pomodoroState.timerId = null;
        }
    }

    resetPomodoro() {
        this.pausePomodoro();
        this.pomodoroState.mode = 'focus';
        this.pomodoroState.duration = 25 * 60;
        this.pomodoroState.remaining = 25 * 60;
        this.updatePomodoroDisplay();
    }

    updatePomodoroDisplay() {
        const display = document.getElementById('pomodoro-time-display');
        const modeBadge = document.getElementById('pomodoro-mode-badge');
        const progressRing = document.getElementById('pomodoro-progress-circle');

        const m = Math.floor(this.pomodoroState.remaining / 60);
        const s = this.pomodoroState.remaining % 60;
        const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        if (display) display.textContent = timeStr;
        if (modeBadge) {
            modeBadge.textContent = this.pomodoroState.mode === 'focus' ? this.getLabel('focus') : this.getLabel('break');
            modeBadge.className = `pomodoro-badge ${this.pomodoroState.mode}`;
        }

        if (progressRing) {
            const total = this.pomodoroState.duration;
            const progress = (total - this.pomodoroState.remaining) / total;
            const circumference = 2 * Math.PI * 36;
            progressRing.style.strokeDasharray = `${circumference}`;
            progressRing.style.strokeDashoffset = `${circumference * (1 - progress)}`;
        }
    }

    getLabel(key) {
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).widgets || {};
        return t[`pomodoro_${key}`] || key;
    }

    updateWidgetLocalization() {
        this.updatePomodoroDisplay();
        const startBtn = document.getElementById('pomodoro-start-btn');
        if (startBtn) {
            startBtn.textContent = this.pomodoroState.isRunning ? this.getLabel('pause') : this.getLabel('start');
        }
        const resetBtn = document.getElementById('pomodoro-reset-btn');
        if (resetBtn) {
            resetBtn.textContent = this.getLabel('reset');
        }
    }
}


// --- Module: js/postits.js ---
// js/postits.js - Floating Glass Post-it System


class PostItManager {
    constructor() {
        this.container = null;
        this.postits = this.loadPostIts();
        this.topZIndex = 1000;
        this.colors = ['cyan', 'yellow', 'magenta', 'emerald'];
    }

    init() {
        this.container = document.getElementById('postits-canvas');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'postits-canvas';
            this.container.className = 'postits-canvas-container';
            document.body.appendChild(this.container);
        }

        // Bind Scratchpad "Fix Post-it" button
        const pinBtn = document.getElementById('create-postit-btn');
        const textarea = document.getElementById('scratchpad-input');

        if (pinBtn && textarea) {
            pinBtn.addEventListener('click', () => {
                const text = textarea.value.trim();
                if (text) {
                    this.createPostIt(text);
                    textarea.value = '';
                    localStorage.removeItem('bento_scratchpad_notes');
                } else {
                    textarea.focus();
                }
            });

            textarea.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    pinBtn.click();
                }
            });
        }

        this.renderAll();
    }

    loadPostIts() {
        try {
            const saved = localStorage.getItem('glass_postits_v1');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [];
    }

    savePostIts() {
        try {
            localStorage.setItem('glass_postits_v1', JSON.stringify(this.postits));
        } catch (e) {}
    }

        createPostIt(text, color = 'cyan') {
        if (this.postits.length >= 25) {
            soundFx.play('click');
            alert('Has alcanzado el límite máximo de 25 notas flotantes. Elimina alguna nota para fijar una nueva.');
            return;
        }
        soundFx.play('click');
        const offset = (this.postits.length * 28) % 240;
        const initialX = Math.min(window.innerWidth - 260, Math.max(20, 120 + offset));
        const initialY = Math.min(window.innerHeight - 220, Math.max(80, 160 + offset));
        const rotation = (Math.random() * 4 - 2).toFixed(1); // -2deg to +2deg

        const newNote = {
            id: 'postit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            text: text,
            x: initialX,
            y: initialY,
            color: color,
            rotation: parseFloat(rotation),
            zIndex: ++this.topZIndex,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        this.postits.push(newNote);
        this.savePostIts();
        this.renderSingle(newNote, true);
    }

    renderAll() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.postits.forEach(note => this.renderSingle(note, false));
    }

    renderSingle(note, isNew = false) {
        const el = document.createElement('div');
        el.className = `glass-postit color-${note.color} ${isNew ? 'postit-spawn-anim' : ''}`;
        el.id = note.id;
        el.style.left = `${note.x}px`;
        el.style.top = `${note.y}px`;
        el.style.zIndex = note.zIndex || 1000;
        el.style.transform = `rotate(${note.rotation || 0}deg)`;

        el.innerHTML = `
            <div class="postit-topbar">
                <span class="postit-pin-grip" title="Arrastrar Post-it">📌</span>
                <span class="postit-time">${escapeHtml(note.createdAt || '')}</span>
                <div class="postit-actions">
                    <button class="postit-color-btn" title="Cambiar color">🎨</button>
                    <button class="postit-delete-btn" title="Eliminar Post-it">✕</button>
                </div>
            </div>
            <div class="postit-body" contenteditable="true" spellcheck="false">${escapeHtml(note.text)}</div>
        `;

        this.bindPostItInteractions(el, note);
        this.container.appendChild(el);
    }

    bindPostItInteractions(el, note) {
        // Bring to front on pointer down
        el.addEventListener('pointerdown', () => {
            note.zIndex = ++this.topZIndex;
            el.style.zIndex = note.zIndex;
        });

        // Content editable sync
        const bodyEl = el.querySelector('.postit-body');
        if (bodyEl) {
            bodyEl.addEventListener('input', () => {
                note.text = bodyEl.innerText;
                this.savePostIts();
            });
        }

        // Color toggle
        const colorBtn = el.querySelector('.postit-color-btn');
        if (colorBtn) {
            colorBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                soundFx.play('hover');
                const currentIndex = this.colors.indexOf(note.color);
                const nextColor = this.colors[(currentIndex + 1) % this.colors.length];
                el.classList.remove(`color-${note.color}`);
                note.color = nextColor;
                el.classList.add(`color-${note.color}`);
                this.savePostIts();
            });
        }

        // Delete button
        const deleteBtn = el.querySelector('.postit-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                soundFx.play('click');
                el.classList.add('postit-delete-anim');
                setTimeout(() => {
                    this.postits = this.postits.filter(n => n.id !== note.id);
                    this.savePostIts();
                    el.remove();
                }, 220);
            });
        }

        // Universal Freeform Smooth Dragging (Click anywhere on the postit)
        let isDragging = false;
        let startX = 0, startY = 0;
        let elemInitialX = 0, elemInitialY = 0;
        let hasMoved = false;

        const onPointerDown = (e) => {
            if (e.target.closest('.postit-actions')) return;
            // If clicking directly into body to edit, allow editing without forcing drag unless moved
            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            elemInitialX = el.offsetLeft;
            elemInitialY = el.offsetTop;
            try { el.setPointerCapture(e.pointerId); } catch (err) {}
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            if (!hasMoved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
                hasMoved = true;
                el.classList.add('is-dragging-postit');
                soundFx.play('hover');
            }

            if (hasMoved) {
                let newX = elemInitialX + deltaX;
                let newY = elemInitialY + deltaY;

                // Constrain within viewport bounds
                const maxX = window.innerWidth - el.offsetWidth - 10;
                const maxY = window.innerHeight - el.offsetHeight - 10;
                newX = Math.max(10, Math.min(maxX, newX));
                newY = Math.max(10, Math.min(maxY, newY));

                el.style.left = `${newX}px`;
                el.style.top = `${newY}px`;
                note.x = newX;
                note.y = newY;
            }
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (hasMoved) {
                el.classList.remove('is-dragging-postit');
                this.savePostIts();
                soundFx.play('click');
            }
            try { el.releasePointerCapture(e.pointerId); } catch (err) {}
        };

        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', onPointerUp);
        el.addEventListener('pointercancel', onPointerUp);
    }
}


// --- Module: js/theme-studio.js ---
// js/theme-studio.js - Custom Dynamic Color Theme Studio


class ThemeStudio {
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


// --- Module: js/importer.js ---
// js/importer.js - Universal Bookmarks.html Parser & Importer


class BookmarksImporter {
    constructor(renderer) {
        this.renderer = renderer;
        this.fileInput = document.getElementById('bookmark-file-input');
        this.importBtn = document.getElementById('import-bookmarks-btn');
        this.statusMsg = document.getElementById('import-bookmarks-status');
    }

    init() {
        if (this.importBtn && this.fileInput) {
            this.importBtn.addEventListener('click', () => this.fileInput.click());
            this.fileInput.addEventListener('change', (e) => this.handleFileSelected(e));
        }
    }

    handleFileSelected(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const htmlContent = evt.target.result;
            this.parseBookmarks(htmlContent);
        };
        reader.readAsText(file);
    }

    parseBookmarks(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a');
        const imported = [];

        links.forEach((a, idx) => {
            const url = a.getAttribute('href');
            const title = (a.textContent || '').trim();
            if (url && (url.startsWith('http://') || url.startsWith('https://')) && title) {
                // Determine icon or use default
                imported.push({
                    id: `imp_${Date.now()}_${idx}`,
                    title: title.slice(0, 30),
                    url: url,
                    icon: 'iconos/google.webp',
                    category: 'cat_tools',
                    tags: 'imported, bookmark',
                    desc: title
                });
            }
        });

        if (imported.length === 0) {
            this.showStatus(this.getMsg('error_msg'), 'error');
            return;
        }

        // Merge mode
        const updated = [...state.shortcuts, ...imported];
        state.saveShortcuts(updated);
        this.renderer.render();

        const successText = this.getMsg('success_msg').replace('{count}', imported.length);
        this.showStatus(successText, 'success');
        this.fileInput.value = '';
    }

    getMsg(key) {
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).importer || {};
        return t[key] || key;
    }

    showStatus(msg, type) {
        if (!this.statusMsg) return;
        this.statusMsg.textContent = msg;
        this.statusMsg.className = `import-status-msg ${type}`;
        setTimeout(() => {
            if (this.statusMsg) this.statusMsg.textContent = '';
        }, 5000);
    }
}


// --- Module: js/render.js ---
// js/render.js - Dynamic Bento Grid & Shortcut Card Renderer


class DashboardRenderer {
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



// --- Module: js/layout.js ---
// js/layout.js - Freeform Canvas & Resize Layout Manager (rAF Throttled & Exact Cursor Lock)


class LayoutManager {
    constructor() {
        this.positions = this.loadPositions();
        this.topZIndex = 300;
        this.floatingBar = document.getElementById('floating-edit-bar');
        this.exitBtn = document.getElementById('exit-edit-mode-btn');
        this.resetBtn = document.getElementById('reset-layout-btn-bar');
    }

    loadPositions() {
        try {
            const saved = localStorage.getItem('canvas_positions_v1');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {};
    }

    savePositions() {
        try {
            localStorage.setItem('canvas_positions_v1', JSON.stringify(this.positions));
        } catch (e) {}
    }

    init() {
        this.applyPositions();
        state.on('dashboard:rendered', () => this.applyPositions());
        state.on('editmode:changed', (enabled) => this.toggleEditVisuals(enabled));

        if (this.exitBtn) {
            this.exitBtn.addEventListener('click', () => {
                soundFx.play('click');
                state.setEditMode(false);
            });
        }

        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                soundFx.play('click');
                this.resetLayout();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.editMode) {
                state.setEditMode(false);
            }
        });
    }

    applyPositions() {
        const tiles = document.querySelectorAll('[data-tile-id]');
        tiles.forEach(tile => {
            const id = tile.getAttribute('data-tile-id');
            const pos = this.positions[id];
            if (pos && (pos.x !== undefined || pos.y !== undefined || pos.w || pos.h)) {
                tile.classList.add('freeform-positioned');
                if (pos.x !== undefined) tile.style.left = `${pos.x}px`;
                if (pos.y !== undefined) tile.style.top = `${pos.y}px`;
                if (pos.w) tile.style.width = `${pos.w}px`;
                if (pos.h) tile.style.height = `${pos.h}px`;
                if (pos.zIndex) tile.style.zIndex = pos.zIndex;
            } else {
                tile.classList.remove('freeform-positioned');
                tile.style.removeProperty('left');
                tile.style.removeProperty('top');
                tile.style.removeProperty('width');
                tile.style.removeProperty('height');
                tile.style.removeProperty('z-index');
            }
        });

        this.toggleEditVisuals(state.editMode);
    }

    resetLayout() {
        this.positions = {};
        localStorage.removeItem('canvas_positions_v1');
        localStorage.removeItem('dashboard_layout_v3');
        this.applyPositions();
        soundFx.play('chime');
    }

    toggleEditVisuals(enabled) {
        document.body.classList.toggle('edit-mode-active', enabled);
        if (this.floatingBar) {
            this.floatingBar.classList.toggle('hidden', !enabled);
        }

        const tiles = document.querySelectorAll('[data-tile-id]');
        tiles.forEach(tile => {
            tile.classList.toggle('modular-tile', enabled);

            // Drag Handle
            let handle = tile.querySelector('.modular-drag-handle');
            if (enabled && !handle) {
                handle = document.createElement('span');
                handle.className = 'modular-drag-handle';
                handle.setAttribute('title', 'Arrastrar módulo a cualquier posición');
                handle.textContent = '⠿';
                tile.prepend(handle);
            } else if (!enabled && handle) {
                handle.remove();
            }

            // Resize Handle (Bottom Right Corner)
            let resizeHandle = tile.querySelector('.modular-resize-handle');
            if (enabled && !resizeHandle) {
                resizeHandle = document.createElement('span');
                resizeHandle.className = 'modular-resize-handle';
                resizeHandle.setAttribute('title', 'Redimensionar módulo');
                resizeHandle.textContent = '↘';
                tile.appendChild(resizeHandle);
                this.bindResizeEvents(tile, resizeHandle);
            } else if (!enabled && resizeHandle) {
                resizeHandle.remove();
            }

            if (enabled) {
                this.bindTileDragEvents(tile);
            } else {
                tile.onpointerdown = null;
            }
        });
    }

    bindTileDragEvents(tile) {
        const id = tile.getAttribute('data-tile-id');
        let isDragging = false;
        let grabOffsetX = 0, grabOffsetY = 0;
        let hasMoved = false;
        let rafId = null;

        const onPointerDown = (e) => {
            if (!state.editMode) return;
            if (e.target.closest('.modular-resize-handle') || e.target.closest('.card-action-btn') || e.target.closest('.enlace-icono')) return;

            isDragging = true;
            hasMoved = false;

            const rect = tile.getBoundingClientRect();
            grabOffsetX = e.clientX - rect.left;
            grabOffsetY = e.clientY - rect.top;

            this.topZIndex += 1;
            tile.style.zIndex = this.topZIndex;

            try { tile.setPointerCapture(e.pointerId); } catch (err) {}
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;

            const clientX = e.clientX;
            const clientY = e.clientY;

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                if (!isDragging) return;

                if (!hasMoved) {
                    hasMoved = true;
                    tile.classList.add('tile-is-dragging');
                    tile.classList.add('freeform-positioned');
                    soundFx.play('hover');
                }

                const targetX = clientX - grabOffsetX;
                const targetY = clientY - grabOffsetY;

                const maxX = Math.max(10, window.innerWidth - tile.offsetWidth - 10);
                const maxY = Math.max(10, window.innerHeight - tile.offsetHeight - 10);
                const newX = Math.max(10, Math.min(maxX, targetX));
                const newY = Math.max(10, Math.min(maxY, targetY));

                tile.style.left = `${newX}px`;
                tile.style.top = `${newY}px`;

                if (!this.positions[id]) this.positions[id] = {};
                this.positions[id].x = newX;
                this.positions[id].y = newY;
                this.positions[id].zIndex = this.topZIndex;
            });
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (rafId) cancelAnimationFrame(rafId);
            if (hasMoved) {
                tile.classList.remove('tile-is-dragging');
                this.savePositions();
                soundFx.play('click');
            }
            try { tile.releasePointerCapture(e.pointerId); } catch (err) {}
        };

        tile.onpointerdown = onPointerDown;
        tile.onpointermove = onPointerMove;
        tile.onpointerup = onPointerUp;
        tile.onpointercancel = onPointerUp;
    }

    bindResizeEvents(tile, resizeHandle) {
        const id = tile.getAttribute('data-tile-id');
        let isResizing = false;
        let startClientX = 0, startClientY = 0;
        let startW = 0, startH = 0;
        let resizeRafId = null;

        const onResizeDown = (e) => {
            e.stopPropagation();
            isResizing = true;
            startClientX = e.clientX;
            startClientY = e.clientY;

            const rect = tile.getBoundingClientRect();
            startW = rect.width;
            startH = rect.height;

            tile.classList.add('freeform-positioned');
            tile.classList.add('tile-is-resizing');
            soundFx.play('hover');
            try { resizeHandle.setPointerCapture(e.pointerId); } catch (err) {}
        };

        const onResizeMove = (e) => {
            if (!isResizing) return;
            const clientX = e.clientX;
            const clientY = e.clientY;

            if (resizeRafId) cancelAnimationFrame(resizeRafId);
            resizeRafId = requestAnimationFrame(() => {
                if (!isResizing) return;
                const deltaX = clientX - startClientX;
                const deltaY = clientY - startClientY;

                const newW = Math.max(140, Math.min(window.innerWidth - 30, startW + deltaX));
                const newH = Math.max(60, Math.min(window.innerHeight - 30, startH + deltaY));

                tile.style.width = `${newW}px`;
                tile.style.height = `${newH}px`;

                if (!this.positions[id]) this.positions[id] = {};
                this.positions[id].w = newW;
                this.positions[id].h = newH;
            });
        };

        const onResizeUp = (e) => {
            if (!isResizing) return;
            isResizing = false;
            if (resizeRafId) cancelAnimationFrame(resizeRafId);
            tile.classList.remove('tile-is-resizing');
            this.savePositions();
            soundFx.play('click');
            try { resizeHandle.releasePointerCapture(e.pointerId); } catch (err) {}
        };

        resizeHandle.onpointerdown = onResizeDown;
        resizeHandle.onpointermove = onResizeMove;
        resizeHandle.onpointerup = onResizeUp;
        resizeHandle.onpointercancel = onResizeUp;
    }
}


// --- Module: js/dragdrop.js ---
// js/dragdrop.js - Shortcut Cards Inner Drag & Drop Reordering


class DragDropManager {
    constructor(renderer, layoutManager) {
        this.renderer = renderer;
        this.layoutManager = layoutManager;
        this.draggedCard = null;
    }

    init() {
        state.on('editmode:changed', (enabled) => {
            if (enabled) {
                this.enableCardDragDrop();
            } else {
                this.disableCardDragDrop();
            }
        });
    }

    enableCardDragDrop() {
        const cards = document.querySelectorAll('.enlace-icono');
        cards.forEach(card => {
            card.setAttribute('draggable', 'true');
            card.ondragstart = (e) => {
                e.stopPropagation();
                this.draggedCard = card;
                card.classList.add('dragging-card');
                soundFx.play('click');
                e.dataTransfer.effectAllowed = 'move';
            };

            card.ondragend = () => {
                if (this.draggedCard) this.draggedCard.classList.remove('dragging-card');
                this.draggedCard = null;
                this.saveShortcutsOrder();
                soundFx.play('click');
            };
        });

        const iconGrids = document.querySelectorAll('.iconos-grupo');
        iconGrids.forEach(grid => {
            grid.ondragover = (e) => {
                if (!this.draggedCard) return;
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                const afterElement = this.getCardAfterElement(grid, e.clientX, e.clientY);
                if (afterElement == null) {
                    grid.appendChild(this.draggedCard);
                } else {
                    grid.insertBefore(this.draggedCard, afterElement);
                }
            };

            grid.ondrop = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.saveShortcutsOrder();
                soundFx.play('click');
            };
        });
    }

    disableCardDragDrop() {
        const cards = document.querySelectorAll('.enlace-icono');
        cards.forEach(card => {
            card.removeAttribute('draggable');
            card.ondragstart = null;
            card.ondragend = null;
        });

        const iconGrids = document.querySelectorAll('.iconos-grupo');
        iconGrids.forEach(grid => {
            grid.ondragover = null;
            grid.ondrop = null;
        });
    }

    getCardAfterElement(container, x, y) {
        const draggableElements = [...container.querySelectorAll('.enlace-icono:not(.dragging-card)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = (x - box.left - box.width / 2) + (y - box.top - box.height / 2);
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    saveShortcutsOrder() {
        const updatedList = [];
        const categories = document.querySelectorAll('.categoria');
        categories.forEach(cat => {
            const catId = cat.getAttribute('data-cat-id');
            const cards = cat.querySelectorAll('.enlace-icono');
            cards.forEach(card => {
                const id = card.getAttribute('data-id');
                const existing = state.shortcuts.find(s => s.id === id);
                if (existing) {
                    updatedList.push({ ...existing, category: catId });
                }
            });
        });
        state.saveShortcuts(updatedList);
    }
}


// --- Module: js/shortcut-manager.js ---
// js/shortcut-manager.js - Add / Edit / Delete Shortcut Modal with Smart Favicon HD


class ShortcutManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.modal = document.getElementById('shortcut-modal');
        this.titleInput = document.getElementById('sc-title-input');
        this.urlInput = document.getElementById('sc-url-input');
        this.catSelect = document.getElementById('sc-category-select');
        this.iconSelect = document.getElementById('sc-icon-select');
        this.customIconInput = document.getElementById('sc-custom-icon');
        this.descInput = document.getElementById('sc-desc-input');
        this.tagsInput = document.getElementById('sc-tags-input');
        this.saveBtn = document.getElementById('sc-save-btn');
        this.deleteBtn = document.getElementById('sc-delete-btn');
        this.closeBtn = document.getElementById('close-sc-modal');
        this.editingShortcutId = null;
    }

    init() {
        this.populateCategorySelect();
        this.populateIconPresets();
        this.bindEvents();
        this.bindSmartFaviconAutoDerive();

        window.addEventListener('shortcut:edit', (e) => this.openEditModal(e.detail));
        window.addEventListener('shortcut:delete', (e) => this.deleteShortcut(e.detail.id));
    }

    populateCategorySelect() {
        if (!this.catSelect) return;
        this.catSelect.innerHTML = '';
        const t = i18nDictionaries[state.language] || i18nDictionaries.es;
        state.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = t.categories[cat.id] || cat.defaultTitle;
            this.catSelect.appendChild(opt);
        });
    }

    populateIconPresets() {
        if (!this.iconSelect) return;
        this.iconSelect.innerHTML = '';
        const icons = [
            'chatgpt.webp', 'claude.webp', 'deepseek.webp', 'qwen.webp', 'gemini.webp', 'google.webp',
            'gmail.webp', 'googledrive.webp', 'github.webp', 'discord.webp', 'youtube.webp', 'amazon.webp',
            'aliexpress.webp', 'paypal.webp', 'instagram.webp', 'x.webp', 'tiktok.webp', 'threads.webp',
            'patreon.webp', 'linkedin.webp', 'exophase.webp', 'meshy.webp', 'tripo3d.webp', 'ludoai.webp',
            'civitai.webp', 'shakkerai.webp', 'tensorart.webp', 'seaartai.webp', 'shadertoy.webp', 'MiniMax.webp',
            'suno.webp', 'elevenlabs.webp', 'birme.webp', 'photoroom.webp', 'itchio.webp', 'OptimizeGLB.webp',
            'translate.webp', 'pccomponentes.webp', 'wallapop.webp', 'kling.webp', 'hedra.webp', 'bing.webp',
            'duckduckgo.webp', 'perplexity.webp', 'notebooklm.webp', 'googleaistudio.webp', 'seaverse.webp'
        ];
        icons.forEach(ic => {
            const opt = document.createElement('option');
            opt.value = `iconos/${ic}`;
            opt.textContent = ic.replace('.webp', '');
            this.iconSelect.appendChild(opt);
        });
    }

    openAddModal() {
        this.editingShortcutId = null;
        this.populateCategorySelect();
        this.titleInput.value = '';
        this.urlInput.value = '';
        this.customIconInput.value = '';
        this.descInput.value = '';
        this.tagsInput.value = '';
        if (this.deleteBtn) this.deleteBtn.classList.add('hidden');
        document.getElementById('sc-modal-title').textContent = (i18nDictionaries[state.language] || i18nDictionaries.es).shortcut_editor.add_title;
        this.modal.classList.remove('hidden');
    }

    openEditModal(sc) {
        this.editingShortcutId = sc.id;
        this.populateCategorySelect();
        this.titleInput.value = sc.title;
        this.urlInput.value = sc.url;
        this.catSelect.value = sc.category;
        this.descInput.value = sc.desc || '';
        this.tagsInput.value = sc.tags || '';

        if (sc.icon.startsWith('iconos/')) {
            this.iconSelect.value = sc.icon;
            this.customIconInput.value = '';
        } else {
            this.customIconInput.value = sc.icon;
        }

        if (this.deleteBtn) this.deleteBtn.classList.remove('hidden');
        document.getElementById('sc-modal-title').textContent = (i18nDictionaries[state.language] || i18nDictionaries.es).shortcut_editor.edit_title;
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.editingShortcutId = null;
    }

    saveShortcut() {
        const title = this.titleInput.value.trim();
        const url = this.urlInput.value.trim();
        if (!title || !url) return;

        let icon = this.customIconInput.value.trim() || this.iconSelect.value;
        const category = this.catSelect.value;
        const desc = this.descInput.value.trim();
        const tags = this.tagsInput.value.trim();

        if (this.editingShortcutId) {
            const list = state.shortcuts.map(s => {
                if (s.id === this.editingShortcutId) {
                    return { ...s, title, url, icon, category, desc, tags };
                }
                return s;
            });
            state.saveShortcuts(list);
        } else {
            const newId = 'sc_' + Date.now();
            const newSc = { id: newId, title, url, icon, category, desc, tags };
            state.saveShortcuts([...state.shortcuts, newSc]);
        }

        this.closeModal();
        this.renderer.render();
    }

    deleteShortcut(id) {
        const list = state.shortcuts.filter(s => s.id !== id);
        state.saveShortcuts(list);
        this.closeModal();
        this.renderer.render();
    }

    bindSmartFaviconAutoDerive() {
        if (this.urlInput) {
            this.urlInput.addEventListener('input', () => {
                const val = this.urlInput.value.trim();
                if (!val) return;
                try {
                    let formattedUrl = val;
                    if (!val.startsWith('http://') && !val.startsWith('https://')) {
                        formattedUrl = 'https://' + val;
                    }
                    const parsed = new URL(formattedUrl);
                    const domain = parsed.hostname.replace(/^www\./, '');
                    
                    if (this.titleInput && !this.titleInput.value.trim()) {
                        const name = domain.split('.')[0];
                        this.titleInput.value = name.charAt(0).toUpperCase() + name.slice(1);
                    }

                    const hdFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                    if (this.customIconInput) {
                        this.customIconInput.value = hdFavicon;
                    }
                } catch (e) {}
            });
        }
    }

    bindEvents() {
        if (this.saveBtn) this.saveBtn.addEventListener('click', () => this.saveShortcut());
        if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closeModal());
        if (this.deleteBtn) this.deleteBtn.addEventListener('click', () => {
            if (this.editingShortcutId) this.deleteShortcut(this.editingShortcutId);
        });
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
        }
    }
}


// --- Module: js/backup.js ---
// js/backup.js - JSON Backup & Restore Engine


class BackupManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.exportBtn = document.getElementById('export-backup-btn');
        this.importInput = document.getElementById('import-backup-file');
        this.resetBtn = document.getElementById('reset-defaults-btn');
    }

    init() {
        if (this.exportBtn) this.exportBtn.addEventListener('click', () => this.exportBackup());
        if (this.importInput) this.importInput.addEventListener('change', (e) => this.importBackup(e));
        if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.resetDefaults());
    }

    exportBackup() {
        const data = {
            version: '3.0.0',
            exportedAt: new Date().toISOString(),
            settings: {
                userName: state.userName,
                theme: state.theme,
                soundEnabled: state.soundEnabled,
                language: state.language,
                weatherCity: localStorage.getItem('weather_manual_city')
            },
            categoriesOrder: state.categories.map(c => c.id),
            layoutMatrix: state.layoutMatrix,
            postits: JSON.parse(localStorage.getItem('glass_postits_v1') || '[]'),
            canvasPositions: JSON.parse(localStorage.getItem('canvas_positions_v1') || '{}'),
            shortcuts: state.shortcuts
        };

        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hades_shortcuts_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importBackup(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).settings_hub.backup;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.shortcuts && Array.isArray(data.shortcuts)) {
                    state.saveShortcuts(data.shortcuts);
                    if (data.categoriesOrder && Array.isArray(data.categoriesOrder)) {
                        state.saveCategoriesOrder(data.categoriesOrder);
                    }
                    if (data.canvasPositions) {
                        localStorage.setItem('canvas_positions_v1', JSON.stringify(data.canvasPositions));
                    }
                    if (data.postits) {
                        localStorage.setItem('glass_postits_v1', JSON.stringify(data.postits));
                    }
                    if (data.layoutMatrix) {
                        state.saveLayoutMatrix(data.layoutMatrix);
                    }
                    if (data.settings) {
                        if (data.settings.userName) state.setUserName(data.settings.userName);
                        if (data.settings.theme) state.setTheme(data.settings.theme);
                        if (data.settings.language) state.setLanguage(data.settings.language);
                    }
                    alert(t.import_success);
                    this.renderer.render();
                } else {
                    alert(t.import_error);
                }
            } catch (err) {
                alert(t.import_error);
            }
        };
        reader.readAsText(file);
    }

    resetDefaults() {
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).settings_hub.backup;
        if (confirm(t.reset_confirm)) {
            state.resetToDefaults();
            this.renderer.render();
            alert('Valores restablecidos.');
        }
    }
}


// --- Module: js/search.js ---
// js/search.js - Multi-Engine Omnibox, Category Filters, Bangs & DevTools


const SEARCH_ENGINES = {
    google: { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'iconos/google.webp' },
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: 'iconos/duckduckgo.webp' },
    perplexity: { name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=', icon: 'iconos/perplexity.webp' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'iconos/bing.webp' }
};

class SearchEngineManager {
    constructor() {
        this.searchInput = document.getElementById('main-search') || document.getElementById('search-input');
        this.searchClear = document.getElementById('search-clear-btn') || document.getElementById('search-clear');
        this.engineBtn = document.getElementById('engine-btn');
        this.engineMenu = document.getElementById('engine-menu');
        this.engineIcon = document.getElementById('engine-icon-current');
        this.engineName = document.getElementById('engine-name-current');
        this.engineOptions = document.querySelectorAll('.engine-opt');
        this.filterPills = document.querySelectorAll('.filter-pill');
        this.calcBanner = document.getElementById('search-calc-banner');
        this.currentEngineKey = state.searchEngine || 'google';
    }

    init() {
        this.setEngine(this.currentEngineKey);
        this.bindEvents();
        this.updatePillCounts();

        state.on('shortcuts:changed', () => this.updatePillCounts());
        state.on('categories:changed', () => this.updatePillCounts());
        state.on('language:changed', () => {
            this.updatePlaceholders();
            this.updatePillCounts();
        });
    }

    setEngine(key) {
        if (!SEARCH_ENGINES[key]) key = 'google';
        this.currentEngineKey = key;
        state.searchEngine = key;
        state.setItem('app_search_engine', key);

        const engine = SEARCH_ENGINES[key];
        if (this.engineIcon) {
            const img = this.engineIcon.querySelector('img');
            if (img) {
                img.src = engine.icon;
                img.alt = engine.name;
            } else {
                this.engineIcon.innerHTML = `<img src="${engine.icon}" class="engine-icon-img" alt="${engine.name}">`;
            }
        }
        if (this.engineName) this.engineName.textContent = engine.name;
        this.updatePlaceholders();

        this.engineOptions.forEach(opt => {
            opt.classList.toggle('active', opt.getAttribute('data-engine') === key);
        });
    }

    updatePlaceholders() {
        const engine = SEARCH_ENGINES[this.currentEngineKey];
        const t = i18nDictionaries[state.language] || i18nDictionaries.es;
        if (this.searchInput) {
            this.searchInput.placeholder = t.search.placeholder.replace('{engine}', engine.name);
        }
    }

    updatePillCounts() {
        const countAll = state.shortcuts.length;
        const pillAllCount = document.querySelector('[data-filter="all"] .pill-count');
        if (pillAllCount) pillAllCount.textContent = countAll;
    }

    filterShortcuts() {
        const rawQuery = this.searchInput ? this.searchInput.value.trim() : '';
        const query = rawQuery.toLowerCase();
        const categories = document.querySelectorAll('.categoria');
        let totalVisible = 0;

        // 1. Check DevTools Omnibox Banner (case-sensitive)
        const handledByDevTools = devTools.renderBanner(rawQuery, this.calcBanner);
        if (handledByDevTools) {
            if (this.calcBanner) this.calcBanner.classList.remove('hidden');
            return;
        }

        // 2. Check Arithmetic Calculator
        const calcResult = evaluateArithmetic(query);
        if (this.calcBanner) {
            if (calcResult !== null) {
                const t = (i18nDictionaries[state.language] || i18nDictionaries.es).bangs || {};
                this.calcBanner.innerHTML = `<span>🔢 <strong>${t.calc_title || 'Resultado'}:</strong></span> <span class="calc-val">${calcResult}</span>`;
                this.calcBanner.classList.remove('hidden');
            } else {
                this.calcBanner.classList.add('hidden');
            }
        }

        // 3. Filter Shortcut Cards
        categories.forEach(cat => {
            const group = cat.getAttribute('data-group');
            const matchesPill = (state.activeFilter === 'all' || state.activeFilter === group);
            const cardsInCat = cat.querySelectorAll('.enlace-icono');
            let visibleInCat = 0;

            cardsInCat.forEach(card => {
                const title = (card.getAttribute('data-title') || '').toLowerCase();
                const tags = (card.getAttribute('data-tags') || '').toLowerCase();
                const desc = (card.getAttribute('data-desc') || '').toLowerCase();
                const text = (card.innerText || card.textContent || '').toLowerCase();

                const matchesQuery = !query || title.includes(query) || tags.includes(query) || desc.includes(query) || text.includes(query);

                if (matchesPill && matchesQuery) {
                    card.classList.remove('hidden-by-filter', 'no-match');
                    visibleInCat++;
                    totalVisible++;
                } else {
                    card.classList.add('hidden-by-filter', 'no-match');
                }
            });

            if (matchesPill && visibleInCat > 0) {
                cat.classList.remove('hidden-by-pill', 'hidden-by-search');
            } else {
                if (!matchesPill) {
                    cat.classList.add('hidden-by-pill');
                    cat.classList.remove('hidden-by-search');
                } else {
                    cat.classList.add('hidden-by-search');
                    cat.classList.remove('hidden-by-pill');
                }
            }
        });
    }

    executeSearch(query) {
        const trimmed = query.trim();
        if (!trimmed) return;

        // Check Bang Query
        const bangInfo = parseBangQuery(trimmed);
        if (bangInfo.isBang && bangInfo.targetUrl) {
            soundFx.play('click');
            window.open(bangInfo.targetUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        // Standard Web Search
        const engine = SEARCH_ENGINES[this.currentEngineKey] || SEARCH_ENGINES.google;
        const searchUrl = `${engine.url}${encodeURIComponent(trimmed)}`;
        soundFx.play('click');
        window.open(searchUrl, '_blank', 'noopener,noreferrer');
    }

    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                if (this.searchClear) {
                    this.searchClear.classList.toggle('hidden', !this.searchInput.value);
                }
                this.filterShortcuts();
            });

            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.executeSearch(this.searchInput.value);
                }
                if (e.key === 'Escape') {
                    this.searchInput.value = '';
                    if (this.searchClear) this.searchClear.classList.add('hidden');
                    this.filterShortcuts();
                }
            });
        }

        if (this.searchClear) {
            this.searchClear.addEventListener('click', () => {
                soundFx.play('click');
                this.searchInput.value = '';
                this.searchClear.classList.add('hidden');
                this.filterShortcuts();
                this.searchInput.focus();
            });
        }

        if (this.engineBtn && this.engineMenu) {
            this.engineBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                soundFx.play('click');
                const isOpen = !this.engineMenu.classList.contains('hidden');
                this.engineMenu.classList.toggle('hidden', isOpen);
                this.engineBtn.setAttribute('aria-expanded', !isOpen);
            });

            document.addEventListener('click', () => {
                this.engineMenu.classList.add('hidden');
                this.engineBtn.setAttribute('aria-expanded', 'false');
            });
        }

        this.engineOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                soundFx.play('click');
                const key = opt.getAttribute('data-engine');
                this.setEngine(key);
                this.engineMenu.classList.add('hidden');
                this.engineBtn.setAttribute('aria-expanded', 'false');
            });
        });

        this.filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                soundFx.play('click');
                const filter = pill.getAttribute('data-filter');
                this.filterPills.forEach(p => p.classList.toggle('active', p === pill));
                state.activeFilter = filter;
                state.setItem('active_pill_filter', filter);
                this.filterShortcuts();
            });
        });
    }
}


// --- Module: js/settings.js ---
// js/settings.js - Slide-Over Settings Drawer Hub


class SettingsHub {
    constructor(renderer, shortcutManager, backupManager, importer, themeStudio) {
        this.renderer = renderer;
        this.shortcutManager = shortcutManager;
        this.backupManager = backupManager;
        this.importer = importer;
        this.themeStudio = themeStudio;
        this.drawer = document.getElementById('settings-drawer');
        this.settingsBtn = document.getElementById('settings-btn');
        this.closeBtn = document.getElementById('close-settings-drawer');
        this.tabBtns = document.querySelectorAll('.settings-tab-btn');
        this.tabPanes = document.querySelectorAll('.settings-tab-pane');
        this.themeRadios = document.querySelectorAll('input[name="setting-theme"]');
        this.soundToggle = document.getElementById('setting-sound-toggle');
        this.soundPresetSelect = document.getElementById('sound-preset-select');
        this.glowToggle = document.getElementById('setting-glow-toggle');
        this.editModeToggle = document.getElementById('setting-edit-mode-toggle');
        this.addShortcutBtn = document.getElementById('drawer-add-shortcut-btn');
        this.layoutResetBtn = document.getElementById('layout-reset-defaults-btn');
        this.toggleScratchpad = document.getElementById('toggle-widget-scratchpad');
        this.togglePomodoro = document.getElementById('toggle-widget-pomodoro');
    }

    init() {
        this.bindEvents();
        this.syncUIState();
        if (this.importer) this.importer.init();
        if (this.themeStudio) this.themeStudio.init();
    }

    open() {
        if (!this.drawer) return;
        soundFx.play('click');
        this.syncUIState();
        this.drawer.classList.remove('hidden');
    }

    close() {
        if (!this.drawer) return;
        soundFx.play('click');
        this.drawer.classList.add('hidden');
    }

    syncUIState() {
        this.themeRadios.forEach(radio => {
            radio.checked = (radio.value === state.theme || (radio.value === 'sunset' && state.theme === 'amber'));
        });

        if (this.soundToggle) this.soundToggle.checked = state.soundEnabled;
        if (this.soundPresetSelect) this.soundPresetSelect.value = soundFx.preset;
        if (this.editModeToggle) this.editModeToggle.checked = state.editMode;

        const scratchpadVisible = localStorage.getItem('widget_scratchpad_visible') !== 'false';
        const pomodoroVisible = localStorage.getItem('widget_pomodoro_visible') !== 'false';
        if (this.toggleScratchpad) this.toggleScratchpad.checked = scratchpadVisible;
        if (this.togglePomodoro) this.togglePomodoro.checked = pomodoroVisible;
    }

    bindEvents() {
        if (this.settingsBtn) this.settingsBtn.addEventListener('click', () => this.open());
        if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());

        if (this.drawer) {
            this.drawer.addEventListener('click', (e) => {
                if (e.target === this.drawer) this.close();
            });
        }

        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                soundFx.play('click');
                const targetTab = btn.getAttribute('data-tab');
                this.tabBtns.forEach(b => b.classList.toggle('active', b === btn));
                this.tabPanes.forEach(pane => {
                    pane.classList.toggle('active', pane.id === `tab-pane-${targetTab}`);
                });
            });
        });

        this.themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                soundFx.play('click');
                state.setTheme(e.target.value);
            });
        });

        if (this.soundToggle) {
            this.soundToggle.addEventListener('change', (e) => {
                state.setSoundEnabled(e.target.checked);
                soundFx.play('click');
            });
        }

        if (this.soundPresetSelect) {
            this.soundPresetSelect.addEventListener('change', (e) => {
                soundFx.setPreset(e.target.value);
                soundFx.play('click');
            });
        }

        if (this.editModeToggle) {
            this.editModeToggle.addEventListener('change', (e) => {
                soundFx.play('click');
                state.setEditMode(e.target.checked);
            });
        }

        if (this.toggleScratchpad) {
            this.toggleScratchpad.addEventListener('change', (e) => {
                const el = document.getElementById('widget-scratchpad-card');
                if (el) el.classList.toggle('hidden', !e.target.checked);
                localStorage.setItem('widget_scratchpad_visible', e.target.checked ? 'true' : 'false');
            });
        }

        if (this.togglePomodoro) {
            this.togglePomodoro.addEventListener('change', (e) => {
                const el = document.getElementById('widget-pomodoro-card');
                if (el) el.classList.toggle('hidden', !e.target.checked);
                localStorage.setItem('widget_pomodoro_visible', e.target.checked ? 'true' : 'false');
            });
        }

        if (this.layoutResetBtn) {
            this.layoutResetBtn.addEventListener('click', () => {
                soundFx.play('click');
                this.backupManager.resetDefaults();
            });
        }

        if (this.addShortcutBtn) {
            this.addShortcutBtn.addEventListener('click', () => {
                this.close();
                this.shortcutManager.openAddModal();
            });
        }

        // Language Radios in Settings
        const langRadios = document.querySelectorAll('input[name="setting-lang"]');
        langRadios.forEach(radio => {
            radio.checked = (radio.value === state.language);
            radio.addEventListener('change', (e) => {
                soundFx.play('click');
                state.setLanguage(e.target.value);
                updateDocumentLocalization();
                this.renderer.render();
            });
        });
    }
}


// --- Module: js/app.js ---
// js/app.js - Master Orchestrator for HaDeS' Shortcuts Next-Gen


function initUserNameSystem(weather, settingsHub) {
    const brandName = document.getElementById('brand-user-name');
    const brandSuffix = document.getElementById('brand-user-suffix');
    const brandTitle = document.querySelector('.brand-title');
    const modal = document.getElementById('user-modal');
    const input = document.getElementById('user-name-input');
    const saveBtn = document.getElementById('user-save-btn');
    const closeBtn = document.getElementById('close-user-modal');
    const preview = document.getElementById('user-preview-text');
    const drawerInput = document.getElementById('drawer-user-name-input');
    const drawerSaveBtn = document.getElementById('drawer-user-save-btn');

    const updateDisplay = (name) => {
        const trimmed = (name || 'HaDeS').trim();
        const suffix = trimmed.toLowerCase().endsWith('s') ? "'" : "'s";
        if (brandName) brandName.textContent = trimmed;
        if (brandSuffix) brandSuffix.textContent = suffix;
        if (drawerInput) drawerInput.value = trimmed;
        if (input) input.value = trimmed;
        document.title = `${trimmed}${suffix} Shortcuts · Command Center`;
        if (weather && weather.updateClockAndGreeting) {
            weather.updateClockAndGreeting();
        }
    };

    // Listen to reactive state changes
    state.on('username:changed', (name) => updateDisplay(name));

    // Initial render
    updateDisplay(state.userName);

    const openModal = () => {
        soundFx.play('click');
        if (modal) modal.classList.remove('hidden');
        if (input) {
            input.value = state.userName;
            setTimeout(() => {
                input.focus();
                input.select();
            }, 50);
        }
        updatePreview();
    };

    const closeModal = () => {
        soundFx.play('click');
        if (modal) modal.classList.add('hidden');
    };

    const updatePreview = () => {
        if (!preview || !input) return;
        const val = input.value.trim() || 'HaDeS';
        const suffix = val.toLowerCase().endsWith('s') ? "'" : "'s";
        preview.textContent = `${val}${suffix} SHORTCUTS`;
    };

    const applyNewName = (rawName) => {
        soundFx.play('click');
        const newName = (rawName || 'HaDeS').trim();
        state.setUserName(newName);
        updateDisplay(newName);
    };

    if (brandName) brandName.addEventListener('click', openModal);
    if (brandTitle) brandTitle.addEventListener('click', openModal);
    if (brandName) {
        brandName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal();
            }
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            applyNewName(input ? input.value : 'HaDeS');
            closeModal();
        });
    }

    if (drawerSaveBtn) {
        drawerSaveBtn.addEventListener('click', () => {
            applyNewName(drawerInput ? drawerInput.value : 'HaDeS');
            drawerSaveBtn.textContent = '✓ Guardado';
            setTimeout(() => {
                drawerSaveBtn.textContent = 'Guardar';
            }, 2000);
        });
    }
    if (drawerInput) {
        drawerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                applyNewName(drawerInput.value);
                if (drawerSaveBtn) {
                    drawerSaveBtn.textContent = '✓ Guardado';
                    setTimeout(() => {
                        drawerSaveBtn.textContent = 'Guardar';
                    }, 2000);
                }
            }
        });
    }

    if (input) {
        input.addEventListener('input', updatePreview);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                applyNewName(input.value);
                closeModal();
            }
            if (e.key === 'Escape') closeModal();
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
}

function initGlobalKeybindings(search, settingsHub) {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            soundFx.play('hover');
            if (search.searchInput) {
                search.searchInput.focus();
                search.searchInput.select();
            }
        } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            soundFx.play('hover');
            if (search.searchInput) search.searchInput.focus();
        } else if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            settingsHub.open();
        }
    });
}

function initApp() {
    // 1. Initialize Visual Theme & Custom Theme Studio
    document.documentElement.setAttribute('data-theme', state.theme);
    state.on('theme:changed', (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
    });

    const themeStudio = new ThemeStudio();
    themeStudio.init();

    // 2. Initialize Core Subsystems
    const renderer = new DashboardRenderer();
    const weather = new WeatherEngine();
    const search = new SearchEngineManager();
    const widgets = new WidgetsManager();
    const postits = new PostItManager();
    const layoutManager = new LayoutManager();
    const shortcutManager = new ShortcutManager(renderer);
    const backupManager = new BackupManager(renderer);
    const importer = new BookmarksImporter(renderer);
    const dragDropManager = new DragDropManager(renderer, layoutManager);
    const settingsHub = new SettingsHub(renderer, shortcutManager, backupManager, importer, themeStudio);

    // 3. Render Dashboard & Init Subsystems
    renderer.render();
    layoutManager.init();
    weather.init();
    search.init();
    widgets.init();
    devTools.init();
    ambientAudio.init();
    postits.init();
    dragDropManager.init();
    shortcutManager.init();
    backupManager.init();
    settingsHub.init();

    loadLocaleAsync(state.language).then(() => {
        updateDocumentLocalization();
        renderer.render();
        layoutManager.applyPositions();
    });

    // 4. User Name Interactive Modal & Drawer Sync
    initUserNameSystem(weather, settingsHub);

    // 5. Global Keyboard Shortcuts
    initGlobalKeybindings(search, settingsHub);

    // 6. User Interaction Audio Unlock (Browser Autoplay Compliance)
    const unlockAudio = () => {
        soundFx.getAudioContext();
        document.removeEventListener('pointerdown', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
    };
    document.addEventListener('pointerdown', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    // 7. Register Service Worker for PWA
    if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}


})();
