// tests/postits.test.js — Tests para PostItManager
import { test } from './harness.js';
import { PostItManager } from '../js/postits.js';

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
