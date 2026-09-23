import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import {
  applyQuoteToCandles,
  barScale,
  type CandlePoint,
  CHART_BARS,
  CHART_RANGES,
  type ChartRange,
  type ChartRangeSpec,
  chartKey,
  dividerIndices,
  isIntraday,
  lastSession,
  type MarketQuote,
  type MarketUpdate,
  mergeCandles,
  normaliseCandles,
  parseChartKey,
  rangeChange,
  rangeSpec,
  rangeWindow,
} from '@shared/markets'
import { describe, expect, it } from 'vitest'
import {
  MarketService,
  QUOTE_INTERVAL_MS,
  STALE_REFETCH_MS,
  WATCH_BATCH_MS,
} from '../../src/main/markets/service.js'
import { readCandles, stubProvider } from '../../src/main/markets/yahoo.js'

/**
 * Chart ranges on the market board: the range table, the candle helpers, the
 * service keeping one chart per symbol and range, and the providers' parsing.
 */

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

const bar = (t: number, o: number, h: number, l: number, c: number): CandlePoint => ({
  t,
  o,
  h,
  l,
  c,
})
const flat = (t: number, v: number): CandlePoint => bar(t, v, v, v, v)

describe('chart ranges', () => {
  it('offers six ranges, with hourly bars for a month', () => {
    expect(CHART_RANGES.map((r) => `${r.label}:${r.interval}`)).toEqual([
      '1D:5m',
      '5D:30m',
      '1M:60m',
      '6M:1d',
      '1Y:1wk',
      '5Y:1mo',
    ])
  })

  it('asks Yahoo for more than it shows, within its intraday limits', () => {
    for (const spec of CHART_RANGES) {
      expect(spec.fetchMs, spec.id).toBeGreaterThan(spec.spanMs)
      // Bars under an hour go back 60 days, hourly bars 730.
      if (spec.barMs < HOUR) expect(spec.fetchMs, spec.id).toBeLessThan(60 * DAY)
      if (spec.barMs === HOUR) expect(spec.fetchMs, spec.id).toBeLessThan(730 * DAY)
      expect(spec.sessions !== undefined, spec.id).toBe(spec.barMs < HOUR)
    }
  })

  it('parses only well-formed chart keys', () => {
    expect(parseChartKey(chartKey('JPY=X', '5d'))).toEqual({ symbol: 'JPY=X', range: '5d' })
    expect(parseChartKey('^N225|1y')).toEqual({ symbol: '^N225', range: '1y' })
    expect(parseChartKey('^N225')).toBeNull()
    expect(parseChartKey('^N225|2d')).toBeNull()
    expect(parseChartKey('^N225|')).toBeNull()
    expect(parseChartKey('bad symbol|1d')).toBeNull()
    expect(parseChartKey('a|b|1d')).toBeNull()
    expect(parseChartKey(42)).toBeNull()
    expect(parseChartKey(null)).toBeNull()
  })
})

describe('lastSession over several sessions', () => {
  // Five 30-minute bars a day, 09:00 to 11:00, on six weekdays.
  const days = [0, 1, 2, 3, 4, 7].map((d) => Date.UTC(2026, 8, 7 + d, 0))
  const bars = days.flatMap((day, i) =>
    Array.from({ length: 5 }, (_, k) => flat(day + k * 30 * MIN, i * 10 + k)),
  )

  it('keeps the last n sessions, cutting at the pauses between them', () => {
    const five = lastSession(bars, 10 * DAY, 90 * MIN, 5)
    expect(five).toHaveLength(25)
    expect(five[0]?.c).toBe(10)
    expect(lastSession(bars, 10 * DAY, 90 * MIN, 1).map((b) => b.c)).toEqual([50, 51, 52, 53, 54])
  })

  it('never reaches back further than the span', () => {
    const cut = lastSession(bars, 2 * DAY, 90 * MIN, 5)
    expect(cut.every((b) => b.t >= (bars.at(-1)?.t ?? 0) - 2 * DAY)).toBe(true)
  })

  it('keeps a market that never pauses to the span', () => {
    const allDay = Array.from({ length: 10 * 48 }, (_, i) => flat(i * 30 * MIN, i))
    const kept = lastSession(allDay, 5 * DAY, 90 * MIN, 5)
    expect((kept.at(-1)?.t ?? 0) - (kept[0]?.t ?? 0)).toBeLessThanOrEqual(5 * DAY)
    expect(kept.length).toBeGreaterThan(5 * 47)
  })
})

