/**
 * 連分数展開 (calc-continued-fraction-region)。
 *
 * π = [3; 7, 15, 1, 292] のように、小数を「整数の並び」として見る道具。
 * 収束分数 (22/7, 333/106, 355/113 …) も一緒に返す。近似の良し悪しを見るには
 * 分数そのものより「どこで大きな項が出たか」が効くため、両方を渡す。
 */

/** 既定の項数。π の 292 のような目立つ項までは入る長さ。 */
const DEFAULT_TERMS = 12;

/** 展開を打ち切る精度。これより細かい端数は誤差とみなす。 */
const EPSILON = 1e-12;

export interface Convergent {
    n: number;
    d: number;
}

export interface ContinuedFraction {
    /** 展開した項。先頭が整数部。 */
    terms: number[];
    /** 各段の収束分数。terms と同じ長さ。 */
    convergents: Convergent[];
    /** 展開が終わりまで出たか (有理数なら true、打ち切ったら false)。 */
    exact: boolean;
}

/**
 * 連分数に展開する。
 *
 * 有理数はいつか端数が消えて終わる。無理数は終わらないので maxTerms で打ち切り、
 * 打ち切ったことを exact=false で伝える。
 */
export function continuedFraction(value: number, maxTerms = DEFAULT_TERMS): ContinuedFraction {
    const terms: number[] = [];
    const convergents: Convergent[] = [];
    if (!Number.isFinite(value) || maxTerms < 1) return { terms, convergents, exact: false };

    let x = value;
    let exact = false;
    // 収束分数の漸化式 h_i = a_i * h_(i-1) + h_(i-2)、k も同じ形。
    // 初期値は h_(-1)=1, h_(-2)=0 / k_(-1)=0, k_(-2)=1 で、ここを取り違えると
    // 分子と分母が入れ替わった数 (1/3, 7/22 …) が並ぶ。
    let hPrev = 1, hPrev2 = 0, kPrev = 0, kPrev2 = 1;

    for (let i = 0; i < maxTerms; i++) {
        const a = Math.floor(x);
        terms.push(a);

        const h = a * hPrev + hPrev2;
        const k = a * kPrev + kPrev2;
        hPrev2 = hPrev; hPrev = h; kPrev2 = kPrev; kPrev = k;
        convergents.push({ n: h, d: k });

        const frac = x - a;
        if (Math.abs(frac) < EPSILON) { exact = true; break; }
        x = 1 / frac;
        if (!Number.isFinite(x)) { exact = true; break; }
    }

    return { terms, convergents, exact };
}

/** [3; 7, 15, 1, 292] の形にする。打ち切ったものは末尾に … を付ける。 */
export function formatContinuedFraction(cf: ContinuedFraction): string {
    if (cf.terms.length === 0) return '[]';
    const [first, ...rest] = cf.terms;
    const tail = rest.length > 0 ? `; ${rest.join(', ')}` : '';
    const truncated = cf.exact ? '' : ', …';
    return `[${first}${tail}${truncated}]`;
}

/** 項を畳み戻して値に戻す。展開が正しいかを確かめるための逆向きの道。 */
export function evaluateContinuedFraction(terms: number[]): number {
    if (terms.length === 0) return 0;
    let value = terms[terms.length - 1];
    for (let i = terms.length - 2; i >= 0; i--) value = terms[i] + 1 / value;
    return value;
}
