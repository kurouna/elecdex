/**
 * 乱数の範囲を読み、その範囲の数を作る (calc-random)。
 *
 * Emacs Calc の `k r` (calc-random) にあたる。Calc は「M が正の整数なら 0..M-1」という
 * 約束だが、ここは**書いたとおりの閉区間** (`1..6` なら 1 と 6 も出る) にしてある。
 * テストデータを埋めるのが主な用途で、上限が 1 つ足りない形は間違いに気づきにくい。
 *
 * 乱数源は引数で受け取る。ここが Math.random を直に呼ぶと、出た値の正しさを試験できない。
 */

import { normalizeCalcInput } from './normalize';

/** 一度に挿入できる個数の上限。長さで詰まらない範囲に切る。 */
export const MAX_RANDOM_COUNT = 1000;

/** 小数の桁数の上限。倍精度で意味を持つ範囲を超えると、下の桁は雑音にしかならない。 */
const MAX_DECIMALS = 10;

export interface RandomSpec {
    /** 小数点を書いたかどうかで決まる。`1..6` は整数、`0.0..1.0` は実数。 */
    kind: 'integer' | 'real';
    /** 下限 (この値も出る)。 */
    min: number;
    /** 上限 (この値も出る)。 */
    max: number;
    /** 実数のときに書き出す小数桁数。整数では 0。 */
    decimals: number;
    /** 正規化した表記。読み直すと同じ範囲になるので、次回のプロンプトの既定値に使える。 */
    label: string;
}

/** 読めなかった理由。エコー行にそのまま出る文。 */
export type RandomError = string;

/** 範囲の解釈に失敗したか。 */
export const randomFailed = (v: RandomSpec | RandomError): v is RandomError => typeof v === 'string';

/** 符号つきの十進表記。指数表記を含めないのは、桁が跳ねて範囲の広さが読めなくなるため。 */
const NUM = String.raw`[+-]?(?:\d+(?:\.\d+)?|\.\d+)`;

/**
 * `A..B`。区切りは点 2 つちょうどで、前後に点が続くものは受け付けない。
 *
 * `1...2` は `1..2` の打ち間違いだが、素直に切ると `1` と `.2` に割れて「範囲が空」と
 * 答えてしまう。打ち間違いには打ち間違いだと言うほうが直しやすい。
 */
const RANGE = new RegExp(String.raw`^(${NUM})\s*(?<!\.)\.\.(?!\.)\s*(${NUM})$`);
const SINGLE = new RegExp(`^(${NUM})$`);

const NOT_A_RANGE = 'give a range like 1..100';

/** 小数点以下の桁数。小数点が無ければ 0。 */
function decimalsOf(raw: string): number {
    const dot = raw.indexOf('.');
    return dot < 0 ? 0 : raw.length - dot - 1;
}

/** 端の値と表記から仕様を組み立て、通らない範囲は理由を返す。 */
function build(minRaw: string, maxRaw: string): RandomSpec | RandomError {
    const min = Number(minRaw);
    const max = Number(maxRaw);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return 'the range is too large';
    if (min > max) return 'the range is empty';

    const real = minRaw.includes('.') || maxRaw.includes('.');
    if (real) {
        const decimals = Math.max(decimalsOf(minRaw), decimalsOf(maxRaw));
        if (decimals > MAX_DECIMALS) return `write at most ${MAX_DECIMALS} decimal places`;
        return { kind: 'real', min, max, decimals, label: `${min.toFixed(decimals)}..${max.toFixed(decimals)}` };
    }

    // 整数は「端も出る」ので幅は max - min + 1。ここが正確に数えられない広さなら、
    // 一様に引けているかを保証できないので断る。
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) return 'the range is too large';
    if (max - min + 1 > Number.MAX_SAFE_INTEGER) return 'the range is too large';
    return { kind: 'integer', min, max, decimals: 0, label: `${min}..${max}` };
}

/**
 * 入力を範囲として読む。読めなければ理由を返す (例外は投げない)。
 *
 * 数だけを書いた `6` は 1..6 と読む。サイコロや「1 から 100 まで」のつもりで打つ人が
 * 多い形で、0 始まりにすると上限が 1 つずれた表になる。
 */
export function parseRandomSpec(input: string): RandomSpec | RandomError {
    const text = normalizeCalcInput(input).trim();
    if (!text) return NOT_A_RANGE;

    const range = RANGE.exec(text);
    if (range) return build(range[1], range[2]);

    const single = SINGLE.exec(text);
    if (!single) return NOT_A_RANGE;
    // 上限だけを書く形は整数に限る。`2.5` から刻み幅を推し量ると、書いていない約束が増える。
    if (single[1].includes('.')) return NOT_A_RANGE;
    if (Number(single[1]) < 1) return 'a single number must be 1 or more';
    return build('1', single[1]);
}

/** 乱数源の値 (0 以上 1 以下) から 1 つ引く。 */
function draw(spec: RandomSpec, source: number): string {
    if (spec.kind === 'real') {
        const value = spec.min + source * (spec.max - spec.min);
        return Math.min(spec.max, Math.max(spec.min, value)).toFixed(spec.decimals);
    }
    // source がちょうど 1 なら max + 1 になるので、両端で挟んでから返す。
    const value = spec.min + Math.floor(source * (spec.max - spec.min + 1));
    return String(Math.min(spec.max, Math.max(spec.min, value)));
}

/** 範囲から count 個引く。乱数源は差し替えられる (既定は Math.random)。 */
export function randomNumbers(spec: RandomSpec, count: number, rng: () => number = Math.random): string[] {
    const out: string[] = [];
    for (let i = 0; i < count; i++) out.push(draw(spec, rng()));
    return out;
}
