import { describe, expect, it } from 'vitest'
import {
  READ_LIMITS,
  readJsonLimited,
  readLimited,
  readTextLimited,
  readUpTo,
} from '../../src/main/read-limited.js'

/**
 * A response body read only up to a size: what main fetches from services it does not control -
 * earthquakes, tsunamis, forecasts, the update check - stops at a limit instead of holding
 * whatever a broken or hostile answer sends in memory (issue 32).
 */

/** A body sent in chunks, counting how many were pulled before the reader let go. */
function chunked(sizes: number[]) {
  let pulled = 0
  let cancelled = false
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      const size = sizes[pulled]
      if (size === undefined) {
        controller.close()
        return
      }
      pulled += 1
      controller.enqueue(new Uint8Array(size).fill(0x20))
    },
    cancel() {
      cancelled = true
    },
  })
  return { body, pulled: () => pulled, cancelled: () => cancelled }
}

describe('readLimited', () => {
  it('reads a body under the limit whole', async () => {
    const { body } = chunked([3, 4])
    expect((await readLimited(body, 10)).byteLength).toBe(7)
    expect((await readLimited(null, 10)).byteLength).toBe(0)
  })

  it('stops at the limit, lets the body go, and says so', async () => {
    const { body, pulled, cancelled } = chunked([6, 6, 6, 6])
    await expect(readLimited(body, 10, 'quake list too large')).rejects.toThrow(
      'quake list too large',
    )
    expect(pulled()).toBe(2)
    expect(cancelled()).toBe(true)
  })
})

describe('a response read as text or JSON', () => {
  it('decodes UTF-8 and parses JSON under the limit', async () => {
    expect(await readTextLimited(new Response('震度 3'), 100)).toBe('震度 3')
    expect(await readJsonLimited(new Response('{"a":[1,2]}'), 100)).toEqual({ a: [1, 2] })
  })

  it('refuses a body past the limit before parsing it', async () => {
    const big = new Response(`{"pad":"${'x'.repeat(200)}"}`)
    await expect(readJsonLimited(big, 100)).rejects.toThrow(/too large/)
    await expect(readTextLimited(new Response('x'.repeat(101)), 100)).rejects.toThrow(/too large/)
  })

  it('has a limit for every service it reads, each far above what that service sends', () => {
    // USGS's day of magnitude 4.5 and up is tens of kilobytes, a JMA office's forecast alike.
    expect(READ_LIMITS.quakes).toBeGreaterThanOrEqual(8 * 1024 * 1024)
    expect(READ_LIMITS.weather).toBeGreaterThanOrEqual(4 * 1024 * 1024)
    expect(READ_LIMITS.updates).toBeGreaterThanOrEqual(1024 * 1024)
    expect(READ_LIMITS.markets).toBeGreaterThanOrEqual(1024 * 1024)
  })
})

describe('the first bytes of a body (review of issue 32)', () => {
  it('reads up to the size and lets the rest go, never failing for it', async () => {
    // An AI provider's error body is shown cut to a few kilobytes; it was read whole first.
    const { body, pulled, cancelled } = chunked([6, 6, 6, 6])
    const head = await readUpTo(body, 8)
    expect(head.byteLength).toBe(8)
    expect(pulled()).toBe(2)
    expect(cancelled()).toBe(true)
    expect((await readUpTo(chunked([3]).body, 8)).byteLength).toBe(3)
    expect((await readUpTo(null, 8)).byteLength).toBe(0)
  })

  it('keeps its own message when letting the body go fails too', async () => {
    // Found in review: a cancel that threw replaced "too large" with its own error.
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(20))
      },
      cancel() {
        throw new Error('already gone')
      },
    })
    await expect(readLimited(body, 10, 'models too large')).rejects.toThrow('models too large')
  })

  it('has a limit for what an AI provider lists', () => {
    expect(READ_LIMITS.ai).toBeGreaterThanOrEqual(1024 * 1024)
  })
})
