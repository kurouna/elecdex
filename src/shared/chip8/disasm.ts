/**
 * Instructions as Octo writes them (docs/architecture.md section 5.18), for the pane's
 * CORE view: `v3 += 0x01`, `if v4 -key then`, `sprite v0 v1 4`.
 *
 * Data-driven: a table of masks and the text each one makes, first match wins. A word
 * no instruction matches is shown as its two bytes, as Octo's decompiler does.
 */

export interface Disassembly {
  text: string
  /** How many words the instruction takes: two for XO-CHIP's F000 NNNN. */
  words: 1 | 2
}

interface Fields {
  /** The X nibble as a number, for FN01's plane. */
  xn: number
  x: string
  y: string
  n: number
  nn: string
  nnn: string
  next: string
}

const hex = (value: number, digits: number): string =>
  `0x${value.toString(16).toUpperCase().padStart(digits, '0')}`
const reg = (index: number): string => `v${index.toString(16)}`

const RULES: readonly (readonly [mask: number, value: number, text: (f: Fields) => string])[] = [
  [0xffff, 0x00e0, () => 'clear'],
  [0xffff, 0x00ee, () => 'return'],
  [0xffff, 0x00fb, () => 'scroll-right'],
  [0xffff, 0x00fc, () => 'scroll-left'],
  [0xffff, 0x00fd, () => 'exit'],
  [0xffff, 0x00fe, () => 'lores'],
  [0xffff, 0x00ff, () => 'hires'],
  [0xfff0, 0x00c0, (f) => `scroll-down ${f.n}`],
  [0xfff0, 0x00d0, (f) => `scroll-up ${f.n}`],
  [0xf000, 0x1000, (f) => `jump ${f.nnn}`],
  [0xf000, 0x2000, (f) => `call ${f.nnn}`],
  [0xf000, 0x3000, (f) => `if ${f.x} != ${f.nn} then`],
  [0xf000, 0x4000, (f) => `if ${f.x} == ${f.nn} then`],
  [0xf00f, 0x5000, (f) => `if ${f.x} != ${f.y} then`],
  [0xf00f, 0x5002, (f) => `save ${f.x} - ${f.y}`],
  [0xf00f, 0x5003, (f) => `load ${f.x} - ${f.y}`],
  [0xf000, 0x6000, (f) => `${f.x} := ${f.nn}`],
  [0xf000, 0x7000, (f) => `${f.x} += ${f.nn}`],
  [0xf00f, 0x8000, (f) => `${f.x} := ${f.y}`],
  [0xf00f, 0x8001, (f) => `${f.x} |= ${f.y}`],
  [0xf00f, 0x8002, (f) => `${f.x} &= ${f.y}`],
  [0xf00f, 0x8003, (f) => `${f.x} ^= ${f.y}`],
  [0xf00f, 0x8004, (f) => `${f.x} += ${f.y}`],
  [0xf00f, 0x8005, (f) => `${f.x} -= ${f.y}`],
  [0xf00f, 0x8006, (f) => `${f.x} >>= ${f.y}`],
  [0xf00f, 0x8007, (f) => `${f.x} =- ${f.y}`],
  [0xf00f, 0x800e, (f) => `${f.x} <<= ${f.y}`],
  [0xf00f, 0x9000, (f) => `if ${f.x} == ${f.y} then`],
  [0xf000, 0xa000, (f) => `i := ${f.nnn}`],
  [0xf000, 0xb000, (f) => `jump0 ${f.nnn}`],
  [0xf000, 0xc000, (f) => `${f.x} := random ${f.nn}`],
  [0xf000, 0xd000, (f) => `sprite ${f.x} ${f.y} ${f.n}`],
  [0xf0ff, 0xe09e, (f) => `if ${f.x} -key then`],
  [0xf0ff, 0xe0a1, (f) => `if ${f.x} key then`],
  [0xffff, 0xf000, (f) => `i := long ${f.next}`],
  [0xffff, 0xf002, () => 'audio'],
  [0xf0ff, 0xf001, (f) => `plane ${f.xn}`],
  [0xf0ff, 0xf007, (f) => `${f.x} := delay`],
  [0xf0ff, 0xf00a, (f) => `${f.x} := key`],
  [0xf0ff, 0xf015, (f) => `delay := ${f.x}`],
  [0xf0ff, 0xf018, (f) => `buzzer := ${f.x}`],
  [0xf0ff, 0xf01e, (f) => `i += ${f.x}`],
  [0xf0ff, 0xf029, (f) => `i := hex ${f.x}`],
  [0xf0ff, 0xf030, (f) => `i := bighex ${f.x}`],
  [0xf0ff, 0xf033, (f) => `bcd ${f.x}`],
  [0xf0ff, 0xf03a, (f) => `pitch := ${f.x}`],
  [0xf0ff, 0xf055, (f) => `save ${f.x}`],
  [0xf0ff, 0xf065, (f) => `load ${f.x}`],
  [0xf0ff, 0xf075, (f) => `saveflags ${f.x}`],
  [0xf0ff, 0xf085, (f) => `loadflags ${f.x}`],
]

/** The instruction `op`; `next` is the word after it, read only by F000 NNNN. */
export function disassemble(op: number, next = 0): Disassembly {
  const fields: Fields = {
    xn: (op >> 8) & 0xf,
    x: reg((op >> 8) & 0xf),
    y: reg((op >> 4) & 0xf),
    n: op & 0xf,
    nn: hex(op & 0xff, 2),
    nnn: hex(op & 0xfff, 3),
    next: hex(next & 0xffff, 4),
  }
  const rule = RULES.find(([mask, value]) => (op & mask) === value)
  if (rule === undefined) return { text: `${hex(op >> 8, 2)} ${hex(op & 0xff, 2)}`, words: 1 }
  return { text: rule[2](fields), words: op === 0xf000 ? 2 : 1 }
}
