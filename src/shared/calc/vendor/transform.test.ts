import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
    type NumberTransform,
    cumulativeTransform,
    differenceTransform,
    percentageTransform,
    roundTransform,
    scaleTransform,
    squareMetersToTsubo,
    taxExcludedTransform,
    taxIncludedTransform,
    tsuboToSquareMeters,
    withholdingTax,
    moduloTransform,
    withholdingTransform,
    zScoreTransform,
    SQUARE_METERS_PER_TSUBO,
} from './transform';
import { parseNumbersInText, mapNumbersInText } from './numbers';

/** 変換を数値の配列に当てて、結果の配列を返す。 */
const applyAll = (t: NumberTransform | string, values: number[]): number[] => {
    if (typeof t === 'string') throw new Error(`unexpected error: ${t}`);
    return values.map((v, i) => t.apply(v, i) as number);
};

describe('percentageTransform — 構成比', () => {
    it('合計に対する割合を % で返す', () => {
        expect(applyAll(percentageTransform([25, 25, 50]), [25, 25, 50])).toEqual([25, 25, 50]);
        expect(applyAll(percentageTransform([1, 3]), [1, 3])).toEqual([25, 75]);
    });

    it('負数が混ざっていても合計を基準にする', () => {
        expect(applyAll(percentageTransform([-10, 30]), [-10, 30])).toEqual([-50, 150]);
    });

    it('合計が 0 なら断る（全項目が 0 除算になる）', () => {
        expect(percentageTransform([10, -10])).toBe('the numbers add up to zero, so there is no share to compute');
    });

    it('数値が無ければ断る', () => {
        expect(typeof percentageTransform([])).toBe('string');
    });

    it('構成比の合計は 100 になる', () => {
        fc.assert(fc.property(
            fc.array(fc.integer({ min: 1, max: 100000 }), { minLength: 1, maxLength: 30 }),
            (values) => {
                const shares = applyAll(percentageTransform(values), values);
                expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6);
            },
        ), { numRuns: 300 });
    });
});

describe('differenceTransform — 階差', () => {
    it('前の値との差を返し、先頭は 0', () => {
        expect(applyAll(differenceTransform([10, 15, 12]), [10, 15, 12])).toEqual([0, 5, -3]);
    });

    it('列の長さを変えない（隣の列と行がずれないため）', () => {
        const values = [1, 2, 4, 8];
        expect(applyAll(differenceTransform(values), values)).toHaveLength(values.length);
    });

    it('2 つ未満なら断る', () => {
        expect(differenceTransform([5])).toBe('at least two numbers are needed for differences');
    });

    it('階差の合計は 最後 - 最初 に等しい', () => {
        fc.assert(fc.property(
            fc.array(fc.integer({ min: -9999, max: 9999 }), { minLength: 2, maxLength: 30 }),
            (values) => {
                const diffs = applyAll(differenceTransform(values), values);
                const total = diffs.reduce((a, b) => a + b, 0);
                expect(total).toBeCloseTo(values[values.length - 1] - values[0], 6);
            },
        ), { numRuns: 300 });
    });
});

describe('transform — 個数の境目', () => {
    it('階差は 2 個から、累積和は 1 個から', () => {
        expect(differenceTransform([5])).toBe('at least two numbers are needed for differences');
        expect(applyAll(differenceTransform([5, 8]), [5, 8])).toEqual([0, 3]);
        expect(applyAll(cumulativeTransform([5]), [5])).toEqual([5]);
        expect(cumulativeTransform([])).toBe('no numbers to transform');
    });

    it('構成比は 1 個でも成り立つ（その 1 つが 100%）', () => {
        expect(applyAll(percentageTransform([42]), [42])).toEqual([100]);
        expect(percentageTransform([])).toBe('no numbers to transform');
    });

    it('標準化は 2 個の異なる値から', () => {
        // 1 個だとばらつきが 0 になり、割る数が無い。
        expect(zScoreTransform([42])).toBe('every number is the same, so there is no spread to divide by');
        expect(applyAll(zScoreTransform([1, 3]), [1, 3])).toEqual([-0.7071067811865475, 0.7071067811865475]);
    });
});

