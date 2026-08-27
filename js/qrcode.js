// js/qrcode.js
// Local, spec-compliant QR Code generator (ISO/IEC 18004 - QR Code Model 2).
// Zero network calls, no external dependencies, pure ES module.
//
// This is a JavaScript ES-module port of the reference implementation:
//   QR Code generator library (TypeScript)
//   Copyright (c) Project Nayuki. (MIT License)
//   https://www.nayuki.io/page/qr-code-generator-library
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
// of the Software, and to permit persons to whom the Software is furnished to do
// so, subject to the following conditions:
// - The above copyright notice and this permission notice shall be included in
//   all copies or substantial portions of the Software.
// - The Software is provided "as is", without warranty of any kind, express or
//   implied, including but not limited to the warranties of merchantability,
//   fitness for a particular purpose and noninfringement. In no event shall the
//   authors or copyright holders be liable for any claim, damages or other
//   liability, whether in an action of contract, tort or otherwise, arising
//   from, out of or in connection with the Software or the use or other dealings
//   in the Software.

const MIN_VERSION = 1;
const MAX_VERSION = 40;
const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;

const ECC_CODEWORDS_PER_BLOCK = [
    // Version:              1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40
    [-1,  7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // Low
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], // Medium
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // Quartile
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // High
];

const NUM_ERROR_CORRECTION_BLOCKS = [
    // Version:              1, 2, 3, 4, 5, 6, 7, 8, 9,10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4,  4,  4,  4,  4,  6,  6,  6,  6,  7,  8,  8,  9,  9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25], // Low
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5,  5,  8,  9,  9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49], // Medium
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8,  8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68], // Quartile
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81], // High
];

// Error correction level. Each level has:
//   ordinal: index into the codeword/block tables (0..3)
//   formatBits: 2-bit value written into the QR format info
export const Ecc = Object.freeze({
    LOW:      Object.freeze({ ordinal: 0, formatBits: 1 }), // ~7% recovery
    MEDIUM:   Object.freeze({ ordinal: 1, formatBits: 0 }), // ~15% recovery
    QUARTILE: Object.freeze({ ordinal: 2, formatBits: 3 }), // ~25% recovery
    HIGH:     Object.freeze({ ordinal: 3, formatBits: 2 }), // ~30% recovery
});

// Segment modes. numBitsCharCount[i] is the char-count field width for
// versions [1-9], [10-26], [27-40] respectively.
const Mode = Object.freeze({
    NUMERIC:      Object.freeze({ modeBits: 0x1, numBitsCharCount: [10, 12, 14] }),
    ALPHANUMERIC: Object.freeze({ modeBits: 0x2, numBitsCharCount: [ 9, 11, 13] }),
    BYTE:         Object.freeze({ modeBits: 0x4, numBitsCharCount: [ 8, 16, 16] }),
    KANJI:        Object.freeze({ modeBits: 0x8, numBitsCharCount: [ 8, 10, 12] }),
    ECI:          Object.freeze({ modeBits: 0x7, numBitsCharCount: [ 0,  0,  0] }),
});

function numCharCountBits(mode, ver) {
    return mode.numBitsCharCount[Math.floor((ver + 7) / 17)];
}

const NUMERIC_REGEX = /^[0-9]*$/;
const ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
const ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

function appendBits(val, len, bb) {
    if (len < 0 || len > 31 || val >>> len !== 0) throw new RangeError("Value out of range");
    for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1);
}

function getBit(x, i) {
    return ((x >>> i) & 1) !== 0;
}

function assert(cond) {
    if (!cond) throw new Error("QR assertion failed");
}

function toUtf8ByteArray(str) {
    const enc = encodeURI(str);
    const out = [];
    for (let i = 0; i < enc.length; i++) {
        if (enc.charAt(i) !== "%") {
            out.push(enc.charCodeAt(i));
        } else {
            out.push(parseInt(enc.substring(i + 1, i + 3), 16));
            i += 2;
        }
    }
    return out;
}

class QrSegment {
    constructor(mode, numChars, bitData) {
        if (numChars < 0) throw new RangeError("Invalid segment length");
        this.mode = mode;
        this.numChars = numChars;
        this.bitData = bitData.slice();
    }
    getData() { return this.bitData.slice(); }

    static makeBytes(data) {
        const bb = [];
        for (const b of data) appendBits(b, 8, bb);
        return new QrSegment(Mode.BYTE, data.length, bb);
    }

