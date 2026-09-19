import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { MAX_RANDOM_COUNT, parseRandomSpec, randomFailed, randomNumbers, type RandomSpec } from './random';

/** 解釈に成功する前提で仕様を取り出す (失敗したらそこで落とす)。 */
function spec(input: string): RandomSpec {
    const parsed = parseRandomSpec(input);
    if (randomFailed(parsed)) throw new Error(`unexpected error: ${parsed}`);
    return parsed;
}

/** 範囲として読めなかったときの断り文句。 */
const NOT_A_RANGE = 'give a range like 1..100';

/** 解釈に失敗する前提で理由を取り出す。 */
function reason(input: string): string {
    const parsed = parseRandomSpec(input);
    if (!randomFailed(parsed)) throw new Error(`unexpectedly parsed: ${input}`);
    return parsed;
}

describe('parseRandomSpec', () => {
    it('reads an inclusive integer range', () => {
        expect(spec('1..100')).toEqual({ kind: 'integer', min: 1, max: 100, decimals: 0, label: '1..100' });
    });

    it('reads a bare number as 1..N, so 6 is a die', () => {
        expect(spec('6')).toEqual({ kind: 'integer', min: 1, max: 6, decimals: 0, label: '1..6' });
    });

    it('accepts negative endpoints', () => {
        expect(spec('-5..5')).toMatchObject({ kind: 'integer', min: -5, max: 5 });
    });

    it('accepts a range whose endpoints are equal', () => {
        expect(spec('7..7')).toMatchObject({ kind: 'integer', min: 7, max: 7 });
    });

    it('switches to real numbers when a decimal point is written', () => {
        expect(spec('0.0..1.0')).toEqual({ kind: 'real', min: 0, max: 1, decimals: 1, label: '0.0..1.0' });
    });

    it('takes the number of decimal places from the endpoints', () => {
        expect(spec('0.00..1.00')).toMatchObject({ kind: 'real', decimals: 2 });
        expect(spec('0..1.000')).toMatchObject({ kind: 'real', decimals: 3, min: 0, max: 1 });
    });

    it('accepts a leading dot', () => {
        expect(spec('.5..1.5')).toMatchObject({ kind: 'real', min: 0.5, max: 1.5, decimals: 1 });
    });

    it('ignores spaces around the separator', () => {
        expect(spec('1 .. 10')).toMatchObject({ min: 1, max: 10 });
    });

    it('accepts full-width digits', () => {
        expect(spec('１..１００')).toMatchObject({ min: 1, max: 100 });
    });

    it('normalises the label so the same range comes back when it is read again', () => {
        expect(spec('.5..1.50').label).toBe('0.50..1.50');
        expect(spec(spec('.5..1.50').label)).toMatchObject({ min: 0.5, max: 1.5, decimals: 2 });
    });

    it('refuses an empty range', () => {
        expect(reason('10..1')).toContain('empty');
    });

    it('refuses a bare number below 1, because 1..0 holds nothing', () => {
        expect(reason('0')).toContain('1 or more');
        expect(reason('-3')).toContain('1 or more');
    });

    it('refuses input that is not a range', () => {
        // 「範囲が空」と取り違えないよう、断り文句そのものを見る。
        for (const bad of ['', '   ', 'abc', '1..2..3', '1..', '..9']) {
            expect(reason(bad)).toBe(NOT_A_RANGE);
        }
    });

    it('calls a third dot a typo, not an empty range', () => {
        // 1...2 を素直に切ると 1 と .2 に割れて「範囲が空」と答えてしまう。
        expect(reason('1...2')).toBe(NOT_A_RANGE);
        expect(reason('1...')).toBe(NOT_A_RANGE);
    });

    it('refuses exponent notation, which hides how big the range is', () => {
        expect(reason('1..1e5')).toBe(NOT_A_RANGE);
    });

    it('refuses an integer range wider than exact arithmetic reaches', () => {
        expect(reason('0..99999999999999999999')).toContain('too large');
    });

    it('refuses more decimal places than a double can carry', () => {
        expect(reason('0.00000000000..1.00000000000')).toContain('decimal places');
    });
});

describe('randomNumbers', () => {
    it('returns the low end when the source returns 0', () => {
        expect(randomNumbers(spec('1..100'), 3, () => 0)).toEqual(['1', '1', '1']);
    });

    it('returns the high end when the source approaches 1', () => {
        expect(randomNumbers(spec('1..100'), 2, () => 0.9999999999)).toEqual(['100', '100']);
    });

    it('never leaves the range even if the source returns exactly 1', () => {
        expect(randomNumbers(spec('1..6'), 1, () => 1)).toEqual(['6']);
    });

    it('draws one number per requested count', () => {
        const values = [0, 0.25, 0.5, 0.75, 0.99];
        let i = 0;
        expect(randomNumbers(spec('0..9'), 5, () => values[i++])).toEqual(['0', '2', '5', '7', '9']);
    });

    it('writes real numbers with the requested number of decimal places', () => {
        expect(randomNumbers(spec('0.00..1.00'), 1, () => 0.5)).toEqual(['0.50']);
        expect(randomNumbers(spec('0.0..1.0'), 1, () => 0.5)).toEqual(['0.5']);
    });

    it('handles a negative range', () => {
        expect(randomNumbers(spec('-5..5'), 1, () => 0)).toEqual(['-5']);
        expect(randomNumbers(spec('-5..5'), 1, () => 1)).toEqual(['5']);
    });

    it('returns nothing for a count of zero', () => {
        expect(randomNumbers(spec('1..6'), 0, () => 0.5)).toEqual([]);
    });

    it('caps how many numbers one command can insert', () => {
        expect(MAX_RANDOM_COUNT).toBeGreaterThan(1);
        expect(randomNumbers(spec('1..6'), MAX_RANDOM_COUNT, () => 0.5)).toHaveLength(MAX_RANDOM_COUNT);
    });
});

describe('randomNumbers (property)', () => {
    it('stays inside an integer range whatever the source returns', () => {
        fc.assert(fc.property(
            fc.integer({ min: -1000, max: 1000 }),
            fc.integer({ min: 0, max: 2000 }),
            fc.array(fc.double({ min: 0, max: 1, noNaN: true }), { minLength: 1, maxLength: 20 }),
            (min, width, sources) => {
                const parsed = spec(`${min}..${min + width}`);
                let i = 0;
                const out = randomNumbers(parsed, sources.length, () => sources[i++]);
                for (const text of out) {
                    const value = Number(text);
                    expect(Number.isInteger(value)).toBe(true);
                    expect(value).toBeGreaterThanOrEqual(min);
                    expect(value).toBeLessThanOrEqual(min + width);
                }
            },
        ));
    });

    it('writes every real number with exactly the requested decimal places', () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 6 }),
            fc.array(fc.double({ min: 0, max: 1, noNaN: true }), { minLength: 1, maxLength: 20 }),
            (decimals, sources) => {
                const zeros = '0'.repeat(decimals);
                const parsed = spec(`0.${zeros}..1.${zeros}`);
                let i = 0;
                const out = randomNumbers(parsed, sources.length, () => sources[i++]);
                const shape = new RegExp(`^-?\\d+\\.\\d{${decimals}}$`);
                for (const text of out) {
                    expect(text).toMatch(shape);
                    expect(Number(text)).toBeGreaterThanOrEqual(0);
                    expect(Number(text)).toBeLessThanOrEqual(1);
                }
            },
        ));
    });
});
