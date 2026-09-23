import {
  applyQuoteToCandles,
  type CandlePoint,
  CHART_BARS,
  type ChartRange,
  type ChartRangeSpec,
  chartKey,
  DEFAULT_RANGE,
  isChartRange,
  isSymbol,
  type MarketQuote,
  type MarketUpdate,
  mergeCandles,
  rangeSpec,
  rangeWindow,
} from '@shared/markets'

/**
 * Keeps quotes and charts for what some pane is showing, and nothing else.
 *
 *  - A pane watches a chart: a symbol over a range (1D, 5D, ...). Quotes are per
 *    symbol, so one batched quote request per minute covers every watched
 *    symbol whatever its ranges; when all of them are closed, once every five
 *    minutes.
 *  - Each chart's bars are fetched when first watched and again at its range's
 *    refresh interval; the minute quotes extend them in between.
 *  - Failures keep the last data on screen and retry with backoff.
 *
 * The data source is injected (yahoo-finance2 in the app, a stub in tests), as
 * are the clock and timers, so the schedule is unit-tested.
 */

export interface MarketProvider {
  quotes(symbols: string[]): Promise<MarketQuote[]>
  /**
   * A range's bars, oldest first, reaching back `spec.fetchMs`, and the close
   * before the first of them when the source knows it.
   */
  chart(
    symbol: string,
    spec: ChartRangeSpec,
  ): Promise<{ candles: CandlePoint[]; previousClose: number | null }>
}

export interface MarketDeps {
  provider: MarketProvider
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  publish(update: MarketUpdate): void
}

export const QUOTE_INTERVAL_MS = 60_000
/** A pane subscribes its charts one message at a time; gather them into one request. */
export const WATCH_BATCH_MS = 250
export const CLOSED_INTERVAL_MS = 5 * 60_000
/** A chart whose newest bar has ended is fetched again, but not more often than this. */
export const STALE_REFETCH_MS = 5 * 60_000
export const RETRY_BACKOFF_MS = [60_000, 2 * 60_000, 5 * 60_000]
/** Bars kept per chart at full resolution: a month of hourly bars around the clock. */
export const CHART_KEEP = 800

interface QuoteState {
  quote: MarketQuote | null
  updatedAt: number | null
  error: string | null
}

interface ChartState {
  symbol: string
  range: ChartRange
  candles: CandlePoint[]
  base: number | null
  baseTime: number | null
  fetchedAt: number | null
  /** The newest bar has ended: fetch again at the next tick (after STALE_REFETCH_MS). */
  stale: boolean
}

export class MarketService {
  private readonly deps: MarketDeps
  private readonly quotes = new Map<string, QuoteState>()
  private readonly charts = new Map<string, ChartState>()
  private readonly watched = new Set<string>()
  private timer: unknown = null
  private failures = 0
  private running = false
  private disposed = false

  constructor(deps: MarketDeps) {
    this.deps = deps
  }

  snapshot(symbol: string, range: ChartRange = DEFAULT_RANGE): MarketUpdate {
    const key = chartKey(symbol, range)
    const q = this.quotes.get(symbol)
    const c = this.charts.get(key)
    // 1D is measured from the previous close, which the quote knows best.
    const base = (range === '1d' ? q?.quote?.previousClose : null) ?? c?.base ?? null
    return {
      key,
      symbol,
      range,
      quote: q?.quote ?? null,
      candles: mergeCandles(c?.candles ?? [], CHART_BARS),
      base,
      baseTime: c?.baseTime ?? null,
      updatedAt: q?.updatedAt ?? null,
      error: q?.error ?? null,
    }
  }

  watch(symbol: string, range: ChartRange = DEFAULT_RANGE): void {
    if (!isSymbol(symbol) || !isChartRange(range)) return
    const key = chartKey(symbol, range)
    if (this.watched.has(key)) return
    this.watched.add(key)
    if (!this.quotes.has(symbol)) {
      this.quotes.set(symbol, { quote: null, updatedAt: null, error: null })
    }
    if (!this.charts.has(key)) {
      this.charts.set(key, {
        symbol,
        range,
        candles: [],
        base: null,
        baseTime: null,
        fetchedAt: null,
        stale: false,
      })
    }
    this.scheduleFor(symbol, key)
  }

  /**
   * When a chart just watched needs Yahoo. A new chart, or a symbol not quoted
   * this minute, wants data now - after a moment for the rest of the pane's
   * charts to arrive, so they share the request. A pane coming back from behind
   * a tab with everything fresh asks for nothing: its snapshot is current, and
   * the minute goes on as it was.
   */
  private scheduleFor(symbol: string, key: string): void {
    const quote = this.quotes.get(symbol)
    const chart = this.charts.get(key)
    if (quote === undefined || chart === undefined) return
    const now = this.deps.now()
    const quoted = quote.updatedAt
    // Unquoted for longer than a minute's step, its bars have a gap the minute quotes did not fill.
    if (quoted === null || now - quoted > 2 * QUOTE_INTERVAL_MS) chart.fetchedAt = null
    if (quoted === null || now - quoted >= QUOTE_INTERVAL_MS || this.due(chart, now)) {
      this.schedule(WATCH_BATCH_MS)
    } else if (this.timer === null) {
      this.schedule(quoted + QUOTE_INTERVAL_MS - now)
    }
  }

