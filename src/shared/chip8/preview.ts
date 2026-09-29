/**
 * A program's preview (docs/architecture.md section 5.18): one frame of its screen, packed
 * small enough to ship for every bundled program in the library's list, and drawn by the
 * page in whatever colours it is showing - the theme's or the author's.
 *
 * `scripts/gen-chip8.mjs` runs each program for a few seconds with no key pressed and keeps
 * the frame `pickPreview` chooses; main makes one the same way for a program imported.
 * Pure, as the rest of the core.
 */

import { Chip8 } from './machine.js'
import { HIRES, LORES, type MachineConfig } from './types.js'

export interface Preview {
  /** 64 x 32 or 128 x 64. */
  w: number
  h: number
  /** 1 for CHIP-8 and SUPER-CHIP, 2 for XO-CHIP (a bit per plane). */
  planes: 1 | 2
  /** The dots, a bit each, plane after plane, row by row, in base64. */
  data: string
}

/** A screen as the machine holds it: a byte a dot, bits 0 and 1 for the planes. */
export interface ScreenFrame {
  w: number
  h: number
  pixels: Uint8Array
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Base64 by hand: the core has no Node Buffer and no DOM btoa. */
function toBase64(bytes: Uint8Array): string {
  let out = ''
  for (let k = 0; k < bytes.length; k += 3) {
    const a = bytes[k] ?? 0
    const b = bytes[k + 1] ?? 0
    const c = bytes[k + 2] ?? 0
    const n = (a << 16) | (b << 8) | c
    out += BASE64[(n >> 18) & 63] ?? ''
    out += BASE64[(n >> 12) & 63] ?? ''
    out += k + 1 < bytes.length ? (BASE64[(n >> 6) & 63] ?? '') : '='
    out += k + 2 < bytes.length ? (BASE64[n & 63] ?? '') : '='
  }
  return out
}

function fromBase64(text: string): Uint8Array | null {
  if (text.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(text)) return null
  const pad = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0
  const out = new Uint8Array((text.length / 4) * 3 - pad)
  let at = 0
  for (let k = 0; k < text.length; k += 4) {
    let n = 0
    for (let j = 0; j < 4; j++) {
      const ch = text[k + j] ?? '='
      n = (n << 6) | (ch === '=' ? 0 : BASE64.indexOf(ch))
    }
    for (let j = 0; j < 3 && at < out.length; j++) out[at++] = (n >> (16 - 8 * j)) & 255
  }
  return out
}

export function encodePreview(frame: ScreenFrame, planes: 1 | 2): Preview {
  const size = frame.w * frame.h
  const bits = new Uint8Array((size * planes) / 8)
  for (let plane = 0; plane < planes; plane++) {
    for (let k = 0; k < size; k++) {
      if (((frame.pixels[k] ?? 0) >> plane) & 1) {
        const bit = plane * size + k
        bits[bit >> 3] = (bits[bit >> 3] ?? 0) | (0x80 >> (bit & 7))
      }
    }
  }
  return { w: frame.w, h: frame.h, planes, data: toBase64(bits) }
}

/** A preview's bits, when its size is a screen's and its data holds every dot of it. */
function previewBits(preview: Preview): Uint8Array | null {
  const known =
    (preview.w === LORES.w && preview.h === LORES.h) ||
    (preview.w === HIRES.w && preview.h === HIRES.h)
  if (!known || (preview.planes !== 1 && preview.planes !== 2)) return null
  const bits = fromBase64(preview.data)
  return bits !== null && bits.length === (preview.w * preview.h * preview.planes) / 8 ? bits : null
}

/** A preview as a byte a dot, as the machine holds a screen; null for one that is not whole. */
export function decodePreview(preview: Preview): ScreenFrame | null {
  const bits = previewBits(preview)
  if (bits === null) return null
  const size = preview.w * preview.h
  const pixels = new Uint8Array(size)
  for (let plane = 0; plane < preview.planes; plane++) {
    for (let k = 0; k < size; k++) {
      const bit = plane * size + k
      if (((bits[bit >> 3] ?? 0) >> (7 - (bit & 7))) & 1)
        pixels[k] = (pixels[k] ?? 0) | (1 << plane)
    }
  }
  return { w: preview.w, h: preview.h, pixels }
}

/** How much a frame shows: its lit dots, and how far it is from blank or full. */
export const litDots = (frame: ScreenFrame): number => {
  let lit = 0
  const size = frame.w * frame.h
  for (let k = 0; k < size; k++) if (frame.pixels[k]) lit++
  return lit
}

/**
 * The frame that shows the program best, from frames taken as it ran: the one with the
 * most lit dots - a title screen, a board laid out - leaving out any almost all lit (a
 * flash, a wipe). The earliest wins a tie. Null when every frame is blank.
 */
export function pickPreview(frames: readonly ScreenFrame[]): ScreenFrame | null {
  let best: ScreenFrame | null = null
  let bestLit = 0
  for (const frame of frames) {
    const lit = litDots(frame)
    if (lit > frame.w * frame.h * 0.85) continue
    if (lit > bestLit) {
      best = frame
      bestLit = lit
    }
  }
  return best
}

/** How long a program is run for its preview, and how often a frame is taken, in frames. */
export const PREVIEW_FRAMES = 600
export const PREVIEW_EVERY = 10

export interface PreviewRun {
  preview: Preview | null
  /** The keys the program asked about in that time, one bit each. */
  sensed: number
}

/**
 * Runs a program with no key pressed for ten seconds of its time and keeps the frame that
 * shows it best, and which keys it looked at. A program that stops early is shown as it
 * stopped. A fixed seed, so the same bytes always give the same preview.
 */
export function previewRun(program: Uint8Array, config: MachineConfig): PreviewRun {
  const machine = Chip8.load(program, config, 0x5eed)
  const frames: ScreenFrame[] = []
  const take = (): void => {
    const { hires, pixels } = machine.state
    const w = hires ? HIRES.w : LORES.w
    const h = hires ? HIRES.h : LORES.h
    frames.push({ w, h, pixels: pixels.slice(0, w * h) })
  }
  for (let k = 1; k <= PREVIEW_FRAMES && machine.running; k++) {
    machine.frame()
    if (k % PREVIEW_EVERY === 0) take()
  }
  if (!machine.running) take()
  const best = pickPreview(frames)
  return {
    preview: best === null ? null : encodePreview(best, config.platform === 'xochip' ? 2 : 1),
    sensed: machine.state.sensed,
  }
}
