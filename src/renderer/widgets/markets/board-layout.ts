/**
 * How the market board arranges its rows in the room it has. Pure, so the
 * thresholds are unit-tested; the widget feeds it the list's size from a
 * ResizeObserver entry.
 *
 * Sizes are in rem, like the CSS that carries the decision out (the row heights
 * here are the `grid-auto-rows` minimums in MarketsWidget.svelte).
 */

/** The least a row needs: a line row, and a candle row with its text above the chart. */
export const ROW_MIN_REM = { line: 2.4, candles: 4.8 } as const
/** The same rows packed: one line of text, and a shorter chart. */
export const DENSE_ROW_MIN_REM = { line: 1.7, candles: 3.8 } as const
/** From this width a second column of rows still leaves each chart wider than a lone column's in a side pane. */
export const TWO_COLUMNS_REM = 56

export interface BoardLayout {
  columns: 1 | 2
  /** The rows do not fit at their full height: pack them, so fewer are out of sight. */
  dense: boolean
}

export function boardLayout(
  count: number,
  view: 'line' | 'candles',
  widthRem: number,
  heightRem: number,
): BoardLayout {
  // Two columns of one row each would only make the charts half as wide.
  const columns = widthRem >= TWO_COLUMNS_REM && count > 2 ? 2 : 1
  const lines = Math.ceil(count / columns)
  // Before the list has been measured nothing is known to overflow.
  const dense = heightRem > 0 && lines * ROW_MIN_REM[view] > heightRem
  return { columns, dense }
}
