import { pane, split, tabs } from './layout-ops.js'
import { LAYOUT_VERSION, type LayoutNode, type LayoutTree } from './schemas/layout.js'

/**
 * The out-of-the-box layout.
 *
 * Recreates eDEX-UI's arrangement - a system column, the main shell with the
 * filesystem display beneath it, a network column - with the same module order
 * and column headers, but as ordinary tree nodes rather than hardcoded regions,
 * so the user can rearrange or discard any of it. The weather forecast sits
 * where the original put its on-screen keyboard.
 *
 * The shell starts as a group of three tabs. eDEX-UI offered five fixed tab
 * slots but opened only one shell; here every tab is a live shell from the
 * start, and more can be added without limit.
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
      split(
        'column',
        [
          tabs([pane('terminal'), pane('terminal'), pane('terminal')]),
          split('row', [pane('filesystem'), pane('weather')], [0.6, 0.4]),
        ],
        [0.66, 0.34],
      ),
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
