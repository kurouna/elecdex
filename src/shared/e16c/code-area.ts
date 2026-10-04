/**
 * CODE's layout and the texts it starts from (docs/elec16.md section 6, CODE), apart from
 * program.ts so the page can name them without loading e16c (TypeScript's parser): only
 * CODE's worker and the tests import program.ts.
 */

/** Where the program's code and strings go, and where its globals and arrays do. */
export const CODE_START = 0x7000
export const CODE_END = 0x7800
export const DATA_START = 0x7800
export const DATA_END = 0x7bf0
/** Where a measured program returns to: a breakpoint, never run. */
export const RETURN_AT = 0x7bfe

/** The name the library's errors carry. */
export const LIBRARY_FILE = 'ELEC16'

/**
 * The ROM's services (ECALL n) and a few helpers, compiled with every program: e16c reads no
 * imports, so a program calls these by name. Not exported, so -O2 drops what is not used.
 */
export const LIBRARY = `// ELEC-16 library for CODE: the ROM's services, by ECALL.
function putc(c: u16): void { ecall(0, c) }
function puts(text: u16): void { ecall(1, text) }
function getkey(): u16 { return ecall(2) }
function cls(): void { ecall(3) }
function locate(column: u16, row: u16): void { ecall(4, column, row) }
function puthex(v: u16): void { ecall(5, v) }
function newline(): void { ecall(6) }
function readline(buf: u16, max: u16): i16 { return i16(ecall(7, buf, max)) }
function askAs(type: u16, question: u16, reply: u16, max: u16): i16 {
  return i16(ecall(8, question, reply, max, type))
}
function ask(question: u16, reply: u16, max: u16): i16 { return askAs(0, question, reply, max) }
function askNew(): void { poke16(0xff70, 2) }
function putnum(v: u16): void {
  if (v >= 10) putnum(div(v, 10))
  putc(0x30 + (v % 10))
}
function keyWaiting(): bool { return peek16(0xff12) !== 0 }
function beep(freq: u16, ms: u16): void {
  poke16(0xff40, freq)
  poke16(0xff42, ms)
}
function pset(x: u16, y: u16): void {
  const width = peek16(0xff20)
  const height = peek16(0xff22)
  if (x >= width || y >= height) return
  const at = 0xe000 + (y >> 3) * width + x
  const bit: u16 = 1 << (y & 7)
  poke(at, peek(at) | bit)
  if (peek16(0xff24) === 2) {
    const b = at + div(width * height, 8)
    poke(b, peek(b) | bit)
  }
}
`

/** The program CODE starts with. */
export const SAMPLE = `// A program for the ELEC-16, in the subset of TypeScript e16c compiles.
// main() runs on CALL 28672 (BASIC) or G 7000 (the monitor), and returns to it.
// The library: putc puts cls locate newline putnum puthex getkey keyWaiting beep pset
// readline ask askAs askNew.

const GREETING = str('HELLO FROM TYPESCRIPT')

export function main(): void {
  cls()
  puts(GREETING)
  newline()
  for (let n: u16 = 1; n <= 10; n++) {
    putnum(n * n)
    putc(0x20)
  }
  newline()
}
`

/** The most cycles a measurement runs: past it, the program is said to be still going. */
export const MEASURE_LIMIT = 20_000_000
