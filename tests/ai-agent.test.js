// tests/ai-agent.test.js — Tests de integración y lógica para AIAgentEngine
import { test } from './harness.js';
import { AIAgentEngine } from '../js/ai-agent.js';

test('AIAgentEngine: inicialización con defaults y configuración persistente', ({ expect }) => {
    const engine = new AIAgentEngine();
    expect(engine.config.provider).toBe('local_heuristic');
    expect(engine.config.ollamaModel).toBe('llama3.2');
    expect(engine.isGenerating).toBe(false);

    engine.config.provider = 'ollama';
    engine.config.ollamaModel = 'mistral';
    engine.saveConfig();

    const loaded = new AIAgentEngine();
    expect(loaded.config.provider).toBe('ollama');
    expect(loaded.config.ollamaModel).toBe('mistral');
});

test('AIAgentEngine: formatMarkdown renderiza código, negrita y enlaces correctamente', ({ expect }) => {
    const engine = new AIAgentEngine();
    const markdown = 'Usa **negrita**, código `const x = 1` y enlace [GitHub](https://github.com/Devildonia).';
    const html = engine.formatMarkdown(markdown);

    expect(html).toContain('<strong>negrita</strong>');
    expect(html).toContain('<code class="ai-inline-code">const x = 1</code>');
    expect(html).toContain('<a href="https://github.com/Devildonia" target="_blank" rel="noopener noreferrer" class="ai-link-chip">🚀 GitHub</a>');
});

test('AIAgentEngine: formatMarkdown procesa listas con viñetas formateadas', ({ expect }) => {
    const engine = new AIAgentEngine();
    const input = 'Lista de tareas:\n* Item 1\n* Item 2';
    const html = engine.formatMarkdown(input);

    expect(html).toContain('ai-list-item');
    expect(html).toContain('Item 1');
    expect(html).toContain('Item 2');
});

test('AIAgentEngine: generateLocalHeuristicResponse genera respuestas de atajos y contexto', async ({ expect }) => {
    const engine = new AIAgentEngine();
    const respShortcuts = await engine.generateLocalHeuristicResponse('¿Qué herramientas de 3D tengo?');
    expect(typeof respShortcuts).toBe('string');
    expect(respShortcuts.length).toBeGreaterThan(10);

    const respGeneral = await engine.generateLocalHeuristicResponse('Hola');
    expect(typeof respGeneral).toBe('string');
    expect(respGeneral.length).toBeGreaterThan(10);
});
