import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
    BINOMIAL_STEP_LIMIT,
    bezout,
    binomial,
    classifyPerfection,
    divisorCount,
    divisorSum,
    eulerPhi,
    modularInverse,
    moebius,
    numberTheoryReport,
} from './numbertheory';
import { FACTORIZE_LIMIT, isPrime } from './mathkit';

/** 改行。ソースに直接置かず組み立てる。 */
const LF = String.fromCharCode(10);

function ok<T>(result: T | string): T {
    if (typeof result === 'string') throw new Error(`unexpected error: ${result}`);
    return result;
}

describe('約数の個数と和', () => {
    it('教科書どおりの値', () => {
        expect(ok(divisorCount(12))).toBe(6);      // 1,2,3,4,6,12
        expect(ok(divisorSum(12))).toBe(28);
        expect(ok(divisorCount(360))).toBe(24);
        expect(ok(divisorSum(360))).toBe(1170);
        expect(ok(divisorCount(97))).toBe(2);
    });

    it('1 の約数は 1 つだけ', () => {
        expect(ok(divisorCount(1))).toBe(1);
        expect(ok(divisorSum(1))).toBe(1);
    });

    it('素数の約数は 2 つで、和は n + 1', () => {
        fc.assert(fc.property(fc.integer({ min: 2, max: 100000 }), (n) => {
            if (!isPrime(n)) return;
            expect(ok(divisorCount(n))).toBe(2);
            expect(ok(divisorSum(n))).toBe(n + 1);
        }), { numRuns: 300 });
    });

    it('数え上げた約数と一致する', () => {
        fc.assert(fc.property(fc.integer({ min: 1, max: 20000 }), (n) => {
            let count = 0;
            let sum = 0;
            for (let d = 1; d <= n; d++) if (n % d === 0) { count++; sum += d; }
            expect(ok(divisorCount(n))).toBe(count);
            expect(ok(divisorSum(n))).toBe(sum);
        }), { numRuns: 100 });
    });

    it('正の整数でなければ断る', () => {
        expect(typeof divisorCount(0)).toBe('string');
        expect(typeof divisorSum(-5)).toBe('string');
        expect(typeof divisorCount(1.5)).toBe('string');
    });
});

describe('オイラーの φ 関数', () => {
    it('教科書どおりの値', () => {
        expect(ok(eulerPhi(1))).toBe(1);
        expect(ok(eulerPhi(12))).toBe(4);       // 1,5,7,11
        expect(ok(eulerPhi(97))).toBe(96);
        expect(ok(eulerPhi(360))).toBe(96);
    });

    it('互いに素な数を数えた結果と一致する', () => {
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
        fc.assert(fc.property(fc.integer({ min: 1, max: 3000 }), (n) => {
            let count = 0;
            for (let k = 1; k <= n; k++) if (gcd(n, k) === 1) count++;
            expect(ok(eulerPhi(n))).toBe(count);
        }), { numRuns: 100 });
    });
});

describe('メビウスの μ 関数', () => {
    it('教科書どおりの値', () => {
        expect(ok(moebius(1))).toBe(1);
        expect(ok(moebius(2))).toBe(-1);
        expect(ok(moebius(6))).toBe(1);     // 2 つの素因数
        expect(ok(moebius(30))).toBe(-1);   // 3 つの素因数
        expect(ok(moebius(4))).toBe(0);     // 平方因子あり
        expect(ok(moebius(12))).toBe(0);
    });

    it('値は -1, 0, 1 のいずれか', () => {
        fc.assert(fc.property(fc.integer({ min: 1, max: 100000 }), (n) => {
            expect([-1, 0, 1]).toContain(ok(moebius(n)));
        }), { numRuns: 300 });
    });
});

describe('完全数の判定', () => {
    it('完全数・過剰数・不足数', () => {
        expect(classifyPerfection(6)).toBe('perfect');
        expect(classifyPerfection(28)).toBe('perfect');
        expect(classifyPerfection(496)).toBe('perfect');
        expect(classifyPerfection(12)).toBe('abundant');
        expect(classifyPerfection(8)).toBe('deficient');
        expect(classifyPerfection(97)).toBe('deficient');
    });

    it('正の整数でなければ判定しない', () => {
        expect(classifyPerfection(0)).toBeNull();
        expect(classifyPerfection(-6)).toBeNull();
    });
});

