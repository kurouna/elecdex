import { pane, split, tabs } from './layout-ops.js'
import { LAYOUT_VERSION, type LayoutNode, type LayoutTree } from './schemas/layout.js'

/**
 * The out-of-the-box layout.
 *
 * Laid out by what the panes are for, not by eDEX-UI's original grid:
 *
 *  - Left, "this machine": the clock and system strip (kept short - a clock
 *    needs a line, not a quarter of the column), CPU, memory, the busiest
 *    processes, then its network: connection status and traffic.
 *  - Centre, "work": the shell, three tabs of it, and beneath it the launcher
 *    beside the file browser. The file grid needs half the width, not all of it.
 *  - Right, "the world outside": the globe of where connections go, the market
 *    board, the weather forecast, and the calendar in the corner.
 *
 * Every pane is an ordinary tree node, so any of it can be rearranged, closed or
 * brought back from the add-pane picker.
 */
export function defaultLayoutNode(): LayoutNode {
  return split(
    'row',
    [
      split(
        'column',
        [
          pane('clock'),
          pane('sysinfo'),
          pane('cpu'),
          pane('memory'),
          pane('toplist'),
          pane('netstat'),
          pane('throughput'),
        ],
        [0.05, 0.08, 0.2, 0.15, 0.24, 0.08, 0.2],
        { left: 'panel', right: 'system' },
      ),
      split(
        'column',
        [
          tabs([pane('terminal'), pane('terminal'), pane('terminal')]),
          split('row', [pane('launcher'), pane('filesystem')], [0.5, 0.5]),
        ],
        [0.74, 0.26],
      ),
      split(
        'column',
        [pane('globe'), pane('markets'), pane('weather'), pane('calendar')],
        [0.3, 0.25, 0.25, 0.2],
        { left: 'panel', right: 'world' },
      ),
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
