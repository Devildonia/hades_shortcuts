// js/utils.js - Generic utilities (no app-state dependency)
// Extracted from state.js to keep it focused on the reactive store.

// ─── HTML ───────────────────────────────────────────────────────────────────

export const escapeHtml = (str) => {
    return String(str || '')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

export const PLACEHOLDER_ICON = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#111827"/><path d="M32 12l8 18h-6l4 22-14-20h8z" fill="#00f2fe"/></svg>'
);

// ─── Data normalization ─────────────────────────────────────────────────────

export function normalizeTags(tags) {
    const raw = Array.isArray(tags)
        ? tags.map((t) => String(t).trim().toLowerCase().replace(/^#/, '')).filter(Boolean)
        : (typeof tags === 'string' ? tags.split(/[,#]+/).map((t) => t.trim().toLowerCase()).filter(Boolean) : []);
    const extra = [];
    raw.forEach((t) => {
        if (t === 'ia' && !raw.includes('ai')) extra.push('ai');
        if (t === 'ai' && !raw.includes('ia')) extra.push('ia');
    });
    return [...raw, ...extra];
}

// ─── URL safety ─────────────────────────────────────────────────────────────

export function safeHttpUrl(url) {
    if (url === null || url === undefined || String(url).trim() === '') return '';
    const str = String(url).trim();
    if (!/^https?:\/\//i.test(str)) return '';
    try {
        const u = new URL(str);
        if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
    } catch (e) {}
    return '';
}

export function sanitizeIconUrl(rawIcon) {
    if (rawIcon === null || rawIcon === undefined || String(rawIcon).trim() === '') return '';
    const str = String(rawIcon).trim();
    if (/<|>/.test(str)) return '';
    if (/^https?:\/\//i.test(str)) {
        try {
            const u = new URL(str);
            return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : '';
        } catch (e) { return ''; }
    }
    if (/^data:image\/(png|jpeg|jpg|webp|avif|gif);base64,[A-Za-z0-9+\/=]+$/i.test(str)) return str;
    if (/^iconos\/[A-Za-z0-9._-]+\.(webp|png|jpe?g|gif|svg)$/i.test(str)) return str;
    if (str.length <= 16 && !str.includes(':')) return str;
    return '';
}

// Optional URL guard hook (Zen Distraction Shield registers here)
let urlGuard = null;
export function setUrlGuard(guard) { urlGuard = guard; }

export function openSafeUrl(url, target = '_blank', opts = {}) {
    const href = safeHttpUrl(url);
    if (!href) return false;
    if (!opts.ignoreGuard && typeof urlGuard === 'function' && urlGuard(href) === false) {
        return false;
    }
    window.open(href, target, 'noopener,noreferrer');
    return true;
}

export function faviconForUrl(url) {
    const href = safeHttpUrl(url);
    if (!href) return PLACEHOLDER_ICON;
    try {
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(href).hostname)}&sz=128`;
    } catch (e) {
        return PLACEHOLDER_ICON;
    }
}

export function bindIconFallback(img, shortcutOrUrl) {
    if (!img) return;
    const url = typeof shortcutOrUrl === 'string' ? shortcutOrUrl : (shortcutOrUrl && shortcutOrUrl.url);
    const goPlaceholder = () => { img.src = PLACEHOLDER_ICON; };
    const goFavicon = () => {
        const next = faviconForUrl(url);
        if (!next || img.src === next) {
            goPlaceholder();
            return;
        }
        img.addEventListener('error', goPlaceholder, { once: true });
        img.src = next;
    };
    if (img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith('data:')) {
        goFavicon();
        return;
    }
    img.addEventListener('error', goFavicon, { once: true });
}

// ─── UI helpers ─────────────────────────────────────────────────────────────

export function showToast(msg, type = 'info') {
    if (typeof document === 'undefined') return;
    let el = document.getElementById('hades-toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'hades-toast';
        document.body.appendChild(el);
    }
    el.textContent = String(msg || '');
    el.className = `hades-toast ${type} visible`;
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => el.classList.remove('visible'), 3200);
}

// ─── Storage ────────────────────────────────────────────────────────────────

export function readJsonStorage(key, fallback) {
    try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

// ─── Network ────────────────────────────────────────────────────────────────

const CORS_PROXY_MAKERS = [
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

export async function fetchTextMaybeProxy(url, signal, opts = {}) {
    const directMs = opts.directMs ?? 4000;
    const proxyMs = opts.proxyMs ?? 10000;

    const runFetch = async (fetchUrl, budgetMs) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), budgetMs);
        const onOuterAbort = () => ctrl.abort();
        if (signal) signal.addEventListener('abort', onOuterAbort, { once: true });
        try {
            const res = await fetch(fetchUrl, { signal: ctrl.signal });
            if (!res.ok) throw new Error(`http_${res.status}`);
            const text = await res.text();
            if (!text || !text.trim()) throw new Error('empty_body');
            return text;
        } finally {
            clearTimeout(timer);
            if (signal) signal.removeEventListener('abort', onOuterAbort);
        }
    };

    const throwIfAborted = () => {
        if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');
    };

    try {
        return await runFetch(url, directMs);
    } catch (e) {
        throwIfAborted();
    }

    let lastErr = null;
    for (const make of CORS_PROXY_MAKERS) {
        throwIfAborted();
        try {
            return await runFetch(make(url), proxyMs);
        } catch (e) {
            throwIfAborted();
            lastErr = e;
        }
    }
    throw lastErr || new Error('fetch_failed');
}

/**
 * Materializa un modal diferido (<template data-modal="id"> de index.html) en <body>.
 * Idempotente: si el elemento ya existe en el DOM (p. ej. inyectado por los tests)
 * lo devuelve tal cual. Si no existe la plantilla devuelve null (los engines ya
 * guardan contra null, comportamiento idéntico al de antes de los templates).
 */
export function materializeModal(id) {
    const existing = document.getElementById(id);
    if (existing) return existing;
    const tpl = document.querySelector(`template[data-modal="${id}"]`);
    if (!tpl) return null;
    if (!tpl.content.querySelector(`#${id}`)) return null;
    document.body.appendChild(tpl.content.cloneNode(true));
    return document.getElementById(id);
}
