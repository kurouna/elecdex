import type { Placement } from '@shared/layout-ops'

/** A box in viewport pixels, as getBoundingClientRect gives it. */
export interface Box {
  left: number
  top: number
  width: number
  height: number
}

/**
 * How far in from an edge, as a share of the pane's size, a drop still means
 * "beside it on that side". Deeper in than this on every side is the centre,
 * which means "a tab with it".
 */
const EDGE_SHARE = 0.25

/**
 * Where a drop at (x, y) over `box` would put the dragged pane: beside the
 * nearest edge when close to one, else as a tab. Measured as a share of each
 * side, so a short wide pane has edge zones along its short sides too.
 */
export function dropPlacement(box: Box, x: number, y: number): Placement {
  const fx = box.width > 0 ? (x - box.left) / box.width : 0.5
  const fy = box.height > 0 ? (y - box.top) / box.height : 0.5
  const distances: Array<[Placement, number]> = [
    ['left', fx],
    ['right', 1 - fx],
    ['up', fy],
    ['down', 1 - fy],
  ]
  let nearest = distances[0] as [Placement, number]
  for (const entry of distances) if (entry[1] < nearest[1]) nearest = entry
  return nearest[1] < EDGE_SHARE ? nearest[0] : 'tab'
}

/** The part of `box` a drop with `placement` would give the pane: a half, or all of it. */
export function dropPreview(box: Box, placement: Placement): Box {
  const halfWidth = box.width / 2
  const halfHeight = box.height / 2
  switch (placement) {
    case 'left':
      return { ...box, width: halfWidth }
    case 'right':
      return { ...box, left: box.left + halfWidth, width: halfWidth }
    case 'up':
      return { ...box, height: halfHeight }
    case 'down':
      return { ...box, top: box.top + halfHeight, height: halfHeight }
    case 'tab':
      return box
  }
}
