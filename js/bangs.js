import { focusMode } from './focus-mode.js';
// js/bangs.js - Bang Query Parser & Zero-Eval CSP-Compliant Math Evaluator

export const BANGS_MAP = {
    '!yt': { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=' },
    '!gh': { name: 'GitHub', url: 'https://github.com/search?q=' },
    '!w': { name: 'Wikipedia', url: 'https://es.wikipedia.org/wiki/Special:Search?search=' },
    '!r': { name: 'Reddit', url: 'https://www.reddit.com/search/?q=' },
    '!m': { name: 'Google Maps', url: 'https://www.google.com/maps/search/' },
    '!civitai': { name: 'Civitai', url: 'https://civitai.com/?query=' },
    '!tr': { name: 'Traductor', url: 'https://translate.google.com/?text=' },
    '!npm': { name: 'NPM', url: 'https://www.npmjs.com/search?q=' },
    '!ddg': { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
    '!uuid': { name: 'UUID Generator', isDevTool: true },
    '!qr': { name: 'QR Code Generator', isDevTool: true },
    '!color': { name: 'Color Converter', isDevTool: true },
    '!b64': { name: 'Base64 Encode', isDevTool: true },
    '!b64d': { name: 'Base64 Decode', isDevTool: true },
    '!epoch': { name: 'Epoch Time Converter', isDevTool: true },
    '!time': { name: 'Date & Time', isDevTool: true }
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

// Pure Recursive-Descent Math Parser (100% CSP Safe: Zero eval, Zero new Function)
export const evaluateArithmetic = (expression) => {
    const sanitized = expression.trim().replace(/,/g, '.');
    if (!/^[0-9\.\+\-\*/\%\^\(\)\s]+$/.test(sanitized)) return null;
    if (!/[\+\-\*/\%\^]/.test(sanitized)) return null;

    try {
        let pos = 0;
        const str = sanitized.replace(/\s+/g, '');

        const peek = () => str[pos];
        const get = () => str[pos++];

        const parseNumber = () => {
            let start = pos;
            if (peek() === '-' || peek() === '+') get();
            while (pos < str.length && /[0-9\.]/.test(peek())) get();
            const numStr = str.slice(start, pos);
            const val = parseFloat(numStr);
            if (isNaN(val)) throw new Error('Invalid number');
            return val;
        };

        const parseFactor = () => {
            if (peek() === '(') {
                get(); // consume '('
                const val = parseExpression();
                if (get() !== ')') throw new Error('Missing closing parenthesis');
                return val;
            }
            return parseNumber();
        };

        const parseExponent = () => {
            let val = parseFactor();
            while (pos < str.length && peek() === '^') {
                get();
                val = Math.pow(val, parseFactor());
            }
            return val;
        };

        const parseTerm = () => {
            let val = parseExponent();
            while (pos < str.length && (peek() === '*' || peek() === '/' || peek() === '%')) {
                const op = get();
                const next = parseExponent();
                if (op === '*') val *= next;
                else if (op === '/') {
                    if (next === 0) throw new Error('Division by zero');
                    val /= next;
                } else if (op === '%') {
                    val %= next;
                }
            }
            return val;
        };

        const parseExpression = () => {
            let val = parseTerm();
            while (pos < str.length && (peek() === '+' || peek() === '-')) {
                const op = get();
                const next = parseTerm();
                if (op === '+') val += next;
                else if (op === '-') val -= next;
            }
            return val;
        };

        const result = parseExpression();
        if (pos < str.length) return null; // Trailing unparsed tokens
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            return Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, '');
        }
    } catch (e) {}
    return null;
};
