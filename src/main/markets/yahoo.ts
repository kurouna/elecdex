import {
  type CandlePoint,
  type ChartRangeSpec,
  type MarketQuote,
  normaliseCandles,
  type PricePoint,
  toMarketState,
} from '@shared/markets'
import type YahooFinance from 'yahoo-finance2'
import type { MarketProvider } from './service.js'

/** A yahoo-finance2 client: the package's default export is the class. */
type Yahoo = InstanceType<typeof YahooFinance>

/**
 * Market data from Yahoo Finance, through yahoo-finance2.
 *
 * yahoo-finance2 needs Node: in a browser Yahoo's CORS policy and cookie/crumb
 * handshake block it, which is why this lives in main and the widget gets plain
 * data over IPC. It uses Node's own fetch, whose responses keep the Set-Cookie
 * headers the handshake depends on.
 *
 * Results are read leniently (validateResult: false): Yahoo adds and drops fields
 * without notice, and a quote missing an optional field should still show.
 */

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const time = (v: unknown): number | null =>
  v instanceof Date ? v.getTime() : typeof v === 'number' ? v * (v < 1e12 ? 1000 : 1) : null

/**
 * Bars from yahoo.chart()'s `quotes` rows. A row missing any of its four prices
 * is dropped: Yahoo leaves the live bar's fields null now and then.
 */
export function readCandles(rows: ReadonlyArray<Record<string, unknown>>): CandlePoint[] {
  const candles: CandlePoint[] = []
  for (const row of rows) {
    const t = time(row.date)
    const o = num(row.open)
    const h = num(row.high)
    const l = num(row.low)
    const c = num(row.close)
    if (t === null || o === null || h === null || l === null || c === null) continue
    // A live bar's high and low do not always bracket its open and close yet.
    candles.push({ t, o, h: Math.max(h, o, c), l: Math.min(l, o, c), c })
  }
  return candles
}

/**
 * yahoo-finance2 is loaded the first time a quote is asked for, not with the
 * app: it took ~70 ms of main's start, before the window could open, in every
 * session - most of which show no market board.
 */
export function yahooProvider(): MarketProvider {
  let client: Promise<Yahoo> | null = null
  const load = (): Promise<Yahoo> => {
    client ??= import('yahoo-finance2')
      .then(({ default: Client }) => create(Client))
      .catch((error: unknown) => {
        // Not kept: the next request tries again, rather than failing until a restart.
        client = null
        throw error
      })
    return client
  }

  return {
    async quotes(symbols) {
      return readQuotes(
        await (await load()).quote(symbols, { return: 'array' }, { validateResult: false }),
      )
    },
    async chart(symbol, spec) {
      return readChart(await load(), symbol, spec)
    },
  }
}

function create(Client: typeof YahooFinance): Yahoo {
  return new Client({
    suppressNotices: ['yahooSurvey'],
    versionCheck: false,
    // Keep its warnings out of the app's console unless they are errors.
    logger: {
      info: () => {},
      warn: () => {},
      debug: () => {},
      dir: () => {},
      error: (...args: unknown[]) => console.error('[elecdex] yahoo-finance2:', ...args),
    },
  })
}

/** Quotes from yahoo.quote()'s rows, read leniently. */
function readQuotes(raw: unknown): MarketQuote[] {
  const rows = Array.isArray(raw) ? raw : [raw]
  const quotes: MarketQuote[] = []
  for (const row of rows as Array<Record<string, unknown>>) {
    const price = num(row.regularMarketPrice)
    if (typeof row.symbol !== 'string' || price === null) continue
    quotes.push({
      symbol: row.symbol,
      name: String(row.shortName ?? row.longName ?? row.symbol),
      price,
      change: num(row.regularMarketChange) ?? 0,
      changePercent: num(row.regularMarketChangePercent) ?? 0,
      previousClose: num(row.regularMarketPreviousClose),
      currency: typeof row.currency === 'string' ? row.currency : null,
      state: toMarketState(row.marketState),
      time: time(row.regularMarketTime),
    })
  }
  return quotes
}

async function readChart(
  yahoo: Yahoo,
  symbol: string,
  spec: ChartRangeSpec,
): Promise<{ candles: CandlePoint[]; previousClose: number | null }> {
  const result = (await yahoo.chart(
    symbol,
    { period1: new Date(Date.now() - spec.fetchMs), interval: spec.interval },
    { validateResult: false },
  )) as unknown as { quotes?: Array<Record<string, unknown>>; meta?: Record<string, unknown> }
  return {
    candles: normaliseCandles(readCandles(result.quotes ?? []), spec.barMs),
    previousClose: num(result.meta?.chartPreviousClose),
  }
}

/**
 * A provider that reads from a local HTTP server instead of Yahoo, for the
 * end-to-end tests (ELECDEX_MARKETS_STUB_URL), so running them never contacts
 * Yahoo. The server returns MarketQuote[] for quotes, and for a chart either
 * `{ candles, previousClose }` or a plain PricePoint[] (each point a flat bar).
 */
export function stubProvider(baseUrl: string): MarketProvider {
  const get = async (path: string): Promise<unknown> => {
    const response = await fetch(`${baseUrl}${path}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }
  return {
    quotes: async (symbols) =>
      (await get(`/quotes?symbols=${encodeURIComponent(symbols.join(','))}`)) as MarketQuote[],
    chart: async (symbol, spec) => {
      const body = await get(`/chart/${encodeURIComponent(symbol)}?range=${spec.id}`)
      if (Array.isArray(body)) {
        const candles = (body as PricePoint[]).map(({ t, v }) => ({ t, o: v, h: v, l: v, c: v }))
        return { candles, previousClose: null }
      }
      const { candles, previousClose } = body as {
        candles: CandlePoint[]
        previousClose?: number | null
      }
      return {
        candles: normaliseCandles(candles, spec.barMs),
        previousClose: previousClose ?? null,
      }
    },
  }
}
