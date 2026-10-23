import type { Elec16Host } from '../../../src/renderer/widgets/elec16/runner.svelte.ts'

/**
 * An emulator runner's host whose clock only the test moves: timers run in the order they
 * fall due, the clock standing at each, and the frames asked for run once the time is
 * reached. The ELEC-16 runner's tests (both models) drive the machine through it; the RTC
 * reads a fixed date. tests/unit/emu-loops.test.ts keeps its own, with frames run apart.
 */
export function fakeLoopHost() {
  let now = 0
  let next = 1
  const timers = new Map<number, { at: number; fn: () => void }>()
  const frames = new Map<number, () => void>()
  const host: Elec16Host = {
    requestFrame: (fn) => {
      frames.set(next, () => fn(now))
      return next++
    },
    cancelFrame: (h) => void frames.delete(h),
    setTimer: (fn, ms) => {
      timers.set(next, { at: now + ms, fn })
      return next++
    },
    clearTimer: (h) => void timers.delete(h),
    now: () => now,
    clock: () => ({ second: 0, minute: 0, hour: 12, day: 3, month: 10, year: 2026, weekday: 6 }),
  }
  /** Moves the clock `ms` on, running every timer due by then and then the waiting frames. */
  const advance = (ms: number) => {
    const end = now + ms
    for (;;) {
      const due = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
      if (due === undefined) break
      timers.delete(due[0])
      now = due[1].at
      due[1].fn()
    }
    now = end
    const waiting = [...frames.values()]
    frames.clear()
    for (const fn of waiting) fn()
  }
  return { host, advance, timers }
}
