/**
 * The calculator's keys (SCI-128, docs/elec16-sci.md section 5): where each sits in the key
 * matrix, what is printed on it and above it, and the short name its first ROM shows. The
 * body, the PC's keys and the ROM's name table are all made from this one list.
 *
 * A key's code is its place in the matrix, row * 8 + column, as on the pocket models. SHIFT
 * sits where the pocket keyboard has its SHIFT (code 6), and nothing where it has CAPS (code
 * 10), so the page's own note of SHIFT (runner.svelte.ts: SHIFT waits for the next key, CAPS
 * does not use it up) holds on both. ON is not in the matrix: it is the BRK line, as the
 * pocket's BRK/ON is.
 */

export type SciBlock = 'top' | 'fn' | 'num' | 'pad'

export interface SciKey {
  /** A name for the page, as the design's tables call the key. */
  id: string
  code: number
  /** What is printed on the key. */
  cap: string
  /** Printed above it, left: what it does after SHIFT ('' for nothing). */
  shift: string
  /** Printed above it, right: the letter it gives after ALPHA ('' for none). */
  alpha: string
  block: SciBlock
  /** The name the start screen shows for it: six characters at most, the machine's own. */
  name: string
}

const key = (
  id: string,
  cap: string,
  block: SciBlock,
  name: string,
  shift = '',
  alpha = '',
): Omit<SciKey, 'code'> => ({ id, cap, block, name, shift, alpha })

/** The matrix, row by row; a row may leave columns free (null). */
const ROWS: readonly (readonly (Omit<SciKey, 'code'> | null)[])[] = [
  [
    key('up', '▲', 'pad', 'UP'),
    key('down', '▼', 'pad', 'DOWN'),
    key('left', '◀', 'pad', 'LEFT'),
    key('right', '▶', 'pad', 'RIGHT'),
    key('eq', '=', 'num', '=', '≈'),
    key('ac', 'AC', 'num', 'AC'),
    key('shift', 'SHIFT', 'top', 'SHIFT'),
    key('alpha', 'ALPHA', 'top', 'ALPHA'),
  ],
  [
    key('menu', 'MENU', 'top', 'MENU'),
    key('setup', 'SETUP', 'top', 'SETUP'),
    // Code 10 is the pocket's CAPS: left free (see above).
    null,
    key('func', 'FUNC', 'top', 'FUNC'),
    key('sto', 'STO', 'top', 'STO', 'RCL'),
    key('fd', 'F⇄D', 'top', 'F/D', 'ENG'),
    key('del', 'DEL', 'num', 'DEL'),
    key('ans', 'ANS', 'num', 'ANS'),
  ],
  [
    key('frac', 'a/b', 'fn', 'A/B', 'a b/c'),
    key('sq', 'x²', 'fn', 'X^2', '√■'),
    key('cube', 'x³', 'fn', 'X^3', '∛'),
    key('pow', 'xʸ', 'fn', 'X^Y', 'ʸ√x'),
    key('log', 'LOG', 'fn', 'LOG', '10ˣ'),
    key('ln', 'LN', 'fn', 'LN', 'eˣ'),
    key('exp', 'EXP', 'num', 'EXP', 'π', 'e'),
  ],
  [
    key('neg', '(−)', 'fn', '(-)', 'ABS', 'A'),
    key('dms', '°′″', 'fn', 'DMS', '→DMS', 'B'),
    key('hyp', 'HYP', 'fn', 'HYP', '', 'C'),
    key('sin', 'SIN', 'fn', 'SIN', 'SIN⁻¹', 'D'),
    key('cos', 'COS', 'fn', 'COS', 'COS⁻¹', 'E'),
    key('tan', 'TAN', 'fn', 'TAN', 'TAN⁻¹', 'F'),
  ],
  [
    key('fx', 'f(x)', 'fn', 'F(X)', 'FIND X'),
    key('inv', 'x⁻¹', 'fn', 'X^-1', 'x!'),
    key('ncr', 'nCr', 'fn', 'NCR', 'nPr'),
    key('lp', '(', 'fn', '(', ',', 'X'),
    key('rp', ')', 'fn', ')', '', 'Y'),
    key('mplus', 'M+', 'fn', 'M+', 'M−', 'M'),
  ],
  [
    key('7', '7', 'num', '7'),
    key('8', '8', 'num', '8'),
    key('9', '9', 'num', '9'),
    key('mul', '×', 'num', '*'),
    key('div', '÷', 'num', '/'),
  ],
  [
    key('4', '4', 'num', '4'),
    key('5', '5', 'num', '5'),
    key('6', '6', 'num', '6'),
    key('add', '+', 'num', '+'),
    key('sub', '−', 'num', '-'),
  ],
  [
    key('1', '1', 'num', '1'),
    key('2', '2', 'num', '2'),
    key('3', '3', 'num', '3'),
    key('0', '0', 'num', '0'),
    key('dot', '.', 'num', '.'),
  ],
]

export const SCI_KEYS: readonly SciKey[] = ROWS.flatMap((row, r) =>
  row.flatMap((k, c) => (k === null ? [] : [{ ...k, code: r * 8 + c }])),
)

/** A key by its id. */
export const SCI_KEY_BY_ID: ReadonlyMap<string, SciKey> = new Map(SCI_KEYS.map((k) => [k.id, k]))

/** A key's code by its id; throws for a name that is no key (a slip in the page's tables). */
export function sciKeyCode(id: string): number {
  const k = SCI_KEY_BY_ID.get(id)
  if (k === undefined) throw new RangeError(`no calculator key ${id}`)
  return k.code
}

/** The longest name the start screen shows. */
export const SCI_NAME_LENGTH = 6

/**
 * The ROM's table of names: SCI_NAME_LENGTH bytes a code for every code the matrix has room
 * for, zero-padded; a code with no key has an empty name.
 */
export function sciNameTable(size: number): Uint8Array {
  const table = new Uint8Array(size * SCI_NAME_LENGTH)
  for (const k of SCI_KEYS) {
    for (let i = 0; i < k.name.length; i++)
      table[k.code * SCI_NAME_LENGTH + i] = k.name.charCodeAt(i)
  }
  return table
}
