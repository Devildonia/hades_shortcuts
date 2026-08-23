document.addEventListener('DOMContentLoaded', () => {
        // --- Embedded i18n Dictionaries (Instant offline + file:/// support) ---
    const i18nDictionaries = {
        es: {"brand_greeting": "Bienvenido al Centro de Mando", "greetings": {"morning": "¡Buenos días, HaDeS!", "afternoon": "¡Buenas tardes, HaDeS!", "night": "¡Buenas noches, HaDeS!"}, "controls": {"sound_title": "Efectos de sonido (Activado/Desactivado)", "theme_title": "Cambiar Tema Visual", "lang_title": "Cambiar Idioma", "cmdk_btn": "Buscar", "cmdk_badge": "Ctrl K"}, "search": {"placeholder": "Buscar con {engine} o filtrar atajos...", "clear": "Limpiar búsqueda"}, "filters": {"all": "Todos", "ia_creativa": "IA & 3D", "arte_media": "Arte & Multimedia", "productividad": "Google & Herramientas", "social_compras": "Social & Compras"}, "categories": {"cat_3d": "3D Modeling & AI", "cat_ai": "Inteligencia Artificial", "cat_art": "Arte Digital & Modelos", "cat_audio": "Generación de Audio", "cat_google": "Google Workspace & AI", "cat_tools": "Herramientas & Dev", "cat_social": "Comunidad & Redes", "cat_shopping": "Compras & Pagos", "cat_video": "Vídeo & Generación IA"}, "badges": {"apps": "apps"}, "shortcuts": {"meshy": "Generación de modelos 3D y texturas con IA a partir de texto o imagen", "tripo3d": "Estudio rápido para generar modelos 3D listos para producción", "ludoai": "Plataforma de IA para ideación, análisis de mercado e investigación de videojuegos", "chatgpt": "Asistente conversacional avanzado y razonamiento con GPT-4o", "deepseek": "Modelo de razonamiento profundo y generación de código de alta precisión", "claude": "Modelo de IA de Anthropic con gran ventana de contexto y análisis de código", "qwen": "Modelos fundacionales y chat de Alibaba Cloud (Qwen 2.5)", "seaverse": "Herramientas y generadores de IA para mundos virtuales y multimedia", "civitai": "Comunidad y repositorio de modelos, Checkpoints y LoRAs para Stable Diffusion", "shakker": "Plataforma de generación y mezcla de imágenes de alta definición con IA", "tensorart": "Generador online de arte y modelos con créditos diarios gratuitos", "seaart": "Estudio de creación y renderizado artístico asistido por IA", "shadertoy": "Plataforma para programar, visualizar y compartir shaders GLSL en WebGL", "minimax": "Generación y clonación de voces ultrarrealistas con IA", "suno": "Composición y generación de canciones completas con música y letra por IA", "elevenlabs": "Síntesis de voz líder en el sector y traducción de audio", "google": "Motor de búsqueda web global y servicios integrados", "gmail": "Servicio de correo electrónico seguro y sincronizado", "googledrive": "Almacenamiento en la nube y gestión de archivos colaborativa", "gemini": "Modelo multimodal de Google integrado en su ecosistema", "googleaistudio": "Entorno de desarrollo y prototipado rápido con APIs de Gemini", "notebooklm": "Cuaderno inteligente de notas y resúmenes de audio con IA", "birme": "Redimensionador y recortador por lotes flexible de imágenes", "photoroom": "Eliminador de fondos profesional y edición rápida de fotos", "github": "Plataforma de desarrollo colaborativo y repositorios Git", "itchio": "Mercado indie de videojuegos, assets, música y sprites", "optimizeglb": "Compresión Draco y optimización de archivos 3D GLB/glTF", "translate": "Traducción instantánea de textos y páginas web en múltiples idiomas", "instagram": "Red social para compartir fotos, vídeos, historias y reels", "facebook": "Red social para conectar con amigos, grupos y comunidades", "x": "Red de microblogging para noticias y tendencias en tiempo real", "tiktok": "Plataforma de vídeos cortos en formato vertical", "threads": "Plataforma de microblogging y debate vinculada a Instagram", "patreon": "Membresías y suscripciones para creadores de contenido", "discord": "Servidores de chat de texto, voz y vídeo para comunidades", "linkedin": "Red social profesional para networking y empleo", "exophase": "Seguimiento de logros, trofeos y estadísticas de perfiles gaming", "amazon": "Tienda online global de productos con entrega rápida", "aliexpress": "Plataforma de compras online con variedad y precios de fábrica", "pccomponentes": "Tienda especializada en informática, hardware y tecnología", "paypal": "Pasarela de pagos en línea segura y transferencias", "wallapop": "Plataforma de compraventa de productos de segunda mano", "youtube": "Plataforma de vídeo en streaming, tutoriales y directos", "kling": "Generación de vídeo cinemático con movimiento realista por IA", "hedra": "Creación de avatares hablantes y personajes animados con IA"}, "no_results": {"title": "No se encontraron accesos directos", "desc": "Prueba con otros términos o busca directamente en la web pulsando Enter."}, "weather": {"title": "Configurar Ciudad del Clima", "desc": "Escribe el nombre de tu ciudad para ver el pronóstico meteorológico en vivo:", "input_placeholder": "Ej: Vigo, Madrid, Barcelona, Valencia...", "search_btn": "Buscar", "auto_btn": "Detectar automáticamente por IP", "loading": "Cargando...", "offline": "Sin conexión", "conditions": {"clear": "Despejado", "mostly_clear": "Mayormente despejado", "partly_cloudy": "Parcialmente nublado", "cloudy": "Nublado", "fog": "Niebla", "drizzle": "Llovizna ligera", "rain": "Lluvia", "heavy_rain": "Lluvia intensa", "snow": "Nieve", "showers": "Chubascos", "snow_showers": "Chubascos de nieve", "thunderstorm": "Tormenta", "hail_thunderstorm": "Tormenta con granizo"}}, "cmdk": {"placeholder": "Buscar atajo, herramienta o comando rápido...", "direct_search_prefix": "Buscar en {engine}:", "direct_search_cat": "Búsqueda Web Directa", "action_open": "Abrir", "action_search": "Buscar", "tip_nav": "Navegar", "tip_open": "Abrir enlace", "tip_close": "Cerrar"}, "user_modal": {"title": "Cambiar Nombre de Usuario", "desc": "Personaliza el nombre que aparece en el título y en los saludos de tu Centro de Mando:", "input_placeholder": "Tu nombre o alias...", "save_btn": "Guardar", "preview_label": "Vista previa:", "tooltip_title": "Haz clic para cambiar tu nombre de usuario", "doc_title_suffix": "· Centro de Mando"}},
        en: {"brand_greeting": "Welcome to the Command Center", "greetings": {"morning": "Good morning, HaDeS!", "afternoon": "Good afternoon, HaDeS!", "night": "Good evening, HaDeS!"}, "controls": {"sound_title": "Sound Effects (Enabled/Disabled)", "theme_title": "Switch Visual Theme", "lang_title": "Switch Language", "cmdk_btn": "Search", "cmdk_badge": "Ctrl K"}, "search": {"placeholder": "Search with {engine} or filter shortcuts...", "clear": "Clear search"}, "filters": {"all": "All", "ia_creativa": "AI & 3D", "arte_media": "Art & Multimedia", "productividad": "Google & Tools", "social_compras": "Social & Shopping"}, "categories": {"cat_3d": "3D Modeling & AI", "cat_ai": "Artificial Intelligence", "cat_art": "Digital Art & Models", "cat_audio": "Audio Generation", "cat_google": "Google Workspace & AI", "cat_tools": "Tools & Dev", "cat_social": "Community & Social", "cat_shopping": "Shopping & Payments", "cat_video": "Video & AI Generation"}, "badges": {"apps": "apps"}, "shortcuts": {"meshy": "AI-powered 3D model and texture generation from text or image", "tripo3d": "Fast 3D studio generating production-ready 3D models with AI", "ludoai": "AI platform for game ideation, market analysis, and research", "chatgpt": "Advanced conversational AI assistant and reasoning with GPT-4o", "deepseek": "Deep reasoning AI model with high precision coding capabilities", "claude": "Anthropic's frontier AI model with vast context window and deep analysis", "qwen": "Alibaba Cloud foundational models and conversational AI (Qwen 2.5)", "seaverse": "AI creative tools and generators for virtual worlds and multimedia", "civitai": "Community model hub, Checkpoints and LoRAs for Stable Diffusion", "shakker": "High-definition image generation and AI image fusion platform", "tensorart": "Online generative art studio with free daily generation credits", "seaart": "AI-assisted art creation studio and image rendering platform", "shadertoy": "Platform to build, view, and share GLSL shaders in WebGL", "minimax": "Ultra-realistic voice cloning and text-to-speech AI generation", "suno": "Full song and music composition with lyrics generated by AI", "elevenlabs": "Industry-leading voice synthesis and multilingual audio translation", "google": "Global web search engine and integrated Google ecosystem services", "gmail": "Secure and synchronized webmail and communications service", "googledrive": "Cloud storage and collaborative document file management", "gemini": "Google multimodal AI model integrated across its workspace ecosystem", "googleaistudio": "Rapid prototyping environment and API access for Gemini models", "notebooklm": "Smart personalized notebook with AI-powered audio overviews", "birme": "Flexible batch image resizer and smart focal crop utility", "photoroom": "Professional background remover and quick photo editing suite", "github": "Collaborative software development platform and Git repositories", "itchio": "Indie marketplace for video games, assets, game music, and sprites", "optimizeglb": "Draco compression and performance optimizer for 3D GLB/glTF files", "translate": "Instant text and web page translations across multiple languages", "instagram": "Visual social media platform for photos, videos, stories, and reels", "facebook": "Social network to connect with friends, groups, and communities", "x": "Real-time microblogging network for global news, tech, and trends", "tiktok": "Short-form vertical video streaming and creative content platform", "threads": "Text-based conversation and microblogging platform linked to Instagram", "patreon": "Membership platform for creators to build recurring fan support", "discord": "Voice, video, and text communication platform for communities", "linkedin": "Professional networking platform for careers, jobs, and businesses", "exophase": "Gaming achievement, trophy, and multi-platform profile tracking", "amazon": "Global online shopping marketplace with fast delivery options", "aliexpress": "Global e-commerce platform offering factory-direct products", "pccomponentes": "Specialized computer hardware, electronics, and tech store", "paypal": "Secure digital wallet and online payment transfer system", "wallapop": "Peer-to-peer secondhand marketplace for buying and selling goods", "youtube": "Global streaming video platform, tutorials, music, and live broadcasts", "kling": "Cinematic video generation with realistic physics and camera motion", "hedra": "AI-powered expressive talking avatar and animated video generation"}, "no_results": {"title": "No shortcuts found", "desc": "Try different search terms or press Enter to search directly on the web."}, "weather": {"title": "Configure Weather City", "desc": "Enter the name of your city to view real-time weather forecasts:", "input_placeholder": "e.g. London, New York, Tokyo, Madrid...", "search_btn": "Search", "auto_btn": "Auto-detect via IP", "loading": "Loading...", "offline": "Offline", "conditions": {"clear": "Clear sky", "mostly_clear": "Mostly clear", "partly_cloudy": "Partly cloudy", "cloudy": "Overcast", "fog": "Fog", "drizzle": "Light drizzle", "rain": "Rain", "heavy_rain": "Heavy rain", "snow": "Snow", "showers": "Rain showers", "snow_showers": "Snow showers", "thunderstorm": "Thunderstorm", "hail_thunderstorm": "Thunderstorm with hail"}}, "cmdk": {"placeholder": "Search shortcut, tool or quick command...", "direct_search_prefix": "Search on {engine}:", "direct_search_cat": "Direct Web Search", "action_open": "Open", "action_search": "Search", "tip_nav": "Navigate", "tip_open": "Open link", "tip_close": "Close"}, "user_modal": {"title": "Change Username", "desc": "Customize the name displayed in the title and greetings of your Command Center:", "input_placeholder": "Your name or handle...", "save_btn": "Save", "preview_label": "Preview:", "tooltip_title": "Click to change your username", "doc_title_suffix": "· Command Center"}},
        fr: {"brand_greeting": "Bienvenue au Centre de Commande", "greetings": {"morning": "Bonjour, HaDeS !", "afternoon": "Bon après-midi, HaDeS !", "night": "Bonsoir, HaDeS !"}, "controls": {"sound_title": "Effets sonores (Activé/Désactivé)", "theme_title": "Changer de Thème Visuel", "lang_title": "Changer de Langue", "cmdk_btn": "Rechercher", "cmdk_badge": "Ctrl K"}, "search": {"placeholder": "Rechercher avec {engine} ou filtrer les raccourcis...", "clear": "Effacer la recherche"}, "filters": {"all": "Tous", "ia_creativa": "IA & 3D", "arte_media": "Art & Multimédia", "productividad": "Google & Outils", "social_compras": "Social & Achats"}, "categories": {"cat_3d": "Modélisation 3D & IA", "cat_ai": "Intelligence Artificielle", "cat_art": "Art Numérique & Modèles", "cat_audio": "Génération Audio", "cat_google": "Google Workspace & IA", "cat_tools": "Outils & Développeur", "cat_social": "Communauté & Réseaux", "cat_shopping": "Achats & Paiements", "cat_video": "Vidéo & Génération IA"}, "badges": {"apps": "apps"}, "shortcuts": {"meshy": "Génération de modèles 3D et textures par IA à partir de texte ou image", "tripo3d": "Studio rapide pour générer des modèles 3D prêts pour la production", "ludoai": "Plateforme d'IA pour l'idéation et l'analyse de marché des jeux vidéo", "chatgpt": "Assistant conversationnel avancé et raisonnement avec GPT-4o", "deepseek": "Modèle d'IA de raisonnement profond et génération de code de haute précision", "claude": "Modèle d'IA d'Anthropic avec grande fenêtre de contexte et analyse de code", "qwen": "Modèles fondateurs et chat d'Alibaba Cloud (Qwen 2.5)", "seaverse": "Outils et générateurs d'IA pour mondes virtuels et multimédia", "civitai": "Dépôt communautaire de modèles, Checkpoints et LoRAs pour Stable Diffusion", "shakker": "Plateforme de génération et de fusion d'images haute définition par IA", "tensorart": "Générateur d'art en ligne avec crédits de création quotidiens gratuits", "seaart": "Studio de création et de rendu artistique assisté par IA", "shadertoy": "Plateforme pour programmer et partager des shaders GLSL en WebGL", "minimax": "Génération et clonage de voix ultra-réalistes par IA", "suno": "Composition musicale complète avec paroles et mélodie générées par IA", "elevenlabs": "Synthèse vocale de pointe et traduction audio multilingue", "google": "Moteur de recherche mondial et services intégrés de Google", "gmail": "Service de messagerie électronique sécurisé et synchronisé", "googledrive": "Stockage cloud et gestion collaborative de fichiers", "gemini": "Modèle multimodal de Google intégré à son écosystème", "googleaistudio": "Environnement de prototypage rapide avec les API Gemini", "notebooklm": "Carnet de notes intelligent avec résumés audio générés par IA", "birme": "Outil de redimensionnement et recadrage d'images par lots flexible", "photoroom": "Suppression professionnelle d'arrière-plan et retouche photo rapide", "github": "Plateforme de développement collaboratif et dépôts Git", "itchio": "Marché indépendant de jeux vidéo, assets, musique et sprites", "optimizeglb": "Compression Draco et optimisation de fichiers 3D GLB/glTF", "translate": "Traduction instantanée de textes et pages web en plusieurs langues", "instagram": "Réseau social pour partager photos, vidéos, stories et reels", "facebook": "Réseau social pour connecter avec amis, groupes et communautés", "x": "Réseau de microblogging pour actualités et tendances en temps réel", "tiktok": "Plateforme de vidéos courtes au format vertical", "threads": "Plateforme de microblogging et débat liée à Instagram", "patreon": "Abonnements et soutien participatif pour créateurs de contenu", "discord": "Serveurs de discussion textuelle, vocale et vidéo pour communautés", "linkedin": "Réseau social professionnel pour l'emploi et le networking", "exophase": "Suivi des succès, trophées et profils multi-plateformes de jeu", "amazon": "Boutique en ligne mondiale de produits avec livraison rapide", "aliexpress": "Plateforme d'achats en ligne avec prix directs d'usine", "pccomponentes": "Boutique spécialisée en informatique, hardware et technologie", "paypal": "Portefeuille numérique sécurisé et plateforme de paiement", "wallapop": "Plateforme d'achat et vente de produits d'occasion", "youtube": "Plateforme de streaming vidéo, tutoriels et diffusions en direct", "kling": "Génération de vidéos cinématographiques avec mouvements réalistes", "hedra": "Création d'avatars expressifs parlants et de personnages animés par IA"}, "no_results": {"title": "Aucun raccourci trouvé", "desc": "Essayez d'autres termes ou recherchez directement sur le Web en appuyant sur Entrée."}, "weather": {"title": "Configurer la Ville Météo", "desc": "Saisissez le nom de votre ville pour voir les prévisions en direct :", "input_placeholder": "Ex : Paris, Lyon, Montréal, Madrid...", "search_btn": "Chercher", "auto_btn": "Détecter automatiquement par IP", "loading": "Chargement...", "offline": "Hors ligne", "conditions": {"clear": "Ciel dégagé", "mostly_clear": "Généralement dégagé", "partly_cloudy": "Partiellement nuageux", "cloudy": "Couvert", "fog": "Brouillard", "drizzle": "Bruine légère", "rain": "Pluie", "heavy_rain": "Pluie battante", "snow": "Neige", "showers": "Averses de pluie", "snow_showers": "Averses de neige", "thunderstorm": "Orage", "hail_thunderstorm": "Orage avec grêle"}}, "cmdk": {"placeholder": "Rechercher un raccourci, un outil ou une commande rapide...", "direct_search_prefix": "Rechercher sur {engine} :", "direct_search_cat": "Recherche Web Directe", "action_open": "Ouvrir", "action_search": "Chercher", "tip_nav": "Naviguer", "tip_open": "Ouvrir le lien", "tip_close": "Fermer"}, "user_modal": {"title": "Changer de Nom d'Utilisateur", "desc": "Personnalisez le nom affiché dans le titre et les salutations de votre Centre de Commande :", "input_placeholder": "Votre nom ou pseudo...", "save_btn": "Enregistrer", "preview_label": "Aperçu :", "tooltip_title": "Cliquez pour changer votre nom d'utilisateur", "doc_title_suffix": "· Centre de Commande"}},
        de: {"brand_greeting": "Willkommen im Kontrollzentrum", "greetings": {"morning": "Guten Morgen, HaDeS!", "afternoon": "Guten Tag, HaDeS!", "night": "Guten Abend, HaDeS!"}, "controls": {"sound_title": "Soundeffekte (Ein/Aus)", "theme_title": "Visuelles Design wechseln", "lang_title": "Sprache wechseln", "cmdk_btn": "Suchen", "cmdk_badge": "Ctrl K"}, "search": {"placeholder": "Mit {engine} suchen oder Verknüpfungen filtern...", "clear": "Suche löschen"}, "filters": {"all": "Alle", "ia_creativa": "KI & 3D", "arte_media": "Kunst & Medien", "productividad": "Google & Tools", "social_compras": "Social & Shopping"}, "categories": {"cat_3d": "3D-Modellierung & KI", "cat_ai": "Künstliche Intelligenz", "cat_art": "Digitale Kunst & Modelle", "cat_audio": "Audio-Generierung", "cat_google": "Google Workspace & KI", "cat_tools": "Tools & Entwickler", "cat_social": "Community & Soziales", "cat_shopping": "Shopping & Bezahlen", "cat_video": "Video & KI-Generierung"}, "badges": {"apps": "Apps"}, "shortcuts": {"meshy": "KI-gestützte Generierung von 3D-Modellen und Texturen aus Text oder Bild", "tripo3d": "Schnelles Studio zur Erstellung produktionsbereiter 3D-Modelle mit KI", "ludoai": "KI-Plattform für Spielideen, Marktanalysen und Videospielforschung", "chatgpt": "Fortschrittlicher KI-Assistent und logisches Denken mit GPT-4o", "deepseek": "Tiefgreifendes KI-Modell mit hoher Präzision bei der Codegenerierung", "claude": "Anthropics KI-Modell mit riesigem Kontextfenster und Codeanalyse", "qwen": "Basis-KI-Modelle und Chatbot von Alibaba Cloud (Qwen 2.5)", "seaverse": "KI-Tools und Generatoren für virtuelle Welten und Multimedia", "civitai": "Community-Repository für Modelle, Checkpoints und LoRAs für Stable Diffusion", "shakker": "Plattform zur hochauflösenden Bildgenerierung und KI-Bildfusion", "tensorart": "Online-Kunstgenerator mit kostenlosen täglichen Generierungsguthaben", "seaart": "KI-unterstütztes Studio für künstlerische Erstellung und Bildrendering", "shadertoy": "Plattform zum Programmieren, Visualisieren und Teilen von GLSL-Shadern in WebGL", "minimax": "Ultrarealistische Stimmengenerierung und Sprachklonung mit KI", "suno": "Vollständige Song- und Musikkomposition mit von KI erstellten Texten", "elevenlabs": "Branchenführende Sprachsynthese und mehrsprachige Audioübersetzung", "google": "Globale Websuchmaschine und integrierte Google-Dienste", "gmail": "Sicherer und synchronisierter E-Mail-Dienst von Google", "googledrive": "Cloud-Speicher und kollaborative Dateiverwaltung", "gemini": "Multimodales Google-KI-Modell im Arbeitsbereich-Ökosystem", "googleaistudio": "Schnelle Prototyping-Umgebung für Entwickler mit Gemini-APIs", "notebooklm": "Intelligentes Notizbuch mit KI-generierten Audio-Zusammenfassungen", "birme": "Flexibler Stapel-Bildverkleinerer und smarter Zuschnitt", "photoroom": "Professioneller Hintergrundentferner und schnelle Fotobearbeitung", "github": "Kollaborative Entwicklungsplattform und Git-Repositories", "itchio": "Indie-Marktplatz für Videospiele, Assets, Musik und Sprites", "optimizeglb": "Draco-Kompression und Optimierung für 3D-GLB/glTF-Dateien", "translate": "Sofortige Text- und Webseitenübersetzung in mehreren Sprachen", "instagram": "Soziales Netzwerk für Fotos, Videos, Stories und Reels", "facebook": "Soziales Netzwerk zum Verbinden mit Freunden, Gruppen und Communities", "x": "Echtzeit-Microblogging-Netzwerk für Nachrichten und globale Trends", "tiktok": "Plattform für kurze vertikale Videos und kreative Clips", "threads": "Konversations- und Microblogging-Plattform verknüpft mit Instagram", "patreon": "Abonnements und Mitgliedschaftsplattform für Content-Ersteller", "discord": "Sprach-, Video- und Text-Chatserver für Communities", "linkedin": "Professionelles soziales Netzwerk für Karriere und Networking", "exophase": "Gaming-Erfolgs-, Trophäen- und plattformübergreifendes Profil-Tracking", "amazon": "Globaler Online-Marktplatz mit schneller Produktlieferung", "aliexpress": "Online-Shopping-Plattform mit Artikeln zu Fabrikpreisen", "pccomponentes": "Fachgeschäft für Computer, Hardware und Technik", "paypal": "Sichere Online-Zahlungsplattform und digitale Geldbörse", "wallapop": "Marktplatz für den Kauf und Verkauf von gebrauchten Artikeln", "youtube": "Streaming-Videoplattform, Tutorials, Musik und Live-Übertragungen", "kling": "Kinoreife Videogenerierung mit realistischen Bewegungen durch KI", "hedra": "Erstellung sprechender Avatare und animierter Charaktere mit KI"}, "no_results": {"title": "Keine Verknüpfungen gefunden", "desc": "Versuchen Sie andere Suchbegriffe oder drücken Sie Enter, um direkt im Web zu suchen."}, "weather": {"title": "Wetter-Stadt konfigurieren", "desc": "Geben Sie den Namen Ihrer Stadt ein, um die Live-Wettervorhersage zu sehen:", "input_placeholder": "z. B. Berlin, Wien, Zürich, München...", "search_btn": "Suchen", "auto_btn": "Automatisch über IP ermitteln", "loading": "Laden...", "offline": "Offline", "conditions": {"clear": "Klarer Himmel", "mostly_clear": "Überwiegend klar", "partly_cloudy": "Teilweise bewölkt", "cloudy": "Bedeckt", "fog": "Nebel", "drizzle": "Leichter Nieselregen", "rain": "Regen", "heavy_rain": "Starker Regen", "snow": "Schnee", "showers": "Regenschauer", "snow_showers": "Schneeschauer", "thunderstorm": "Gewitter", "hail_thunderstorm": "Gewitter mit Hagel"}}, "cmdk": {"placeholder": "Verknüpfung, Tool oder Schnellbefehl suchen...", "direct_search_prefix": "Auf {engine} suchen:", "direct_search_cat": "Direkte Websuche", "action_open": "Öffnen", "action_search": "Suchen", "tip_nav": "Navigieren", "tip_open": "Link öffnen", "tip_close": "Schließen"}, "user_modal": {"title": "Benutzername ändern", "desc": "Passen Sie den Namen an, der im Titel und in den Begrüßungen Ihres Kontrollzentrums angezeigt wird:", "input_placeholder": "Ihr Name oder Pseudonym...", "save_btn": "Speichern", "preview_label": "Vorschau:", "tooltip_title": "Klicken, um Ihren Benutzernamen zu ändern", "doc_title_suffix": "· Kontrollzentrum"}}
    };

    // --- Elements ---
    const searchInput = document.getElementById('main-search');
    const clearSearchBtn = document.getElementById('clear-search');
    const filterPills = document.querySelectorAll('.pill-btn');
    const categories = document.querySelectorAll('.categoria');
    const allCards = document.querySelectorAll('.enlace-icono');
    const noResultsMsg = document.getElementById('no-results-msg');
    
    // Header & Widgets
    const liveTimeEl = document.getElementById('live-time');
    const liveDateEl = document.getElementById('live-date');
    const greetingTextEl = document.getElementById('greeting-text');
    const soundToggleBtn = document.getElementById('sound-toggle');
    const soundIconOn = document.getElementById('sound-icon-on');
    const soundIconOff = document.getElementById('sound-icon-off');
    
    // Language Dropdown Elements
    const langBtn = document.getElementById('lang-btn');
    const langMenu = document.getElementById('lang-menu');
    const langOpts = document.querySelectorAll('.lang-opt');
    // Theme Dropdown Elements
    const themeBtn = document.getElementById('theme-btn');
    const themeMenu = document.getElementById('theme-menu');
    const themeOptions = document.querySelectorAll('.theme-opt');

    

    // Search Engine Selector Elements
    const engineBtn = document.getElementById('engine-btn');
    const engineMenu = document.getElementById('engine-menu');
    const engineOpts = document.querySelectorAll('.engine-opt');
    const engineIconCurrent = document.getElementById('engine-icon-current');
    const engineNameCurrent = document.getElementById('engine-name-current');

    // Smart Liquid Tooltip Elements
    const smartTooltip = document.getElementById('smart-tooltip');
    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipDomain = document.getElementById('tooltip-domain');
    const tooltipDesc = document.getElementById('tooltip-desc');

    // --- Search Engine Definitions ---
    const engines = {
        google: { name: 'Google', icon: 'iconos/google.webp', url: 'https://www.google.com/search?q=' },
        duckduckgo: { name: 'DuckDuckGo', icon: 'iconos/duckduckgo.webp', url: 'https://duckduckgo.com/?q=' },
        perplexity: { name: 'Perplexity', icon: 'iconos/perplexity.webp', url: 'https://www.perplexity.ai/search?q=' },
        bing: { name: 'Bing', icon: 'iconos/bing.webp', url: 'https://www.bing.com/search?q=' },
        youtube: { name: 'YouTube', icon: 'iconos/youtube.webp', url: 'https://www.youtube.com/results?search_query=' },
        github: { name: 'GitHub', icon: 'iconos/github.webp', url: 'https://github.com/search?q=' }
    };

    // --- State ---
    let soundEnabled = localStorage.getItem('sound_enabled') !== 'false';
    // Language State & Auto-detection
    const detectDefaultLanguage = () => {
        const saved = localStorage.getItem('app_language');
        if (saved && i18nDictionaries[saved]) return saved;
        const navLang = (navigator.language || navigator.userLanguage || 'es').toLowerCase();
        if (navLang.startsWith('fr')) return 'fr';
        if (navLang.startsWith('de')) return 'de';
        if (navLang.startsWith('en')) return 'en';
        return 'es';
    };

    let currentLang = detectDefaultLanguage();
    let currentTheme = localStorage.getItem('app_theme') || 'cyber';
    let currentEngineKey = localStorage.getItem('search_engine') || 'google';
    let currentEngine = engines[currentEngineKey] || engines.google;
    let currentFilter = localStorage.getItem('active_pill_filter') || 'all';
                
    // --- Helper: Extract Domain ---
    const extractDomain = (url) => {
        try {
            return new URL(url).hostname.replace(/^www\./, '');
        } catch (e) {
            return '';
        }
    };

    // --- 1. Sound FX Engine ---
    const hoverSound = new Audio('sounds/hover.mp3');
    const clickSound = new Audio('sounds/click.mp3');
    hoverSound.volume = 0.08;
    clickSound.volume = 0.18;

    const playSound = (audio) => {
        if (!soundEnabled) return;
        try {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        } catch (e) {}
    };

    const updateSoundUI = () => {
        if (soundEnabled) {
            soundIconOn.classList.remove('hidden');
            soundIconOff.classList.add('hidden');
        } else {
            soundIconOn.classList.add('hidden');
            soundIconOff.classList.remove('hidden');
        }
    };

    soundToggleBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        localStorage.setItem('sound_enabled', soundEnabled);
        updateSoundUI();
        if (soundEnabled) playSound(clickSound);
    });
    updateSoundUI();

    // Attach sound triggers to cards and interactive buttons
    allCards.forEach(card => {
        card.addEventListener('mouseenter', () => playSound(hoverSound));
        card.addEventListener('click', () => playSound(clickSound));
    });

    document.querySelectorAll('.control-btn, .pill-btn, .cmdk-trigger-btn, .engine-selector-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => playSound(hoverSound));
        btn.addEventListener('click', () => playSound(clickSound));
    });

    // --- 1.5. User Name & Suffix Engine ---
    const brandUserNameEl = document.getElementById('brand-user-name');
    const brandUserSuffixEl = document.getElementById('brand-user-suffix');
    const userModal = document.getElementById('user-modal');
    const closeUserModalBtn = document.getElementById('close-user-modal');
    const userNameInput = document.getElementById('user-name-input');
    const userSaveBtn = document.getElementById('user-save-btn');
    const userPreviewText = document.getElementById('user-preview-text');

    let currentUserName = localStorage.getItem('custom_user_name') || 'HaDeS';

    const formatUserNameTitle = (name) => {
        const trimmed = (name || 'HaDeS').trim();
        if (!trimmed) return { name: 'HaDeS', suffix: "'", full: "HaDeS' SHORTCUTS" };
        const lastChar = trimmed.slice(-1).toLowerCase();
        const suffix = (lastChar === 's') ? "'" : "'s";
        return {
            name: trimmed,
            suffix: suffix,
            full: `${trimmed}${suffix} SHORTCUTS`
        };
    };

    const updateUserNameUI = (name) => {
        currentUserName = (name || 'HaDeS').trim();
        localStorage.setItem('custom_user_name', currentUserName);

        const formatted = formatUserNameTitle(currentUserName);
        if (brandUserNameEl) brandUserNameEl.textContent = formatted.name;
        if (brandUserSuffixEl) brandUserSuffixEl.textContent = formatted.suffix;

        // Update Document Title
        const tDoc = (i18nDictionaries[currentLang] || i18nDictionaries.es).user_modal?.doc_title_suffix || '· Command Center';
        document.title = `${formatted.name}${formatted.suffix} Shortcuts ${tDoc}`;

        // Refresh dynamic greeting
        updateClockAndGreeting();
    };

    const openUserModal = () => {
        if (!userModal) return;
        userModal.classList.remove('hidden');
        if (userNameInput) {
            userNameInput.value = currentUserName;
            updateUserPreview();
            setTimeout(() => {
                userNameInput.focus();
                userNameInput.select();
            }, 50);
        }
        playSound(clickSound);
    };

    const closeUserModal = () => {
        if (userModal) userModal.classList.add('hidden');
    };

    const updateUserPreview = () => {
        const previewEl = document.getElementById('user-preview-text');
        if (!userNameInput || !previewEl) return;
        const val = userNameInput.value.trim() || 'HaDeS';
        const formatted = formatUserNameTitle(val);
        previewEl.textContent = formatted.full;
    };

    if (brandUserNameEl) {
        brandUserNameEl.addEventListener('click', openUserModal);
        brandUserNameEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openUserModal();
            }
        });
    }

    if (closeUserModalBtn) closeUserModalBtn.addEventListener('click', closeUserModal);
    if (userModal) {
        userModal.addEventListener('click', (e) => {
            if (e.target === userModal) closeUserModal();
        });
    }

    if (userNameInput) {
        userNameInput.addEventListener('input', updateUserPreview);
        userNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveUserName();
            } else if (e.key === 'Escape') {
                closeUserModal();
            }
        });
    }

    const saveUserName = () => {
        const val = userNameInput?.value.trim() || 'HaDeS';
        updateUserNameUI(val);
        closeUserModal();
        playSound(clickSound);
    };

    if (userSaveBtn) userSaveBtn.addEventListener('click', saveUserName);

    // --- 2. Live Clock & Dynamic Greeting ---
    const updateClockAndGreeting = () => {
        const now = new Date();
        
        // Time HH:MM
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        if (liveTimeEl) liveTimeEl.textContent = `${hours}:${minutes}`;

        // Localized Date Format
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        const localeMap = { es: 'es-ES', en: 'en-US', fr: 'fr-FR', de: 'de-DE' };
        if (liveDateEl) {
            const dateStr = now.toLocaleDateString(localeMap[currentLang] || 'es-ES', options);
            liveDateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        }

        // Localized Contextual Greeting with Dynamic User Name
        const t = i18nDictionaries[currentLang] || i18nDictionaries.es;
        const hour = now.getHours();
        let greeting = t.brand_greeting;
        const uName = currentUserName || 'HaDeS';
        if (hour >= 6 && hour < 13) {
            greeting = t.greetings.morning.replace('HaDeS', uName);
        } else if (hour >= 13 && hour < 21) {
            greeting = t.greetings.afternoon.replace('HaDeS', uName);
        } else {
            greeting = t.greetings.night.replace('HaDeS', uName);
        }
        if (greetingTextEl) greetingTextEl.textContent = greeting;
    };

    // Precision minute sync (Wakes CPU only on exact :00 second transition)
    const scheduleNextMinute = () => {
        updateClockAndGreeting();
        const now = new Date();
        const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50;
        setTimeout(scheduleNextMinute, msToNextMinute);
    };
    scheduleNextMinute();

        // --- 2.5. Live Weather & City Customization Engine ---
    const weatherWidget = document.getElementById('weather-widget');
    const weatherIconEl = document.getElementById('weather-icon');
    const weatherTempEl = document.getElementById('weather-temp');
    const weatherCityEl = document.getElementById('weather-city');
    const weatherConditionEl = document.getElementById('weather-condition');

    // Weather Modal Elements
    const weatherModal = document.getElementById('weather-modal');
    const closeWeatherModalBtn = document.getElementById('close-weather-modal');
    const weatherCityInput = document.getElementById('weather-city-input');
    const weatherSearchBtn = document.getElementById('weather-search-btn');
    const weatherCityResults = document.getElementById('weather-city-results');
    const weatherAutoBtn = document.getElementById('weather-auto-btn');

    const getWeatherInfo = (code, isDay) => {
        const t = (i18nDictionaries[currentLang] || i18nDictionaries.es).weather.conditions;
        switch (code) {
            case 0:
                return { desc: t.clear, icon: isDay ? '☀️' : '🌙' };
            case 1:
                return { desc: t.mostly_clear, icon: isDay ? '🌤️' : '🌙' };
            case 2:
                return { desc: t.partly_cloudy, icon: isDay ? '⛅' : '☁️' };
            case 3:
                return { desc: t.cloudy, icon: '☁️' };
            case 45:
            case 48:
                return { desc: t.fog, icon: '🌫️' };
            case 51:
            case 53:
            case 55:
                return { desc: t.drizzle, icon: '🌦️' };
            case 61:
            case 63:
                return { desc: t.rain, icon: '🌧️' };
            case 65:
                return { desc: t.heavy_rain, icon: '🌧️' };
            case 71:
            case 73:
            case 75:
            case 77:
                return { desc: t.snow, icon: '❄️' };
            case 80:
            case 81:
            case 82:
                return { desc: t.showers, icon: '🌧️' };
            case 85:
            case 86:
                return { desc: t.snow_showers, icon: '🌨️' };
            case 95:
                return { desc: t.thunderstorm, icon: '⛈️' };
            case 96:
            case 99:
                return { desc: t.hail_thunderstorm, icon: '⛈️' };
            default:
                return { desc: t.clear, icon: isDay ? '☀️' : '🌙' };
        }
    };

    const updateWeatherUI = (city, temp, code, isDay) => {
        window.lastWeatherState = { city, temp, code, isDay };
        if (weatherCityEl) weatherCityEl.textContent = city;
        if (weatherTempEl) weatherTempEl.textContent = `${Math.round(temp)}°C`;
        const info = getWeatherInfo(code, isDay);
        if (weatherIconEl) weatherIconEl.textContent = info.icon;
        if (weatherConditionEl) weatherConditionEl.textContent = info.desc;
    };

    const fetchWeatherForCoords = async (lat, lon, cityName) => {
        try {
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const wData = await wRes.json();
            const current = wData.current_weather;

            if (current) {
                const temp = current.temperature;
                const code = current.weathercode;
                const isDay = current.is_day === 1;

                updateWeatherUI(cityName, temp, code, isDay);

                localStorage.setItem('weather_cache_v2', JSON.stringify({
                    city: cityName,
                    lat,
                    lon,
                    temp,
                    code,
                    isDay,
                    timestamp: Date.now()
                }));
                return true;
            }
        } catch (e) {
            console.warn('Weather fetch error:', e);
        }
        return false;
    };

    const detectLocationAndWeather = async () => {
        // Check manually configured city
        const manualCityConfig = localStorage.getItem('weather_manual_city');
        if (manualCityConfig) {
            try {
                const cfg = JSON.parse(manualCityConfig);
                const ok = await fetchWeatherForCoords(cfg.lat, cfg.lon, cfg.name);
                if (ok) return;
            } catch (e) {}
        }

        // Check cached weather (15 min TTL)
        const cached = localStorage.getItem('weather_cache_v2');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                const now = Date.now();
                if (now - data.timestamp < 15 * 60 * 1000) {
                    updateWeatherUI(data.city, data.temp, data.code, data.isDay);
                    return;
                }
            } catch (e) {}
        }

        // Multi-Source Geolocation Resolver
        let detectedCity = 'Vigo';
        let detectedLat = 42.2328;
        let detectedLon = -8.7226;
        let resolved = false;

        // Provider 1: ipwho.is (CORS enabled)
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

        // Provider 2: get.geojs.io
        if (!resolved) {
            try {
                const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
                const geoData = await geoRes.json();
                if (geoData && geoData.latitude) {
                    detectedCity = geoData.city || 'Tu Zona';
                    detectedLat = parseFloat(geoData.latitude);
                    detectedLon = parseFloat(geoData.longitude);
                    resolved = true;
                }
            } catch (e) {}
        }

        // Provider 3: Fallback by Browser Timezone
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

        await fetchWeatherForCoords(detectedLat, detectedLon, detectedCity);
    };

    detectLocationAndWeather();
    setInterval(detectLocationAndWeather, 15 * 60 * 1000);

    // Weather Modal Interactions
    const openWeatherModal = () => {
        weatherModal.classList.remove('hidden');
        weatherCityInput.value = '';
        weatherCityResults.classList.add('hidden');
        weatherCityResults.innerHTML = '';
        setTimeout(() => weatherCityInput.focus(), 50);
        playSound(clickSound);
    };

    const closeWeatherModal = () => {
        weatherModal.classList.add('hidden');
    };

    if (weatherWidget) {
        weatherWidget.addEventListener('click', openWeatherModal);
        weatherWidget.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openWeatherModal();
            }
        });
    }

    if (closeWeatherModalBtn) closeWeatherModalBtn.addEventListener('click', closeWeatherModal);
    if (weatherModal) {
        weatherModal.addEventListener('click', (e) => {
            if (e.target === weatherModal) closeWeatherModal();
        });
    }

    const searchCityGeocoding = async () => {
        const query = weatherCityInput.value.trim();
        if (!query) return;

        weatherSearchBtn.textContent = '...';
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json`);
            const data = await res.json();
            weatherCityResults.innerHTML = '';

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
                        await fetchWeatherForCoords(loc.latitude, loc.longitude, loc.name);
                        closeWeatherModal();
                        playSound(clickSound);
                    });
                    weatherCityResults.appendChild(item);
                });
                weatherCityResults.classList.remove('hidden');
            } else {
                weatherCityResults.innerHTML = '<div style="padding: 8px 12px; font-size: 0.82rem; color: var(--text-muted); text-align: center;">No se encontraron ciudades con ese nombre.</div>';
                weatherCityResults.classList.remove('hidden');
            }
        } catch (e) {
            weatherCityResults.innerHTML = '<div style="padding: 8px 12px; font-size: 0.82rem; color: #ff6b6b; text-align: center;">Error al buscar ciudad. Comprueba tu conexión.</div>';
            weatherCityResults.classList.remove('hidden');
        } finally {
            weatherSearchBtn.textContent = 'Buscar';
        }
    };

    if (weatherSearchBtn) weatherSearchBtn.addEventListener('click', searchCityGeocoding);
    if (weatherCityInput) {
        weatherCityInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchCityGeocoding();
            }
        });
    }

    if (weatherAutoBtn) {
        weatherAutoBtn.addEventListener('click', async () => {
            localStorage.removeItem('weather_manual_city');
            localStorage.removeItem('weather_cache_v2');
            await detectLocationAndWeather();
            closeWeatherModal();
            playSound(clickSound);
        });
    }

    // --- 3.2. Internationalization (i18n) Engine ---
    const setLanguage = (langCode) => {
        if (!i18nDictionaries[langCode]) langCode = 'es';
        currentLang = langCode;
        localStorage.setItem('app_language', langCode);
        const t = i18nDictionaries[langCode];

        // 1. Update HTML lang attribute
        document.documentElement.setAttribute('lang', langCode);

        // 2. Update Greeting & Clock Date
        updateClockAndGreeting();

        // 3. Update Controls Tooltips
        if (soundToggleBtn) soundToggleBtn.title = t.controls.sound_title;
        if (themeBtn) themeBtn.title = t.controls.theme_title;
        if (langBtn) langBtn.title = t.controls.lang_title;
        

        // 4. Update Search Placeholder
        if (searchInput) searchInput.placeholder = t.search.placeholder.replace('{engine}', currentEngine.name);
        if (clearSearchBtn) clearSearchBtn.setAttribute('aria-label', t.search.clear);

        // 5. Update Filter Pills
        const pillAll = document.querySelector('[data-filter="all"]');
        if (pillAll) {
            const count = pillAll.querySelector('.pill-count')?.textContent || allCards.length;
            pillAll.innerHTML = `${t.filters.all} <span class="pill-count">${count}</span>`;
        }
        const pillIa = document.querySelector('[data-filter="ia-creativa"]');
        if (pillIa) pillIa.textContent = t.filters.ia_creativa;
        const pillArte = document.querySelector('[data-filter="arte-media"]');
        if (pillArte) pillArte.textContent = t.filters.arte_media;
        const pillProd = document.querySelector('[data-filter="productividad"]');
        if (pillProd) pillProd.textContent = t.filters.productividad;
        const pillSocial = document.querySelector('[data-filter="social-compras"]');
        if (pillSocial) pillSocial.textContent = t.filters.social_compras;

        // 6. Update Category Titles
        categories.forEach(cat => {
            const h2 = cat.querySelector('h2[data-cat-key]');
            if (h2) {
                const key = h2.getAttribute('data-cat-key');
                if (t.categories[key]) h2.textContent = t.categories[key];
            }
        });

        // 7. Update Dynamic Shortcut Tooltip Descriptions
        allCards.forEach(card => {
            const appKey = card.getAttribute('data-app-key');
            if (appKey && t.shortcuts[appKey]) {
                card.setAttribute('data-desc', t.shortcuts[appKey]);
            }
        });

        // 7.5. Update User Name Modal & Tooltip Texts
        const uModal = t.user_modal || i18nDictionaries.es.user_modal;
        if (brandUserNameEl) brandUserNameEl.title = uModal.tooltip_title;
        const userModalHeader = document.querySelector('.user-modal-header h3');
        const userModalDesc = document.querySelector('.user-modal-desc');
        const userPreviewLabel = document.querySelector('.user-modal-preview');
        if (userModalHeader) userModalHeader.textContent = uModal.title;
        if (userModalDesc) userModalDesc.textContent = uModal.desc;
        if (userNameInput) userNameInput.placeholder = uModal.input_placeholder;
        if (userSaveBtn) userSaveBtn.textContent = uModal.save_btn;
        if (userPreviewLabel) {
            const formatted = formatUserNameTitle(currentUserName);
            userPreviewLabel.innerHTML = `${uModal.preview_label} <strong id="user-preview-text">${formatted.full}</strong>`;
        }
        updateUserNameUI(currentUserName);

        // 8. Update No Results Box
        const noResTitle = noResultsMsg?.querySelector('h3');
        const noResDesc = noResultsMsg?.querySelector('p');
        if (noResTitle) noResTitle.textContent = t.no_results.title;
        if (noResDesc) noResDesc.textContent = t.no_results.desc;

        // 9. Update Weather Modal Texts
        const weatherModalHeader = document.querySelector('.weather-modal-title-row h3');
        const weatherModalDesc = document.querySelector('.weather-modal-desc');
        if (weatherModalHeader) weatherModalHeader.textContent = t.weather.title;
        if (weatherModalDesc) weatherModalDesc.textContent = t.weather.desc;
        if (weatherCityInput) weatherCityInput.placeholder = t.weather.input_placeholder;
        if (weatherSearchBtn) weatherSearchBtn.textContent = t.weather.search_btn;
        if (weatherAutoBtn) weatherAutoBtn.textContent = t.weather.auto_btn;

        // 11. Update Language Options UI
        langOpts.forEach(opt => {
            if (opt.getAttribute('data-set-lang') === langCode) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });

        // 12. Refresh Live Weather Condition Text
        if (window.lastWeatherState) {
            updateWeatherUI(window.lastWeatherState.city, window.lastWeatherState.temp, window.lastWeatherState.code, window.lastWeatherState.isDay);
        }

        // 13. Rebuild CMDK Catalogue with localized descriptions
            };

    // --- 3. Multi-Theme Switcher ---
    const setTheme = (themeName) => {
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('app_theme', themeName);
        currentTheme = themeName;

        // Language Dropdown Event Listeners
    if (langBtn) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = langMenu.classList.toggle('active');
            langBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            if (themeMenu) {
                themeMenu.classList.remove('active');
                if (themeBtn) themeBtn.setAttribute('aria-expanded', 'false');
            }
            if (engineMenu) {
                engineMenu.classList.remove('active');
                if (engineBtn) engineBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    langOpts.forEach(opt => {
        opt.addEventListener('click', () => {
            const lang = opt.getAttribute('data-set-lang');
            setLanguage(lang);
            langMenu.classList.remove('active');
            if (langBtn) langBtn.setAttribute('aria-expanded', 'false');
            playSound(clickSound);
        });
    });

    themeOptions.forEach(opt => {
            if (opt.getAttribute('data-set-theme') === themeName) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    };

    setTheme(currentTheme);
    // Initialize Language
    updateUserNameUI(currentUserName);
    setLanguage(currentLang);

    themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = themeMenu.classList.toggle('active');
        themeBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (engineMenu) {
            engineMenu.classList.remove('active');
            if (engineBtn) engineBtn.setAttribute('aria-expanded', 'false');
        }
    });



    // Language Dropdown Event Listeners
    if (langBtn) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = langMenu.classList.toggle('active');
            langBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            if (themeMenu) {
                themeMenu.classList.remove('active');
                if (themeBtn) themeBtn.setAttribute('aria-expanded', 'false');
            }
            if (engineMenu) {
                engineMenu.classList.remove('active');
                if (engineBtn) engineBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    langOpts.forEach(opt => {
        opt.addEventListener('click', () => {
            const lang = opt.getAttribute('data-set-lang');
            setLanguage(lang);
            langMenu.classList.remove('active');
            if (langBtn) langBtn.setAttribute('aria-expanded', 'false');
            playSound(clickSound);
        });
    });

    themeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const theme = opt.getAttribute('data-set-theme');
            setTheme(theme);
            themeMenu.classList.remove('active');
            playSound(clickSound);
        });
    });

    // --- 3.5. Search Engine Manager ---
    const setSearchEngine = (engineKey) => {
        if (!engines[engineKey]) engineKey = 'google';
        currentEngineKey = engineKey;
        currentEngine = engines[engineKey];
        localStorage.setItem('search_engine', engineKey);

        if (engineIconCurrent) {
            engineIconCurrent.innerHTML = `<img src="${currentEngine.icon}" class="engine-icon-img" alt="${currentEngine.name}">`;
        }
        if (engineNameCurrent) engineNameCurrent.textContent = currentEngine.name;
        if (searchInput) searchInput.placeholder = `Buscar con ${currentEngine.name} o filtrar atajos...`;

        engineOpts.forEach(opt => {
            if (opt.getAttribute('data-engine') === engineKey) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    };

    setSearchEngine(currentEngineKey);

    engineBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = engineMenu.classList.toggle('active');
        engineBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (themeMenu) {
            themeMenu.classList.remove('active');
            if (themeBtn) themeBtn.setAttribute('aria-expanded', 'false');
        }
    });



    engineOpts.forEach(opt => {
        opt.addEventListener('click', () => {
            const engineKey = opt.getAttribute('data-engine');
            setSearchEngine(engineKey);
            engineMenu.classList.remove('active');
            playSound(clickSound);
            searchInput.focus();
        });
    });

    // Consolidated Global Click Listener (Closes outside dropdowns efficiently)
    document.addEventListener('click', (e) => {
        if (themeMenu && themeMenu.classList.contains('active') && !themeMenu.contains(e.target) && !themeBtn.contains(e.target)) {
            themeMenu.classList.remove('active');
            themeBtn.setAttribute('aria-expanded', 'false');
        }
        if (engineMenu && engineMenu.classList.contains('active') && !engineMenu.contains(e.target) && !engineBtn.contains(e.target)) {
            engineMenu.classList.remove('active');
            engineBtn.setAttribute('aria-expanded', 'false');
        }
        if (langMenu && langMenu.classList.contains('active') && !langMenu.contains(e.target) && !langBtn.contains(e.target)) {
            langMenu.classList.remove('active');
            langBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // --- 4. Interactive Spotlight Cursor Effect on Bento Cards (rAF Throttled) ---
    let rafSpotlightId = null;
    categories.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const clientX = e.clientX;
            const clientY = e.clientY;
            if (rafSpotlightId) cancelAnimationFrame(rafSpotlightId);
            rafSpotlightId = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = clientX - rect.left;
                const y = clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    });

    // --- 4.5. Smart Liquid Tooltip Engine ---
    allCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const title = card.getAttribute('data-title') || card.innerText.trim();
            const desc = card.getAttribute('data-desc') || 'Acceso directo rápido';
            const url = card.getAttribute('href') || '';
            const domain = extractDomain(url);

            tooltipTitle.textContent = title;
            tooltipDesc.textContent = desc;
            tooltipDomain.textContent = domain;

            // Position calculation
            const rect = card.getBoundingClientRect();
            smartTooltip.classList.remove('hidden');

            const tooltipRect = smartTooltip.getBoundingClientRect();
            let top = rect.top - tooltipRect.height - 12;
            let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

            // Flip to bottom if top is out of viewport
            if (top < 10) {
                top = rect.bottom + 12;
            }

            // Keep within viewport horizontally
            const padding = 12;
            if (left < padding) left = padding;
            if (left + tooltipRect.width > window.innerWidth - padding) {
                left = window.innerWidth - tooltipRect.width - padding;
            }

            smartTooltip.style.top = `${top}px`;
            smartTooltip.style.left = `${left}px`;
            smartTooltip.setAttribute('aria-hidden', 'false');

            requestAnimationFrame(() => {
                smartTooltip.classList.add('visible');
            });
        });

        card.addEventListener('mouseleave', () => {
            smartTooltip.classList.remove('visible');
            smartTooltip.setAttribute('aria-hidden', 'true');
            setTimeout(() => {
                if (!smartTooltip.classList.contains('visible')) {
                    smartTooltip.classList.add('hidden');
                }
            }, 180);
        });

        // Accessible Keyboard Focus Support for Tooltips
        card.addEventListener('focus', () => card.dispatchEvent(new MouseEvent('mouseenter')));
        card.addEventListener('blur', () => card.dispatchEvent(new MouseEvent('mouseleave')));
    });

    // --- 5. Filtering & Search Logic (Robust Visibility Engine) ---
    const filterShortcuts = () => {
        const query = searchInput.value.toLowerCase().trim();
        let totalVisibleCards = 0;

        clearSearchBtn.classList.toggle('hidden', query.length === 0);

        categories.forEach(category => {
            const catGroup = category.getAttribute('data-group');
            const matchesGroup = (currentFilter === 'all' || catGroup === currentFilter);

            let visibleInCat = 0;

            category.querySelectorAll('.enlace-icono').forEach(card => {
                const title = card.getAttribute('data-title')?.toLowerCase() || '';
                const desc = card.getAttribute('data-desc')?.toLowerCase() || '';
                const tags = card.getAttribute('data-tags')?.toLowerCase() || '';
                const cardText = (card.innerText || card.textContent || '').toLowerCase();

                const matchesSearch = query === '' || 
                                     title.includes(query) || 
                                     desc.includes(query) ||
                                     tags.includes(query) || 
                                     cardText.includes(query);

                if (matchesGroup && matchesSearch) {
                    card.style.display = 'flex';
                    visibleInCat++;
                    totalVisibleCards++;
                } else {
                    card.style.display = 'none';
                }
            });

            // A category box is displayed ONLY if it belongs to active filter AND has at least 1 matching card
            if (matchesGroup && visibleInCat > 0) {
                category.style.display = 'flex';
            } else {
                category.style.display = 'none';
            }
        });

        // No-results message appears only when search or filter returns 0 matches
        noResultsMsg.classList.toggle('hidden', totalVisibleCards > 0);
    };

    searchInput.addEventListener('input', filterShortcuts);

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (!query) return;

            const visibleCards = Array.from(document.querySelectorAll('.enlace-icono')).filter(card => card.style.display === 'flex');
            if (visibleCards.length === 1 && (visibleCards[0].getAttribute('data-title')?.toLowerCase() === query.toLowerCase() || visibleCards[0].innerText.trim().toLowerCase() === query.toLowerCase())) {
                window.open(visibleCards[0].getAttribute('href'), '_blank');
            } else {
                window.open(`${currentEngine.url}${encodeURIComponent(query)}`, '_blank');
            }
        }
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterShortcuts();
        searchInput.focus();
    });

    // --- Dynamic Counts Calculation (Auto-sync) ---
    const updateDynamicCounts = () => {
        // Update "Todos" pill count
        const allPillCount = document.querySelector('[data-filter="all"] .pill-count');
        if (allPillCount) allPillCount.textContent = allCards.length;

        // Auto-update each category badge
        categories.forEach(cat => {
            const badge = cat.querySelector('.cat-badge');
            const cardCount = cat.querySelectorAll('.enlace-icono').length;
            if (badge) badge.textContent = `${cardCount} apps`;
        });
    };
    updateDynamicCounts();

    // Filter Pills
    // Restore active pill UI from saved state
    const setSavedPill = () => {
        let matched = false;
        filterPills.forEach(p => {
            if (p.getAttribute('data-filter') === currentFilter) {
                p.classList.add('active');
                matched = true;
            } else {
                p.classList.remove('active');
            }
        });
        if (!matched) {
            currentFilter = 'all';
            const allPill = document.querySelector('[data-filter="all"]');
            if (allPill) allPill.classList.add('active');
        }
        filterShortcuts();
    };

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.getAttribute('data-filter');
            localStorage.setItem('active_pill_filter', currentFilter);
            filterShortcuts();
            playSound(clickSound);
        });
    });

    setSavedPill();

        // --- 6. Global Keyboard Shortcuts ---
    document.addEventListener('keydown', (e) => {
        // Ctrl+K or / to focus main search
        if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement !== searchInput)) {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        // ESC to blur search
        else if (e.key === 'Escape') {
            if (document.activeElement === searchInput) {
                searchInput.blur();
            }
        }
    });
});
