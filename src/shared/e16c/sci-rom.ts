import { compile, type E16cResult } from './compile.js'

/**
 * How the ELEC-16 SCI ROM's screen and start screen are compiled (docs/elec16-sci.md): its
 * e16c sources under resources/elec16/sci, at -O2, all in the fixed ROM for now, their globals
 * and arrays just above the hand-written ROM's work area. One place, so `npm run gen:elec16`
 * and the test that holds sci.s to the sources agree - as play-rom.ts is for PLAY.
 */

/**
 * The sources, in the order e16c reads them, and the ROM bank each goes in (none: the fixed
 * ROM, where main.s calls calcCold and calcLoop): the evaluation in bank 0, the screens other
 * than the calculator's in bank 1, the exact forms in 2, the 2D layout in 3 and the editing of
 * templates in 4, reached through far_call (docs/elec16-sci.md section 6.1).
 */
export const SCI_SOURCES: readonly { name: string; bank?: number }[] = [
  { name: 'lcd.e16.ts' },
  { name: 'tokens.e16.ts' },
  { name: 'numbers.e16.ts' },
  { name: 'calc.e16.ts' },
  { name: 'eval.e16.ts', bank: 0 },
  { name: 'screens.e16.ts', bank: 1 },
  { name: 'exact.e16.ts', bank: 2 },
  { name: 'layout.e16.ts', bank: 3 },
  { name: 'edit.e16.ts', bank: 4 },
]

/**
 * The SCI ROM's own RAM: above the work area main.s keeps (0000-00FF), below what it keeps
 * when the power goes (numbers.e16.ts KEEP, 0C00 on).
 */
export const SCI_DATA = { start: 0x0100, end: 0x0c00 }

/** Where a source of the SCI ROM is, under resources/elec16. */
export const sciRomFile = (name: string): string => `sci/${name}`

/** Compiles it; `read` gives a source's text by its name in resources/elec16/sci. */
export function compileSci(read: (name: string) => string, opt: 0 | 1 | 2 = 2): E16cResult {
  const files = SCI_SOURCES.map(({ name, bank }) => ({
    name: `sci/${name}`,
    text: read(name),
    ...(bank !== undefined ? { bank } : {}),
  }))
  return compile(files, { opt, data: SCI_DATA })
}
