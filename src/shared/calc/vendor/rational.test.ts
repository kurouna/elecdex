import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
    addRational,
    formatRational,
    makeRational,
    parseRational,
    parseRationalsInText,
    rationalToNumber,
    sumRationals,
} from './rational';

/** 読みやすさのための組み立て。 */
const r = (n: number, d = 1) => makeRational(BigInt(n), BigInt(d));

describe('makeRational — 正規化', () => {
    it('約分して、符号は分子へ寄せる', () => {
        expect(makeRational(2n, 4n)).toEqual({ n: 1n, d: 2n });
        expect(makeRational(-2n, 4n)).toEqual({ n: -1n, d: 2n });
        expect(makeRational(2n, -4n)).toEqual({ n: -1n, d: 2n });
        expect(makeRational(-2n, -4n)).toEqual({ n: 1n, d: 2n });
    });

    it('0 は 0/1 にそろえる', () => {
        expect(makeRational(0n, 5n)).toEqual({ n: 0n, d: 1n });
        expect(makeRational(0n, -5n)).toEqual({ n: 0n, d: 1n });
    });

    it('分母 0 は作れない', () => {
        expect(() => makeRational(1n, 0n)).toThrow();
    });
});

describe('parseRational — 表記を読む', () => {
    it('整数', () => {
        expect(parseRational('42')).toEqual({ n: 42n, d: 1n });
        expect(parseRational('-7')).toEqual({ n: -7n, d: 1n });
    });

    it('分数', () => {
        expect(parseRational('1/2')).toEqual({ n: 1n, d: 2n });
        expect(parseRational('-3/6')).toEqual({ n: -1n, d: 2n });
        expect(parseRational('4/2')).toEqual({ n: 2n, d: 1n });
    });

    it('小数は 10 のべき乗を分母にして厳密に読む', () => {
        // 0.1 を double で受けると、その時点で厳密さが失われる。
        expect(parseRational('0.1')).toEqual({ n: 1n, d: 10n });
        expect(parseRational('0.25')).toEqual({ n: 1n, d: 4n });
        expect(parseRational('-1.5')).toEqual({ n: -3n, d: 2n });
        expect(parseRational('.5')).toEqual({ n: 1n, d: 2n });
    });

    it('3 桁区切りと全角も読む', () => {
        expect(parseRational('1,234')).toEqual({ n: 1234n, d: 1n });
        expect(parseRational('１／２')).toEqual({ n: 1n, d: 2n });
    });

    it('桁が多くても丸めない', () => {
        const big = parseRational('123456789012345678901234567890');
        expect(big).toEqual({ n: 123456789012345678901234567890n, d: 1n });
    });

    it('分母 0 と読めない表記は null', () => {
        expect(parseRational('1/0')).toBeNull();
        expect(parseRational('hello')).toBeNull();
        expect(parseRational('')).toBeNull();
        expect(parseRational('1/2/3')).toBeNull();
        expect(parseRational('1e3')).toBeNull();
    });
});

describe('addRational / sumRationals — 厳密な足し算', () => {
    it('分数の和が丸まらない', () => {
        expect(formatRational(sumRationals([r(1, 2), r(1, 3), r(1, 6)]))).toBe('1');
        expect(formatRational(sumRationals([r(1, 3), r(1, 3), r(1, 3)]))).toBe('1');
    });

    it('小数の和も丸まらない', () => {
        const values = [parseRational('0.1')!, parseRational('0.2')!];
        expect(formatRational(sumRationals(values))).toBe('3/10');
    });

    it('調和数', () => {
        const harmonic = Array.from({ length: 10 }, (_, i) => r(1, i + 1));
        expect(formatRational(sumRationals(harmonic))).toBe('7381/2520');
    });

    it('空の列は 0', () => {
        expect(formatRational(sumRationals([]))).toBe('0');
    });

    it('足す順番を変えても結果は同じ', () => {
        fc.assert(fc.property(
            fc.array(fc.tuple(fc.integer({ min: -1000, max: 1000 }), fc.integer({ min: 1, max: 1000 })),
                { minLength: 1, maxLength: 20 }),
            (pairs) => {
                const values = pairs.map(([n, d]) => r(n, d));
                const forward = sumRationals(values);
                const backward = sumRationals([...values].reverse());
                expect(forward).toEqual(backward);
            },
        ), { numRuns: 300 });
    });

    it('a + (-a) は必ず 0', () => {
        fc.assert(fc.property(
            fc.integer({ min: -10000, max: 10000 }),
            fc.integer({ min: 1, max: 10000 }),
            (n, d) => {
                expect(addRational(r(n, d), r(-n, d))).toEqual({ n: 0n, d: 1n });
            },
        ), { numRuns: 300 });
    });
});

