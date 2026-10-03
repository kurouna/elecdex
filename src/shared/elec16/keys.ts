/**
 * The ELEC-16's keys (docs/elec16.md section 7): where each sits in the key matrix, what it
 * is called, and the characters the ROM makes of it. The ROM's key table is built from this
 * (rom.ts), and the page draws its keyboard and maps the PC's keys onto it from the same list.
 *
 * A key's code is its place in the matrix, row * 8 + column (KEYMAT reads a row as a byte).
 * The arrows, SPACE, ENTER and SHIFT share row 0, so a game reads them in one byte.
 *
 * Letters type lower case; CAPS and SHIFT each turn them to the other case (CAPS XOR SHIFT),
 * so SHIFT never gives a letter key a symbol. The 24 symbols that have no key of their own
 * are on the shifted face of the keypad, the bracket keys and the punctuation.
 *
 * BRK/ON is not in the matrix: it is wired to a line of its own (machine.brk), as on the
 * pocket computers whose break key always gets the machine back.
 */

/** Characters the ROM makes of the keys that do not type one. */
export const CONTROL = {
  bs: 0x08,
  cls: 0x0c,
  enter: 0x0d,
  ins: 0x0e,
  del: 0x0f,
  mode: 0x10,
  shift: 0x11,
  caps: 0x12,
  kana: 0x13,
  ans: 0x14,
  left: 0x1c,
  right: 0x1d,
  up: 0x1e,
  down: 0x1f,
} as const

export type ControlName = keyof typeof CONTROL

export interface MachineKey {
  /** A name for the page: the character it types, or a control's name. */
  id: string
  code: number
  /** The engraving on the key. */
  label: string
  /** The character it types, or the control it is. */
  char: number
  /** With SHIFT: a symbol, or 0 where SHIFT changes nothing but a letter's case. */
  shifted: number
}

const control = (name: ControlName, label: string) => ({
  id: name,
  label,
  char: CONTROL[name],
  shifted: 0,
})

const typed = (ch: string, shifted = '') => ({
  id: ch,
  label: ch === ' ' ? 'SPACE' : ch.toUpperCase(),
  char: ch.charCodeAt(0),
  shifted: shifted === '' ? 0 : shifted.charCodeAt(0),
})

/** The matrix, row by row; a row may leave columns free. */
const ROWS: readonly (readonly Omit<MachineKey, 'code'>[])[] = [
  [
    control('up', '↑'),
    control('down', '↓'),
    control('left', '←'),
    control('right', '→'),
    typed(' '),
    control('enter', 'ENTER'),
    control('shift', 'SHIFT'),
    control('ans', 'ANS'),
  ],
  [
    control('mode', 'MODE'),
    control('cls', 'CLS'),
    control('caps', 'CAPS'),
    control('kana', 'カナ'),
    control('ins', 'INS'),
    control('del', 'DEL'),
    control('bs', 'BS'),
  ],
  [...'qwertyui'].map((ch) => typed(ch)),
  [...'opasdfgh'].map((ch) => typed(ch)),
  [typed('j'), typed('k'), typed('l'), typed(';', ':'), ...[...'zxcv'].map((ch) => typed(ch))],
  [typed('b'), typed('n'), typed('m'), typed(',', '<'), typed('.', '>'), typed('/', '\\')],
  [
    typed('0', ']'),
    typed('1', '!'),
    typed('2', '@'),
    typed('3', '#'),
    typed('4', '$'),
    typed('5', '%'),
    typed('6', '^'),
    typed('7', '&'),
  ],
  [
    typed('8', "'"),
    typed('9', '['),
    typed('(', '{'),
    typed(')', '}'),
    typed('+', '~'),
    typed('-', '_'),
    typed('*', '"'),
    // The keypad's own divide and point, apart from the letter block's.
    { ...typed('/', '?'), id: 'kp/' },
  ],
  [{ ...typed('.', '`'), id: 'kp.' }, typed('=', '|')],
]

export const MACHINE_KEYS: readonly MachineKey[] = ROWS.flatMap((row, r) =>
  row.map((key, c) => ({ ...key, code: r * 8 + c })),
)

/** A key by its id. */
export const KEY_BY_ID: ReadonlyMap<string, MachineKey> = new Map(
  MACHINE_KEYS.map((key) => [key.id, key]),
)

/** The code of a key that must exist. */
export function keyCode(id: string): number {
  const key = KEY_BY_ID.get(id)
  if (key === undefined) throw new RangeError(`no key ${id}`)
  return key.code
}

/**
 * For a character, the key that types it and whether SHIFT goes first; null when no key
 * does. A letter is its key, its case left to CAPS and SHIFT (the caller decides).
 */
export function keyForChar(ch: string): { code: number; shift: boolean } | null {
  const lower = ch.toLowerCase()
  if (lower >= 'a' && lower <= 'z' && lower.length === 1)
    return { code: keyCode(lower), shift: false }
  const c = ch.charCodeAt(0)
  for (const key of MACHINE_KEYS) {
    if (key.char === c && c >= 0x20) return { code: key.code, shift: false }
  }
  for (const key of MACHINE_KEYS) {
    if (key.shifted === c) return { code: key.code, shift: true }
  }
  return null
}

/** The ROM's key table: two bytes a code (its character, and with SHIFT), 0 for no key. */
export function keyTable(size = 80): Uint8Array {
  const table = new Uint8Array(size * 2)
  for (const key of MACHINE_KEYS) {
    table[key.code * 2] = key.char
    table[key.code * 2 + 1] = key.shifted
  }
  return table
}
