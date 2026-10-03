/**
 * What an e16c source imports (docs/elec16.md section 6, e16c): the word types, and the
 * built-in functions. e16c reads the names and ignores the import; run as TypeScript (the
 * tests run the same source both ways), these are the functions, over a memory of 64 KB
 * that `e16cMemory` gives and resets.
 *
 * The rules a source keeps so both ways agree: arithmetic that may leave 16 bits says so with
 * `wrap16`, division is `div`, an array's address is `addr` - an array is not a number.
 */

export type u16 = number
export type i16 = number
export type u8 = number
export type bool = boolean

interface Runtime {
  memory: Uint8Array
  /** Where the next array goes, and the next string (in the ROM's half). */
  data: number
  rom: number
  ecall: (service: number, args: number[]) => number
  csr: Map<number, number>
}

const DATA = 0x0100
const ROM = 0x8000

let rt: Runtime = fresh()

function fresh(): Runtime {
  return {
    memory: new Uint8Array(0x10000),
    data: DATA,
    rom: ROM,
    ecall: () => 0,
    csr: new Map(),
  }
}

/** A new memory for a run: arrays from `data`, ECALL answered by `ecall`. */
export function e16cMemory(
  options: { data?: number; ecall?: (service: number, args: number[]) => number } = {},
): Uint8Array {
  rt = fresh()
  rt.data = options.data ?? DATA
  if (options.ecall !== undefined) rt.ecall = options.ecall
  return rt.memory
}

export const peek = (a: u16): u8 => rt.memory[a & 0xffff] ?? 0
export const peek16 = (a: u16): u16 =>
  (rt.memory[a & 0xffff] ?? 0) | ((rt.memory[(a + 1) & 0xffff] ?? 0) << 8)

export function poke(a: u16, v: u8): void {
  rt.memory[a & 0xffff] = v & 0xff
}

export function poke16(a: u16, v: u16): void {
  rt.memory[a & 0xffff] = v & 0xff
  rt.memory[(a + 1) & 0xffff] = (v >> 8) & 0xff
}

/**
 * Division as the machine does it: towards zero, all ones for a division by zero, and -32768
 * divided by -1 is itself.
 */
export function div(a: number, b: number): number {
  if (b === 0) return a < 0 ? -1 : 0xffff
  if (a === -32768 && b === -1) return a
  return Math.trunc(a / b)
}

/** A value held to 16 bits, where arithmetic may have left them. */
export const wrap16 = (v: number): u16 => v & 0xffff

/** A word read unsigned, 0 to 65535 (the machine changes nothing). */
export const u16 = (v: number): u16 => v & 0xffff

/** A word read signed, -32768 to 32767 (the machine changes nothing). */
export const i16 = (v: number): i16 => (v << 16) >> 16

/** A word's low byte (the machine masks it too). */
export const u8 = (v: number): u8 => v & 0xff

export const ecall = (service: u16, ...args: u16[]): u16 => rt.ecall(service, args) & 0xffff

export const csrr = (n: u16): u16 => rt.csr.get(n) ?? 0

export function csrw(n: u16, v: u16): void {
  rt.csr.set(n, v & 0xffff)
}

export function wfi(): void {}

/** Assembly runs only on the machine. */
export function asm(_strings: TemplateStringsArray): void {
  throw new Error('asm runs only on the machine')
}

function take(size: number, from: 'data' | 'rom'): number {
  const at = rt[from]
  rt[from] += size + (size & 1)
  return at
}

/** An array of `count` bytes in RAM. */
export function bytes(count: u16): u8[] {
  const at = take(count, 'data')
  return rt.memory.subarray(at, at + count) as unknown as u8[]
}

/** An array of `count` words in RAM. */
export function words(count: u16): u16[] {
  const at = take(count * 2, 'data')
  return new Uint16Array(rt.memory.buffer, at, count) as unknown as u16[]
}

/** A string's address: its bytes, ended by a zero, in ROM. */
export function str(text: string): u16 {
  const at = take(text.length + 1, 'rom')
  for (let k = 0; k < text.length; k++) rt.memory[at + k] = text.charCodeAt(k)
  rt.memory[at + text.length] = 0
  return at
}

/** An array's address. */
export function addr(array: u8[] | u16[]): u16 {
  return (array as unknown as Uint8Array).byteOffset
}