describe('formatRational / rationalToNumber — 見せ方', () => {
    it('分母 1 なら整数として書く', () => {
        expect(formatRational(r(5))).toBe('5');
        expect(formatRational(r(-5))).toBe('-5');
        expect(formatRational(r(4, 2))).toBe('2');
    });

    it('分数は約分した形で書く', () => {
        expect(formatRational(r(2, 4))).toBe('1/2');
        expect(formatRational(r(-2, 4))).toBe('-1/2');
    });

    it('double へ落とすときだけ誤差が入る', () => {
        expect(rationalToNumber(r(1, 3))).toBeCloseTo(1 / 3, 15);
        expect(rationalToNumber(r(7381, 2520))).toBeCloseTo(7381 / 2520, 12);
    });

    it('巨大な有理数でも double に落とせる', () => {
        const huge = makeRational(10n ** 40n, 3n);
        expect(Number.isFinite(rationalToNumber(huge))).toBe(true);
        expect(rationalToNumber(huge)).toBeGreaterThan(1e39);
    });
});

describe('parseRationalsInText — 範囲から分数を拾う', () => {
    it('分数を 2 つの整数に割らない', () => {
        // 既存の数値走査は "1/2" を 1 と 2 として読む。厳密計算では致命的。
        expect(parseRationalsInText('1/2 1/3').map(formatRational)).toEqual(['1/2', '1/3']);
    });

    it('整数・小数・分数が混ざっていても拾う', () => {
        expect(parseRationalsInText('1 0.5 3/4').map(formatRational)).toEqual(['1', '1/2', '3/4']);
    });

    it('行に散っていても順に拾う', () => {
        const text = 'a 1/2\nb 1/3\nc 1/6';
        expect(formatRational(sumRationals(parseRationalsInText(text)))).toBe('1');
    });

    it('日付やバージョン番号を分数と読まない', () => {
        // "2026/09/06" を 2026/9 と読むと合計が壊れる。3 つ以上つながる並びは数値でない。
        expect(parseRationalsInText('2026/09/06')).toEqual([]);
    });

    it('割り算のつもりの式も、ここでは分数として読む', () => {
        // 合計を取る道具なので、式ではなく値の並びとして読む (numbers.ts と同じ方針)。
        expect(parseRationalsInText('10/2').map(formatRational)).toEqual(['5']);
    });

    it('数値が無ければ空', () => {
        expect(parseRationalsInText('hello world')).toEqual([]);
        expect(parseRationalsInText('')).toEqual([]);
    });

    it('どんな文字列でも throw せず、分母は必ず正', () => {
        fc.assert(fc.property(fc.string({ maxLength: 120 }), (text) => {
            for (const value of parseRationalsInText(text)) {
                expect(value.d).toBeGreaterThan(0n);
            }
        }), { numRuns: 500 });
    });

    /**
     * calc-exact-region は選択範囲をまるごとこの走査に通す。パターンは長さ 0 のマッチを
     * 許す形 (すべての部分が省略可能) なので、文字数ぶんだけ空マッチが立つ。実測では
     * 2MB / 100ms 程度で線形だが、書き換えの拍子に後戻りの多い形にすると、ここだけが
     * 選択範囲の二乗で効いてエディタが固まる。長さと時間の両方を固定しておく。
     */
    it('大きな選択範囲でも、余計な値を作らず現実的な時間で終わる', () => {
        const line = 'coffee 1/3 and 250 yen plus some prose here' + String.fromCharCode(10);
        const text = line.repeat(50000); // 約 2.2MB
        const started = Date.now();
        const values = parseRationalsInText(text);
        const elapsed = Date.now() - started;

        // 1 行につき 1/3 と 250 の 2 つだけ。空マッチが値として漏れれば数が合わない。
        expect(values.length).toBe(100000);
        expect(formatRational(values[0])).toBe('1/3');
        expect(formatRational(values[1])).toBe('250');
        // 実測の 25 倍。線形を保っている限り届かず、二乗になれば必ず超える。
        expect(elapsed).toBeLessThan(2500);
    });
});
