/**
 * The effects a layout node's host plays on itself, said once for both hosts: a
 * pane on its own (PaneHost.svelte) and a tab group, which powers off, extends,
 * lands, flares and is brought forward as one picture (TabsHost.svelte). They
 * come out as the classes styles/crt.css plays and the inline style that times
 * and places them, so an effect added here reaches both.
 */

import { CRT_CLOSE_MS, CRT_FLARE_MS } from '../lib/crt-timing.js'
import { type Inset, insetStyle } from './pane-close.js'
import { type Edges, edgeStyle, landStyle } from './pane-reflow.js'
import type { Flip } from './pane-zoom.js'

/** What a host is doing now, as the layout store says it. */
export interface HostMotionState {
  /** Powering off: closed, or the whole screen giving way to another layout. */
  closing: boolean
  /** Uncovering the room a change gave it, from this inset. */
  extend: Inset | undefined
  /** Flying in from where it was before a move, by this transform. */
  landing?: Flip | undefined
  /** The edges a split or a move drew in, lit. */
  edges?: Edges | undefined
  /** Pinned over the workspace by the zoom. */
  pinned: boolean
  /**
   * The zoom, as `layout.zoom` has it: its flight while one plays, and the
   * style that pins a host and flies it. Passed whole, so every host reads both
   * from the one place.
   */
  zoom: { readonly phase: 'in' | 'out' | null; readonly style: string | null }
  /**
   * Powering on, with the `--crt-*` timing it plays with; null when it is not.
   * Only a pane powers on by itself: a group's tabs power on inside it.
   */
  powerOn?: string | null
  /** The keyboard has just come to it: its frame flares once. */
  flare?: boolean
}

export interface HostMotion {
  classes: Record<string, boolean>
  style: string | undefined
  /** Powering on now: drawn scaled from a line rather than at its place. */
  poweringOn: boolean
}

type Own = 'off' | 'extend' | 'land' | 'edge' | 'on' | 'flare'

/**
 * The one effect of the host's own that plays, the first that applies: they
 * share the element's transform, clip and overlay, so two at once would fight.
 * A close takes the place of everything (every change to the tree settles a
 * close first, so it meets the others only for the moment it begins); what a
 * change of layout plays takes the place of a power-on still playing; and a
 * flare, which only says where the keyboard went, gives way to all of them and
 * to the zoom's flight.
 */
function ownEffect(state: HostMotionState): Own | null {
  if (state.closing) return 'off'
  if (state.extend !== undefined) return 'extend'
  if (state.landing !== undefined) return 'land'
  if (state.edges !== undefined) return 'edge'
  if ((state.powerOn ?? null) !== null) return 'on'
  const flying = state.pinned && state.zoom.phase !== null
  return state.flare === true && !flying ? 'flare' : null
}

function ownStyle(own: Own | null, state: HostMotionState): string | null {
  switch (own) {
    case 'off':
      return `--crt-duration: ${CRT_CLOSE_MS}ms`
    case 'extend':
      return state.extend === undefined ? null : insetStyle(state.extend)
    case 'land':
      return state.landing === undefined ? null : landStyle(state.landing)
    case 'edge':
      return state.edges === undefined ? null : edgeStyle(state.edges)
    case 'on':
      return state.powerOn ?? null
    case 'flare':
      return `--crt-duration: ${CRT_FLARE_MS}ms`
    default:
      return null
  }
}

export function hostMotion(state: HostMotionState): HostMotion {
  const { pinned, zoom } = state
  const own = ownEffect(state)
  // Where the zoom puts it comes last, after the host's own effect.
  const parts = [ownStyle(own, state), pinned ? zoom.style : null].filter((part) => part !== null)
  return {
    classes: {
      'crt-on': own === 'on',
      'crt-off': own === 'off',
      'crt-beam': own === 'off',
      'crt-extend': own === 'extend',
      'crt-land': own === 'land',
      'crt-edge': own === 'edge',
      'crt-flare': own === 'flare',
      'pane-pinned': pinned,
      'crt-zoom': pinned && zoom.phase === 'in',
      'crt-zoom-out': pinned && zoom.phase === 'out',
    },
    style: parts.join('; ') || undefined,
    poweringOn: own === 'on',
  }
}
