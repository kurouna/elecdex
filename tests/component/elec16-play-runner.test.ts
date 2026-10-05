import { APU_REG, type ApuFrame } from '@shared/elec16/apu'
import { assemble, ramImage } from '@shared/elec16/asm'
import { PAD_REG, padBit } from '@shared/elec16/pad'
import { romFromFile } from '@shared/elec16/rom'
import { IRQ } from '@shared/elec16/state'
import { VIDEO_REG, VSTAT_VBLANK } from '@shared/elec16/video'
import { describe, expect, it } from 'vitest'
import { playText } from '../../src/renderer/widgets/elec16/play-painter'
import playJson from '../../src/renderer/widgets/elec16/play-rom.json'
import pocketJson from '../../src/renderer/widgets/elec16/rom.json'
import { type Elec16Host, Elec16Runner } from '../../src/renderer/widgets/elec16/runner.svelte.ts'

/**
 * The runner with PLAY-320 on the real PLAY ROM (docs/elec16-play.md, G2 and G3), its clock
 * moved by the test: the start screen is its prompt, it never switches itself off, CODE's
 * program is called and comes back, and the buttons from the body, the keys and the gamepads
 * are held together and wake a program waiting for them.
 */

const ROM = romFromFile(playJson) ?? new Uint8Array()
const CODE_RETURN = playJson.symbols.code_return ?? 0

