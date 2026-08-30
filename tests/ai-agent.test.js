// tests/ai-agent.test.js — Tests de integración y lógica para AIAgentEngine
import { test } from './harness.js';
import { AIAgentEngine } from '../js/ai-agent.js';
import { state } from '../js/state.js';

// La página de tests no carga el drawer completo: garantizamos el contenedor de mensajes
function ensureMessagesContainer() {
    let c = document.getElementById('ai-agent-messages');
    if (!c) {
        c = document.createElement('div');
        c.id = 'ai-agent-messages';
        const welcome = document.createElement('div');
        welcome.className = 'ai-msg-bubble ai ai-welcome';
        welcome.textContent = 'Hola (bienvenida)';
        c.appendChild(welcome);
        document.body.appendChild(c);
    }
    return c;
}

test('AIAgentEngine: inicialización con defaults y configuración persistente', ({ expect }) => {
    const engine = new AIAgentEngine();
    expect(engine.config.provider).toBe('local_heuristic');
    expect(engine.config.ollamaModel).toBe('llama3.2');
    expect(engine.config.lmstudioEndpoint).toBe('http://localhost:1234/v1/chat/completions');
    expect(engine.config.lmstudioModel).toBe('local-model');
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
    expect(html).toContain('<a href="https://github.com/Devildonia" target="_blank" rel="noopener noreferrer" class="ai-link-chip">GitHub</a>');
});

test('AIAgentEngine: formatMarkdown procesa listas con viñetas formateadas', ({ expect }) => {
    const engine = new AIAgentEngine();
    const input = 'Lista de tareas:\n* Item 1\n* Item 2';
    const html = engine.formatMarkdown(input);

    expect(html).toContain('ai-list-item');
    expect(html).toContain('Item 1');
    expect(html).toContain('Item 2');
});

test('AIAgentEngine: formatMarkdown escapa HTML malicioso y bloquea enlaces javascript:', ({ expect }) => {
    const engine = new AIAgentEngine();
    const malicious = '<script>alert(1)</script> y [click](javascript:alert(1))';
    const html = engine.formatMarkdown(malicious);

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('href="javascript:');
});

test('AIAgentEngine: heurística local es robusta ante acentos y varios idiomas', async ({ expect }) => {
    const engine = new AIAgentEngine();
    const original = state.shortcuts;
    const originalLang = state.language;
    // La heurística responde en el idioma de la app; fijamos 'es' para verificar
    // la frase en español ("2 herramientas") sin depender del locale del navegador.
    state.language = 'es';
    state.shortcuts = [
        { title: 'Blender', url: 'https://blender.org', category: '3d', tags: ['3d', 'modelado'] },
        { title: 'Hugging Face', url: 'https://huggingface.co', category: 'ia', tags: ['ia', 'ml'] }
    ];
    try {
        const es = await engine.generateLocalHeuristicResponse('¿Qué herramientas de 3D tengo?');
        expect(es).toContain('Blender');

        const en = await engine.generateLocalHeuristicResponse('Which AI tools do I have?');
        expect(en).toContain('Hugging Face');

        // "3D o IA" debe filtrar a la unión, no devolver todo el dashboard
        const both = await engine.generateLocalHeuristicResponse('¿Qué herramientas de 3D o IA tengo?');
        expect(both).toContain('Blender');
        expect(both).toContain('Hugging Face');
        expect(both).toContain('2 herramientas');
    } finally {
        state.shortcuts = original;
        state.language = originalLang;
    }
});

test('AIAgentEngine: títulos con markdown no corrompen la respuesta local', async ({ expect }) => {
    const engine = new AIAgentEngine();
    const original = state.shortcuts;
    state.shortcuts = [{ title: 'Herramienta **súper** [X]', url: 'https://ok.example.com/a', category: 'ia', tags: [] }];
    try {
        const resp = await engine.generateLocalHeuristicResponse('¿Qué herramientas de IA tengo?');
        expect(resp).toContain('Herramienta súper X');
        expect(resp).not.toContain('**súper**');
    } finally {
        state.shortcuts = original;
    }
});

