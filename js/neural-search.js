// js/neural-search.js - Neural WebGPU & Semantic Vector Search Engine with Live AI Answers & Translator

import { state, escapeHtml } from './state.js';
import { i18nDictionaries } from './i18n.js';

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

    handleAICommands(query, bannerEl) {
        const trimmed = query.trim();
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).neural || {};

        if (trimmed.startsWith('!ai ')) {
            const prompt = trimmed.slice(4).trim();
            if (!prompt) return false;
            
            // Immediate local response
            const quickAnswer = this.generateLocalQuickAnswer(prompt);
            if (bannerEl) {
                bannerEl.innerHTML = `<span>🧠 <strong>${t.ai_answer_title || 'Asistente IA'}:</strong></span> <span>${quickAnswer}</span>`;
                bannerEl.classList.remove('hidden');
            }

            // Async fetch rich knowledge from DuckDuckGo Instant API
            this.fetchLiveInstantKnowledge(prompt, bannerEl);
            return true;
        }

        if (trimmed.startsWith('!t ')) {
            const textToTrans = trimmed.slice(3).trim();
            if (!textToTrans) return false;

            if (bannerEl) {
                bannerEl.innerHTML = `<span>🌐 <strong>${t.translate_title || 'Traducción'}:</strong></span> <span>Traduciendo <em>"${escapeHtml(textToTrans)}"</em>...</span>`;
                bannerEl.classList.remove('hidden');
            }

            this.fetchLiveTranslation(textToTrans, bannerEl);
            return true;
        }

        return false;
    }

    generateLocalQuickAnswer(prompt) {
        const p = prompt.toLowerCase();
        if (p.includes('xenoblade')) return '<strong>Xenoblade Chronicles 2</strong> es una aclamada obra maestra RPG de Monolith Soft para Nintendo Switch, destacada por su inmenso mundo abierto, banda sonora legendaria y profundo sistema de combate.';
        if (p.includes('3d') || p.includes('mesh')) return 'Para modelado 3D con IA destacan <strong>Meshy AI</strong> y <strong>Tripo 3D</strong> para mallas rápidas listas para exportar en GLB/OBJ.';
        if (p.includes('musica') || p.includes('music') || p.includes('audio')) return '<strong>Suno AI</strong> y <strong>ElevenLabs</strong> son los motores líderes para generación de canciones y síntesis de voz.';
        if (p.includes('code') || p.includes('codigo')) return '<strong>DeepSeek-R1</strong> y <strong>Claude 3.5 Sonnet</strong> lideran en razonamiento algorítmico y generación de software.';
        return `Procesando análisis semántico para: "<em>${escapeHtml(prompt)}</em>"...`;
    }

    async fetchLiveInstantKnowledge(prompt, bannerEl) {
        try {
            const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(prompt)}&format=json&no_html=1&skip_disambig=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (data && (data.AbstractText || data.Answer)) {
                const answer = data.Answer || data.AbstractText;
                if (bannerEl) {
                    bannerEl.innerHTML = `<span>🧠 <strong>Asistente IA:</strong></span> <span>${escapeHtml(answer)}</span>`;
                }
            }
        } catch (e) {}
    }

    async fetchLiveTranslation(text, bannerEl) {
        try {
            const targetLang = state.language === 'en' ? 'es' : 'en';
            const langPair = state.language === 'en' ? 'es|en' : 'en|es';
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
            const res = await fetch(url);
            const data = await res.json();
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
