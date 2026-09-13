import {
  downsample,
  isSymbol,
  lastSession,
  type MarketQuote,
  type MarketUpdate,
  type PricePoint,
} from '@shared/markets'

/**
 * Keeps quotes for the symbols some pane is showing, and nothing else.
 *
 *  - One batched quote request per minute covers every watched symbol; when all
 *    of them are closed, once every five minutes.
 *  - Each symbol's intraday series is fetched when first watched and refreshed
 *    every five minutes; the minute quotes extend it in between.
 *  - Failures keep the last data on screen and retry with backoff.
 *
 * The data source is injected (yahoo-finance2 in the app, a stub in tests), as
 * are the clock and timers, so the schedule is unit-tested.
 */

export interface MarketProvider {
  quotes(symbols: string[]): Promise<MarketQuote[]>
  /** Several days of intraday prices, oldest first. */
  intraday(symbol: string): Promise<{ points: PricePoint[]; previousClose: number | null }>
}

export interface MarketDeps {
  provider: MarketProvider
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  publish(update: MarketUpdate): void
}

export const QUOTE_INTERVAL_MS = 60_000
/** A pane subscribes its symbols one message at a time; gather them into one request. */
export const WATCH_BATCH_MS = 250
export const CLOSED_INTERVAL_MS = 5 * 60_000
export const SERIES_REFRESH_MS = 5 * 60_000
export const RETRY_BACKOFF_MS = [60_000, 2 * 60_000, 5 * 60_000]
/** Points kept per series, enough for a sparkline a few hundred pixels wide. */
export const SERIES_POINTS = 160

interface SymbolState {
  quote: MarketQuote | null
  series: PricePoint[]
  seriesAt: number | null
  updatedAt: number | null
  error: string | null
}

export class MarketService {
  private readonly deps: MarketDeps
  private readonly symbols = new Map<string, SymbolState>()
  private readonly watched = new Set<string>()
  private timer: unknown = null
  private failures = 0
  private running = false
  private disposed = false

  constructor(deps: MarketDeps) {
    this.deps = deps
  }

  snapshot(symbol: string): MarketUpdate {
    const s = this.symbols.get(symbol)
    return {
      symbol,
      quote: s?.quote ?? null,
      series: s?.series ?? [],
      updatedAt: s?.updatedAt ?? null,
      error: s?.error ?? null,
    }
  }

  watch(symbol: string): void {
    if (!isSymbol(symbol) || this.watched.has(symbol)) return
    this.watched.add(symbol)
    if (!this.symbols.has(symbol)) {
      this.symbols.set(symbol, {
        quote: null,
        series: [],
        seriesAt: null,
        updatedAt: null,
        error: null,
      })
    }
    // A new symbol wants data now, not at the next minute - but give the rest of
    // the pane's symbols a moment to arrive, so they share the request.
    this.schedule(WATCH_BATCH_MS)
  }

  unwatch(symbol: string): void {
    this.watched.delete(symbol)
    if (this.watched.size === 0 && this.timer !== null) {
      this.deps.clearTimer(this.timer)
      this.timer = null
    }
  }

  watching(): string[] {
    return [...this.watched].sort()
  }

  dispose(): void {
    this.disposed = true
    this.watched.clear()
    if (this.timer !== null) this.deps.clearTimer(this.timer)
    this.timer = null
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
    const symbols = this.watching()
    try {
      const quotes = await this.deps.provider.quotes(symbols)
      await this.succeeded(symbols, quotes)
    } catch (cause) {
      this.failed(symbols, cause instanceof Error ? cause.message : String(cause))
    } finally {
      this.running = false
    }
  }

  private async succeeded(symbols: string[], quotes: MarketQuote[]): Promise<void> {
    const now = this.deps.now()
    for (const quote of quotes) this.applyQuote(quote, now)
    await this.refreshSeries(symbols, now)
    this.failures = 0
    const quoted = new Set(quotes.map((q) => q.symbol))
    for (const symbol of symbols) {
      const state = this.symbols.get(symbol)
      // Yahoo occasionally leaves a symbol out of a batch; a quote from an earlier
      // minute is still worth showing, so only a symbol never quoted is an error.
      if (state)
        state.error = quoted.has(symbol) || state.quote !== null ? null : 'no quote for this symbol'
      this.deps.publish(this.snapshot(symbol))
    }
    // Symbols watched while this request was in flight should not wait a minute.
    const added = this.watching().some((symbol) => !symbols.includes(symbol))
    const allClosed = quotes.length > 0 && quotes.every((q) => q.state === 'closed')
    this.schedule(added ? WATCH_BATCH_MS : allClosed ? CLOSED_INTERVAL_MS : QUOTE_INTERVAL_MS)
  }

  private failed(symbols: string[], message: string): void {
    for (const symbol of symbols) {
      const state = this.symbols.get(symbol)
      if (state) state.error = message
      this.deps.publish(this.snapshot(symbol))
    }
    const delay = RETRY_BACKOFF_MS[Math.min(this.failures, RETRY_BACKOFF_MS.length - 1)] ?? 60_000
    this.failures += 1
    this.schedule(delay)
  }

  private applyQuote(quote: MarketQuote, now: number): void {
    const state = this.symbols.get(quote.symbol)
    if (!state) return
    state.quote = quote
    state.updatedAt = now
    // Extend the series with the minute quote, if it is newer than the last point.
    const at = quote.time ?? now
    const last = state.series.at(-1)
    if (last === undefined || at > last.t) {
      state.series = downsample(
        lastSession([...state.series, { t: at, v: quote.price }]),
        SERIES_POINTS,
      )
    }
  }

  /** Fetches intraday series that are missing or stale; a failure keeps the old one. */
  private async refreshSeries(symbols: string[], now: number): Promise<void> {
    for (const symbol of symbols) {
      const state = this.symbols.get(symbol)
      if (!state || (state.seriesAt !== null && now - state.seriesAt < SERIES_REFRESH_MS)) continue
      try {
        const { points } = await this.deps.provider.intraday(symbol)
        state.series = downsample(lastSession(points), SERIES_POINTS)
        state.seriesAt = now
      } catch {
        state.seriesAt = now // try again at the next refresh, not every minute
      }
    }
  }
}
