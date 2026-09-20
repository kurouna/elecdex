import type { CandlePoint, MarketUpdate } from '@shared/markets'
import { fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/layout.svelte.ts', () => ({ layout: { setPaneState: vi.fn() } }))

const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { default: DetailChart } = await import(
  '../../src/renderer/widgets/markets/DetailChart.svelte'
)
const { default: MarketsWidget } = await import(
  '../../src/renderer/widgets/markets/MarketsWidget.svelte'
)

/**
 * One symbol's chart over the whole pane: a row opens it, the arrow goes back,
 * which symbol is open is pane state, and the chart draws its axes and reads
 * out the bar under the pointer.
 */

const texts: string[] = []
const rects: number[][] = []

const ctx: Record<string, unknown> = {
  canvas: document.createElement('canvas'),
  setTransform: () => {},
  clearRect: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  fill: () => {},
  arc: () => {},
  setLineDash: () => {},
  fillRect: (...args: number[]) => rects.push(args),
  fillText: (text: string) => texts.push(text),
  measureText: (text: string) => ({ width: text.length * 6 }),
  createLinearGradient: () => ({ addColorStop: () => {} }),
}

class FakePath {
  moveTo() {}
  lineTo() {}
  closePath() {}
}

const subscriptions: Array<{ key: string; active: boolean }> = []
const handlers = new Map<string, (update: MarketUpdate) => void>()

beforeEach(() => {
  texts.length = 0
  rects.length = 0
  subscriptions.length = 0
  handlers.clear()
  vi.mocked(layout.setPaneState).mockClear()
  vi.stubGlobal('Path2D', FakePath)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      readonly #callback: () => void
      constructor(callback: () => void) {
        this.#callback = callback
      }
      observe() {
        this.#callback()
      }
      disconnect() {}
    },
  )
  vi.stubGlobal('elecdex', {
    markets: {
      subscribe: (symbol: string, range: string, handler: (update: MarketUpdate) => void) => {
        const entry = { key: `${symbol}|${range}`, active: true }
        subscriptions.push(entry)
        handlers.set(entry.key, handler)
        return () => {
          entry.active = false
        }
      },
    },
  })
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(216)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const bar = (t: number, o: number, h: number, l: number, c: number): CandlePoint => ({
  t,
  o,
  h,
  l,
  c,
})

/** Five-minute bars from 09:00 local, climbing from 1,000. */
const session = (count: number): CandlePoint[] =>
  Array.from({ length: count }, (_, i) =>
    bar(new Date(2026, 8, 1, 9, i * 5).getTime(), 1000 + i, 1002 + i, 999 + i, 1001 + i),
  )

const props = (state: Record<string, unknown>) => ({
  paneId: 'p',
  title: 'markets',
  props: undefined,
  state: { symbols: [{ symbol: 'AAA' }, { symbol: 'BBB' }], ...state },
  active: true,
})

const send = (symbol: string, range: string, price = 110) => {
  handlers.get(`${symbol}|${range}`)?.({
    key: `${symbol}|${range}`,
    symbol,
    range: range as MarketUpdate['range'],
    quote: {
      symbol,
      name: symbol,
      price,
      change: 10,
      changePercent: 10,
      previousClose: 100,
      currency: null,
      state: 'open',
      time: null,
    },
    candles: [bar(0, 100, 111, 99, 105), bar(1, 105, 112, 104, price)],
    base: 100,
    baseTime: null,
    updatedAt: 0,
    error: null,
  })
  flushSync()
}

describe('MarketsWidget: one symbol over the whole pane', () => {
  it('opens the chart of the row that is clicked, keeping the rest of the pane state', async () => {
    render(MarketsWidget, { props: props({ range: '5d' }) })
    flushSync()
    expect(screen.queryByTestId('markets-detail')).toBeNull()
    await fireEvent.click(screen.getAllByTestId('market-open')[1] as HTMLElement)
    expect(vi.mocked(layout.setPaneState)).toHaveBeenLastCalledWith('p', {
      symbols: [{ symbol: 'AAA' }, { symbol: 'BBB' }],
      range: '5d',
      focus: 'BBB',
    })
  })

  it('opens it from the bar view too', async () => {
    render(MarketsWidget, { props: props({ view: 'bars' }) })
    flushSync()
    await fireEvent.click(screen.getAllByTestId('market-open')[0] as HTMLElement)
    expect(vi.mocked(layout.setPaneState)).toHaveBeenLastCalledWith(
      'p',
      expect.objectContaining({ view: 'bars', focus: 'AAA' }),
    )
  })

  it('shows the focused symbol alone, with its price and change, and no list', () => {
    render(MarketsWidget, { props: props({ focus: 'BBB' }) })
    flushSync()
    send('BBB', '1d')
    const detail = screen.getByTestId('markets-detail')
    expect(detail.getAttribute('data-symbol')).toBe('BBB')
    expect(screen.getByTestId('market-detail-price').textContent).toBe('110.00')
    expect(detail.textContent).toContain('+10.00%')
    expect(detail.classList.contains('up')).toBe(true)
    expect(screen.queryByTestId('market-row')).toBeNull()
    expect(screen.getByTestId('market-detail-chart').getAttribute('data-bars')).toBe('2')
    expect(screen.getByTestId('markets').getAttribute('data-focus')).toBe('BBB')
  })

  it('keeps the whole board subscribed while one chart is open', () => {
    render(MarketsWidget, { props: props({ focus: 'BBB' }) })
    flushSync()
    expect(subscriptions.filter((s) => s.active).map((s) => s.key)).toEqual(['AAA|1d', 'BBB|1d'])
  })

  it('goes back to the list by the arrow, dropping only the focus', async () => {
    const { rerender } = render(MarketsWidget, { props: props({ focus: 'AAA', view: 'bars' }) })
    flushSync()
    await fireEvent.click(screen.getByTestId('markets-back'))
    expect(vi.mocked(layout.setPaneState)).toHaveBeenLastCalledWith('p', {
      symbols: [{ symbol: 'AAA' }, { symbol: 'BBB' }],
      view: 'bars',
    })
    await rerender({ state: props({ view: 'bars' }).state })
    flushSync()
    expect(screen.queryByTestId('markets-detail')).toBeNull()
    expect(screen.getAllByTestId('market-bar')).toHaveLength(2)
    expect(screen.queryByTestId('markets-back')).toBeNull()
  })

  it('shows the list when the focused symbol is no longer on it', () => {
    render(MarketsWidget, { props: props({ focus: 'GONE' }) })
    flushSync()
    expect(screen.queryByTestId('markets-detail')).toBeNull()
    expect(screen.getAllByTestId('market-row')).toHaveLength(2)
    expect(screen.getByTestId('markets').getAttribute('data-focus')).toBe('')
  })

  it("follows the board's candles, and keeps its own choice apart from the board's view", async () => {
    const { rerender } = render(MarketsWidget, { props: props({ focus: 'AAA', view: 'bars' }) })
    flushSync()
    const chart = () => screen.getByTestId('market-detail-chart').getAttribute('data-view')
    // The board's bars compare symbols; one symbol is drawn as a line.
    expect(chart()).toBe('line')
    const views = screen.getAllByRole('radio').map((b) => b.getAttribute('data-view'))
    expect(views.filter((v) => v !== null)).toEqual(['line', 'candles'])

    await fireEvent.click(document.querySelector('[data-view=candles]') as HTMLElement)
    expect(vi.mocked(layout.setPaneState)).toHaveBeenLastCalledWith(
      'p',
      expect.objectContaining({ view: 'bars', detailView: 'candles' }),
    )
    await rerender({ state: props({ focus: 'AAA', view: 'bars', detailView: 'candles' }).state })
    flushSync()
    expect(chart()).toBe('candles')

    await rerender({ state: props({ focus: 'AAA', view: 'candles' }).state })
    flushSync()
    expect(chart()).toBe('candles')
  })

  it('changes the range from the chart, for the whole pane', async () => {
    render(MarketsWidget, { props: props({ focus: 'AAA' }) })
    flushSync()
    const ranges = screen.getByTestId('markets-ranges')
    expect(ranges.querySelector('[aria-checked=true]')?.getAttribute('data-range')).toBe('1d')
    await fireEvent.click(ranges.querySelector('[data-range="6mo"]') as HTMLElement)
    expect(vi.mocked(layout.setPaneState)).toHaveBeenLastCalledWith(
      'p',
      expect.objectContaining({ focus: 'AAA', range: '6mo' }),
    )
  })

  it('flashes the open chart when its price moves', () => {
    render(MarketsWidget, { props: props({ focus: 'AAA' }) })
    flushSync()
    send('AAA', '1d', 110)
    send('AAA', '1d', 109)
    expect(document.querySelector('.detail-head')?.classList.contains('flash-down')).toBe(true)
  })
})

describe('DetailChart', () => {
  const base = { baseline: 1000, range: '1d' as const, up: true }

  it('draws a price axis, the hours and the latest price as a tag', () => {
    render(DetailChart, { props: { ...base, candles: session(40), view: 'line' } })
    flushSync()
    // 999.4 to 1,043: round prices, fifty apart or less.
    expect(texts).toContain('1,020')
    expect(texts).toContain('10:00')
    expect(texts).toContain('12:00')
    // The tag's text is the last close, drawn last, over a filled box on the axis.
    expect(texts.at(-1)).toBe('1,040')
    expect(rects.at(-1)?.[0]).toBeGreaterThan(300)
  })

  it('merges candles to the plot, not to the canvas: the axis takes its share', () => {
    // 130 bars fit 400 px at three pixels a bar, but not what the axis leaves of them.
    render(DetailChart, { props: { ...base, candles: session(130), view: 'candles' } })
    flushSync()
    expect(screen.getByTestId('market-detail-chart').getAttribute('data-bars')).toBe('65')
  })

  it('reads out the bar under the pointer, and lets go when it leaves', async () => {
    render(DetailChart, { props: { ...base, candles: session(10), view: 'candles' } })
    flushSync()
    const chart = screen.getByRole('img')
    expect(screen.queryByTestId('market-detail-readout')).toBeNull()
    // jsdom's rectangles start at 0, and ten bars share the plot: x = 5 is in the first.
    await fireEvent.pointerMove(chart, { clientX: 5, clientY: 10 })
    const readout = screen.getByTestId('market-detail-readout')
    expect(readout.textContent).toContain('O 1,000')
    expect(readout.textContent).toContain('H 1,002')
    expect(readout.textContent).toContain('L 999.00')
    expect(readout.textContent).toContain('C 1,001')
    // Over the price axis there is no bar.
    await fireEvent.pointerMove(chart, { clientX: 399, clientY: 10 })
    expect(screen.queryByTestId('market-detail-readout')).toBeNull()
    await fireEvent.pointerMove(chart, { clientX: 5, clientY: 10 })
    await fireEvent.pointerLeave(chart)
    expect(screen.queryByTestId('market-detail-readout')).toBeNull()
  })

  it('reads out only the close for a line', async () => {
    render(DetailChart, { props: { ...base, candles: session(10), view: 'line' } })
    flushSync()
    await fireEvent.pointerMove(screen.getByRole('img'), { clientX: 5, clientY: 10 })
    const text = screen.getByTestId('market-detail-readout').textContent ?? ''
    expect(text).toContain('1,001')
    expect(text).not.toContain('O ')
  })

  it('draws nothing without bars', () => {
    render(DetailChart, { props: { ...base, candles: [], view: 'line' } })
    flushSync()
    expect(texts).toEqual([])
    expect(rects).toEqual([])
  })
})
