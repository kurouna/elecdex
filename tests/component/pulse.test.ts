import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { pulse, PULSE_STEP_MS } = await import('../../src/renderer/lib/pulse.svelte.ts')
const loop = await import('../../src/renderer/lib/frame-loop.ts')

/**
 * The beat of whatever pulses for attention: a late task, a countdown's last
 * seconds.
 *
 * They were CSS animations that never end, which are the compositor's for as
 * long as they run - all day, for a task left late. The same four steps a second
 * are now a number on the shared wall-clock tick, which nobody pays for while
 * nothing pulses or the window is put away (measured on a tasks pane with one
 * late task: 9.6% of one core as an animation, 7.6% as this).
 */

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-14T00:00:00.010Z'))
})

afterEach(() => {
  loop.setWindowHidden(false)
  vi.useRealTimers()
})

describe('pulse', () => {
  it('steps through four phases a second, on the wall clock, while someone uses it', () => {
    const release = pulse.use()
    expect(pulse.phase).toBe(0)
    const seen: number[] = []
    for (let step = 0; step < 5; step++) {
      vi.advanceTimersByTime(PULSE_STEP_MS)
      seen.push(pulse.phase)
    }
    expect(seen).toEqual([1, 2, 3, 0, 1])
    release()
  })

  it('runs no timer when nothing pulses, however many came and went', () => {
    expect(vi.getTimerCount()).toBe(0)
    const a = pulse.use()
    const b = pulse.use()
    expect(vi.getTimerCount()).toBe(1)
    a()
    a()
    expect(vi.getTimerCount()).toBe(1)
    b()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('stops while the window is put away', () => {
    const release = pulse.use()
    loop.setWindowHidden(true)
    expect(vi.getTimerCount()).toBe(0)
    const held = pulse.phase
    vi.advanceTimersByTime(5000)
    expect(pulse.phase).toBe(held)
    release()
  })
})
