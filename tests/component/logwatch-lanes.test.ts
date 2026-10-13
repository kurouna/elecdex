import type { LevelCounts } from '@shared/logwatch/rate'
import { cleanup, render } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The canvas given a size at once: jsdom lays nothing out, and the lanes draw nothing at 0x0.
vi.mock('../../src/renderer/lib/canvas.ts', () => ({
  observeCanvas: (_el: HTMLCanvasElement, onSize: (size: object) => void) => {
    onSize({ width: 300, height: 40, ratio: 1 })
    return () => {}
  },
}))

const { default: LogLanes } = await import('../../src/renderer/widgets/logwatch/LogLanes.svelte')

/** The lanes (LogLanes.svelte): drawn when what they show changes, not every second. */

let draws = 0

beforeEach(() => {
  draws = 0
  HTMLCanvasElement.prototype.getContext = (() => ({
    setTransform() {},
    clearRect() {
      draws++
    },
    fillRect() {},
    fillStyle: '',
  })) as unknown as HTMLCanvasElement['getContext']
})

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(HTMLCanvasElement.prototype, 'getContext')
})

const buckets = (err: number): LevelCounts[] =>
  Array.from({ length: 60 }, () => ({ DBG: 0, INF: 3, WRN: 0, ERR: err }))

describe('LogLanes', () => {
  it('draws again only when what it shows changes', async () => {
    // Found in review: every second's new array of the same counts drew the canvas again.
    const { rerender } = render(LogLanes, { props: { buckets: buckets(0) } })
    await tick()
    const first = draws
    expect(first).toBeGreaterThan(0)
    await rerender({ buckets: buckets(0) })
    await tick()
    expect(draws).toBe(first)
    await rerender({ buckets: buckets(1) })
    await tick()
    expect(draws).toBe(first + 1)
  })
})
