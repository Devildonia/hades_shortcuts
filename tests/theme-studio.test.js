// tests/theme-studio.test.js — Tests para ThemeStudio y sanitizeCssUrl
import { test } from './harness.js';
import { sanitizeCssUrl, ThemeStudio, UNSPLASH_PRESETS } from '../js/theme-studio.js';

test('sanitizeCssUrl: permite URLs http y https seguras', ({ expect }) => {
    const valid = 'https://images.unsplash.com/photo-12345?auto=format';
    expect(sanitizeCssUrl(valid)).toBe(valid);

    const httpValid = 'http://example.com/background.jpg';
    expect(sanitizeCssUrl(httpValid)).toBe(httpValid);
});

test('sanitizeCssUrl: escapa comillas, paréntesis y caracteres peligrosos', ({ expect }) => {
    const malicious = 'https://example.com/test"); background: red; /*';
    const sanitized = sanitizeCssUrl(malicious);
    expect(sanitized).not.toContain('"');
    expect(sanitized).not.toContain(')');
    expect(sanitized).toContain('%22');
});

test('sanitizeCssUrl: permite data URIs base64 de imágenes válidas', ({ expect }) => {
    const validDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    expect(sanitizeCssUrl(validDataUri)).toBe(validDataUri);
});

test('sanitizeCssUrl: rechaza javascript:, data:text/html o strings inválidos', ({ expect }) => {
    expect(sanitizeCssUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeCssUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    expect(sanitizeCssUrl('')).toBe('');
    expect(sanitizeCssUrl(null)).toBe('');
    expect(sanitizeCssUrl(undefined)).toBe('');
});

test('ThemeStudio: carga y persistencia de configuración de fondo', ({ expect }) => {
    const studio = new ThemeStudio();
    expect(studio.bgConfig.mode).toBe('aurora');

    studio.bgConfig.mode = 'image';
    studio.bgConfig.imageUrl = UNSPLASH_PRESETS.cyberpunk[0];
    studio.saveBgConfig();

    const reloaded = new ThemeStudio();
    expect(reloaded.bgConfig.mode).toBe('image');
    expect(reloaded.bgConfig.imageUrl).toBe(UNSPLASH_PRESETS.cyberpunk[0]);
});
