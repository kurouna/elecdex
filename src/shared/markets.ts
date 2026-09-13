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

export interface MarketUpdate {
  symbol: string
  quote: MarketQuote | null
  /** The latest trading session, oldest first. */
  series: PricePoint[]
  /** When main last received data for this symbol, ms since epoch. */
  updatedAt: number | null
  error: string | null
}

export interface WatchSymbol {
  symbol: string
  /** Shown instead of Yahoo's name. */
  label?: string
}

/** The default board: the Japanese and US benchmarks, the yen and bitcoin. */
export const DEFAULT_WATCHLIST: readonly WatchSymbol[] = [
  { symbol: '^N225', label: '日経平均' },
  // Yahoo publishes no live TOPIX index (^TPX has not updated since 2015); the
  // CME yen-denominated TOPIX future tracks it and trades almost around the clock.
  { symbol: 'TPY=F', label: 'TOPIX 先物' },
  { symbol: '^GSPC', label: 'S&P 500' },
  { symbol: '^DJI', label: 'NY ダウ' },
  { symbol: '^IXIC', label: 'NASDAQ' },
  { symbol: 'JPY=X', label: 'ドル円' },
  { symbol: 'EURJPY=X', label: 'ユーロ円' },
  { symbol: 'BTC-USD', label: 'ビットコイン' },
]

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
 * The last trading session from a multi-day intraday series: walking back from
 * the newest point until trading paused for longer than `gap`, and never more
 * than `span`. Asking Yahoo for several days and keeping the tail shows Friday's
 * session on a Sunday instead of an empty chart; cutting at the gap keeps
 * yesterday's close from being drawn as a long line into today's open. Markets
 * that trade around the clock (currencies, crypto) simply get the last `span`.
 */
export function lastSession(
  points: readonly PricePoint[],
  span = 24 * 60 * 60 * 1000,
  gap = SESSION_GAP_MS,
): PricePoint[] {
  const newest = points.at(-1)
  if (newest === undefined) return []
  let start = points.length - 1
  while (start > 0) {
    const previous = points[start - 1] as PricePoint
    const current = points[start] as PricePoint
    if (current.t - previous.t > gap || previous.t < newest.t - span) break
    start -= 1
  }
  return points.slice(start)
}

/** At most `max` points, evenly thinned, always keeping the last. */
export function downsample(points: readonly PricePoint[], max: number): PricePoint[] {
  if (points.length <= max) return [...points]
  const step = (points.length - 1) / (max - 1)
  const out: PricePoint[] = []
  for (let i = 0; i < max; i++) {
    const p = points[Math.round(i * step)]
    if (p) out.push(p)
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
