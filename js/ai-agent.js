// js/ai-agent.js - Contextual Dashboard AI Agent (Ground-Truth Context, Ollama & Claude API)

import { state, escapeHtml, persistJson } from './state.js';
import { soundFx } from './audio.js';

export class AIAgentEngine {
    constructor() {
        this.storageKey = 'hades_ai_agent_config_v1';
        this.config = this.loadConfig();
        this.drawer = document.getElementById('ai-agent-drawer');
        this.messagesContainer = document.getElementById('ai-agent-messages');
        this.inputEl = document.getElementById('ai-agent-input');
        this.isGenerating = false;
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

    async generateLocalHeuristicResponse(prompt) {
        const p = (prompt || '').toLowerCase().trim();
        const ctx = this.buildSystemContext();

        // 1. Inquiries about shortcuts / tools
        if (p.includes('herramienta') || p.includes('3d') || p.includes('ia') || p.includes('shortcut') || p.includes('tengo')) {
            let matched = ctx.shortcuts;
            if (p.includes('3d')) matched = ctx.shortcuts.filter(s => (s.category || '').includes('3d') || (s.tags || []).includes('3d') || (s.title || '').toLowerCase().includes('3d'));
            else if (p.includes('ia') || p.includes('ai')) matched = ctx.shortcuts.filter(s => (s.category || '').includes('ia') || (s.tags || []).includes('ia'));

            if (matched.length > 0) {
                const list = matched.slice(0, 5).map(s => `* **[${s.title}](${s.url})** \`#${s.category}\` ${(Array.isArray(s.tags) ? s.tags : []).map(t => `#${t}`).join(' ')}`).join('\n');
                return `He analizado tu dashboard actual y tienes **${matched.length} herramientas** relevantes guardadas:\n\n${list}\n\n¿Deseas que abra alguna o que busquemos una nueva para añadirla?`;
            }
        }

        // 2. Recommendations
        if (p.includes('recomiend') || p.includes('sugier') || p.includes('nuevo')) {
            return `Te recomiendo estas herramientas populares de alta productividad:\n\n* **[Hugging Face Spaces](https://huggingface.co/spaces)** \`#ia #ml\` — Modelos y demos interactivos.\n* **[Shadertoy](https://shadertoy.com)** \`#3d #shaders\` — Creación de shaders procedurales WebGL.\n* **[Excalidraw](https://excalidraw.com)** \`#diseño #canvas\` — Pizarra virtual colaborativa.\n\n*Haz clic en cualquier enlace para visitarla.*`;
        }

        return `Entendido. Conozco tus **${ctx.totalShortcuts} atajos** en el espacio activo. Puedes preguntarme:\n- *"¿Qué herramientas de 3D o IA tengo?"*\n- *"Recomiéndame nuevas herramientas para diseño"*\n- *"¿Cómo activo el modo Focus?"*`;
    }

    async sendQuery(userText) {
        if (!userText || this.isGenerating) return;
        this.isGenerating = true;
        soundFx.play('click');

        this.appendMessage('user', userText);
        if (this.inputEl) this.inputEl.value = '';

        const aiMsgDiv = this.appendMessage('ai', 'Pensando...');

        try {
            const ctx = this.buildSystemContext();
            const systemPrompt = `Eres el Asistente IA de HaDeS. Contexto de atajos del usuario: ${JSON.stringify(ctx.shortcuts)}. Responde en español conciso.`;

            if (this.config.provider === 'ollama') {
                const res = await fetch(this.config.ollamaEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: this.config.ollamaModel, prompt: `${systemPrompt}\n\nUsuario: ${userText}`, stream: false })
                });
                const data = await res.json();
                aiMsgDiv.innerHTML = this.formatMarkdown(data.response || 'Sin respuesta del modelo Ollama.');
            } else if (this.config.provider === 'openai' && this.config.openaiApiKey) {
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.openaiApiKey}`
                    },
                    body: JSON.stringify({
                        model: this.config.openaiModel || 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userText }
                        ]
                    })
                });
                const data = await res.json();
                aiMsgDiv.innerHTML = this.formatMarkdown(data.choices?.[0]?.message?.content || 'Sin respuesta de OpenAI.');
            } else if (this.config.provider === 'anthropic' && this.config.anthropicApiKey) {
                const res = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.config.anthropicApiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: this.config.anthropicModel || 'claude-3-5-sonnet-latest',
                        max_tokens: 1024,
                        messages: [{ role: 'user', content: `${systemPrompt}\n\n${userText}` }]
                    })
                });
                const data = await res.json();
                const text = (data.content || []).map((c) => c.text || '').join('\n');
                aiMsgDiv.innerHTML = this.formatMarkdown(text || 'Sin respuesta de Anthropic.');
            } else {
                const resp = await this.generateLocalHeuristicResponse(userText);
                aiMsgDiv.innerHTML = this.formatMarkdown(resp);
            }
            soundFx.play('chime');
        } catch (err) {
            aiMsgDiv.innerHTML = `⚠️ No se pudo conectar con el proveedor (**${this.config.provider}**). Usando motor local:\n\n` + this.formatMarkdown(await this.generateLocalHeuristicResponse(userText));
        } finally {
            this.isGenerating = false;
        }
    }

    appendMessage(role, text) {
        if (!this.messagesContainer) return document.createElement('div');
        const msg = document.createElement('div');
        msg.className = `ai-msg-bubble ${role}`;
        msg.innerHTML = role === 'user' ? escapeHtml(text) : this.formatMarkdown(text);
        this.messagesContainer.appendChild(msg);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        return msg;
    }

    formatMarkdown(text) {
        let html = escapeHtml(text || '');
        html = html.replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>');
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/(?:^|\n)[*-]\s+(.+)/g, '<div class="ai-list-item">• $1</div>');
        html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
        html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="ai-link-chip">🚀 $1</a>');
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    openAndQuery(initialPrompt = '') {
        this.drawer = document.getElementById('ai-agent-drawer');
        if (this.drawer) this.drawer.classList.remove('hidden');
        if (initialPrompt) {
            this.sendQuery(initialPrompt);
        } else if (this.inputEl) {
            this.inputEl.focus();
        }
    }

    closeDrawer() {
        this.drawer = document.getElementById('ai-agent-drawer');
        if (this.drawer) this.drawer.classList.add('hidden');
    }

    init() {
        this.drawer = document.getElementById('ai-agent-drawer');
        this.messagesContainer = document.getElementById('ai-agent-messages');
        this.inputEl = document.getElementById('ai-agent-input');
        const sendBtn = document.getElementById('ai-agent-send-btn');
        const closeBtn = document.getElementById('close-ai-agent-drawer');
        const openBtn = document.getElementById('open-ai-agent-btn');

        if (openBtn) openBtn.onclick = () => this.openAndQuery();
        if (closeBtn) closeBtn.onclick = () => this.closeDrawer();
        if (sendBtn) sendBtn.onclick = () => this.sendQuery(this.inputEl ? this.inputEl.value.trim() : '');
        if (this.inputEl) {
            this.inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendQuery(this.inputEl.value.trim());
                }
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
        const openaiKey = document.getElementById('ai-openai-key');
        const anthropicKey = document.getElementById('ai-anthropic-key');
        const ollamaEndpoint = document.getElementById('ai-ollama-endpoint');
        if (providerSel) {
            providerSel.value = this.config.provider;
            providerSel.addEventListener('change', () => {
                this.config.provider = providerSel.value;
                this.saveConfig();
            });
        }
        if (openaiKey) {
            openaiKey.value = this.config.openaiApiKey || '';
            openaiKey.addEventListener('change', () => {
                this.config.openaiApiKey = openaiKey.value.trim();
                this.saveConfig();
            });
        }
        if (anthropicKey) {
            anthropicKey.value = this.config.anthropicApiKey || '';
            anthropicKey.addEventListener('change', () => {
                this.config.anthropicApiKey = anthropicKey.value.trim();
                this.saveConfig();
            });
        }
        if (ollamaEndpoint) {
            ollamaEndpoint.value = this.config.ollamaEndpoint || '';
            ollamaEndpoint.addEventListener('change', () => {
                this.config.ollamaEndpoint = ollamaEndpoint.value.trim();
                this.saveConfig();
            });
        }
    }
}

export const aiAgent = new AIAgentEngine();
