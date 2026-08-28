// js/ai-agent.js - Contextual Dashboard AI Agent (Ground-Truth Context, Ollama & Claude API)

import { state, escapeHtml, persistJson } from './state.js';
import { soundFx } from './audio.js';

const PROVIDER_TIMEOUT_MS = 25000;
const MAX_MESSAGES = 60;
const PROVIDER_LABELS = {
    local_heuristic: 'Motor local',
    ollama: 'Ollama',
    lmstudio: 'LM Studio',
    openai: 'OpenAI',
    anthropic: 'Anthropic'
};

export class AIAgentEngine {
    constructor() {
        this.storageKey = 'hades_ai_agent_config_v1';
        this.config = this.loadConfig();
        this.drawer = document.getElementById('ai-agent-drawer');
        this.messagesContainer = document.getElementById('ai-agent-messages');
        this.inputEl = document.getElementById('ai-agent-input');
        this.isGenerating = false;
        this.abortController = null;
        this.userAborted = false;
        this.closeTimer = null;
    }

    loadConfig() {
        let stored = {};
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) stored = JSON.parse(raw);
        } catch (e) {}
        let keys = {};
        try {
            keys = JSON.parse(sessionStorage.getItem(this.storageKey + '_keys') || '{}');
        } catch (e) {}
        return {
            provider: stored.provider || 'local_heuristic',
            ollamaEndpoint: stored.ollamaEndpoint || 'http://localhost:11434/api/generate',
            ollamaModel: stored.ollamaModel || 'llama3.2',
            lmstudioEndpoint: stored.lmstudioEndpoint || 'http://localhost:1234/v1/chat/completions',
            lmstudioModel: stored.lmstudioModel || 'local-model',
            openaiApiKey: keys.openaiApiKey || '',
            openaiModel: stored.openaiModel || 'gpt-4o-mini',
            anthropicApiKey: keys.anthropicApiKey || '',
            anthropicModel: stored.anthropicModel || 'claude-3-5-sonnet-latest'
        };
    }

    saveConfig() {
        persistJson(this.storageKey, {
            provider: this.config.provider,
            ollamaEndpoint: this.config.ollamaEndpoint,
            ollamaModel: this.config.ollamaModel,
            lmstudioEndpoint: this.config.lmstudioEndpoint,
            lmstudioModel: this.config.lmstudioModel,
            openaiModel: this.config.openaiModel,
            anthropicModel: this.config.anthropicModel
        });
        try {
            sessionStorage.setItem(this.storageKey + '_keys', JSON.stringify({
                openaiApiKey: this.config.openaiApiKey || '',
                anthropicApiKey: this.config.anthropicApiKey || ''
            }));
        } catch (e) {}
    }

    buildSystemContext() {
        const shortcutsSummary = (state.shortcuts || []).map(s => ({
            title: s.title,
            url: s.url,
            category: s.category,
            tags: Array.isArray(s.tags) ? s.tags : String(s.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
        }));

        return {
            totalShortcuts: shortcutsSummary.length,
            shortcuts: shortcutsSummary,
            activeSpace: (window.spacesManager?.data?.activeSpaceId) || 'space_work',
            theme: state.theme,
            timestamp: new Date().toISOString()
        };
    }

    // Normaliza a minúsculas y quita acentos para matching robusto ES/EN/FR/DE
    static normalize(text) {
        return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    matchShortcut(s, keywords) {
        const hay = [s.category, s.title, ...(Array.isArray(s.tags) ? s.tags : [])]
            .map((v) => AIAgentEngine.normalize(v)).join(' ');
        return keywords.some((k) => hay.includes(k));
    }

    async generateLocalHeuristicResponse(prompt) {
        const p = AIAgentEngine.normalize(prompt);
        const ctx = this.buildSystemContext();

        // 1. Modo Focus
        if (/\b(focus|concentracion|concentration|fokuss)/.test(p)) {
            return `Puedes activar el **Modo Focus** con el atajo **Alt+F** o con el botón **Modo Focus** de la cabecera. Silencia el ruido y deja solo lo esencial de tu espacio activo.`;
        }

        // 2. Recomendaciones
        if (/\b(recomien|sugier|recommen|suggest|recommand|suggere|empfehl)/.test(p)) {
            return `Te recomiendo estas herramientas populares de alta productividad:\n\n* **[Hugging Face Spaces](https://huggingface.co/spaces)** \`#ia #ml\` — Modelos y demos interactivos.\n* **[Shadertoy](https://shadertoy.com)** \`#3d #shaders\` — Creación de shaders procedurales WebGL.\n* **[Excalidraw](https://excalidraw.com)** \`#diseno #canvas\` — Pizarra virtual colaborativa.\n\n*Haz clic en cualquier enlace para visitarla.*`;
        }

        // 3. Búsqueda de atajos guardados
        const wants3d = /\b(3d|blender|unity|shader)\b/.test(p);
        const wantsAI = /\b(ia|ai|ml|llm|gpt)\b/.test(p);
        const wantsTools = /\b(herramientas?|shortcuts?|apps?|tools?|tengo|guardadas?|gespeichert)\b/.test(p);

        if (wants3d || wantsAI || wantsTools) {
            let matched = ctx.shortcuts;
            if (wants3d && wantsAI) matched = ctx.shortcuts.filter((s) => this.matchShortcut(s, ['3d', 'blender', 'unity', 'shader', 'ia', 'ai', 'ml', 'llm', 'gpt']));
            else if (wants3d) matched = ctx.shortcuts.filter((s) => this.matchShortcut(s, ['3d', 'blender', 'unity', 'shader']));
            else if (wantsAI) matched = ctx.shortcuts.filter((s) => this.matchShortcut(s, ['ia', 'ai', 'ml', 'llm', 'gpt']));

            if (matched.length > 0) {
                const list = matched.slice(0, 5)
                    .map((s) => `* **[${AIAgentEngine.sanitizeMd(s.title)}](${AIAgentEngine.sanitizeMd(s.url)})** \`${AIAgentEngine.sanitizeMd(s.category || 'general')}\` ${(Array.isArray(s.tags) ? s.tags : []).slice(0, 3).map((t) => `#${AIAgentEngine.sanitizeMd(t)}`).join(' ')}`)
                    .join('\n');
                return `He analizado tu dashboard actual y tienes **${matched.length} herramientas** relevantes guardadas:\n\n${list}\n\n¿Deseas que abra alguna o que busquemos una nueva para añadirla?`;
            }

            if (ctx.totalShortcuts > 0) {
                return `En tu espacio activo tienes **${ctx.totalShortcuts} atajos**, pero ninguno coincide con esa búsqueda. Prueba a pedirme *herramientas de 3D*, *herramientas de IA* o que te *recomiende nuevas*.`;
            }

            return `Ahora mismo no tienes atajos guardados en tu dashboard. Puedo recomendarte algunas herramientas de arranque: pregúntame *recomiéndame nuevas herramientas*.`;
        }

        return `Entendido. Conozco tus **${ctx.totalShortcuts} atajos** en el espacio activo. Puedes preguntarme:\n- *"¿Qué herramientas de 3D o IA tengo?"*\n- *"Recomiéndame nuevas herramientas para diseño"*\n- *"¿Cómo activo el modo Focus?"*`;
    }

    // --- Proveedor: timeout + abort + validación de respuesta ---

    async httpJson(url, options) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
        this.abortController = controller;
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            let body = null;
            try {
                body = await res.json();
            } catch (e) {
                body = null;
            }
            if (!res.ok) {
                const errObj = body && body.error;
                const detail = (typeof errObj === 'string' && errObj) || (errObj && errObj.message) || (body && body.message) || '';
                throw new Error(`HTTP ${res.status}${detail ? ': ' + detail : ''}`);
            }
            return body;
        } catch (err) {
            if (err && err.name === 'AbortError') throw err;
            throw new Error('error de red: ' + ((err && err.message) ? err.message : String(err)));
        } finally {
            clearTimeout(timer);
            if (this.abortController === controller) this.abortController = null;
        }
    }

    async requestProvider(systemPrompt, userText) {
        const cfg = this.config;

        if (cfg.provider === 'ollama') {
            const data = await this.httpJson(cfg.ollamaEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: cfg.ollamaModel, prompt: `${systemPrompt}\n\nUsuario: ${userText}`, stream: false })
            });
            const text = (data && typeof data.response === 'string') ? data.response : '';
            if (!text) throw new Error('respuesta vacía del modelo');
            return text;
        }

        if (cfg.provider === 'lmstudio') {
            const data = await this.httpJson(cfg.lmstudioEndpoint || 'http://localhost:1234/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: cfg.lmstudioModel || 'local-model',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userText }
                    ]
                })
            });
            const text = (((data && data.choices) || [])[0]?.message?.content) || '';
            if (!text) throw new Error('respuesta vacía del modelo');
            return text;
        }

        if (cfg.provider === 'openai') {
            if (!cfg.openaiApiKey) throw new Error('falta la clave API (configúrala en Ajustes)');
            const data = await this.httpJson('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cfg.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: cfg.openaiModel || 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userText }
                    ]
                })
            });
            const text = (((data && data.choices) || [])[0]?.message?.content) || '';
            if (!text) throw new Error('respuesta vacía del modelo');
            return text;
        }

        if (cfg.provider === 'anthropic') {
            if (!cfg.anthropicApiKey) throw new Error('falta la clave API (configúrala en Ajustes)');
            const data = await this.httpJson('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': cfg.anthropicApiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: cfg.anthropicModel || 'claude-3-5-sonnet-latest',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: `${systemPrompt}\n\n${userText}` }]
                })
            });
            const text = ((data && data.content) || []).map((c) => (c && c.text) || '').join('\n');
            if (!text) throw new Error('respuesta vacía del modelo');
            return text;
        }

        return this.generateLocalHeuristicResponse(userText);
    }

    describeError(err) {
        if (err && err.name === 'AbortError') {
            return this.userAborted
                ? 'generación detenida'
                : `sin respuesta en ${PROVIDER_TIMEOUT_MS / 1000} s (timeout)`;
        }
        const m = /HTTP (\d{3})/.exec(String((err && err.message) || ''));
        if (m) return `el proveedor respondió HTTP ${m[1]}`;
        return 'no se pudo conectar con el proveedor';
    }

    // --- Envío de consulta con fallback local explícito ---

    async sendQuery(userText) {
        if (!userText || this.isGenerating) return;
        this.isGenerating = true;
        this.userAborted = false;
        soundFx.play('click');

        this.appendMessage('user', userText);
        if (this.inputEl) this.inputEl.value = '';
        this.setGeneratingUi(true);

        const aiMsgDiv = this.appendMessage('ai', 'Pensando...');

        try {
            const ctx = this.buildSystemContext();
            const systemPrompt = `Eres el Asistente IA de HaDeS. Contexto de atajos del usuario: ${JSON.stringify(ctx.shortcuts)}. Responde en español conciso.`;
            const text = await this.requestProvider(systemPrompt, userText);
            aiMsgDiv.innerHTML = this.formatMarkdown(text);
            soundFx.play('chime');
        } catch (err) {
            if (err && err.name === 'AbortError' && this.userAborted) {
                aiMsgDiv.innerHTML = '<em>Generación detenida.</em>';
            } else {
                const label = PROVIDER_LABELS[this.config.provider] || this.config.provider;
                const reason = this.describeError(err);
                let local = '';
                try {
                    local = await this.generateLocalHeuristicResponse(userText);
                } catch (e) {
                    local = 'El motor local no pudo generar una respuesta.';
                }
                aiMsgDiv.innerHTML =
                    `<div class="ai-fallback-note"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(reason)}. Respondiendo con el motor local.</div>` +
                    this.formatMarkdown(local);
            }
        } finally {
            this.isGenerating = false;
            this.abortController = null;
            this.setGeneratingUi(false);
        }
    }

    setGeneratingUi(generating) {
        if (this.inputEl) this.inputEl.disabled = generating;
        const send = document.getElementById('ai-agent-send-btn');
        const stop = document.getElementById('ai-agent-stop-btn');
        if (send) send.hidden = generating;
        if (stop) stop.hidden = !generating;
    }

    // --- DOM ---

    appendMessage(role, text) {
        if (!this.messagesContainer) return document.createElement('div');
        const msg = document.createElement('div');
        msg.className = `ai-msg-bubble ${role}`;
        msg.innerHTML = role === 'user' ? escapeHtml(text) : this.formatMarkdown(text);
        this.messagesContainer.appendChild(msg);
        // Tope de mensajes para no acumular DOM sin límite
        while (this.messagesContainer.children.length > MAX_MESSAGES) {
            this.messagesContainer.removeChild(this.messagesContainer.firstElementChild);
        }
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        return msg;
    }

    resetConversation() {
        if (!this.messagesContainer) return;
        // El primer hijo es la burbuja de bienvenida
        while (this.messagesContainer.children.length > 1) {
            this.messagesContainer.removeChild(this.messagesContainer.firstElementChild);
        }
        this.messagesContainer.scrollTop = 0;
    }

    formatMarkdown(text) {
        let html = escapeHtml(text || '');
        html = html.replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>');
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="ai-link-chip">$1</a>');
        html = html.replace(/(?:^|\n)[*-]\s+(.+)/g, '<div class="ai-list-item">• $1</div>');
        html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    openAndQuery(initialPrompt = '') {
        this.drawer = document.getElementById('ai-agent-drawer');
        if (!this.drawer) return;
        window.clearTimeout(this.closeTimer);
        this.drawer.classList.remove('hidden');
        requestAnimationFrame(() => this.drawer.classList.add('open'));
        if (initialPrompt) {
            this.sendQuery(initialPrompt);
        } else if (this.inputEl) {
            this.inputEl.focus();
        }
    }

    closeDrawer() {
        this.drawer = document.getElementById('ai-agent-drawer');
        if (!this.drawer) return;
        // Si hay una petición en vuelo, la detenemos
        if (this.isGenerating) {
            this.userAborted = true;
            if (this.abortController) this.abortController.abort();
        }
        this.drawer.classList.remove('open');
        window.clearTimeout(this.closeTimer);
        this.closeTimer = window.setTimeout(() => {
            if (!this.drawer.classList.contains('open')) this.drawer.classList.add('hidden');
        }, 300);
    }

    // Devuelve true si hay otro modal del proyecto visible encima
    static anotherModalOpen() {
        const modal = document.querySelector(
            '.agenda-full-backdrop, .rss-modal-backdrop, .shortcut-modal-backdrop, .zen-shield-backdrop, ' +
            '.weather-modal-backdrop, .calendar-modal-backdrop, .user-modal-backdrop, .settings-drawer-backdrop'
        );
        return !!(modal && !modal.classList.contains('hidden'));
    }

    // Quita caracteres de markdown para que títulos/URLs de atajos no alteren el render
    static sanitizeMd(value) {
        return String(value || '').replace(/[\[\]()`*\\]/g, '').replace(/\s+/g, ' ').trim();
    }

    init() {
        this.drawer = document.getElementById('ai-agent-drawer');
        this.messagesContainer = document.getElementById('ai-agent-messages');
        this.inputEl = document.getElementById('ai-agent-input');
        const sendBtn = document.getElementById('ai-agent-send-btn');
        const stopBtn = document.getElementById('ai-agent-stop-btn');
        const closeBtn = document.getElementById('close-ai-agent-drawer');
        const openBtn = document.getElementById('open-ai-agent-btn');
        const resetBtn = document.getElementById('ai-agent-reset-btn');
        const settingsBtn = document.getElementById('ai-agent-settings-btn');
        const settingsPanel = document.getElementById('ai-agent-settings-panel');

        if (openBtn) openBtn.onclick = () => this.openAndQuery();
        if (closeBtn) closeBtn.onclick = () => this.closeDrawer();
        if (resetBtn) resetBtn.onclick = () => {
            this.resetConversation();
            soundFx.play('click');
            if (this.inputEl) this.inputEl.focus();
        };
        if (sendBtn) sendBtn.onclick = () => this.sendQuery(this.inputEl ? this.inputEl.value.trim() : '');
        if (stopBtn) stopBtn.onclick = () => {
            if (this.isGenerating) {
                this.userAborted = true;
                if (this.abortController) this.abortController.abort();
            }
        };

        if (this.inputEl) {
            this.inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.isComposing) {
                    e.preventDefault();
                    this.sendQuery(this.inputEl.value.trim());
                }
            });
        }

        if (settingsBtn && settingsPanel) {
            settingsBtn.onclick = () => {
                const nowHidden = settingsPanel.classList.toggle('hidden');
                settingsBtn.setAttribute('aria-expanded', String(!nowHidden));
            };
        }

        // Cerrar con click en el backdrop (no sobre el panel)
        if (this.drawer) {
            this.drawer.addEventListener('click', (e) => {
                if (e.target === this.drawer) this.closeDrawer();
            });
            // Focus trap ligero
            this.drawer.addEventListener('keydown', (e) => {
                if (e.key !== 'Tab') return;
                const focusables = this.drawer.querySelectorAll('button:not([hidden]), input:not([disabled]), select, a[href]');
                if (!focusables.length) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            });
        }

        // Escape (solo si no hay otro modal del proyecto encima)
        if (!this._escBound) {
            this._escBound = true;
            document.addEventListener('keydown', (e) => {
                if (e.key !== 'Escape') return;
                if (!this.drawer || this.drawer.classList.contains('hidden')) return;
                if (AIAgentEngine.anotherModalOpen()) return;
                this.closeDrawer();
            });
        }

        this.bindProviderUi();

        // Prompt suggestion chips
        document.querySelectorAll('.ai-prompt-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const text = chip.getAttribute('data-prompt') || chip.textContent;
                this.sendQuery(text);
            });
        });
    }

    bindProviderUi() {
        const providerSel = document.getElementById('ai-provider-select');
        if (providerSel) {
            providerSel.value = this.config.provider;
            providerSel.addEventListener('change', () => {
                this.config.provider = providerSel.value;
                this.saveConfig();
                this.updateProviderFields();
            });
        }

        // Claves API (solo sesión)
        this.bindSimpleField('ai-openai-key', 'openaiApiKey');
        this.bindSimpleField('ai-anthropic-key', 'anthropicApiKey');

        // Endpoints y modelos
        this.bindSimpleField('ai-ollama-endpoint', 'ollamaEndpoint');
        this.bindSimpleField('ai-ollama-model', 'ollamaModel');
        this.bindSimpleField('ai-lmstudio-endpoint', 'lmstudioEndpoint');
        this.bindSimpleField('ai-lmstudio-model', 'lmstudioModel');
        this.bindSimpleField('ai-openai-model', 'openaiModel');
        this.bindSimpleField('ai-anthropic-model', 'anthropicModel');

        this.updateProviderFields();
    }

    bindSimpleField(elementId, configKey) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.value = this.config[configKey] || '';
        el.addEventListener('change', () => {
            this.config[configKey] = el.value.trim();
            this.saveConfig();
        });
    }

    // Muestra solo el bloque de configuración del proveedor activo
    updateProviderFields() {
        document.querySelectorAll('.ai-config-field[data-provider]').forEach((f) => {
            f.hidden = f.getAttribute('data-provider') !== this.config.provider;
        });
    }
}

export const aiAgent = new AIAgentEngine();