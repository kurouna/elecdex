import { findTabsContaining } from './layout-ops.js'
import type { LayoutNode } from './schemas/layout.js'

/**
 * Which pane lies to one side of another: what Ctrl+Shift+Arrow moves the
 * keyboard to (user decision 2026-10-29).
 *
 * Worked out from the tree alone - each split shares its box out by its sizes -
 * rather than measured from the page, so the answer is pure, the same in a test
 * as on screen, and can be known before the key is pressed (shortcut-applies.ts
 * asks it to say whether the key is the workspace's or the pane's).
 */

export const DIRECTIONS = ['left', 'right', 'up', 'down'] as const
export type Direction = (typeof DIRECTIONS)[number]

/** A pane's share of the workspace, as fractions of it, by its edges. */
interface Share {
  top: number
  right: number
  bottom: number
  left: number
}

/** Smaller than any share a divider can leave (5%): what is closer is touching. */
const EPSILON = 1e-6

/**
 * Where each shown pane sits, as a share of the workspace: a tab group's box is
 * its shown tab's, since that is the pane the keyboard reaches there. `skip` is a
 * node left out, pane or group: one powering off.
 */
export function paneShares(root: LayoutNode, skip: string | null = null): Map<string, Share> {
  const shares = new Map<string, Share>()
  const place = (node: LayoutNode, share: Share): void => {
    if (node.id === skip) return
    if (node.kind === 'pane') {
      shares.set(node.id, share)
      return
    }
    if (node.kind === 'tabs') {
      const shown = node.children[node.activeIndex]
      if (shown && shown.id !== skip) shares.set(shown.id, share)
      return
    }
    const row = node.direction === 'row'
    let at = row ? share.left : share.top
    const span = row ? share.right - share.left : share.bottom - share.top
    node.children.forEach((child, i) => {
      const size = span * (node.sizes[i] ?? 0)
      place(
        child,
        row ? { ...share, left: at, right: at + size } : { ...share, top: at, bottom: at + size },
      )
      at += size
    })
  }
  place(root, { top: 0, right: 1, bottom: 1, left: 0 })
  return shares
}

/** How far `to` lies beyond `from` towards `direction`, or null when it is not that way. */
function gapToward(from: Share, to: Share, direction: Direction): number | null {
  const gap = {
    left: from.left - to.right,
    right: to.left - from.right,
    up: from.top - to.bottom,
    down: to.top - from.bottom,
  }[direction]
  return gap > -EPSILON ? gap : null
}

/** How much of `from`'s side facing `to` the two share, across the direction. */
function overlapAcross(from: Share, to: Share, direction: Direction): number {
  return direction === 'left' || direction === 'right'
    ? Math.min(from.bottom, to.bottom) - Math.max(from.top, to.top)
    : Math.min(from.right, to.right) - Math.max(from.left, to.left)
}

/**
 * The pane to move to from `paneId` towards `direction`: the nearest one that
 * way which shares some of that side with it, the one sharing most of it when
 * several touch it, the first in tree order when that ties too. Null when
 * nothing lies that way, so the key can go to the pane - a shell selects by word
 * with Ctrl+Shift+Left and Right. A tab behind another is reached through the
 * tab its group shows.
 */
export function neighbourToward(
  root: LayoutNode,
  paneId: string,
  direction: Direction,
): string | null {
  return neighboursToward(root, paneId)[direction]
}

/**
 * The pane lying each way from `paneId` (see neighbourToward), worked out from one walk of
 * the tree. `skip` is a pane or group that is no neighbour of anything: one powering off.
 */
export function neighboursToward(
  root: LayoutNode,
  paneId: string,
  skip: string | null = null,
): Record<Direction, string | null> {
  const shares = paneShares(root, skip)
  const group = findTabsContaining(root, paneId)
  const fromId = group === null ? paneId : group.children[group.activeIndex]?.id
  const from = fromId === undefined ? undefined : shares.get(fromId)
  const found: Record<Direction, string | null> = { left: null, right: null, up: null, down: null }
  if (fromId === undefined || from === undefined) return found
  for (const direction of DIRECTIONS) found[direction] = nearest(shares, fromId, from, direction)
  return found
}

/** The nearest pane `direction` from `from`, the one sharing most of that side on a tie. */
function nearest(
  shares: ReadonlyMap<string, Share>,
  fromId: string,
  from: Share,
  direction: Direction,
): string | null {
  let best: { id: string; gap: number; overlap: number } | null = null
  for (const [id, to] of shares) {
    if (id === fromId) continue
    const gap = gapToward(from, to, direction)
    const overlap = overlapAcross(from, to, direction)
    if (gap === null || overlap <= EPSILON) continue
    const nearer = best === null || gap < best.gap - EPSILON
    const wider =
      best !== null && Math.abs(gap - best.gap) <= EPSILON && overlap > best.overlap + EPSILON
    if (nearer || wider) best = { id, gap, overlap }
  }
  return best?.id ?? null
}
