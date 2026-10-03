import { assemble, ramImage } from '@shared/elec16/asm'
import { screenText } from '@shared/elec16/font'
import { keyCode } from '@shared/elec16/keys'
import { pasteKeys } from '@shared/elec16/paste'
import { romFromFile } from '@shared/elec16/rom'
import { ANNUNCIATORS } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'
import romJson from '../../src/renderer/widgets/elec16/rom.json'
import { type Elec16Host, Elec16Runner } from '../../src/renderer/widgets/elec16/runner.svelte.ts'

/**
 * The ELEC-16 runner (docs/elec16.md section 9) on the real ROM, with a clock the test
 * moves: it sleeps at the prompt with nothing scheduled, a key wakes it, and the page's
 * picture of SHIFT gives a character typed on the PC the shift it needs.
 */

const ROM = romFromFile(romJson) ?? new Uint8Array()

/** A host whose clock and timers the test moves by hand. */
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

/** Types a line, a key at a time, then lets the machine take it. */
function typeLine(runner: Elec16Runner, line: string): void {
  for (const ch of line) {
    runner.down(keyCode(ch.toLowerCase()), false)
    runner.release(keyCode(ch.toLowerCase()))
  }
  runner.down(keyCode('enter'), false)
  runner.release(keyCode('enter'))
}

/** E and G for a program that never ends, at 0x7000. */
function runForever(runner: Elec16Runner, advance: (ms: number) => void): void {
  const bytes = Array.from(ramImage(assemble('.org 0x7000\nj $'), 0x7000), (b) =>
    b.toString(16).padStart(2, '0'),
  )
  typeLine(runner, `e 7000 ${bytes.join(' ')}`)
  advance(50)
  typeLine(runner, 'g 7000')
  advance(50)
}

/** Switched on and, unless `basic`, taken to the monitor on a cleared screen. */
function setUp(basic = false) {
  const clock = fakeHost()
  const runner = new Elec16Runner(clock.host)
  runner.boot(ROM, 'pocket-48', 4_000_000)
  clock.advance(500)
  if (!basic) {
    typeLine(runner, 'mon')
    runner.press(keyCode('cls'))
    runner.release(keyCode('cls'))
    clock.advance(50)
  }
  const lines = () => {
    const s = runner.machine?.state
    return s === undefined ? [] : screenText(s.vram, 240, 48).map((l) => l.trimEnd())
  }
  return { clock, runner, lines }
}