describe('mergeCandles', () => {
  const bars = Array.from({ length: 10 }, (_, i) => bar(i, 100 + i, 105 + i, 95 + i, 101 + i))
  bars[3] = bar(3, 103, 500, 98, 104) // a spike
  bars[8] = bar(8, 108, 113, 1, 109) // a crash

  it('merges neighbours without losing an extreme', () => {
    const merged = mergeCandles(bars, 3)
    expect(merged).toHaveLength(3)
    expect(Math.max(...merged.map((b) => b.h))).toBe(500)
    expect(Math.min(...merged.map((b) => b.l))).toBe(1)
    expect(merged[0]).toEqual({ t: 0, o: 100, h: 500, l: 95, c: 104 })
    expect(merged.at(-1)?.c).toBe(110)
  })

  it('leaves a short list alone', () => {
    expect(mergeCandles(bars, 10)).toEqual(bars)
    expect(mergeCandles(bars, 0)).toEqual(bars)
  })

  it('groups from the oldest, so a new bar only changes the newest group', () => {
    const before = mergeCandles(bars.slice(0, 9), 3)
    const after = mergeCandles(bars, 4)
    expect(after.slice(0, 3)).toEqual(before)
  })
})

describe('normaliseCandles', () => {
  it('sorts and folds a live row into the bar it belongs to', () => {
    const week = 7 * DAY
    const rows = [flat(week, 5), bar(0, 1, 2, 0.5, 1.5), bar(week + 2 * DAY, 5, 9, 4, 8)]
    expect(normaliseCandles(rows, week)).toEqual([
      bar(0, 1, 2, 0.5, 1.5),
      { t: week, o: 5, h: 9, l: 4, c: 8 },
    ])
  })
})

describe('rangeWindow', () => {
  const sixMonths = rangeSpec('6mo')

  it('measures from the close of the bar before the window', () => {
    const bars = Array.from({ length: 200 }, (_, i) => flat(i * DAY, i))
    const { candles, base, baseTime } = rangeWindow(bars, sixMonths, 7)
    expect(candles[0]?.t).toBeGreaterThan((bars.at(-1)?.t ?? 0) - sixMonths.spanMs)
    const before = bars[bars.length - candles.length - 1]
    expect(base).toBe(before?.c)
    expect(baseTime).toBe(before?.t)
  })

  it("falls back to Yahoo's previous close, then to the first open", () => {
    const bars = [bar(0, 10, 11, 9, 10.5), flat(DAY, 11)]
    expect(rangeWindow(bars, sixMonths, 9.5)).toMatchObject({ base: 9.5, baseTime: null })
    expect(rangeWindow(bars, sixMonths, null)).toMatchObject({ base: 10, baseTime: null })
    expect(rangeWindow([], sixMonths, 9.5)).toEqual({ candles: [], base: 9.5, baseTime: null })
  })

  it('keeps the last session for 1D and its close before as the base', () => {
    const bars = [flat(0, 1), flat(5 * MIN, 2), flat(20 * HOUR, 3), flat(20 * HOUR + 5 * MIN, 4)]
    expect(rangeWindow(bars, rangeSpec('1d'), null)).toEqual({
      candles: bars.slice(2),
      base: 2,
      baseTime: 5 * MIN,
    })
  })
})

describe('applyQuoteToCandles', () => {
  const oneDay = rangeSpec('1d')
  const bars = [bar(0, 10, 12, 9, 11), bar(5 * MIN, 11, 11.5, 10.5, 11)]

  it('extends the current intraday bar', () => {
    const { candles, stale } = applyQuoteToCandles(bars, oneDay, 13, 7 * MIN)
    expect(stale).toBe(false)
    expect(candles).toEqual([bars[0], bar(5 * MIN, 11, 13, 10.5, 13)])
    expect(applyQuoteToCandles(bars, oneDay, 10, 8 * MIN).candles.at(-1)).toEqual(
      bar(5 * MIN, 11, 11.5, 10, 10),
    )
  })

  it('opens the next intraday bar on the bar grid', () => {
    const { candles } = applyQuoteToCandles(bars, oneDay, 12, 17 * MIN)
    expect(candles).toHaveLength(3)
    expect(candles.at(-1)).toEqual(flat(15 * MIN, 12))
  })

  it('ignores a quote older than the newest bar, and bars that are not there yet', () => {
    expect(applyQuoteToCandles(bars, oneDay, 99, -1).candles).toEqual(bars)
    expect(applyQuoteToCandles([], oneDay, 99, 0)).toEqual({ candles: [], stale: false })
  })

  it('updates a daily bar within its day and reports a later quote as stale', () => {
    const daily = rangeSpec('6mo')
    const days = [flat(0, 10), flat(DAY, 11)]
    expect(applyQuoteToCandles(days, daily, 12, DAY + HOUR)).toEqual({
      candles: [flat(0, 10), bar(DAY, 11, 12, 11, 12)],
      stale: false,
    })
    expect(applyQuoteToCandles(days, daily, 12, 2 * DAY + HOUR)).toEqual({
      candles: days,
      stale: true,
    })
  })

  it('always updates the newest weekly or monthly bar', () => {
    for (const range of ['1y', '5y'] as const) {
      const spec = rangeSpec(range)
      const { candles, stale } = applyQuoteToCandles([flat(0, 10)], spec, 8, spec.barMs + DAY)
      expect(stale, range).toBe(false)
      expect(candles, range).toEqual([bar(0, 10, 10, 8, 8)])
    }
  })
})

