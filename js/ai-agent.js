// js/ai-agent.js - Contextual Dashboard AI Agent (Ground-Truth Context, Ollama & Claude API)

import { state, escapeHtml } from './state.js';
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
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {
            provider: 'local_heuristic', // 'local_heuristic', 'ollama', 'anthropic', 'openai'
            ollamaEndpoint: 'http://localhost:11434/api/generate',
            ollamaModel: 'llama3.2',
            anthropicApiKey: '',
            anthropicModel: 'claude-3-5-sonnet-latest'
        };
    }

    saveConfig() {
        try { localStorage.setItem(this.storageKey, JSON.stringify(this.config)); } catch (e) {}
    }

    buildSystemContext() {
        const shortcutsSummary = (state.shortcuts || []).map(s => ({
            title: s.title,
            url: s.url,
            category: s.category,
            tags: s.tags || []
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
            if (this.config.provider === 'ollama') {
                const ctx = this.buildSystemContext();
                const systemPrompt = `Eres el Asistente IA de HaDeS. Contexto de atajos del usuario: ${JSON.stringify(ctx.shortcuts)}. Responde en español conciso.`;
                const res = await fetch(this.config.ollamaEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: this.config.ollamaModel, prompt: `${systemPrompt}\n\nUsuario: ${userText}`, stream: false })
                });
                const data = await res.json();
                aiMsgDiv.innerHTML = this.formatMarkdown(data.response || 'Sin respuesta del modelo Ollama.');
            } else {
                // Local intelligent heuristic
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
        let html = escapeHtml(text);
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/`(.*?)`/g, '<code class="ai-inline-code">$1</code>');
        html = html.replace(/\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="ai-link-chip">🚀 $1</a>');
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

        // Prompt suggestion chips
        document.querySelectorAll('.ai-prompt-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const text = chip.getAttribute('data-prompt') || chip.textContent;
                this.sendQuery(text);
            });
        });
    }
}

export const aiAgent = new AIAgentEngine();
