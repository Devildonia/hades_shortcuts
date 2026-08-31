// js/i18n.js - Internationalization Engine
// Source of truth: locales/*.json (one file per language)

import { state } from './state.js';

export const i18nDictionaries = {};

export const getTranslation = (path, lang = state.language) => {
    const dict = i18nDictionaries[lang] || i18nDictionaries.en;
    const keys = path.split('.');
    let current = dict;
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            // Fallback to EN
            if (!i18nDictionaries.en) return null;
            let fallback = i18nDictionaries.en;
            for (const fKey of keys) {
                if (fallback && typeof fallback === 'object' && fKey in fallback) {
                    fallback = fallback[fKey];
                } else {
                    return null;
                }
            }
            return fallback;
        }
    }
    return current;
};

export const updateDocumentLocalization = () => {
    const lang = state.language;
    if (typeof document !== 'undefined') document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const trans = getTranslation(key, lang);
        if (trans && typeof trans === 'string') {
            el.textContent = trans;
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const trans = getTranslation(key, lang);
        if (trans && typeof trans === 'string') {
            el.placeholder = trans;
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const trans = getTranslation(key, lang);
        if (trans && typeof trans === 'string') {
            el.title = trans;
        }
    });

    document.querySelectorAll('[data-i18n-prompt]').forEach(el => {
        const key = el.getAttribute('data-i18n-prompt');
        const trans = getTranslation(key, lang);
        if (trans && typeof trans === 'string') {
            el.setAttribute('data-prompt', trans);
        }
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        const trans = getTranslation(key, lang);
        if (trans && typeof trans === 'string') {
            el.setAttribute('aria-label', trans);
        }
    });

    if (typeof window !== 'undefined' && window.spacesManager?.renderNumpad) {
        window.spacesManager.renderNumpad();
    }
};

export async function loadLocaleAsync(lang) {
    try {
        const res = await fetch(`./locales/${lang}.json`);
        if (res.ok) {
            i18nDictionaries[lang] = await res.json();
            return i18nDictionaries[lang];
        }
    } catch (e) {}

    // Fallback: load EN
    if (lang !== 'en' && !i18nDictionaries.en) {
        try {
            const res = await fetch('./locales/en.json');
            if (res.ok) {
                i18nDictionaries.en = await res.json();
            }
        } catch (e) {}
    }
    return i18nDictionaries[lang] || i18nDictionaries.en || {};
}