const quote = (over: Partial<MarketQuote> = {}): MarketQuote => ({
  symbol: 'X',
  name: 'X',
  price: 110,
  change: 2,
  changePercent: 1.85,
  previousClose: 108,
  currency: null,
  state: 'open',
  time: null,
  ...over,
})

const update = (over: Partial<MarketUpdate>): MarketUpdate => ({
  key: 'X|1d',
  symbol: 'X',
  range: '1d',
  quote: quote(),
  candles: [],
  base: 100,
  baseTime: null,
  updatedAt: 0,
  error: null,
  ...over,
})

describe('rangeChange', () => {
  it("uses the quote's own change for 1D", () => {
    expect(rangeChange(update({}))).toEqual({ change: 2, percent: 1.85 })
    expect(rangeChange(update({ quote: null }))).toBeNull()
  })

  it('measures other ranges from their base to the latest price', () => {
    expect(rangeChange(update({ range: '5d' }))).toEqual({ change: 10, percent: 10 })
    const noQuote = update({ range: '1y', quote: null, candles: [flat(0, 80)] })
    expect(rangeChange(noQuote)).toEqual({ change: -20, percent: -20 })
  })

  it('has no move without both ends', () => {
    expect(rangeChange(update({ range: '5d', base: null }))).toBeNull()
    expect(rangeChange(update({ range: '5d', base: 0 }))).toBeNull()
    expect(rangeChange(update({ range: '5d', quote: null }))).toBeNull()
  })
})

describe('barScale', () => {
  it('rounds small moves up to a half percent, at least 1%', () => {
    expect(barScale([1.25, -0.8])).toBe(1.5)
    expect(barScale([0.1, 0.2])).toBe(1)
    expect(barScale([])).toBe(1)
    expect(barScale([-4.6, 4.2, 3.9])).toBe(5)
  })

  it('rounds large moves to 1, 2 or 5 times a power of ten', () => {
    expect(barScale([12, 11, 9])).toBe(20)
    expect(barScale([-35, 30, 28])).toBe(50)
    expect(barScale([90, 150, 160])).toBe(200)
  })

  it('caps the scale at four times the median move', () => {
    // Bitcoin doubled; the rest moved about 5%.
    expect(barScale([5, 4, 6, 5, 100])).toBe(20)
    expect(barScale([0.3, 0.4, 0.5, 6])).toBe(2)
  })

  it('ignores moves that are not numbers', () => {
    expect(barScale([Number.NaN, 2])).toBe(2)
  })
})

describe('dividerIndices', () => {
  const local = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).getTime()

  it('marks new days for 5D and nothing for 1D', () => {
    const bars = [local(2026, 8, 10, 10), local(2026, 8, 10, 14), local(2026, 8, 11, 10)]
    const points = bars.map((t) => ({ t }))
    expect(dividerIndices(points, '5d')).toEqual([2])
    expect(dividerIndices(points, '1d')).toEqual([])
  })

  it('marks weeks from Monday for 1M', () => {
    // Friday 2026-09-11, Monday 14th, Tuesday 15th, Sunday 20th, Monday 21st.
    const points = [11, 14, 15, 20, 21].map((d) => ({ t: local(2026, 8, d) }))
    expect(dividerIndices(points, '1mo')).toEqual([1, 4])
  })

  it('marks months for 6M and 1Y, years for 5Y', () => {
    const points = [
      local(2025, 11, 30),
      local(2026, 0, 2),
      local(2026, 0, 30),
      local(2026, 1, 2),
    ].map((t) => ({ t }))
    expect(dividerIndices(points, '6mo')).toEqual([1, 3])
    expect(dividerIndices(points, '1y')).toEqual([1, 3])
    expect(dividerIndices(points, '5y')).toEqual([1])
  })
})

