import { compile, type E16cResult } from './compile.js'

/**
 * How the ELEC-16 ROM's BASIC is compiled (docs/elec16.md section 6): its e16c sources under
 * resources/elec16/rom/basic, at -O2, their globals and arrays in BASIC's work area. One
 * place, so `npm run gen:elec16` and the test that holds basic.s to the sources agree.
 */

/**
 * The sources, in the order e16c reads them, and the ROM bank each goes in (none: the fixed
 * ROM, where the hand-written ROM calls basicCold and basicLoop).
 */
export const BASIC_SOURCES: readonly { name: string; bank?: number }[] = [
  { name: 'rom.e16.ts' },
  { name: 'text.e16.ts' },
  { name: 'edit.e16.ts' },
  { name: 'basic.e16.ts' },
  { name: 'strings.e16.ts', bank: 0 },
  { name: 'screen.e16.ts', bank: 1 },
  { name: 'files.e16.ts', bank: 2 },
  { name: 'tools.e16.ts', bank: 3 },
  { name: 'monitor.e16.ts', bank: 4 },
]

/** BASIC's own RAM, above the monitor's work area and below the program (PROG, 0800). */
export const BASIC_DATA = { start: 0x0100, end: 0x0800 }

/**
 * Compiles BASIC; `read` gives a source's text by its name in resources/elec16/rom/basic. The
 * ROM is -O2; the tests build the other levels too, as one more check of the compiler.
 */
export function compileBasic(read: (name: string) => string, opt: 0 | 1 | 2 = 2): E16cResult {
  const files = BASIC_SOURCES.map(({ name, bank }) => ({
    name: `basic/${name}`,
    text: read(name),
    ...(bank !== undefined ? { bank } : {}),
  }))
  return compile(files, { opt, data: BASIC_DATA })
}
