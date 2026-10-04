import { compile, type E16cResult } from './compile.js'

/**
 * How the ELEC-16 PLAY ROM's screen and start screen are compiled (docs/elec16-play.md): its
 * e16c sources under resources/elec16/play, at -O2, all in the fixed ROM, their globals and
 * arrays just above the hand-written ROM's work area. One place, so `npm run gen:elec16` and
 * the test that holds play.s to the sources agree.
 */

export const PLAY_SOURCES: readonly string[] = ['play.e16.ts']

/** The PLAY ROM's own RAM: above the work area main.s keeps (0000-00FF). */
export const PLAY_DATA = { start: 0x0100, end: 0x0200 }

/**
 * Where a source of the PLAY ROM is, under resources/elec16: its own folder, but for what it
 * shares with the pocket ROM - LINK's service (link.s), one file for both.
 */
export const playRomFile = (name: string): string =>
  name === 'link.s' ? `rom/${name}` : `play/${name}`

/** Compiles it; `read` gives a source's text by its name in resources/elec16/play. */
export function compilePlay(read: (name: string) => string, opt: 0 | 1 | 2 = 2): E16cResult {
  const files = PLAY_SOURCES.map((name) => ({ name: `play/${name}`, text: read(name) }))
  return compile(files, { opt, data: PLAY_DATA })
}
