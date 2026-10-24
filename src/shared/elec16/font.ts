/**
 * The ELEC-16's own 5 x 7 font (docs/elec16.md section 5, character set), drawn for it row
 * by row: '#' a dot, '.' none. The ROM's font table is built from this (rom.ts), and the page
 * reads the screen back into text with it - for a screen reader, and for tests.
 *
 * A character takes a cell of 6 x 8 dots: five columns and a gap, seven rows and a gap. In
 * video memory a byte is a column of eight dots, bit 0 at the top, so a cell is six bytes
 * and a text row is one band of bytes.
 */

/** 0x20 to 0x7E, in order. */
const ASCII: readonly string[] = [
  '..... ..... ..... ..... ..... ..... .....', // 20 space
  '..#.. ..#.. ..#.. ..#.. ..#.. ..... ..#..', // 21 !
  '.#.#. .#.#. .#.#. ..... ..... ..... .....', // 22 "
  '.#.#. .#.#. ##### .#.#. ##### .#.#. .#.#.', // 23 #
  '..#.. .#### #.#.. .###. ..#.# ####. ..#..', // 24 $
  '##... ##..# ...#. ..#.. .#... #..## ...##', // 25 %
  '.##.. #..#. #.#.. .#... #.#.# #..#. .##.#', // 26 &
  '..#.. ..#.. .#... ..... ..... ..... .....', // 27 '
  '...#. ..#.. .#... .#... .#... ..#.. ...#.', // 28 (
  '.#... ..#.. ...#. ...#. ...#. ..#.. .#...', // 29 )
  '..... ..#.. #.#.# .###. #.#.# ..#.. .....', // 2A *
  '..... ..#.. ..#.. ##### ..#.. ..#.. .....', // 2B +
  '..... ..... ..... ..... .##.. ..#.. .#...', // 2C ,
  '..... ..... ..... ##### ..... ..... .....', // 2D -
  '..... ..... ..... ..... ..... .##.. .##..', // 2E .
  '..... ....# ...#. ..#.. .#... #.... .....', // 2F /
  '.###. #...# #..## #.#.# ##..# #...# .###.', // 30 0
  '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.', // 31 1
  '.###. #...# ....# ...#. ..#.. .#... #####', // 32 2
  '##### ...#. ..#.. ...#. ....# #...# .###.', // 33 3
  '...#. ..##. .#.#. #..#. ##### ...#. ...#.', // 34 4
  '##### #.... ####. ....# ....# #...# .###.', // 35 5
  '..##. .#... #.... ####. #...# #...# .###.', // 36 6
  '##### ....# ...#. ..#.. .#... .#... .#...', // 37 7
  '.###. #...# #...# .###. #...# #...# .###.', // 38 8
  '.###. #...# #...# .#### ....# ...#. .##..', // 39 9
  '..... .##.. .##.. ..... .##.. .##.. .....', // 3A :
  '..... .##.. .##.. ..... .##.. ..#.. .#...', // 3B ;
  '...#. ..#.. .#... #.... .#... ..#.. ...#.', // 3C <
  '..... ..... ##### ..... ##### ..... .....', // 3D =
  '.#... ..#.. ...#. ....# ...#. ..#.. .#...', // 3E >
  '.###. #...# ....# ...#. ..#.. ..... ..#..', // 3F ?
  '.###. #...# ....# .##.# #.#.# #.#.# .###.', // 40 @
  '.###. #...# #...# #...# ##### #...# #...#', // 41 A
  '####. #...# #...# ####. #...# #...# ####.', // 42 B
  '.###. #...# #.... #.... #.... #...# .###.', // 43 C
  '###.. #..#. #...# #...# #...# #..#. ###..', // 44 D
  '##### #.... #.... ####. #.... #.... #####', // 45 E
  '##### #.... #.... ####. #.... #.... #....', // 46 F
  '.###. #...# #.... #.### #...# #...# .####', // 47 G
  '#...# #...# #...# ##### #...# #...# #...#', // 48 H
  '.###. ..#.. ..#.. ..#.. ..#.. ..#.. .###.', // 49 I
  '..### ...#. ...#. ...#. ...#. #..#. .##..', // 4A J
  '#...# #..#. #.#.. ##... #.#.. #..#. #...#', // 4B K
  '#.... #.... #.... #.... #.... #.... #####', // 4C L
  '#...# ##.## #.#.# #.#.# #...# #...# #...#', // 4D M
  '#...# #...# ##..# #.#.# #..## #...# #...#', // 4E N
  '.###. #...# #...# #...# #...# #...# .###.', // 4F O
  '####. #...# #...# ####. #.... #.... #....', // 50 P
  '.###. #...# #...# #...# #.#.# #..#. .##.#', // 51 Q
  '####. #...# #...# ####. #.#.. #..#. #...#', // 52 R
  '.#### #.... #.... .###. ....# ....# ####.', // 53 S
  '##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..', // 54 T
  '#...# #...# #...# #...# #...# #...# .###.', // 55 U
  '#...# #...# #...# #...# #...# .#.#. ..#..', // 56 V
  '#...# #...# #...# #.#.# #.#.# #.#.# .#.#.', // 57 W
  '#...# #...# .#.#. ..#.. .#.#. #...# #...#', // 58 X
  '#...# #...# .#.#. ..#.. ..#.. ..#.. ..#..', // 59 Y
  '##### ....# ...#. ..#.. .#... #.... #####', // 5A Z
  '.###. .#... .#... .#... .#... .#... .###.', // 5B [
  '..... #.... .#... ..#.. ...#. ....# .....', // 5C \
  '.###. ...#. ...#. ...#. ...#. ...#. .###.', // 5D ]
  '..#.. .#.#. #...# ..... ..... ..... .....', // 5E ^
  '..... ..... ..... ..... ..... ..... #####', // 5F _
  '.#... ..#.. ...#. ..... ..... ..... .....', // 60 `
  '..... ..... .###. ....# .#### #...# .####', // 61 a
  '#.... #.... #.##. ##..# #...# #...# ####.', // 62 b
  '..... ..... .###. #.... #.... #...# .###.', // 63 c
  '....# ....# .##.# #..## #...# #...# .####', // 64 d
  '..... ..... .###. #...# ##### #.... .###.', // 65 e
  '..##. .#..# .#... ###.. .#... .#... .#...', // 66 f
  '..... .#### #...# #...# .#### ....# .###.', // 67 g
  '#.... #.... #.##. ##..# #...# #...# #...#', // 68 h
  '..#.. ..... .##.. ..#.. ..#.. ..#.. .###.', // 69 i
  '...#. ..... ..##. ...#. ...#. #..#. .##..', // 6A j
  '#.... #.... #..#. #.#.. ##... #.#.. #..#.', // 6B k
  '.##.. ..#.. ..#.. ..#.. ..#.. ..#.. .###.', // 6C l
  '..... ..... ##.#. #.#.# #.#.# #...# #...#', // 6D m
  '..... ..... #.##. ##..# #...# #...# #...#', // 6E n
  '..... ..... .###. #...# #...# #...# .###.', // 6F o
  '..... ..... ####. #...# ####. #.... #....', // 70 p
  '..... ..... .##.# #..## .#### ....# ....#', // 71 q
  '..... ..... #.##. ##..# #.... #.... #....', // 72 r
  '..... ..... .###. #.... .###. ....# ####.', // 73 s
  '.#... .#... ###.. .#... .#... .#..# ..##.', // 74 t
  '..... ..... #...# #...# #...# #..## .##.#', // 75 u
  '..... ..... #...# #...# #...# .#.#. ..#..', // 76 v
  '..... ..... #...# #...# #.#.# #.#.# .#.#.', // 77 w
  '..... ..... #...# .#.#. ..#.. .#.#. #...#', // 78 x
  '..... ..... #...# #...# .#### ....# .###.', // 79 y
  '..... ..... ##### ...#. ..#.. .#... #####', // 7A z
  '...#. ..#.. ..#.. .#... ..#.. ..#.. ...#.', // 7B {
  '..#.. ..#.. ..#.. ..#.. ..#.. ..#.. ..#..', // 7C |
  '.#... ..#.. ..#.. ...#. ..#.. ..#.. .#...', // 7D }
  '..... ..... .#... #.#.# ...#. ..... .....', // 7E ~
]