describe('cumulativeTransform — 累積和', () => {
    it('先頭からの合計を返す', () => {
        expect(applyAll(cumulativeTransform([1, 2, 3, 4]), [1, 2, 3, 4])).toEqual([1, 3, 6, 10]);
    });

    it('最後の値は合計に一致する', () => {
        fc.assert(fc.property(
            fc.array(fc.integer({ min: -9999, max: 9999 }), { minLength: 1, maxLength: 30 }),
            (values) => {
                const sums = applyAll(cumulativeTransform(values), values);
                expect(sums[sums.length - 1]).toBeCloseTo(values.reduce((a, b) => a + b, 0), 6);
            },
        ), { numRuns: 300 });
    });

    it('累積和の階差は元の列に戻る', () => {
        fc.assert(fc.property(
            fc.array(fc.integer({ min: -999, max: 999 }), { minLength: 2, maxLength: 20 }),
            (values) => {
                const sums = applyAll(cumulativeTransform(values), values);
                const back = applyAll(differenceTransform(sums), sums);
                // 階差の先頭は 0 ではなく元の先頭の値なので、そこだけ入れ替えて比べる。
                expect([values[0], ...back.slice(1)]).toEqual(values);
            },
        ), { numRuns: 300 });
    });
});

describe('zScoreTransform — 標準化', () => {
    it('平均 0・標準偏差 1 に直す', () => {
        const values = [2, 4, 4, 4, 5, 5, 7, 9];
        const z = applyAll(zScoreTransform(values), values);
        const mean = z.reduce((a, b) => a + b, 0) / z.length;
        expect(mean).toBeCloseTo(0, 9);
    });

    it('全部同じ値なら断る（割る数が 0 になる）', () => {
        expect(zScoreTransform([3, 3, 3])).toBe('every number is the same, so there is no spread to divide by');
    });
});

describe('roundTransform — 丸め', () => {
    it('桁数どおりに丸める', () => {
        expect(applyAll(roundTransform(0), [1.4, 1.5, -1.5])).toEqual([1, 2, -1]);
        expect(applyAll(roundTransform(2), [3.14159, 2.71828])).toEqual([3.14, 2.72]);
    });

    it('桁数の範囲外は断る', () => {
        expect(roundTransform(-1)).toBe('digits must be between 0 and 15');
        expect(roundTransform(16)).toBe('digits must be between 0 and 15');
        expect(roundTransform(1.5)).toBe('digits must be between 0 and 15');
    });
});

describe('scaleTransform — 倍率', () => {
    it('すべての値に同じ数を掛ける', () => {
        expect(applyAll(scaleTransform(2.5), [2, 4])).toEqual([5, 10]);
        expect(applyAll(scaleTransform(-1), [3, -3])).toEqual([-3, 3]);
    });

    it('有限でない倍率は断る', () => {
        expect(scaleTransform(Infinity)).toBe('the factor must be a finite number');
        expect(scaleTransform(NaN)).toBe('the factor must be a finite number');
    });
});

describe('坪と平方メートル', () => {
    it('1 坪は 400/121 平方メートル', () => {
        expect(SQUARE_METERS_PER_TSUBO).toBeCloseTo(3.305785, 6);
        expect(applyAll(tsuboToSquareMeters(), [1])[0]).toBeCloseTo(3.305785, 6);
        expect(applyAll(squareMetersToTsubo(), [3.305785])[0]).toBeCloseTo(1, 6);
    });

    it('往復すると元に戻る', () => {
        fc.assert(fc.property(fc.integer({ min: 1, max: 100000 }), (sqm) => {
            const tsubo = applyAll(squareMetersToTsubo(), [sqm])[0];
            expect(applyAll(tsuboToSquareMeters(), [tsubo])[0]).toBeCloseTo(sqm, 6);
        }), { numRuns: 300 });
    });
});

describe('消費税', () => {
    it('税抜から税込へ（端数切り捨て）', () => {
        expect(applyAll(taxIncludedTransform(10), [100, 1080, 999])).toEqual([110, 1188, 1098]);
        expect(applyAll(taxIncludedTransform(8), [100])).toEqual([108]);
    });

    it('税込から税抜へ（端数切り捨て）', () => {
        // 1.1 で割る書き方だと 110 / 1.1 が 99.99999999999999 になり、切り捨てで 1 円ずれる。
        expect(applyAll(taxExcludedTransform(10), [110, 1188, 100000000])).toEqual([100, 1080, 90909090]);
        expect(applyAll(taxExcludedTransform(8), [108])).toEqual([100]);
    });

    it('税率 0 は素通し', () => {
        expect(applyAll(taxIncludedTransform(0), [123])).toEqual([123]);
    });

    it('範囲外の税率は断る', () => {
        expect(taxIncludedTransform(-1)).toBe('the tax rate must be between 0 and 100');
        expect(taxExcludedTransform(100)).toBe('the tax rate must be between 0 and 100');
    });

    it('税込にしてから税抜に戻すと、切り捨ての分だけ小さくなるが元を超えない', () => {
        fc.assert(fc.property(fc.integer({ min: 1, max: 10000000 }), (amount) => {
            const included = applyAll(taxIncludedTransform(10), [amount])[0];
            const back = applyAll(taxExcludedTransform(10), [included])[0];
            expect(back).toBeLessThanOrEqual(amount);
            expect(amount - back).toBeLessThanOrEqual(1);
        }), { numRuns: 300 });
    });
});

