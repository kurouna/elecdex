/**
 * Geometry for the second half of closing a pane: the panes that take its room
 * are laid out at their new size at once - a terminal is fitted and its shell
 * told the size once, never a size per frame (ConPTY would rewrap its history
 * to each) - and are uncovered from where their frame used to end by a clip.
 */

/** How long a closing pane takes to power off. */
export const CRT_CLOSE_MS = 300
/** How long the panes left behind take to extend into the room it left. */
export const CRT_EXTEND_MS = 220
/**
 * The tree changes this much after the power-off starts: the animation begins on
 * the frame after the class is added, so a timer of exactly its length would
 * remove the pane a frame before its last, still faintly lit, frame.
 */
export const CLOSE_SETTLE_MS = CRT_CLOSE_MS + 40

/** A frame's box on screen, in CSS pixels. */
export interface Frame {
  top: number
  right: number
  bottom: number
  left: number
}

/** How far in from each side of its new box a pane's clip starts. */
export type Inset = Frame

/** Changes smaller than this are rounding, not room gained. */
const EPSILON_PX = 1

/**
 * Where the clip of a pane that is shown after a close starts: its old box inside
 * its new one, or, for a pane that was not shown (the tab that took the closed
 * one's place), a line across its middle, as a tube powering on. Null when the
 * pane gained no room, so it is left alone.
 */
export function extendFrom(before: Frame | undefined, after: Frame): Inset | null {
  if (before === undefined) {
    const half = (after.bottom - after.top) / 2
    return { top: half, right: 0, bottom: half, left: 0 }
  }
  const inset = {
    top: Math.max(0, before.top - after.top),
    right: Math.max(0, after.right - before.right),
    bottom: Math.max(0, after.bottom - before.bottom),
    left: Math.max(0, before.left - after.left),
  }
  const gained = Object.values(inset).some((n) => n >= EPSILON_PX)
  return gained ? inset : null
}

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
    const { top, right, bottom, left } = frame.getBoundingClientRect()
    frames.set(id, { top, right, bottom, left })
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
  const { top, right, bottom, left } = element.getBoundingClientRect()
  return { top, right, bottom, left }
}

/** The CSS variables `crt-extend` reads its starting clip from. */
export function insetStyle(inset: Inset): string {
  const px = (n: number) => `${Math.round(n)}px`
  return [
    `--from-top: ${px(inset.top)}`,
    `--from-right: ${px(inset.right)}`,
    `--from-bottom: ${px(inset.bottom)}`,
    `--from-left: ${px(inset.left)}`,
    `--crt-duration: ${CRT_EXTEND_MS}ms`,
  ].join('; ')
}
