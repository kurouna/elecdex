import { pane, split, tabs } from './layout-ops.js'
import { LAYOUT_VERSION, type LayoutNode, type LayoutTree } from './schemas/layout.js'

/**
 * The out-of-the-box layout.
 *
 * Laid out by what the panes are for, not by eDEX-UI's original grid:
 *
 *  - Left, "this machine": the clock and system strip (kept short - a clock
 *    needs a line, not a quarter of the column), CPU, memory and the busiest
 *    processes.
 *  - Centre, "work": the shell, three tabs of it, and beneath it the file
 *    browser, which follows the shell's directory and types into it, beside the
 *    launcher. The file grid needs half the width, not all of it.
 *  - Right, "the world outside": network status, the globe of connections and
 *    traffic, then the market board and the weather forecast.
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
        [pane('clock'), pane('sysinfo'), pane('cpu'), pane('memory'), pane('toplist')],
        [0.07, 0.1, 0.28, 0.22, 0.33],
        { left: 'panel', right: 'system' },
      ),
      split(
        'column',
        [
          tabs([pane('terminal'), pane('terminal'), pane('terminal')]),
          split('row', [pane('filesystem'), pane('launcher')], [0.5, 0.5]),
        ],
        [0.7, 0.3],
      ),
      split(
        'column',
        [pane('netstat'), pane('globe'), pane('throughput'), pane('markets'), pane('weather')],
        [0.08, 0.2, 0.12, 0.37, 0.23],
        { left: 'panel', right: 'world' },
      ),
    ],
    [0.2, 0.58, 0.22],
  )
}

export function defaultLayout(): LayoutTree {
  return { version: LAYOUT_VERSION, root: defaultLayoutNode() }
}

/** The layout to fall back to when a tree collapses to nothing. */
export function fallbackNode(): LayoutNode {
  return pane('terminal')
}