    static makeNumeric(digits) {
        if (!NUMERIC_REGEX.test(digits)) throw new RangeError("Non-numeric characters");
        const bb = [];
        for (let i = 0; i < digits.length;) {
            const n = Math.min(digits.length - i, 3);
            appendBits(parseInt(digits.substring(i, i + n), 10), n * 3 + 1, bb);
            i += n;
        }
        return new QrSegment(Mode.NUMERIC, digits.length, bb);
    }

    static makeAlphanumeric(text) {
        if (!ALPHANUMERIC_REGEX.test(text)) throw new RangeError("Unencodable in alphanumeric mode");
        const bb = [];
        let i;
        for (i = 0; i + 2 <= text.length; i += 2) {
            let temp = ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
            temp += ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
            appendBits(temp, 11, bb);
        }
        if (i < text.length) {
            appendBits(ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
        }
        return new QrSegment(Mode.ALPHANUMERIC, text.length, bb);
    }

    static makeSegments(text) {
        if (text === "") return [];
        if (NUMERIC_REGEX.test(text)) return [QrSegment.makeNumeric(text)];
        if (ALPHANUMERIC_REGEX.test(text)) return [QrSegment.makeAlphanumeric(text)];
        return [QrSegment.makeBytes(toUtf8ByteArray(text))];
    }

    static getTotalBits(segs, version) {
        let result = 0;
        for (const seg of segs) {
            const ccbits = numCharCountBits(seg.mode, version);
            if (seg.numChars >= (1 << ccbits)) return Infinity;
            result += 4 + ccbits + seg.bitData.length;
        }
        return result;
    }
}

class QrCode {
    static get MIN_VERSION() { return MIN_VERSION; }
    static get MAX_VERSION() { return MAX_VERSION; }

    static encodeText(text, ecl = Ecc.MEDIUM) {
        const segs = QrSegment.makeSegments(text);
        return QrCode.encodeSegments(segs, ecl);
    }

    static encodeBinary(data, ecl = Ecc.MEDIUM) {
        return QrCode.encodeSegments([QrSegment.makeBytes(data)], ecl);
    }

    static encodeSegments(segs, ecl, minVersion = 1, maxVersion = 40, mask = -1, boostEcl = true) {
        if (!(MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= MAX_VERSION)
                || mask < -1 || mask > 7) {
            throw new RangeError("Invalid encode parameters");
        }

        let version, dataUsedBits;
        for (version = minVersion; ; version++) {
            const dataCapacityBits = QrCode.#getNumDataCodewords(version, ecl) * 8;
            const usedBits = QrSegment.getTotalBits(segs, version);
            if (usedBits <= dataCapacityBits) { dataUsedBits = usedBits; break; }
            if (version >= maxVersion) throw new RangeError("Data too long");
        }

        for (const newEcl of [Ecc.MEDIUM, Ecc.QUARTILE, Ecc.HIGH]) {
            if (boostEcl && dataUsedBits <= QrCode.#getNumDataCodewords(version, newEcl) * 8) {
                ecl = newEcl;
            }
        }

        const bb = [];
        for (const seg of segs) {
            appendBits(seg.mode.modeBits, 4, bb);
            appendBits(seg.numChars, numCharCountBits(seg.mode, version), bb);
            for (const b of seg.getData()) bb.push(b);
        }
        assert(bb.length === dataUsedBits);

        const dataCapacityBits = QrCode.#getNumDataCodewords(version, ecl) * 8;
        assert(bb.length <= dataCapacityBits);
        appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
        appendBits(0, (8 - bb.length % 8) % 8, bb);
        assert(bb.length % 8 === 0);
        for (let padByte = 0xEC; bb.length < dataCapacityBits; padByte ^= 0xEC ^ 0x11) {
            appendBits(padByte, 8, bb);
        }

        const dataCodewords = new Array(bb.length >>> 3).fill(0);
        bb.forEach((b, i) => { dataCodewords[i >>> 3] |= b << (7 - (i & 7)); });

        return new QrCode(version, ecl, dataCodewords, mask);
    }

