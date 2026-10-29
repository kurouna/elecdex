/**
 * Geometry for the second half of closing a pane: the panes that take its room
 * are laid out at their new size at once - a terminal is fitted and its shell
 * told the size once, never a size per frame (ConPTY would rewrap its history
 * to each) - and are uncovered from where their frame used to end by a clip.
 */

import { CRT_EXTEND_MS } from '../lib/crt-timing.js'
import { type Frame, px } from './geometry.js'

/** How far in from each side of its new box a pane's clip starts. */
export type Inset = Frame

/** Changes smaller than this are rounding, not room gained. */
const EPSILON_PX = 1

/**
 * Where the clip of a pane that is shown after a close starts: its old box inside
 * its new one, or, for a pane that was not shown (the tab that took the closed
 * one's place), a line across its middle, as a tube powering on. Null when the
 * pane gained no room, so it is left alone.
 */
export function extendFrom(before: Frame | undefined, after: Frame): Inset | null {
  if (before === undefined) {
    const half = (after.bottom - after.top) / 2
    return { top: half, right: 0, bottom: half, left: 0 }
  }
  const inset = {
    top: Math.max(0, before.top - after.top),
    right: Math.max(0, after.right - before.right),
    bottom: Math.max(0, after.bottom - before.bottom),
    left: Math.max(0, before.left - after.left),
  }
  const gained = Object.values(inset).some((n) => n >= EPSILON_PX)
  return gained ? inset : null
}

/** The CSS variables `crt-extend` reads its starting clip from. */
export function insetStyle(inset: Inset): string {
  return [
    `--from-top: ${px(inset.top)}`,
    `--from-right: ${px(inset.right)}`,
    `--from-bottom: ${px(inset.bottom)}`,
    `--from-left: ${px(inset.left)}`,
    `--crt-duration: ${CRT_EXTEND_MS}ms`,
  ].join('; ')
}