/** 0xA1 to 0xDF: the half-width kana (JIS X 0201), drawn for the ELEC-16. */
const KANA: readonly string[] = [
  '..... ..... ..... ..... ###.. #.#.. ###..', // A1 。
  '.###. .#... .#... .#... ..... ..... .....', // A2 「
  '..... ..... ..... ...#. ...#. ...#. .###.', // A3 」
  '..... ..... ..... ..... #.... .#... ..#..', // A4 、
  '..... ..... ..... .##.. .##.. ..... .....', // A5 ・
  '##### ....# ##### ....# ...#. ..#.. .#...', // A6 ヲ
  '..... ..... ##### ...#. ..##. ..#.. .#...', // A7 ァ
  '..... ..... ...#. ..#.. .##.. #.#.. ..#..', // A8 ィ
  '..... ..... ..#.. ##### #...# ...#. ..#..', // A9 ゥ
  '..... ..... ..... ##### ..#.. ..#.. #####', // AA ェ
  '..... ..... ...#. ##### ..##. .#.#. #..#.', // AB ォ
  '..... ..... .#... ##### .#.#. .#... .#...', // AC ャ
  '..... ..... ..... ###.. ..#.. ..#.. #####', // AD ュ
  '..... ..... ####. ...#. ####. ...#. ####.', // AE ョ
  '..... ..... ..... #.#.# #.#.# ...#. ..#..', // AF ッ
  '..... ..... ..... ##### ..... ..... .....', // B0 ー
  '##### ....# ..##. ..#.. ..#.. .#... #....', // B1 ア
  '....# ...#. ..#.. .##.. #.#.. ..#.. ..#..', // B2 イ
  '..#.. ##### #...# #...# ....# ...#. ..#..', // B3 ウ
  '..... ##### ..#.. ..#.. ..#.. ..#.. #####', // B4 エ
  '...#. ##### ...#. ..##. .#.#. #..#. ...#.', // B5 オ
  '..#.. ##### ..#.# ..#.# .#..# .#..# #..##', // B6 カ
  '..#.. ##### ..#.. ##### ..#.. ..#.. ..#..', // B7 キ
  '.#### .#..# #...# ....# ...#. ..#.. .#...', // B8 ク
  '.#... .#### #..#. ...#. ...#. ..#.. .#...', // B9 ケ
  '..... ##### ....# ....# ....# ##### .....', // BA コ
  '.#.#. ##### .#.#. .#.#. ...#. ..#.. .#...', // BB サ
  '##... ....# ##..# ....# ...#. ..#.. ##...', // BC シ
  '##### ....# ...#. ..#.. .#.#. #...# .....', // BD ス
  '.#... ##### .#..# .#.#. .#... .#... ..###', // BE セ
  '#...# #...# .#..# ....# ...#. ..#.. .#...', // BF ソ
  '.#### .#..# #.#.# ...## ...#. ..#.. .#...', // C0 タ
  '...#. ###.. ..#.. ##### ..#.. ..#.. .#...', // C1 チ
  '#.#.# #.#.# #.#.# ....# ...#. ..#.. .#...', // C2 ツ
  '.###. ..... ##### ..#.. ..#.. .#... #....', // C3 テ
  '.#... .#... .##.. .#.#. .#... .#... .#...', // C4 ト
  '..#.. ##### ..#.. ..#.. ..#.. .#... #....', // C5 ナ
  '..... .###. ..... ..... ..... ##### .....', // C6 ニ
  '##### ....# .#.#. ..#.. .#.#. #.... .....', // C7 ヌ
  '..#.. ##### ...#. ..#.. .###. #.#.# ..#..', // C8 ネ
  '....# ....# ....# ...#. ..#.. .#... #....', // C9 ノ
  '..... .#.#. .#.#. .#..# #...# #...# .....', // CA ハ
  '#.... #.... #...# ###.. #.... #.... .####', // CB ヒ
  '##### ....# ....# ...#. ..#.. .#... #....', // CC フ
  '..... .#... #.#.. ...#. ....# ..... .....', // CD ヘ
  '..#.. ##### ..#.. #.#.# #.#.# ..#.. ..#..', // CE ホ
  '##### ....# ...#. #.#.. .#... ..#.. .....', // CF マ
  '.###. ..... .###. ..... .###. ....# .....', // D0 ミ
  '..#.. ..#.. .#... .#... #..#. ##### ....#', // D1 ム
  '....# .#..# ..##. ..#.. .#.#. #.... .....', // D2 メ
  '##### ..#.. ##### ..#.. ..#.. ..#.. ..###', // D3 モ
  '.#... ##### .#..# .#.#. .#... .#... .#...', // D4 ヤ
  '..... ####. ...#. ...#. ...#. ##### .....', // D5 ユ
  '##### ....# ....# ##### ....# ....# #####', // D6 ヨ
  '.###. ..... ##### ....# ...#. ..#.. .#...', // D7 ラ
  '#...# #...# #...# ....# ...#. ..#.. .#...', // D8 リ
  '..#.. #.#.. #.#.. #.#.# #.#.# #.##. #.#..', // D9 ル
  '#.... #.... #.... #...# #..#. #.#.. ##...', // DA レ
  '..... ##### #...# #...# #...# ##### .....', // DB ロ
  '##### #...# ....# ...#. ..#.. .#... .....', // DC ワ
  '#.... .#..# ....# ....# ...#. ..#.. ##...', // DD ン
  '#.#.. .#.#. ..... ..... ..... ..... .....', // DE ゛
  '.#... #.#.. .#... ..... ..... ..... .....', // DF ゜
]