function fakeHost() {
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

function setUp(sound: { frames: ApuFrame[]; hushed: number } = { frames: [], hushed: 0 }) {
  const clock = fakeHost()
  const runner = new Elec16Runner({
    ...clock.host,
    apu: (frame) => void sound.frames.push(frame),
    hushApu: () => void sound.hushed++,
  })
  runner.boot(ROM, 'play-320', 4_000_000, undefined, 128 * 1024)
  clock.advance(500)
  const lines = () => playText(runner.machine?.state.video?.mem ?? []).map((l) => l.trim())
  return { ...clock, runner, lines }
}

/** CODE's RUN: the program at 7000, called to come back to the start screen's sleep. */
function run(runner: Elec16Runner, src: string): void {
  const out = assemble(`.org 0x7000\n${src}`)
  expect(out.errors).toEqual([])
  expect(runner.loadCode(0x7000, ramImage(out, 0x7000))).toBe(true)
  runner.callCode(0x7000, CODE_RETURN)
}

/** A program that waits for the pad, then keeps PAD at 0x6000 and comes back. */
const WAIT_FOR_PAD = `
  li t0, ${1 << IRQ.pad}
  csrw mie, t0
  wfi
  li t1, ${PAD_REG.held}
  lw t2, 0(t1)
  li t1, 0x6000
  sw t2, 0(t1)
  ret`

const word = (runner: Elec16Runner, at: number) =>
  (runner.machine?.state.ram[at] ?? 0) | ((runner.machine?.state.ram[at + 1] ?? 0) << 8)

describe('the runner with PLAY-320', () => {
  it('boots to the start screen and sleeps there, its prompt, with nothing scheduled', async () => {
    const { runner, timers, lines } = setUp()
    expect(runner.asleep).toBe(true)
    expect(timers.size).toBe(0)
    expect(lines()).toContain('ELEC-16 PLAY')
    expect(lines()).toContain('RAM 32K  XRAM 128K')
    await expect(runner.whenAsleep(10)).resolves.toBe(true)
  })

  it('never counts auto power-off, whatever the unit says', () => {
    const { runner, timers, advance } = setUp()
    runner.autoOffMs = 1000
    runner.brk()
    advance(100)
    expect(runner.asleep).toBe(true)
    expect(timers.size).toBe(0)
    advance(60_000)
    expect(runner.off).toBe(false)
  })

  it("calls CODE's program, which draws, and is back asleep at its prompt after", async () => {
    const { runner, advance, lines } = setUp()
    run(
      runner,
      `
      li t0, 3
      ecall
      la a0, text
      li t0, 1
      ecall
      ret
    text:
      .byte 80, 76, 65, 89, 0`,
    )
    expect(runner.asleep).toBe(false)
    const back = runner.whenAsleep(1000)
    advance(50)
    await expect(back).resolves.toBe(true)
    expect(lines()[0]).toBe('PLAY')
    // A person's RUN: the program may use LINK once.
    expect(runner.machine?.state.link.vouched).toBe(true)
  })

  it('holds the body, the keys and the gamepads together, and lets go of each alone', () => {
    const { runner } = setUp()
    const A = padBit('a')
    const START = padBit('start')
    const UP = padBit('up')
    runner.padFrom('body', A)
    runner.padFrom('keys', START)
    runner.padFrom('gamepad', A | UP)
    expect(runner.padHeld).toBe(A | START | UP)
    expect(runner.machine?.bus.read16(PAD_REG.held)).toBe(A | START | UP)
    runner.padFrom('gamepad', 0)
    expect(runner.padHeld).toBe(A | START)
    runner.padFrom('body', 0)
    expect(runner.machine?.bus.read16(PAD_REG.held)).toBe(START)
    runner.releaseAll()
    expect(runner.padHeld).toBe(0)
    expect(runner.machine?.bus.read16(PAD_REG.held)).toBe(0)
    // Let go of everything, a source pressing again counts afresh.
    runner.padFrom('keys', START)
    expect(runner.padHeld).toBe(START)
  })

  it('does not take a program of its own asleep for the pad for the start screen', async () => {
    const { runner, advance } = setUp()
    run(runner, WAIT_FOR_PAD)
    const back = runner.whenAsleep(200)
    advance(300)
    await expect(back).resolves.toBe(false)
    expect(runner.asleep).toBe(true)
    // Pressed, it comes back to the start screen: that is its prompt.
    const prompt = runner.whenAsleep(200)
    runner.padFrom('keys', padBit('b'))
    advance(50)
    await expect(prompt).resolves.toBe(true)
  })

  it('wakes a program waiting for the pad when a button goes down', () => {
    const { runner, advance } = setUp()
    run(runner, WAIT_FOR_PAD)
    advance(50)
    expect(runner.asleep).toBe(true)
    expect(word(runner, 0x6000)).toBe(0)
    runner.padFrom('keys', padBit('b'))
    advance(50)
    expect(word(runner, 0x6000)).toBe(padBit('b'))
  })

  it('reads the gamepads each tick a program runs, and not once it has none to read', () => {
    const { runner, advance } = setUp()
    // A program that waits for VBLANK, so the machine ticks sixty times a second.
    run(
      runner,
      `
      li t0, ${1 << IRQ.vblank}
      csrw mie, t0
      li t1, ${VIDEO_REG.stat}
    frame:
      wfi
      li t2, ${VSTAT_VBLANK}
      sw t2, 0(t1)
      j frame`,
    )
    let reads = 0
    let held = padBit('x')
    runner.gamepads = () => {
      reads++
      return held
    }
    advance(200)
    expect(reads).toBeGreaterThan(5)
    expect(runner.padHeld).toBe(padBit('x'))
    held = 0
    advance(50)
    expect(runner.padHeld).toBe(0)
    runner.gamepads = null
    const was = reads
    advance(200)
    expect(reads).toBe(was)
  })

  it('lets go of what was held when another machine is fitted', () => {
    const { runner } = setUp()
    runner.padFrom('body', padBit('l'))
    runner.boot(ROM, 'play-320', 4_000_000)
    expect(runner.padHeld).toBe(0)
    runner.padFrom('body', padBit('l'))
    expect(runner.machine?.bus.read16(PAD_REG.held)).toBe(padBit('l'))
  })

  it('sends the sound once a frame that changed it, and again in full after a pause', async () => {
    const sound = { frames: [] as ApuFrame[], hushed: 0 }
    const { runner, advance } = setUp(sound)
    sound.frames.length = 0
    // Nothing written: nothing sent, however many frames go by.
    advance(100)
    expect(sound.frames).toEqual([])
    run(
      runner,
      `
      li t0, ${APU_REG.sel}
      li t1, 2
      sw t1, 0(t0)
      li t0, ${APU_REG.freq}
      li t1, 1760
      sw t1, 0(t0)
      li t0, ${APU_REG.key}
      li t1, 1
      sw t1, 0(t0)
      ret`,
    )
    const back = runner.whenAsleep(1000)
    advance(50)
    await expect(back).resolves.toBe(true)
    expect(sound.frames.length).toBe(1)
    expect([
      sound.frames[0]?.ch[2]?.freq,
      sound.frames[0]?.ch[2]?.ons,
      sound.frames[0]?.ch[2]?.gate,
    ]).toEqual([1760, 1, true])
    expect(sound.frames[0]?.tables.length).toBe(128)
    advance(200)
    expect(sound.frames.length).toBe(1)
    runner.pause()
    expect(sound.hushed).toBeGreaterThan(0)
    runner.resume()
    advance(50)
    // Played on: the whole machine's sound again, the voices started afresh.
    expect(sound.frames.length).toBe(2)
  })
})

describe('the runner with a pocket model', () => {
  it('sends no sound, the handheld neither: they have none', () => {
    const frames: ApuFrame[] = []
    const clock = fakeHost()
    const runner = new Elec16Runner({ ...clock.host, apu: (f) => void frames.push(f) })
    runner.boot(romFromFile(pocketJson) ?? new Uint8Array(), 'handheld-160', 4_000_000)
    clock.advance(500)
    expect(runner.machine?.state.apu).toBe(null)
    expect(frames).toEqual([])
  })
})
