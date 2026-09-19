/**
 * 電卓まわりの純ロジック。コマンド層 (src/keybinds/CalcCommands.ts) はここだけを見る。
 *
 * | ファイル | 役目 | 主な使い手 |
 * |:---|:---|:---|
 * | `normalize.ts` | 全角・別字を ASCII へ寄せる | 下の全員 |
 * | `kanji.ts` | 算用数字に後置された位 (3百万) を読む | `expression.ts` / `numbers.ts` |
 * | `expression.ts` | 字句解析と再帰下降パーサ | `calc` |
 * | `format.ts` | 数値の見せ方 (丸め・桁区切り・進数併記) | 全コマンド |
 * | `extract.ts` | 行の中から式の範囲を決める | `calc-eval-region` |
 * | `numbers.ts` | テキストから数値を拾う | 集計コマンド |
 * | `convert.ts` | 整数を別の基数の表記に書き換える | 基数変換コマンド |
 * | `statistics.ts` | 数値の並びを要約する | 集計コマンド |
 * | `transform.ts` | 数値の列を別の列へ写す (構成比・階差・単位・税) | 書き換えコマンド |
 * | `finance.ts` | 収益率・ボラティリティ・ドローダウン・ローン | 金融コマンド |
 * | `mathkit.ts` | 最大公約数・素因数分解・分数近似・数列の見立て | 数学コマンド |
 * | `rational.ts` | BigInt の厳密な有理数 | 厳密計算コマンド |
 * | `identify.ts` | 小数から閉じた形を当てる | 逆記号計算コマンド |
 * | `continued.ts` | 連分数展開と収束分数 | 連分数コマンド |
 * | `numbertheory.ts` | 約数・φ・μ・拡張ユークリッド・二項係数 | 整数論コマンド |
 * | `manuscript.ts` | 原稿の分量 (唯一、数値でなく文章を見る) | 原稿コマンド |
 * | `random.ts` | 乱数の範囲を読み、その範囲の数を作る | 乱数コマンド |
 *
 * React も Electron も Buffer も出てこないので、どれも node のテストで直接叩ける。
 */

export { normalizeCalcInput } from './normalize';
export { KANJI_MAGNITUDE_SOURCE, kanjiMagnitudeValue, matchKanjiMagnitude } from './kanji';
export { evaluateExpression, CALC_CONSTANTS, type CalcOptions, type CalcResult } from './expression';
export { describeCalcValue, formatCalcNumber, formatGrouped, pluralize } from './format';
export { extractExpressionAt, type ExtractedExpression } from './extract';
export { mapNumbersInText, parseNumbersInText, rewriteNumbersInText } from './numbers';
export { BASE_LABEL, convertNumbersInText, formatInBase, type ConvertResult, type NumberBase } from './convert';
export {
    CALC_METRICS,
    statisticsReport,
    summarize,
    summaryLine,
    type CalcMetric,
    type CalcStatistics,
} from './statistics';
export {
    type NumberTransform,
    type TransformError,
    cumulativeTransform,
    differenceTransform,
    percentageTransform,
    roundTransform,
    scaleTransform,
    squareMetersToTsubo,
    taxExcludedTransform,
    taxIncludedTransform,
    tsuboToSquareMeters,
    withholdingTax,
    withholdingTransform,
    zScoreTransform,
} from './transform';
export {
    type Drawdown,
    type FinanceError,
    type LoanSummary,
    type ReturnSummary,
    cagr,
    financeFailed,
    loanSummary,
    maxDrawdown,
    returnSummary,
    volatility,
} from './finance';
export {
    type Factorization,
    type Fraction,
    type MathError,
    type SequenceGuess,
    describeSequence,
    factorize,
    formatFactorization,
    gcdOf,
    isPrime,
    lcmOf,
    toFraction,
} from './mathkit';
export { type ManuscriptMetrics, manuscriptMetrics } from './manuscript';
export {
    MAX_RANDOM_COUNT,
    type RandomError,
    type RandomSpec,
    parseRandomSpec,
    randomFailed,
    randomNumbers,
} from './random';
export {
    type Rational,
    addRational,
    formatRational,
    makeRational,
    parseRational,
    parseRationalsInText,
    rationalToNumber,
    sumRationals,
} from './rational';
export { type Identification, identifyNumber } from './identify';
export {
    type ContinuedFraction,
    type Convergent,
    continuedFraction,
    evaluateContinuedFraction,
    formatContinuedFraction,
} from './continued';
export {
    BINOMIAL_STEP_LIMIT,
    type Bezout,
    type Perfection,
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
export { moduloTransform } from './transform';
