// tests/postits.test.js — Tests para PostItManager
import { test } from './harness.js';
import { PostItManager, PAPER_COLORS, PAPER_TO_POSTIT, PAPER_STORAGE_KEY } from '../js/postits.js';
import { WidgetsManager } from '../js/widgets.js';

test('PostItManager: inicialización con array vacío y carga de storage', ({ expect }) => {
    const manager = new PostItManager();
    expect(Array.isArray(manager.postits)).toBe(true);
    expect(manager.colors).toContain('cyan');
    expect(manager.colors).toContain('yellow');
});

test('PostItManager: createPostIt añade nota con estructura e id único', ({ expect }) => {
    const manager = new PostItManager();
    manager.createPostIt('Nota de prueba #1', 100, 150, 'yellow');

    expect(manager.postits.length).toBe(1);
    const note = manager.postits[0];
    expect(note.text).toBe('Nota de prueba #1');
    expect(note.color).toBe('yellow');
    expect(note.id).toContain('postit_');

    const reloaded = new PostItManager();
    expect(reloaded.postits.length).toBe(1);
    expect(reloaded.postits[0].text).toBe('Nota de prueba #1');
});

test('PostItManager: PAPER_TO_POSTIT mapea toda la paleta de papel a temas válidos', ({ expect }) => {
    const manager = new PostItManager();
    PAPER_COLORS.forEach(paper => {
        expect(Object.keys(PAPER_TO_POSTIT)).toContain(paper);
        expect(manager.colors).toContain(PAPER_TO_POSTIT[paper]);
    });
    expect(PAPER_TO_POSTIT.yellow).toBe('yellow');
    expect(PAPER_TO_POSTIT.pink).toBe('magenta');
    expect(PAPER_TO_POSTIT.green).toBe('emerald');
    expect(PAPER_TO_POSTIT.blue).toBe('cyan');
    expect(PAPER_TO_POSTIT.orange).toBe('orange');
    expect(PAPER_TO_POSTIT.purple).toBe('purple');
});

test('PostItManager: al fijar desde el widget, el post-it hereda el color de papel elegido', ({ expect }) => {
    let btn = document.getElementById('create-postit-btn');
    let ta = document.getElementById('scratchpad-input');
    if (!btn || !ta) {
        btn = document.createElement('button');
        btn.id = 'create-postit-btn';
        ta = document.createElement('textarea');
        ta.id = 'scratchpad-input';
        document.body.append(btn, ta);
    }

    localStorage.setItem(PAPER_STORAGE_KEY, 'pink'); // rosa en el widget
    const manager = new PostItManager();
    manager.init();
    ta.value = 'Nota rosa de prueba';
    btn.click();

    const note = manager.postits[manager.postits.length - 1];
    expect(note.text).toBe('Nota rosa de prueba');
    expect(note.color).toBe('magenta'); // pink → magenta

    // Limpieza: no dejar notas residuales para otros tests
    manager.postits = [];
    manager.savePostIts();
    manager.renderAll();
});

test('WidgetsManager: bindScratchpad aplica el papel guardado y la paleta persiste el clic', ({ expect }) => {
    let card = document.getElementById('widget-scratchpad-card');
    let ta = document.getElementById('scratchpad-input');
    if (!card) {
        card = document.createElement('div');
        card.id = 'widget-scratchpad-card';
        PAPER_COLORS.forEach(c => {
            const b = document.createElement('button');
            b.className = 'scratchpad-swatch';
            b.dataset.paper = c;
            card.appendChild(b);
        });
        document.body.appendChild(card);
    }
    if (!ta) {
        ta = document.createElement('textarea');
        ta.id = 'scratchpad-input';
        document.body.appendChild(ta);
    }

    localStorage.setItem(PAPER_STORAGE_KEY, 'blue');
    const wm = new WidgetsManager();
    wm.bindScratchpad();

    expect(card.classList.contains('paper-blue')).toBe(true);
    expect(card.querySelector('[data-paper="blue"]').getAttribute('aria-pressed')).toBe('true');

    // Clic en verde: cambia clase Y persiste
    card.querySelector('[data-paper="green"]').click();
    expect(card.classList.contains('paper-green')).toBe(true);
    expect(card.classList.contains('paper-blue')).toBe(false);
    expect(localStorage.getItem(PAPER_STORAGE_KEY)).toBe('green');

    // Valor corrupto en storage → cae a amarillo por defecto
    localStorage.setItem(PAPER_STORAGE_KEY, 'no-existe');
    wm.bindScratchpad();
    expect(card.classList.contains('paper-yellow')).toBe(true);
    localStorage.removeItem(PAPER_STORAGE_KEY);
});

