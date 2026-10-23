/** One terminal filling the window: for tests about terminals and splitting, not the default layout. */
export const SINGLE_TERMINAL = {
  version: 1,
  root: { kind: 'pane', id: 'term', widget: 'terminal' },
} as const

/** A layout of one pane filling the window: `widget` with id `id` (the widget's name by default). */
export function single(widget: string, options: { id?: string; state?: unknown } = {}) {
  const pane: Record<string, unknown> = { kind: 'pane', id: options.id ?? widget, widget }
  if (options.state !== undefined) pane.state = options.state
  return { version: 1, root: pane }
}

/** One clock filling the window: a layout with nothing in it that reads or fetches anything. */
export const SINGLE_CLOCK = single('clock')

/**
 * `widget` beside another pane (a clock by default) in a row: a layout where the pane under test
 * can close, move or be measured and something is left in the workspace.
 */
export function beside(
  widget: string,
  options: { id?: string; state?: unknown; other?: string; sizes?: [number, number] } = {},
) {
  const pane: Record<string, unknown> = { kind: 'pane', id: options.id ?? widget, widget }
  if (options.state !== undefined) pane.state = options.state
  const other = options.other ?? 'clock'
  return {
    version: 1,
    root: {
      kind: 'split',
      id: 'root',
      direction: 'row',
      sizes: options.sizes ?? [50, 50],
      children: [
        pane,
        { kind: 'pane', id: other === pane.id ? `${other}-2` : other, widget: other },
      ],
    },
  }
}

/**
 * Panes as the tabs of one group, the first in front unless `front` says otherwise: what a test
 * of a pane behind another tab starts from.
 */
export function tabbed(widgets: string[], front = 0) {
  return {
    version: 1,
    root: {
      kind: 'tabs',
      id: 'tabs',
      activeIndex: front,
      children: widgets.map((widget) => ({ kind: 'pane', id: widget, widget })),
    },
  }
}

/** Settings that switch layouts without first asking about the shells that are open. */
export const NO_SWITCH_PROMPT = { layout: { confirmSwitch: false } } as const
