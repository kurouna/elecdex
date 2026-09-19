/**
 * 整数論の関数 (calc-number-theory-region / calc-bezout-region / calc-binomial-region)。
 *
 * 素因数分解そのものは mathkit.ts が持つ。ここはそこから導ける量 (約数の個数と和、
 * オイラー φ、メビウス μ)、拡張ユークリッド、そして BigInt の二項係数を担当する。
 *
 * double で表せる範囲を超える値は、丸めた数を返さずに理由を返す。整数論の道具で
 * 「だいたい合っている数」は答えとして意味を持たない。
 */

import { type MathError, factorize, isPrime } from './mathkit';

/**
 * 二項係数で回してよい繰り返しの上限。
 *
 * C(n, k) は min(k, n-k) 回まわり、1 周ごとに答えの桁が伸びるので費用は二乗で効く。
 * 2 万回で 20ms ほど、20 万回だと数秒かかり、答えも 6 万桁を超えてエコー行に出す
 * 意味を失う。読める答えが返る範囲で切る。
 */
export const BINOMIAL_STEP_LIMIT = 20000;

const requirePositive = (n: number): MathError | null =>
    Number.isSafeInteger(n) && n >= 1 ? null : 'only positive whole numbers have these values';

/** 約数の個数 τ(n)。指数に 1 を足して掛け合わせる。 */
export function divisorCount(n: number): number | MathError {
    const invalid = requirePositive(n);
    if (invalid) return invalid;
    const factors = factorize(n);
    if (typeof factors === 'string') return factors;
    return factors.reduce((acc, [, e]) => acc * (e + 1), 1);
}

/** 約数の和 σ(n)。素因数ごとの等比級数の積。 */
export function divisorSum(n: number): number | MathError {
    const invalid = requirePositive(n);
    if (invalid) return invalid;
    const factors = factorize(n);
    if (typeof factors === 'string') return factors;
    return factors.reduce((acc, [p, e]) => acc * ((Math.pow(p, e + 1) - 1) / (p - 1)), 1);
}

/** オイラーの φ(n)。n 以下で n と互いに素な数の個数。 */
export function eulerPhi(n: number): number | MathError {
    const invalid = requirePositive(n);
    if (invalid) return invalid;
    const factors = factorize(n);
    if (typeof factors === 'string') return factors;
    return factors.reduce((acc, [p, e]) => acc * (Math.pow(p, e) - Math.pow(p, e - 1)), 1);
}

/** メビウスの μ(n)。平方因子があれば 0、無ければ素因数の個数の偶奇で ±1。 */
export function moebius(n: number): number | MathError {
    const invalid = requirePositive(n);
    if (invalid) return invalid;
    const factors = factorize(n);
    if (typeof factors === 'string') return factors;
    if (factors.some(([, e]) => e > 1)) return 0;
    return factors.length % 2 === 0 ? 1 : -1;
}

export type Perfection = 'perfect' | 'abundant' | 'deficient';

/** 真の約数の和と n を比べる。完全数・過剰数・不足数。 */
export function classifyPerfection(n: number): Perfection | null {
    const sum = divisorSum(n);
    if (typeof sum === 'string') return null;
    const proper = sum - n;
    return proper === n ? 'perfect' : proper > n ? 'abundant' : 'deficient';
}

export interface Bezout {
    /** 最大公約数 (常に 0 以上)。 */
    gcd: number;
    /** a*x + b*y = gcd を満たす係数。 */
    x: number;
    y: number;
}

/**
 * 拡張ユークリッドの互除法。gcd と、それを作る係数を返す。
 *
 * mod 逆元も合同式も、実務ではここから出てくる。gcd だけを返す関数と分けているのは、
 * 係数まで欲しい場面のほうが (整数論では) 多いため。
 */
export function bezout(a: number, b: number): Bezout | MathError {
    if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) return 'both numbers must be whole numbers';

    let oldR = a, r = b;
    let oldX = 1, x = 0;
    let oldY = 0, y = 1;
    while (r !== 0) {
        const q = Math.trunc(oldR / r);
        [oldR, r] = [r, oldR - q * r];
        [oldX, x] = [x, oldX - q * x];
        [oldY, y] = [y, oldY - q * y];
    }
    // gcd は 0 以上にそろえる。符号が付くと「約数」としての意味が分かりにくい。
    return oldR < 0 ? { gcd: -oldR, x: -oldX, y: -oldY } : { gcd: oldR, x: oldX, y: oldY };
}

