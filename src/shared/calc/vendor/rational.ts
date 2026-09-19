/**
 * 厳密な有理数 (calc-exact-region)。
 *
 * `1/3` を 3 つ足して `0.999999999999` と答える電卓は、数学の原稿では使えない。
 * 分子と分母を BigInt で持ち、丸めが入るのは「double にして見せるとき」だけにする。
 *
 * 既存の float 経路 (expression.ts / statistics.ts) とは混ぜない。どちらで計算された
 * 値なのかが呼び出し側から見えなくなると、厳密さの保証がその時点で消える。
 */

import { normalizeCalcInput } from './normalize';

export interface Rational {
    /** 分子。符号はこちらが持つ。 */
    n: bigint;
    /** 分母。常に正で、分子と互いに素。 */
    d: bigint;
}

function gcdBig(a: bigint, b: bigint): bigint {
    let x = a < 0n ? -a : a;
    let y = b < 0n ? -b : b;
    while (y) { const t = x % y; x = y; y = t; }
    return x;
}

/** 約分と符号の正規化。分母 0 は作らせない (以降すべての不変条件が壊れるため)。 */
export function makeRational(n: bigint, d: bigint): Rational {
    if (d === 0n) throw new Error('a rational number cannot have zero as its denominator');
    if (n === 0n) return { n: 0n, d: 1n };
    const sign = d < 0n ? -1n : 1n;
    const g = gcdBig(n, d);
    return { n: (sign * n) / g, d: (sign * d) / g };
}

export function addRational(a: Rational, b: Rational): Rational {
    return makeRational(a.n * b.d + b.n * a.d, a.d * b.d);
}

/** 順に足す。空なら 0。 */
export function sumRationals(values: Rational[]): Rational {
    return values.reduce(addRational, { n: 0n, d: 1n });
}

/** 分母 1 なら整数として、そうでなければ約分した分数として書く。 */
export function formatRational(value: Rational): string {
    return value.d === 1n ? String(value.n) : `${value.n}/${value.d}`;
}

/**
 * double へ落とす。ここだけが誤差の入る場所。
 *
 * 素直に Number(n) / Number(d) とすると、桁が大きいときに双方が Infinity になって
 * NaN が出る。先に商と余りへ分けてから落とす。
 */
export function rationalToNumber(value: Rational): number {
    const direct = Number(value.n) / Number(value.d);
    if (Number.isFinite(direct)) return direct;
    const quotient = value.n / value.d;
    const remainder = value.n % value.d;
    return Number(quotient) + Number(remainder) / Number(value.d);
}

/** 1 つの表記を読む。整数・分数・小数を受け、読めなければ null。 */
export function parseRational(token: string): Rational | null {
    if (typeof token !== 'string') return null;
    const text = normalizeCalcInput(token).trim().replace(/,/g, '');
    if (!text) return null;

    const fraction = /^([+-]?\d+)\/(\d+)$/.exec(text);
    if (fraction) {
        const denominator = BigInt(fraction[2]);
        // 1/0 は数ではない。読めなかったものとして扱い、呼び出し側に判断を返す。
        if (denominator === 0n) return null;
        return makeRational(BigInt(fraction[1]), denominator);
    }

    // 小数は 10 のべき乗を分母にして厳密に読む。Number を経由すると、ここで
    // 0.1 が 0.1000000000000000055... になり、以降どれだけ厳密に足しても無駄になる。
    const decimal = /^([+-]?)(\d*)(?:\.(\d+))?$/.exec(text);
    if (!decimal) return null;
    const [, sign, whole, frac = ''] = decimal;
    if (whole === '' && frac === '') return null;
    const digits = (whole || '0') + frac;
    const value = BigInt(digits) * (sign === '-' ? -1n : 1n);
    return makeRational(value, 10n ** BigInt(frac.length));
}

/**
 * テキストから有理数を拾う。分数リテラルを 2 つの整数に割らないのが要点。
 *
 * 3 つ以上つながる `2026/09/06` のような並びは、日付であって分数ではないので飛ばす。
 * 「値の並び」として読むので、`10/2` は式ではなく分数 (= 5) として扱う
 * (numbers.ts が引き算を読まないのと同じ方針)。
 */
const RATIONAL_PATTERN =
    /(?<![0-9A-Za-z_./])[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)?(?:\.\d+)?(?:\/\d+)?(?![0-9A-Za-z_.]|\/\d)/g;

export function parseRationalsInText(text: string): Rational[] {
    if (!text) return [];
    const out: Rational[] = [];
    for (const match of normalizeCalcInput(text).matchAll(RATIONAL_PATTERN)) {
        const token = match[0];
        if (!/\d/.test(token)) continue;
        const value = parseRational(token);
        if (value) out.push(value);
    }
    return out;
}
