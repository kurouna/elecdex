import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
    describeSequence,
    factorize,
    formatFactorization,
    gcdOf,
    isPrime,
    lcmOf,
    toFraction,
} from './mathkit';

function ok<T>(result: T | string): T {
    if (typeof result === 'string') throw new Error(`unexpected error: ${result}`);
    return result;
}

describe('gcdOf / lcmOf', () => {
    it('最大公約数', () => {
        expect(ok(gcdOf([12, 18]))).toBe(6);
        expect(ok(gcdOf([12, 18, 30]))).toBe(6);
        expect(ok(gcdOf([7, 13]))).toBe(1);
        expect(ok(gcdOf([-12, 18]))).toBe(6);
        expect(ok(gcdOf([0, 5]))).toBe(5);
    });

    it('最小公倍数', () => {
        expect(ok(lcmOf([4, 6]))).toBe(12);
        expect(ok(lcmOf([2, 3, 4]))).toBe(12);
        expect(ok(lcmOf([5, 0]))).toBe(0);
    });

    it('整数でなければ断る', () => {
        expect(gcdOf([1.5, 3])).toBe('every number must be a whole number');
        expect(lcmOf([1.5, 3])).toBe('every number must be a whole number');
        expect(gcdOf([])).toBe('no numbers to work with');
    });

    it('大きすぎる最小公倍数は丸めずに断る', () => {
        expect(lcmOf([99999989, 99999971, 99999959])).toBe('the least common multiple is too large to be exact');
    });

    it('gcd は両方を割り切り、lcm は両方で割り切れる', () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 100000 }),
            fc.integer({ min: 1, max: 100000 }),
            (a, b) => {
                const g = ok(gcdOf([a, b]));
                expect(a % g).toBe(0);
                expect(b % g).toBe(0);
                const l = lcmOf([a, b]);
                if (typeof l === 'number') {
                    expect(l % a).toBe(0);
                    expect(l % b).toBe(0);
                    // gcd * lcm = a * b（整数論の基本関係）。
                    expect(g * l).toBe(a * b);
                }
            },
        ), { numRuns: 300 });
    });
});

describe('factorize — 素因数分解', () => {
    it('教科書どおりの分解', () => {
        expect(ok(factorize(360))).toEqual([[2, 3], [3, 2], [5, 1]]);
        expect(ok(factorize(97))).toEqual([[97, 1]]);
        expect(ok(factorize(1024))).toEqual([[2, 10]]);
    });

    it('0 と 1 と -1 は分解しない', () => {
        expect(ok(factorize(0))).toEqual([]);
        expect(ok(factorize(1))).toEqual([]);
        expect(ok(factorize(-1))).toEqual([]);
    });

    it('負数は絶対値を分解する', () => {
        expect(ok(factorize(-12))).toEqual([[2, 2], [3, 1]]);
        expect(formatFactorization(-12, ok(factorize(-12)))).toBe('-1 * 2^2 * 3');
    });

    it('整数でない・大きすぎる値は断る', () => {
        expect(factorize(1.5)).toBe('only whole numbers can be factorized');
        expect(factorize(2 ** 45)).toBe('the number is too large to factorize here');
    });

    it('表記は 2^3 * 5 の形', () => {
        expect(formatFactorization(360, ok(factorize(360)))).toBe('2^3 * 3^2 * 5');
        expect(formatFactorization(97, ok(factorize(97)))).toBe('97');
        expect(formatFactorization(1, [])).toBe('1');
    });

    it('素因数を掛け戻すと元の数になり、因数はすべて素数', () => {
        fc.assert(fc.property(fc.integer({ min: 2, max: 5000000 }), (n) => {
            const factors = ok(factorize(n));
            const product = factors.reduce((acc, [p, e]) => acc * Math.pow(p, e), 1);
            expect(product).toBe(n);
            for (const [p] of factors) expect(isPrime(p)).toBe(true);
        }), { numRuns: 300 });
    });
});

describe('isPrime', () => {
    it('小さい数の判定', () => {
        expect([2, 3, 5, 7, 11, 13, 97].every(isPrime)).toBe(true);
        expect([0, 1, 4, 9, 15, 100, -7].some(isPrime)).toBe(false);
    });

    it('素数は 1 と自分自身でしか割れない', () => {
        fc.assert(fc.property(fc.integer({ min: 2, max: 20000 }), (n) => {
            if (!isPrime(n)) return;
            for (let d = 2; d * d <= n; d++) expect(n % d).not.toBe(0);
        }), { numRuns: 300 });
    });
});

