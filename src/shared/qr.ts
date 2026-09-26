import type { QrEcc, UtilityPane, WifiAuth } from './utility.js'

/**
 * The UTILITY pane's QR (docs/architecture.md section 5.16): what a code says,
 * how it is drawn and in what colours, pure. The code itself is made in the
 * page (renderer/lib/qr-code.ts), whose library main never loads.
 *
 * A code is always dark modules on a light ground. A reader turns the picture
 * into black and white by brightness, so the hue does not matter - but the way
 * round does: an inverted code (light on dark) is still refused by readers
 * that do not try both ways, ZXing's among them by default.
 */

/** The most bytes a code carries at each error correction level (version 40, byte mode). */
export const QR_CAPACITY: Record<QrEcc, number> = { L: 2953, M: 2331, Q: 1663, H: 1273 }

/** Modules of light ground kept around a code: the quiet zone the standard asks for. */
export const QR_QUIET = 4

const encoder = new TextEncoder()

export const utf8Length = (text: string): number => encoder.encode(text).length

/** `\ ; , : "` escaped, as the Wi-Fi format asks. */
const escapeWifi = (value: string): string => value.replace(/([\\;,:"])/g, '\\$1')

export interface WifiFields {
  ssid: string
  auth: WifiAuth
  password: string
  hidden: boolean
}

/** A network a phone joins by pointing its camera at it: `WIFI:T:WPA;S:name;P:secret;;`. */
export function wifiPayload({ ssid, auth, password, hidden }: WifiFields): string {
  if (ssid === '') return ''
  const secret = auth === 'nopass' ? '' : `P:${escapeWifi(password)};`
  return `WIFI:T:${auth};S:${escapeWifi(ssid)};${secret}${hidden ? 'H:true;' : ''};`
}

/** An address as typed, with `https://` in front when it names no scheme. */
export function urlPayload(input: string): string {
  const trimmed = input.trim()
  if (trimmed === '') return ''
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** What the pane's code says, from its choices and the password main unsealed. */
export function qrPayload(pane: UtilityPane, password: string): string {
  switch (pane.qrKind) {
    case 'text':
      return pane.qrText
    case 'url':
      return urlPayload(pane.qrUrl)
    case 'wifi':
      return wifiPayload({
        ssid: pane.wifiSsid,
        auth: pane.wifiAuth,
        password,
        hidden: pane.wifiHidden,
      })
  }
}

export interface QrCode {
  /** Modules on a side. */
  size: number
  /** 1 to 40. */
  version: number
  /** `size * size`, row by row: 1 for a dark module. */
  modules: Uint8Array
  bytes: number
}

export type Rgb = readonly [number, number, number]

/** A colour as a canvas normalises it (`#rrggbb`, `rgb()` or `rgba()`); null for anything else. */
export function parseRgb(css: string): Rgb | null {
  const value = css.trim()
  const hex = /^#([0-9a-f]{6})$/i.exec(value)?.[1]
  if (hex !== undefined) {
    const n = Number.parseInt(hex, 16)
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(value)
  if (rgb === null) return null
  return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
}

/** WCAG's relative luminance. */
export function luminance([r, g, b]: Rgb): number {
  const channel = (v: number): number => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** Below this the theme's colours are not trusted to scan: black on white instead. */
export const QR_MIN_CONTRAST = 4

export interface QrColours {
  dark: Rgb
  light: Rgb
  /** False when the theme's colours were not enough and black on white stands in. */
  themed: boolean
}

const BLACK: Rgb = [0, 0, 0]
const WHITE: Rgb = [255, 255, 255]

/**
 * The code's colours from the theme's: on a dark theme the ground's colour for
 * the modules on the accent, on a light one the text's on the ground - the first
 * pair that is dark on light with contrast enough.
 */
export function qrColours(theme: {
  accent: Rgb | null
  ground: Rgb | null
  text: Rgb | null
}): QrColours {
  const { accent, ground, text } = theme
  const pairs: Array<[Rgb | null, Rgb | null]> = [
    [ground, accent],
    [ground, text],
    [text, ground],
    [accent, ground],
  ]
  for (const [dark, light] of pairs) {
    if (dark === null || light === null) continue
    if (luminance(light) > luminance(dark) && contrastRatio(dark, light) >= QR_MIN_CONTRAST) {
      return { dark, light, themed: true }
    }
  }
  return { dark: BLACK, light: WHITE, themed: false }
}

/**
 * The code as RGBA pixels, `scale` pixels to a module, with the quiet zone
 * round it: what the pane draws and what COPY puts on the clipboard.
 */
export function qrPixels(
  code: QrCode,
  colours: QrColours,
  scale: number,
): { width: number; data: Uint8ClampedArray<ArrayBuffer> } {
  const side = (code.size + QR_QUIET * 2) * scale
  const data = new Uint8ClampedArray(side * side * 4)
  for (let y = 0; y < side; y += 1) {
    const row = Math.floor(y / scale) - QR_QUIET
    for (let x = 0; x < side; x += 1) {
      const col = Math.floor(x / scale) - QR_QUIET
      const inside = row >= 0 && col >= 0 && row < code.size && col < code.size
      const [r, g, b] =
        inside && code.modules[row * code.size + col] === 1 ? colours.dark : colours.light
      const at = (y * side + x) * 4
      data[at] = r
      data[at + 1] = g
      data[at + 2] = b
      data[at + 3] = 255
    }
  }
  return { width: side, data }
}