/**
 * 0x80 on: the symbols a calculator writes (docs/elec16-sci.md section 4.3), drawn for the
 * ELEC-16 and there on every model (BASIC's CHR$ shows them too). Each has the text it is on a
 * PC: EXPORT writes it, IMPORT reads it back, the screen reader hears it. Two are two code
 * points: ⁻¹ is one cell here, and x0304 has no precomposed character in Unicode.
 */
export const SYMBOLS: readonly {
  readonly code: number
  readonly text: string
  readonly rows: string
}[] = [
  { code: 0x80, text: 'π', rows: '..... ##### .#.#. .#.#. .#.#. .#..# .....' },
  { code: 0x81, text: '×', rows: '..... #...# .#.#. ..#.. .#.#. #...# .....' },
  { code: 0x82, text: '÷', rows: '..... ..#.. ..... ##### ..... ..#.. .....' },
  { code: 0x83, text: '√', rows: '..... ....# ...#. #.#.. .##.. ..#.. .....' },
  { code: 0x84, text: '²', rows: '.##.. #..#. ..#.. .#... ####. ..... .....' },
  { code: 0x85, text: '³', rows: '###.. ...#. .##.. ...#. ###.. ..... .....' },
  { code: 0x86, text: '⁻¹', rows: '...#. ..##. ##.#. ...#. ..### ..... .....' },
  { code: 0x87, text: 'ᴇ', rows: '..... ..... .###. .#... .##.. .#... .###.' },
  { code: 0x88, text: '°', rows: '.##.. #..#. .##.. ..... ..... ..... .....' },
  { code: 0x89, text: '′', rows: '...#. ..#.. .#... ..... ..... ..... .....' },
  { code: 0x8a, text: '″', rows: '..#.# .#.#. #.#.. ..... ..... ..... .....' },
  { code: 0x8b, text: '▶', rows: '#.... ##... ###.. ####. ###.. ##... #....' },
  { code: 0x8c, text: '◀', rows: '...#. ..##. .###. ####. .###. ..##. ...#.' },
  { code: 0x8d, text: '▲', rows: '..... ..#.. .###. ##### ..... ..... .....' },
  { code: 0x8e, text: '▼', rows: '..... ..... ##### .###. ..#.. ..... .....' },
  { code: 0x8f, text: '⇄', rows: '...#. ##### ...#. ..... .#... ##### .#...' },
  { code: 0x90, text: 'Σ', rows: '##### #.... .#... ..#.. .#... #.... #####' },
  { code: 0x91, text: 'σ', rows: '..... ..... .#### #..#. #..#. #..#. .##..' },
  { code: 0x92, text: '₁', rows: '..... ..... ..... .#... ##... .#... ###..' },
  { code: 0x93, text: '₂', rows: '..... ..... ..... ##... ..#.. .#... ###..' },
  { code: 0x94, text: '→', rows: '..... ..#.. ...#. ##### ...#. ..#.. .....' },
  // x and a combining macron; y with a macron is one character (U+0233).
  { code: 0x95, text: 'x\u0304', rows: '##### ..... #...# .#.#. ..#.. .#.#. #...#' },
  { code: 0x96, text: '\u0233', rows: '##### ..... #...# .#.#. ..#.. ..#.. ..#..' },
]

