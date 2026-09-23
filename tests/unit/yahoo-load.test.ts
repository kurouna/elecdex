import { describe, expect, it, vi } from 'vitest'

/**
 * yahoo-finance2 is loaded on the first quote asked for. A load that fails -
 * the module, or the client it makes - must be tried again with the next
 * request, not kept as a failure until the app is restarted.
 */

const made = vi.hoisted(() => ({ count: 0 }))

// The client fails to be made the first time, as a broken install or a throwing constructor would.
vi.mock('yahoo-finance2', () => ({
  default: class {
    constructor() {
      made.count += 1
      if (made.count === 1) throw new Error('cannot make the client')
    }
    quote = async () => [{ symbol: 'X', regularMarketPrice: 1 }]
  },
}))

describe('the Yahoo provider', () => {
  it('loads the client again after a load that failed', async () => {
    const { yahooProvider } = await import('../../src/main/markets/yahoo.js')
    const provider = yahooProvider()
    await expect(provider.quotes(['X'])).rejects.toThrow()
    const quotes = await provider.quotes(['X'])
    expect(quotes.map((q) => q.symbol)).toEqual(['X'])
  })
})
