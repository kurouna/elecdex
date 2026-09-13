import {
  downsample,
  formatChange,
  formatPrice,
  formatWatchlist,
  labelFor,
  labelLanguage,
  lastSession,
  type MarketQuote,
  parseWatchlist,
  toMarketState,
} from '@shared/markets'
import { describe, expect, it } from 'vitest'
import {
  CLOSED_INTERVAL_MS,
  MarketService,
  QUOTE_INTERVAL_MS,
  RETRY_BACKOFF_MS,
  WATCH_BATCH_MS,
} from '../../src/main/markets/service.js'

const MIN = 60_000

describe('parseWatchlist', () => {
  it('reads symbols with optional labels, including symbols that contain =', () => {
    expect(parseWatchlist('^N225 日経平均, JPY=X ドル円,\nBTC-USD')).toEqual([
      { symbol: '^N225', label: '日経平均' },
      { symbol: 'JPY=X', label: 'ドル円' },
      { symbol: 'BTC-USD' },
    ])
  })

  it('drops invalid and duplicate symbols', () => {
    expect(parseWatchlist('ok, bad;symbol, ok again, , 7203.T')).toEqual([
      { symbol: 'ok' },
      { symbol: '7203.T' },
    ])
  })

  it('round-trips through formatWatchlist', () => {
    const list = parseWatchlist('^GSPC S&P 500, EURJPY=X')
    expect(parseWatchlist(formatWatchlist(list))).toEqual(list)
  })
})

describe('labels', () => {
  it('follows the locale for built-in names', () => {
    expect(labelLanguage('ja')).toBe('ja')
    expect(labelLanguage('ja-JP')).toBe('ja')
    expect(labelLanguage('en-US')).toBe('en')
    expect(labelLanguage('fr')).toBe('en')
    expect(labelLanguage(undefined)).toBe('en')
    expect(labelFor({ symbol: '^N225' }, 'ja')).toBe('日経平均')
    expect(labelFor({ symbol: '^N225' }, 'en')).toBe('Nikkei 225')
    expect(labelFor({ symbol: 'JPY=X' }, 'en')).toBe('USD/JPY')
  })

  it('keeps a label the user typed, and falls back to Yahoo, then the symbol', () => {
    expect(labelFor({ symbol: '^N225', label: '日経' }, 'en')).toBe('日経')
    expect(labelFor({ symbol: '7203.T' }, 'ja', 'TOYOTA MOTOR CORP')).toBe('TOYOTA MOTOR CORP')
    expect(labelFor({ symbol: '7203.T' }, 'ja', null)).toBe('7203.T')
  })
})

describe('lastSession', () => {
  const at = (h: number, m = 0) => Date.UTC(2026, 8, 11, h, m)

  it('cuts at the pause between two sessions', () => {
    const points = [
      { t: at(0, 0), v: 1 },
      { t: at(6, 0), v: 2 }, // the previous close
      { t: at(23, 0), v: 3 }, // the next open, 17 hours later
      { t: at(23, 15), v: 4 },
    ]
    expect(lastSession(points).map((p) => p.v)).toEqual([3, 4])
  })

  it('keeps a market that never pauses to the last day', () => {
    const points = Array.from({ length: 48 * 4 }, (_, i) => ({ t: i * 15 * MIN, v: i }))
    const session = lastSession(points)
    expect(session.at(-1)?.v).toBe(points.at(-1)?.v)
    expect((session.at(-1)?.t ?? 0) - (session[0]?.t ?? 0)).toBeLessThanOrEqual(24 * 60 * MIN)
  })

  it('handles an empty series', () => {
    expect(lastSession([])).toEqual([])
  })
})

describe('downsample', () => {
  it('thins to the limit and keeps the ends', () => {
    const points = Array.from({ length: 1000 }, (_, i) => ({ t: i, v: i }))
    const out = downsample(points, 100)
    expect(out).toHaveLength(100)
    expect(out[0]?.v).toBe(0)
    expect(out.at(-1)?.v).toBe(999)
  })
})