const SYMBOL_ROWS: ReadonlyMap<number, string> = new Map(SYMBOLS.map((s) => [s.code, s.rows]))

/** 0x7F: a solid block, for the cursor and for bars. */
const BLOCK = '##### ##### ##### ##### ##### ##### #####'

/** Every code the table does not draw (97-9F and E0-FF, kept for symbols): an empty box. */
const UNKNOWN = '##### #...# #...# #...# #...# #...# #####'

export const FIRST_CODE = 0x20
export const CELL_WIDTH = 6
export const CELL_HEIGHT = 8

/** A glyph's rows, for a character code. */
function rowsOf(code: number): string[] {
  const rows =
    code === 0x7f
      ? BLOCK
      : code >= 0xa1 && code <= 0xdf
        ? (KANA[code - 0xa1] ?? UNKNOWN)
        : code >= 0x80
          ? (SYMBOL_ROWS.get(code) ?? UNKNOWN)
          : (ASCII[code - FIRST_CODE] ?? UNKNOWN)
  return rows.split(' ')
}

/** A glyph as five column bytes, bit 0 the top row - as video memory holds it. */
export function glyphColumns(code: number): number[] {
  const rows = rowsOf(code)
  const columns: number[] = []
  for (let x = 0; x < 5; x++) {
    let byte = 0
    rows.forEach((row, y) => {
      if (row[x] === '#') byte |= 1 << y
    })
    columns.push(byte)
  }
  return columns
}