describe('the ELEC-16 runner', () => {
  it('boots to the prompt and sleeps there with nothing scheduled', () => {
    const { clock, runner, lines } = setUp(true)
    expect(lines().slice(0, 3)).toEqual(['ELEC-16 BASIC 1.0', '26622 BYTES FREE', '>'])
    expect(runner.asleep).toBe(true)
    expect(runner.status).toBe('running')
    expect(clock.timers.size).toBe(0)
  })

  it('wakes for a key, types it, and sleeps again', () => {
    const { clock, runner, lines } = setUp()
    runner.down(keyCode('h'), false)
    runner.release(keyCode('h'))
    expect(runner.asleep).toBe(true)
    clock.advance(50)
    expect(lines()[0]).toBe('*H')
    expect(runner.asleep).toBe(true)
    expect(clock.timers.size).toBe(0)
  })

  it('gives a character typed on the PC the SHIFT it needs, whatever the screen key left on', () => {
    const { clock, runner, lines } = setUp()
    // "!" needs SHIFT; then "1" needs none, though the screen's SHIFT key is pressed before it.
    runner.down(keyCode('1'), true)
    runner.release(keyCode('1'))
    runner.press(keyCode('shift'))
    runner.release(keyCode('shift'))
    runner.down(keyCode('1'), false)
    runner.release(keyCode('1'))
    runner.down(keyCode('a'), true)
    clock.advance(50)
    expect(lines()[0]).toBe('*!1a')
  })

  it('pastes more keys than the FIFO holds, a few at a time, none lost, and stops with BRK', () => {
    const { clock, runner, lines } = setUp(true)
    runner.press(keyCode('cls'))
    runner.release(keyCode('cls'))
    const text = '10 PRINT "がっこう";\n20 FOR I=1 TO 3:PRINT I;:NEXT\nRUN\n'
    const { keys, skipped } = pasteKeys(text, { caps: true, kana: false })
    expect(skipped).toBe(0)
    expect(keys.length).toBeGreaterThan(32)
    runner.paste(keys)
    expect(runner.pasting).toBeGreaterThan(0)
    clock.advance(1000)
    expect(runner.pasting).toBe(0)
    expect(lines().slice(0, 4)).toEqual([
      '>10 PRINT "ｶﾞｯｺｳ";',
      '>20 FOR I=1 TO 3:PRINT I;:NEXT',
      '>RUN',
      'ｶﾞｯｺｳ1 2 3',
    ])
    // KANA is put back as it was.
    expect(runner.annunciators & (1 << ANNUNCIATORS.indexOf('KANA'))).toBe(0)
    // BRK ends a paste under way.
    runner.paste(pasteKeys('PRINT 1\n'.repeat(20), { caps: true, kana: false }).keys)
    expect(runner.pasting).toBeGreaterThan(0)
    runner.brk()
    expect(runner.pasting).toBe(0)
  })

  it('switches itself off after the auto power-off time asleep for a key, counted from the last', () => {
    const { clock, runner } = setUp()
    let told = 0
    runner.onAutoOff = () => told++
    runner.autoOffMs = 600_000
    // Armed the next time it falls asleep for a key.
    runner.down(keyCode('a'), false)
    runner.release(keyCode('a'))
    clock.advance(599_000)
    runner.down(keyCode('b'), false)
    runner.release(keyCode('b'))
    clock.advance(599_000)
    expect(runner.off).toBe(false)
    clock.advance(2_000)
    expect(runner.off).toBe(true)
    expect(told).toBe(1)
    // ON again; out of sight it waits for nothing, and nothing is left to fire.
    runner.brk()
    clock.advance(500)
    expect(runner.off).toBe(false)
    typeLine(runner, 'mon')
    clock.advance(50)
    runner.setSeen(false)
    expect(clock.timers.size).toBe(0)
    runner.setSeen(true)
    clock.advance(50)
    // A program running is never switched off.
    runForever(runner, clock.advance)
    expect(runner.asleep).toBe(false)
    const now = clock.host.now()
    expect([...clock.timers.values()].every((t) => t.at - now < 1000)).toBe(true)
  })

  it('knows a machine woken by the first tick after a pause is awake: no auto-off, no going on by itself', () => {
    const { clock, runner } = setUp()
    let told = 0
    runner.onAutoOff = () => told++
    runner.autoOffMs = 60_000
    // c.j 0 at 0x7000: a jump to itself, entered now and started by keys typed while paused.
    typeLine(runner, 'e 7000 01 a0')
    clock.advance(50)
    expect(runner.asleep).toBe(true)
    runner.pause()
    typeLine(runner, 'g 7000')
    runner.resume()
    clock.advance(50)
    expect(runner.machine?.state.sleeping).toBe(false)
    expect(runner.asleep).toBe(false)
    // A key to the running program arms nothing.
    runner.down(keyCode('a'), false)
    runner.release(keyCode('a'))
    runner.setHz(1000)
    clock.advance(61_000)
    expect(runner.off).toBe(false)
    expect(told).toBe(0)
    // Hidden and seen again, a running program stays paused.
    runner.setSeen(false)
    runner.setSeen(true)
    expect(runner.status).toBe('paused')
  })

  it('pauses at a breakpoint, goes on from it, and keeps it for the next mount', () => {
    const { clock, runner } = setUp()
    runner.toggleBreakpoint(0x7000)
    expect(runner.breakpoints).toEqual([0x7000])
    runForever(runner, clock.advance)
    expect(runner.status).toBe('paused')
    expect(runner.breakAt).toBe(0x7000)
    // GO runs the instruction there (j $), which comes back to it.
    runner.resume()
    clock.advance(50)
    expect(runner.status).toBe('paused')
    expect(runner.breakAt).toBe(0x7000)
    expect(runner.machine?.state.instret).toBeGreaterThan(0)
    // Without it, it runs on; a moved pane's runner takes the machine's breakpoints.
    runner.toggleBreakpoint(0x7000)
    runner.toggleBreakpoint(0x7100)
    runner.resume()
    clock.advance(50)
    expect(runner.status).toBe('running')
    const next = new Elec16Runner(clock.host)
    const machine = runner.detach()
    if (machine === null) throw new Error('no machine')
    next.adopt(machine, 4_000_000, false)
    expect(next.breakpoints).toEqual([0x7100])
  })

  it('pauses out of sight, and comes back by itself when it was asleep at its prompt', () => {
    const { clock, runner } = setUp()
    runner.setSeen(false)
    expect(runner.pausedBy).toBe('hidden')
    runner.setSeen(true)
    expect(runner.status).toBe('running')
    // A program that was running stays paused when it comes back.
    runForever(runner, clock.advance)
    expect(runner.asleep).toBe(false)
    runner.setSeen(false)
    runner.setSeen(true)
    expect(runner.status).toBe('paused')
  })

  it('stops with BRK, and switches off and on with the power switch', () => {
    const { clock, runner, lines } = setUp()
    runForever(runner, clock.advance)
    expect(runner.asleep).toBe(false)
    runner.brk()
    clock.advance(50)
    expect(lines()).toContain('BREAK AT 7000')
    expect(runner.asleep).toBe(true)
    runner.power()
    expect(runner.off).toBe(true)
    expect(runner.status).toBe('halted')
    runner.power()
    clock.advance(50)
    expect(runner.off).toBe(false)
    expect(lines()[0]).toBe('ELEC-16 BASIC 1.0')
  })

  it('hands its machine to the next mount of a moved pane, which goes on from it', () => {
    const { clock, runner } = setUp()
    runner.down(keyCode('d'), false)
    clock.advance(50)
    const machine = runner.detach()
    expect(runner.status).toBe('empty')
    expect(machine).not.toBeNull()
    const next = new Elec16Runner(clock.host)
    if (machine !== null) next.adopt(machine, 4_000_000, false)
    next.down(keyCode('1'), false)
    clock.advance(50)
    const s = next.machine?.state
    expect(s === undefined ? [] : screenText(s.vram, 240, 48)[0]?.trimEnd()).toBe('*D1')
    expect(next.model).toBe('pocket-48')
  })

  it('stays paused when another LCD is fitted, and keeps its RAM', () => {
    const { runner } = setUp()
    runner.machine?.state.ram.set([0x5a], 0x100)
    runner.pause()
    runner.boot(ROM, 'pocket-64', 4_000_000, runner.machine?.state.ram.slice())
    expect(runner.status).toBe('paused')
    expect(runner.model).toBe('pocket-64')
    expect(runner.machine?.state.ram[0x100]).toBe(0x5a)
  })

  it('steps one instruction at a time while paused, and runs MAX on the budget', () => {
    const { clock, runner } = setUp()
    runner.pause()
    const before = runner.machine?.state.instret ?? 0
    runner.step()
    expect((runner.machine?.state.instret ?? 0) - before).toBeLessThanOrEqual(1)
    runner.resume()
    runner.setHz(Number.POSITIVE_INFINITY)
    clock.advance(20)
    expect(runner.status).toBe('running')
  })
})
