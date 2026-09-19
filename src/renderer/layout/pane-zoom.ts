/**
 * Geometry for bringing one pane to the front of the workspace: the box it is
 * pinned in, and the transform that carries it there from where it sat.
 *
 * The pane is never resized a step at a time - a terminal would send every
 * transient size to its shell, which ConPTY rewraps its history to (the same
 * reason a close uncovers its neighbours with a clip). Instead the pane is put
 * at its final size at once and flown there with a transform, which the
 * compositor plays and which no widget can feel.
 */

import type { Frame } from './pane-close.js'

/**
 * How a widget is brought to the front, which the registry says for each
 * (widgets/registry.ts): over most of the workspace, or as a panel in the middle
 * of it. A widget that says neither is not brought forward at all - most of the
 * readouts have nothing more to show at any size, and a hand's width of nothing
 * around three figures is worse than the pane they came from.
 */
export type ZoomMode = 'full' | 'panel'

/** How much of the workspace a pane brought to the front covers. */
export const ZOOM_FRACTION = 0.9

/**
 * The largest a panel is, in CSS pixels. Wide enough for a calculator's tape, a
 * timer's laps or a mixer's faders side by side, and no wider: past this a
 * widget that fills its column would only be spreading the same rows out.
 */
export const PANEL_BOX = { w: 880, h: 560 } as const
/** How long it takes to fly out to that box. */
export const CRT_ZOOM_MS = 260
/** And back to its place, a little quicker, as a picture collapsing. */
export const CRT_UNZOOM_MS = 220

/** The transform that puts an element pinned at its new box back over its old one. */
export interface Flip {
  dx: number
  dy: number
  sx: number
  sy: number
}

const width = (frame: Frame): number => frame.right - frame.left
const height = (frame: Frame): number => frame.bottom - frame.top
const centre = (frame: Frame): { x: number; y: number } => ({
  x: (frame.left + frame.right) / 2,
  y: (frame.top + frame.bottom) / 2,
})
const empty = (frame: Frame): boolean => width(frame) <= 0 || height(frame) <= 0

/**
 * The box a zoomed pane fills, centred in the workspace: nine tenths of it for a
 * full one, and at most a panel's own size for a panel - which in a small window
 * is those same nine tenths, since a panel must never be the larger of the two.
 */
export function zoomBox(area: Frame, mode: ZoomMode): Frame | null {
  if (empty(area)) return null
  // The kept size first, then what is left over: (1 - fraction) alone loses a
  // pixel's fraction to binary rounding, and the box would not be centred.
  const full = { w: width(area) * ZOOM_FRACTION, h: height(area) * ZOOM_FRACTION }
  const size =
    mode === 'panel' ? { w: Math.min(full.w, PANEL_BOX.w), h: Math.min(full.h, PANEL_BOX.h) } : full
  const insetX = (width(area) - size.w) / 2
  const insetY = (height(area) - size.h) / 2
  return {
    top: area.top + insetY,
    right: area.right - insetX,
    bottom: area.bottom - insetY,
    left: area.left + insetX,
  }
}

/**
 * The transform, about the element's centre, that draws an element laid out at
 * `after` where `before` is. Null when either box has no area, as in a test
 * without layout: there is then nothing to fly.
 */
export function flipFrom(before: Frame, after: Frame): Flip | null {
  if (empty(before) || empty(after)) return null
  const from = centre(before)
  const to = centre(after)
  return {
    dx: from.x - to.x,
    dy: from.y - to.y,
    sx: width(before) / width(after),
    sy: height(before) / height(after),
  }
}

const px = (n: number): string => `${Math.round(n)}px`
const ratio = (n: number): string => String(Number(n.toFixed(4)))

/** The CSS variables `crt-pinned` places the pane with, and `crt-zoom` flies it by. */
export function pinStyle(box: Frame, flip: Flip | null, duration: number): string {
  const parts = [
    `--zoom-top: ${px(box.top)}`,
    `--zoom-left: ${px(box.left)}`,
    `--zoom-width: ${px(width(box))}`,
    `--zoom-height: ${px(height(box))}`,
  ]
  if (flip !== null) {
    parts.push(
      `--zoom-dx: ${px(flip.dx)}`,
      `--zoom-dy: ${px(flip.dy)}`,
      `--zoom-sx: ${ratio(flip.sx)}`,
      `--zoom-sy: ${ratio(flip.sy)}`,
      `--crt-duration: ${duration}ms`,
    )
  }
  return parts.join('; ')
}
