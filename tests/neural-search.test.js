// tests/neural-search.test.js — Tests para NeuralSearchEngine
import { test } from './harness.js';
import { NeuralSearchEngine } from '../js/neural-search.js';
import { aiAgent } from '../js/ai-agent.js';
import { state } from '../js/state.js';

test('NeuralSearchEngine: indexación semántica y tokenización', ({ expect }) => {
    const engine = new NeuralSearchEngine();
    engine.buildSemanticIndex();

    expect(engine.isReady).toBe(true);
    expect(Array.isArray(engine.index)).toBe(true);
    expect(engine.index.length).toBe(state.shortcuts.length);

    const tokens = engine.tokenize('GitHub - Repositorios & Código @dev'.toLowerCase());
    expect(tokens).toContain('github');
    expect(tokens).toContain('repositorios');
    expect(tokens).toContain('código');
    expect(tokens).toContain('dev');
});

test('NeuralSearchEngine: semanticSearch encuentra atajos por relevancia de tokens', ({ expect }) => {
    state.shortcuts = [
        { id: 'github', title: 'GitHub', desc: 'Repositorios y código fuente', category: 'cat_dev', tags: ['dev', 'git'] },
        { id: 'claude', title: 'Claude AI', desc: 'Inteligencia artificial conversacional y LLM', category: 'cat_ia', tags: ['ia', 'chat'] }
    ];
    const engine = new NeuralSearchEngine();
    engine.buildSemanticIndex();

    const results = engine.semanticSearch('github');
    expect(results).toBeTruthy();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('github');
    expect(results[0].score).toBeGreaterThan(50);
});

test('NeuralSearchEngine: semanticSearch tolera búsqueda por descripción o tags', ({ expect }) => {
    state.shortcuts = [
        { id: 'github', title: 'GitHub', desc: 'Repositorios y código fuente', category: 'cat_dev', tags: ['dev', 'git'] },
        { id: 'claude', title: 'Claude AI', desc: 'Inteligencia artificial conversacional y LLM', category: 'cat_ia', tags: ['ia', 'chat'] }
    ];
    const engine = new NeuralSearchEngine();
    engine.buildSemanticIndex();

    const results = engine.semanticSearch('inteligencia artificial');
    expect(results).toBeTruthy();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('claude');
});

test('NeuralSearchEngine: consultas cortas (<3 caracteres) o vacías devuelven null', ({ expect }) => {
    const engine = new NeuralSearchEngine();
    engine.buildSemanticIndex();

    expect(engine.semanticSearch('')).toBeNull();
    expect(engine.semanticSearch('a')).toBeNull();
    expect(engine.semanticSearch('ab')).toBeNull();
});

// ===== Regresión !ai: en vivo SOLO previsualiza; en Enter ejecuta =====

test('!ai en vivo: solo previsualiza, NO dispara el agente (regresión: saltaba con la 1ª letra)', ({ expect }) => {
    const engine = new NeuralSearchEngine();
    const banner = document.createElement('div');
    document.body.appendChild(banner);
    const calls = [];
    const orig = aiAgent.openAndQuery;
    aiAgent.openAndQuery = (p) => calls.push(p);
    try {
        // "!ai" + espacio + PRIMERA letra: el bug antiguo abría la ventana IA aquí
        const handled = engine.handleAICommands('!ai h', banner);
        expect(handled).toBe(true);
        expect(calls).toEqual([]); // sin efectos secundarios: el agente no se abre
        expect(banner.textContent).toContain('Enter');
    } finally {
        aiAgent.openAndQuery = orig;
        banner.remove();
    }
});

test('!ai en Enter: executeAICommand dispara el agente con el prompt completo', ({ expect }) => {
    const engine = new NeuralSearchEngine();
    const calls = [];
    const orig = aiAgent.openAndQuery;
    aiAgent.openAndQuery = (p) => calls.push(p);
    try {
        const handled = engine.executeAICommand('!ai how do I optimize a GLB', null);
        expect(handled).toBe(true);
        expect(calls).toEqual(['how do I optimize a GLB']);

        // El alias !ask también ejecuta
        const handled2 = engine.executeAICommand('!ask resume de claude', null);
        expect(handled2).toBe(true);
        expect(calls[1]).toBe('resume de claude');
    } finally {
        aiAgent.openAndQuery = orig;
    }
});

test('!t en vivo: previsualiza sin fetch; en Enter ejecuta la traducción', ({ expect }) => {
    const engine = new NeuralSearchEngine();
    const banner = document.createElement('div');
    document.body.appendChild(banner);
    const fetches = [];
    const origFetch = window.fetch;
    window.fetch = (url) => {
        fetches.push(String(url));
        return Promise.resolve({ status: 200, json: () => Promise.resolve({ responseStatus: 200, translatedText: 'x' }) });
    };
    try {
        // En vivo: solo preview, cero peticiones de red mientras se escribe
        expect(engine.handleAICommands('!t h', banner)).toBe(true);
        expect(engine.handleAICommands('!t ho', banner)).toBe(true);
        expect(engine.handleAICommands('!t hola', banner)).toBe(true);
        expect(fetches).toEqual([]);

        // Enter: dispara la traducción una única vez
        expect(engine.executeAICommand('!t hola mundo', banner)).toBe(true);
        expect(fetches.length).toBe(1);
        expect(fetches[0]).toContain('mymemory.translated.net');
    } finally {
        window.fetch = origFetch;
        banner.remove();
    }
});

test('Comandos IA: sin prompt o consultas normales no matchean', ({ expect }) => {
    const engine = new NeuralSearchEngine();
    expect(engine.handleAICommands('!ai', null)).toBe(false);
    expect(engine.executeAICommand('!ai', null)).toBe(false);
    expect(engine.handleAICommands('!t', null)).toBe(false);
    expect(engine.executeAICommand('!t', null)).toBe(false);
    expect(engine.handleAICommands('ai helper', null)).toBe(false);
    expect(engine.executeAICommand('github repos', null)).toBe(false);
});
