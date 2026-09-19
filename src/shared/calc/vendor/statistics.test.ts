import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { CALC_METRICS, statisticsReport, summarize, summaryLine } from './statistics';
import { parseNumbersInText } from './numbers';

/** 成功を前提に要約を取り出す。 */
const stats = (values: number[]) => summarize(values)!;

describe('summarize — 基本の要約', () => {
    it('教科書どおりの並びで、すべての項目が合う', () => {
        // 2, 4, 4, 4, 5, 5, 7, 9 は母標準偏差 2 / 標本標準偏差 √(32/7) の定番の例。
        const s = stats([2, 4, 4, 4, 5, 5, 7, 9]);
        expect(s.count).toBe(8);
        expect(s.sum).toBe(40);
        expect(s.mean).toBe(5);
        expect(s.min).toBe(2);
        expect(s.max).toBe(9);
        expect(s.range).toBe(7);
        expect(s.populationVariance).toBe(4);
        expect(s.populationStdev).toBe(2);
        expect(s.variance).toBeCloseTo(32 / 7, 12);
        expect(s.stdev).toBeCloseTo(Math.sqrt(32 / 7), 12);
    });

    it('中央値は奇数個なら真ん中、偶数個なら中央 2 つの平均', () => {
        expect(stats([3, 1, 2]).median).toBe(2);
        expect(stats([4, 1, 3, 2]).median).toBe(2.5);
        expect(stats([7]).median).toBe(7);
    });

    it('四分位数は線形補間（表計算の PERCENTILE.INC と同じ流儀）', () => {
        const s = stats([1, 2, 3, 4]);
        expect(s.q1).toBe(1.75);
        expect(s.median).toBe(2.5);
        expect(s.q3).toBe(3.25);
    });

    it('入力の順番は結果を変えない（内部で並べ替えている）', () => {
        const asc = stats([1, 2, 3, 4, 5]);
        const shuffled = stats([4, 1, 5, 3, 2]);
        expect(shuffled).toEqual(asc);
    });

    it('元の配列を並べ替えない（呼び出し側の値を壊さない）', () => {
        const input = [3, 1, 2];
        summarize(input);
        expect(input).toEqual([3, 1, 2]);
    });

    it('1 個だけなら、ばらつきは 0 で範囲も 0', () => {
        const s = stats([42]);
        expect(s).toMatchObject({
            count: 1, sum: 42, mean: 42, median: 42, min: 42, max: 42, range: 0,
            variance: 0, stdev: 0, populationVariance: 0, populationStdev: 0, q1: 42, q3: 42,
            product: 42, mode: null,
        });
    });

    it('空なら null（呼び出し側が「数値なし」と言えるように）', () => {
        expect(summarize([])).toBeNull();
    });
});

describe('summarize — 積と最頻値', () => {
    it('積はすべてを掛け合わせた値', () => {
        expect(stats([2, 3, 4]).product).toBe(24);
        expect(stats([1.5, 2]).product).toBe(3);
        expect(stats([7]).product).toBe(7);
    });

    it('0 が混ざれば積は 0、負数の個数で符号が決まる', () => {
        expect(stats([5, 0, 3]).product).toBe(0);
        expect(stats([-2, 3]).product).toBe(-6);
        expect(stats([-2, -3]).product).toBe(6);
    });

    it('最頻値はいちばん多く出た値', () => {
        expect(stats([1, 2, 2, 3]).mode).toBe(2);
        expect(stats([4, 4, 4, 5, 5]).mode).toBe(4);
        expect(stats([1.5, 1.5, 2]).mode).toBe(1.5);
    });

    it('同数のときは先に出たほうを採る（Excel の MODE.SNGL と同じ）', () => {
        expect(stats([2, 2, 1, 1]).mode).toBe(2);
        expect(stats([1, 1, 2, 2]).mode).toBe(1);
    });

    it('どれも 1 回ずつなら最頻値は無い（Excel が #N/A を返すのと同じ）', () => {
        // 「無理に何かを返す」より「無い」と言うほうが役に立つ。
        expect(stats([1, 2, 3]).mode).toBeNull();
        expect(stats([42]).mode).toBeNull();
    });

    it('積は掛け合わせた結果と一致し、最頻値は必ず元の列に含まれる', () => {
        fc.assert(fc.property(
            fc.array(fc.integer({ min: -20, max: 20 }), { minLength: 1, maxLength: 15 }),
            (values) => {
                const s = summarize(values)!;
                expect(s.product).toBe(values.reduce((a, b) => a * b, 1));
                if (s.mode !== null) expect(values).toContain(s.mode);
            },
        ), { numRuns: 300 });
    });
});