/** The service with a clock, due-time timers and a provider that serves bars per range. */
function harness(opts: { bars?: (spec: ChartRangeSpec, now: number) => CandlePoint[] } = {}) {
  let now = Date.UTC(2026, 8, 14, 1, 0)
  const timers: Array<{ at: number; fn: () => void; id: number }> = []
  let nextId = 1
  const quoteCalls: string[] = []
  const chartCalls: string[] = []
  let price = 100
  let quoteTime: number | null = null
  const published: MarketUpdate[] = []
  const service = new MarketService({
    provider: {
      quotes: async (symbols) => {
        quoteCalls.push(symbols.join(','))
        return symbols.map((symbol) => quote({ symbol, price, time: quoteTime ?? now }))
      },
      chart: async (symbol, spec) => {
        chartCalls.push(chartKey(symbol, spec.id))
        const bars = opts.bars?.(spec, now) ?? [flat(now - spec.barMs, 99), flat(now, 100)]
        return { candles: bars, previousClose: 98 }
      },
    },
    now: () => now,
    setTimer: (fn, ms) => {
      const id = nextId++
      timers.push({ at: now + ms, fn, id })
      return id
    },
    clearTimer: (id) => {
      const i = timers.findIndex((t) => t.id === id)
      if (i >= 0) timers.splice(i, 1)
    },
    publish: (u) => published.push(u),
  })
  // The service's own work is promises only (its timers are the ones above), so letting
  // the microtasks run is enough - and unlike a real timer per step, it costs nothing.
  // A step per virtual minute over an hour used to take seconds of real time, which left
  // this file failing its five-second limit whenever the machine was busy.
  const settle = async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve()
  }
  const advance = async (ms: number) => {
    const target = now + ms
    for (;;) {
      timers.sort((a, b) => a.at - b.at)
      const due = timers[0]
      if (!due || due.at > target) break
      timers.shift()
      now = due.at
      due.fn()
      await settle()
    }
    now = target
  }
  const chartsOf = (key: string) => chartCalls.filter((c) => c === key).length
  const last = (key: string) => published.filter((u) => u.key === key).at(-1)
  return {
    service,
    quoteCalls,
    chartCalls,
    chartsOf,
    last,
    advance,
    now: () => now,
    setPrice: (p: number) => {
      price = p
    },
    setQuoteTime: (t: number | null) => {
      quoteTime = t
    },
  }
}

