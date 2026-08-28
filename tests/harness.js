// tests/harness.js — Micro-harness de tests para navegador (0 dependencias, 0 Node, 0 build)
// Uso: test('nombre', async () => { expect(x).toBe(y); }) y luego runAll(contenedor).

const registry = { tests: [], beforeEachFns: [] };

/** Registra un test. `fn` puede ser síncrona o async. */
export function test(name, fn) {
    registry.tests.push({ name, fn });
}

/** Hook global ejecutado antes de CADA test (p. ej. limpiar localStorage). */
export function beforeEach(fn) {
    registry.beforeEachFns.push(fn);
}

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function str(v) {
    try {
        if (typeof v === 'string') return JSON.stringify(v);
        return JSON.stringify(v);
    } catch (e) {
        return String(v);
    }
}

function deepEqual(a, b) {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
}

class Expectation {
    constructor(actual) {
        this.actual = actual;
        this.negated = false;
    }

    get not() {
        const neg = new Expectation(this.actual);
        neg.negated = true;
        return neg;
    }

    _check(pass, message) {
        if (this.negated ? pass : !pass) {
            throw new Error(`${this.negated ? 'NOT ' : ''}${message}`);
        }
    }

    toBe(expected) {
        this._check(Object.is(this.actual, expected), `toBe(${str(expected)}), actual: ${str(this.actual)}`);
    }

    toEqual(expected) {
        this._check(deepEqual(this.actual, expected), `toEqual(${str(expected)}), actual: ${str(this.actual)}`);
    }

    toBeTruthy() {
        this._check(!!this.actual, `toBeTruthy(), actual: ${str(this.actual)}`);
    }

    toBeFalsy() {
        this._check(!this.actual, `toBeFalsy(), actual: ${str(this.actual)}`);
    }

    toBeNull() {
        this._check(this.actual === null, `toBeNull(), actual: ${str(this.actual)}`);
    }

    toBeUndefined() {
        this._check(this.actual === undefined, `toBeUndefined(), actual: ${str(this.actual)}`);
    }

    toBeGreaterThan(expected) {
        this._check(this.actual > expected, `toBeGreaterThan(${str(expected)}), actual: ${str(this.actual)}`);
    }

    toBeGreaterThanOrEqual(expected) {
        this._check(this.actual >= expected, `toBeGreaterThanOrEqual(${str(expected)}), actual: ${str(this.actual)}`);
    }

    toBeLessThan(expected) {
        this._check(this.actual < expected, `toBeLessThan(${str(expected)}), actual: ${str(this.actual)}`);
    }

    toBeLessThanOrEqual(expected) {
        this._check(this.actual <= expected, `toBeLessThanOrEqual(${str(expected)}), actual: ${str(this.actual)}`);
    }

    toContain(needle) {
        const hay = typeof this.actual === 'string' ? this.actual : str(this.actual);
        this._check(hay.includes(String(needle)), `toContain("${needle}"), actual: ${hay}`);
    }

    toMatch(pattern) {
        this._check(pattern.test(String(this.actual)), `toMatch(${pattern}), actual: ${str(this.actual)}`);
    }

    toThrow(expectedMessage) {
        if (typeof this.actual !== 'function') {
            throw new Error('toThrow: se debe llamar a expect(() => fn())');
        }
        let threw = null;
        try {
            this.actual();
        } catch (e) {
            threw = e;
        }
        if (expectedMessage) {
            this._check(!!threw && String(threw.message).includes(expectedMessage),
                `toThrow("${expectedMessage}"), error real: ${threw ? threw.message : '(no lanzó)'}`);
        } else {
            this._check(!!threw, `toThrow(), ${threw ? `lanzó: ${threw.message}` : 'no lanzó ninguna excepción'}`);
        }
    }

    toBeInstanceOf(cls) {
        this._check(this.actual instanceof cls, `toBeInstanceOf(${cls.name}), actual: ${this.actual && this.actual.constructor && this.actual.constructor.name}`);
    }
}

export const expect = (actual) => new Expectation(actual);

/**
 * Ejecuta todos los tests registrados y pinta el informe en `container`.
 * Devuelve { passed, failed, total, results }.
 */
export async function runAll(container) {
    const results = [];
    let passed = 0;
    let failed = 0;
    let totalMs = 0;

    for (const t of registry.tests) {
        for (const hook of registry.beforeEachFns) {
            try { await hook(); } catch (e) { /* un hook roto no debe abortar la batería */ }
        }

        const t0 = performance.now();
        let ok = true;
        let error = null;
        try {
            await t.fn();
        } catch (e) {
            ok = false;
            error = (e && (e.stack || e.message)) || String(e);
        }
        const ms = Math.round(performance.now() - t0);
        totalMs += ms;

        if (ok) passed++; else failed++;
        results.push({ name: t.name, ok, error, ms });
        paintTest(container, t.name, ok, error, ms);
    }

    paintSummary(container, { passed, failed, total: registry.tests.length, totalMs });
    window.__testResults = { passed, failed, total: registry.tests.length, totalMs, results };
    return { passed, failed, total: registry.tests.length, totalMs, results };
}

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
}

function paintSummary(container, s) {
    const box = el('div', `summary ${s.failed === 0 ? 'all-ok' : 'has-fail'}`);
    box.append(
        el('strong', '', s.failed === 0 ? '✅ TODOS LOS TESTS PASARON' : `❌ ${s.failed} TESTS FALLARON`),
        el('span', `badge ${s.failed === 0 ? 'ok' : 'ko'}`, `${s.passed}/${s.total}`),
        el('span', 'ms', `${s.totalMs} ms`)
    );
    container.prepend(box);
}

function paintTest(container, name, ok, error, ms) {
    const box = el('div', `test ${ok ? 'ok' : 'ko'}`);
    box.append(el('span', 'mark', ok ? '✔' : '✘'));
    const label = el('div', 'label');
    label.append(el('span', '', name));
    if (error) label.append(el('span', 'err', String(error).split('\n').slice(0, 6).join('\n')));
    box.append(label, el('span', 'ms', `${ms} ms`));
    container.appendChild(box);
}
