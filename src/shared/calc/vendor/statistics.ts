/**
 * 数値の並びを要約する (calc-sum-region / calc-average-region / calc-stats-region …)。
 *
 * 入力は numbers.ts が拾った数値の配列だけで、テキストにもバッファにも触らない。
 * 集計コマンドが増えても、増えるのはここの 1 行と呼び出し側の見せ方だけで済む。
 */

import { formatCalcNumber, formatGrouped, pluralize } from './format';

export interface CalcStatistics {
    /** 数値の個数。1 以上 (0 個のときは summarize が null を返す)。 */
    count: number;
    sum: number;
    mean: number;
    /** 中央値。偶数個なら中央 2 つの平均。 */
    median: number;
    min: number;
    max: number;
    /** max - min。 */
    range: number;
    /** 標本分散 (n-1 で割る)。count が 1 のときは 0。 */
    variance: number;
    /** 標本標準偏差。 */
    stdev: number;
    /** 母分散 (n で割る)。 */
    populationVariance: number;
    /** 母標準偏差。 */
    populationStdev: number;
    /** 第 1 四分位数 (線形補間)。 */
    q1: number;
    /** 第 3 四分位数 (線形補間)。 */
    q3: number;
    /** すべてを掛け合わせた値 (Excel の PRODUCT)。桁が溢れたら Infinity。 */
    product: number;
    /** 最頻値 (Excel の MODE.SNGL)。どれも 1 回ずつなら null。 */
    mode: number | null;
}

/**
 * 最頻値。いちばん多く出た値を返し、同数なら先に出たほうを採る。
 *
 * どれも 1 回ずつなら null。Excel の MODE.SNGL が #N/A を返すのと同じ考えで、
 * 「最頻値が無い」ことを無理に何かで埋めない。
 */
function mostFrequent(values: number[]): number | null {
    const counts = new Map<number, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);

    let best: number | null = null;
    let bestCount = 1;
    // 挿入順に見るので、同数のときは先に現れた値が残る。
    for (const [value, count] of counts) {
        if (count > bestCount) { best = value; bestCount = count; }
    }
    return best;
}

/**
 * 昇順に並べた配列から、割合 p (0..1) の位置の値を線形補間で求める。
 *
 * 四分位数の定義は流儀が複数あるが、ここは R の type 7 / Excel の PERCENTILE.INC と
 * 同じ「線形補間」を採る。表計算の結果と突き合わせる使い方が主なので、そこに合わせる。
 */
function quantile(sorted: number[], p: number): number {
    if (sorted.length === 1) return sorted[0];
    const pos = (sorted.length - 1) * p;
    const lower = Math.floor(pos);
    const upper = Math.ceil(pos);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (pos - lower);
}

/**
 * 数値の並びを要約する。空配列なら null。
 *
 * 分散は「平均を出してから偏差の二乗を足す」2 パスで求める。教科書どおりの
 * `E[x^2] - E[x]^2` は 1 パスで済むが、値が大きく分散が小さい並び (1000000001,
 * 1000000002, …) で桁落ちを起こし、**負の分散**という有り得ない答えを返す。
 * 選択範囲の合計を取る道具でそれが出ると、答えが違うことにすら気づけない。
 */
export function summarize(values: number[]): CalcStatistics | null {
    const count = values.length;
    if (count === 0) return null;

    let sum = 0;
    for (const v of values) sum += v;
    const mean = sum / count;

    let squares = 0;
    for (const v of values) {
        const d = v - mean;
        squares += d * d;
    }
    const populationVariance = squares / count;
    const variance = count > 1 ? squares / (count - 1) : 0;

    let product = 1;
    for (const v of values) product *= v;

    const sorted = [...values].sort((a, b) => a - b);

    return {
        count,
        sum,
        mean,
        median: quantile(sorted, 0.5),
        min: sorted[0],
        max: sorted[count - 1],
        range: sorted[count - 1] - sorted[0],
        variance,
        stdev: Math.sqrt(variance),
        populationVariance,
        populationStdev: Math.sqrt(populationVariance),
        q1: quantile(sorted, 0.25),
        q3: quantile(sorted, 0.75),
        product,
        mode: mostFrequent(values),
    };
}

/** エコー行に出す 1 行の要約。桁が多くなりがちなので 3 桁区切りで見せる。 */
export function summaryLine(stats: CalcStatistics): string {
    return `Sum: ${formatGrouped(stats.sum)} (${pluralize(stats.count, 'number')}, mean ${formatGrouped(stats.mean)})`;
}

export interface CalcMetric {
    /** エコー行に出す短い名前。 */
    label: string;
    /** 一覧に出す行名。省略した項目は一覧に出さない。 */
    reportLabel?: string;
    /** 要約から値を取り出す。null は「この選択では定まらない」。 */
    pick: (stats: CalcStatistics) => number | null;
    /** 定まらないときにエコー行へ出す理由。 */
    missing?: string;
    /** M-x コマンドにするなら、その id と説明。省略した項目は一覧専用。 */
    command?: { id: string; description: string };
    /** エコー文言の差し替え (既定は「名前: 値 (n numbers)」)。 */
    message?: (value: number, stats: CalcStatistics) => string;
}

