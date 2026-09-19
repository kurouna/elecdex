/**
 * 選択範囲の数値列を別の数値列へ書き換える (構成比・階差・累積和・丸め・単位換算…)。
 *
 * どれも「数値の列 → 同じ長さの数値の列」で、地の文には触らない。位置ごとの計算が要る
 * ものは先に全部の数値を読んでから写像を作り、mapNumbersInText へ渡す。
 *
 * 列の長さを変えないのは意図的。表の 1 列を選んで書き換える使い方が主なので、個数が
 * 変わると隣の列と行がずれる。階差の先頭のように「値が無い」ところは 0 を置く。
 */

import { summarize } from './statistics';

/** 変換の失敗理由。呼び出し側はそのままエコー行に出す。 */
export type TransformError = string;

export interface NumberTransform {
    /** i 番目の値をどう変えるか。null なら元の表記のまま残す。 */
    apply: (value: number, index: number) => number | null;
}

/** 値ごとに独立した変換 (前後の値を見ないもの)。 */
const pointwise = (fn: (value: number) => number | null): NumberTransform => ({ apply: (v) => fn(v) });

/**
 * 合計に対する構成比 (%)。
 *
 * 合計が 0 だと全項目が 0 除算になるので、書き換える前に断る。
 */
export function percentageTransform(values: number[]): NumberTransform | TransformError {
    const stats = summarize(values);
    if (!stats) return 'no numbers to transform';
    if (stats.sum === 0) return 'the numbers add up to zero, so there is no share to compute';
    return pointwise((v) => (v / stats.sum) * 100);
}

/**
 * 隣り合う値の差 (階差)。先頭は基準なので 0 を置く。
 *
 * 前月比・増減の列を作るための変換。長さを変えないのは、隣の列と行をずらさないため。
 */
export function differenceTransform(values: number[]): NumberTransform | TransformError {
    if (values.length < 2) return 'at least two numbers are needed for differences';
    return { apply: (_v, i) => (i === 0 ? 0 : values[i] - values[i - 1]) };
}

/** 累積和。i 番目は 0..i の合計。 */
export function cumulativeTransform(values: number[]): NumberTransform | TransformError {
    if (values.length === 0) return 'no numbers to transform';
    const sums: number[] = [];
    let running = 0;
    for (const v of values) { running += v; sums.push(running); }
    return { apply: (_v, i) => sums[i] };
}

/**
 * 平均 0・標準偏差 1 に直す (z 得点)。
 *
 * ばらつきが 0 の列 (全部同じ値) は割る数が 0 になるので断る。
 */
export function zScoreTransform(values: number[]): NumberTransform | TransformError {
    const stats = summarize(values);
    if (!stats) return 'no numbers to transform';
    if (stats.stdev === 0) return 'every number is the same, so there is no spread to divide by';
    return pointwise((v) => (v - stats.mean) / stats.stdev);
}

/** 指定した桁で丸める。digits は 0〜15。 */
export function roundTransform(digits: number): NumberTransform | TransformError {
    if (!Number.isInteger(digits) || digits < 0 || digits > 15) return 'digits must be between 0 and 15';
    const scale = Math.pow(10, digits);
    return pointwise((v) => Math.round(v * scale) / scale);
}

/**
 * 法 m で割った余り。0 以上 m 未満の最小非負剰余を返す。
 *
 * JS の % は符号を残すので -7 % 3 が -1 になる。合同式の代表元としては 2 が正しく、
 * そのまま指数計算や表の突き合わせに使えるのもこちらなので、寄せ直す。
 * 整数でない値は書き換えない (法の意味が定まらない)。
 */
export function moduloTransform(modulus: number): NumberTransform | TransformError {
    if (!Number.isInteger(modulus) || modulus < 2) return 'the modulus must be a whole number of 2 or more';
    return pointwise((v) => (Number.isInteger(v) ? ((v % modulus) + modulus) % modulus : null));
}

/** すべての値に同じ数を掛ける。単位換算の万能薬。 */
export function scaleTransform(factor: number): NumberTransform | TransformError {
    if (!Number.isFinite(factor)) return 'the factor must be a finite number';
    return pointwise((v) => v * factor);
}

// ── 実務でよく出る換算 ──
//
// 「毎日出てくるのに毎回電卓を叩く」ものだけを定数で持つ。際限なく増やすと Calc の
// 単位系と同じ沼になるので、増やすときは「日本の実務で日常的に出るか」を基準にする。

/** 1 坪 = 400/121 平方メートル (約 3.30578)。宅建業法の換算に使う正確な比。 */
export const SQUARE_METERS_PER_TSUBO = 400 / 121;

/** 平方メートル → 坪。 */
export const squareMetersToTsubo = (): NumberTransform => pointwise((v) => v / SQUARE_METERS_PER_TSUBO);

/** 坪 → 平方メートル。 */
export const tsuboToSquareMeters = (): NumberTransform => pointwise((v) => v * SQUARE_METERS_PER_TSUBO);

/** 税率 (%) の妥当性。0 以上 100 未満に限る。 */
function validRate(percent: number): boolean {
    return Number.isFinite(percent) && percent >= 0 && percent < 100;
}

/**
 * 税抜 → 税込。端数は切り捨て (日本の請求実務の既定)。
 *
 * 掛ける前に 100 を掛けて割るのは、`v * (1 + percent / 100)` だと 1.1 が二進で
 * 表せず、110 / 1.1 が 99.99999999999999 になって切り捨てで 1 円ずれるため。
 * 整数どうしの積と商にしておけば、実務で出る桁では誤差が出ない。
 */
export function taxIncludedTransform(percent: number): NumberTransform | TransformError {
    if (!validRate(percent)) return 'the tax rate must be between 0 and 100';
    return pointwise((v) => Math.floor((v * (100 + percent)) / 100));
}

/** 税込 → 税抜。端数は切り捨て (誤差を避ける形は taxIncludedTransform のコメント参照)。 */
export function taxExcludedTransform(percent: number): NumberTransform | TransformError {
    if (!validRate(percent)) return 'the tax rate must be between 0 and 100';
    return pointwise((v) => Math.floor((v * 100) / (100 + percent)));
}

/** 源泉徴収の税率。100 万円までは 10.21%、超えた部分は 20.42% (復興特別所得税を含む)。 */
export const WITHHOLDING_THRESHOLD = 1000000;
const WITHHOLDING_LOW = 0.1021;
const WITHHOLDING_HIGH = 0.2042;

/**
 * 報酬額から源泉徴収税額を求める。
 *
 * 100 万円を超える部分だけが 20.42% になる段階税率で、超えた瞬間に全額の税率が
 * 上がるわけではない。端数は切り捨て (国税庁の計算方法)。
 */
export function withholdingTax(amount: number): number {
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    if (amount <= WITHHOLDING_THRESHOLD) return Math.floor(amount * WITHHOLDING_LOW);
    const over = amount - WITHHOLDING_THRESHOLD;
    return Math.floor(WITHHOLDING_THRESHOLD * WITHHOLDING_LOW + over * WITHHOLDING_HIGH);
}

/** 各金額を、その源泉徴収税額に置き換える。 */
export const withholdingTransform = (): NumberTransform => pointwise((v) => withholdingTax(v));
