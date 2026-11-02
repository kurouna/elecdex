/**
 * A theme's number variable (`--accent-h`, `--accent-s` as `0%`, `--glow`) as a number, for a
 * canvas or the terminal to paint with. Only a variable that is missing or not a number takes
 * `fallback`: 0 is a value - Paper's ink has no hue and no colour, and `|| fallback` once drew
 * it in TRON's teal.
 */
export function cssNumber(style: CSSStyleDeclaration, name: string, fallback: number): number {
  const value = Number.parseFloat(style.getPropertyValue(name))
  return Number.isNaN(value) ? fallback : value
}
