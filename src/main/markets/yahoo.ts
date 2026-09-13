import { type MarketQuote, type PricePoint, toMarketState } from '@shared/markets'
import YahooFinance from 'yahoo-finance2'
import type { MarketProvider } from './service.js'

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

export function yahooProvider(): MarketProvider {
  const yahoo = new YahooFinance({
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

  return {
    async quotes(symbols) {
      const raw = (await yahoo.quote(
        symbols,
        { return: 'array' },
        { validateResult: false },
      )) as unknown
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
    },

    async intraday(symbol) {
      const result = (await yahoo.chart(
        symbol,
        { period1: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), interval: '15m' },
        { validateResult: false },
      )) as unknown as { quotes?: Array<Record<string, unknown>>; meta?: Record<string, unknown> }
      const points: PricePoint[] = []
      for (const q of result.quotes ?? []) {
        const v = num(q.close)
        const t = time(q.date)
        if (v !== null && t !== null) points.push({ t, v })
      }
      return { points, previousClose: num(result.meta?.chartPreviousClose) }
    },
  }
}

/**
 * A provider that reads from a local HTTP server instead of Yahoo, for the
 * end-to-end tests (ELECDEX_MARKETS_STUB_URL), so running them never contacts
 * Yahoo. The server returns the MarketQuote[] and PricePoint[] shapes directly.
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
    intraday: async (symbol) => ({
      points: (await get(`/chart/${encodeURIComponent(symbol)}`)) as PricePoint[],
      previousClose: null,
    }),
  }
}
