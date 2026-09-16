/**
 * Market data shared by main and the markets widget.
 *
 * Quotes come from Yahoo Finance through yahoo-finance2, which cannot run in a
 * browser (CORS, cookies) - so main fetches and the renderer only receives these
 * plain shapes. Yahoo's API is unofficial and quotes may be delayed; the widget
 * says so.
 */

/** Ticker symbols as Yahoo spells them: ^N225, JPY=X, BTC-USD, 7203.T. */
export const SYMBOL = /^[A-Za-z0-9^=.-]{1,20}$/
export const isSymbol = (value: unknown): value is string =>
  typeof value === 'string' && SYMBOL.test(value)

export type MarketState = 'open' | 'pre' | 'post' | 'closed'

export interface MarketQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  previousClose: number | null
  currency: string | null
  state: MarketState
  /** When the price was set, ms since epoch. */
  time: number | null
}

export interface PricePoint {
  /** ms since epoch. */
  t: number
  v: number
}

/** One bar of a chart: open, high, low and close over the bar that starts at `t`. */
export interface CandlePoint {
  /** When the bar starts, ms since epoch. */
  t: number
  o: number
  h: number
  l: number
  c: number
}

/** The periods a markets pane can chart. */
export type ChartRange = '1d' | '5d' | '1mo' | '6mo' | '1y' | '5y'

/** Yahoo's names for the bar widths the ranges use. */
export type BarInterval = '5m' | '30m' | '60m' | '1d' | '1wk' | '1mo'

