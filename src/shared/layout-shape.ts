import type { LayoutNode, LayoutTree } from './schemas/layout.js'

/**
 * A layout reduced to what a thumbnail draws: one rectangle per place a pane
 * shows, in fractions of the workspace.
 *
 * The LAYOUTS dialog draws one beside every saved layout and on every preset, so
 * that an arrangement is recognised by its shape rather than read by its name.
 * The trees stay in main (shared/layouts.ts), so main works this out and sends
 * only the rectangles.
 */
export interface ShapeRect {
  x: number
  y: number
  w: number
  h: number
  /** The widget on show there: a tab group's active tab. */
  widget: string
  /** How many panes share the place, as tabs; 1 for a pane of its own. */
  tabs: number
}

/** Enough for any arrangement a person builds; past it a thumbnail says nothing more. */
export const MAX_SHAPE_RECTS = 48

export function layoutShape(tree: LayoutTree | LayoutNode): ShapeRect[] {
  const root = 'root' in tree ? tree.root : tree
  const out: ShapeRect[] = []
  place(root, { x: 0, y: 0, w: 1, h: 1 }, out)
  return out
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

function place(node: LayoutNode, box: Box, out: ShapeRect[]): void {
  if (out.length >= MAX_SHAPE_RECTS) return
  if (node.kind === 'pane') {
    out.push({ ...rounded(box), widget: node.widget, tabs: 1 })
    return
  }
  if (node.kind === 'tabs') {
    const shown = node.children[node.activeIndex] ?? node.children[0]
    if (shown !== undefined) {
      out.push({ ...rounded(box), widget: shown.widget, tabs: node.children.length })
    }
    return
  }
  // The sizes are taken as they are, and shared out by their total: a tree from a
  // hand-edited file may not sum to one, and its thumbnail should still fill.
  const total = node.sizes.reduce((sum, size) => sum + size, 0)
  let at = 0
  node.children.forEach((child, i) => {
    const share = total > 0 ? (node.sizes[i] ?? 0) / total : 1 / node.children.length
    const part =
      node.direction === 'row'
        ? { x: box.x + at * box.w, y: box.y, w: share * box.w, h: box.h }
        : { x: box.x, y: box.y + at * box.h, w: box.w, h: share * box.h }
    at += share
    place(child, part, out)
  })
}

/** Four places are plenty for a thumbnail, and keep what is sent over IPC short. */
function rounded(box: Box): Box {
  const r = (v: number): number => Math.round(v * 10_000) / 10_000
  return { x: r(box.x), y: r(box.y), w: r(box.w), h: r(box.h) }
}
