/**
 * A machine's random numbers (docs/emu.md): xorshift32, kept as a plain number in the
 * machine's state, so a snapshot goes on with the same sequence and a test with a fixed seed
 * sees the same game every time. The core never asks the page for randomness. Pure.
 */

/** A seed that xorshift can use: any 32-bit number but zero. */
export const seedOf = (seed: number): number => seed >>> 0 || 0x9e3779b9

/** The state after one step: never zero for a state that was not. */
export function xorshift32(state: number): number {
  let x = state
  x ^= x << 13
  x ^= x >>> 17
  x ^= x << 5
  return x >>> 0
}