/**
 * a の mod m における逆元。互いに素でなければ存在しないので、その旨を返す。
 *
 * 戻り値は 0 以上 m 未満に正規化する。負の代表元を返すと、そのまま指数計算へ
 * 渡したときに間違える。
 */
export function modularInverse(a: number, m: number): number | MathError {
    if (!Number.isSafeInteger(a) || !Number.isSafeInteger(m)) return 'both numbers must be whole numbers';
    if (m < 2) return 'the modulus must be a whole number of 2 or more';
    const result = bezout(a, m);
    if (typeof result === 'string') return result;
    if (result.gcd !== 1) return `${a} and ${m} are not coprime, so there is no inverse`;
    return ((result.x % m) + m) % m;
}

/**
 * 二項係数 C(n, k) を BigInt で厳密に返す。
 *
 * C(100, 50) は 29 桁あり、double では丸まる。乗算と除算を交互に行うので、
 * 途中の値も階乗ほど大きくならない。
 */
export function binomial(n: number, k: number): bigint | MathError {
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(k)) return 'both numbers must be whole numbers';
    if (n < 0 || k < 0) return 'neither number may be negative';
    if (k > n) return 'the lower number must not exceed the upper one';

    // 繰り返す回数は min(k, n-k) で、1 周ごとに桁が伸びる。上限が無いと
    // C(10000000, 5000000) のような選択でエディタが固まったまま戻らない
    // (例外すら出ないので、待つ以外に打つ手が無くなる)。
    const steps = Math.min(k, n - k);
    if (steps > BINOMIAL_STEP_LIMIT) return `the lower number must be within ${BINOMIAL_STEP_LIMIT} of 0 or of the upper one`;

    const kk = BigInt(steps);
    const nn = BigInt(n);
    let result = 1n;
    for (let i = 0n; i < kk; i++) {
        result = (result * (nn - i)) / (i + 1n);
    }
    return result;
}

/** 一覧の列。ギリシャ文字は数学の記号そのままで、名前より短く、読み手には速い。 */
const COLUMNS = ['n', 'factorization', 'tau', 'sigma', 'phi', 'mu', 'notes'] as const;
const HEADERS = ['n', 'factorization', 'τ', 'σ', 'φ', 'μ', 'notes'] as const;

/** 1 つの整数についての 1 行分のセル。扱えない値も行を残し、理由をその場に書く。 */
function reportCells(value: number): string[] {
    const factors = factorize(value);
    if (typeof factors === 'string' || value < 1) {
        const reason = typeof factors === 'string' ? factors : 'not a positive whole number';
        return [String(value), `(${reason})`, '', '', '', '', ''];
    }
    const notes = [isPrime(value) ? 'prime' : '', classifyPerfection(value) ?? ''].filter((n) => n.length > 0);
    return [
        String(value),
        factors.length === 0 ? '-' : factors.map(([p, e]) => (e === 1 ? `${p}` : `${p}^${e}`)).join(' * '),
        String(divisorCount(value)),
        String(divisorSum(value)),
        String(eulerPhi(value)),
        String(moebius(value)),
        notes.join(' '),
    ];
}

/**
 * 選んだ整数についての一覧。*Calc Number Theory* バッファの本文。
 *
 * 列を桁でそろえるのは、縦に並べて比べるための表だから。`tau 6  sigma 56` のように
 * 名前を毎行くり返すと、狭いペインでは右端が切れて、いちばん見たい notes 列
 * (perfect / prime) から先に消える。
 *
 * 扱えない値も行を残すのは、選んだ個数と並んだ行数が合わないと「どれが落ちたか」を
 * 目で追えなくなるため。
 */
export function numberTheoryReport(values: number[]): string {
    const rows = [HEADERS as unknown as string[], ...values.map(reportCells)];
    // 幅は畳んで求める。Math.max(...rows.map(...)) と書くと、選んだ数が 10 万を超えた
    // あたりで引数の数が上限に当たり、RangeError (Maximum call stack size exceeded) で
    // コマンドごと落ちる。行数はユーザーの選択範囲そのままなので、上限は無いものとして扱う。
    const widths = COLUMNS.map((_, i) => rows.reduce((max, row) => Math.max(max, row[i].length), 0));
    // 数の列は右寄せ、素因数分解と notes は左寄せ。
    const alignRight = [true, false, true, true, true, true, false];
    return rows
        .map((row) => row
            .map((cell, i) => (alignRight[i] ? cell.padStart(widths[i]) : cell.padEnd(widths[i])))
            .join('  ')
            .trimEnd())
        .join('\n') + '\n';
}
