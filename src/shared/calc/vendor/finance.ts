/**
 * 金融まわりの集計 (騰落率・CAGR・ボラティリティ・最大ドローダウン・ローン返済)。
 *
 * 入力は「価格の列」や「3 つの条件」といった素の数値だけで、テキストにもバッファにも
 * 触らない。前提を置かないと決まらない値 (年率換算など) は、前提ごと呼び出し側に
 * 決めさせるか、そもそも返さない方針にしてある — 電卓が黙って置いた仮定は、
 * 使う人には見えないため。
 */

import { summarize } from './statistics';

/** 計算できなかった理由。呼び出し側はそのままエコー行に出す。 */
export type FinanceError = string;

const isError = <T>(v: T | FinanceError): v is FinanceError => typeof v === 'string';
export const financeFailed = isError;

// ── 収益率 ──

export interface ReturnSummary {
    /** 期ごとの収益率 (小数。0.05 = +5%)。要素数は価格列より 1 つ少ない。 */
    returns: number[];
    /** 最初から最後までの通算収益率。 */
    total: number;
    /** 期あたりの平均収益率 (相乗平均)。 */
    perPeriod: number;
    /** 期の数 (価格の個数 - 1)。 */
    periods: number;
}

/**
 * 価格の列から収益率を出す。
 *
 * 0 や負の価格が混じる列は扱わない。相乗平均も CAGR も定義できず、
 * 途中まで計算した数字を返すと「出たのだから正しい」と読まれてしまう。
 */
export function returnSummary(prices: number[]): ReturnSummary | FinanceError {
    if (prices.length < 2) return 'at least two prices are needed';
    if (prices.some((p) => p <= 0)) return 'prices must all be greater than zero';

    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) returns.push(prices[i] / prices[i - 1] - 1);

    const periods = prices.length - 1;
    const total = prices[prices.length - 1] / prices[0] - 1;
    // 相乗平均。単純平均だと +50% と -50% を繰り返した列が「平均 0%」に見えてしまう。
    const perPeriod = Math.pow(1 + total, 1 / periods) - 1;
    return { returns, total, perPeriod, periods };
}

/**
 * 年平均成長率 (CAGR)。periods は年数などの期間の数。
 *
 * 期間の単位はこの関数の外にある。年次の列なら年、月次なら月の成長率が出る。
 */
export function cagr(first: number, last: number, periods: number): number | FinanceError {
    if (first <= 0 || last <= 0) return 'the first and last values must be greater than zero';
    if (!Number.isFinite(periods) || periods <= 0) return 'the number of periods must be positive';
    return Math.pow(last / first, 1 / periods) - 1;
}

/**
 * ボラティリティ = 収益率の標準偏差 (標本)。
 *
 * 価格が 3 個から。2 個だと収益率が 1 個しか作れず、標本の散らばりは定まらない
 * (Excel の STDEV.S も 1 個では #DIV/0!)。ここで 0 を返すと「値動きが無い」と
 * 読めてしまい、測れていないことに気づけない。
 *
 * 年率換算は返さない。√252 を掛けるには「その列が日次である」という前提が要り、
 * 月次の列に掛けると 3 倍以上ずれた数字が黙って出る。換算したい人は
 * calc で `ans * sqrt(252)` と書ける。
 */
export function volatility(prices: number[]): number | FinanceError {
    const summary = returnSummary(prices);
    if (isError(summary)) return summary;
    if (summary.returns.length < 2) return 'at least three prices are needed for a volatility';
    const stats = summarize(summary.returns);
    if (!stats) return 'at least three prices are needed for a volatility';
    return stats.stdev;
}

// ── ドローダウン ──

export interface Drawdown {
    /** 下落率 (小数。0.25 = 25% の下落)。下落が無ければ 0。 */
    depth: number;
    /** 山の値と、その位置 (0 起点)。 */
    peak: number;
    peakIndex: number;
    /** 谷の値と、その位置。 */
    trough: number;
    troughIndex: number;
}

/**
 * 最大ドローダウン (山からの最大下落率) と、その区間。
 *
 * 山は「その時点までの最高値」で、谷はその後に来る値。山より前の安値は数えない。
 */
export function maxDrawdown(prices: number[]): Drawdown | FinanceError {
    if (prices.length < 2) return 'at least two prices are needed';
    if (prices.some((p) => p <= 0)) return 'prices must all be greater than zero';

    let peak = prices[0];
    let peakIndex = 0;
    const worst: Drawdown = { depth: 0, peak: prices[0], peakIndex: 0, trough: prices[0], troughIndex: 0 };

    for (let i = 1; i < prices.length; i++) {
        if (prices[i] > peak) { peak = prices[i]; peakIndex = i; continue; }
        const depth = (peak - prices[i]) / peak;
        if (depth > worst.depth) {
            worst.depth = depth;
            worst.peak = peak;
            worst.peakIndex = peakIndex;
            worst.trough = prices[i];
            worst.troughIndex = i;
        }
    }
    return worst;
}

// ── ローン (元利均等返済) ──

export interface LoanSummary {
    /** 毎月の返済額 (円未満切り上げ。返し切れない端数を残さない)。 */
    monthly: number;
    /** 返済総額。 */
    total: number;
    /** 利息の合計。 */
    interest: number;
    /** 返済回数 (月)。 */
    months: number;
}

/**
 * 元利均等返済の毎月返済額。
 *
 * 金利 0 のときは等分。一般式は (1+r)^n - 1 が 0 になって割れないので、分けて扱う。
 * 端数を切り上げるのは、切り捨てると最終回に不足が出るため (金融機関の実務も同じ)。
 */
export function loanSummary(principal: number, annualRatePercent: number, years: number): LoanSummary | FinanceError {
    if (!Number.isFinite(principal) || principal <= 0) return 'the principal must be greater than zero';
    if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0) return 'the interest rate must not be negative';
    if (!Number.isFinite(years) || years <= 0) return 'the term must be greater than zero';

    const months = Math.round(years * 12);
    if (months <= 0) return 'the term must cover at least one month';

    const monthlyRate = annualRatePercent / 100 / 12;
    const raw = monthlyRate === 0
        ? principal / months
        : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
    if (!Number.isFinite(raw)) return 'the numbers are too large to compute a payment';

    const monthly = Math.ceil(raw);
    const total = monthly * months;
    return { monthly, total, interest: total - principal, months };
}
