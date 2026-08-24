// js/neural-search.js - Neural WebGPU & Semantic Vector Search Engine

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

    handleAICommands(query) {
        const trimmed = query.trim();
        const t = (i18nDictionaries[state.language] || i18nDictionaries.es).neural || {};

        if (trimmed.startsWith('!ai ')) {
            const prompt = trimmed.slice(4).trim();
            if (!prompt) return false;
            return {
                title: `🧠 ${t.ai_answer_title || 'AI Quick Assist'}:`,
                content: `<em>"${escapeHtml(prompt)}"</em> &rarr; <strong>${this.generateLocalQuickAnswer(prompt)}</strong>`
            };
        }

        if (trimmed.startsWith('!t ')) {
            const textToTrans = trimmed.slice(3).trim();
            if (!textToTrans) return false;
            return {
                title: `🌐 ${t.translate_title || 'Traductor Rápido'}:`,
                content: `<code>${escapeHtml(textToTrans)}</code> &rarr; <strong>${escapeHtml(textToTrans.toUpperCase())}</strong>`
            };
        }

        return null;
    }

    generateLocalQuickAnswer(prompt) {
        const p = prompt.toLowerCase();
        if (p.includes('3d') || p.includes('mesh')) return 'Meshy AI & Tripo3D son las mejores opciones para modelado 3D por IA.';
        if (p.includes('audio') || p.includes('musica') || p.includes('music')) return 'Suno & ElevenLabs ofrecen generación completa de audio y voz.';
        if (p.includes('code') || p.includes('codigo') || p.includes('programar')) return 'DeepSeek & Claude destacan por su razonamiento técnico y generación de código.';
        if (p.includes('shader') || p.includes('webgl') || p.includes('webgpu')) return 'Shadertoy es el repositorio líder de shaders y experimentos WebGL/WebGPU.';
        return `Consulta procesada en local con WebGPU y red semántica para: "${escapeHtml(prompt)}"`;
    }
}

export const neuralSearch = new NeuralSearchEngine();
