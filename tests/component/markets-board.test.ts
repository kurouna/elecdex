import type { CandlePoint, MarketUpdate } from '@shared/markets'
import { fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/layout.svelte.ts', () => ({
  layout: { setPaneState: vi.fn(), patchPaneState: vi.fn() },
}))

const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { default: MarketsWidget } = await import(
  '../../src/renderer/widgets/markets/MarketsWidget.svelte'
)

/**
 * How the board uses its room: rows packed when they would not fit, two columns
 * in a wide pane, the bar view in order of the change, and the open chart's
 * extremes. The sizes come from the ResizeObserver's entries, which this drives.
 */

type Entry = { target: Element; contentRect: { width: number; height: number } }
const observers: Array<{ callback: (entries: Entry[]) => void; targets: Set<Element> }> = []

/** Reports a size for an element to whoever observes it. jsdom's rem is 16 px. */
function resize(target: Element, width: number, height: number): void {
  for (const observer of observers) {
    if (observer.targets.has(target))
      observer.callback([{ target, contentRect: { width, height } }])
  }
  flushSync()
}

const handlers = new Map<string, (update: MarketUpdate) => void>()

beforeEach(() => {
  observers.length = 0
  handlers.clear()
  vi.mocked(layout.patchPaneState).mockClear()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      readonly #entry: (typeof observers)[number]
      constructor(callback: (entries: Entry[]) => void) {
        this.#entry = { callback, targets: new Set() }
        observers.push(this.#entry)
      }
      observe(target: Element) {
        this.#entry.targets.add(target)
      }
      disconnect() {
        this.#entry.targets.clear()
      }
    },
  )
  vi.stubGlobal('elecdex', {
    markets: {
      subscribe: (symbol: string, range: string, handler: (update: MarketUpdate) => void) => {
        handlers.set(`${symbol}|${range}`, handler)
        return () => {}
      },
    },
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const symbols = (count: number) => Array.from({ length: count }, (_, i) => ({ symbol: `S${i}` }))

const props = (state: Record<string, unknown>) => ({
  paneId: 'p',
  title: 'markets',
  props: undefined,
  state: { symbols: symbols(8), ...state },
  active: true,
})

const bar = (t: number, o: number, h: number, l: number, c: number): CandlePoint => ({
  t,
  o,
  h,
  l,
  c,
})

function send(symbol: string, base: number | null, over: Partial<MarketUpdate> = {}): void {
  handlers.get(`${symbol}|1d`)?.({
    key: `${symbol}|1d`,
    symbol,
    range: '1d',
    quote: {
      symbol,
      name: symbol,
      price: 110,
      change: base === null ? 0 : 110 - base,
      changePercent: base === null ? 0 : ((110 - base) / base) * 100,
      previousClose: base,
      currency: null,
      state: 'open',
      time: null,
    },
    candles: [bar(0, 100, 118, 96, 105), bar(1, 105, 112, 104, 110)],
    base,
    baseTime: null,
    updatedAt: 0,
    error: null,
    ...over,
  })
  flushSync()
}

const board = () => document.querySelector('.board') as HTMLElement
const pane = () => screen.getByTestId('markets')

describe('MarketsWidget: the room the board has', () => {
  it('packs the rows when they would not fit, and lets them out when they would', () => {
    render(MarketsWidget, { props: props({}) })
    flushSync()
    // Not measured yet: nothing is known to overflow.
    expect(board().classList.contains('dense')).toBe(false)
    // Eight rows of 2.4rem need 307 px.
    resize(board(), 320, 170)
    expect(board().classList.contains('dense')).toBe(true)
    resize(board(), 320, 320)
    expect(board().classList.contains('dense')).toBe(false)
  })

  it('counts a candle row as the taller one it is', async () => {
    const { rerender } = render(MarketsWidget, { props: props({}) })
    flushSync()
    resize(board(), 320, 320)
    expect(board().classList.contains('dense')).toBe(false)
    await rerender({ state: props({ view: 'candles' }).state })
    flushSync()
    expect(board().classList.contains('tall')).toBe(true)
    expect(board().classList.contains('dense')).toBe(true)
  })

  it('stands the rows in two columns in a wide pane, where half as many lines fit', () => {
    render(MarketsWidget, { props: props({}) })
    flushSync()
    resize(pane(), 1000, 600)
    resize(board(), 1000, 170)
    expect(board().getAttribute('data-columns')).toBe('2')
    expect(board().classList.contains('two')).toBe(true)
    // Four lines of 2.4rem are 154 px: they fit where eight would not.
    expect(board().classList.contains('dense')).toBe(false)
    resize(pane(), 600, 600)
    expect(board().getAttribute('data-columns')).toBe('1')
    expect(board().classList.contains('dense')).toBe(true)
  })

  it('keeps one column for a list too short to fill two', () => {
    render(MarketsWidget, { props: props({ symbols: symbols(2) }) })
    flushSync()
    resize(pane(), 1600, 600)
    expect(board().getAttribute('data-columns')).toBe('1')
  })

  it('shows the change in full and as its percentage, for the styles to choose between', () => {
    render(MarketsWidget, { props: props({ symbols: symbols(1) }) })
    flushSync()
    send('S0', 100)
    const row = screen.getByTestId('market-row')
    expect(row.querySelector('.full')?.textContent).toBe('+10.00 (+10.00%)')
    expect(row.querySelector('.short')?.textContent).toBe('+10.00%')
    expect(row.querySelector('.ticker')?.textContent).toBe('S0')
  })

  it('shows what went wrong in place of the change', () => {
    render(MarketsWidget, { props: props({ symbols: symbols(1) }) })
    flushSync()
    send('S0', null, { quote: null, error: 'fetch failed' })
    expect(screen.getByTestId('market-row').querySelector('.change')?.textContent?.trim()).toBe(
      'fetch failed',
    )
  })
})

describe('MarketsWidget: the bar view in order', () => {
  const order = () => screen.getAllByTestId('market-bar').map((b) => b.getAttribute('data-symbol'))

  it('follows the list until sorted, then the change, with no figure last', async () => {
    const { rerender } = render(MarketsWidget, {
      props: props({ view: 'bars', symbols: symbols(4) }),
    })
    flushSync()
    send('S0', 108) // +1.85%
    send('S1', 100) // +10%
    send('S2', 120) // -8.33%
    expect(order()).toEqual(['S0', 'S1', 'S2', 'S3'])
    const sort = screen.getByTestId('markets-sort')
    expect(sort.getAttribute('aria-pressed')).toBe('false')

    await fireEvent.click(sort)
    expect(vi.mocked(layout.patchPaneState)).toHaveBeenLastCalledWith('p', { sort: 'change' })
    await rerender({ state: props({ view: 'bars', symbols: symbols(4), sort: 'change' }).state })
    flushSync()
    expect(order()).toEqual(['S1', 'S0', 'S2', 'S3'])
    expect(sort.getAttribute('aria-pressed')).toBe('true')

    await fireEvent.click(sort)
    // Unsorting removes the key, and leaves the view where it was.
    // Strictly, since an undefined key is how the store is told to remove it.
    expect(vi.mocked(layout.patchPaneState).mock.lastCall).toStrictEqual(['p', { sort: undefined }])
  })

  it('leaves the line view in the order of the list', () => {
    render(MarketsWidget, { props: props({ symbols: symbols(3), sort: 'change' }) })
    flushSync()
    send('S0', 120)
    send('S1', 100)
    expect(screen.getAllByTestId('market-row').map((r) => r.getAttribute('data-symbol'))).toEqual([
      'S0',
      'S1',
      'S2',
    ])
  })
})

describe("MarketsWidget: the open chart's figures", () => {
  it("shows the range's high, low and base beside the price", () => {
    render(MarketsWidget, { props: props({ focus: 'S1' }) })
    flushSync()
    resize(pane(), 800, 400)
    expect(screen.queryByTestId('market-detail-extremes')).toBeNull()
    send('S1', 100)
    const text = screen.getByTestId('market-detail-extremes').textContent ?? ''
    expect(text.replace(/\s+/g, ' ')).toContain('H 118.00')
    expect(text.replace(/\s+/g, ' ')).toContain('L 96.00')
    expect(text.replace(/\s+/g, ' ')).toContain('BASE 100.00')
  })

  it('leaves the base out when there is none', () => {
    render(MarketsWidget, { props: props({ focus: 'S1' }) })
    flushSync()
    resize(pane(), 800, 400)
    send('S1', null)
    expect(screen.getByTestId('market-detail-extremes').textContent).not.toContain('BASE')
  })

  it('leaves them out of a narrow pane, where they would take a line from the chart', () => {
    render(MarketsWidget, { props: props({ focus: 'S1' }) })
    flushSync()
    resize(pane(), 340, 240)
    send('S1', 100)
    expect(screen.queryByTestId('market-detail-extremes')).toBeNull()
  })
})
