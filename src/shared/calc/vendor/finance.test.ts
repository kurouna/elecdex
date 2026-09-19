import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { cagr, financeFailed, loanSummary, maxDrawdown, returnSummary, volatility } from './finance';

/** 成功を前提に取り出す（失敗ならメッセージを見せて落とす）。 */
function ok<T>(result: T | string): T {
    if (typeof result === 'string') throw new Error(`unexpected error: ${result}`);
    return result;
}

describe('returnSummary — 収益率', () => {
    it('期ごとの収益率と通算収益率', () => {
        const s = ok(returnSummary([100, 110, 121]));
        expect(s.returns[0]).toBeCloseTo(0.1, 12);
        expect(s.returns[1]).toBeCloseTo(0.1, 12);
        expect(s.total).toBeCloseTo(0.21, 12);
        expect(s.periods).toBe(2);
    });

    it('期あたりの平均は相乗平均（単純平均ではない）', () => {
        // +50% のあと -50% は、単純平均だと 0% に見えるが実際は 25% の損。
        const s = ok(returnSummary([100, 150, 75]));
        expect(s.total).toBeCloseTo(-0.25, 12);
        expect(s.perPeriod).toBeCloseTo(Math.sqrt(0.75) - 1, 12);
        expect(s.perPeriod).toBeLessThan(0);
    });

    it('値下がりも扱う', () => {
        const s = ok(returnSummary([200, 100]));
        expect(s.total).toBeCloseTo(-0.5, 12);
    });

    it('2 つ未満、0 以下の価格は断る', () => {
        expect(returnSummary([100])).toBe('at least two prices are needed');
        expect(returnSummary([100, 0])).toBe('prices must all be greater than zero');
        expect(returnSummary([-1, 100])).toBe('prices must all be greater than zero');
    });

    it('期ごとの収益率を掛け合わせると通算収益率に一致する', () => {
        fc.assert(fc.property(
            fc.array(fc.integer({ min: 1, max: 100000 }), { minLength: 2, maxLength: 20 }),
            (prices) => {
                const s = ok(returnSummary(prices));
                const compounded = s.returns.reduce((acc, r) => acc * (1 + r), 1) - 1;
                expect(compounded).toBeCloseTo(s.total, 6);
            },
        ), { numRuns: 300 });
    });
});

describe('cagr — 年平均成長率', () => {
    it('倍になるまでの成長率', () => {
        expect(ok(cagr(100, 200, 1))).toBeCloseTo(1, 12);
        expect(ok(cagr(100, 121, 2))).toBeCloseTo(0.1, 12);
    });

    it('0 以下の値と期間は断る', () => {
        expect(cagr(0, 100, 1)).toBe('the first and last values must be greater than zero');
        expect(cagr(100, 100, 0)).toBe('the number of periods must be positive');
    });

    it('成長率を期間ぶん複利で伸ばすと最後の値に戻る', () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 100000 }),
            fc.integer({ min: 1, max: 100000 }),
            fc.integer({ min: 1, max: 50 }),
            (first, last, periods) => {
                const rate = ok(cagr(first, last, periods));
                expect(first * Math.pow(1 + rate, periods)).toBeCloseTo(last, 3);
            },
        ), { numRuns: 300 });
    });
});

describe('volatility — ばらつき', () => {
    it('一定の伸び方ならボラティリティは 0', () => {
        expect(ok(volatility([100, 110, 121, 133.1]))).toBeCloseTo(0, 9);
    });

    it('揺れが大きいほど値も大きい', () => {
        const calm = ok(volatility([100, 101, 102, 103]));
        const wild = ok(volatility([100, 130, 90, 140]));
        expect(wild).toBeGreaterThan(calm);
    });

    it('価格が足りなければ断る', () => {
        expect(volatility([100])).toBe('at least two prices are needed');
    });
});

describe('finance — 個数の境目', () => {
    it('収益率は価格 2 個から', () => {
        expect(returnSummary([100])).toBe('at least two prices are needed');
        expect(ok(returnSummary([100, 110])).periods).toBe(1);
    });

    it('ボラティリティは価格 3 個から', () => {
        // 価格 2 個だと収益率が 1 個しか作れず、標本の散らばりは定まらない。
        // ここで 0 を返すと「値動きが無い」と読めてしまう。
        expect(volatility([100, 110])).toBe('at least three prices are needed for a volatility');
        expect(ok(volatility([100, 110, 121]))).toBeCloseTo(0, 9);
    });

    it('最大ドローダウンは価格 2 個から', () => {
        expect(maxDrawdown([100])).toBe('at least two prices are needed');
        expect(ok(maxDrawdown([100, 50])).depth).toBeCloseTo(0.5, 12);
    });

    it('ローンは 1 か月から成り立つ', () => {
        expect(loanSummary(120000, 0, 1 / 12)).toMatchObject({ months: 1, monthly: 120000 });
        // 期間は月に丸めるので、半月 (1/24 年) は 1 か月として扱う。
        expect(loanSummary(120000, 0, 1 / 24)).toMatchObject({ months: 1 });
        // 丸めて 0 か月になる期間は断る。
        expect(loanSummary(120000, 0, 1 / 48)).toBe('the term must cover at least one month');
    });
});

