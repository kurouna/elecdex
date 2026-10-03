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
  let fading = 0
  const sleeps: (Wake | null)[] = []
  const owner: LoopOwner<TimedMachine> = {
    machine,
    ran: () => {},
    draw: () => {
      draws++
      return fading-- > 0
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
  return {
    clock,
    machine,
    loop,
    sleeps,
    draws: () => draws,
    settles: () => settles,
    fade: (frames: number) => {
      fading = frames
    },
  }
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

  it('tells again that the machine sleeps after being stopped and started', () => {
    const t = setUp()
    t.loop.start()
    t.machine.sleepWith = { key: true, timerMs: null }
    t.clock.advance(20)
    t.loop.stop()
    t.loop.start()
    t.clock.advance(20)
    // A new machine put in while stopped sleeps too: the runner must hear it, not assume it.
    expect(t.sleeps).toEqual([
      { key: true, timerMs: null },
      { key: true, timerMs: null },
    ])
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

  it('draws on while the picture fades, then rests, even asleep', () => {
    const t = setUp()
    t.loop.start()
    t.machine.sleepWith = { key: true, timerMs: null }
    t.machine.screenRevision++
    t.clock.advance(20)
    expect(t.loop.asleep).not.toBeNull()
    t.fade(3)
    for (let k = 0; k < 6; k++) t.clock.flushFrames()
    // The change, then three frames of fading, then nothing more asked.
    expect(t.draws()).toBe(4)
    expect(t.clock.frames.size).toBe(0)
  })

  it('runs as fast as the budget allows at MAX, owing nothing after', () => {
    const clock = fakeHost()
    const machine = fakeMachine()
    const owner: LoopOwner<TimedMachine> = {
      machine,
      ran: () => {},
      draw: () => false,
      settle: () => {},
      wanted: () => true,
    }
    let spent = 0
    machine.run = (cycles: number) => {
      spent++
      clock.advance(1)
      machine.ran += cycles
      return { cycles, sleeping: null }
    }
    const loop = new TimedLoop(
      clock.host,
      owner,
      { tickMs: 1000 / 60, maxCatchUpMs: 50, budgetMs: 8, slice: 1000, rate: () => Infinity },
      () => {},
    )
    loop.start()
    clock.advance(1)
    // Slices of a thousand until the 8 ms budget is gone, then the next tick.
    expect(spent).toBeGreaterThanOrEqual(8)
    expect(Number.isFinite(machine.ran)).toBe(true)
  })

  it('draws no more often than its policy says, the last change always drawn', () => {
    const clock = fakeHost()
    const machine = fakeMachine()
    let draws = 0
    const owner: LoopOwner<TimedMachine> = {
      machine,
      ran: () => {
        machine.screenRevision++
      },
      draw: () => {
        draws++
        return false
      },
      settle: () => {},
      wanted: () => true,
    }
    const loop = new TimedLoop(
      clock.host,
      owner,
      { tickMs: 1000 / 60, maxCatchUpMs: 50, budgetMs: 8, slice: 1_000_000, drawMs: 50 },
      () => {},
    )
    loop.start()
    for (let k = 0; k < 60; k++) {
      clock.advance(1000 / 60)
      clock.flushFrames()
    }
    // A second of a screen changing every tick: about twenty draws (each waits for the next
    // frame after its 50 ms), not sixty.
    expect(draws).toBeGreaterThanOrEqual(15)
    expect(draws).toBeLessThanOrEqual(21)
    loop.stop()
    expect(clock.timers.size).toBe(0)
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