describe('formatting', () => {
  it('chooses decimals by magnitude', () => {
    expect(formatPrice(64011.34)).toBe('64,011')
    expect(formatPrice(153.554)).toBe('153.55')
    expect(formatPrice(1.0834)).toBe('1.083')
  })

  it('signs the change and its percentage', () => {
    expect(formatChange(-1260.3, -1.93)).toBe('−1,260 (−1.93%)')
    expect(formatChange(0.81, 0.53)).toMatch(/^\+0\.81\d? \(\+0\.53%\)$/)
  })

  it('maps Yahoo market states', () => {
    expect(toMarketState('REGULAR')).toBe('open')
    expect(toMarketState('PREPRE')).toBe('pre')
    expect(toMarketState('POSTPOST')).toBe('post')
    expect(toMarketState('CLOSED')).toBe('closed')
    expect(toMarketState(undefined)).toBe('closed')
  })
})

/** A fake world for the service: a clock, due-time timers and a scripted provider. */
function harness() {
  let now = Date.UTC(2026, 8, 14, 1, 0)
  const timers: Array<{ at: number; fn: () => void; id: number }> = []
  let nextId = 1
  const calls: string[] = []
  let state: MarketQuote['state'] = 'open'
  let fail = false
  const quote = (symbol: string): MarketQuote => ({
    symbol,
    name: symbol,
    price: 100 + calls.length,
    change: 1,
    changePercent: 1,
    previousClose: 99,
    currency: 'JPY',
    state,
    time: now,
  })
  const published: string[] = []
  const service = new MarketService({
    provider: {
      quotes: async (symbols) => {
        calls.push(`quotes:${symbols.join(',')}`)
        if (fail) throw new Error('network down')
        return symbols.map(quote)
      },
      intraday: async (symbol) => {
        calls.push(`chart:${symbol}`)
        return { points: [{ t: now - MIN, v: 99 }], previousClose: 99 }
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
    publish: (u) => published.push(`${u.symbol}:${u.error ?? 'ok'}`),
  })
  const settle = async () => {
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
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
  const quoteCalls = () => calls.filter((c) => c.startsWith('quotes'))
  return {
    service,
    calls,
    quoteCalls,
    published,
    advance,
    setState: (s: MarketQuote['state']) => {
      state = s
    },
    setFail: (f: boolean) => {
      fail = f
    },
  }
}

describe('MarketService', () => {
  it('batches every watched symbol into one quote request a minute', async () => {
    const h = harness()
    h.service.watch('^N225')
    h.service.watch('JPY=X')
    await h.advance(WATCH_BATCH_MS)
    expect(h.quoteCalls()).toEqual(['quotes:JPY=X,^N225'])
    await h.advance(QUOTE_INTERVAL_MS * 3)
    expect(h.quoteCalls()).toHaveLength(4)
  })

  it('fetches each intraday series once, then every five minutes', async () => {
    const h = harness()
    h.service.watch('^N225')
    await h.advance(WATCH_BATCH_MS)
    await h.advance(4 * MIN)
    expect(h.calls.filter((c) => c === 'chart:^N225')).toHaveLength(1)
    await h.advance(2 * MIN)
    expect(h.calls.filter((c) => c === 'chart:^N225')).toHaveLength(2)
  })

  it('slows to every five minutes when everything is closed', async () => {
    const h = harness()
    h.setState('closed')
    h.service.watch('^N225')
    await h.advance(WATCH_BATCH_MS)
    await h.advance(CLOSED_INTERVAL_MS - 1000)
    expect(h.quoteCalls()).toHaveLength(1)
    await h.advance(1000)
    expect(h.quoteCalls()).toHaveLength(2)
  })

  it('reports a failure and backs off', async () => {
    const h = harness()
    h.setFail(true)
    h.service.watch('^N225')
    await h.advance(WATCH_BATCH_MS)
    expect(h.published.at(-1)).toBe('^N225:network down')
    await h.advance((RETRY_BACKOFF_MS[0] ?? 0) - 1)
    expect(h.quoteCalls()).toHaveLength(1)
    h.setFail(false)
    await h.advance(1)
    expect(h.published.at(-1)).toBe('^N225:ok')
  })

  it('stops polling when nothing is watched, and ignores invalid symbols', async () => {
    const h = harness()
    h.service.watch('bad symbol!')
    h.service.watch('^N225')
    await h.advance(WATCH_BATCH_MS)
    h.service.unwatch('^N225')
    await h.advance(30 * MIN)
    expect(h.quoteCalls()).toHaveLength(1)
    expect(h.service.watching()).toEqual([])
  })
})
