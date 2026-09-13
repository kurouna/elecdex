import type { Placement } from '@shared/layout-ops'

/** A box in viewport pixels, as getBoundingClientRect gives it. */
export interface Box {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Where a drop at (x, y) over `box` would put the dragged pane.
 *
 * As a tab when `asTab` (the drag holds Ctrl or Cmd). Otherwise beside the pane,
 * on the side nearest the pointer - there is no middle zone, so a plain drop
 * always inserts between panes. Nearness is a share of each side, so a short,
 * wide pane has side zones along its short sides too.
 */
export function dropPlacement(box: Box, x: number, y: number, asTab: boolean): Placement {
  if (asTab) return 'tab'
  const fx = box.width > 0 ? (x - box.left) / box.width : 0.5
  const fy = box.height > 0 ? (y - box.top) / box.height : 0.5
  const sides: Array<[Placement, number]> = [
    ['left', fx],
    ['right', 1 - fx],
    ['up', fy],
    ['down', 1 - fy],
  ]
  let nearest = sides[0] as [Placement, number]
  for (const side of sides) if (side[1] < nearest[1]) nearest = side
  return nearest[0]
}

/**
 * The part of `box` a drop with `placement` would give the pane: a half, or all
 * of it. Always a new plain object, never a spread of `box`: a DOMRect keeps its
 * fields as prototype getters, so spreading one copies nothing.
 */
export function dropPreview(box: Box, placement: Placement): Box {
  const { left, top, width, height } = box
  switch (placement) {
    case 'left':
      return { left, top, width: width / 2, height }
    case 'right':
      return { left: left + width / 2, top, width: width / 2, height }
    case 'up':
      return { left, top, width, height: height / 2 }
    case 'down':
      return { left, top: top + height / 2, width, height: height / 2 }
    case 'tab':
      return { left, top, width, height }
  }
}