export interface ChartRangeSpec {
  id: ChartRange
  /** Shown on the board: "5D". */
  label: string
  /** The bar width as the settings show it: "30m". */
  bar: string
  interval: BarInterval
  /** The nominal bar width in ms (a month counts as 28 days, shorter than any month). */
  barMs: number
  /** How far back to ask Yahoo: the range plus enough to find the close before it. */
  fetchMs: number
  /** How much of the newest data to show, measured back from the newest bar. */
  spanMs: number
  /** For intraday ranges, the number of trading sessions to show. */
  sessions?: number
  /** How often the bars are fetched again. */
  refreshMs: number
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * The chart periods, each with the bar width that suits it. The user picks the
 * period and the bar follows from it, so no choice runs into Yahoo's limits
 * (bars under an hour only for the last 60 days, hourly bars for 730) or asks
 * for far more bars than a pane can show.
 */
export const CHART_RANGES: readonly ChartRangeSpec[] = [
  {
    id: '1d',
    label: '1D',
    bar: '5m',
    interval: '5m',
    barMs: 5 * MINUTE,
    fetchMs: 5 * DAY,
    spanMs: DAY,
    sessions: 1,
    refreshMs: 5 * MINUTE,
  },
  {
    id: '5d',
    label: '5D',
    bar: '30m',
    interval: '30m',
    barMs: 30 * MINUTE,
    fetchMs: 12 * DAY,
    spanMs: 5 * DAY,
    sessions: 5,
    refreshMs: 15 * MINUTE,
  },
  {
    id: '1mo',
    label: '1M',
    bar: '1h',
    interval: '60m',
    barMs: HOUR,
    fetchMs: 40 * DAY,
    spanMs: 31 * DAY,
    refreshMs: 30 * MINUTE,
  },
  {
    id: '6mo',
    label: '6M',
    bar: '1d',
    interval: '1d',
    barMs: DAY,
    fetchMs: 195 * DAY,
    spanMs: 183 * DAY,
    refreshMs: HOUR,
  },
  {
    id: '1y',
    label: '1Y',
    bar: '1wk',
    interval: '1wk',
    barMs: 7 * DAY,
    fetchMs: 380 * DAY,
    spanMs: 364 * DAY,
    refreshMs: HOUR,
  },
  {
    id: '5y',
    label: '5Y',
    bar: '1mo',
    interval: '1mo',
    barMs: 28 * DAY,
    fetchMs: 5 * 366 * DAY + 45 * DAY,
    spanMs: 5 * 365 * DAY,
    refreshMs: HOUR,
  },
]

export const DEFAULT_RANGE: ChartRange = '1d'

export const isChartRange = (value: unknown): value is ChartRange =>
  CHART_RANGES.some((r) => r.id === value)

export function rangeSpec(range: ChartRange): ChartRangeSpec {
  return CHART_RANGES.find((r) => r.id === range) ?? (CHART_RANGES[0] as ChartRangeSpec)
}

/** Whether a range's bars are shorter than a day. */
export const isIntraday = (spec: ChartRangeSpec): boolean => spec.barMs < DAY

/**
 * A chart subscription's key: the symbol and the range, "^N225|5d". Symbols
 * never contain '|', so the split is unambiguous.
 */
export const chartKey = (symbol: string, range: ChartRange): string => `${symbol}|${range}`

export function parseChartKey(key: unknown): { symbol: string; range: ChartRange } | null {
  if (typeof key !== 'string') return null
  const bar = key.indexOf('|')
  if (bar === -1) return null
  const symbol = key.slice(0, bar)
  const range = key.slice(bar + 1)
  return isSymbol(symbol) && isChartRange(range) ? { symbol, range } : null
}

export interface MarketUpdate {
  /** The subscription this answers: chartKey(symbol, range). */
  key: string
  symbol: string
  range: ChartRange
  quote: MarketQuote | null
  /** The range's bars, oldest first, at most CHART_BARS of them. */
  candles: CandlePoint[]
  /**
   * What the range's change is measured from: the close before the range began
   * (for 1D, the previous close). Null until known.
   */
  base: number | null
  /** When the bar that set `base` started, ms since epoch, if known. */
  baseTime: number | null
  /** When main last received data for this symbol, ms since epoch. */
  updatedAt: number | null
  error: string | null
}

/** Bars sent per chart, enough for a sparkline a few hundred pixels wide. */
export const CHART_BARS = 160

export interface WatchSymbol {
  symbol: string
  /** Shown instead of Yahoo's name. */
  label?: string
}

/**
 * The default board: the Japanese and US benchmarks, the yen and bitcoin.
 *
 * No labels here: built-in names come from BUILTIN_LABELS in the viewer's
 * language, so the board follows the app's locale. Only labels the user types
 * are stored with the watchlist.
 */
export const DEFAULT_WATCHLIST: readonly WatchSymbol[] = [
  { symbol: '^N225' },
  // Yahoo publishes no live TOPIX index (^TPX has not updated since 2015); the
  // CME yen-denominated TOPIX future tracks it and trades almost around the clock.
  { symbol: 'TPY=F' },
  { symbol: '^GSPC' },
  { symbol: '^DJI' },
  { symbol: '^IXIC' },
  { symbol: 'JPY=X' },
  { symbol: 'EURJPY=X' },
  { symbol: 'BTC-USD' },
]

export type LabelLanguage = 'ja' | 'en'

/** Names for well-known symbols, better than Yahoo's shortName ("Nikkei 225", "USD/JPY"). */
export const BUILTIN_LABELS: Readonly<Record<string, Readonly<Record<LabelLanguage, string>>>> = {
  '^N225': { ja: '日経平均', en: 'Nikkei 225' },
  'TPY=F': { ja: 'TOPIX 先物', en: 'TOPIX Futures' },
  '1306.T': { ja: 'TOPIX ETF', en: 'TOPIX ETF' },
  '^GSPC': { ja: 'S&P 500', en: 'S&P 500' },
  '^DJI': { ja: 'NY ダウ', en: 'Dow Jones' },
  '^IXIC': { ja: 'NASDAQ', en: 'NASDAQ' },
  '^VIX': { ja: 'VIX 指数', en: 'VIX' },
  '^FTSE': { ja: 'FTSE 100', en: 'FTSE 100' },
  '^GDAXI': { ja: 'DAX', en: 'DAX' },
  '^HSI': { ja: 'ハンセン指数', en: 'Hang Seng' },
  '000001.SS': { ja: '上海総合', en: 'Shanghai Composite' },
  'JPY=X': { ja: 'ドル円', en: 'USD/JPY' },
  'EURJPY=X': { ja: 'ユーロ円', en: 'EUR/JPY' },
  'GBPJPY=X': { ja: 'ポンド円', en: 'GBP/JPY' },
  'EURUSD=X': { ja: 'ユーロドル', en: 'EUR/USD' },
  'BTC-USD': { ja: 'ビットコイン', en: 'Bitcoin' },
  'ETH-USD': { ja: 'イーサリアム', en: 'Ethereum' },
  'GC=F': { ja: '金先物', en: 'Gold Futures' },
  'CL=F': { ja: '原油先物', en: 'Crude Oil Futures' },
  '^TNX': { ja: '米10年債利回り', en: 'US 10Y Yield' },
}

/** Japanese for a Japanese locale ("ja", "ja-JP"), English for everything else. */
export function labelLanguage(locale: string | undefined): LabelLanguage {
  return locale?.toLowerCase().startsWith('ja') ? 'ja' : 'en'
}

/**
 * What to call a symbol: the user's own label, else the built-in name in the
 * viewer's language, else Yahoo's name for it, else the symbol itself.
 */
export function labelFor(
  watch: WatchSymbol,
  language: LabelLanguage,
  yahooName?: string | null,
): string {
  return watch.label ?? BUILTIN_LABELS[watch.symbol]?.[language] ?? yahooName ?? watch.symbol
}

/** Maps Yahoo's marketState to the four states the UI distinguishes. */
export function toMarketState(raw: unknown): MarketState {
  switch (raw) {
    case 'REGULAR':
      return 'open'
    case 'PRE':
    case 'PREPRE':
      return 'pre'
    case 'POST':
    case 'POSTPOST':
      return 'post'
    default:
      return 'closed'
  }
}

/** A pause in trading longer than this separates two sessions. */
export const SESSION_GAP_MS = 90 * 60 * 1000

/**
 * The last trading sessions from a multi-day intraday series: walking back from
 * the newest point until trading has paused `sessions` times for longer than
 * `gap`, and never more than `span`. Asking Yahoo for several days and keeping
 * the tail shows Friday's session on a Sunday instead of an empty chart; cutting
 * at the gap keeps yesterday's close from being drawn as a long line into
 * today's open. Markets that trade around the clock (currencies, crypto) simply
 * get the last `span`.
 */
export function lastSession<T extends { t: number }>(
  points: readonly T[],
  span = DAY,
  gap = SESSION_GAP_MS,
  sessions = 1,
): T[] {
  const newest = points.at(-1)
  if (newest === undefined) return []
  let start = points.length - 1
  let pauses = 0
  while (start > 0) {
    const previous = points[start - 1] as T
    const current = points[start] as T
    if (previous.t < newest.t - span) break
    if (current.t - previous.t > gap) {
      pauses += 1
      if (pauses >= sessions) break
    }
    start -= 1
  }
  return points.slice(start)
}

/** At most `max` points, evenly thinned, always keeping the last. */
export function downsample<T>(points: readonly T[], max: number): T[] {
  if (points.length <= max) return [...points]
  const step = (points.length - 1) / (max - 1)
  const out: T[] = []
  for (let i = 0; i < max; i++) {
    const p = points[Math.round(i * step)]
    if (p !== undefined) out.push(p)
  }
  return out
}

function combine(group: readonly CandlePoint[]): CandlePoint {
  const first = group[0] as CandlePoint
  const last = group.at(-1) as CandlePoint
  let h = first.h
  let l = first.l
  for (const bar of group) {
    if (bar.h > h) h = bar.h
    if (bar.l < l) l = bar.l
  }
  return { t: first.t, o: first.o, h, l, c: last.c }
}

/**
 * At most `max` bars, merging neighbours rather than dropping any: a merged bar
 * opens with its first, closes with its last and spans their highs and lows, so
 * no extreme is lost. Groups count from the oldest bar, so a new bar only ever
 * changes the newest group.
 */
export function mergeCandles(candles: readonly CandlePoint[], max: number): CandlePoint[] {
  if (candles.length <= max || max < 1) return [...candles]
  const size = Math.ceil(candles.length / max)
  const out: CandlePoint[] = []
  for (let i = 0; i < candles.length; i += size) out.push(combine(candles.slice(i, i + size)))
  return out
}

/**
 * Sorted bars, with a row closer than half a bar to the one before folded into
 * it: Yahoo sometimes appends the live price as an extra row inside the current
 * week or month.
 */
export function normaliseCandles(candles: readonly CandlePoint[], barMs: number): CandlePoint[] {
  const sorted = [...candles].sort((a, b) => a.t - b.t)
  const out: CandlePoint[] = []
  for (const bar of sorted) {
    const last = out.at(-1)
    if (last !== undefined && bar.t - last.t < barMs / 2) {
      out[out.length - 1] = combine([last, bar])
    } else {
      out.push(bar)
    }
  }
  return out
}

/**
 * The bars a range shows out of what Yahoo returned, and the close its change
 * is measured from: the bar just before the window, else Yahoo's own
 * `chartPreviousClose`, else the first open.
 */
export function rangeWindow(
  candles: readonly CandlePoint[],
  spec: ChartRangeSpec,
  previousClose: number | null,
): { candles: CandlePoint[]; base: number | null; baseTime: number | null } {
  const newest = candles.at(-1)
  if (newest === undefined) return { candles: [], base: previousClose, baseTime: null }
  const shown =
    spec.sessions !== undefined
      ? lastSession(candles, spec.spanMs, SESSION_GAP_MS, spec.sessions)
      : candles.filter((c) => c.t > newest.t - spec.spanMs)
  const before = candles[candles.length - shown.length - 1]
  if (before !== undefined) return { candles: shown, base: before.c, baseTime: before.t }
  return { candles: shown, base: previousClose ?? shown[0]?.o ?? null, baseTime: null }
}

/**
 * Folds a minute quote into a range's bars. Intraday ranges extend the current
 * bar or open the next one on the bar grid. Daily bars take a quote only within
 * their day, and report `stale` for a later one - the next day's bar comes from
 * Yahoo, whose bars start at each market's own open - so the caller fetches
 * again. Weekly and monthly bars always take it: months differ in length, and a
 * new week or month is at most one refresh (an hour) late.
 */
export function applyQuoteToCandles(
  candles: readonly CandlePoint[],
  spec: ChartRangeSpec,
  price: number,
  at: number,
): { candles: CandlePoint[]; stale: boolean } {
  const last = candles.at(-1)
  if (last === undefined || at < last.t) return { candles: [...candles], stale: false }
  if (at < last.t + spec.barMs || spec.barMs > DAY) {
    const updated = { ...last, h: Math.max(last.h, price), l: Math.min(last.l, price), c: price }
    return { candles: [...candles.slice(0, -1), updated], stale: false }
  }
  if (!isIntraday(spec)) return { candles: [...candles], stale: true }
  const t = last.t + Math.floor((at - last.t) / spec.barMs) * spec.barMs
  return { candles: [...candles, { t, o: price, h: price, l: price, c: price }], stale: false }
}

/**
 * The move a board row shows for its range: the quote's own change for 1D
 * (against the previous close), otherwise from the range's base to the latest
 * price. Null while either end is unknown.
 */
export function rangeChange(update: MarketUpdate): { change: number; percent: number } | null {
  const quote = update.quote
  if (update.range === '1d') {
    return quote ? { change: quote.change, percent: quote.changePercent } : null
  }
  const latest = quote?.price ?? update.candles.at(-1)?.c
  const base = update.base
  if (latest === undefined || base === null || base === 0) return null
  const change = latest - base
  return { change, percent: (change / Math.abs(base)) * 100 }
}

const NICE_STEPS = [1, 2, 5]

/**
 * The bar view's scale in percent: the largest move rounded up - to a half up
 * to 5%, to 1, 2 or 5 times a power of ten above - but at most four times the
 * median move, so one symbol that doubled does not flatten the rest. Bars past
 * the scale are clipped and marked.
 */
export function barScale(percents: readonly number[]): number {
  const moves = percents
    .map((p) => Math.abs(p))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
  if (moves.length === 0) return 1
  const mid = moves.length / 2
  const median =
    moves.length % 2 === 1
      ? (moves[Math.floor(mid)] as number)
      : ((moves[mid - 1] as number) + (moves[mid] as number)) / 2
  const largest = moves.at(-1) as number
  const target = Math.max(1, Math.min(largest, median * 4))
  if (target <= 5) return Math.ceil(target * 2) / 2
  for (let power = 10; ; power *= 10) {
    for (const step of NICE_STEPS) if (step * power >= target) return step * power
  }
}

/** What a divider between bars marks, per range: the day, week, month or year changing. */
export type DividerUnit = 'day' | 'week' | 'month' | 'year'

export const DIVIDER_UNITS: Readonly<Record<ChartRange, DividerUnit | null>> = {
  '1d': null,
  '5d': 'day',
  '1mo': 'week',
  '6mo': 'month',
  '1y': 'month',
  '5y': 'year',
}

function unitOf(t: number, unit: DividerUnit): number {
  const d = new Date(t)
  switch (unit) {
    case 'day':
      return d.getFullYear() * 10_000 + d.getMonth() * 100 + d.getDate()
    case 'week': {
      // Local midnight as a day count; 1970-01-05 was a Monday, so weeks start on Mondays.
      const days = Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY)
      return Math.floor((days - 4) / 7)
    }
    case 'month':
      return d.getFullYear() * 12 + d.getMonth()
    case 'year':
      return d.getFullYear()
  }
}

