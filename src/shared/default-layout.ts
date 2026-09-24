import { pane, split, tabs } from './layout-ops.js'
import { LAYOUT_VERSION, type LayoutNode, type LayoutTree } from './schemas/layout.js'

/**
 * The out-of-the-box layout.
 *
 * Laid out by what the panes are for, not by eDEX-UI's original grid:
 *
 *  - Left, "this machine": the clock and system strip (kept short - a clock
 *    needs a line, not a quarter of the column), CPU, memory, the busiest
 *    disks, processes, then its network: connection status and traffic.
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
      systemColumn(),
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
        [0.3, 0.25, 0.22, 0.23],
      ),
    ],
    [SYSTEM_COLUMN_WIDTH, 0.64, 0.18],
  )
}

/** The share of the width the system column has, here and in every preset (layout-presets.ts). */
export const SYSTEM_COLUMN_WIDTH = 0.18

/**
 * The left column, "this machine": the default layout's, and every preset's, so
 * that switching between them changes the stage and leaves the instruments where
 * the eye expects them.
 */
export function systemColumn(): LayoutNode {
  return split(
    'column',
    LEFT_COLUMN.map((widget) => pane(widget)),
    [...LEFT_COLUMN_SIZES],
  )
}

export function defaultLayout(): LayoutTree {
  return { version: LAYOUT_VERSION, root: defaultLayoutNode() }
}

/** The layout to fall back to when a tree collapses to nothing. */
export function fallbackNode(): LayoutNode {
  return pane('terminal')
}

/** The left column's widgets, top to bottom, as the default layout has them. */
export const LEFT_COLUMN: readonly string[] = [
  'clock',
  'sysinfo',
  'cpu',
  'memory',
  'disk',
  'toplist',
  'netstat',
  'throughput',
]

/** Their heights, the same fractions the upgrade below brings older layouts to. */
const LEFT_COLUMN_SIZES: readonly number[] = [0.04, 0.125, 0.19, 0.12, 0.116, 0.189, 0.055, 0.165]

/**
 * Left-column heights earlier versions shipped, each with the heights that replace
 * it. v0.0.5 gave the system pane a row for the OS version.
 */
const LEFT_COLUMN_UPGRADES: ReadonlyArray<{ from: number[]; to: number[] }> = [
  {
    from: [0.04, 0.075, 0.19, 0.12, 0.116, 0.239, 0.055, 0.165],
    to: [0.04, 0.125, 0.19, 0.12, 0.116, 0.189, 0.055, 0.165],
  },
]

const sameSizes = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((v, i) => Math.abs(v - (b[i] ?? Number.NaN)) < 1e-6)

function isLeftColumn(node: LayoutNode): node is Extract<LayoutNode, { kind: 'split' }> {
  return (
    node.kind === 'split' &&
    node.direction === 'column' &&
    node.children.length === LEFT_COLUMN.length &&
    node.children.every((c, i) => c.kind === 'pane' && c.widget === LEFT_COLUMN[i])
  )
}

/**
 * Brings a saved layout's untouched default left column up to the current
 * heights. A layout.json keeps the heights it was saved with, so without this a
 * pane that grew (the system pane's OS row) would draw past its bottom edge for
 * everyone who upgraded. A column the user resized is left alone.
 */
export function upgradeDefaultHeights(node: LayoutNode): LayoutNode {
  if (node.kind === 'split') {
    const upgrade = isLeftColumn(node)
      ? LEFT_COLUMN_UPGRADES.find((u) => sameSizes(node.sizes, u.from))
      : undefined
    const children = node.children.map(upgradeDefaultHeights)
    const changed = upgrade !== undefined || children.some((c, i) => c !== node.children[i])
    return changed ? { ...node, children, sizes: upgrade ? [...upgrade.to] : node.sizes } : node
  }
  return node
}
