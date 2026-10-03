/**
 * Small things every emulator pane writes the same way (docs/emu.md): numbers in hex, and a
 * pane state's value read back with a default.
 */

/** A number in hex, upper case, padded to `digits`: what CORE and MEM print. */
export const hex = (value: number, digits: number): string =>
  value.toString(16).toUpperCase().padStart(digits, '0')

/** A value read from pane state when it is one of `options`, else `fallback`. */
export const oneOf = <T extends string | number>(
  value: unknown,
  options: readonly T[],
  fallback: T,
): T => ((options as readonly unknown[]).includes(value) ? (value as T) : fallback)