describe('summarize — 小数と負数', () => {
    it('小数の要約', () => {
        const s = stats([1.5, 2.5, 3.5]);
        expect(s.sum).toBe(7.5);
        expect(s.mean).toBe(2.5);
        expect(s.median).toBe(2.5);
        expect(s.populationVariance).toBeCloseTo(2 / 3, 12);
    });

    it('負数を含む要約', () => {
        const s = stats([-10, 0, 10]);
        expect(s).toMatchObject({ sum: 0, mean: 0, median: 0, min: -10, max: 10, range: 20 });
        expect(s.populationVariance).toBeCloseTo(200 / 3, 12);
    });

    it('すべて負でも min / max が入れ替わらない', () => {
        const s = stats([-1, -5, -3]);
        expect(s.min).toBe(-5);
        expect(s.max).toBe(-1);
        expect(s.range).toBe(4);
    });

    it('すべて同じ値ならばらつきは 0', () => {
        const s = stats([2.5, 2.5, 2.5]);
        expect(s.variance).toBe(0);
        expect(s.stdev).toBe(0);
    });
});

describe('summarize — 桁落ち', () => {
    it('大きな値に小さなばらつきが乗っていても、分散が負にならない', () => {
        // E[x^2] - E[x]^2 の 1 パス式だと、この並びで負の分散 (有り得ない値) が出る。
        // 2 パスで求めていることを、この 1 件が見張る。
        const s = stats([1000000001, 1000000002, 1000000003]);
        expect(s.populationVariance).toBeCloseTo(2 / 3, 9);
        expect(s.variance).toBeCloseTo(1, 9);
        expect(s.stdev).toBeCloseTo(1, 9);
    });

    it('どんな並びでも分散は 0 以上', () => {
        fc.assert(fc.property(
            fc.array(fc.double({ min: -1e9, max: 1e9, noNaN: true, noDefaultInfinity: true }),
                { minLength: 1, maxLength: 50 }),
            (values) => {
                const s = summarize(values)!;
                expect(s.variance).toBeGreaterThanOrEqual(0);
                expect(s.populationVariance).toBeGreaterThanOrEqual(0);
                expect(Number.isNaN(s.stdev)).toBe(false);
            },
        ), { numRuns: 300 });
    });
});

describe('summarize — 表計算と同じ答えになるか', () => {
    // 2, 4, 4, 4, 5, 5, 7, 9 を Excel に入れたときの答え。
    // SUM 40 / AVERAGE 5 / MEDIAN 4.5 / MAX 9 / MIN 2 / COUNT 8 / PRODUCT 201600
    // VAR.S 4.571428571 / STDEV.S 2.138089935 / VAR.P 4 / STDEV.P 2 / MODE.SNGL 4
    // QUARTILE.INC(,1) 4 / QUARTILE.INC(,3) 5.5
    const SAMPLE = [2, 4, 4, 4, 5, 5, 7, 9];

    it('基本の関数がひととおり一致する', () => {
        const s = stats(SAMPLE);
        expect(s.sum).toBe(40);
        expect(s.mean).toBe(5);
        expect(s.median).toBe(4.5);
        expect(s.max).toBe(9);
        expect(s.min).toBe(2);
        expect(s.count).toBe(8);
        expect(s.product).toBe(201600);
        expect(s.mode).toBe(4);
    });

    it('ばらつきの 4 つが一致する', () => {
        const s = stats(SAMPLE);
        expect(s.variance).toBeCloseTo(4.571428571, 9);
        expect(s.stdev).toBeCloseTo(2.138089935, 9);
        expect(s.populationVariance).toBe(4);
        expect(s.populationStdev).toBe(2);
    });

    it('四分位数が一致する（PERCENTILE.INC と同じ流儀）', () => {
        const s = stats(SAMPLE);
        expect(s.q1).toBe(4);
        expect(s.q3).toBe(5.5);
    });

    it('最大・最小・個数は素朴な計算と必ず一致する', () => {
        fc.assert(fc.property(
            fc.array(fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }).map((v) => v + 0),
                { minLength: 1, maxLength: 40 }),
            (values) => {
                const s = summarize(values)!;
                expect(s.max).toBe(Math.max(...values));
                expect(s.min).toBe(Math.min(...values));
                expect(s.count).toBe(values.length);
                expect(s.mean * s.count).toBeCloseTo(s.sum, 6);
                expect(s.range).toBeCloseTo(s.max - s.min, 6);
            },
        ), { numRuns: 300 });
    });

    it('最頻値は数え上げた結果と一致する', () => {
        fc.assert(fc.property(
            fc.array(fc.integer({ min: 0, max: 6 }), { minLength: 1, maxLength: 25 }),
            (values) => {
                const counts = new Map<number, number>();
                for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
                const top = Math.max(...counts.values());
                const s = summarize(values)!;
                if (top === 1) {
                    expect(s.mode).toBeNull();
                } else {
                    expect(counts.get(s.mode!)).toBe(top);
                    // 同数のときは先に出たほうを採る。
                    const firstWithTop = values.find((v) => counts.get(v) === top);
                    expect(s.mode).toBe(firstWithTop);
                }
            },
        ), { numRuns: 300 });
    });
});

