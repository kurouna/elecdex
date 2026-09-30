import type { Tone } from '@shared/chip8/audio'
import { Chip8 } from '@shared/chip8/machine'
import { quirksFor } from '@shared/chip8/quirks'
import type { Chip8Program } from '@shared/chip8-library'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { claim, PARK_MS, park } from '../../src/renderer/widgets/chip8/park.ts'
import {
  Chip8Runner,
  type RunnerHost,
  STILL_FRAMES,
} from '../../src/renderer/widgets/chip8/runner.svelte.ts'

/** A host with a hand-driven clock: animation frames and timers run when the test says. */
function fakeHost() {
  let now = 0
  let next = 1
  const frames = new Map<number, (now: number) => void>()
  const timers = new Map<number, () => void>()
  const tones: (Tone | null)[] = []
  const host: RunnerHost = {
    requestFrame: (cb) => {
      frames.set(next, cb)
      return next++
    },
    cancelFrame: (h) => void frames.delete(h),
    setTimer: (cb) => {
      timers.set(next, cb)
      return next++
    },
    clearTimer: (h) => void timers.delete(h),
    now: () => now,
    sound: (tone) => void tones.push(tone),
  }
  /** Advances the clock a 60 Hz frame and runs whatever was waiting for it. */
  const vsync = (ms = 1000 / 60) => {
    now += ms
    const due = [...frames.values(), ...[...timers.values()].map((cb) => () => cb())]
    frames.clear()
    timers.clear()
    for (const cb of due) cb(now)
  }
  return { host, vsync, frames, timers, tones }
}

const PROGRAM: Chip8Program = {
  id: 'diag/test',
  title: 'Test',
  authors: [],
  platform: 'chip8',
  genre: 'diag',
  description: '',
  ipf: 10,
  quirks: quirksFor('chip8'),
  font: 'octo',
  rotation: 0,
  licence: 'unknown',
  keys: 0,
  favourite: false,
}

/** v0 += 1 forever; with `draw`, a sprite XORed each time round too. */
const counting = (draw = false) =>
  new Uint8Array(draw ? [0x70, 0x01, 0xd0, 0x01, 0x12, 0x00] : [0x70, 0x01, 0x12, 0x00])

function loaded(rom = counting()) {
  const fake = fakeHost()
  const runner = new Chip8Runner(fake.host)
  runner.load(PROGRAM, rom, 1)
  return { ...fake, runner }
}

