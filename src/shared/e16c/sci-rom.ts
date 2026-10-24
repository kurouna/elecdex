import { compile, type E16cResult } from './compile.js'

/**
 * How the ELEC-16 SCI ROM's screen and start screen are compiled (docs/elec16-sci.md): its
 * e16c sources under resources/elec16/sci, at -O2, all in the fixed ROM for now, their globals
 * and arrays just above the hand-written ROM's work area. One place, so `npm run gen:elec16`
 * and the test that holds sci.s to the sources agree - as play-rom.ts is for PLAY.
 */

export const SCI_SOURCES: readonly string[] = ['sci.e16.ts']

/** The SCI ROM's own RAM: above the work area main.s keeps (0000-00FF). */
export const SCI_DATA = { start: 0x0100, end: 0x0400 }

/** Where a source of the SCI ROM is, under resources/elec16. */
export const sciRomFile = (name: string): string => `sci/${name}`

/** Compiles it; `read` gives a source's text by its name in resources/elec16/sci. */
export function compileSci(read: (name: string) => string, opt: 0 | 1 | 2 = 2): E16cResult {
  const files = SCI_SOURCES.map((name) => ({ name: `sci/${name}`, text: read(name) }))
  return compile(files, { opt, data: SCI_DATA })
}
