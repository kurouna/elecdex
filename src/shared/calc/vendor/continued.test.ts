import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
    continuedFraction,
    evaluateContinuedFraction,
    formatContinuedFraction,
} from './continued';

describe('continuedFraction — 展開', () => {
    it('有名な展開', () => {
        expect(continuedFraction(Math.PI, 5).terms).toEqual([3, 7, 15, 1, 292]);
        expect(continuedFraction(Math.SQRT2, 6).terms).toEqual([1, 2, 2, 2, 2, 2]);
        expect(continuedFraction(Math.E, 9).terms).toEqual([2, 1, 2, 1, 1, 4, 1, 1, 6]);
    });

    it('有理数は途中で終わり、exact が立つ', () => {
        const half = continuedFraction(0.5);
        expect(half.terms).toEqual([0, 2]);
        expect(half.exact).toBe(true);

        const seven = continuedFraction(7);
        expect(seven.terms).toEqual([7]);
        expect(seven.exact).toBe(true);
    });

    it('無理数は打ち切られ、exact は立たない', () => {
        expect(continuedFraction(Math.PI, 5).exact).toBe(false);
    });

    it('負数も扱う', () => {
        const value = -1.5;
        const cf = continuedFraction(value);
        expect(evaluateContinuedFraction(cf.terms)).toBeCloseTo(value, 12);
    });

    it('収束分数が並ぶ', () => {
        const cf = continuedFraction(Math.PI, 4);
        expect(cf.convergents.map((c) => `${c.n}/${c.d}`)).toEqual(['3/1', '22/7', '333/106', '355/113']);
    });

    it('収束分数は 1 つ進むごとに元の値へ近づく', () => {
        const cf = continuedFraction(Math.PI, 6);
        const errors = cf.convergents.map((c) => Math.abs(c.n / c.d - Math.PI));
        for (let i = 1; i < errors.length; i++) expect(errors[i]).toBeLessThan(errors[i - 1]);
    });

    it('有限でない値は空', () => {
        expect(continuedFraction(Infinity).terms).toEqual([]);
        expect(continuedFraction(NaN).terms).toEqual([]);
    });

    it('項の数は上限を超えない', () => {
        expect(continuedFraction(Math.PI, 3).terms).toHaveLength(3);
    });
});

describe('formatContinuedFraction — 表記', () => {
    it('先頭の整数部だけセミコロンで区切る', () => {
        // 打ち切った展開には … が付く (π は終わらないので、5 項で切れば必ず付く)。
        expect(formatContinuedFraction(continuedFraction(Math.PI, 5))).toBe('[3; 7, 15, 1, 292, …]');
        expect(formatContinuedFraction(continuedFraction(7))).toBe('[7]');
        expect(formatContinuedFraction(continuedFraction(0.5))).toBe('[0; 2]');
    });

    it('打ち切ったものは末尾に … を付ける', () => {
        expect(formatContinuedFraction(continuedFraction(Math.SQRT2, 4))).toBe('[1; 2, 2, 2, …]');
    });

    it('空の展開は空の括弧', () => {
        expect(formatContinuedFraction(continuedFraction(NaN))).toBe('[]');
    });
});

describe('evaluateContinuedFraction — 畳み戻し', () => {
    it('展開を畳み戻すと元の値に戻る', () => {
        fc.assert(fc.property(
            fc.integer({ min: -10000, max: 10000 }),
            fc.integer({ min: 1, max: 1000 }),
            (n, d) => {
                const value = n / d;
                const cf = continuedFraction(value, 40);
                expect(evaluateContinuedFraction(cf.terms)).toBeCloseTo(value, 9);
            },
        ), { numRuns: 300 });
    });

    it('空の項は 0', () => {
        expect(evaluateContinuedFraction([])).toBe(0);
    });

    it('最後の収束分数は、畳み戻した値と一致する', () => {
        fc.assert(fc.property(
            fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
            (x) => {
                const cf = continuedFraction(x, 12);
                if (cf.convergents.length === 0) return;
                const last = cf.convergents[cf.convergents.length - 1];
                expect(last.n / last.d).toBeCloseTo(evaluateContinuedFraction(cf.terms), 6);
            },
        ), { numRuns: 300 });
    });
});
