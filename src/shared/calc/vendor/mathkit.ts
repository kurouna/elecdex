/**
 * 整数論と数列まわり (最大公約数・素因数分解・分数近似・数列の見立て)。
 *
 * 紙に書くには面倒で、電卓では出ないもの。どれも純関数で、扱う範囲を明示して
 * 「大きすぎて確かめられないもの」は計算せずに理由を返す。
 */

/** 計算できなかった理由。呼び出し側はそのままエコー行に出す。 */
export type MathError = string;

/** 素因数分解を試す上限。これを超えると試し割りが目に見えて遅くなる。 */
export const FACTORIZE_LIMIT = 2 ** 42;

/** 連分数近似で許す分母の上限。 */
const DEFAULT_MAX_DENOMINATOR = 100000;

const isInteger = (v: number) => Number.isSafeInteger(v);

function gcd2(a: number, b: number): number {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) { const t = x % y; x = y; y = t; }
    return x;
}

/** 整数列の最大公約数。全部 0 のときは 0。 */
export function gcdOf(values: number[]): number | MathError {
    if (values.length === 0) return 'no numbers to work with';
    if (!values.every(isInteger)) return 'every number must be a whole number';
    return values.reduce(gcd2, 0);
}

/**
 * 整数列の最小公倍数。
 *
 * 0 が混ざれば 0。桁が溢れたら「大きすぎる」と返す — 丸めた値を最小公倍数として
 * 見せると、割り切れるはずのものが割り切れない答えになる。
 */
export function lcmOf(values: number[]): number | MathError {
    if (values.length === 0) return 'no numbers to work with';
    if (!values.every(isInteger)) return 'every number must be a whole number';
    let acc = 1;
    for (const v of values) {
        if (v === 0) return 0;
        acc = Math.abs(acc / gcd2(acc, v) * v);
        if (!Number.isSafeInteger(acc)) return 'the least common multiple is too large to be exact';
    }
    return acc;
}

/** 素因数と指数の組。2^3 * 5 なら [[2, 3], [5, 1]]。 */
export type Factorization = Array<[number, number]>;

/**
 * 素因数分解 (試し割り)。1 と 0 は分解できないものとして空の組を返す。
 *
 * 試し割りは √n までで済むが、n が大きいとそれでも長い。上限を超えたら計算しない
 * — エディタのコマンドが数秒固まるほうが、答えが出ないことより困る。
 */
export function factorize(value: number): Factorization | MathError {
    if (!isInteger(value)) return 'only whole numbers can be factorized';
    const n = Math.abs(value);
    if (n > FACTORIZE_LIMIT) return 'the number is too large to factorize here';
    if (n < 2) return [];

    const out: Factorization = [];
    let rest = n;
    for (let p = 2; p * p <= rest; p += p === 2 ? 1 : 2) {
        let exp = 0;
        while (rest % p === 0) { rest /= p; exp++; }
        if (exp > 0) out.push([p, exp]);
    }
    if (rest > 1) out.push([rest, 1]);
    return out;
}

/** 素因数分解を "2^3 * 5" の形にする。負数は先頭に -1 を置く。 */
export function formatFactorization(value: number, factors: Factorization): string {
    if (factors.length === 0) return String(value);
    const body = factors.map(([p, e]) => (e === 1 ? String(p) : `${p}^${e}`)).join(' * ');
    return value < 0 ? `-1 * ${body}` : body;
}

/** 素数判定 (試し割り)。 */
export function isPrime(value: number): boolean {
    if (!isInteger(value) || value < 2) return false;
    if (value % 2 === 0) return value === 2;
    for (let p = 3; p * p <= value; p += 2) if (value % p === 0) return false;
    return true;
}

export interface Fraction {
    numerator: number;
    denominator: number;
    /** 分数として書き直した値と元の値の差。0 なら完全に一致。 */
    error: number;
}

