import { KEYBOARD_SPAN, type KeyDef } from '../keyboard'

/**
 * Where everything goes, from the canvas's size: the header across the top, the keyboard
 * along the bottom - eDEX-UI's on-screen keyboard, come back - and the field between, its
 * lanes standing over the keys that play them.
 */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Layout {
  w: number
  h: number
  pad: number
  /** How much larger than its design size the header's type is drawn: 1 at 1400 x 850. */
  scale: number
  /** One key's width, and the step from one key to the next. */
  unit: number
  /** A key cap's side. */
  cap: number
  header: Rect
  /** The lanes: from under the header to the judgement line. */
  field: Rect
  /** The judgement line. */
  line: number
  /** The top of the upper row of keys. */
  keysTop: number
  keyX(key: KeyDef): number
  keyTop(key: KeyDef): number
}

/** Room the host's KEYS lamp takes in the top right corner, kept clear. */
export const LAMP_ROOM = 64

export function layoutOf(w: number, h: number): Layout {
  const pad = Math.min(18, Math.max(8, w * 0.018))
  const scale = Math.min(1.35, Math.max(0.85, Math.min(w / 1400, h / 850)))
  const headerH = Math.round((h < 420 ? 40 : 48) * scale)
  const span = KEYBOARD_SPAN.to - KEYBOARD_SPAN.from
  const unit = Math.max(16, Math.min((w - pad * 2) / (span + 0.4), (h - headerH) / 6.6, 76))
  const keysTop = h - pad - unit * 2
  const line = keysTop - unit * 0.34
  const centre = (KEYBOARD_SPAN.from + KEYBOARD_SPAN.to) / 2
  const origin = w / 2 - centre * unit
  const fieldTop = headerH + pad * 0.5
  return {
    w,
    h,
    pad,
    scale,
    unit,
    cap: unit * 0.88,
    header: { x: pad, y: 0, w: w - pad * 2, h: headerH },
    field: {
      x: origin + KEYBOARD_SPAN.from * unit,
      y: fieldTop,
      w: span * unit,
      h: Math.max(10, line - fieldTop),
    },
    line,
    keysTop,
    keyX: (key) => origin + key.x * unit,
    keyTop: (key) => keysTop + key.row * unit,
  }
}
