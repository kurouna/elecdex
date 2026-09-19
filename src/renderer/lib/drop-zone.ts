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

/** Where a drop lands in a tab strip. */
export interface TabInsertion {
  /** The gap, counted 0 before the first tab through `boxes.length` after the last. */
  index: number
  /** A hairline on that gap, spanning the tabs, in viewport pixels. */
  caret: Box
}

/**
 * The gap in a strip of tab boxes that a drop at `x` would land in: the tabs are
 * divided at their midpoints, so a pointer over a tab picks the side it is on.
 *
 * Only `x` is read. A strip is barely more than a line - 1.6rem over a pane that
 * may be hundreds of pixels tall - and a drag cannot be asked to hit it, so the
 * whole group answers for its strip and the caret is drawn where the tabs are.
 *
 * The caret is held inside `bounds`, the strip itself, which clips its tabs: the
 * first tab's slanted edge is deliberately pushed outside the frame, so the gap
 * before it would otherwise be drawn there too.
 *
 * Null where there are no tabs to land among: a pane that draws no strip takes a
 * plain tab drop instead.
 */
export function tabInsertion(boxes: readonly Box[], x: number, bounds: Box): TabInsertion | null {
  const last = boxes[boxes.length - 1]
  if (last === undefined) return null
  const found = boxes.findIndex((box) => x < box.left + box.width / 2)
  const index = found === -1 ? boxes.length : found
  const edge = boxes[index]
  const gap = edge === undefined ? last.left + last.width : edge.left
  const left = Math.min(Math.max(gap, bounds.left), bounds.left + bounds.width)
  const top = Math.min(...boxes.map((box) => box.top))
  const bottom = Math.max(...boxes.map((box) => box.top + box.height))
  return { index, caret: { left, top, width: 0, height: bottom - top } }
}