describe('summarize — 極端な値', () => {
    it('積が桁溢れしたら Infinity のまま持つ（呼び出し側が断れるように）', () => {
        expect(stats([1e300, 1e300]).product).toBe(Infinity);
        expect(stats([-1e300, 1e300]).product).toBe(-Infinity);
    });

    it('積が小さすぎて表せなければ 0 になる（Excel の PRODUCT と同じ）', () => {
        expect(stats([1e-300, 1e-300]).product).toBe(0);
    });

    it('0 と -0 は同じ値として数える', () => {
        const s = stats([0, -0, 1]);
        expect(s.mode).toBe(0);
        expect(s.count).toBe(3);
    });

    it('同じ値だけの列では、最頻値がその値になり、ばらつきは 0', () => {
        const s = stats([3, 3, 3, 3]);
        expect(s.mode).toBe(3);
        expect(s.variance).toBe(0);
        expect(s.product).toBe(81);
    });
});

describe('summarize — 性質', () => {
    const valuesArb = fc.array(
        fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }).map((v) => v + 0),
        { minLength: 1, maxLength: 40 },
    );

    it('min <= q1 <= median <= q3 <= max', () => {
        fc.assert(fc.property(valuesArb, (values) => {
            const s = summarize(values)!;
            expect(s.min).toBeLessThanOrEqual(s.q1);
            expect(s.q1).toBeLessThanOrEqual(s.median);
            expect(s.median).toBeLessThanOrEqual(s.q3);
            expect(s.q3).toBeLessThanOrEqual(s.max);
        }), { numRuns: 300 });
    });

    it('平均は最小と最大の間にある', () => {
        fc.assert(fc.property(valuesArb, (values) => {
            const s = summarize(values)!;
            expect(s.mean).toBeGreaterThanOrEqual(s.min);
            expect(s.mean).toBeLessThanOrEqual(s.max);
        }), { numRuns: 300 });
    });

    it('全体を定数倍すると、合計と平均も同じ倍率になる', () => {
        fc.assert(fc.property(valuesArb, fc.integer({ min: -20, max: 20 }), (values, k) => {
            const base = summarize(values)!;
            const scaled = summarize(values.map((v) => v * k))!;
            expect(scaled.sum).toBeCloseTo(base.sum * k, 6);
            expect(scaled.mean).toBeCloseTo(base.mean * k, 6);
            // 標準偏差は倍率の絶対値だけ伸びる。
            expect(scaled.stdev).toBeCloseTo(base.stdev * Math.abs(k), 6);
        }), { numRuns: 200 });
    });

    it('全体を平行移動しても、ばらつきは変わらない', () => {
        fc.assert(fc.property(valuesArb, fc.integer({ min: -1000, max: 1000 }), (values, shift) => {
            const base = summarize(values)!;
            const moved = summarize(values.map((v) => v + shift))!;
            expect(moved.stdev).toBeCloseTo(base.stdev, 6);
            expect(moved.range).toBeCloseTo(base.range, 6);
            expect(moved.mean).toBeCloseTo(base.mean + shift, 6);
        }), { numRuns: 200 });
    });

    it('標本のばらつきは母集団のばらつき以上（n-1 で割るため）', () => {
        fc.assert(fc.property(valuesArb, (values) => {
            const s = summarize(values)!;
            expect(s.variance).toBeGreaterThanOrEqual(s.populationVariance - 1e-9);
        }), { numRuns: 300 });
    });
});

