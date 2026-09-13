import { pane, split } from './layout-ops.js'
import { LAYOUT_VERSION, type LayoutNode, type LayoutTree } from './schemas/layout.js'

/**
 * The out-of-the-box layout.
 *
 * Recreates eDEX-UI's arrangement - a system column, the main shell, a network
 * column - with the same module order and column headers, but as ordinary tree
 * nodes rather than hardcoded regions, so the user can rearrange or discard any
 * of it.
 */
export function defaultLayoutNode(): LayoutNode {
  return split(
    'row',
    [
      split(
        'column',
        [pane('clock'), pane('sysinfo'), pane('cpu'), pane('memory'), pane('toplist')],
        [0.12, 0.13, 0.28, 0.22, 0.25],
        { left: 'panel', right: 'system' },
      ),
      pane('terminal'),
      split('column', [pane('netstat'), pane('globe'), pane('throughput')], [0.17, 0.48, 0.35], {
        left: 'panel',
        right: 'network',
      }),
    ],
    [0.18, 0.64, 0.18],
  )
}

export function defaultLayout(): LayoutTree {
  return { version: LAYOUT_VERSION, root: defaultLayoutNode() }
}

/** The layout to fall back to when a tree collapses to nothing. */
export function fallbackNode(): LayoutNode {
  return pane('terminal')
}