describe('MarketService with ranges', () => {
  it('quotes a symbol once however many ranges show it, and fetches each chart', async () => {
    const h = harness()
    h.service.watch('^N225', '1d')
    h.service.watch('^N225', '5d')
    h.service.watch('JPY=X', '5d')
    await h.advance(WATCH_BATCH_MS)
    expect(h.quoteCalls).toEqual(['JPY=X,^N225'])
    expect([...h.chartCalls].sort()).toEqual(['JPY=X|5d', '^N225|1d', '^N225|5d'])
    expect(h.service.watching()).toEqual(['JPY=X', '^N225'])
    expect(h.service.watchingCharts()).toEqual(['JPY=X|5d', '^N225|1d', '^N225|5d'])
    // Each subscription hears about its own chart.
    expect(h.last('^N225|5d')).toMatchObject({ symbol: '^N225', range: '5d', error: null })
    expect(h.last('^N225|1d')?.range).toBe('1d')
  })

  it("refetches each chart at its range's own interval", async () => {
    const h = harness()
    const ranges: ChartRange[] = ['1d', '5d', '1mo', '6mo']
    for (const range of ranges) h.service.watch('X', range)
    await h.advance(WATCH_BATCH_MS)
    await h.advance(60 * MIN)
    // 1D every 5 minutes, 5D every 15, 1M every 30, 6M hourly: the first fetch plus one per interval.
    expect(ranges.map((r) => h.chartsOf(`X|${r}`))).toEqual([13, 5, 3, 2])
  })

  it('stops quoting a symbol only when its last range goes, and ignores bad ranges', async () => {
    const h = harness()
    h.service.watch('X', '1d')
    h.service.watch('X', '1y')
    h.service.watch('X', '2y' as ChartRange)
    await h.advance(WATCH_BATCH_MS)
    expect(h.service.watchingCharts()).toEqual(['X|1d', 'X|1y'])
    h.service.unwatch('X', '1d')
    expect(h.service.watching()).toEqual(['X'])
    await h.advance(QUOTE_INTERVAL_MS)
    expect(h.quoteCalls).toHaveLength(2)
    h.service.unwatch('X', '1y')
    expect(h.service.watching()).toEqual([])
    await h.advance(60 * MIN)
    expect(h.quoteCalls).toHaveLength(2)
  })

  it('asks nothing for a pane that comes back within the minute, and all it missed after longer', async () => {
    const h = harness()
    h.service.watch('X', '1d')
    await h.advance(WATCH_BATCH_MS)
    expect(h.quoteCalls).toHaveLength(1)
    // Behind a tab for ten seconds: the quote and bars are still this minute's.
    h.service.unwatch('X', '1d')
    await h.advance(10_000)
    h.service.watch('X', '1d')
    await h.advance(WATCH_BATCH_MS)
    expect(h.quoteCalls).toHaveLength(1)
    // The minute goes on from the last quote, not from the return.
    await h.advance(QUOTE_INTERVAL_MS - 10_000 - WATCH_BATCH_MS)
    expect(h.quoteCalls).toHaveLength(2)
    // Away for ten minutes: quoted at once, and the bars fetched again for the gap.
    h.service.unwatch('X', '1d')
    await h.advance(10 * MIN)
    const charts = h.chartsOf('X|1d')
    h.service.watch('X', '1d')
    await h.advance(WATCH_BATCH_MS)
    expect(h.quoteCalls).toHaveLength(3)
    expect(h.chartsOf('X|1d')).toBe(charts + 1)
  })

  it('fetches a range added later without waiting a minute', async () => {
    const h = harness()
    h.service.watch('X', '1d')
    await h.advance(WATCH_BATCH_MS)
    h.service.watch('X', '6mo')
    await h.advance(WATCH_BATCH_MS)
    expect(h.chartsOf('X|6mo')).toBe(1)
  })

  it('measures 1D from the previous close and other ranges from their own base', async () => {
    const h = harness({
      bars: (spec, now) => [flat(now - 3 * spec.barMs, 90), flat(now - spec.barMs, 95)],
    })
    h.service.watch('X', '1d')
    h.service.watch('X', '6mo')
    await h.advance(WATCH_BATCH_MS)
    expect(h.last('X|1d')?.base).toBe(108)
    // Both bars fall in the window: no bar before it, so Yahoo's previous close.
    expect(h.last('X|6mo')?.base).toBe(98)
  })

  it('sends at most CHART_BARS bars, merged rather than thinned', async () => {
    const h = harness({
      bars: (spec, now) =>
        Array.from({ length: 288 }, (_, i) =>
          bar(now - (287 - i) * spec.barMs, 100, i === 7 ? 999 : 101, i === 200 ? 1 : 99, 100),
        ),
    })
    h.service.watch('BTC-USD', '1d')
    await h.advance(WATCH_BATCH_MS)
    const candles = h.last('BTC-USD|1d')?.candles ?? []
    expect(candles.length).toBeLessThanOrEqual(CHART_BARS)
    expect(candles.length).toBeGreaterThan(CHART_BARS / 2)
    expect(Math.max(...candles.map((c) => c.h))).toBe(999)
    expect(Math.min(...candles.map((c) => c.l))).toBe(1)
  })

  it('moves the newest bar with each minute quote, and opens the next one', async () => {
    const h = harness({
      bars: (_spec, now) => [flat(now - 10 * MIN, 99), flat(now - 5 * MIN, 100)],
    })
    h.service.watch('X', '1d')
    await h.advance(WATCH_BATCH_MS)
    const opened = h.last('X|1d')?.candles ?? []
    // The first quote arrived with the bars: it is at "now", past the newest bar's five minutes.
    expect(opened).toHaveLength(3)
    h.setPrice(104)
    await h.advance(QUOTE_INTERVAL_MS)
    const moved = h.last('X|1d')?.candles ?? []
    expect(moved).toHaveLength(3)
    expect(moved.at(-1)).toMatchObject({ h: 104, c: 104 })
    h.setPrice(96)
    await h.advance(QUOTE_INTERVAL_MS)
    expect(h.last('X|1d')?.candles.at(-1)).toMatchObject({ o: 100, h: 104, l: 96, c: 96 })
  })

  it('refetches daily bars soon after a quote from a new day, not every minute', async () => {
    const h = harness({ bars: (_spec, now) => [flat(now - 2 * DAY, 90), flat(now - DAY / 2, 95)] })
    h.service.watch('X', '6mo')
    await h.advance(WATCH_BATCH_MS)
    expect(h.chartsOf('X|6mo')).toBe(1)
    h.setQuoteTime(h.now() + DAY)
    await h.advance(STALE_REFETCH_MS - MIN)
    expect(h.chartsOf('X|6mo')).toBe(1)
    await h.advance(MIN)
    expect(h.chartsOf('X|6mo')).toBe(2)
    // The refetched bars still end a day earlier: the next try waits five minutes again.
    await h.advance(MIN)
    expect(h.chartsOf('X|6mo')).toBe(2)
  })

  it('keeps the old bars when a chart fetch fails, and tries again at the next refresh', async () => {
    let fail = false
    const calls: string[] = []
    let now = 0
    const timers: Array<{ at: number; fn: () => void }> = []
    const published: MarketUpdate[] = []
    const service = new MarketService({
      provider: {
        quotes: async (symbols) => symbols.map((symbol) => quote({ symbol, time: now })),
        chart: async (symbol, spec) => {
          calls.push(chartKey(symbol, spec.id))
          if (fail) throw new Error('down')
          return { candles: [flat(now - 5 * MIN, 1)], previousClose: null }
        },
      },
      now: () => now,
      setTimer: (fn, ms) => timers.push({ at: now + ms, fn }),
      clearTimer: () => {},
      publish: (u) => published.push(u),
    })
    const run = async (to: number) => {
      for (;;) {
        timers.sort((a, b) => a.at - b.at)
        const due = timers[0]
        if (!due || due.at > to) break
        timers.shift()
        now = due.at
        due.fn()
        // Promises only, as in the harness above.
        for (let i = 0; i < 20; i++) await Promise.resolve()
      }
      now = to
    }
    service.watch('X', '1d')
    await run(WATCH_BATCH_MS)
    fail = true
    await run(6 * MIN)
    expect(calls).toHaveLength(2)
    expect(published.at(-1)?.candles.length).toBeGreaterThan(0)
    await run(8 * MIN)
    expect(calls).toHaveLength(2)
  })
})