describe('summaryLine / statisticsReport — 見せ方', () => {
    it('エコー行は合計・件数・平均の 1 行', () => {
        expect(summaryLine(stats([100, 250, 700]))).toBe('Sum: 1,050 (3 numbers, mean 350)');
    });

    it('エコー行の桁区切りは合計にも平均にも掛かる', () => {
        expect(summaryLine(stats([1000000, 3000000]))).toBe('Sum: 4,000,000 (2 numbers, mean 2,000,000)');
    });

    it('レポートは項目名を桁で揃え、値は区切りなしで出す（そのまま再計算に使える）', () => {
        const report = statisticsReport(stats([2, 4, 4, 4, 5, 5, 7, 9]));
        const lines = report.trimEnd().split('\n');
        expect(lines).toHaveLength(14);
        expect(lines[0].startsWith('Count ')).toBe(true);
        // 値の開始位置が全行でそろっている（項目名を最長のものに合わせて詰めている）。
        expect(new Set(lines.map((l) => l.search(/ {2}\S+$/)))).toHaveProperty('size', 1);
        expect(report).toContain('Std deviation (population)  2');
        // 桁区切りが混ざるとコピーして計算し直せない。
        expect(report).not.toContain(',');
    });

    it('レポートの数値は小数のノイズを見せない', () => {
        const report = statisticsReport(stats(parseNumbersInText('0.1 0.2')));
        const sumLine = report.split('\n').find((l) => l.startsWith('Sum '))!;
        expect(sumLine.trim().split(/ {2,}/)[1]).toBe('0.3');
        expect(report).not.toContain('0.30000000000000004');
    });

    it('1 個だけでもレポートは同じ行数で出る', () => {
        expect(statisticsReport(stats([1])).trimEnd().split('\n')).toHaveLength(14);
    });

    it('1 個だけの列では、標本のばらつきを - と書く', () => {
        // VAR.S / STDEV.S は 1 個では定まらない (Excel も #DIV/0!)。0 と書くと
        // 「ばらつきが無い」と読めてしまう。母集団のほうは 1 個でも 0 で正しい。
        const report = statisticsReport(stats([42]));
        expect(report).toMatch(/Variance \(sample\) +-/);
        expect(report).toMatch(/Std deviation \(sample\) +-/);
        expect(report).toMatch(/Variance \(population\) +0/);
    });

    it('レポートに最頻値の行がある（無いときは - と書く）', () => {
        expect(statisticsReport(stats([4, 4, 5]))).toContain('Mode');
        expect(statisticsReport(stats([4, 4, 5]))).toMatch(/Mode +4/);
        expect(statisticsReport(stats([1, 2, 3]))).toMatch(/Mode +-/);
    });
});

describe('CALC_METRICS — 一覧とコマンドの元になる表', () => {
    const stats = summarize([2, 4, 4, 4, 5, 5, 7, 9])!;

    it('一覧の行は、表で reportLabel を持つ項目とちょうど同じ', () => {
        // 一覧を表から作っているので、片方だけ増える・名前が食い違うことが起きない。
        const expected = CALC_METRICS.filter((m) => m.reportLabel).map((m) => m.reportLabel);
        const rows = statisticsReport(stats).trimEnd().split('\n').map((line) => line.trim().replace(/ {2,}.*$/, ''));
        expect(rows).toEqual(expected);
    });

    it('一覧の各行の値は、表の pick が返す値と一致する', () => {
        const lines = statisticsReport(stats).trimEnd().split('\n');
        CALC_METRICS.filter((m) => m.reportLabel).forEach((metric, i) => {
            const value = metric.pick(stats);
            const written = lines[i].trim().replace(/^.*? {2,}/, '');
            expect(written).toBe(value === null ? '-' : String(Number(value.toPrecision(12))));
        });
    });

    it('コマンドを持つ項目には id と説明がそろっている', () => {
        for (const metric of CALC_METRICS.filter((m) => m.command)) {
            expect(metric.command!.id).toMatch(/^calc-[a-z-]+-region$/);
            expect(metric.command!.description.length).toBeGreaterThan(10);
            expect(metric.label.length).toBeGreaterThan(0);
        }
    });

    it('値が定まらないことがある項目には、その理由が添えてある', () => {
        // missing が無いまま null を返すと、エコー行が「理由の無い拒否」になる。
        const single = summarize([42])!;
        for (const metric of CALC_METRICS) {
            if (metric.pick(single) === null) expect(metric.missing).toBeTruthy();
        }
    });

    it('積だけは一覧に出さない（桁が跳ねて要約として読めないため）', () => {
        const product = CALC_METRICS.find((m) => m.label === 'Product')!;
        expect(product.reportLabel).toBeUndefined();
        expect(product.command).toBeTruthy();
        expect(statisticsReport(stats)).not.toContain('Product');
    });

    it('表の中で名前も id も重複しない', () => {
        const labels = CALC_METRICS.map((m) => m.label);
        expect(new Set(labels).size).toBe(labels.length);
        const ids = CALC_METRICS.filter((m) => m.command).map((m) => m.command!.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});