/** The ROM's table: five bytes for every code from 0x20 to 0xFF. */
export function fontTable(): Uint8Array {
  const table = new Uint8Array((0x100 - FIRST_CODE) * 5)
  for (let code = FIRST_CODE; code < 0x100; code++) {
    table.set(glyphColumns(code), (code - FIRST_CODE) * 5)
  }
  return table
}

const keyOf = (columns: ArrayLike<number>, at: number): string =>
  `${columns[at]},${columns[at + 1]},${columns[at + 2]},${columns[at + 3]},${columns[at + 4]}`

/** Each drawn glyph by its five columns, to read a cell back into its character. */
const BY_COLUMNS: ReadonlyMap<string, string> = new Map([
  // A symbol reads back as the text EXPORT writes for it, and so does a kana (U+FF61 on);
  // both first, so that ASCII's own wins where one is drawn as it is (the long vowel mark as -).
  ...SYMBOLS.map((s): [string, string] => [keyOf(glyphColumns(s.code), 0), s.text]),
  ...Array.from({ length: 0xdf - 0xa1 + 1 }, (_, k): [string, string] => [
    keyOf(glyphColumns(0xa1 + k), 0),
    String.fromCharCode(0xff61 + k),
  ]),
  ...Array.from({ length: 0x80 - FIRST_CODE }, (_, k): [string, string] => {
    const code = k + FIRST_CODE
    return [keyOf(glyphColumns(code), 0), code === 0x7f ? '█' : String.fromCharCode(code)]
  }),
])

