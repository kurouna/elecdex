import type { CandlePoint, MarketUpdate } from '@shared/markets'
import { fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/layout.svelte.ts', () => ({ layout: { setPaneState: vi.fn() } }))

const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { default: ViewToggle } = await import('../../src/renderer/widgets/common/ViewToggle.svelte')
const { default: Sparkline } = await import('../../src/renderer/widgets/markets/Sparkline.svelte')
const { default: Candlestick } = await import(
  '../../src/renderer/widgets/markets/Candlestick.svelte'
)
const { default: MarketsWidget } = await import(
  '../../src/renderer/widgets/markets/MarketsWidget.svelte'
)

/**
 * The market board's chart ranges and views: the three-way toggle (and the CPU
 * pane's two-way one it shares), sparkline points spaced by index, candles
 * merged to the width, and the board subscribing, drawing and measuring by
 * the range in its pane state.
 */

interface Call {
  name: string
  args: number[]
}

const calls: Call[] = []
const paths: Array<{ points: number[][] }> = []

class FakePath {
  readonly points: number[][] = []
  constructor(from?: FakePath) {
    if (from) this.points.push(...from.points)
    paths.push(this)
  }
  moveTo(x: number, y: number) {
    this.points.push([x, y])
  }
  lineTo(x: number, y: number) {
    this.points.push([x, y])
  }
  closePath() {}
}

const record =
  (name: string) =>
  (...args: number[]) => {
    calls.push({ name, args })
  }

const ctx: Record<string, unknown> = {
  setTransform: record('setTransform'),
  clearRect: record('clearRect'),
  beginPath: record('beginPath'),
  moveTo: record('moveTo'),
  lineTo: record('lineTo'),
  stroke: record('stroke'),
  fill: record('fill'),
  fillRect: record('fillRect'),
  arc: record('arc'),
  setLineDash: record('setLineDash'),
  createLinearGradient: () => ({ addColorStop: () => {} }),
}

let width = 120

beforeEach(() => {
  calls.length = 0
  paths.length = 0
  width = 120
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
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40)
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

describe('ViewToggle', () => {
  it('shows line and bars by default, as the CPU pane uses it', () => {
    render(ViewToggle, { props: { view: 'line', onchange: () => {} } })
    const buttons = screen.getAllByRole('radio')
    expect(buttons.map((b) => b.getAttribute('data-view'))).toEqual(['line', 'bars'])
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['line graph', 'bar graph'])
  })

  it('draws candles as hollow bodies with wicks that stop at them', () => {
    render(ViewToggle, { props: { view: 'line', views: ['candles'], onchange: () => {} } })
    const d = document.querySelector('[data-view=candles] path')?.getAttribute('d') ?? ''
    const numbers = (s: string) => (s.match(/-?[\d.]+/g) ?? []).map(Number)
    // Wicks are "M x y V y2"; bodies are "M x1 y1 H x2 V y2 H x1 Z".
    const wicks = [...d.matchAll(/M[\d.]+ [\d.]+ V[\d.]+(?! H)/g)].map((m) => numbers(m[0]))
    const bodies = [...d.matchAll(/M[\d.]+ [\d.]+ H[\d.]+ V[\d.]+ H[\d.]+ Z/g)].map((m) =>
      numbers(m[0]),
    )
    expect(bodies).toHaveLength(2)
    expect(wicks).toHaveLength(4)
    for (const [left = 0, top = 0, right = 0, bottom = 0] of bodies) {
      // Wide enough to stay open inside a 1.6 stroke.
      expect(right - left).toBeGreaterThanOrEqual(4)
      for (const [x = 0, y1 = 0, y2 = 0] of wicks) {
        if (x <= left || x >= right) continue
        const [from, to] = [Math.min(y1, y2), Math.max(y1, y2)]
        expect(to <= top || from >= bottom, `wick ${x} ${y1}-${y2} crosses a body`).toBe(true)
      }
    }
  })

  it('shows the views it is given, in order, and reports a choice', async () => {
    const onchange = vi.fn()
    render(ViewToggle, {
      props: { view: 'candles', views: ['line', 'candles', 'bars'], onchange },
    })
    const buttons = screen.getAllByRole('radio')
    expect(buttons.map((b) => b.getAttribute('data-view'))).toEqual(['line', 'candles', 'bars'])
    expect(buttons.map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false'])
    await fireEvent.click(buttons[2] as HTMLElement)
    expect(onchange).toHaveBeenCalledWith('bars')
  })
})

describe('Sparkline spacing', () => {
  it('places points evenly by index, whatever their times', () => {
    // A night between the second and third points: time would leave a gap.
    const points = [
      { t: 0, v: 1 },
      { t: 1, v: 2 },
      { t: 1000, v: 3 },
      { t: 1001, v: 4 },
    ]
    render(Sparkline, { props: { points, baseline: null, up: true } })
    flushSync()
    const xs = (paths[0]?.points ?? []).map(([x]) => x ?? 0)
    const expected = [1, 1 + 118 / 3, 1 + (2 * 118) / 3, 119]
    expect(xs).toHaveLength(4)
    for (const [i, x] of xs.entries()) expect(x).toBeCloseTo(expected[i] ?? 0)
  })

  it('draws a divider between the points either side of each index', () => {
    const points = [0, 1, 2, 3].map((t) => ({ t, v: t }))
    render(Sparkline, { props: { points, baseline: null, up: true, dividers: [2, 9, 0] } })
    flushSync()
    const moves = calls.filter((c) => c.name === 'moveTo')
    // Halfway between x(1) and x(2), snapped to the pixel grid; out-of-range indices are skipped.
    expect(moves.map((c) => c.args)).toEqual([[60.5, 0]])
  })
})

describe('Candlestick', () => {
  const candles = Array.from({ length: 100 }, (_, i) =>
    bar(i, 100, i === 50 ? 200 : 101, i === 80 ? 10 : 99, i % 2 === 0 ? 100.5 : 99.5),
  )

  it('merges bars to fit the width, and draws a wick and a body for each', () => {
    width = 60
    render(Candlestick, { props: { candles, baseline: null, range: '1d' } })
    flushSync()
    const canvas = screen.getByTestId('market-candles')
    // Three pixels a bar: 20 bars for 60 pixels.
    expect(canvas.getAttribute('data-bars')).toBe('20')
    expect(calls.filter((c) => c.name === 'fillRect')).toHaveLength(40)
    // The spike and the crash survive merging: the wicks reach the top and bottom.
    const rects = calls.filter((c) => c.name === 'fillRect')
    const tops = rects.map((c) => c.args[1] ?? 0)
    const bottoms = rects.map((c) => (c.args[1] ?? 0) + (c.args[3] ?? 0))
    expect(Math.min(...tops)).toBeLessThanOrEqual(4)
    expect(Math.max(...bottoms)).toBeGreaterThanOrEqual(36)
  })

  it('draws every bar when there is room, and the baseline', () => {
    width = 600
    render(Candlestick, { props: { candles: candles.slice(0, 10), baseline: 100, range: '1d' } })
    flushSync()
    expect(screen.getByTestId('market-candles').getAttribute('data-bars')).toBe('10')
    expect(calls.filter((c) => c.name === 'fillRect')).toHaveLength(20)
    expect(calls.filter((c) => c.name === 'moveTo')).toHaveLength(1)
  })

  it('colours rising and falling bars from the probes', () => {
    width = 600
    const styles = vi.spyOn(window, 'getComputedStyle')
    styles.mockImplementation(
      (el: Element) =>
        ({
          color: el.classList.contains('up')
            ? 'rgb(0, 200, 0)'
            : el.classList.contains('down')
              ? 'rgb(200, 0, 0)'
              : 'rgb(1, 1, 1)',
          getPropertyValue: () => '#888',
        }) as unknown as CSSStyleDeclaration,
    )
    const fills: unknown[] = []
    ctx.fillRect = () => fills.push(ctx.fillStyle)
    try {
      render(Candlestick, {
        props: { candles: [bar(0, 1, 2, 0, 2), bar(1, 2, 2, 0, 1)], baseline: null, range: '1d' },
      })
      flushSync()
      expect(fills).toEqual([
        'rgb(0, 200, 0)',
        'rgb(0, 200, 0)',
        'rgb(200, 0, 0)',
        'rgb(200, 0, 0)',
      ])
    } finally {
      ctx.fillRect = record('fillRect')
    }
  })

  it('draws nothing without bars', () => {
    render(Candlestick, { props: { candles: [], baseline: 5, range: '5d' } })
    flushSync()
    expect(calls.filter((c) => c.name === 'fillRect' || c.name === 'moveTo')).toEqual([])
  })
})

describe('MarketsWidget ranges', () => {
  const subscriptions: Array<{ symbol: string; range: string; active: boolean }> = []
  const handlers = new Map<string, (update: MarketUpdate) => void>()

  beforeEach(() => {
    subscriptions.length = 0
    handlers.clear()
    vi.stubGlobal('elecdex', {
      markets: {
        subscribe: (symbol: string, range: string, handler: (update: MarketUpdate) => void) => {
          const entry = { symbol, range, active: true }
          subscriptions.push(entry)
          handlers.set(`${symbol}|${range}`, handler)
          return () => {
            entry.active = false
          }
        },
      },
    })
  })

  const props = (state: Record<string, unknown>) => ({
    paneId: 'p',
    title: 'markets',
    props: undefined,
    state: { symbols: [{ symbol: 'AAA' }, { symbol: 'BBB' }], ...state },
    active: true,
  })

  const send = (symbol: string, range: string, over: Partial<MarketUpdate>) => {
    handlers.get(`${symbol}|${range}`)?.({
      key: `${symbol}|${range}`,
      symbol,
      range: range as MarketUpdate['range'],
      quote: {
        symbol,
        name: symbol,
        price: 110,
        change: -1,
        changePercent: -0.9,
        previousClose: 111,
        currency: null,
        state: 'open',
        time: null,
      },
      candles: [bar(0, 100, 111, 99, 105), bar(1, 105, 112, 104, 110)],
      base: 100,
      baseTime: null,
      updatedAt: 0,
      error: null,
      ...over,
    })
    flushSync()
  }

  it('shows 1D for a pane saved before ranges, and subscribes with it', () => {
    render(MarketsWidget, { props: props({}) })
    flushSync()
    expect(subscriptions.map((s) => `${s.symbol}|${s.range}`)).toEqual(['AAA|1d', 'BBB|1d'])
    expect(screen.getByTestId('markets').getAttribute('data-range')).toBe('1d')
    expect(screen.getByTestId('markets-range').textContent).toBe('1D · 5m')
  })

  it('subscribes with the range in pane state, and moves when it changes', async () => {
    const { rerender } = render(MarketsWidget, { props: props({ range: '5d' }) })
    flushSync()
    expect(subscriptions.map((s) => s.range)).toEqual(['5d', '5d'])
    await rerender({ state: props({ range: '1y' }).state })
    flushSync()
    expect(subscriptions.filter((s) => s.active).map((s) => `${s.symbol}|${s.range}`)).toEqual([
      'AAA|1y',
      'BBB|1y',
    ])
  })

  it('ignores a range it does not know', () => {
    render(MarketsWidget, { props: props({ range: '10y' }) })
    flushSync()
    expect(subscriptions.map((s) => s.range)).toEqual(['1d', '1d'])
  })

  it('saves the range picked in the settings, keeping the rest of the pane state', async () => {
    render(MarketsWidget, { props: props({ view: 'bars' }) })
    flushSync()
    await fireEvent.click(screen.getByTestId('markets-settings-toggle'))
    await fireEvent.click(screen.getByTestId('markets-range-1mo'))
    expect(vi.mocked(layout.setPaneState)).toHaveBeenLastCalledWith('p', {
      symbols: [{ symbol: 'AAA' }, { symbol: 'BBB' }],
      view: 'bars',
      range: '1mo',
    })
  })

  it("shows the range's change on each row, from its base", () => {
    render(MarketsWidget, { props: props({ range: '5d' }) })
    flushSync()
    send('AAA', '5d', {})
    const row = screen.getAllByTestId('market-row')[0] as HTMLElement
    // 100 -> 110 over the range, although the day's change is negative.
    expect(row.textContent).toContain('+10.00%')
    expect(row.classList.contains('up')).toBe(true)
    expect(row.querySelector('[data-testid=market-spark]')?.getAttribute('data-points')).toBe('2')
  })

  it("shows the day's change for 1D", () => {
    render(MarketsWidget, { props: props({}) })
    flushSync()
    send('AAA', '1d', {})
    const row = screen.getAllByTestId('market-row')[0] as HTMLElement
    expect(row.textContent).toContain('−0.90%')
    expect(row.classList.contains('down')).toBe(true)
  })

  it('ignores an update for a range the pane has left', async () => {
    const { rerender } = render(MarketsWidget, { props: props({ range: '5d' }) })
    flushSync()
    const stale = handlers.get('AAA|5d')
    await rerender({ state: props({ range: '1y' }).state })
    flushSync()
    stale?.({
      key: 'AAA|5d',
      symbol: 'AAA',
      range: '5d',
      quote: null,
      candles: [],
      base: 1,
      baseTime: null,
      updatedAt: 0,
      error: 'old',
    })
    flushSync()
    expect(screen.getAllByTestId('market-row')[0]?.textContent).toContain('loading')
  })

  it('draws candles in the candle view', () => {
    render(MarketsWidget, { props: props({ view: 'candles', range: '6mo' }) })
    flushSync()
    send('AAA', '6mo', {})
    expect(screen.getAllByTestId('market-candles')).toHaveLength(2)
    expect(screen.queryByTestId('market-spark')).toBeNull()
    expect(screen.getAllByTestId('market-row')[0]?.textContent).toContain('+10.00%')
  })

  it("scales the bars to the range's moves and marks one past the scale", () => {
    render(MarketsWidget, {
      props: props({
        view: 'bars',
        range: '1y',
        symbols: ['AAA', 'BBB', 'CCC', 'DDD'].map((symbol) => ({ symbol })),
      }),
    })
    flushSync()
    send('AAA', '1y', { base: 100 }) // +10%
    send('BBB', '1y', { base: 105 }) // +4.76%
    send('CCC', '1y', { base: 120 }) // -8.33%
    send('DDD', '1y', { base: 40 }) // +175%
    const bars = screen.getAllByTestId('market-bar')
    expect(bars.map((b) => b.getAttribute('data-pct'))).toEqual([
      '10.00',
      '4.76',
      '-8.33',
      '175.00',
    ])
    expect(bars.map((b) => b.getAttribute('data-clipped'))).toEqual([
      'false',
      'false',
      'false',
      'true',
    ])
    expect(bars[3]?.textContent).toContain('▸')
    expect(bars[3]?.textContent).toContain('+175.00%')
    // The median move is about 9%, so the scale stops at 50% instead of 200%.
    expect(screen.getByText('+50%')).toBeTruthy()
    expect(screen.getByText('1Y')).toBeTruthy()
    expect(bars[0]?.getAttribute('title')).toBe('AAA · base 100.00 (previous close) → 110.00')
  })

  it('names the day the base closed on, outside 1D', () => {
    render(MarketsWidget, { props: props({ view: 'bars', range: '5d' }) })
    flushSync()
    const t = new Date(2026, 8, 10, 15).getTime()
    send('AAA', '5d', { baseTime: t })
    const expected = new Date(t).toLocaleDateString(navigator.language, {
      month: 'numeric',
      day: 'numeric',
    })
    expect(screen.getAllByTestId('market-bar')[0]?.getAttribute('title')).toBe(
      `AAA · base 100.00 (${expected} close) → 110.00`,
    )
  })
})
