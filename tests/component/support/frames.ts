import type { LayoutNode, LayoutTree } from '@shared/schemas/layout'
import type { Frame } from '../../../src/renderer/layout/geometry.ts'

/**
 * Where each shown pane would be drawn, for the layout store's effects without a layout
 * engine: a row of columns, a column of rows, each its share of a 1200x600 box by the
 * split's sizes, and a tab group one box, under the tab it shows - as measureFrames reports
 * them (layout/pane-measure.ts).
 */
export function framesOf(tree: LayoutTree): Map<string, Frame> {
  const frames = new Map<string, Frame>()
  const place = (node: LayoutNode, box: Frame): void => {
    if (node.kind === 'pane') frames.set(node.id, box)
    else if (node.kind === 'tabs') {
      const shown = node.children[node.activeIndex]
      if (shown) frames.set(shown.id, box)
    } else {
      const row = node.direction === 'row'
      const span = row ? box.right - box.left : box.bottom - box.top
      let at = row ? box.left : box.top
      node.children.forEach((child, i) => {
        const size = span * (node.sizes[i] ?? 0)
        place(
          child,
          row ? { ...box, left: at, right: at + size } : { ...box, top: at, bottom: at + size },
        )
        at += size
      })
    }
  }
  place(tree.root, { top: 0, right: 1200, bottom: 600, left: 0 })
  return frames
}