describe('bezout — 拡張ユークリッド', () => {
    it('gcd と、それを作る係数を返す', () => {
        const b = ok(bezout(240, 46));
        expect(b.gcd).toBe(2);
        expect(240 * b.x + 46 * b.y).toBe(2);
    });

    it('互いに素なら gcd は 1', () => {
        const b = ok(bezout(17, 5));
        expect(b.gcd).toBe(1);
        expect(17 * b.x + 5 * b.y).toBe(1);
    });

    it('0 を含む場合', () => {
        expect(ok(bezout(5, 0))).toMatchObject({ gcd: 5 });
        expect(ok(bezout(0, 0))).toMatchObject({ gcd: 0 });
    });

    it('整数でなければ断る', () => {
        expect(typeof bezout(1.5, 2)).toBe('string');
    });

    it('ax + by = gcd(a, b) が常に成り立つ', () => {
        fc.assert(fc.property(
            fc.integer({ min: -100000, max: 100000 }),
            fc.integer({ min: -100000, max: 100000 }),
            (a, b) => {
                const result = ok(bezout(a, b));
                expect(a * result.x + b * result.y).toBe(result.gcd);
                expect(result.gcd).toBeGreaterThanOrEqual(0);
            },
        ), { numRuns: 500 });
    });
});

describe('modularInverse — mod 逆元', () => {
    it('互いに素なら逆元がある', () => {
        expect(ok(modularInverse(3, 7))).toBe(5);      // 3 * 5 = 15 = 1 (mod 7)
        expect(ok(modularInverse(17, 3120))).toBe(2753);
    });

    it('互いに素でなければ逆元は無い', () => {
        expect(modularInverse(4, 8)).toBe('4 and 8 are not coprime, so there is no inverse');
    });

    it('法は 2 以上', () => {
        expect(modularInverse(3, 1)).toBe('the modulus must be a whole number of 2 or more');
        expect(typeof modularInverse(3, 0)).toBe('string');
    });

    it('逆元を掛けると 1 になる', () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 10000 }),
            fc.integer({ min: 2, max: 10000 }),
            (a, m) => {
                const inverse = modularInverse(a, m);
                if (typeof inverse === 'string') return;
                expect(inverse).toBeGreaterThanOrEqual(0);
                expect(inverse).toBeLessThan(m);
                expect((a * inverse) % m).toBe(1 % m);
            },
        ), { numRuns: 500 });
    });
});

describe('binomial — 二項係数', () => {
    it('小さい値', () => {
        expect(ok(binomial(5, 2))).toBe(10n);
        expect(ok(binomial(10, 0))).toBe(1n);
        expect(ok(binomial(10, 10))).toBe(1n);
    });

    it('double では表せない大きさも厳密に返す', () => {
        // 2^53 を超えるので、number で計算すると丸まる。
        expect(ok(binomial(100, 50))).toBe(100891344545564193334812497256n);
        expect(String(ok(binomial(200, 100)))).toHaveLength(59);
    });

    it('範囲外は断る', () => {
        expect(typeof binomial(5, 6)).toBe('string');
        expect(typeof binomial(-1, 0)).toBe('string');
        expect(typeof binomial(5, -1)).toBe('string');
        expect(typeof binomial(1.5, 1)).toBe('string');
    });

    it('対称性と、パスカルの三角形の関係を満たす', () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 60 }),
            fc.integer({ min: 0, max: 60 }),
            (n, k) => {
                if (k > n) return;
                expect(ok(binomial(n, k))).toBe(ok(binomial(n, n - k)));
                if (k >= 1 && k <= n - 1) {
                    expect(ok(binomial(n, k))).toBe(ok(binomial(n - 1, k - 1)) + ok(binomial(n - 1, k)));
                }
            },
        ), { numRuns: 300 });
    });
});

describe('numberTheoryReport — 一覧', () => {
    it('選んだ整数ごとに 1 行ずつ並ぶ', () => {
        const report = numberTheoryReport([12, 28]);
        const lines = report.trimEnd().split('\n');
        // 見出し 1 行 + 2 行。
        expect(lines).toHaveLength(3);
        expect(lines[0]).toContain('n');
        expect(lines[1]).toContain('12');
        expect(lines[2]).toContain('28');
    });

    it('見出しはギリシャ文字の記号を使う', () => {
        expect(numberTheoryReport([6]).split('\n')[0])
            .toMatch(/n\s+factorization\s+τ\s+σ\s+φ\s+μ\s+notes/);
    });

    it('列が桁でそろう（狭いペインでも notes 列が切れない）', () => {
        // notes 列の開始位置が全行で同じ = 右端の情報から先に消えることがない。
        const report = numberTheoryReport([6, 8128]);
        const lines = report.trimEnd().split('\n');
        const starts = lines.map((l) => {
            const header = l.indexOf('notes');
            return header >= 0 ? header : l.search(/(prime|perfect|abundant|deficient)/);
        });
        expect(new Set(starts.filter((i) => i >= 0)).size).toBe(1);
    });

    it('素因数分解・τ・σ・φ・μ と完全数の別が入る', () => {
        const report = numberTheoryReport([28]);
        expect(report).toContain('2^2 * 7');
        expect(report).toContain('perfect');
    });

    it('素数には prime と印がつく', () => {
        expect(numberTheoryReport([97])).toContain('prime');
    });

    it('扱えない値は理由を書いて飛ばさない（行は必ず残る）', () => {
        const report = numberTheoryReport([12, -5, 1.5]);
        expect(report.trimEnd().split('\n')).toHaveLength(4);
    });
});