/**
 * The text a 1-bit screen shows, one string a row of cells: each cell read back through the
 * font. A cell that is no character (a drawing, half a glyph) reads as '?'; an empty one as a
 * space. Only the first plane is read, which on a four-shade screen is where text is drawn.
 */
export function screenText(vram: ArrayLike<number>, width: number, height: number): string[] {
  const columns = Math.floor(width / CELL_WIDTH)
  const lines: string[] = []
  for (let row = 0; row < Math.floor(height / CELL_HEIGHT); row++) {
    let line = ''
    for (let col = 0; col < columns; col++) {
      const at = row * width + col * CELL_WIDTH
      // The gap column must be clear too, or it is not a character cell.
      const glyph = (vram[at + 5] ?? 0) === 0 ? BY_COLUMNS.get(keyOf(vram, at)) : undefined
      line += glyph ?? '?'
    }
    lines.push(line)
  }
  return lines
}

/*
 * The calculator's big digits (docs/elec16-sci.md section 4.3): seven segments two dots thick
 * on a 7 x 14 cell, the corners filled so each stroke reads as one line; the point is 2 x 2.
 * Columns of 14 bits, bit 0 the top row. A minus is the middle bar one dot longer each way.
 */
export const BIG_WIDTH = 7
export const BIG_HEIGHT = 14
export const BIG_PITCH = 8
const SEGMENTS: Readonly<Record<string, readonly [number, number, number, number]>> = {
  a: [2, 0, 4, 1],
  b: [5, 2, 6, 5],
  c: [5, 8, 6, 11],
  d: [2, 12, 4, 13],
  e: [0, 8, 1, 11],
  f: [0, 2, 1, 5],
  g: [1, 6, 5, 7],
}
const DIGIT_SEGMENTS: Readonly<Record<string, string>> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  '-': 'g',
}
/** Where two segments meet: a 2 x 2 corner, filled when either is drawn. */
const CORNERS: readonly (readonly [number, number, string])[] = [
  [0, 0, 'af'],
  [5, 0, 'ab'],
  [0, 6, 'feg'],
  [5, 6, 'bcg'],
  [0, 12, 'ed'],
  [5, 12, 'cd'],
]

/** The characters there are big glyphs for: the digits, the minus and the point. */
export const BIG_CHARS = '0123456789-.'

/** A big glyph's columns: seven for a digit or the minus, two for the point. */
export function bigGlyphColumns(ch: string): number[] {
  if (ch === '.') return [0x3000, 0x3000]
  const segments = DIGIT_SEGMENTS[ch]
  if (segments === undefined) throw new RangeError(`no big glyph for ${ch}`)
  const columns = new Array<number>(BIG_WIDTH).fill(0)
  const fill = (x0: number, y0: number, x1: number, y1: number): void => {
    for (let x = x0; x <= x1; x++)
      for (let y = y0; y <= y1; y++) columns[x] = (columns[x] ?? 0) | (1 << y)
  }
  for (const s of segments) {
    const box = SEGMENTS[s]
    if (box !== undefined) fill(...box)
  }
  if (ch !== '-') {
    for (const [x, y, meets] of CORNERS) {
      if ([...meets].some((s) => segments.includes(s))) fill(x, y, x + 1, y + 1)
    }
  }
  return columns
}
