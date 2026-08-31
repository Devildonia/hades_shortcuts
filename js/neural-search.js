// js/neural-search.js - Token-overlap semantic search, live AI answers & translator

import { aiAgent } from './ai-agent.js';
import { state, escapeHtml, showToast } from './state.js';
import { i18nDictionaries, getTranslation } from './i18n.js';

export class NeuralSearchEngine {
    constructor() {
        this.index = [];
        this.isReady = false;
        this.aiBannerEl = document.getElementById('search-calc-banner');
    }

    init() {
        this.buildSemanticIndex();
        state.on('shortcuts:changed', () => this.buildSemanticIndex());
        state.on('categories:changed', () => this.buildSemanticIndex());
    }

    buildSemanticIndex() {
        this.index = state.shortcuts.map(sc => {
            const cat = state.categories.find(c => c.id === sc.category);
            const corpus = `${sc.title} ${sc.tags || ''} ${sc.desc || ''} ${cat ? cat.defaultTitle : ''}`.toLowerCase();
            const tokens = this.tokenize(corpus);
            return { id: sc.id, title: sc.title, url: sc.url, tokens, raw: corpus };
        });
        this.isReady = true;
    }

    tokenize(text) {
        return text.replace(/[^a-z0-9áéíóúñ\s]/gi, ' ').split(/\s+/).filter(w => w.length > 1);
    }

    semanticSearch(query) {
        if (!this.isReady || !query || query.length < 3) return null;
        const qTokens = this.tokenize(query.toLowerCase());
        if (qTokens.length === 0) return null;

        const results = [];
        this.index.forEach(item => {
            let score = 0;
            qTokens.forEach(qt => {
                if (item.tokens.includes(qt)) score += 3.0;
                else {
                    item.tokens.forEach(it => {
                        if (it.includes(qt) || qt.includes(it)) score += 1.5;
                    });
                }
            });

            if (score > 0) {
                const normalized = Math.min(100, Math.round((score / (qTokens.length * 3)) * 100));
                results.push({ id: item.id, score: normalized });
            }
        });

        results.sort((a, b) => b.score - a.score);
        return results.length > 0 ? results : null;
    }

    // LIVE (se ejecuta en cada tecla desde filterShortcuts): SOLO previsualiza
    // "Pulsa Enter". Sin efectos secundarios: no abre el agente IA ni hace fetch.
    // La ejecución real ocurre en executeAICommand() al pulsar Enter, consistente
    // con bangs/macros/devtools (regresión: antes saltaba la ventana IA con la
    // primera letra escrita tras "!ai ").
    handleAICommands(query, bannerEl) {
        const trimmed = (query || '').trim();
        const t = (i18nDictionaries[state.language] || i18nDictionaries.en)?.neural || {};

        const aiMatch = trimmed.match(/^!(ai|ask)\s+(\S.*)$/i);
        if (aiMatch) {
            if (bannerEl) {
                bannerEl.innerHTML = `<span>🤖 <strong>${escapeHtml(t.ai_answer_title || 'Asistente IA')}:</strong></span> <span>${escapeHtml(t.ai_preview || 'Pulsa Enter para preguntar')} — <em>"${escapeHtml(aiMatch[2].trim())}"</em></span>`;
                bannerEl.classList.remove('hidden');
            }
            return true;
        }

        const tMatch = trimmed.match(/^!t\s+(\S.*)$/i);
        if (tMatch) {
            if (bannerEl) {
                bannerEl.innerHTML = `<span>🌐 <strong>${escapeHtml(t.translate_title || 'Traducción')}:</strong></span> <span>${escapeHtml(t.t_preview || 'Pulsa Enter para traducir')} — <em>"${escapeHtml(tMatch[1].trim())}"</em></span>`;
                bannerEl.classList.remove('hidden');
            }
            return true;
        }

        return false;
    }

