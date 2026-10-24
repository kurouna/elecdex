import { existsSync, readFileSync } from 'node:fs'
import { sciRomFile } from '@shared/e16c/sci-rom'
import { decode, format } from '@shared/elec16/decimal'
import { BIG_PITCH, BIG_WIDTH, bigGlyphColumns, screenText } from '@shared/elec16/font'
import { Elec16 } from '@shared/elec16/machine'
import { buildRom } from '@shared/elec16/rom'
import { sciKeyCode } from '@shared/elec16/sci-keys'
import { SCI_ANNUNCIATORS } from '@shared/elec16/state'
import { settle } from './elec16-helpers.js'

/**
 * The ELEC-16 SCI ROM driven as a hand does (resources/elec16/sci, docs/elec16-sci.md): the
 * ROM built from its sources, keys pressed by their ids, and what the machine shows read back -
 * the line, the big digits, Ans and the variables in RAM. Shared by the ROM's test files.
 */

export const DIR = 'resources/elec16/sci/'
export const read = (name: string) =>
  existsSync(DIR + name) ? readFileSync(DIR + name, 'utf8') : null
export const built = buildRom((name) => {
  const file = `resources/elec16/${sciRomFile(name)}`
  return existsSync(file) ? readFileSync(file, 'utf8') : null
})

/**
 * Switched on: past the name, at the calculator's empty line - in LINE unless asked for 2D (a new
 * unit's display), as S3's tests read the line as one row of characters.
 */
export const switchOn = (display: '2d' | 'line' = 'line'): Elec16 => {
  const m = Elec16.boot(built.image, 'sci-128')
  settle(m)
  if (display === 'line') keys(m, 'setup 2 ac')
  return m
}

/** Keys pressed by their ids (sci-keys.ts), separated by spaces. */
export function keys(m: Elec16, ids: string): void {
  for (const id of ids.split(' ').filter((x) => x !== '')) {
    if (id === 'on') m.brk()
    else {
      const code = sciKeyCode(id)
      m.press(code)
      m.release(code)
    }
    settle(m)
  }
}

/** The screen's text rows, as the font reads them back (the line is on rows 0-3). */
export const rows = (m: Elec16): string[] =>
  screenText(m.state.vram, 128, 64).map((row) => row.trimEnd())

/** Ans as the unit keeps it (numbers.e16.ts KEEP_ANS), in ten digits. */
export const ans = (m: Elec16): string => {
  const d = decode(m.state.ram.subarray(0xc08, 0xc10))
  return d === null ? '?' : format(d, 10)
}

/** A variable's value (KEEP_VARS: A-F, X, Y, M, a 36-byte value each, its decimal first). */
export const variable = (m: Elec16, k: number): string => {
  const d = decode(m.state.ram.subarray(0xc30 + k * 36, 0xc38 + k * 36))
  return d === null ? '?' : format(d, 10)
}

/**
 * Ans's exact form as (p + r√s)/q in words: "1/2", "2√2", "-√3/2", "2-√3", or "-" when it has
 * none (numbers.e16.ts: the flag at 8, s at 10, p, r and q at 12, 20 and 28).
 */
export function form(m: Elec16): string {
  const ram = m.state.ram
  if (ram[0xc08 + 8] !== 1) return '-'
  const part = (at: number) => {
    const d = decode(ram.subarray(0xc08 + at, 0xc08 + at + 8))
    return d === null ? '?' : format(d, 10)
  }
  const s = (ram[0xc08 + 10] ?? 0) | ((ram[0xc08 + 11] ?? 0) << 8)
  const [p, r, q] = [part(12), part(20), part(28)]
  const top = r === '0' ? p : withRoot(p, r, s)
  return q === '1' ? top : `${top}/${q}`
}

/** p + r√s in words: r of 1 or -1 is only its sign, and p of 0 is left out. */
export function withRoot(p: string, r: string, s: number): string {
  const coefficient = ({ '1': '', '-1': '-' } as Record<string, string>)[r] ?? r
  const root = `${coefficient}√${s}`
  if (p === '0') return root
  return `${p}${root.startsWith('-') ? '' : '+'}${root}`
}

/** Whether the dot at (x, y) is on. */
export const dot = (m: Elec16, x: number, y: number): boolean =>
  (((m.state.vram[(y >> 3) * 128 + x] ?? 0) >> (y & 7)) & 1) === 1

/** The big digits on bands 6 and 7, read back from the right edge: the answer as drawn. */
export function bigText(m: Elec16, right = 127): string {
  const col = (x: number) =>
    (m.state.vram[6 * 128 + x] ?? 0) | ((m.state.vram[7 * 128 + x] ?? 0) << 8)
  const glyphs = [...'0123456789-'].map((ch) => [ch, bigGlyphColumns(ch).join(',')] as const)
  let out = ''
  let r = right
  for (;;) {
    const cols = Array.from({ length: BIG_WIDTH }, (_, k) => col(r - BIG_PITCH + 1 + k))
    const found = glyphs.find(([, key]) => key === cols.join(','))
    if (found !== undefined) {
      out = found[0] + out
      r -= BIG_PITCH
      continue
    }
    if (col(r - 2) === 0x3000 && col(r - 1) === 0x3000) {
      out = `.${out}`
      r -= 3
      continue
    }
    return out
  }
}

/**
 * The text of the row of characters whose top is at dot row `y`: the screens other than the
 * calculator's set their text off the eight-row bands (a title a dot down, lines every nine
 * rows), and a dot in from the left: `x0` is where its cells start (1 for those screens).
 * `inverted` reads it off an inverted band.
 */
export function lineAt(m: Elec16, y: number, inverted = false, x0 = 1): string {
  const band = y >> 3
  const shift = y & 7
  const one = Uint8Array.from({ length: 128 }, (_, x) => {
    // Past the right edge reads as the ground: lit on an inverted band, so it inverts to none.
    const past = inverted ? 0xff : 0
    const top = x + x0 < 128 ? (m.state.vram[band * 128 + x + x0] ?? 0) : past
    const below = x + x0 < 128 ? (m.state.vram[(band + 1) * 128 + x + x0] ?? 0) : past
    const col = ((top >> shift) | (below << (8 - shift))) & 0xff
    return (inverted ? ~col : col) & 0x7f
  })
  return (screenText(one, 128, 8)[0] ?? '').trim()
}

export const lit = (m: Elec16): string[] =>
  SCI_ANNUNCIATORS.filter((_, bit) => (m.state.lcd.annunciators & (1 << bit)) !== 0)

/** A line typed and answered: Ans, and the big digits shown. */
export function answer(line: string): { ans: string; shown: string; m: Elec16 } {
  const m = switchOn()
  keys(m, `${line} eq`)
  return { ans: ans(m), shown: bigText(m), m }
}

/** The row of line `n` (0-5) on a screen set off the bands (lcd.e16.ts lineY). */
export const lineY = (n: number): number => 11 + 9 * n

/** Text right-aligned on the row whose top is `y` (textRight puts it 3 dots past a cell's start). */
export const rightAt = (m: Elec16, y: number): string => lineAt(m, y, false, 3)

/** That text's last word. */
export const rightWord = (m: Elec16, y: number): string => rightAt(m, y).split(' ').pop() ?? ''

/** The title band's text: its words at the left, and its page (or other word) at the right. */
export const band = (m: Elec16): [string, string] => [
  lineAt(m, 1, true).split('  ')[0] ?? '',
  lineAt(m, 1, true, 3).split(' ').pop() ?? '',
]