/**
 * The indices of bars that start a new day, week, month or year in local time.
 * With bars drawn evenly the nights and weekends between them are closed up, so
 * a faint line marks where the calendar moved on.
 */
export function dividerIndices(candles: readonly { t: number }[], range: ChartRange): number[] {
  const unit = DIVIDER_UNITS[range]
  if (unit === null) return []
  const out: number[] = []
  for (let i = 1; i < candles.length; i++) {
    const previous = candles[i - 1] as { t: number }
    const current = candles[i] as { t: number }
    if (unitOf(previous.t, unit) !== unitOf(current.t, unit)) out.push(i)
  }
  return out
}

/** Decimal places that suit a price: FX needs three, an index none. */
export function priceDigits(price: number): number {
  const abs = Math.abs(price)
  if (abs >= 1000) return 0
  if (abs >= 100) return 2
  if (abs >= 1) return 3
  return 4
}

export function formatPrice(price: number): string {
  const digits = priceDigits(price)
  return price.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatChange(change: number, percent: number): string {
  const sign = change > 0 ? '+' : change < 0 ? '−' : '±'
  const digits = priceDigits(Math.abs(change) * 20)
  const abs = Math.abs(change).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  return `${sign}${abs} (${sign}${Math.abs(percent).toFixed(2)}%)`
}

/**
 * Parses the watchlist editor's text: one entry per comma or line, the symbol
 * first and an optional label after a space - "^N225 日経平均, JPY=X ドル円".
 * Symbols never contain spaces (but may contain '=', as in JPY=X), so the first
 * space is the only separator needed. Invalid symbols are dropped.
 */
export function parseWatchlist(text: string): WatchSymbol[] {
  const list: WatchSymbol[] = []
  for (const part of text.split(/[,\n]/)) {
    const trimmed = part.trim()
    if (trimmed === '') continue
    const space = trimmed.search(/\s/)
    const symbol = space === -1 ? trimmed : trimmed.slice(0, space)
    const label = space === -1 ? '' : trimmed.slice(space).trim()
    if (!isSymbol(symbol) || list.some((w) => w.symbol === symbol)) continue
    list.push(label ? { symbol, label: label.slice(0, 40) } : { symbol })
  }
  return list
}

export function formatWatchlist(list: readonly WatchSymbol[]): string {
  return list.map((w) => (w.label ? `${w.symbol} ${w.label}` : w.symbol)).join(', ')
}
