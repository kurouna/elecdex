/**
 * The CRT power-off as frames a Svelte transition can play (styles/crt.css has it
 * as keyframes, for panes). A dialog closes with a Svelte transition rather than
 * a class, because Svelte then plays it back cleanly when the dialog is opened
 * again before it has gone; a class would leave the dialog collapsed.
 */

import { CRT_CLOSE_MS } from '../layout/pane-close.js'

/** How long a dialog or a notice takes to power off, as a pane does. */
export const POWER_OFF_MS = CRT_CLOSE_MS
/** How long a dialog's power-on runs (the dialogs' `--crt-duration`). */
export const DIALOG_ON_MS = 380

/** Where in the power-off the picture has become the line, and the dot. */
const LINE_AT = 0.45
const DOT_AT = 0.8
/** Where in the power-on the line has appeared (crt-power-on's 6% keyframe). */
const LINE_SHOWN_AT = 0.06

const lerp = (from: number, to: number, k: number) => from + (to - from) * k
/** CSS `ease-in`, near enough: crt-power-off eases each of its steps in. */
const easeIn = (k: number) => k * k

/**
 * The style `progress` (0 to 1) into the power-off: squeeze to the line, shrink to
 * the dot, fade. `base` is a transform the element already has, kept in front of
 * the scale (Svelte's animate:flip holds a leaving element in place with one).
 */
export function powerOffStyle(progress: number, base = ''): string {
  const p = Math.min(Math.max(progress, 0), 1)
  let x = 1
  let y: number
  let brightness: number
  let opacity = 1
  if (p < LINE_AT) {
    const k = easeIn(p / LINE_AT)
    y = lerp(1, 0.004, k)
    brightness = lerp(1, 4, k)
  } else if (p < DOT_AT) {
    const k = easeIn((p - LINE_AT) / (DOT_AT - LINE_AT))
    x = lerp(1, 0.02, k)
    y = 0.004
    brightness = lerp(4, 6, k)
  } else {
    const k = easeIn((p - DOT_AT) / (1 - DOT_AT))
    x = lerp(0.02, 0, k)
    y = lerp(0.004, 0, k)
    brightness = 6
    opacity = 1 - k
  }
  const n = (v: number) => Number(v.toFixed(4))
  const scale = `scale(${n(x)}, ${n(y)})`
  return `transform: ${base ? `${base} ${scale}` : scale}; filter: brightness(${n(brightness)}); opacity: ${n(opacity)};`
}

/** A computed `rgb()`/`rgba()` colour with its alpha scaled by `t`, for a shade fading out. */
export function fadeShade(shade: string, t: number): string {
  const [r = 0, g = 0, b = 0, a = 1] = (shade.match(/[\d.]+/g) ?? []).map(Number)
  return `rgba(${r}, ${g}, ${b}, ${Number((a * t).toFixed(3))})`
}

/**
 * How long a dialog opening `sinceClose` ms after another began to close waits
 * before powering on, so that it opens out of the line the other has just become:
 * one picture handing over to the next, as a set changing channel.
 */
export function handoffDelay(sinceClose: number): number {
  const lineAt = LINE_AT * POWER_OFF_MS - LINE_SHOWN_AT * DIALOG_ON_MS
  return Math.round(Math.max(0, lineAt - sinceClose))
}
