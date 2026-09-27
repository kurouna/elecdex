import type { Canvas2D, Surface, Theme } from '../../elecdex-plugin'

/**
 * What every drawing function is handed: the context, the theme's colours and faces, and
 * a few helpers. Colours come from the theme, never from here, so every theme - the light
 * one too - draws the game in its own colours.
 */

export interface Paint {
  g: Canvas2D
  w: number
  h: number
  c: Theme['colors']
  fonts: Theme['fonts']
  /** A light theme: marks are dark, and glows must not add light. */
  light: boolean
  /** Motion reduced: what only decorates is left out. */
  reduced: boolean
}

export function paintOf(surface: Surface, theme: Theme): Paint {
  return {
    g: surface.g,
    w: surface.w,
    h: surface.h,
    c: theme.colors,
    fonts: theme.fonts,
    light: theme.mode === 'light',
    reduced: theme.reducedMotion,
  }
}

const RGB = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/i
const HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i

/**
 * A colour at `a` of its own opacity. The host hands colours as the page computed them
 * (`rgb(...)`, `rgba(...)`); a colour in any other form is returned as it is.
 */
export function alpha(color: string, a: number): string {
  const rgb = RGB.exec(color)
  if (rgb !== null) {
    const own = rgb[4] === undefined ? 1 : Number(rgb[4]) / (rgb[5] === '%' ? 100 : 1)
    return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${round(own * a)})`
  }
  const hex = HEX.exec(color)
  if (hex !== null) {
    const own = hex[4] === undefined ? 1 : Number.parseInt(hex[4], 16) / 255
    const [r, g, b] = [hex[1], hex[2], hex[3]].map((h) => Number.parseInt(h ?? '0', 16))
    return `rgba(${r}, ${g}, ${b}, ${round(own * a)})`
  }
  return color
}

const round = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 1000) / 1000

export const font = (weight: number, size: number, family: string): string =>
  `${weight} ${Math.max(1, Math.round(size * 10) / 10)}px ${family}`

export interface TextStyle {
  font: string
  color: string
  align?: 'left' | 'right' | 'center'
  baseline?: 'top' | 'middle' | 'alphabetic' | 'bottom'
  /** Letter spacing, as a CSS length. */
  spacing?: string
}

/** Writes a line and answers how wide it was. */
export function write(p: Paint, text: string, x: number, y: number, style: TextStyle): number {
  const g = p.g
  g.font = style.font
  g.fillStyle = style.color
  g.textAlign = style.align ?? 'left'
  g.textBaseline = style.baseline ?? 'alphabetic'
  g.letterSpacing = style.spacing ?? '0px'
  g.fillText(text, x, y)
  const width = g.measureText(text).width
  g.letterSpacing = '0px'
  return width
}

/** How wide a line would be written. */
export function measure(p: Paint, text: string, style: TextStyle): number {
  const g = p.g
  g.font = style.font
  g.letterSpacing = style.spacing ?? '0px'
  const width = g.measureText(text).width
  g.letterSpacing = '0px'
  return width
}

/** A line cut short with an ellipsis to fit `room`; empty when not even that fits. */
export function fitted(p: Paint, text: string, room: number, style: TextStyle): string {
  if (measure(p, text, style) <= room) return text
  for (let n = text.length - 1; n > 0; n--) {
    const cut = `${text.slice(0, n).trimEnd()}…`
    if (measure(p, cut, style) <= room) return cut
  }
  return ''
}

/** eDEX's rule: a hairline with a short tick standing at each end. */
export function rule(p: Paint, x: number, y: number, w: number, color: string): void {
  const g = p.g
  g.fillStyle = color
  g.fillRect(x, y, w, 1)
  g.fillRect(x, y - 3, 1, 7)
  g.fillRect(x + w - 1, y - 3, 1, 7)
}

/** A figure with its leading zeros dimmed, as a counter shows it: 0084215. */
export function counter(
  p: Paint,
  value: number,
  digits: number,
  x: number,
  y: number,
  size: number,
  color: string,
): number {
  const text = String(Math.max(0, Math.round(value))).padStart(digits, '0')
  const lead = text.length - String(Math.max(0, Math.round(value))).length
  const style = { font: font(600, size, p.fonts.mono), color: alpha(color, 0.28) }
  let at = x
  at += write(p, text.slice(0, lead), at, y, style)
  at += write(p, text.slice(lead), at, y, { ...style, color })
  return at - x
}

export const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n))

/** 0 to 1 over `ms` from `since`; 1 when motion is reduced. */
export const progress = (p: Paint, now: number, since: number, ms: number): number =>
  p.reduced ? 1 : clamp((now - since) / ms, 0, 1)
