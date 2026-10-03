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

/** 0x7F: a solid block, for the cursor and for bars. */
const BLOCK = '##### ##### ##### ##### ##### ##### #####'

/** Every code the table does not draw yet (kana and symbols come later): an empty box. */
const UNKNOWN = '##### #...# #...# #...# #...# #...# #####'

export const FIRST_CODE = 0x20
export const CELL_WIDTH = 6
export const CELL_HEIGHT = 8

/** A glyph's rows, for a character code. */
function rowsOf(code: number): string[] {
  const rows = code === 0x7f ? BLOCK : (ASCII[code - FIRST_CODE] ?? UNKNOWN)
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
const BY_COLUMNS: ReadonlyMap<string, string> = new Map(
  Array.from({ length: 0x80 - FIRST_CODE }, (_, k) => {
    const code = k + FIRST_CODE
    return [keyOf(glyphColumns(code), 0), code === 0x7f ? '█' : String.fromCharCode(code)]
  }),
)

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
