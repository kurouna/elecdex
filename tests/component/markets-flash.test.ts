import type { MarketUpdate } from '@shared/markets'
import { render, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: MarketsWidget } = await import(
  '../../src/renderer/widgets/markets/MarketsWidget.svelte'
)

/**
 * The market board's flash when a price moves: it lasts 900 ms from the latest
 * move, goes out when the watchlist is edited mid-flash, and leaves no timer
 * behind once the pane is gone.
 */

const handlers = new Map<string, (update: MarketUpdate) => void>()

const update = (symbol: string, price: number): MarketUpdate => ({
  symbol,
  quote: {
    symbol,
    name: symbol,
    price,
    change: 0,
    changePercent: 0,
    previousClose: null,
    currency: null,
    state: 'open',
    time: null,
  },
  series: [],
  updatedAt: 0,
  error: null,
})

const send = (symbol: string, price: number): void => {
  handlers.get(symbol)?.(update(symbol, price))
  flushSync()
}

const row = (symbol: string): HTMLElement => {
  const found = screen
    .getAllByTestId('market-row')
    .find((el) => el.getAttribute('data-symbol') === symbol)
  if (!found) throw new Error(`no row for ${symbol}`)
  return found
}

const stateFor = (...symbols: string[]) => ({ symbols: symbols.map((symbol) => ({ symbol })) })

const props = (...symbols: string[]) => ({
  paneId: 'p',
  title: 'markets',
  props: undefined,
  state: stateFor(...symbols),
  active: true,
})

beforeEach(() => {
  vi.useFakeTimers()
  handlers.clear()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('elecdex', {
    markets: {
      subscribe: (symbol: string, handler: (update: MarketUpdate) => void) => {
        handlers.set(symbol, handler)
        return () => handlers.delete(symbol)
      },
    },
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('MarketsWidget price flash', () => {
  it('lasts 900 ms from the latest move', () => {
    render(MarketsWidget, { props: props('AAA') })
    flushSync()
    send('AAA', 1)
    send('AAA', 2)
    expect(row('AAA').classList.contains('flash-up')).toBe(true)

    vi.advanceTimersByTime(400)
    send('AAA', 1.5)
    expect(row('AAA').classList.contains('flash-down')).toBe(true)

    // 1000 ms after the first move, 600 ms after the second: still lit.
    vi.advanceTimersByTime(600)
    flushSync()
    expect(row('AAA').classList.contains('flash-down')).toBe(true)

    vi.advanceTimersByTime(300)
    flushSync()
    expect(row('AAA').classList.contains('flash-down')).toBe(false)
  })

  it('goes out when the watchlist is edited mid-flash', async () => {
    const { rerender } = render(MarketsWidget, { props: props('AAA') })
    flushSync()
    send('AAA', 1)
    send('AAA', 2)
    await rerender({ state: stateFor('AAA', 'BBB') })
    flushSync()
    expect(row('AAA').classList.contains('flash-up')).toBe(true)

    vi.advanceTimersByTime(900)
    flushSync()
    expect(row('AAA').classList.contains('flash-up')).toBe(false)
  })

  it('leaves no timer behind when the pane goes away', () => {
    const { unmount } = render(MarketsWidget, { props: props('AAA', 'BBB') })
    flushSync()
    send('AAA', 1)
    send('AAA', 2)
    send('BBB', 5)
    send('BBB', 4)
    const before = vi.getTimerCount()
    expect(before).toBeGreaterThanOrEqual(2)
    unmount()
    expect(vi.getTimerCount()).toBe(before - 2)
  })
})
