import type { SplitNode } from '@shared/schemas/layout'
import { layout } from '../stores/layout.svelte.ts'

/**
 * Dragging a divider moves size between its two neighbours only.
 *
 * Redistributing across every child instead would make a drag feel like it moves
 * panes the user is not touching.
 *
 * Pointer events with capture, as the pane drag uses (pane-drag.svelte.ts): the
 * divider keeps the drag while the pointer crosses terminals and canvases that
 * handle pointer events themselves.
 */

/** Smallest fraction a child may be dragged to, so a pane cannot vanish. */
export const MIN_FRACTION = 0.05

export interface Divider {
  /** The split whose sizes the divider changes. */
  node: SplitNode
  /** Which divider it is: the pair it moves size between is `index` and `index + 1`. */
  index: number
  /** Along the split's direction (a row) rather than across it. */
  row: boolean
  /** The container's length along that direction, in pixels. */
  total: number
}

/** The split's sizes with `delta` - a fraction of the whole - moved across the divider. */
export function sizesWithDelta(node: SplitNode, index: number, delta: number): number[] {
  const before = node.sizes[index] ?? 0
  const after = node.sizes[index + 1] ?? 0
  const pairTotal = before + after
  const nextBefore = Math.min(Math.max(before + delta, MIN_FRACTION), pairTotal - MIN_FRACTION)
  const sizes = [...node.sizes]
  sizes[index] = nextBefore
  sizes[index + 1] = pairTotal - nextBefore
  return sizes
}

/** One press on a divider: resizes until the pointer is released. */
export function startDividerDrag(down: PointerEvent, divider: Divider): void {
  const handle = down.currentTarget
  // Nothing to move size within yet: the capture is not taken at all, since one
  // taken for a gesture that then gives up would swallow every click in the
  // window until the pointer was pressed again.
  if (!(handle instanceof HTMLElement) || divider.total <= 0) return

  down.preventDefault()
  handle.setPointerCapture(down.pointerId)

  const start = divider.row ? down.clientX : down.clientY

  const onMove = (move: PointerEvent): void => {
    const delta = ((divider.row ? move.clientX : move.clientY) - start) / divider.total
    layout.resize(divider.node.id, sizesWithDelta(divider.node, divider.index, delta))
  }

  const end = (): void => {
    handle.removeEventListener('pointermove', onMove)
    handle.removeEventListener('pointerup', end)
    handle.removeEventListener('pointercancel', end)
    handle.removeEventListener('lostpointercapture', end)
    // Given back last, and only if it is still held: releasing a pointer the
    // element no longer has throws, and a throw before the listeners above were
    // taken off would leave the divider live - resizing the layout as the
    // pointer passed over it, with nothing pressed.
    try {
      if (handle.hasPointerCapture(down.pointerId)) handle.releasePointerCapture(down.pointerId)
    } catch {
      // The pointer is gone; there is nothing left to give back.
    }
  }

  handle.addEventListener('pointermove', onMove)
  handle.addEventListener('pointerup', end)
  handle.addEventListener('pointercancel', end)
  // No pointerup comes when the pointer is taken away rather than released - the
  // window put away mid-drag, the handle removed from the page - and this is the
  // only event that says the capture has gone.
  handle.addEventListener('lostpointercapture', end)
}
