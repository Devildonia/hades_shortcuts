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
    expect(html).toContain('<code>const x = 1</code>');
    expect(html).toContain('<a href="https://github.com/Devildonia" target="_blank" rel="noopener noreferrer">GitHub</a>');
});

test('AIAgentEngine: formatMarkdown procesa listas con guiones y bloques de código', ({ expect }) => {
    const engine = new AIAgentEngine();
    const input = 'Lista de tareas:\n- Item 1\n- Item 2\n\n```js\nconsole.log(42);\n```';
    const html = engine.formatMarkdown(input);

    expect(html).toContain('<ul');
    expect(html).toContain('<li>Item 1</li>');
    expect(html).toContain('<li>Item 2</li>');
    expect(html).toContain('<pre><code>console.log(42);');
});

test('AIAgentEngine: getLocalHeuristicResponse genera respuestas de atajos y contexto', ({ expect }) => {
    const engine = new AIAgentEngine();
    const respTime = engine.getLocalHeuristicResponse('¿Qué hora es?');
    expect(respTime).toContain('Son las');

    const respWeather = engine.getLocalHeuristicResponse('clima');
    expect(typeof respWeather).toBe('string');
    expect(respWeather.length).toBeGreaterThan(5);
});