  unwatch(symbol: string, range: ChartRange = DEFAULT_RANGE): void {
    this.watched.delete(chartKey(symbol, range))
    if (this.watched.size === 0 && this.timer !== null) {
      this.deps.clearTimer(this.timer)
      this.timer = null
    }
  }

  /** The symbols being quoted. */
  watching(): string[] {
    return [...new Set(this.watchedCharts().map((c) => c.symbol))].sort()
  }

  /** The charts being kept, as their keys. */
  watchingCharts(): string[] {
    return [...this.watched].sort()
  }

  dispose(): void {
    this.disposed = true
    this.watched.clear()
    if (this.timer !== null) this.deps.clearTimer(this.timer)
    this.timer = null
  }

  private watchedCharts(): ChartState[] {
    return [...this.watched].flatMap((key) => this.charts.get(key) ?? [])
  }

  private schedule(delayMs: number): void {
    if (this.disposed || this.watched.size === 0) return
    if (this.timer !== null) this.deps.clearTimer(this.timer)
    this.timer = this.deps.setTimer(() => {
      this.timer = null
      void this.tick()
    }, delayMs)
  }

  private async tick(): Promise<void> {
    if (this.running || this.watched.size === 0) return
    this.running = true
    const keys = this.watchingCharts()
    const symbols = this.watching()
    try {
      const quotes = await this.deps.provider.quotes(symbols)
      await this.succeeded(keys, symbols, quotes)
    } catch (cause) {
      this.failed(keys, cause instanceof Error ? cause.message : String(cause))
    } finally {
      this.running = false
    }
  }

  private async succeeded(keys: string[], symbols: string[], quotes: MarketQuote[]): Promise<void> {
    const now = this.deps.now()
    await this.refreshCharts(keys, now)
    // After the charts, so bars fetched just now take this minute's price too.
    for (const quote of quotes) this.applyQuote(quote, now)
    this.failures = 0
    const quoted = new Set(quotes.map((q) => q.symbol))
    for (const symbol of symbols) {
      const state = this.quotes.get(symbol)
      // Yahoo occasionally leaves a symbol out of a batch; a quote from an earlier
      // minute is still worth showing, so only a symbol never quoted is an error.
      if (state)
        state.error = quoted.has(symbol) || state.quote !== null ? null : 'no quote for this symbol'
    }
    this.publishAll(keys)
    // Charts watched while this request was in flight should not wait a minute.
    const added = this.watchingCharts().some((key) => !keys.includes(key))
    const allClosed = quotes.length > 0 && quotes.every((q) => q.state === 'closed')
    this.schedule(added ? WATCH_BATCH_MS : allClosed ? CLOSED_INTERVAL_MS : QUOTE_INTERVAL_MS)
  }

  private failed(keys: string[], message: string): void {
    for (const symbol of new Set(keys.flatMap((key) => this.charts.get(key)?.symbol ?? []))) {
      const state = this.quotes.get(symbol)
      if (state) state.error = message
    }
    this.publishAll(keys)
    const delay = RETRY_BACKOFF_MS[Math.min(this.failures, RETRY_BACKOFF_MS.length - 1)] ?? 60_000
    this.failures += 1
    this.schedule(delay)
  }

  private publishAll(keys: string[]): void {
    for (const key of keys) {
      const chart = this.charts.get(key)
      if (chart) this.deps.publish(this.snapshot(chart.symbol, chart.range))
    }
  }

  private applyQuote(quote: MarketQuote, now: number): void {
    const state = this.quotes.get(quote.symbol)
    if (!state) return
    state.quote = quote
    state.updatedAt = now
    // Extend every chart of the symbol with the minute quote, even charts not
    // watched right now: they are refetched before they are shown again anyway.
    const at = quote.time ?? now
    for (const chart of this.charts.values()) {
      if (chart.symbol !== quote.symbol || chart.candles.length === 0) continue
      const spec = rangeSpec(chart.range)
      const next = applyQuoteToCandles(chart.candles, spec, quote.price, at)
      const window = rangeWindow(next.candles, spec, chart.base)
      // A new session pushed the oldest out of the window: its close is the new base.
      if (window.candles.length < next.candles.length) {
        chart.base = window.base
        chart.baseTime = window.baseTime
      }
      chart.candles = window.candles.slice(-CHART_KEEP)
      if (next.stale) chart.stale = true
    }
  }

  private due(chart: ChartState, now: number): boolean {
    if (chart.fetchedAt === null) return true
    const age = now - chart.fetchedAt
    return age >= rangeSpec(chart.range).refreshMs || (chart.stale && age >= STALE_REFETCH_MS)
  }

  /** Fetches bars that are missing or due; a failure keeps the old ones. */
  private async refreshCharts(keys: string[], now: number): Promise<void> {
    for (const key of keys) {
      const chart = this.charts.get(key)
      if (!chart || !this.due(chart, now)) continue
      const spec = rangeSpec(chart.range)
      try {
        const { candles, previousClose } = await this.deps.provider.chart(chart.symbol, spec)
        const window = rangeWindow(candles, spec, previousClose)
        chart.candles = window.candles.slice(-CHART_KEEP)
        chart.base = window.base
        chart.baseTime = window.baseTime
      } catch {
        // Try again at the next refresh, not every minute.
      }
      chart.fetchedAt = now
      chart.stale = false
    }
  }
}
