import { CALC_CONSTANTS, evaluateExpression } from '@calc/expression'
import { extractExpressionAt } from '@calc/extract'
import { describeCalcValue, formatCalcNumber, formatGrouped } from '@calc/format'
import { CALC_FUNCTIONS } from './help.js'

/**
 * Evaluating a line, elecdex's way.
 *
 * The arithmetic itself belongs to the vendored calculator (calc/vendor); what is
 * added here is everything a pane needs around it and the vendor deliberately does
 * not do: the three ways a result is shown, an `ans` register, and `name = expr`
 * assignment, which the grammar has no statement for. Panes read this, never the
 * vendor, so the two cannot drift apart in the widgets.
 */

/** What every number shown by a pane is derived from, so the three forms agree. */
export interface CalcValue {
  value: number
  /** Rounded to 12 significant digits: "2073600". */
  text: string
  /** With thousands separators: "2,073,600". */
  grouped: string
  /** With hex and binary where they help: "1234 (0x4D2, 0b10011010010)". */
  described: string
}

export type CalcOutcome = ({ ok: true } & CalcValue) | { ok: false; error: string }

/** A line that assigned its result to a name carries the name back. */
export type CalcLineOutcome = CalcOutcome & { assigned?: string }

/**
 * The evaluator's own input ceiling. Kept here as well so a pane can stop the user
 * at the edge rather than letting them type into a refusal.
 */
export const CALC_MAX_INPUT = 500

/** How many names a pane's register file holds. */
export const CALC_MAX_VARS = 20

const VAR_NAME = /^[A-Za-z_][A-Za-z0-9_]{0,15}$/

/**
 * Names an assignment may not take.
 *
 * The constants are refused because shadowing `e` or `pi` turns every later line
 * into a quiet lie. Function names cannot be shadowed at all - the vendor's parser
 * looks at its function table before variables - so an assignment to one would
 * appear to work and then be ignored, which is worse than a refusal. The function
 * list is the help sheet's, which the tests call one by one.
 */
const RESERVED = new Set([
  ...Object.keys(CALC_CONSTANTS),
  'ans',
  ...CALC_FUNCTIONS.map((fn) => fn.name),
])

/** The three forms of one number. */
export function calcValue(value: number): CalcValue {
  return {
    value,
    text: formatCalcNumber(value),
    grouped: formatGrouped(value),
    described: describeCalcValue(value),
  }
}

/** Evaluates an expression. `vars` reaches the expression by name, `ans` included. */
export function evaluate(input: string, vars: Readonly<Record<string, number>> = {}): CalcOutcome {
  const result = evaluateExpression(input, { vars: { ...vars } })
  return result.ok ? { ok: true, ...calcValue(result.value) } : { ok: false, error: result.error }
}

/** `name = expression`, as the calculator pane's input line accepts it. */
const ASSIGNMENT = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([^=].*)$/s

/**
 * Evaluates one line of input, assignment included.
 *
 * Assignment lives here rather than in the grammar because the evaluator holds no
 * state by design - the register file is the pane's, and so is the rule for what may
 * go in it.
 */
export function evaluateLine(
  line: string,
  vars: Readonly<Record<string, number>> = {},
): CalcLineOutcome {
  const match = ASSIGNMENT.exec(line)
  if (!match) return evaluate(line, vars)

  const name = (match[1] ?? '').toLowerCase()
  const body = match[2] ?? ''
  if (!VAR_NAME.test(name)) return { ok: false, error: `Not a usable name: ${match[1]}` }
  if (RESERVED.has(name)) return { ok: false, error: `${name} is built in` }
  if (!Object.hasOwn(vars, name) && Object.keys(vars).length >= CALC_MAX_VARS) {
    return { ok: false, error: `No room for more than ${CALC_MAX_VARS} names` }
  }

  const result = evaluate(body, vars)
  return result.ok ? { ...result, assigned: name } : result
}

/**
 * The expression around a caret in one line of text, for the notes pane.
 *
 * Returns null when nothing there evaluates, which is what keeps the pane from
 * rewriting prose on a guess.
 */
export function evaluateAt(
  line: string,
  caret: number,
  vars: Readonly<Record<string, number>> = {},
): ({ start: number; end: number; source: string } & CalcValue) | null {
  const found = extractExpressionAt(line, caret, { vars: { ...vars } })
  if (found === null) return null
  return { start: found.start, end: found.end, source: found.text, ...calcValue(found.value) }
}

/**
 * The bits of an integer result, in nibbles, for the calculator's bit map.
 *
 * Only for values the map can show honestly: an integer that fits in 32 bits.
 * Negative values are shown as their two's complement here - unlike
 * `describeCalcValue`, which prints a sign because it has no width to complement
 * against, the map has exactly 32 columns to say it in.
 */
export function bitNibbles(value: number): readonly string[] | null {
  if (!Number.isInteger(value) || value < -0x8000_0000 || value > 0xffff_ffff) return null
  const bits = (value >>> 0).toString(2).padStart(32, '0')
  return Array.from({ length: 8 }, (_, i) => bits.slice(i * 4, i * 4 + 4))
}