describe('toFraction — 分数近似', () => {
    it('割り切った跡を分数に戻す', () => {
        expect(ok(toFraction(0.5))).toMatchObject({ numerator: 1, denominator: 2 });
        expect(ok(toFraction(0.25))).toMatchObject({ numerator: 1, denominator: 4 });
        expect(ok(toFraction(1 / 3))).toMatchObject({ numerator: 1, denominator: 3 });
        expect(ok(toFraction(2 / 7))).toMatchObject({ numerator: 2, denominator: 7 });
    });

    it('負数の符号は分子につく', () => {
        expect(ok(toFraction(-0.75))).toMatchObject({ numerator: -3, denominator: 4 });
    });

    it('整数は分母 1', () => {
        expect(ok(toFraction(5))).toEqual({ numerator: 5, denominator: 1, error: 0 });
    });

    it('近似のずれを隠さない', () => {
        const pi = ok(toFraction(Math.PI));
        expect(pi.denominator).toBeLessThanOrEqual(100000);
        expect(Math.abs(pi.error)).toBeLessThan(1e-6);
        // 355/113 は円周率の有名な近似。分母の上限内ならこれ以上の精度が出る。
        expect(Math.abs(pi.numerator / pi.denominator - Math.PI)).toBeLessThan(Math.abs(355 / 113 - Math.PI) + 1e-12);
    });

    it('有限でない値は断る', () => {
        expect(toFraction(Infinity)).toBe('only finite numbers can be written as a fraction');
        expect(toFraction(NaN)).toBe('only finite numbers can be written as a fraction');
    });

    it('分母は上限を超えず、誤差は十分小さい', () => {
        fc.assert(fc.property(
            fc.integer({ min: -10000, max: 10000 }),
            fc.integer({ min: 1, max: 999 }),
            (numerator, denominator) => {
                const value = numerator / denominator;
                const f = ok(toFraction(value));
                expect(f.denominator).toBeGreaterThan(0);
                expect(f.denominator).toBeLessThanOrEqual(100000);
                expect(Math.abs(f.numerator / f.denominator - value)).toBeLessThan(1e-9);
            },
        ), { numRuns: 300 });
    });
});

describe('mathkit — 個数の境目', () => {
    it('数列の見立ては 3 個から', () => {
        expect(describeSequence([1, 2])).toBe('at least three numbers are needed to guess a sequence');
        expect(ok(describeSequence([1, 2, 3]))).toMatchObject({ kind: 'arithmetic', next: 4 });
    });

    it('最大公約数と最小公倍数は 1 個でも成り立つ', () => {
        expect(ok(gcdOf([12]))).toBe(12);
        expect(ok(lcmOf([12]))).toBe(12);
        expect(gcdOf([])).toBe('no numbers to work with');
        expect(lcmOf([])).toBe('no numbers to work with');
    });

    it('多項式と見立てるには 4 個が要る', () => {
        // 3 点はどんな並びでも 2 次曲線に乗るので、3 個で「2 次多項式」と言っても中身が無い。
        // 2 階差が 2 つ並んで初めて、一定だと確かめたことになる。
        expect(ok(describeSequence([1, 4, 9]))).toMatchObject({ kind: 'unknown' });
        expect(ok(describeSequence([1, 4, 9, 16]))).toMatchObject({ kind: 'polynomial', parameter: 2, next: 25 });
    });
});

describe('describeSequence — 数列の見立て', () => {
    it('定数列', () => {
        expect(ok(describeSequence([7, 7, 7, 7]))).toMatchObject({ kind: 'constant', next: 7 });
    });

    it('等差数列', () => {
        expect(ok(describeSequence([2, 5, 8, 11]))).toMatchObject({ kind: 'arithmetic', parameter: 3, next: 14 });
        expect(ok(describeSequence([10, 8, 6]))).toMatchObject({ kind: 'arithmetic', parameter: -2, next: 4 });
    });

    it('等比数列', () => {
        expect(ok(describeSequence([2, 6, 18, 54]))).toMatchObject({ kind: 'geometric', parameter: 3, next: 162 });
        expect(ok(describeSequence([64, 32, 16]))).toMatchObject({ kind: 'geometric', parameter: 0.5, next: 8 });
    });

    it('多項式（平方数と立方数）', () => {
        const squares = ok(describeSequence([1, 4, 9, 16, 25]));
        expect(squares).toMatchObject({ kind: 'polynomial', parameter: 2, next: 36 });
        const cubes = ok(describeSequence([1, 8, 27, 64, 125, 216]));
        expect(cubes).toMatchObject({ kind: 'polynomial', parameter: 3, next: 343 });
    });

    it('三角数も多項式として当てる', () => {
        expect(ok(describeSequence([1, 3, 6, 10, 15]))).toMatchObject({ kind: 'polynomial', parameter: 2, next: 21 });
    });

    it('規則が見えないものは unknown（それらしい式をひねり出さない）', () => {
        expect(ok(describeSequence([1, 1, 2, 3, 5, 8]))).toMatchObject({ kind: 'unknown' });
        expect(ok(describeSequence([3, 1, 4, 1, 5, 9]))).toMatchObject({ kind: 'unknown' });
    });

    it('3 つ未満なら断る', () => {
        expect(describeSequence([1, 2])).toBe('at least three numbers are needed to guess a sequence');
    });

    it('等差数列は必ず等差と見立て、次の項も当たる', () => {
        fc.assert(fc.property(
            fc.integer({ min: -1000, max: 1000 }),
            fc.integer({ min: -50, max: 50 }).filter((d) => d !== 0),
            fc.integer({ min: 3, max: 12 }),
            (start, step, count) => {
                const values = Array.from({ length: count }, (_, i) => start + step * i);
                const guess = ok(describeSequence(values));
                expect(guess.kind).toBe('arithmetic');
                expect(guess.next).toBeCloseTo(start + step * count, 6);
            },
        ), { numRuns: 300 });
    });

    it('二次式の列は 2 次の多項式として当てる', () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 20 }),
            fc.integer({ min: -20, max: 20 }),
            fc.integer({ min: -20, max: 20 }),
            (a, b, c) => {
                const f = (n: number) => a * n * n + b * n + c;
                const values = [0, 1, 2, 3, 4, 5].map(f);
                const guess = ok(describeSequence(values));
                expect(guess.kind).toBe('polynomial');
                expect(guess.parameter).toBe(2);
                expect(guess.next).toBeCloseTo(f(6), 6);
            },
        ), { numRuns: 300 });
    });
});