describe('源泉徴収', () => {
    it('100 万円までは 10.21%', () => {
        expect(withholdingTax(100000)).toBe(10210);
        expect(withholdingTax(1000000)).toBe(102100);
    });

    it('100 万円を超えた部分だけが 20.42%', () => {
        // 全額に高い税率が掛かるわけではない (段階税率)。
        expect(withholdingTax(1100000)).toBe(102100 + 20420);
        expect(withholdingTax(2000000)).toBe(102100 + 204200);
    });

    it('0 以下は 0', () => {
        expect(withholdingTax(0)).toBe(0);
        expect(withholdingTax(-500)).toBe(0);
    });

    it('境界の前後で税額が飛ばない（連続している）', () => {
        const just = withholdingTax(1000000);
        const over = withholdingTax(1000001);
        expect(over - just).toBeLessThanOrEqual(1);
    });

    it('報酬が増えれば税額も減らない（単調）', () => {
        fc.assert(fc.property(
            fc.integer({ min: 0, max: 5000000 }),
            fc.integer({ min: 0, max: 5000000 }),
            (a, b) => {
                const [low, high] = a <= b ? [a, b] : [b, a];
                expect(withholdingTax(high)).toBeGreaterThanOrEqual(withholdingTax(low));
            },
        ), { numRuns: 300 });
    });

    it('変換として各金額を税額に置き換える', () => {
        expect(applyAll(withholdingTransform(), [100000, 1100000])).toEqual([10210, 122520]);
    });
});

describe('変換をテキストへ当てる — 地の文は変わらない', () => {
    it('構成比への書き換えで、周りの文字はそのまま残る', () => {
        const text = 'A 1 / B 3';
        const values = parseNumbersInText(text);
        const result = mapNumbersInText(text, (percentageTransform(values) as NumberTransform).apply);
        expect(result.text).toBe('A 25 / B 75');
        expect(result.changed).toBe(2);
    });

    it('丸めで値が変わらなければ changed に数えない', () => {
        const result = mapNumbersInText('10 20', (roundTransform(0) as NumberTransform).apply);
        expect(result).toMatchObject({ text: '10 20', changed: 0 });
    });
});

describe('moduloTransform — 法で割った余り', () => {
    it('余りは 0 以上 m 未満（最小非負剰余）', () => {
        expect(applyAll(moduloTransform(3), [0, 1, 2, 3, 4, 5])).toEqual([0, 1, 2, 0, 1, 2]);
    });

    it('負の数も 0 以上に寄せる', () => {
        // JS の % は符号を残して -7 % 3 = -1 を返す。整数論では 2 が正しい。
        expect(applyAll(moduloTransform(3), [-7, -3, -1])).toEqual([2, 0, 2]);
    });

    it('小数は書き換えない', () => {
        const t = moduloTransform(3);
        expect(typeof t === 'string' ? null : t.apply(1.5, 0)).toBeNull();
    });

    it('法は 2 以上の整数', () => {
        expect(moduloTransform(1)).toBe('the modulus must be a whole number of 2 or more');
        expect(moduloTransform(0)).toBe('the modulus must be a whole number of 2 or more');
        expect(moduloTransform(2.5)).toBe('the modulus must be a whole number of 2 or more');
    });

    it('元の数との差は必ず法の倍数', () => {
        fc.assert(fc.property(
            fc.integer({ min: -1000000, max: 1000000 }),
            fc.integer({ min: 2, max: 1000 }),
            (value, m) => {
                const t = moduloTransform(m);
                const residue = typeof t === 'string' ? null : t.apply(value, 0)!;
                expect(residue).toBeGreaterThanOrEqual(0);
                expect(residue).toBeLessThan(m);
                // 負の側では余りが -0 になるため、絶対値で見る (Object.is は -0 と 0 を区別する)。
                expect(Math.abs((value - residue!) % m)).toBe(0);
            },
        ), { numRuns: 500 });
    });
});