/** 標本のばらつきは 2 個以上でなければ定まらない (Excel の VAR.S / STDEV.S も #DIV/0!)。 */
const SPREAD_NEEDS_TWO = 'at least two numbers are needed for a sample spread';
const spread = (pick: (stats: CalcStatistics) => number) =>
    (stats: CalcStatistics) => (stats.count > 1 ? pick(stats) : null);

/**
 * 要約の項目表。**一覧 (*Calc Statistics*) と個々のコマンドは、どちらもここから作る。**
 *
 * 分けて書くと、中央値を一覧に足したのにコマンドが無い、名前が片方だけ変わった、
 * 一覧の最大値と calc-max-region の答えが別の道から出ている、といったずれが起きる。
 * 並び順はそのまま一覧の行順になる。
 */
export const CALC_METRICS: CalcMetric[] = [
    {
        label: 'Count',
        reportLabel: 'Count',
        pick: (s) => s.count,
        command: { id: 'calc-count-region', description: 'Show how many numbers the selected text contains' },
        // 件数そのものが答えなので、"8 (8 numbers)" と二重に言わない。
        message: (value) => `Count: ${formatGrouped(value)}`,
    },
    {
        label: 'Sum',
        reportLabel: 'Sum',
        pick: (s) => s.sum,
        command: {
            id: 'calc-sum-region',
            description: 'Add up every number in the selected text, including a rectangular selection',
        },
        // 合計を見るときは「何個の平均か」まで欲しいことが多い (表計算のステータスバーと同じ)。
        message: (_value, stats) => summaryLine(stats),
    },
    {
        label: 'Mean',
        reportLabel: 'Mean',
        pick: (s) => s.mean,
        command: {
            id: 'calc-average-region',
            description: 'Show the arithmetic mean of the numbers in the selected text',
        },
    },
    {
        label: 'Median',
        reportLabel: 'Median',
        pick: (s) => s.median,
        command: {
            id: 'calc-median-region',
            description: 'Show the middle value of the numbers in the selected text, ordered by size',
        },
    },
    {
        label: 'Min',
        reportLabel: 'Min',
        pick: (s) => s.min,
        command: { id: 'calc-min-region', description: 'Show the smallest of the numbers in the selected text' },
    },
    {
        label: 'Max',
        reportLabel: 'Max',
        pick: (s) => s.max,
        command: { id: 'calc-max-region', description: 'Show the largest of the numbers in the selected text' },
    },
    { label: 'Range', reportLabel: 'Range', pick: (s) => s.range },
    {
        label: 'Variance',
        reportLabel: 'Variance (sample)',
        pick: spread((s) => s.variance),
        missing: SPREAD_NEEDS_TWO,
        command: {
            id: 'calc-variance-region',
            description: 'Show the sample variance of the numbers in the selected text',
        },
    },
    {
        label: 'Std deviation',
        reportLabel: 'Std deviation (sample)',
        pick: spread((s) => s.stdev),
        missing: SPREAD_NEEDS_TWO,
        command: {
            id: 'calc-stddev-region',
            description: 'Show how far the numbers in the selected text spread around their mean',
        },
    },
    { label: 'Variance (population)', reportLabel: 'Variance (population)', pick: (s) => s.populationVariance },
    {
        label: 'Std deviation (population)',
        reportLabel: 'Std deviation (population)',
        pick: (s) => s.populationStdev,
    },
    { label: 'Q1', reportLabel: 'Q1 (25%)', pick: (s) => s.q1 },
    { label: 'Q3', reportLabel: 'Q3 (75%)', pick: (s) => s.q3 },
    {
        label: 'Mode',
        reportLabel: 'Mode',
        pick: (s) => s.mode,
        missing: 'no number appears more than once',
        command: {
            id: 'calc-mode-region',
            description: 'Show which number appears most often in the selected text',
        },
    },
    {
        // 積だけは一覧に出さない。8 個も掛ければ桁が跳ね、要約として並べても読めない。
        label: 'Product',
        pick: (s) => s.product,
        missing: 'the product is too large to be exact',
        command: {
            id: 'calc-product-region',
            description: 'Multiply the numbers in the selected text together',
        },
    },
];

/**
 * *Calc Statistics* バッファの本文。項目表をそのまま縦に並べる。
 *
 * 列を桁でそろえるのは、縦に並べて比べるための表だから。`tau 6  sigma 56` のように
 * 名前を毎行くり返す形にすると、狭いペインでは右端が切れる。
 *
 * 値が定まらない行は - と書き、行そのものは残す (行が消えると項目が増減したように
 * 見えて、別の選択と縦に比べられなくなる)。
 */
export function statisticsReport(stats: CalcStatistics): string {
    const rows = CALC_METRICS
        .filter((metric) => metric.reportLabel !== undefined)
        .map((metric) => [metric.reportLabel!, metric.pick(stats)] as const);
    const width = Math.max(...rows.map(([label]) => label.length));
    return rows
        .map(([label, value]) => `${label.padEnd(width)}  ${value === null ? '-' : formatCalcNumber(value)}`)
        .join('\n') + '\n';
}
