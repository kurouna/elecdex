import { describe, expect, it, vi } from 'vitest'
import { SystemCache } from '../../src/main/launcher/system-cache.js'

interface Entry {
  id: string
  name: string
  group: string | null
}

const e = (name: string): Entry => ({ id: name, name, group: null })

/** A scan that answers only when told to, counting how often it ran. */
function manualScan() {
  const pending: Array<{ resolve: (v: Entry[]) => void; reject: (e: Error) => void }> = []
  const scan = vi.fn(
    () =>
      new Promise<Entry[]>((resolve, reject) => {
        pending.push({ resolve, reject })
      }),
  )
  const answer = async (value: Entry[] | Error) => {
    const next = pending.shift()
    if (!next) throw new Error('no scan is running')
    if (value instanceof Error) next.reject(value)
    else next.resolve(value)
    await new Promise((r) => setTimeout(r, 0))
  }
  return { scan, answer }
}

function setup() {
  let now = 0
  const { scan, answer } = manualScan()
  const onChange = vi.fn()
  const cache = new SystemCache<Entry>({ scan, maxAgeMs: 60_000, onChange, now: () => now })
  return { cache, scan, answer, onChange, advance: (ms: number) => (now += ms) }
}

describe('SystemCache', () => {
  it('makes only the first request wait for a scan, and shares it', async () => {
    const { cache, scan, answer } = setup()
    const first = cache.get()
    const second = cache.get()
    expect(scan).toHaveBeenCalledTimes(1)
    await answer([e('A')])
    expect(await first).toEqual([e('A')])
    expect(await second).toEqual([e('A')])
  })

  it('serves a fresh list without scanning', async () => {
    const { cache, scan, answer, advance } = setup()
    const first = cache.get()
    await answer([e('A')])
    await first
    advance(60_000)
    expect(await cache.get()).toEqual([e('A')])
    expect(scan).toHaveBeenCalledTimes(1)
  })

  it('serves a stale list at once and refreshes it behind, one scan at a time', async () => {
    const { cache, scan, answer, onChange, advance } = setup()
    const first = cache.get()
    await answer([e('A')])
    await first
    advance(60_001)
    // Answered from the old list, while the scan has not finished.
    expect(await cache.get()).toEqual([e('A')])
    expect(await cache.get()).toEqual([e('A')])
    expect(scan).toHaveBeenCalledTimes(2)
    await answer([e('A'), e('Teams')])
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(await cache.get()).toEqual([e('A'), e('Teams')])
    expect(scan).toHaveBeenCalledTimes(2)
  })

  it('does not report a refresh that found the same list, or the first scan', async () => {
    const { cache, answer, onChange, advance } = setup()
    const first = cache.get()
    await answer([e('A')])
    await first
    expect(onChange).not.toHaveBeenCalled()
    advance(60_001)
    await cache.get()
    await answer([e('A')])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('reports a renamed or regrouped entry as a change', async () => {
    const { cache, answer, onChange, advance } = setup()
    const first = cache.get()
    await answer([e('A')])
    await first
    advance(60_001)
    await cache.get()
    await answer([{ id: 'A', name: 'A', group: 'Tools' }])
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('keeps the old list when a refresh fails, and tries again on the next request', async () => {
    const { cache, scan, answer, onChange, advance } = setup()
    const first = cache.get()
    await answer([e('A')])
    await first
    advance(60_001)
    await cache.get()
    await answer(new Error('PowerShell blocked'))
    expect(onChange).not.toHaveBeenCalled()
    expect(await cache.get()).toEqual([e('A')])
    expect(scan).toHaveBeenCalledTimes(3)
    await answer([e('B')])
    expect(await cache.get()).toEqual([e('B')])
  })

  it('lets a first scan that fails fail its request, and scans again next time', async () => {
    const { cache, scan, answer } = setup()
    const first = expect(cache.get()).rejects.toThrow('boom')
    await answer(new Error('boom'))
    await first
    const second = cache.get()
    expect(scan).toHaveBeenCalledTimes(2)
    await answer([e('A')])
    expect(await second).toEqual([e('A')])
  })
})