test('AIAgentEngine: heurística local responde al modo Focus y a recomendaciones', async ({ expect }) => {
    const engine = new AIAgentEngine();
    const focus = await engine.generateLocalHeuristicResponse('¿Cómo activo el modo Focus?');
    expect(focus).toContain('Alt+F');

    const recEs = await engine.generateLocalHeuristicResponse('Recomiéndame 3 herramientas nuevas');
    expect(recEs).toContain('Shadertoy');

    const recEn = await engine.generateLocalHeuristicResponse('Recommend 3 new productivity tools');
    expect(recEn).toContain('Excalidraw');
});

test('AIAgentEngine: dispatch a OpenAI con fetch y respuesta correcta', async ({ expect }) => {
    ensureMessagesContainer();
    const engine = new AIAgentEngine();
    engine.config.provider = 'openai';
    engine.config.openaiApiKey = 'sk-test';

    const originalFetch = globalThis.fetch;
    let captured = null;
    globalThis.fetch = (url, options) => {
        captured = { url, options };
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ choices: [{ message: { content: 'Hola desde OpenAI' } }] })
        });
    };
    try {
        await engine.sendQuery('hola');
        expect(captured.url).toBe('https://api.openai.com/v1/chat/completions');
        expect(JSON.parse(captured.options.body)).toBeTruthy();
        expect(engine.messagesContainer.innerHTML).toContain('Hola desde OpenAI');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('AIAgentEngine: dispatch a LM Studio (OpenAI-compatible) sin clave API', async ({ expect }) => {
    ensureMessagesContainer();
    const engine = new AIAgentEngine();
    engine.config.provider = 'lmstudio';
    engine.config.lmstudioEndpoint = 'http://localhost:1234/v1/chat/completions';
    engine.config.lmstudioModel = 'qwen2.5-7b';

    const originalFetch = globalThis.fetch;
    let captured = null;
    globalThis.fetch = (url, options) => {
        captured = { url, options };
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ choices: [{ message: { content: 'Hola desde LM Studio' } }] })
        });
    };
    try {
        await engine.sendQuery('hola');
        expect(captured.url).toContain('localhost:1234');
        expect(JSON.parse(captured.options.body).model).toBe('qwen2.5-7b');
        expect(engine.messagesContainer.innerHTML).toContain('Hola desde LM Studio');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('AIAgentEngine: HTTP 401 cae al motor local con aviso explícito', async ({ expect }) => {
    ensureMessagesContainer();
    const engine = new AIAgentEngine();
    engine.config.provider = 'openai';
    engine.config.openaiApiKey = 'sk-invalida';
    const originalLang = state.language;
    // El aviso de fallback se verifica en español ("motor local"); fijamos 'es'.
    state.language = 'es';

    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } })
    });
    try {
        await engine.sendQuery('hola');
        expect(engine.messagesContainer.innerHTML).toContain('HTTP 401');
        expect(engine.messagesContainer.innerHTML).toContain('ai-fallback-note');
        expect(engine.messagesContainer.innerHTML).toContain('motor local');
    } finally {
        globalThis.fetch = originalFetch;
        state.language = originalLang;
    }
});

test('AIAgentEngine: timeout aborta la petición y responde el motor local', async ({ expect }) => {
    ensureMessagesContainer();
    const engine = new AIAgentEngine();
    engine.config.provider = 'ollama';

    const originalFetch = globalThis.fetch;
    const originalClock = globalThis.__hadesFakeClock;
    globalThis.fetch = (url, options) => new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
        });
    });
    try {
        const p = engine.sendQuery('hola');
        await new Promise((r) => setTimeout(r, 0));
        // Simula el disparo del timeout: aborta la petición en vuelo
        engine.abortController.abort();
        await p;
        expect(engine.messagesContainer.innerHTML).toContain('ai-fallback-note');
        expect(engine.isGenerating).toBe(false);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('AIAgentEngine: resetConversation conserva la bienvenida y limpia el hilo', ({ expect }) => {
    const container = ensureMessagesContainer();
    const engine = new AIAgentEngine();
    if (!container) {
        expect(true).toBe(true);
        return;
    }
    engine.resetConversation();
    expect(container.children.length).toBe(1);

    engine.appendMessage('user', 'hola');
    engine.appendMessage('ai', 'respuesta');
    expect(container.children.length).toBe(3);

    engine.resetConversation();
    expect(container.children.length).toBe(1);
    expect(container.children[0].classList.contains('ai-welcome') || container.children[0].textContent.length > 0).toBe(true);
});