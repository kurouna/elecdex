/**
 * Where the panes are drawn now, read from the page for the layout store's
 * effects: the close measures every shown pane before and after, and the zoom
 * the place a pane flies from and back to (Workspace.svelte hands both over).
 */

import { type Frame, frameOf } from './geometry.js'

/**
 * The box of every shown pane's frame, by pane id: a tab group's for a tab,
 * since the group is what grows, and the pane's own otherwise.
 */
export function measureFrames(root: ParentNode = document): Map<string, Frame> {
  const frames = new Map<string, Frame>()
  for (const pane of root.querySelectorAll<HTMLElement>('[data-testid=pane]:not(.hidden)')) {
    const id = pane.dataset.paneId
    if (id === undefined) continue
    const frame = pane.closest<HTMLElement>('[data-testid=tabs-host]') ?? pane
    frames.set(id, frameOf(frame))
  }
  return frames
}

/**
 * Where a pane's element sits: its group's box when it is tabbed, as
 * `measureFrames` measures it, since the group is what is brought forward.
 *
 * A pinned pane (brought to the front, layout/pane-zoom.ts) is measured by the
 * slot it came out of instead - its own box is then the one the zoom put it in,
 * not the one it belongs to. Whether it is pinned is read from what is painted
 * rather than from the store, which is a frame ahead of the page: a zoom asked
 * for again while the pane is still flying home would otherwise measure the box
 * the flight is leaving.
 */
export function frameOfPane(paneId: string, root: ParentNode = document): Frame | null {
  const pane = root.querySelector<HTMLElement>(`[data-testid=pane][data-pane-id="${paneId}"]`)
  if (pane === null) return null
  const host = pane.closest<HTMLElement>('[data-testid=tabs-host]') ?? pane
  const pinned = getComputedStyle(host).position === 'fixed'
  const element = pinned ? (host.parentElement ?? host) : host
  return frameOf(element)
}