    constructor(version, ecl, dataCodewords, msk) {
        if (version < MIN_VERSION || version > MAX_VERSION) throw new RangeError("Version out of range");
        if (msk < -1 || msk > 7) throw new RangeError("Mask value out of range");

        this.version = version;
        this.errorCorrectionLevel = ecl;
        this.size = version * 4 + 17;

        const row = new Array(this.size).fill(false);
        this.modules = [];
        this.isFunction = [];
        for (let i = 0; i < this.size; i++) {
            this.modules.push(row.slice());
            this.isFunction.push(row.slice());
        }

        this.#drawFunctionPatterns();
        const allCodewords = this.#addEccAndInterleave(dataCodewords);
        this.#drawCodewords(allCodewords);

        if (msk === -1) {
            let minPenalty = Infinity;
            for (let i = 0; i < 8; i++) {
                this.#applyMask(i);
                this.#drawFormatBits(i);
                const penalty = this.#getPenaltyScore();
                if (penalty < minPenalty) { msk = i; minPenalty = penalty; }
                this.#applyMask(i);
            }
        }
        assert(msk >= 0 && msk <= 7);
        this.mask = msk;
        this.#applyMask(msk);
        this.#drawFormatBits(msk);
        this.isFunction = [];
    }

    getModule(x, y) {
        return x >= 0 && x < this.size && y >= 0 && y < this.size && this.modules[y][x];
    }

    #drawFunctionPatterns() {
        for (let i = 0; i < this.size; i++) {
            this.#setFunctionModule(6, i, i % 2 === 0);
            this.#setFunctionModule(i, 6, i % 2 === 0);
        }
        this.#drawFinderPattern(3, 3);
        this.#drawFinderPattern(this.size - 4, 3);
        this.#drawFinderPattern(3, this.size - 4);

        const alignPatPos = this.#getAlignmentPatternPositions();
        const numAlign = alignPatPos.length;
        for (let i = 0; i < numAlign; i++) {
            for (let j = 0; j < numAlign; j++) {
                if (!(i === 0 && j === 0 || i === 0 && j === numAlign - 1 || i === numAlign - 1 && j === 0)) {
                    this.#drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
                }
            }
        }
        this.#drawFormatBits(0);
        this.#drawVersion();
    }

    #drawFormatBits(mask) {
        const data = this.errorCorrectionLevel.formatBits << 3 | mask;
        let rem = data;
        for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
        const bits = (data << 10 | rem) ^ 0x5412;
        assert(bits >>> 15 === 0);

        for (let i = 0; i <= 5; i++) this.#setFunctionModule(8, i, getBit(bits, i));
        this.#setFunctionModule(8, 7, getBit(bits, 6));
        this.#setFunctionModule(8, 8, getBit(bits, 7));
        this.#setFunctionModule(7, 8, getBit(bits, 8));
        for (let i = 9; i < 15; i++) this.#setFunctionModule(14 - i, 8, getBit(bits, i));

