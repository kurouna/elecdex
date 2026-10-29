/**
 * The effects a layout node's host plays on itself, said once for both hosts: a
 * pane on its own (PaneHost.svelte) and a tab group, which powers off, extends
 * and is brought forward as one picture (TabsHost.svelte). They come out as the
 * classes styles/crt.css plays and the inline style that times and places them,
 * so an effect added here reaches both.
 */

import { CRT_CLOSE_MS } from '../lib/crt-timing.js'
import { type Inset, insetStyle } from './pane-close.js'

/** What a host is doing now, as the layout store says it. */
export interface HostMotionState {
  /** Powering off: closed, or the whole screen giving way to another layout. */
  closing: boolean
  /** Uncovering the room a closed pane left it, from this inset. */
  extend: Inset | undefined
  /** Pinned over the workspace by the zoom. */
  pinned: boolean
  /** The zoom's flight, while one plays (`layout.zoom.phase`). */
  zoomPhase: 'in' | 'out' | null
  /** Where the zoom pins the host, and its flight (`layout.zoom.style`). */
  zoomStyle: string | null
  /**
   * Powering on, with the `--crt-*` timing it plays with; null when it is not.
   * Only a pane powers on by itself: a group's tabs power on inside it.
   */
  powerOn?: string | null
}

export interface HostMotion {
  classes: Record<string, boolean>
  style: string | undefined
}

export function hostMotion(state: HostMotionState): HostMotion {
  const { closing, extend, pinned, zoomPhase } = state
  // A close or an extension takes the place of a power-on still playing, and
  // the two never run together: every change to the tree settles a close first.
  const powerOn = closing || extend !== undefined ? null : (state.powerOn ?? null)
  let own: string | null = powerOn
  if (closing) own = `--crt-duration: ${CRT_CLOSE_MS}ms`
  else if (extend !== undefined) own = insetStyle(extend)
  // Where the zoom puts it comes last, after the host's own effects.
  const parts = [own, pinned ? state.zoomStyle : null].filter((part) => part !== null)
  return {
    classes: {
      'crt-on': powerOn !== null,
      'crt-off': closing,
      'crt-beam': closing,
      'crt-extend': extend !== undefined,
      'pane-pinned': pinned,
      'crt-zoom': pinned && zoomPhase === 'in',
      'crt-zoom-out': pinned && zoomPhase === 'out',
    },
    style: parts.join('; ') || undefined,
  }
}