    // ENTER (llamado desde search.executeSearch): ejecuta la acción real
    // (abre el agente IA o lanza la traducción en vivo). Devuelve true si la
    // consulta era un comando reconocido.
    executeAICommand(query, bannerEl) {
        const trimmed = (query || '').trim();
        const t = (i18nDictionaries[state.language] || i18nDictionaries.en)?.neural || {};

        const aiMatch = trimmed.match(/^!(ai|ask)\s+(\S.*)$/i);
        if (aiMatch) {
            const prompt = aiMatch[2].trim();
            if (!prompt) return false;
            if (aiAgent && typeof aiAgent.openAndQuery === 'function') {
                aiAgent.openAndQuery(prompt);
            } else if (bannerEl) {
                bannerEl.innerHTML = `<span><strong>${escapeHtml(t.ai_answer_title || 'Asistente IA')}:</strong></span> <span>${this.generateLocalQuickAnswer(prompt)}</span>`;
                bannerEl.classList.remove('hidden');
            }
            return true;
        }

        const tMatch = trimmed.match(/^!t\s+(\S.*)$/i);
        if (tMatch) {
            const textToTrans = tMatch[1].trim();
            if (!textToTrans) return false;

            if (bannerEl) {
                bannerEl.innerHTML = `<span>🌐 <strong>${escapeHtml(t.translate_title || 'Traducción')}:</strong></span> <span>Traduciendo <em>"${escapeHtml(textToTrans)}"</em>...</span>`;
                bannerEl.classList.remove('hidden');
            }

            this.fetchLiveTranslation(textToTrans, bannerEl);
            return true;
        }

        return false;
    }

    generateLocalQuickAnswer(prompt) {
        const p = prompt.toLowerCase();
        if (p.includes('3d') || p.includes('mesh')) return 'Para modelado 3D destacan <strong>Meshy AI</strong> y <strong>Tripo 3D</strong> para mallas generativas exportables en GLB/OBJ.';
        if (p.includes('musica') || p.includes('music') || p.includes('audio')) return '<strong>Suno AI</strong> y <strong>ElevenLabs</strong> son herramientas de referencia para síntesis de audio y voz.';
        if (p.includes('code') || p.includes('codigo') || p.includes('program')) return '<strong>Claude 3.5 Sonnet</strong> y <strong>DeepSeek-R1</strong> lideran en análisis algorítmico y generación de código.';
        if (p.includes('webgpu') || p.includes('webgl')) return '<strong>WebGPU</strong> es el estándar moderno de gráficos y cómputo de bajo nivel en navegador que sucede a WebGL.';
        return `Consultando base de conocimiento para: "<em>${escapeHtml(prompt)}</em>"...`;
    }

    async fetchLiveTranslation(text, bannerEl) {
        try {
            const targetLang = state.language === 'en' ? 'es' : 'en';
            const langPair = state.language === 'en' ? 'es|en' : 'en|es';
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
            const res = await fetch(url);
            
            if (res.status === 429) {
                if (bannerEl) {
                    bannerEl.innerHTML = `<span>⚠️ <strong>Traducción:</strong></span> <span>Límite de API alcanzado (1000 palabras/día por IP). Inténtalo más tarde.</span>`;
                }
                return;
            }

            const data = await res.json();
            if (data && data.responseStatus === 429) {
                if (bannerEl) {
                    bannerEl.innerHTML = `<span>⚠️ <strong>Traducción:</strong></span> <span>Límite de API alcanzado (1000 palabras/día por IP). Inténtalo más tarde.</span>`;
                }
                return;
            }

            if (data && data.responseData && data.responseData.translatedText) {
                const translated = data.responseData.translatedText;
                if (bannerEl) {
                    bannerEl.innerHTML = `<span>🌐 <strong>Traducción (${targetLang.toUpperCase()}):</strong></span> <span><strong>${escapeHtml(translated)}</strong></span>`;
                }
            }
        } catch (e) {
            if (bannerEl) {
                bannerEl.innerHTML = `<span>🌐 <strong>Traducción:</strong></span> <span>${escapeHtml(text.toUpperCase())}</span>`;
            }
        }
    }
}

export const neuralSearch = new NeuralSearchEngine();