describe('the runner', () => {
  it('runs a machine frame per 60 Hz display frame while it runs and is seen', () => {
    const { runner, vsync } = loaded()
    expect(runner.status).toBe('running')
    for (let k = 0; k < 6; k++) vsync()
    // Ten instructions a frame, every other one v0 += 1.
    expect(runner.machine?.state.cycles).toBe(60)
  })

  it('catches up at most three frames after a stall', () => {
    const { runner, vsync } = loaded()
    vsync()
    const before = runner.machine?.state.cycles ?? 0
    vsync(2000)
    expect((runner.machine?.state.cycles ?? 0) - before).toBe(30)
  })

  it('pauses out of sight, stays paused when seen again, and runs nothing meanwhile', () => {
    const { runner, vsync, frames, timers } = loaded()
    vsync()
    runner.setSeen(false)
    expect(runner.status).toBe('paused')
    expect(runner.pausedBy).toBe('hidden')
    expect(frames.size + timers.size).toBe(0)
    runner.setSeen(true)
    expect(runner.status).toBe('paused')
    expect(frames.size + timers.size).toBe(0)
    runner.resume()
    expect(runner.status).toBe('running')
    expect(frames.size).toBe(1)
  })

  it('steps a frame, or an instruction, only while paused', () => {
    const { runner } = loaded()
    const stepped = runner.stepped
    runner.stepFrame()
    expect(runner.machine?.state.cycles).toBe(0)
    runner.pause()
    runner.stepFrame()
    expect(runner.machine?.state.cycles).toBe(10)
    runner.stepInstruction()
    expect(runner.machine?.state.cycles).toBe(11)
    expect(runner.stepped).toBe(stepped + 2)
  })

  it('drops to a timer once the screen stands still, and back to frames when it moves', () => {
    const { runner, vsync, frames, timers } = loaded()
    for (let k = 0; k <= STILL_FRAMES; k++) vsync()
    expect(timers.size).toBe(1)
    expect(frames.size).toBe(0)
    // The machine carries on at its pace on the timer.
    const before = runner.machine?.state.cycles ?? 0
    vsync()
    expect((runner.machine?.state.cycles ?? 0) - before).toBe(10)

    const moving = loaded(counting(true))
    for (let k = 0; k <= STILL_FRAMES * 2; k++) moving.vsync()
    expect(moving.frames.size).toBe(1)
    expect(moving.timers.size).toBe(0)
  })

  it('stops the loop and the sound when the machine halts', () => {
    const { runner, vsync, frames, timers, tones } = loaded(
      new Uint8Array([0x60, 0x05, 0xf0, 0x18, 0x01, 0x23]),
    )
    vsync()
    expect(runner.status).toBe('halted')
    expect(frames.size + timers.size).toBe(0)
    expect(tones.at(-1)).toBeNull()
  })

  it('sounds the timer it is given and says so', () => {
    // v0 := 30, buzzer := v0, then wait here
    const { runner, vsync, tones } = loaded(new Uint8Array([0x60, 0x1e, 0xf0, 0x18, 0x12, 0x04]))
    vsync()
    expect(runner.sounding).toBe(true)
    expect(tones.at(-1)?.seconds).toBeGreaterThan(0)
    runner.pause()
    expect(runner.sounding).toBe(false)
    expect(tones.at(-1)).toBeNull()
  })

  it('keeps what is held and lets it all go when the keyboard leaves', () => {
    const { runner } = loaded()
    runner.press(5)
    runner.press(7)
    expect(runner.keys).toBe((1 << 5) | (1 << 7))
    expect(runner.machine?.state.keys).toBe((1 << 5) | (1 << 7))
    runner.releaseAll()
    expect(runner.keys).toBe(0)
    expect(runner.machine?.state.keys).toBe(0)
  })

  it('resets the program with its tuning kept, running or paused as it was', () => {
    const { runner, vsync } = loaded()
    runner.tune({ ipf: 4 })
    vsync()
    runner.reset(2)
    expect(runner.machine?.state.cycles).toBe(0)
    expect(runner.machine?.state.config.ipf).toBe(4)
    expect(runner.status).toBe('running')
    runner.pause()
    runner.reset(3)
    expect(runner.status).toBe('paused')
    expect(runner.machine?.state.cycles).toBe(0)
  })

  it('hands its machine over without stopping it for good', () => {
    const { runner, vsync } = loaded()
    vsync()
    const machine = runner.detach()
    expect(machine?.state.cycles).toBe(10)
    const next = fakeHost()
    const other = new Chip8Runner(next.host)
    other.adopt(PROGRAM, counting(), machine as Chip8, false)
    next.vsync()
    next.vsync()
    expect(other.machine?.state.cycles).toBe(30)
  })
})

describe('the runner with kept machines', () => {
  it('goes on from a snapshot, running or paused as asked', () => {
    const { runner, vsync } = loaded()
    vsync()
    vsync()
    const kept = runner.snapshot()
    expect(kept).not.toBeNull()
    const next = fakeHost()
    const other = new Chip8Runner(next.host)
    expect(other.load(PROGRAM, counting(), 9, { snapshot: kept, paused: true })).toBe(true)
    expect(other.machine?.state.cycles).toBe(20)
    expect(other.status).toBe('paused')
    expect(next.frames.size + next.timers.size).toBe(0)
  })

  it('starts from the beginning when the snapshot is not good or of another machine', () => {
    const { runner, vsync } = loaded()
    vsync()
    const kept = runner.snapshot() as Uint8Array
    const fresh = new Chip8Runner(fakeHost().host)
    expect(fresh.load(PROGRAM, counting(), 1, { snapshot: new Uint8Array([1, 2, 3]) })).toBe(false)
    expect(fresh.machine?.state.cycles).toBe(0)
    // An imported program since run as SUPER-CHIP: the CHIP-8 machine kept is not taken up.
    const other = { ...PROGRAM, platform: 'schip' as const, quirks: quirksFor('schip') }
    expect(fresh.load(other, counting(), 1, { snapshot: kept })).toBe(false)
    expect(fresh.machine?.state.config.platform).toBe('schip')
    expect(fresh.status).toBe('running')
  })

  it("runs with the user's tuning, from the beginning and from a snapshot", () => {
    const tuned = { ...PROGRAM, tuning: { ipf: 3, quirks: { ...quirksFor('chip8'), clip: false } } }
    const { host, vsync } = fakeHost()
    const runner = new Chip8Runner(host)
    runner.load(tuned, counting(), 1)
    expect(runner.machine?.state.config.ipf).toBe(3)
    expect(runner.machine?.state.config.quirks.clip).toBe(false)
    vsync()
    const kept = runner.snapshot() as Uint8Array
    // Kept before the tuning went back to the program's own: it goes on as tuned now.
    runner.load(PROGRAM, counting(), 1, { snapshot: kept })
    expect(runner.machine?.state.cycles).toBe(3)
    expect(runner.machine?.state.config.ipf).toBe(10)
    expect(runner.machine?.state.config.quirks.clip).toBe(true)
  })

  it('counts what changed the machine, so a still one is not kept again', () => {
    const { runner, vsync } = loaded()
    const at = runner.changes
    vsync()
    expect(runner.changes).toBeGreaterThan(at)
    runner.pause()
    const paused = runner.changes
    vsync()
    expect(runner.changes).toBe(paused)
    runner.stepFrame()
    expect(runner.changes).toBeGreaterThan(paused)
  })

  it('puts its machine away when its program leaves the library', () => {
    const { runner, frames, tones } = loaded()
    runner.unload()
    expect(runner.status).toBe('empty')
    expect(runner.program).toBeNull()
    expect(runner.snapshot()).toBeNull()
    expect(frames.size).toBe(0)
    expect(tones.at(-1)).toBeNull()
  })
})

