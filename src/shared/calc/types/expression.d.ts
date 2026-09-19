/**
 * The contract elecdex codes against for `@calc/expression`.
 *
 * The implementation is `../vendor/expression.ts`, which TypeScript never sees
 * (see ../vendor/README.md). These declarations are what keeps the wrapper
 * honest, so a sync that changes a signature has to be reflected here.
 */

export type CalcResult = { ok: true; value: number } | { ok: false; error: string }

export interface CalcOptions {
  /** Values the expression can reach by name; the wrapper passes `ans` and user variables. */
  vars?: Record<string, number>
}

/** Names that resolve without being defined: pi, e, percent, kb, tsubo and the rest. */
export declare const CALC_CONSTANTS: Record<string, number>

/** Evaluates one line. Never throws: a broken input comes back as `{ ok: false }`. */
export declare function evaluateExpression(input: string, options?: CalcOptions): CalcResult
