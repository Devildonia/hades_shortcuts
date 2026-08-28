// tests/neural-search.test.js — Tests para NeuralSearchEngine
import { test } from './harness.js';
import { NeuralSearchEngine } from '../js/neural-search.js';
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
