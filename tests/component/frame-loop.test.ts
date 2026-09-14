import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The shared frame loop, with fake timers and a stand-in requestAnimationFrame
 * that runs its callback on the next timer turn - as a real frame follows the
 * timer that asked for it. The module holds global state and a document
 * listener, so each test imports it fresh.
 */

type Loop = typeof import('../../src/renderer/lib/frame-loop.ts')

let loop: Loop
let frames: number
let stops: Array<() => void> = []

/** onFrame, remembering the unsubscribe so every test leaves no loop behind. */
function subscribe(callback: () => void, period?: number): () => void {
  const stop = loop.onFrame(callback, period)
  stops.push(stop)
  return stop
}

async function freshLoop(): Promise<Loop> {
  vi.resetModules()
  return import('../../src/renderer/lib/frame-loop.ts')
}

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(async () => {
  vi.useFakeTimers()
  // Start just after a wall-clock second, past the wake phase.
  vi.setSystemTime(new Date('2026-09-14T00:00:00.010Z'))
  frames = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    return setTimeout(() => {
      frames += 1
      callback(performance.now())
    }, 0) as unknown as number
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
  setHidden(false)
  loop = await freshLoop()
})

afterEach(() => {
  for (const stop of stops) stop()
  stops = []
  // Earlier imports keep their document listeners; hiding cancels anything they hold.
  setHidden(true)
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('msUntilBoundary', () => {
  it('counts to the next multiple of the period, just past it', () => {
    const second = Date.parse('2026-09-14T00:00:00.000Z')
    expect(loop.msUntilBoundary(1000, second + 10)).toBe(995)
    expect(loop.msUntilBoundary(1000, second + 5)).toBe(1000)
    expect(loop.msUntilBoundary(1000, second + 4)).toBe(1)
    expect(loop.msUntilBoundary(100, second + 60)).toBe(45)
  })
})

describe('onFrame', () => {
  it('wakes on wall-clock boundaries of the period', () => {
    const calls: number[] = []
    subscribe(() => calls.push(Date.now() % 1000))
    vi.advanceTimersByTime(1000)
    expect(calls).toHaveLength(10)
    // Just past each boundary: the wake phase, plus the frame that follows the timer.
    for (const at of calls) expect(at % 100).toBeGreaterThanOrEqual(5)
    for (const at of calls) expect(at % 100).toBeLessThan(20)
  })

  it('wakes only as often as the most frequent subscriber needs', () => {
    const chart = vi.fn()
    subscribe(chart, 200)
    vi.advanceTimersByTime(1000)
    expect(chart).toHaveBeenCalledTimes(5)
    expect(frames).toBe(5)
  })

  it('calls a slower subscriber on every other frame of a faster one, in the same frames', () => {
    const at: Record<string, number[]> = { globe: [], chart: [] }
    subscribe(() => at.globe?.push(Date.now()), 100)
    subscribe(() => at.chart?.push(Date.now()), 200)
    vi.advanceTimersByTime(1000)
    expect(at.globe).toHaveLength(10)
    // The chart's first call is the next frame; after that, every 200ms boundary.
    const chart = at.chart ?? []
    const onBoundaries = chart.slice(1)
    expect(onBoundaries.length).toBeGreaterThanOrEqual(4)
    for (const [i, t] of onBoundaries.slice(1).entries()) {
      expect(t - (onBoundaries[i] as number)).toBe(200)
    }
    for (const t of chart) expect(at.globe).toContain(t)
    // No frame of their own: the chart only ever draws in the globe's frames.
    expect(frames).toBe(10)
  })

  it('brings the wake forward when a faster subscriber joins, and slows when it leaves', () => {
    const chart = vi.fn()
    subscribe(chart, 1000)
    vi.advanceTimersByTime(50)
    const globe = vi.fn()
    const stopGlobe = subscribe(globe, 100)
    vi.advanceTimersByTime(100)
    expect(globe).toHaveBeenCalledTimes(1)
    stopGlobe()
    frames = 0
    vi.advanceTimersByTime(2000)
    expect(globe).toHaveBeenCalledTimes(1)
    expect(frames).toBe(2)
  })

  it('stops waking once the last subscriber leaves', () => {
    const stop = subscribe(vi.fn())
    vi.advanceTimersByTime(300)
    stop()
    frames = 0
    vi.advanceTimersByTime(2000)
    expect(frames).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not draw while the window is hidden, and resumes when shown', () => {
    const draw = vi.fn()
    subscribe(draw)
    setHidden(true)
    vi.advanceTimersByTime(1000)
    expect(draw).not.toHaveBeenCalled()
    setHidden(false)
    vi.advanceTimersByTime(1000)
    expect(draw).toHaveBeenCalledTimes(10)
  })
})

describe('nextFrame', () => {
  it('runs once in the loop frame when the loop is running, costing no frame of its own', () => {
    const draw = vi.fn()
    subscribe(draw)
    vi.advanceTimersByTime(20)
    const apply = vi.fn()
    loop.nextFrame(apply)
    vi.advanceTimersByTime(100)
    expect(apply).toHaveBeenCalledTimes(1)
    expect(frames).toBe(draw.mock.calls.length)
    vi.advanceTimersByTime(500)
    expect(apply).toHaveBeenCalledTimes(1)
  })

  it('uses one animation frame when no loop is running', () => {
    const first = vi.fn()
    const second = vi.fn()
    loop.nextFrame(first)
    loop.nextFrame(second)
    vi.advanceTimersByTime(1)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(frames).toBe(1)
  })

  it('runs at once while hidden, and flushes what was waiting when the window hides', () => {
    const waiting = vi.fn()
    subscribe(vi.fn())
    loop.nextFrame(waiting)
    setHidden(true)
    expect(waiting).toHaveBeenCalledTimes(1)
    const now = vi.fn()
    loop.nextFrame(now)
    expect(now).toHaveBeenCalledTimes(1)
  })
})
