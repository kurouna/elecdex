import type { Placement } from '@shared/layout-ops'
import type { Attachment } from 'svelte/attachments'
import {
  type Box,
  dropPlacement,
  dropPreview,
  type TabInsertion,
  tabInsertion,
} from '../lib/drop-zone.ts'
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
 * Ctrl over the group a tab is already in is that same gesture again, and moves
 * the tab within the strip: it stays a tab, only its place among the others
 * changes. That is the one drop a plain drag cannot make - without Ctrl the tab
 * leaves its group for a split, which is what dropping a tab on its own group
 * has always meant, so nothing is taken away to make room for it.
 *
 * Drop targets are marked in the DOM with `data-drop-node` (a pane outside a tab
 * group, or a whole group), and the tabs within one with `data-drop-tab`; the
 * layout decides what a drop means (moveNode, moveTabTo), so this file only
 * turns pointer positions into a target and shows it.
 */

/** Pixels the pointer must travel before a press on a title becomes a drag, so a click stays a click. */
const DRAG_THRESHOLD_PX = 6

export interface DropTarget {
  nodeId: string
  placement: Placement
  /** The area the moved pane would take, in viewport pixels. */
  preview: Box
  /** The gap in the target's strip it would land in, where it lands in one. */
  insertion: TabInsertion | null
  /** True when it only changes places in the group it is already in. */
  reorder: boolean
}

/** A tab strip as it is drawn: the tabs to land among, and the box clipping them. */
interface Strip {
  tabs: Box[]
  bounds: Box
}

/** A DOMRect read once: its fields are prototype getters, so it cannot be spread. */
const boxOf = (rect: DOMRect): Box => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height,
})

/** Reads a node's tab strip, or null for a pane that draws none. */
function measureStrip(host: HTMLElement): Strip | null {
  const strip = host.querySelector<HTMLElement>('[data-drop-strip]')
  if (strip === null) return null
  const tabs = [...strip.querySelectorAll<HTMLElement>('[data-drop-tab]')].map((tab) =>
    boxOf(tab.getBoundingClientRect()),
  )
  return tabs.length === 0 ? null : { tabs, bounds: boxOf(strip.getBoundingClientRect()) }
}

class PaneDragStore {
  /** The node being dragged, or null when no drag is under way. */
  source = $state<string | null>(null)
  /** What the drag is labelled with beside the pointer. */
  label = $state('')
  pointer = $state({ x: 0, y: 0 })
  /** True while Ctrl or Cmd is held: a drop makes the pane a tab, or moves it among them. */
  asTab = $state(false)
  /**
   * True while the pointer is over the very group the dragged tab is in, where a
   * drop would only move it among the others. Kept rather than worked out again
   * for the hint, which is read on every frame of the drag.
   */
  overOwnGroup = $state(false)
  target = $state.raw<DropTarget | null>(null)
  /**
   * The strip of the group last looked at, measured once.
   *
   * A strip does not move during a drag - the tabs stay where they are and only
   * the caret moves - while reading a rect per tab per pointermove would force a
   * layout every frame.
   */
  #strip: { host: HTMLElement; strip: Strip | null } | null = null

  begin(nodeId: string, label: string): void {
    // A pane brought to the front covers the workspace, and the shade behind it
    // takes every press: nothing could be dropped on. Putting it back first is
    // also what the gesture means - the pane is being given a new place.
    layout.unzoom()
    this.source = nodeId
    this.label = label
    this.#strip = null
  }

  /** What a drop would do, said beside the pointer. */
  get hint(): string {
    if (this.source === null) return ''
    if (this.asTab) return this.overOwnGroup ? 'reorder' : 'as tab'
    return this.overOwnGroup ? 'Ctrl: reorder' : 'Ctrl: as tab'
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
      this.overOwnGroup = false
      this.target = null
      return
    }
    this.overOwnGroup = layout.groupOf(source) === nodeId
    this.target = this.targetIn(source, host, nodeId, x, y, asTab)
  }

  /** Ends the drag, moving the node when it is over a target and `drop` is true. */
  end(drop: boolean): void {
    const { source, target } = this
    this.source = null
    this.target = null
    this.overOwnGroup = false
    this.asTab = false
    this.#strip = null
    if (!drop || source === null || target === null) return
    if (target.insertion === null) layout.move(source, target.nodeId, target.placement)
    else layout.moveTab(source, target.nodeId, target.insertion.index)
  }

  /** What dropping on `host` would do, or null when it would do nothing. */
  private targetIn(
    source: string,
    host: HTMLElement,
    nodeId: string,
    x: number,
    y: number,
    asTab: boolean,
  ): DropTarget | null {
    const box = boxOf(host.getBoundingClientRect())
    // Only a strip offers gaps; a pane that draws none takes a plain tab drop.
    const strip = asTab ? this.stripOf(host) : null
    const insertion = strip === null ? null : tabInsertion(strip.tabs, x, strip.bounds)
    if (insertion !== null) {
      return layout.canMoveTab(source, nodeId, insertion.index)
        ? { nodeId, placement: 'tab', preview: box, insertion, reorder: this.overOwnGroup }
        : null
    }
    const placement = dropPlacement(box, x, y, asTab)
    return layout.canMove(source, nodeId, placement)
      ? { nodeId, placement, preview: dropPreview(box, placement), insertion: null, reorder: false }
      : null
  }

  /** A group's strip, from the cache while the pointer stays over the same node. */
  private stripOf(host: HTMLElement): Strip | null {
    if (this.#strip?.host === host) return this.#strip.strip
    const strip = measureStrip(host)
    this.#strip = { host, strip }
    return strip
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
