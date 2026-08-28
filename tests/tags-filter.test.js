// tests/tags-filter.test.js — Tests para TagsFilterEngine
import { test } from './harness.js';
import { TagsFilterEngine } from '../js/tags-filter.js';

test('TagsFilterEngine: getTagColor devuelve color determinista o fallback', ({ expect }) => {
    const engine = new TagsFilterEngine();
    expect(engine.getTagColor('ia')).toBe('#00f2fe');
    expect(engine.getTagColor('3d')).toBe('#ffaa00');
    expect(engine.getTagColor('dev')).toBe('#a855f7');
    expect(engine.getTagColor('#ia')).toBe('#00f2fe'); // strip hash
    expect(engine.getTagColor('desconocido')).toBe('#64748b'); // default
});

test('TagsFilterEngine: parseQuery descompone tags, categorias, favoritos y texto', ({ expect }) => {
    const engine = new TagsFilterEngine();
    const parsed = engine.parseQuery('github #dev tag:ia cat:tools is:fav');

    expect(parsed.text).toContain('github');
    expect(parsed.tags).toContain('dev');
    expect(parsed.tags).toContain('ia');
    expect(parsed.categories).toContain('tools');
    expect(parsed.isFav).toBe(true);
});

test('TagsFilterEngine: matches evalúa correctamente tags con lógica AND', ({ expect }) => {
    const engine = new TagsFilterEngine();
    const shortcut = {
        title: 'Claude AI',
        url: 'https://claude.ai',
        category: 'cat_ia',
        tags: ['ia', 'chat', 'llm'],
        favorite: true
    };

    const query1 = engine.parseQuery('tag:ia tag:chat');
    expect(engine.matches(shortcut, query1)).toBe(true);

    const query2 = engine.parseQuery('tag:ia tag:3d');
    expect(engine.matches(shortcut, query2)).toBe(false);

    const query3 = engine.parseQuery('cat:ia is:fav');
    expect(engine.matches(shortcut, query3)).toBe(true);
});