describe('maxDrawdown — 最大ドローダウン', () => {
    it('山からの最大下落率と、その区間', () => {
        const d = ok(maxDrawdown([100, 120, 60, 80]));
        expect(d.depth).toBeCloseTo(0.5, 12);
        expect(d.peak).toBe(120);
        expect(d.peakIndex).toBe(1);
        expect(d.trough).toBe(60);
        expect(d.troughIndex).toBe(2);
    });

    it('あとから浅い下落が来ても、いちばん深いものを採る', () => {
        // 100 → 50 で 50%、200 → 150 で 25%。深いほうが残る。
        const d = ok(maxDrawdown([100, 50, 200, 150]));
        expect(d.depth).toBeCloseTo(0.5, 12);
        expect(d.peak).toBe(100);
        expect(d.trough).toBe(50);
    });

    it('あとから来た下落のほうが深ければ、そちらを採る', () => {
        const d = ok(maxDrawdown([100, 90, 200, 100]));
        expect(d.depth).toBeCloseTo(0.5, 12);
        expect(d.peak).toBe(200);
        expect(d.peakIndex).toBe(2);
        expect(d.trough).toBe(100);
        expect(d.troughIndex).toBe(3);
    });

    it('山は「その時点までの最高値」で、あとから来た高値は前の谷に影響しない', () => {
        // 120 → 60 の下落は、そのあと 300 まで上がっても 50% のまま。
        const d = ok(maxDrawdown([100, 120, 60, 300, 280]));
        expect(d.peak).toBe(120);
        expect(d.trough).toBe(60);
        expect(d.depth).toBeCloseTo(0.5, 12);
    });

    it('上がり続ける列では 0', () => {
        expect(ok(maxDrawdown([1, 2, 3, 4])).depth).toBe(0);
    });

    it('下落率は 0 以上 1 未満（価格が正である限り 100% は割らない）', () => {
        fc.assert(fc.property(
            fc.array(fc.integer({ min: 1, max: 100000 }), { minLength: 2, maxLength: 40 }),
            (prices) => {
                const d = ok(maxDrawdown(prices));
                expect(d.depth).toBeGreaterThanOrEqual(0);
                expect(d.depth).toBeLessThan(1);
                expect(d.troughIndex).toBeGreaterThanOrEqual(d.peakIndex);
            },
        ), { numRuns: 300 });
    });
});

describe('loanSummary — 元利均等返済', () => {
    it('教科書どおりの例が合う', () => {
        // 3000 万円 / 年 1.0% / 35 年 → 毎月 84,686 円 (端数切り上げ)。
        const loan = ok(loanSummary(30000000, 1.0, 35));
        expect(loan.months).toBe(420);
        expect(loan.monthly).toBe(84686);
        expect(loan.total).toBe(84686 * 420);
        expect(loan.interest).toBe(loan.total - 30000000);
    });

    it('金利 0 なら等分', () => {
        const loan = ok(loanSummary(1200000, 0, 10));
        expect(loan.monthly).toBe(10000);
        expect(loan.interest).toBe(0);
    });

    it('端数は切り上げる（切り捨てると最終回に不足が出る）', () => {
        const loan = ok(loanSummary(1000000, 0, 3));
        expect(loan.monthly).toBe(Math.ceil(1000000 / 36));
        expect(loan.total).toBeGreaterThanOrEqual(1000000);
    });

    it('条件が不正なら断る', () => {
        expect(loanSummary(0, 1, 35)).toBe('the principal must be greater than zero');
        expect(loanSummary(1000, -1, 35)).toBe('the interest rate must not be negative');
        expect(loanSummary(1000, 1, 0)).toBe('the term must be greater than zero');
    });

    it('金利が高いほど返済額も増え、利息は元本を下回らない条件でも負にならない', () => {
        fc.assert(fc.property(
            fc.integer({ min: 100000, max: 100000000 }),
            fc.integer({ min: 0, max: 15 }),
            fc.integer({ min: 1, max: 50 }),
            (principal, rate, years) => {
                const loan = ok(loanSummary(principal, rate, years));
                expect(loan.monthly).toBeGreaterThan(0);
                expect(loan.interest).toBeGreaterThanOrEqual(0);
                const higher = ok(loanSummary(principal, rate + 1, years));
                expect(higher.monthly).toBeGreaterThanOrEqual(loan.monthly);
            },
        ), { numRuns: 200 });
    });
});

describe('financeFailed — 失敗の見分け', () => {
    it('文字列だけを失敗とみなす', () => {
        expect(financeFailed('nope')).toBe(true);
        expect(financeFailed(0.5)).toBe(false);
    });
});
