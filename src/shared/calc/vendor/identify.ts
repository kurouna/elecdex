/**
 * 逆記号計算 (calc-identify-region)。
 *
 * 数値実験で出てきた 1.644934067 を選んで「π²/6 だ」と当てる道具。Maple の
 * `identify` や Inverse Symbolic Calculator の小型版で、数学の作業ではここが
 * いちばん時間を食う (見覚えのある数だが思い出せない、という時間)。
 *
 * **当たらないときは黙る。** それらしい式をひねり出すのは、分からないと言うより
 * 有害で、間違った予想を論文に持ち込ませる。
 */

import { continuedFraction } from './continued';

/** 照合する定数。名前は expression.ts でそのまま再評価できる書き方にそろえる。 */
const CONSTANTS: Array<[string, number]> = [
    ['1', 1],
    ['pi', Math.PI],
    ['e', Math.E],
    ['phi', (1 + Math.sqrt(5)) / 2],
    // オイラーの定数。閉じた形が知られていないぶん、出てきたときに気づきにくい。
    ['gamma', 0.5772156649015329],
    ['pi^2', Math.PI ** 2],
    ['pi^3', Math.PI ** 3],
    ['sqrt(pi)', Math.sqrt(Math.PI)],
    ...[2, 3, 5, 6, 7, 10, 11, 13].map((n) => [`sqrt(${n})`, Math.sqrt(n)] as [string, number]),
    ...[2, 3, 5].map((n) => [`${n}^(1/3)`, Math.cbrt(n)] as [string, number]),
    ...[2, 3, 5, 7, 10].map((n) => [`ln(${n})`, Math.log(n)] as [string, number]),
];

/** 有理数倍として認める分母の上限。大きくすると何でも「当たって」しまう。 */
const MAX_DENOMINATOR = 60;

/** 既定の許容誤差。手で書き写した 10 桁程度の小数が通る広さ。 */
const DEFAULT_TOLERANCE = 1e-9;

/** 返す候補の数。 */
const MAX_RESULTS = 3;

export interface Identification {
    /** 当てはめた式。calc にそのまま打ち直せる書き方。 */
    text: string;
    /** その式の値。 */
    value: number;
    /** 元の数との差。 */
    error: number;
}

/** p/q * name を人が読む形にする。係数 1 や分母 1 を省く。 */
function render(name: string, p: number, q: number): string {
    if (name === '1') return q === 1 ? String(p) : `${p}/${q}`;
    const sign = p < 0 ? '-' : '';
    const magnitude = Math.abs(p);
    const head = magnitude === 1 ? name : `${magnitude}*${name}`;
    return q === 1 ? `${sign}${head}` : `${sign}${head}/${q}`;
}

/**
 * 小数に当てはまる閉じた形を探す。簡単な形から順に、最大 3 つ返す。
 *
 * やっていることは単純で、定数ごとに x / c を有理数へ近似し、その有理数が十分小さい
 * 分母で書けて、かつ元の数に十分近ければ採用する。分母の上限が緩衝材で、ここを
 * 大きくすると「どんな数にも何かが当たる」占いになる。
 */
export function identifyNumber(value: number, tolerance = DEFAULT_TOLERANCE): Identification[] {
    if (!Number.isFinite(value) || value === 0) return [];

    const scale = Math.max(1, Math.abs(value));
    const found: Array<Identification & { denominator: number }> = [];

    for (const [name, constant] of CONSTANTS) {
        const ratio = value / constant;
        if (!Number.isFinite(ratio)) continue;

        // 連分数の収束分数が、そのまま「分母の小さい順の有理近似」になっている。
        for (const { n: p, d: q } of continuedFraction(ratio, 20).convergents) {
            if (q > MAX_DENOMINATOR || p === 0) continue;
            const candidate = (p / q) * constant;
            const error = candidate - value;
            if (Math.abs(error) > tolerance * scale) continue;
            found.push({ text: render(name, p, q), value: candidate, error, denominator: q });
            break; // 同じ定数では、いちばん分母の小さい当てはめだけを採る。
        }
    }

    return found
        // 簡単な形 (分母が小さい) を先に。同じなら誤差の小さい順。
        .sort((a, b) => a.denominator - b.denominator || Math.abs(a.error) - Math.abs(b.error))
        .slice(0, MAX_RESULTS)
        .map(({ text, value: v, error }) => ({ text, value: v, error }));
}
