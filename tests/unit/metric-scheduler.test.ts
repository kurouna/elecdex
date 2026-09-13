import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type Clock,
  MetricScheduler,
  type SourceDefinition,
} from '../../src/services/metrics/scheduler.js'

const clock: Clock = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
  now: () => Date.now(),
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

/** A source that counts its calls and resolves after `latencyMs`. */
function counted(intervalMs: number, latencyMs = 0) {
  const calls = { n: 0 }
  const definition: SourceDefinition = {
    intervalMs,
    collect: () =>
      new Promise((resolve) => {
        calls.n += 1
        setTimeout(() => resolve({ call: calls.n }), latencyMs)
      }),
  }
  return { calls, definition }
}

function setup(sources: Record<string, SourceDefinition>) {
  const samples: Array<{ id: string; data: unknown }> = []
  const errors: Array<{ id: string; message: string }> = []
  const scheduler = new MetricScheduler(
    sources,
    {
      sample: (id, _at, data) => samples.push({ id, data }),
      error: (id, message) => errors.push({ id, message }),
    },
    clock,
  )
  return { scheduler, samples, errors }
}

/** Advances fake time and lets resolved promises run. */
async function advance(ms: number) {
  await vi.advanceTimersByTimeAsync(ms)
}

describe('MetricScheduler', () => {
  it('polls nothing and arms no timer until something is subscribed', async () => {
    const a = counted(1000)
    const { scheduler } = setup({ a: a.definition })
    await advance(10_000)
    expect(a.calls.n).toBe(0)
    expect(scheduler.timerCount()).toBe(0)
  })

  it('collects a newly activated source immediately, then on its interval', async () => {
    const a = counted(1000)
    const { scheduler, samples } = setup({ a: a.definition })

    scheduler.setActive(['a'])
    await advance(0)
    expect(a.calls.n).toBe(1)
    expect(samples).toHaveLength(1)

    await advance(3000)
    expect(a.calls.n).toBe(4)
  })

  it('stops polling completely when the last subscriber goes away', async () => {
    const a = counted(1000)
    const b = counted(2000)
    const { scheduler } = setup({ a: a.definition, b: b.definition })

    scheduler.setActive(['a', 'b'])
    await advance(4000)
    const before = { a: a.calls.n, b: b.calls.n }

    scheduler.setActive([])
    expect(scheduler.timerCount()).toBe(0)
    expect(scheduler.active()).toEqual([])

    await advance(60_000)
    expect({ a: a.calls.n, b: b.calls.n }).toEqual(before)
  })

  it('stops only the source that was dropped', async () => {
    const a = counted(1000)
    const b = counted(1000)
    const { scheduler } = setup({ a: a.definition, b: b.definition })

    scheduler.setActive(['a', 'b'])
    await advance(2000)
    const bBefore = b.calls.n

    scheduler.setActive(['a'])
    const aBefore = a.calls.n
    await advance(5000)

    expect(b.calls.n).toBe(bBefore)
    expect(a.calls.n).toBe(aBefore + 5)
  })

  it('runs sources that share an interval on a single timer', async () => {
    const { scheduler } = setup({
      a: counted(1000).definition,
      b: counted(1000).definition,
      c: counted(1000).definition,
      slow: counted(30_000).definition,
    })
    scheduler.setActive(['a', 'b', 'c', 'slow'])
    expect(scheduler.timerCount()).toBe(2)
  })

  it('does not start a collection while the previous one is still running', async () => {
    // Longer than the interval, like si.networkInterfaces() on Windows (~1.4s).
    const slow = counted(1000, 3500)
    const { scheduler, samples } = setup({ slow: slow.definition })

    scheduler.setActive(['slow'])
    await advance(3400)
    // Ticks at 1s, 2s and 3s all found the first call still in flight.
    expect(slow.calls.n).toBe(1)

    await advance(200) // first call resolves at 3.5s
    expect(samples).toHaveLength(1)

    await advance(500) // next tick at 4s starts a fresh call
    expect(slow.calls.n).toBe(2)
  })

  it('is idempotent: repeating the same active set changes nothing', async () => {
    const a = counted(1000)
    const { scheduler } = setup({ a: a.definition })

    scheduler.setActive(['a'])
    scheduler.setActive(['a'])
    scheduler.setActive(['a'])
    await advance(0)
    expect(a.calls.n).toBe(1)
    expect(scheduler.timerCount()).toBe(1)

    await advance(1000)
    expect(a.calls.n).toBe(2)
  })

  it('staggers the first collections of sources activated together', async () => {
    // Firing every source at once at launch spawned several wmic/PowerShell
    // processes in the same instant on Windows.
    const a = counted(60_000)
    const b = counted(60_000)
    const c = counted(60_000)
    const { scheduler } = setup({ a: a.definition, b: b.definition, c: c.definition })

    scheduler.setActive(['a', 'b', 'c'])
    await advance(0)
    expect([a.calls.n, b.calls.n, c.calls.n]).toEqual([1, 0, 0])
    await advance(150)
    expect([a.calls.n, b.calls.n, c.calls.n]).toEqual([1, 1, 0])
    await advance(150)
    expect([a.calls.n, b.calls.n, c.calls.n]).toEqual([1, 1, 1])
  })

  it('does not run a staggered first collection for a source dropped while it waited', async () => {
    const a = counted(60_000)
    const b = counted(60_000)
    const { scheduler } = setup({ a: a.definition, b: b.definition })

    scheduler.setActive(['a', 'b'])
    scheduler.setActive(['a'])
    await advance(1000)
    expect(b.calls.n).toBe(0)
  })

  it('ignores unknown ids', async () => {
    const a = counted(1000)
    const { scheduler } = setup({ a: a.definition })
    scheduler.setActive(['a', 'not-a-source'])
    expect(scheduler.active()).toEqual(['a'])
  })

  it('reports a failing collection and keeps polling', async () => {
    let n = 0
    const { scheduler, samples, errors } = setup({
      flaky: {
        intervalMs: 1000,
        collect: async () => {
          n += 1
          if (n === 1) throw new Error('wmic went away')
          return { ok: true }
        },
      },
    })

    scheduler.setActive(['flaky'])
    await advance(0)
    expect(errors).toEqual([{ id: 'flaky', message: 'wmic went away' }])

    await advance(1000)
    expect(samples).toHaveLength(1)
  })

  it('counts completed collections per source', async () => {
    const { scheduler } = setup({ a: counted(1000).definition, b: counted(2000).definition })
    scheduler.setActive(['a', 'b'])
    // Between ticks, so no collection is caught mid-flight: a ran at 0,1,2,3,4s
    // and b at 0,2,4s.
    await advance(4500)
    expect(scheduler.collections()).toEqual({ a: 5, b: 3 })
  })

  it('emits nothing and arms nothing after dispose', async () => {
    const a = counted(1000, 500)
    const { scheduler, samples } = setup({ a: a.definition })
    scheduler.setActive(['a'])
    scheduler.dispose()
    await advance(10_000)
    expect(samples).toHaveLength(0)
    expect(scheduler.timerCount()).toBe(0)
    scheduler.setActive(['a'])
    expect(scheduler.timerCount()).toBe(0)
  })
})