/**
 * 小数を分数で近似する (連分数展開)。
 *
 * 0.333333 のような「割り切った跡」を 1/3 に戻すのが主な用途。分母の上限を超えたら
 * そこで打ち切り、どれだけずれているかを error に入れて返す。近似であることを
 * 隠さないための値で、呼び出し側はこれを見て「= か ≈ か」を決められる。
 */
export function toFraction(value: number, maxDenominator = DEFAULT_MAX_DENOMINATOR): Fraction | MathError {
    if (!Number.isFinite(value)) return 'only finite numbers can be written as a fraction';
    if (Number.isInteger(value)) return { numerator: value, denominator: 1, error: 0 };

    const sign = value < 0 ? -1 : 1;
    let x = Math.abs(value);
    // 連分数展開。h/k が近似分数で、1 段ごとに精度が上がる。
    let h1 = 1, k1 = 0, h = Math.floor(x), k = 1;
    while (x !== Math.floor(x)) {
        x = 1 / (x - Math.floor(x));
        const a = Math.floor(x);
        const h2 = a * h + h1;
        const k2 = a * k + k1;
        if (k2 > maxDenominator || !Number.isFinite(h2)) break;
        h1 = h; k1 = k; h = h2; k = k2;
    }
    if (k === 0) return 'the number cannot be written as a fraction with a small denominator';
    const numerator = sign * h;
    return { numerator, denominator: k, error: numerator / k - value };
}

export type SequenceKind = 'constant' | 'arithmetic' | 'geometric' | 'polynomial' | 'unknown';

export interface SequenceGuess {
    kind: SequenceKind;
    /** 等差なら公差、等比なら公比、多項式なら次数。それ以外は undefined。 */
    parameter?: number;
    /** 見立てが当たっているとしたときの次の項。 */
    next?: number;
}

/** 相対誤差で比べる。浮動小数の列を「等差」と認めるための許容。 */
const nearlyEqual = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/**
 * 数列の並びを見立てる (定数・等差・等比・多項式)。
 *
 * 階差を繰り返し取って一定になった段数を多項式の次数とする。判定できなければ
 * unknown を返す — それらしい式をひねり出すより、分からないと言うほうが役に立つ。
 */
export function describeSequence(values: number[]): SequenceGuess | MathError {
    if (values.length < 3) return 'at least three numbers are needed to guess a sequence';

    const first = values[0];
    if (values.every((v) => nearlyEqual(v, first))) {
        return { kind: 'constant', parameter: 0, next: first };
    }

    const diffs = values.slice(1).map((v, i) => v - values[i]);
    if (diffs.every((d) => nearlyEqual(d, diffs[0]))) {
        return { kind: 'arithmetic', parameter: diffs[0], next: values[values.length - 1] + diffs[0] };
    }

    if (values.every((v) => v !== 0)) {
        const ratios = values.slice(1).map((v, i) => v / values[i]);
        if (ratios.every((r) => nearlyEqual(r, ratios[0]))) {
            return { kind: 'geometric', parameter: ratios[0], next: values[values.length - 1] * ratios[0] };
        }
    }

    // 階差を繰り返す。n 段で一定になれば n 次多項式。
    // 次の項は Newton の前進差分そのもので、各段の末尾を全部足したものになる
    // (一定の段に定数を 1 つ足し、そこから上へ順に足し戻すのと同じ)。
    const levels: number[][] = [values, diffs];
    for (let degree = 2; degree <= 6; degree++) {
        const previous = levels[levels.length - 1];
        if (previous.length < 3) break;
        const next = previous.slice(1).map((v, i) => v - previous[i]);
        levels.push(next);
        if (next.every((d) => nearlyEqual(d, next[0]))) {
            const predicted = levels.reduce((sum, level) => sum + level[level.length - 1], 0);
            return { kind: 'polynomial', parameter: degree, next: predicted };
        }
    }

    return { kind: 'unknown' };
}
