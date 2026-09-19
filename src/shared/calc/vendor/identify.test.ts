import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { identifyNumber } from './identify';

/** 先頭候補の式だけを取り出す。 */
const best = (x: number) => identifyNumber(x)[0]?.text;

describe('identifyNumber — 小数から閉じた形を当てる', () => {
    it('有名な定数', () => {
        expect(best(1.6180339887)).toBe('phi');
        expect(best(2.718281828)).toBe('e');
        expect(best(0.5772156649)).toBe('gamma');
        expect(best(3.14159265359)).toBe('pi');
    });

    it('定数の有理数倍', () => {
        expect(best(0.7853981634)).toBe('pi/4');
        expect(best(1.0471975512)).toBe('pi/3');
        expect(best(4.71238898038)).toBe('3*pi/2');
        expect(best(1.644934067)).toBe('pi^2/6');
    });

    it('平方根と立方根', () => {
        expect(best(1.414213562)).toBe('sqrt(2)');
        expect(best(2.449489743)).toBe('sqrt(6)');
        expect(best(1.259921049)).toBe('2^(1/3)');
    });

    it('対数', () => {
        expect(best(0.6931471806)).toBe('ln(2)');
        expect(best(2.302585093)).toBe('ln(10)');
    });

    it('ただの有理数', () => {
        expect(best(0.3333333333)).toBe('1/3');
        expect(best(0.75)).toBe('3/4');
        expect(best(7)).toBe('7');
        expect(best(-0.5)).toBe('-1/2');
    });

    it('意味のない小数には答えを作らない', () => {
        // それらしい式をひねり出すほうが、分からないと言うより有害。
        expect(identifyNumber(0.123456789)).toEqual([]);
        expect(identifyNumber(0.8391726354)).toEqual([]);
    });

    it('候補は簡単な形から順に並び、3 つまで', () => {
        const hits = identifyNumber(0.5);
        expect(hits.length).toBeGreaterThan(0);
        expect(hits.length).toBeLessThanOrEqual(3);
        expect(hits[0].text).toBe('1/2');
        // どの候補も、元の数に十分近い。
        for (const hit of hits) {
            expect(Math.abs(hit.value - 0.5)).toBeLessThan(1e-9);
            expect(Math.abs(hit.error)).toBeLessThan(1e-9);
        }
    });

    it('0 と有限でない値は扱わない', () => {
        expect(identifyNumber(0)).toEqual([]);
        expect(identifyNumber(Infinity)).toEqual([]);
        expect(identifyNumber(NaN)).toEqual([]);
    });

    it('許容誤差を狭めると、桁の足りない入力は当たらなくなる', () => {
        // 小数 5 桁しか書かれていない π は、厳しい許容では π と断定できない。
        expect(identifyNumber(3.14159, 1e-12)).toEqual([]);
        expect(identifyNumber(3.14159, 1e-5)[0].text).toBe('pi');
    });

    it('当てた式は、実際にその値になる', () => {
        fc.assert(fc.property(
            fc.constantFrom(Math.PI, Math.E, Math.SQRT2, (1 + Math.sqrt(5)) / 2, Math.log(2)),
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ min: 1, max: 12 }),
            (constant, p, q) => {
                const x = (constant * p) / q;
                const hits = identifyNumber(x);
                if (hits.length === 0) return;
                expect(Math.abs(hits[0].value - x)).toBeLessThan(1e-9 * Math.max(1, Math.abs(x)));
            },
        ), { numRuns: 300 });
    });

    it('どんな数を渡しても throw しない', () => {
        fc.assert(fc.property(
            fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
            (x) => {
                expect(() => identifyNumber(x)).not.toThrow();
            },
        ), { numRuns: 500 });
    });
});
