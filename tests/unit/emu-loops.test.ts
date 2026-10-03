import { describe, expect, it } from 'vitest'
import {
  type LoopHost,
  type LoopOwner,
  TimedLoop,
  type TimedMachine,
  type Wake,
} from '../../src/renderer/widgets/emu/loops.js'

/**
 * The timed loop (docs/emu.md section 4): runs a cycle machine from a timer, draws only when
 * the screen changed, and stops while the machine sleeps until a key or its timer.
 */

/** A host whose clock and timers the test moves by hand. */
function fakeHost() {
  let now = 0
  let next = 1
  const timers = new Map<number, { at: number; fn: () => void }>()
  const frames = new Map<number, (now: number) => void>()
  const host: LoopHost = {
    requestFrame: (fn) => {
      frames.set(next, fn)
      return next++
    },
    cancelFrame: (h) => void frames.delete(h),
    setTimer: (fn, ms) => {
      timers.set(next, { at: now + ms, fn })
      return next++
    },
    clearTimer: (h) => void timers.delete(h),
    now: () => now,
  }
  return {
    host,
    timers,
    frames,
    /** Moves the clock, firing timers due on the way (in order). */
    advance(ms: number) {
      const end = now + ms
      for (;;) {
        const due = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
        if (due === undefined) break
        timers.delete(due[0])
        now = due[1].at
        due[1].fn()
      }
      now = end
    },
    /** Runs the waiting animation frames. */
    flushFrames() {
      const waiting = [...frames]
      frames.clear()
      for (const [, fn] of waiting) fn(now)
    },
  }
}

/** A machine that runs what it is given, and sleeps when told to. */
function fakeMachine() {
  const m = {
    running: true,
    screenRevision: 0,
    hz: 60_000,
    ran: 0,
    advanced: 0,
    sleepWith: null as Wake | null,
    advance(ms: number) {
      m.advanced += ms
    },
    run(cycles: number) {
      if (m.sleepWith !== null) return { cycles: 0, sleeping: m.sleepWith }
      m.ran += cycles
      return { cycles, sleeping: null }
    },
  }
  return m
}

function setUp() {
  const clock = fakeHost()
  const machine = fakeMachine()
  let draws = 0
  let settles = 0
  const sleeps: (Wake | null)[] = []
  const owner: LoopOwner<TimedMachine> = {
    machine,
    ran: () => {},
    draw: () => {
      draws++
    },
    settle: () => {
      settles++
    },
    wanted: () => true,
  }
  const loop = new TimedLoop(
    clock.host,
    owner,
    { tickMs: 1000 / 60, maxCatchUpMs: 50, budgetMs: 8, slice: 1_000_000 },
    (w) => sleeps.push(w),
  )
  return { clock, machine, loop, sleeps, draws: () => draws, settles: () => settles }
}

describe('the timed loop', () => {
  it('runs the cycles the clock owes, a frame at a time', () => {
    const t = setUp()
    t.loop.start()
    t.clock.advance(1000)
    // 60 kHz for a second: the cycles, and all the time for the machine's own timer.
    expect(t.machine.ran).toBeGreaterThan(59_000)
    expect(t.machine.ran).toBeLessThanOrEqual(60_000)
    expect(t.machine.advanced).toBeCloseTo(1000)
  })

  it('draws on an animation frame only when the screen changed', () => {
    const t = setUp()
    t.loop.start()
    t.clock.advance(100)
    t.clock.flushFrames()
    const first = t.draws()
    t.clock.advance(100)
    t.clock.flushFrames()
    expect(t.draws()).toBe(first)
    t.machine.screenRevision++
    t.clock.advance(20)
    t.clock.flushFrames()
    expect(t.draws()).toBe(first + 1)
  })

  it('stops while asleep, waking for a key, and says so', () => {
    const t = setUp()
    t.loop.start()
    t.clock.advance(50)
    t.machine.sleepWith = { key: true, timerMs: null }
    t.clock.advance(50)
    expect(t.loop.asleep).toEqual({ key: true, timerMs: null })
    expect(t.clock.timers.size).toBe(0)
    expect(t.sleeps).toEqual([{ key: true, timerMs: null }])
    const before = t.settles()
    t.clock.advance(5000)
    expect(t.settles()).toBe(before)
    t.machine.sleepWith = null
    t.loop.wake()
    t.clock.advance(0)
    expect(t.loop.asleep).toBeNull()
    expect(t.sleeps).toEqual([{ key: true, timerMs: null }, null])
    // Woken after five seconds asleep, the machine's timer is given all of them.
    expect(t.machine.advanced).toBeCloseTo(5100)
  })

  it('waits for the time the machine says it will wake, on one timer', () => {
    const t = setUp()
    t.loop.start()
    t.machine.sleepWith = { key: false, timerMs: 300 }
    t.clock.advance(20)
    expect(t.clock.timers.size).toBe(1)
    t.machine.sleepWith = null
    t.clock.advance(290)
    expect(t.loop.asleep).not.toBeNull()
    t.clock.advance(20)
    expect(t.loop.asleep).toBeNull()
  })

  it('never runs more than its budget, nor catches up a long stall', () => {
    const t = setUp()
    t.machine.hz = 1e12
    const slow = t.machine.run
    t.machine.run = (cycles: number) => {
      t.clock.advance(5)
      return slow(cycles)
    }
    t.loop.start()
    t.clock.advance(17)
    // Slices of a million cycles, five milliseconds each: the 8 ms budget stops it after two.
    expect(t.machine.ran).toBeLessThanOrEqual(3_000_000)
  })

  it('does nothing once stopped', () => {
    const t = setUp()
    t.loop.start()
    t.loop.stop()
    expect(t.loop.active).toBe(false)
    t.clock.advance(1000)
    expect(t.machine.ran).toBe(0)
  })
})
