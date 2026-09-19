/** Contract for `@calc/extract`; implemented in ../vendor/extract.ts. */

import type { CalcOptions } from './expression'

export interface ExtractedExpression {
  /** The expression as it appears in the line. */
  text: string
  /** Start offset in the line, inclusive. */
  start: number
  /** End offset in the line, exclusive. */
  end: number
  /** What it came to. */
  value: number
}

/**
 * The widest run around `col` that evaluates, or null. Only what evaluated comes
 * back, so a caller never rewrites text on a guess.
 */
export declare function extractExpressionAt(
  line: string,
  col: number,
  options?: CalcOptions,
): ExtractedExpression | null
