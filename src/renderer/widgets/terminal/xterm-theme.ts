import type { AnsiOverrides, Theme } from '@shared/theme'
import type { ISearchOptions } from '@xterm/addon-search'
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
  /** How far ANSI saturation leans toward the accent's; the theme's `ansiPull`. */
  pull?: number
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

/** How far ANSI saturation is pulled toward the accent's by default. 0 = keep, 1 = adopt. */
const SATURATION_PULL = 0.45

/**
 * With a high pull the ANSI hues lean toward the accent as well, so a monochrome
 * theme stays monochrome while red and green remain distinguishable.
 */
const HUE_PULL_FROM = 0.6

export function buildXtermTheme(input: PaletteInput, overrides?: AnsiOverrides): ITheme {
  const { hue, saturation, lightness } = input
  const pull = input.pull ?? SATURATION_PULL

  // Blend each ANSI colour's saturation toward the accent's.
  const sat = (own: number): number => own + (saturation - own) * pull
  const hueToward = (own: number): number => {
    if (pull <= HUE_PULL_FROM) return own
    const t = ((pull - HUE_PULL_FROM) / (1 - HUE_PULL_FROM)) * 0.6
    const delta = ((((hue - own) % 360) + 540) % 360) - 180
    return own + delta * t
  }

  const normal = (h: number): string => hsl(hueToward(h), sat(58), 46)
  const bright = (h: number): string => hsl(hueToward(h), sat(70), 64)

  const accent = hsl(hue, saturation, lightness)

  const derived: ITheme = {
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

  // A theme's explicit colours win, one at a time.
  for (const [name, value] of Object.entries(overrides ?? {})) {
    if (value !== undefined) (derived as Record<string, string>)[name] = value
  }
  return derived
}

/**
 * xterm's minimum contrast ratio for a theme. Shells and PSReadLine print in white
 * and bright yellow, which vanish on a light ground, so a light theme has xterm
 * darken any colour below WCAG AA (4.5:1) against the background. A dark theme
 * keeps every colour exactly as given (1 = off).
 */
export function minimumContrastRatio(mode: Theme['mode']): number {
  return mode === 'light' ? 4.5 : 1
}

/**
 * The colours the search addon paints matches with.
 *
 * They must be #rrggbb: the addon parses them itself and hands them to its own
 * decoration layer rather than to CSS, so a `hsl()` string - which every other
 * colour here is - comes out as nothing at all. The saturation has a floor so
 * that a near-monochrome theme (White, Phosphor) still marks a match visibly,
 * and a light theme tints the ground rather than darkening it.
 */
export function searchDecorations(
  input: PaletteInput,
  mode: Theme['mode'],
): NonNullable<ISearchOptions['decorations']> {
  const { hue } = input
  const saturation = Math.max(input.saturation, MIN_MATCH_SATURATION)
  const light = mode === 'light'
  const match = hslToHex(hue, saturation, light ? 80 : 26)
  const active = hslToHex(hue, saturation, light ? 62 : 46)
  return {
    matchBackground: match,
    matchOverviewRuler: match,
    activeMatchBackground: active,
    activeMatchBorder: active,
    activeMatchColorOverviewRuler: active,
  }
}

/** Below this a match on a grey theme would be the same grey as the ground. */
const MIN_MATCH_SATURATION = 35

/** An HSL colour as #rrggbb, for the few consumers that cannot take a CSS colour. */
export function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360
  const ss = clampPct(s) / 100
  const ll = clampPct(l) / 100
  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ll - c / 2
  const sextant = Math.floor(hh / 60) % 6
  const [r, g, b] = (
    [
      [c, x, 0],
      [x, c, 0],
      [0, c, x],
      [0, x, c],
      [x, 0, c],
      [c, 0, x],
    ] as const
  )[sextant] ?? [0, 0, 0]
  const byte = (n: number): string =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${byte(r)}${byte(g)}${byte(b)}`
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
    pull: Number.parseFloat(read('--terminal-ansi-pull')) || SATURATION_PULL,
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
