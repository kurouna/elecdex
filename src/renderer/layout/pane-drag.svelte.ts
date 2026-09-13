import type { Placement } from '@shared/layout-ops'
import type { Attachment } from 'svelte/attachments'
import { type Box, dropPlacement, dropPreview } from '../lib/drop-zone.ts'
import { layout } from '../stores/layout.svelte.ts'

/**
 * Moving panes by dragging their titles.
 *
 * Pointer events rather than HTML drag and drop: the drop zones depend on where
 * inside a pane the pointer is, which dragover reports too coarsely to preview
 * smoothly, and HTML drag and drop draws the browser's own ghost image, which a
 * themed HUD cannot style. Pointer capture keeps the drag ours while it crosses
 * terminals and canvases that handle pointer events themselves.
 *
 * A plain drop inserts the pane beside another; holding Ctrl (or Cmd) makes it a
 * tab of that pane instead. The two are separate gestures rather than zones of
 * one pane, so neither is reached by accident near the other.
 *
 * Drop targets are marked in the DOM with `data-drop-node` (a pane outside a tab
 * group, or a whole group); the layout decides what a drop means (moveNode), so
 * this file only turns pointer positions into a target and shows it.
 */

/** Pixels the pointer must travel before a press on a title becomes a drag, so a click stays a click. */
const DRAG_THRESHOLD_PX = 6

export interface DropTarget {
  nodeId: string
  placement: Placement
  /** Where the moved pane would go, in viewport pixels. */
  preview: Box
}

class PaneDragStore {
  /** The node being dragged, or null when no drag is under way. */
  source = $state<string | null>(null)
  /** What the drag is labelled with beside the pointer. */
  label = $state('')
  pointer = $state({ x: 0, y: 0 })
  /** True while Ctrl or Cmd is held: a drop adds the pane as a tab. */
  asTab = $state(false)
  target = $state.raw<DropTarget | null>(null)

  begin(nodeId: string, label: string): void {
    this.source = nodeId
    this.label = label
  }

  /** Follows the pointer and the modifier: the pane under the pointer, and what a drop there would do. */
  track(x: number, y: number, asTab: boolean): void {
    this.pointer = { x, y }
    this.asTab = asTab
    const source = this.source
    if (source === null) return
    const host = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-node]')
    const nodeId = host?.dataset.dropNode
    if (host === null || host === undefined || nodeId === undefined) {
      this.target = null
      return
    }
    const box = host.getBoundingClientRect()
    const placement = dropPlacement(box, x, y, asTab)
    this.target = layout.canMove(source, nodeId, placement)
      ? { nodeId, placement, preview: dropPreview(box, placement) }
      : null
  }

  /** Ends the drag, moving the node when it is over a target and `drop` is true. */
  end(drop: boolean): void {
    const { source, target } = this
    this.source = null
    this.target = null
    this.asTab = false
    if (drop && source !== null && target !== null) {
      layout.move(source, target.nodeId, target.placement)
    }
  }
}

export const paneDrag = new PaneDragStore()

/**
 * Makes an element the drag handle for a layout node. `label` is read when the
 * drag starts, so it can follow a title that changes.
 */
export function dragHandle(nodeId: string, label: () => string): Attachment<HTMLElement> {
  return (handle) => {
    const onPointerDown = (down: PointerEvent): void => {
      if (down.button !== 0 || !down.isPrimary || paneDrag.source !== null) return
      startGesture(handle, down, nodeId, label)
    }
    handle.addEventListener('pointerdown', onPointerDown)
    return () => handle.removeEventListener('pointerdown', onPointerDown)
  }
}

/** One press on a handle: a click until it moves far enough, then a drag until release. */
function startGesture(
  handle: HTMLElement,
  down: PointerEvent,
  nodeId: string,
  label: () => string,
): void {
  let dragging = false
  let last = { x: down.clientX, y: down.clientY }

  const onMove = (event: PointerEvent): void => {
    if (event.pointerId !== down.pointerId) return
    // Released where this window never heard it (outside it, before capture began).
    if (event.buttons === 0) {
      finish(false)
      return
    }
    if (!dragging) {
      const distance = Math.hypot(event.clientX - down.clientX, event.clientY - down.clientY)
      if (distance < DRAG_THRESHOLD_PX) return
      dragging = true
      handle.setPointerCapture(down.pointerId)
      paneDrag.begin(nodeId, label())
    }
    last = { x: event.clientX, y: event.clientY }
    paneDrag.track(last.x, last.y, withTabModifier(event))
  }

  const finish = (drop: boolean): void => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancel)
    window.removeEventListener('keydown', onKey, true)
    window.removeEventListener('keyup', onKey, true)
    handle.removeEventListener('lostpointercapture', onCancel)
    if (!dragging) return
    paneDrag.end(drop)
    suppressNextClick()
  }

  const onUp = (event: PointerEvent): void => {
    if (event.pointerId === down.pointerId) finish(true)
  }
  // Capture lost without a release: the handle was removed, or the system took the pointer.
  const onCancel = (): void => finish(false)
  const onKey = (event: KeyboardEvent): void => {
    if (!dragging) return
    if (event.type === 'keydown' && event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      finish(false)
      return
    }
    // Pressing or releasing Ctrl without moving still switches between insert and tab.
    if (event.key === 'Control' || event.key === 'Meta') {
      paneDrag.track(last.x, last.y, withTabModifier(event))
    }
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onCancel)
  // Capture phase, ahead of a focused terminal that would otherwise take the Escape.
  window.addEventListener('keydown', onKey, true)
  window.addEventListener('keyup', onKey, true)
  handle.addEventListener('lostpointercapture', onCancel)
}

/** Ctrl, or Cmd on macOS, as the app's shortcuts treat them. */
function withTabModifier(event: MouseEvent | KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey
}

/**
 * A release after a drag still fires a click on the handle - which, on a tab,
 * would select it again. The click follows the release in the same task, so the
 * guard is gone before any later, real click.
 */
function suppressNextClick(): void {
  const swallow = (event: MouseEvent): void => {
    event.preventDefault()
    event.stopPropagation()
  }
  window.addEventListener('click', swallow, { capture: true, once: true })
  setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0)
}