describe('found in review (2026-09-30)', () => {
  it("leaves the game as it is when a slot's machine cannot be taken up", () => {
    const { runner, vsync } = loaded()
    vsync()
    const machine = runner.machine
    const other = { ...PROGRAM, platform: 'schip' as const, quirks: quirksFor('schip') }
    const kept = new Chip8Runner(fakeHost().host)
    kept.load(other, counting(), 1)
    const wrong = kept.snapshot()
    expect(runner.load(PROGRAM, counting(), 2, { snapshot: wrong, strict: true })).toBe(false)
    expect(runner.load(PROGRAM, counting(), 2, { snapshot: null, strict: true })).toBe(false)
    expect(runner.machine).toBe(machine)
    expect(runner.machine?.state.cycles).toBe(10)
    expect(runner.status).toBe('running')
  })

  it('loads nothing once disposed: a start that lands after its pane went', () => {
    const { host, frames, timers } = fakeHost()
    const runner = new Chip8Runner(host)
    runner.dispose()
    expect(runner.load(PROGRAM, counting(), 1)).toBe(false)
    expect(runner.status).toBe('empty')
    expect(frames.size + timers.size).toBe(0)
  })

  it('never runs a program loaded or taken up out of sight, nor goes on by itself when seen', () => {
    const { host, frames, timers } = fakeHost()
    const runner = new Chip8Runner(host)
    runner.setSeen(false)
    runner.load(PROGRAM, counting(), 1)
    expect(runner.status).toBe('paused')
    expect(runner.pausedBy).toBe('hidden')
    expect(frames.size + timers.size).toBe(0)
    runner.setSeen(true)
    expect(runner.status).toBe('paused')
    const other = new Chip8Runner(fakeHost().host)
    other.setSeen(false)
    const machine = runner.detach() as Chip8
    other.adopt(PROGRAM, counting(), machine, false)
    expect(other.status).toBe('paused')
  })

  it('drops to the timer for a program that only scrolls by nothing', () => {
    // 00C0 in a loop: nothing on screen moves, so the loop must not stay on animation frames.
    const { runner, vsync, frames, timers } = loaded(new Uint8Array([0x00, 0xc0, 0x12, 0x00]))
    for (let k = 0; k <= STILL_FRAMES; k++) vsync()
    expect(runner.status).toBe('running')
    expect(timers.size).toBe(1)
    expect(frames.size).toBe(0)
  })

  it('lets every key go when the machine is handed to another mount', () => {
    const { runner } = loaded()
    runner.press(5)
    expect(runner.machine?.state.keys).not.toBe(0)
    const machine = runner.detach() as Chip8
    expect(machine.state.keys).toBe(0)
    expect(runner.keys).toBe(0)
  })
})

describe('parking', () => {
  afterEach(() => vi.useRealTimers())

  it('keeps a machine for its pane to take up once, and lets it go if nobody does', () => {
    vi.useFakeTimers()
    const machine = Chip8.load(
      counting(),
      { platform: 'chip8', quirks: quirksFor('chip8'), ipf: 1, font: 'octo' },
      1,
    )
    park('p1', { program: PROGRAM, rom: counting(), machine, paused: true })
    expect(claim('p2')).toBeNull()
    expect(claim('p1')?.machine).toBe(machine)
    expect(claim('p1')).toBeNull()
    park('p1', { program: PROGRAM, rom: counting(), machine, paused: false })
    vi.advanceTimersByTime(PARK_MS + 1)
    expect(claim('p1')).toBeNull()
  })
})
