import type { ITheme } from '@xterm/xterm'

/**
 * Derives xterm's 16-colour palette from the active design tokens.
 *
 * The original project ran `color(base).grayscale().mix(accent, 0.3)` over a
 * hardcoded Tango palette at construction time. Here the palette comes from the
 * theme's accent hue, so a theme switch restyles the terminal with no reload -
 * and the derivation is a pure function, so it is unit-testable.
 */

export interface PaletteInput {
  /** Accent hue in degrees. */
  hue: number
  /** Accent saturation as a percentage. */
  saturation: number
  /** Accent lightness as a percentage. */
  lightness: number
  foreground: string
  background: string
}

/**
 * Base hues for the ANSI colours. Red/green/yellow/blue/magenta/cyan keep their
 * own identity - a terminal where `git diff` is monochrome is unusable - but
 * their saturation is pulled toward the theme so they still read as one palette.
 */
const ANSI_HUES = {
  red: 2,
  green: 130,
  yellow: 45,
  blue: 215,
  magenta: 290,
  cyan: 186,
} as const

/** How far ANSI saturation is pulled toward the accent's. 0 = keep, 1 = adopt. */
const SATURATION_PULL = 0.45

export function buildXtermTheme(input: PaletteInput): ITheme {
  const { hue, saturation, lightness } = input

  // Blend each ANSI colour's saturation toward the accent's.
  const sat = (own: number): number => own + (saturation - own) * SATURATION_PULL

  const normal = (h: number): string => hsl(h, sat(58), 46)
  const bright = (h: number): string => hsl(h, sat(70), 64)

  const accent = hsl(hue, saturation, lightness)

  return {
    foreground: input.foreground,
    background: input.background,
    cursor: accent,
    cursorAccent: input.background,
    // selectionForeground is deliberately omitted so xterm keeps the cell's own
    // colour under a selection, which preserves syntax highlighting in `less`.
    selectionBackground: hsl(hue, saturation, lightness, 0.3),

    black: hsl(hue, Math.min(saturation, 12), 12),
    red: normal(ANSI_HUES.red),
    green: normal(ANSI_HUES.green),
    yellow: normal(ANSI_HUES.yellow),
    blue: normal(ANSI_HUES.blue),
    magenta: normal(ANSI_HUES.magenta),
    cyan: normal(ANSI_HUES.cyan),
    white: hsl(hue, Math.min(saturation, 14), 80),

    brightBlack: hsl(hue, Math.min(saturation, 10), 38),
    brightRed: bright(ANSI_HUES.red),
    brightGreen: bright(ANSI_HUES.green),
    brightYellow: bright(ANSI_HUES.yellow),
    brightBlue: bright(ANSI_HUES.blue),
    brightMagenta: bright(ANSI_HUES.magenta),
    brightCyan: bright(ANSI_HUES.cyan),
    brightWhite: hsl(hue, Math.min(saturation, 8), 95),
  }
}

/** Formats an hsl(a) colour, clamping each component to its valid range. */
export function hsl(h: number, s: number, l: number, alpha?: number): string {
  const hh = ((h % 360) + 360) % 360
  const ss = clampPct(s)
  const ll = clampPct(l)
  return alpha === undefined
    ? `hsl(${round(hh)} ${round(ss)}% ${round(ll)}%)`
    : `hsl(${round(hh)} ${round(ss)}% ${round(ll)}% / ${alpha})`
}

const clampPct = (n: number): number => Math.max(0, Math.min(100, n))
const round = (n: number): number => Math.round(n * 100) / 100

/**
 * Reads the palette inputs out of the live CSS custom properties, so the
 * terminal always matches whatever the theme currently has applied.
 */
export function paletteFromCss(el: Element): PaletteInput {
  const style = getComputedStyle(el)
  const read = (name: string): string => style.getPropertyValue(name).trim()

  return {
    hue: Number.parseFloat(read('--accent-h')) || 183,
    saturation: Number.parseFloat(read('--accent-s')) || 22,
    lightness: Number.parseFloat(read('--accent-l')) || 74,
    foreground: read('--text') || '#aacfd1',
    // Panels are transparent so the grid shows through, but xterm's WebGL
    // renderer cannot draw a transparent background (it comes out black), so the
    // terminal takes the solid ground colour instead.
    background: read('--app-bg') || '#05080d',
  }
}

/**
 * Resolves the monospace family to a concrete font stack.
 *
 * xterm must be given real family names: it measures a reference glyph to
 * derive cell width, and a `var(--font-mono)` string measures as the browser
 * default - which produces visibly wrong letter spacing and a grid that does
 * not line up with the text.
 */
export function monoFontFamily(el: Element): string {
  const value = getComputedStyle(el).getPropertyValue('--font-mono').trim()
  return value === '' ? 'ui-monospace, monospace' : value
}