test('PostItManager: post-it incluye tirador ↘ y el resize persiste w/h', ({ expect }) => {
    const manager = new PostItManager();
    if (!manager.container) {
        manager.container = document.createElement('div');
        manager.container.id = 'postits-canvas';
        document.body.appendChild(manager.container);
    }
    // Tamaño inicial explícito: tests/index.html no carga style.css, así que .glass-postit
    // no tiene width por CSS. Con w/h definidos, renderSingle fija el tamaño y offsetWidth
    // es determinista, haciendo estable la aserción de +30/+40 del handler de resize.
    const note = { id: 't_resize', text: 'redimensionable', x: 10, y: 10, w: 240, h: 150, color: 'yellow', rotation: 0, zIndex: 5, createdAt: '00:00' };
    manager.postits.push(note);
    manager.renderSingle(note, false);

    const el = document.getElementById('t_resize');
    const handle = el.querySelector('.postit-resize-handle');
    expect(handle).toBeTruthy();

    const sw = el.offsetWidth;
    const sh = el.offsetHeight;
    handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 7, button: 0, clientX: 100, clientY: 100 }));
    handle.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 7, clientX: 130, clientY: 140 })); // +30 / +40
    handle.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7, clientX: 130, clientY: 140 }));

    expect(el.style.width).toBe(`${sw + 30}px`);
    expect(el.style.height).toBe(`${sh + 40}px`);
    const saved = JSON.parse(localStorage.getItem('glass_postits_v1'));
    const savedNote = saved.find(n => n.id === 't_resize');
    expect(savedNote.w).toBe(sw + 30);
    expect(savedNote.h).toBe(sh + 40);

    // Un re-render con w/h guardados aplica el tamaño persistido
    manager.postits = [savedNote];
    manager.renderAll();
    expect(document.getElementById('t_resize').style.width).toBe(`${sw + 30}px`);

    // Limpieza
    manager.postits = [];
    manager.savePostIts();
    manager.renderAll();
});

test('PostItManager: techo de z-index (T3.5) — todo ≤ 900 y el último apilado es el superior', ({ expect }) => {
    const manager = new PostItManager();
    // Tres notas con z-index bajos.
    manager.postits = [
        { id: 'z_a', text: 'a', x: 10, y: 10, color: 'yellow', zIndex: 1 },
        { id: 'z_b', text: 'b', x: 20, y: 20, color: 'cyan', zIndex: 2 },
        { id: 'z_c', text: 'c', x: 30, y: 30, color: 'magenta', zIndex: 3 }
    ];

    let last = 0;
    for (let i = 0; i < 1200; i++) {
        last = manager._bumpZIndex();
        // Traer al frente la nota i%3 (asignándole el z devuelto).
        manager.postits[i % 3].zIndex = last;
        expect(last).toBeLessThanOrEqual(900);
        // La nota que acaba de apilarse debe ser el máximo absoluto.
        expect(last).toBe(Math.max(...manager.postits.map(n => n.zIndex)));
    }

    // Invariante final: ningún z-index supera el techo y el último sigue siendo el superior.
    expect(Math.max(...manager.postits.map(n => n.zIndex))).toBeLessThanOrEqual(900);
    expect(Math.max(...manager.postits.map(n => n.zIndex))).toBe(last);
});

test('PostItManager: _bumpZIndex respeta z-index altos cargados de storage', ({ expect }) => {
    const manager = new PostItManager();
    manager.postits = [
        { id: 's_a', text: 'a', x: 10, y: 10, color: 'yellow', zIndex: 850 },
        { id: 's_b', text: 'b', x: 20, y: 20, color: 'cyan', zIndex: 895 }
    ];
    const z = manager._bumpZIndex();
    manager.postits[1].zIndex = z;
    expect(z).toBeGreaterThan(895);
    expect(z).toBeLessThanOrEqual(900);
});

test('i18n: locales/es.json mantiene "Bloc de Notas" (regresión del título con "Glass")', async ({ expect }) => {
    const res = await fetch('../locales/es.json');
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.widgets.scratchpad_title).toBe('Bloc de Notas');
});

test('PostItManager: setPostIts y reloadPostIts sincronizan estado en memoria', ({ expect }) => {
    const manager = new PostItManager();
    const mockNotes = [
        { id: 'note_1', text: 'Tarea 1', x: 50, y: 100, color: 'cyan', rotation: 0, zIndex: 1001, createdAt: '10:00' },
        { id: 'note_2', text: 'Tarea 2', x: 200, y: 300, color: 'magenta', rotation: 1, zIndex: 1002, createdAt: '11:00' }
    ];

    manager.setPostIts(mockNotes);
    expect(manager.postits.length).toBe(2);
    expect(manager.postits[1].text).toBe('Tarea 2');

    const reloaded = new PostItManager();
    expect(reloaded.postits.length).toBe(2);
});