/**
 * 分解できない大きさと、分解できる中でも素因数を持たない 1。
 *
 * どちらも「答えが無い」ことが答えで、埋めてはいけない。空欄や 0 を置くと、それが値として
 * 読まれる (一覧は縦に並べて比べるためのものなので、1 行が黙って別の意味になると効く)。
 */
describe('numberTheoryReport — 値の無い行', () => {
    it('1 は素因数を持たないので、分解の列に - を書く', () => {
        const row = numberTheoryReport([1]).trimEnd().split(LF)[1];
        // n=1, 分解=-, τ=1, σ=1, φ=1, μ=1。
        expect(row.trim().split(/\s+/).slice(0, 6)).toEqual(['1', '-', '1', '1', '1', '1']);
    });

    it('大きすぎて分解できない数は、理由を書いた行として残る', () => {
        const lines = numberTheoryReport([12, FACTORIZE_LIMIT + 1]).trimEnd().split(LF);
        expect(lines).toHaveLength(3);
        // 導けない列は空のまま。丸めた値や 0 を置くと、それが答えに見える。
        expect(lines[2].trimEnd()).toMatch(/\(the number is too large to factorize here\)$/);
    });
});

describe('分解できない大きさは、そこから導かれる値も返さない', () => {
    const tooBig = FACTORIZE_LIMIT + 1;

    it('τ・σ・φ・μ は分解の理由をそのまま返す', () => {
        for (const fn of [divisorCount, divisorSum, eulerPhi, moebius]) {
            expect(fn(tooBig)).toBe('the number is too large to factorize here');
        }
    });

    it('完全数の別は決められないので null', () => {
        expect(classifyPerfection(tooBig)).toBeNull();
    });
});

describe('modularInverse — 入口の検査', () => {
    it('整数でなければ逆元を返さない', () => {
        expect(modularInverse(1.5, 7)).toBe('both numbers must be whole numbers');
        expect(modularInverse(3, 7.5)).toBe('both numbers must be whole numbers');
    });

    it('法は 2 以上でなければならない', () => {
        expect(modularInverse(3, 1)).toBe('the modulus must be a whole number of 2 or more');
        expect(modularInverse(3, 0)).toBe('the modulus must be a whole number of 2 or more');
    });
});

/** 改行。ソースに直接置かず組み立てる。 */
const NEWLINE = String.fromCharCode(10);

describe('大きすぎる入力でも落ちない・固まらない', () => {
    it('行数が何万あっても一覧を組める', () => {
        // 幅を Math.max(...rows.map(...)) で求めていた頃は、ここで引数の数が上限に当たり
        // RangeError (Maximum call stack size exceeded) になってコマンドごと落ちていた。
        const values = Array.from({ length: 150000 }, (_, i) => (i % 97) + 1);
        const report = numberTheoryReport(values);
        expect(report.split(NEWLINE).length).toBe(values.length + 2);
    });

    it('二項係数は繰り返す回数に上限を置く', () => {
        // 上限が無いと C(10000000, 5000000) のような選択で戻ってこなくなる。
        // 例外も出ないので、ユーザーには固まったようにしか見えない。
        const refused = `the lower number must be within ${BINOMIAL_STEP_LIMIT} of 0 or of the upper one`;
        expect(binomial(10000000, 5000000)).toBe(refused);
        expect(binomial(Number.MAX_SAFE_INTEGER, Math.floor(Number.MAX_SAFE_INTEGER / 2))).toBe(refused);
        // 端の側が小さければ、上の数が大きくても計算できる (C(n, 1) = n)。
        expect(binomial(10000000, 1)).toBe(10000000n);
        expect(binomial(10000000, 9999999)).toBe(10000000n);
    });

    it('上限の境目', () => {
        expect(typeof binomial(BINOMIAL_STEP_LIMIT * 2, BINOMIAL_STEP_LIMIT)).toBe('bigint');
        expect(typeof binomial(BINOMIAL_STEP_LIMIT * 2 + 2, BINOMIAL_STEP_LIMIT + 1)).toBe('string');
    });
});
