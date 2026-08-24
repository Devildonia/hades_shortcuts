// js/bangs.js - Bang Query Parser & Safe Arithmetic Evaluator

export const BANGS_MAP = {
    '!yt': { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=' },
    '!gh': { name: 'GitHub', url: 'https://github.com/search?q=' },
    '!w': { name: 'Wikipedia', url: 'https://es.wikipedia.org/wiki/Special:Search?search=' },
    '!r': { name: 'Reddit', url: 'https://www.reddit.com/search/?q=' },
    '!m': { name: 'Google Maps', url: 'https://www.google.com/maps/search/' },
    '!civitai': { name: 'Civitai', url: 'https://civitai.red/?query=' },
    '!tr': { name: 'Traductor', url: 'https://translate.google.com/?text=' },
    '!npm': { name: 'NPM', url: 'https://www.npmjs.com/search?q=' },
    '!ddg': { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' }
};

export const parseBangQuery = (rawQuery) => {
    const trimmed = rawQuery.trim();
    const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
    if (BANGS_MAP[firstWord]) {
        const queryRest = trimmed.slice(firstWord.length).trim();
        return {
            isBang: true,
            bang: firstWord,
            service: BANGS_MAP[firstWord].name,
            targetUrl: queryRest ? `${BANGS_MAP[firstWord].url}${encodeURIComponent(queryRest)}` : BANGS_MAP[firstWord].url.split('?')[0],
            query: queryRest
        };
    }
    return { isBang: false };
};

export const evaluateArithmetic = (expression) => {
    const sanitized = expression.trim().replace(/,/g, '.');
    // Allow only digits, basic operators + - * / % ^ ( ) . and spaces
    if (!/^[0-9\.\+\-\*/\%\^\(\)\s]+$/.test(sanitized)) {
        return null;
    }
    // Must contain at least one operator to be considered calculation
    if (!/[\+\-\*/\%\^]/.test(sanitized)) {
        return null;
    }
    try {
        // Safe evaluation without eval() or arbitrary code injection
        const fn = new Function(`'use strict'; return (${sanitized.replace(/\^/g, '**')});`);
        const result = fn();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, '');
            return formatted;
        }
    } catch (e) {}
    return null;
};
