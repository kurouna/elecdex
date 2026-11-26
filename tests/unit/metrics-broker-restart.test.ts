import { EventEmitter } from 'node:events'
import { CH } from '@shared/channels'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The metrics collector, lost, comes back after a wait that grows (0.5 s, 2 s, 5 s, 15 s) while
 * it keeps failing. The count of failures went back to zero on every start (`spawn`), and every
 * collector that dies has started first: one that died in its first reading came back every
 * half second for as long as a monitor was open.
 */

class FakeCollector extends EventEmitter {
  postMessage = vi.fn()
  kill = vi.fn()
}

const forks = vi.hoisted(() => ({ made: [] as unknown[], at: [] as number[] }))

const { ipcMain, bus } = await vi.hoisted(async () =>
  (await import('./support/electron-ipc')).fakeIpcMain(),
)

vi.mock('electron', () => ({
  ipcMain,
  utilityProcess: {
    fork: () => {
      const child = new FakeCollector()
      forks.made.push(child)
      forks.at.push(Date.now())
      return child
    },
  },
}))

const { registerMetricsIpc } = await import('../../src/main/metrics/broker.js')

/** A page, as far as the broker and page-gone use it. */
const page = {
  isDestroyed: () => false,
  send: vi.fn(),
  on: () => {},
  once: () => {},
}

const last = (): FakeCollector => forks.made.at(-1) as FakeCollector

/** The collector starts, then dies at once, as one that fails in its first reading does. */
function startAndDie(): void {
  last().emit('spawn')
  last().emit('exit', 1)
}

let ipc: { dispose: () => void }

beforeEach(() => {
  vi.useFakeTimers()
  forks.made.length = 0
  forks.at.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
  ipc = registerMetricsIpc()
  bus.emit(CH.metrics.subscribe, { sender: page }, 'cpu.load')
})

afterEach(() => {
  ipc.dispose()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('the metrics collector that keeps dying', () => {
  it('is started again after a wait that grows, though each one started', () => {
    expect(forks.made).toHaveLength(1)
    const waits: number[] = []
    for (let i = 0; i < 4; i += 1) {
      startAndDie()
      const before = forks.made.length
      const diedAt = Date.now()
      while (forks.made.length === before) vi.advanceTimersByTime(100)
      waits.push((forks.at.at(-1) ?? 0) - diedAt)
    }
    expect(waits).toEqual([500, 2000, 5000, 15_000])
  })

  it('waits the shortest again once a collector has sent a reading', () => {
    startAndDie()
    vi.advanceTimersByTime(500)
    startAndDie()
    vi.advanceTimersByTime(2000)
    // This one works for a while: a reading arrives, then it is lost.
    last().emit('spawn')
    last().emit('message', { t: 'sample', id: 'cpu.load', at: Date.now(), data: {} })
    last().emit('exit', 1)
    const before = forks.made.length
    vi.advanceTimersByTime(500)
    expect(forks.made.length).toBe(before + 1)
  })
})
