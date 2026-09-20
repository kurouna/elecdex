import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  boardLayout,
  DENSE_ROW_MIN_REM,
  ROW_MIN_REM,
  TWO_COLUMNS_REM,
} from '../../src/renderer/widgets/markets/board-layout.js'

/**
 * How the market board arranges its rows, and that the row heights it reckons
 * with are the ones the stylesheet gives them.
 */

describe('boardLayout', () => {
  it('packs the rows only when they would not fit at their full height', () => {
    expect(boardLayout(8, 'line', 20, 8 * 2.4)).toEqual({ columns: 1, dense: false })
    expect(boardLayout(8, 'line', 20, 8 * 2.4 - 0.1)).toEqual({ columns: 1, dense: true })
    expect(boardLayout(8, 'candles', 20, 8 * 2.4)).toEqual({ columns: 1, dense: true })
    expect(boardLayout(8, 'candles', 20, 8 * 4.8)).toEqual({ columns: 1, dense: false })
  })

  it('knows nothing overflows before the list is measured, or with nothing listed', () => {
    expect(boardLayout(24, 'candles', 0, 0).dense).toBe(false)
    expect(boardLayout(0, 'line', 20, 1)).toEqual({ columns: 1, dense: false })
  })

  it('takes two columns from a width where each chart is still a good size', () => {
    expect(boardLayout(8, 'line', TWO_COLUMNS_REM - 1, 40).columns).toBe(1)
    expect(boardLayout(8, 'line', TWO_COLUMNS_REM, 40).columns).toBe(2)
    // Half as many lines to fit: eight symbols in the height of four.
    expect(boardLayout(8, 'line', TWO_COLUMNS_REM, 4 * 2.4).dense).toBe(false)
    expect(boardLayout(9, 'line', TWO_COLUMNS_REM, 4 * 2.4).dense).toBe(true)
  })

  it('keeps one column for one or two symbols, whose charts two columns would only halve', () => {
    expect(boardLayout(1, 'line', 200, 40).columns).toBe(1)
    expect(boardLayout(2, 'candles', 200, 40).columns).toBe(1)
    expect(boardLayout(3, 'line', 200, 40).columns).toBe(2)
  })
})

describe('the row heights', () => {
  const css = readFileSync(
    new URL('../../src/renderer/widgets/markets/MarketsWidget.svelte', import.meta.url),
    'utf8',
  )
  /** The minimum in `grid-auto-rows: minmax(<n>rem, ...)` of the rule with exactly this selector. */
  const rows = (selector: string): number => {
    const bare = css.replace(/[/][*].*?[*][/]/gs, '')
    const rule = bare.split('}').find((r) => r.trim().startsWith(`${selector} {`)) ?? ''
    return Number(/grid-auto-rows: minmax[(]([0-9.]+)rem/.exec(rule)?.[1])
  }

  it('are the same in the stylesheet as in the reckoning', () => {
    expect(rows('.board')).toBe(ROW_MIN_REM.line)
    expect(rows('.board.tall')).toBe(ROW_MIN_REM.candles)
    expect(rows('.board.dense')).toBe(DENSE_ROW_MIN_REM.line)
    expect(rows('.board.dense.tall')).toBe(DENSE_ROW_MIN_REM.candles)
  })
})
