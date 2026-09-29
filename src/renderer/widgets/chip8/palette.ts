/**
 * The CHIP-8 screen's colours (docs/architecture.md section 5.18): four, for the dark
 * ground and each plane - one plane lit, the other, and both. CHIP-8 and SUPER-CHIP use
 * only the first two.
 *
 * THEME makes them from the theme: its ground, its accent, the accent sunk towards the
 * ground, and the accent at its strongest - shades of one colour, as a monochrome HUD has
 * them (with another hue in the mix, amber and phosphor clashed). A light theme draws dark
 * dots on light. ORIGINAL is the program's author's own colours, where chip8Archive gives
 * them. Pure: the page reads the CSS variables and passes them in.
 */

import type { Chip8Colours } from '@shared/chip8-library'

export type Rgb = readonly [number, number, number]
export type Palette = readonly [Rgb, Rgb, Rgb, Rgb]

export const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

export function hexRgb(hex: string): Rgb | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (m === null) return null
  const n = Number.parseInt(m[1] ?? '0', 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}

/** The theme's colours, as read from its CSS variables. */
export interface ThemeColours {
  ground: Rgb
  accent: Rgb
  strong: Rgb
}

const FALLBACK: ThemeColours = {
  ground: [0, 0, 0],
  accent: [168, 208, 210],
  strong: [214, 236, 237],
}

export function themePalette(colours: Partial<ThemeColours>): Palette {
  const ground = colours.ground ?? FALLBACK.ground
  const accent = colours.accent ?? FALLBACK.accent
  const strong = colours.strong ?? FALLBACK.strong
  return [ground, accent, mixRgb(ground, accent, 0.42), strong]
}

/** The author's colours; null where the program has none (the theme's are used). */
export function originalPalette(colours: Chip8Colours | undefined): Palette | null {
  if (colours === undefined) return null
  // The same colours give the same palette: a new one each time the pane's state changed
  // restarted the screen's afterglow and repainted every thumbnail.
  const known = madeFrom.get(colours)
  if (known !== undefined) return known
  const made = makeOriginal(colours)
  madeFrom.set(colours, made)
  return made
}

const madeFrom = new WeakMap<Chip8Colours, Palette | null>()

function makeOriginal(colours: Chip8Colours): Palette | null {
  const ground = hexRgb(colours.ground)
  const one = hexRgb(colours.plane1)
  const two = hexRgb(colours.plane2)
  const both = hexRgb(colours.both)
  if (ground === null || one === null || two === null || both === null) return null
  return [ground, one, two, both]
}
