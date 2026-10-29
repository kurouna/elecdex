/**
 * What the panes play after the layout changes under them - a pane moved, one
 * split off, one closed - worked out from where every shown pane's frame was
 * and where it is now (layout/pane-measure.ts measures both).
 *
 * Nothing is ever resized a step at a time: every pane is laid out at its new
 * size at once, so a terminal is fitted once, and the picture is carried there
 * by a transform or a clip, which the compositor plays. A pane moved flies from
 * its old place to its new one, as one brought forward does (pane-zoom.ts); one
 * that gained room is uncovered into it (pane-close.ts); one that lost room has
 * a beam run along the edges that came in, so the eye is told where it went.
 */

import { CRT_EDGE_MS, CRT_LAND_MS } from '../lib/crt-timing.js'
import { type Frame, px } from './geometry.js'
import { extendFrom, type Inset } from './pane-close.js'
import { type Flip, flipFrom, flipVars } from './pane-zoom.js'

/** The width of the beam on each edge of a pane that came in, 0 on one that stayed. */
export type Edges = Frame

/** What each shown pane plays after a change, by pane id; a pane is in one map at most. */
export interface Reflow {
  landing: Map<string, Flip>
  extending: Map<string, Inset>
  edging: Map<string, Edges>
}

/** Changes smaller than this are rounding, not a move. */
const EPSILON_PX = 1
/** The beam on an edge that came in. */
const EDGE_BEAM_PX = 2

/** The edges of a pane that moved in or out, as beams; null when none moved. */
export function edgesFrom(before: Frame | undefined, after: Frame): Edges | null {
  if (before === undefined) return null
  const beam = (from: number, to: number): number =>
    Math.abs(from - to) >= EPSILON_PX ? EDGE_BEAM_PX : 0
  const edges = {
    top: beam(before.top, after.top),
    right: beam(before.right, after.right),
    bottom: beam(before.bottom, after.bottom),
    left: beam(before.left, after.left),
  }
  return Object.values(edges).some((n) => n > 0) ? edges : null
}

/** Whether a pane kept its size, so that a change only carried it somewhere else. */
const sameSize = (a: Frame, b: Frame): boolean =>
  Math.abs(a.right - a.left - (b.right - b.left)) < EPSILON_PX &&
  Math.abs(a.bottom - a.top - (b.bottom - b.top)) < EPSILON_PX

/** Whether a flight would show anything: a pane that ended where it began does not fly. */
const still = (flip: Flip): boolean =>
  Math.abs(flip.dx) < EPSILON_PX &&
  Math.abs(flip.dy) < EPSILON_PX &&
  Math.abs(flip.sx - 1) < 0.01 &&
  Math.abs(flip.sy - 1) < 0.01

/**
 * What every pane shown after a change plays. `moved` are the panes the change
 * carried somewhere else, which fly there, as does any pane that kept its size
 * and only changed place (the one a moved pane swapped with); `fresh` the panes
 * it added, which power on by themselves and play nothing here. Every other pane
 * is uncovered into the room it gained - from a line across its middle when it
 * was not shown before, as the tab a moved or closed one uncovered - or, when it
 * only lost room, has its moved edges lit.
 */
export function reflowOf(
  before: ReadonlyMap<string, Frame>,
  after: ReadonlyMap<string, Frame>,
  moved: ReadonlySet<string> = new Set(),
  fresh: ReadonlySet<string> = new Set(),
): Reflow {
  const reflow: Reflow = { landing: new Map(), extending: new Map(), edging: new Map() }
  for (const [paneId, frame] of after) {
    if (fresh.has(paneId)) continue
    const was = before.get(paneId)
    if (moved.has(paneId) || (was !== undefined && sameSize(was, frame))) {
      const flip = was === undefined ? null : flipFrom(was, frame)
      if (flip !== null && !still(flip)) reflow.landing.set(paneId, flip)
      continue
    }
    const inset = extendFrom(was, frame)
    if (inset !== null) {
      reflow.extending.set(paneId, inset)
      continue
    }
    const edges = edgesFrom(was, frame)
    if (edges !== null) reflow.edging.set(paneId, edges)
  }
  return reflow
}

/** The CSS variables `crt-land` flies a moved pane in by. */
export function landStyle(flip: Flip): string {
  return [...flipVars(flip, '--land-'), `--crt-duration: ${CRT_LAND_MS}ms`].join('; ')
}

/** The CSS variables `crt-edge` lights the edges that came in by. */
export function edgeStyle(edges: Edges): string {
  return [
    `--edge-top: ${px(edges.top)}`,
    `--edge-right: ${px(edges.right)}`,
    `--edge-bottom: ${px(edges.bottom)}`,
    `--edge-left: ${px(edges.left)}`,
    `--crt-duration: ${CRT_EDGE_MS}ms`,
  ].join('; ')
}
