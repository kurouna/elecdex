import { pane, split } from './layout-ops.js'
import { LAYOUT_VERSION, type LayoutNode, type LayoutTree } from './schemas/layout.js'

/**
 * The out-of-the-box layout.
 *
 * Recreates the original project's arrangement - system column, terminal,
 * network column - but as ordinary tree nodes rather than five hardcoded
 * regions, so the user can rearrange or discard any of it.
 *
 * The monitoring widgets are placeholders until phase 3 provides the metrics
 * they read; the layout engine does not care either way.
 */
export function defaultLayoutNode(): LayoutNode {
  return split(
    'row',
    [
      split(
        'column',
        [pane('clock'), pane('sysinfo'), pane('cpu'), pane('memory')],
        [0.16, 0.2, 0.32, 0.32],
      ),
      pane('terminal'),
      split('column', [pane('netstat'), pane('throughput'), pane('globe')], [0.24, 0.3, 0.46]),
    ],
    [0.2, 0.6, 0.2],
  )
}

export function defaultLayout(): LayoutTree {
  return { version: LAYOUT_VERSION, root: defaultLayoutNode() }
}

/** The layout to fall back to when a tree collapses to nothing. */
export function fallbackNode(): LayoutNode {
  return pane('terminal')
}