        for (let i = 0; i < 8; i++) this.#setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
        for (let i = 8; i < 15; i++) this.#setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
        this.#setFunctionModule(8, this.size - 8, true);
    }

    #drawVersion() {
        if (this.version < 7) return;
        let rem = this.version;
        for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
        const bits = this.version << 12 | rem;
        assert(bits >>> 18 === 0);

        for (let i = 0; i < 18; i++) {
            const color = getBit(bits, i);
            const a = this.size - 11 + i % 3;
            const b = Math.floor(i / 3);
            this.#setFunctionModule(a, b, color);
            this.#setFunctionModule(b, a, color);
        }
    }

    #drawFinderPattern(x, y) {
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                const xx = x + dx, yy = y + dy;
                if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
                    this.#setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
                }
            }
        }
    }

    #drawAlignmentPattern(x, y) {
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                this.#setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
            }
        }
    }

    #setFunctionModule(x, y, isDark) {
        this.modules[y][x] = isDark;
        this.isFunction[y][x] = true;
    }

    #addEccAndInterleave(data) {
        const ver = this.version;
        const ecl = this.errorCorrectionLevel;
        if (data.length !== QrCode.#getNumDataCodewords(ver, ecl)) throw new RangeError("Invalid data length");

        const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
        const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
        const rawCodewords = Math.floor(QrCode.#getNumRawDataModules(ver) / 8);
        const numShortBlocks = numBlocks - rawCodewords % numBlocks;
        const shortBlockLen = Math.floor(rawCodewords / numBlocks);

        const blocks = [];
        const rsDiv = QrCode.#reedSolomonComputeDivisor(blockEccLen);
        for (let i = 0, k = 0; i < numBlocks; i++) {
            const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
            k += dat.length;
            const ecc = QrCode.#reedSolomonComputeRemainder(dat, rsDiv);
            if (i < numShortBlocks) dat.push(0);
            blocks.push(dat.concat(ecc));
        }

        const result = [];
        for (let i = 0; i < blocks[0].length; i++) {
            blocks.forEach((block, j) => {
                if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
            });
        }
        assert(result.length === rawCodewords);
        return result;
    }

    #drawCodewords(data) {
        if (data.length !== Math.floor(QrCode.#getNumRawDataModules(this.version) / 8)) {
            throw new RangeError("Codewords length mismatch");
        }
        let i = 0;
        for (let right = this.size - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5;
            for (let vert = 0; vert < this.size; vert++) {
                for (let j = 0; j < 2; j++) {
                    const x = right - j;
                    const upward = ((right + 1) & 2) === 0;
                    const y = upward ? this.size - 1 - vert : vert;
                    if (!this.isFunction[y][x] && i < data.length * 8) {
                        this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
                        i++;
                    }
                }
            }
        }
        assert(i === data.length * 8);
    }

    #applyMask(mask) {
        if (mask < 0 || mask > 7) throw new RangeError("Mask value out of range");
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                let invert;
                switch (mask) {
                    case 0: invert = (x + y) % 2 === 0; break;
                    case 1: invert = y % 2 === 0; break;
                    case 2: invert = x % 3 === 0; break;
                    case 3: invert = (x + y) % 3 === 0; break;
                    case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
                    case 5: invert = x * y % 2 + x * y % 3 === 0; break;
                    case 6: invert = (x * y % 2 + x * y % 3) % 2 === 0; break;
                    case 7: invert = ((x + y) % 2 + x * y % 3) % 2 === 0; break;
                    default: throw new Error("Unreachable");
                }
                if (!this.isFunction[y][x] && invert) this.modules[y][x] = !this.modules[y][x];
            }
        }
    }

    #getPenaltyScore() {
        let result = 0;

        for (let y = 0; y < this.size; y++) {
            let runColor = false, runX = 0;
            const runHistory = [0, 0, 0, 0, 0, 0, 0];
            for (let x = 0; x < this.size; x++) {
                if (this.modules[y][x] === runColor) {
                    runX++;
                    if (runX === 5) result += PENALTY_N1;
                    else if (runX > 5) result++;
                } else {
                    this.#finderPenaltyAddHistory(runX, runHistory);
                    if (!runColor) result += this.#finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
                    runColor = this.modules[y][x];
                    runX = 1;
                }
            }
            result += this.#finderPenaltyTerminateAndCount(runColor, runX, runHistory) * PENALTY_N3;
        }
        for (let x = 0; x < this.size; x++) {
            let runColor = false, runY = 0;
            const runHistory = [0, 0, 0, 0, 0, 0, 0];
            for (let y = 0; y < this.size; y++) {
                if (this.modules[y][x] === runColor) {
                    runY++;
                    if (runY === 5) result += PENALTY_N1;
                    else if (runY > 5) result++;
                } else {
                    this.#finderPenaltyAddHistory(runY, runHistory);
                    if (!runColor) result += this.#finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
                    runColor = this.modules[y][x];
                    runY = 1;
                }
            }
            result += this.#finderPenaltyTerminateAndCount(runColor, runY, runHistory) * PENALTY_N3;
        }

        for (let y = 0; y < this.size - 1; y++) {
            for (let x = 0; x < this.size - 1; x++) {
                const color = this.modules[y][x];
                if (color === this.modules[y][x + 1] &&
                    color === this.modules[y + 1][x] &&
                    color === this.modules[y + 1][x + 1]) result += PENALTY_N2;
            }
        }

        let dark = 0;
        for (const row of this.modules) for (const c of row) if (c) dark++;
        const total = this.size * this.size;
        const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
        assert(k >= 0 && k <= 9);
        result += k * PENALTY_N4;
        return result;
    }

    #getAlignmentPatternPositions() {
        if (this.version === 1) return [];
        const numAlign = Math.floor(this.version / 7) + 2;
        const step = Math.floor((this.version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
        const result = [6];
        for (let pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
        return result;
    }

    static #getNumRawDataModules(ver) {
        if (ver < MIN_VERSION || ver > MAX_VERSION) throw new RangeError("Version number out of range");
        let result = (16 * ver + 128) * ver + 64;
        if (ver >= 2) {
            const numAlign = Math.floor(ver / 7) + 2;
            result -= (25 * numAlign - 10) * numAlign - 55;
            if (ver >= 7) result -= 36;
        }
        return result;
    }

    static #getNumDataCodewords(ver, ecl) {
        return Math.floor(QrCode.#getNumRawDataModules(ver) / 8)
            - ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver]
            * NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
    }

    static #reedSolomonComputeDivisor(degree) {
        if (degree < 1 || degree > 255) throw new RangeError("Degree out of range");
        const result = new Array(degree - 1).fill(0);
        result.push(1);
        let root = 1;
        for (let i = 0; i < degree; i++) {
            for (let j = 0; j < result.length; j++) {
                result[j] = QrCode.#reedSolomonMultiply(result[j], root);
                if (j + 1 < result.length) result[j] ^= result[j + 1];
            }
            root = QrCode.#reedSolomonMultiply(root, 0x02);
        }
        return result;
    }

    static #reedSolomonComputeRemainder(data, divisor) {
        const result = divisor.map(() => 0);
        for (const b of data) {
            const factor = b ^ result.shift();
            result.push(0);
            divisor.forEach((coef, i) => { result[i] ^= QrCode.#reedSolomonMultiply(coef, factor); });
        }
        return result;
    }

    static #reedSolomonMultiply(x, y) {
        if (x >>> 8 !== 0 || y >>> 8 !== 0) throw new RangeError("Byte out of range");
        let z = 0;
        for (let i = 7; i >= 0; i--) {
            z = (z << 1) ^ ((z >>> 7) * 0x11D);
            z ^= ((y >>> i) & 1) * x;
        }
        return z;
    }

    #finderPenaltyCountPatterns(runHistory) {
        const n = runHistory[1];
        const core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
        return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0)
             + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
    }

    #finderPenaltyTerminateAndCount(currentRunColor, currentRunLength, runHistory) {
        if (currentRunColor) {
            this.#finderPenaltyAddHistory(currentRunLength, runHistory);
            currentRunLength = 0;
        }
        currentRunLength += this.size;
        this.#finderPenaltyAddHistory(currentRunLength, runHistory);
        return this.#finderPenaltyCountPatterns(runHistory);
    }

    #finderPenaltyAddHistory(currentRunLength, runHistory) {
        if (runHistory[0] === 0) currentRunLength += this.size;
        runHistory.pop();
        runHistory.unshift(currentRunLength);
    }
}