describe('readCandles', () => {
  it("reads Yahoo's rows and drops those missing a price", () => {
    const date = new Date(Date.UTC(2026, 8, 14))
    expect(
      readCandles([
        { date, open: 10, high: 12, low: 9, close: 11 },
        { date, open: 10, high: null, low: 9, close: 11 },
        { date: null, open: 10, high: 12, low: 9, close: 11 },
        { date, open: Number.NaN, high: 12, low: 9, close: 11 },
      ]),
    ).toEqual([bar(date.getTime(), 10, 12, 9, 11)])
  })

  it('widens a live bar whose high and low do not yet bracket its open and close', () => {
    expect(
      readCandles([{ date: 1_789_000_000, open: 10, high: 10.5, low: 10.2, close: 11 }]),
    ).toEqual([bar(1_789_000_000_000, 10, 11, 10, 11)])
  })
})

describe('stubProvider', () => {
  it('reads candles, or a plain series as flat bars, and asks for the range', async () => {
    const paths: string[] = []
    const server = createServer((req, res) => {
      paths.push(req.url ?? '')
      const body = req.url?.includes('range=1d')
        ? [{ t: 1, v: 5 }]
        : { candles: [bar(DAY, 1, 2, 0, 1), bar(0, 1, 3, 1, 2)], previousClose: 0.5 }
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(body))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    try {
      const provider = stubProvider(`http://127.0.0.1:${(server.address() as AddressInfo).port}`)
      expect(await provider.chart('^N225', rangeSpec('1d'))).toEqual({
        candles: [flat(1, 5)],
        previousClose: null,
      })
      const daily = await provider.chart('^N225', rangeSpec('6mo'))
      expect(daily).toEqual({
        candles: [bar(0, 1, 3, 1, 2), bar(DAY, 1, 2, 0, 1)],
        previousClose: 0.5,
      })
      expect(paths).toEqual(['/chart/%5EN225?range=1d', '/chart/%5EN225?range=6mo'])
    } finally {
      await new Promise((resolve) => server.close(resolve))
    }
  })
})

it('uses intraday bars only below a day', () => {
  expect(CHART_RANGES.filter(isIntraday).map((r) => r.id)).toEqual(['1d', '5d', '1mo'])
})