export { QrCode, QrSegment };

// -------- Helpers to render into a Canvas 2D context --------
// Draws a QrCode onto a HTMLCanvasElement, resizing it to `size` CSS pixels
// (also becomes the pixel resolution). `quietZone` is the border in modules
// (spec recommends 4). Uses the given light/dark colors.
export function drawQrToCanvas(qr, canvas, {
    size = 256,
    quietZone = 4,
    darkColor = '#00f2fe',
    lightColor = '#0a0f1d',
} = {}) {
    if (!canvas || !qr) return;
    const modules = qr.size;
    const total = modules + quietZone * 2;
    const scale = Math.max(1, Math.floor(size / total));
    const pixelSize = scale * total;

    canvas.width = pixelSize;
    canvas.height = pixelSize;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, pixelSize, pixelSize);

    ctx.fillStyle = darkColor;
    for (let y = 0; y < modules; y++) {
        for (let x = 0; x < modules; x++) {
            if (qr.getModule(x, y)) {
                ctx.fillRect((x + quietZone) * scale, (y + quietZone) * scale, scale, scale);
            }
        }
    }
}

// One-shot convenience: encode `text` and paint it to the canvas.
// `ecl` accepts an Ecc constant or a string ('L'|'M'|'Q'|'H').
export function renderQrToCanvas(text, canvas, options = {}) {
    if (!canvas) return null;
    let ecl = options.ecl ?? Ecc.MEDIUM;
    if (typeof ecl === 'string') {
        const map = { L: Ecc.LOW, M: Ecc.MEDIUM, Q: Ecc.QUARTILE, H: Ecc.HIGH };
        ecl = map[ecl.toUpperCase()] || Ecc.MEDIUM;
    }
    const qr = QrCode.encodeText(text ?? '', ecl);
    drawQrToCanvas(qr, canvas, options);
    return qr;
}
