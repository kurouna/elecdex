import { Chip8 } from '@shared/chip8/machine'
import { quirksFor } from '@shared/chip8/quirks'
import { type MachineConfig, maxProgramSize, type Platform, type Quirks } from '@shared/chip8/types'
import { describe, expect, it } from 'vitest'
import { screenText } from './chip8-helpers'

/** A machine running `words` from 0x200, on `platform` with some quirks changed. */
function machine(
  words: number[],
  platform: Platform = 'chip8',
  quirks: Partial<Quirks> = {},
  ipf = 1000,
): Chip8 {
  const program = new Uint8Array(words.flatMap((w) => [w >> 8, w & 0xff]))
  const config: MachineConfig = {
    platform,
    quirks: { ...quirksFor(platform), ...quirks },
    ipf,
    font: 'octo',
  }
  return Chip8.load(program, config, 42)
}

/** Runs instructions one by one: no timers, no frames. */
function steps(m: Chip8, count: number): Chip8 {
  for (let k = 0; k < count; k++) m.step()
  return m
}

describe('loading', () => {
  it('puts the program at 0x200 and the font at 0', () => {
    const m = machine([0x1234])
    expect(m.state.pc).toBe(0x200)
    expect([...m.state.memory.subarray(0x200, 0x202)]).toEqual([0x12, 0x34])
    expect([...m.state.memory.subarray(0, 5)]).toEqual([0xf0, 0x90, 0x90, 0x90, 0xf0])
  })

  it('gives XO-CHIP 64 KB and the others 4 KB', () => {
    expect(machine([], 'chip8').state.memory.length).toBe(0x1000)
    expect(machine([], 'schip').state.memory.length).toBe(0x1000)
    expect(machine([], 'xochip').state.memory.length).toBe(0x10000)
  })

  it('refuses a program too big for its machine', () => {
    const config = { platform: 'chip8', quirks: quirksFor('chip8'), ipf: 10, font: 'octo' } as const
    expect(() => Chip8.load(new Uint8Array(maxProgramSize('chip8') + 1), config, 1)).toThrow(
      RangeError,
    )
    expect(() => Chip8.load(new Uint8Array(maxProgramSize('chip8')), config, 1)).not.toThrow()
  })

  it('holds the speed between 1 and 10000 instructions a frame', () => {
    expect(machine([], 'chip8', {}, 0).state.config.ipf).toBe(1)
    expect(machine([], 'chip8', {}, 99999).state.config.ipf).toBe(10000)
    const m = machine([])
    m.tune({ ipf: 15.4 })
    expect(m.state.config.ipf).toBe(15)
  })
})

describe('arithmetic and its quirks', () => {
  it('carries, borrows and shifts with VF', () => {
    // v0 := 0xFF, v1 := 2, v0 += v1 -> 1, VF 1
    const m = steps(machine([0x60ff, 0x6102, 0x8014]), 3)
    expect(m.state.v[0]).toBe(1)
    expect(m.state.v[0xf]).toBe(1)
    // v0 := 1, v1 := 2, v0 -= v1 -> 0xFF, VF 0 (borrow)
    const b = steps(machine([0x6001, 0x6102, 0x8015]), 3)
    expect(b.state.v[0]).toBe(0xff)
    expect(b.state.v[0xf]).toBe(0)
    // v1 := 2, v0 := 1, v0 =- v1 -> 1, VF 1
    const r = steps(machine([0x6102, 0x6001, 0x8017]), 3)
    expect(r.state.v[0]).toBe(1)
    expect(r.state.v[0xf]).toBe(1)
  })

  it('resets VF after AND, OR and XOR only with vfReset', () => {
    const words = [0x6f05, 0x6003, 0x8011]
    expect(steps(machine(words, 'chip8', { vfReset: true }), 3).state.v[0xf]).toBe(0)
    expect(steps(machine(words, 'chip8', { vfReset: false }), 3).state.v[0xf]).toBe(5)
  })

  it('shifts VY into VX, or VX in place with shiftVx', () => {
    // v0 := 0x10, v1 := 0x03, v0 >>= v1
    const words = [0x6010, 0x6103, 0x8016]
    const vy = steps(machine(words, 'chip8', { shiftVx: false }), 3)
    expect([vy.state.v[0], vy.state.v[0xf]]).toEqual([0x01, 1])
    const vx = steps(machine(words, 'chip8', { shiftVx: true }), 3)
    expect([vx.state.v[0], vx.state.v[0xf]]).toEqual([0x08, 0])
  })

  it('lets the result or the flag win in VF by vfOrder', () => {
    // vf := 0xFF, v1 := 1, vf += v1 -> result 0, carry 1
    const words = [0x6fff, 0x6101, 0x8f14]
    expect(steps(machine(words, 'xochip', { vfOrder: false }), 3).state.v[0xf]).toBe(1)
    expect(steps(machine(words, 'xochip', { vfOrder: true }), 3).state.v[0xf]).toBe(0)
  })

  it('moves I past the registers after FX55 and FX65 only with memIncrement', () => {
    const words = [0xa300, 0x6007, 0x6108, 0xf155]
    const on = steps(machine(words, 'chip8', { memIncrement: true }), 4)
    expect(on.state.i).toBe(0x302)
    expect([...on.state.memory.subarray(0x300, 0x302)]).toEqual([7, 8])
    expect(steps(machine(words, 'chip8', { memIncrement: false }), 4).state.i).toBe(0x300)
  })

  it('jumps to NNN + V0, or XNN + VX with jumpVx', () => {
    // v0 := 1, v3 := 2, jump0 0x300
    const words = [0x6001, 0x6302, 0xb300]
    expect(steps(machine(words, 'chip8', { jumpVx: false }), 3).state.pc).toBe(0x301)
    expect(steps(machine(words, 'schip', { jumpVx: true }), 3).state.pc).toBe(0x302)
  })

  it('writes BCD and draws the same random bytes for the same seed', () => {
    const m = steps(machine([0xa300, 0x60fe, 0xf033]), 3)
    expect([...m.state.memory.subarray(0x300, 0x303)]).toEqual([2, 5, 4])
    const a = steps(machine([0xc0ff, 0xc1ff]), 2)
    const b = steps(machine([0xc0ff, 0xc1ff]), 2)
    expect([a.state.v[0], a.state.v[1]]).toEqual([b.state.v[0], b.state.v[1]])
    expect(steps(machine([0xc00f]), 1).state.v[0]).toBeLessThanOrEqual(0x0f)
  })

  it('points I at the small and big font digits', () => {
    expect(steps(machine([0x6007, 0xf029]), 2).state.i).toBe(7 * 5)
    expect(steps(machine([0x6007, 0xf030], 'schip'), 2).state.i).toBe(80 + 7 * 10)
  })
})

describe('the screen', () => {
  it('XORs a sprite and reports a collision in VF', () => {
    // i := font 0, draw at (0, 0), draw again at (0, 0)
    const m = steps(machine([0x6000, 0xf029, 0xd005, 0xd005]), 3)
    expect(m.state.v[0xf]).toBe(0)
    expect(screenText(m).split('\n')[0]?.slice(0, 4)).toBe('####')
    steps(m, 1)
    expect(m.state.v[0xf]).toBe(1)
    expect(screenText(m)).not.toContain('#')
  })

  it('cuts a sprite at the edge with clip and wraps it without', () => {
    // v0 := 62, i := font 0, draw at (62, 0): four wide, two past the edge
    const words = [0x603e, 0x6100, 0xa000, 0xd015]
    const clipped =
      screenText(steps(machine(words, 'chip8', { clip: true }), 4)).split('\n')[0] ?? ''
    expect(clipped.slice(0, 2)).toBe('..')
    expect(clipped.slice(62)).toBe('##')
    const wrapped =
      screenText(steps(machine(words, 'chip8', { clip: false }), 4)).split('\n')[0] ?? ''
    expect(wrapped.slice(0, 2)).toBe('##')
  })

  it('wraps the starting position onto the screen either way', () => {
    // v0 := 64 + 1: starts at x = 1
    const m = steps(machine([0x6041, 0x6100, 0xa000, 0xd011], 'chip8', { clip: true }), 4)
    expect((screenText(m).split('\n')[0] ?? '').slice(0, 5)).toBe('.####')
  })

  it('draws a 16 x 16 sprite for DXY0 and switches resolution to a clear screen', () => {
    const m = steps(machine([0x00ff, 0xa000, 0xd000], 'schip'), 3)
    expect(m.state.hires).toBe(true)
    expect(screenText(m).split('\n')).toHaveLength(64 + 1)
    const lores = steps(machine([0xa000, 0xd000, 0x00fe], 'schip'), 3)
    expect(screenText(lores)).not.toContain('#')
  })

  it('scrolls only the planes selected, and XO-CHIP draws each plane from its own bytes', () => {
    // plane 3, i := 0x300 (two one-row sprites: 0x80 then 0x40), draw one row at (0, 0)
    const words = [0xf301, 0xa208, 0xd001, 0x1206, 0x8040]
    const m = steps(machine(words, 'xochip'), 3)
    const row = screenText(m).split('\n')[0] ?? ''
    expect(row.slice(0, 2)).toBe('#+')
    const s = machine([0xf301, 0xa20c, 0xd001, 0xf101, 0x00c1, 0x120a, 0x80c0], 'xochip')
    steps(s, 5)
    const lines = screenText(s).split('\n')
    // Plane 1 (0x80) moved down a row; plane 2 (0xC0) stayed.
    expect(lines[0]?.slice(0, 2)).toBe('++')
    expect(lines[1]?.slice(0, 2)).toBe('#.')
  })

  it('counts every change to the screen', () => {
    const m = machine([0x00e0, 0xa000, 0xd005, 0x6000])
    const before = m.state.screenRevision
    steps(m, 3)
    expect(m.state.screenRevision).toBe(before + 2)
    steps(m, 1)
    expect(m.state.screenRevision).toBe(before + 2)
  })
})

describe('frames and timers', () => {
  it('runs ipf instructions a frame and counts the timers down once', () => {
    // v0 := 5, delay := v0, buzzer := v0, then count v1 up forever
    const m = machine([0x6005, 0xf015, 0xf018, 0x7101, 0x1206], 'chip8', {}, 10)
    m.frame()
    expect(m.state.cycles).toBe(10)
    expect(m.state.dt).toBe(4)
    expect(m.sounding).toBe(true)
    for (let k = 0; k < 4; k++) m.frame()
    expect(m.state.st).toBe(0)
    expect(m.sounding).toBe(false)
  })

  it('ends the frame at a sprite with displayWait', () => {
    // draw, then count forever
    const words = [0xa000, 0xd005, 0x7101, 0x1204]
    const wait = machine(words, 'chip8', { displayWait: true }, 100)
    wait.frame()
    expect(wait.state.cycles).toBe(2)
    const free = machine(words, 'chip8', { displayWait: false }, 100)
    free.frame()
    expect(free.state.cycles).toBe(100)
  })

  it('waits for a key pressed and let go during FX0A, with the timers still running', () => {
    const m = machine([0x6003, 0xf015, 0xf40a, 0x1206], 'chip8', {}, 10)
    m.press(0xc) // held before the wait: not taken
    m.frame()
    expect(m.waiting).toBe(true)
    expect(m.state.dt).toBe(2)
    m.release(0xc)
    m.frame()
    expect(m.waiting).toBe(true)
    m.press(7)
    m.frame()
    expect(m.waiting).toBe(true)
    m.release(7)
    expect(m.waiting).toBe(false)
    expect(m.state.v[4]).toBe(7)
    expect(m.state.sensed & (1 << 7)).not.toBe(0)
  })

  it('forgets every key when the pane loses the keyboard, delivering none', () => {
    const m = machine([0xf40a, 0x1202], 'chip8', {}, 10)
    m.frame()
    m.press(2)
    m.releaseAll()
    m.release(2)
    expect(m.waiting).toBe(true)
    expect(m.state.keys).toBe(0)
  })

  it('records the keys a program asks about', () => {
    // v0 := 4, if v0 -key then (skip), v0 := 6, if v0 key then
    const m = steps(machine([0x6004, 0xe09e, 0x6006, 0xe0a1]), 4)
    expect(m.state.sensed).toBe((1 << 4) | (1 << 6))
  })

  it('ignores keys that are not on the keypad', () => {
    const m = machine([])
    m.press(16)
    m.press(-1)
    m.press(1.5)
    expect(m.state.keys).toBe(0)
  })

  it('skips over XO-CHIP’s two-word F000 NNNN', () => {
    // v0 := 1, if v0 != 1 then (skips) i := long 0x1234, v1 := 9
    const m = steps(machine([0x6001, 0x3001, 0xf000, 0x1234, 0x6109], 'xochip'), 3)
    expect(m.state.v[1]).toBe(9)
    expect(m.state.i).toBe(0)
    const l = steps(machine([0xf000, 0xabcd], 'xochip'), 1)
    expect(l.state.i).toBe(0xabcd)
    expect(l.state.pc).toBe(0x204)
  })

  it('keeps XO-CHIP’s audio pattern and pitch', () => {
    const m = steps(machine([0xa208, 0xf002, 0x6070, 0xf03a, 0x0102, 0x0304], 'xochip'), 4)
    expect([...m.state.pattern.subarray(0, 4)]).toEqual([1, 2, 3, 4])
    expect(m.state.pitch).toBe(0x70)
  })
})

describe('stopping', () => {
  it('stops with a fault that says where, and runs no further', () => {
    const m = steps(machine([0x6001, 0x0123, 0x6002]), 3)
    expect(m.running).toBe(false)
    expect(m.state.halt).toEqual({ reason: 'illegal', pc: 0x202, op: 0x0123 })
    expect(m.state.v[0]).toBe(1)
  })

  it.each([
    [0x5121, 'a 5XY with a stray last nibble'],
    [0x9121, 'a 9XY with a stray last nibble'],
    [0x8128, 'an unknown 8XY'],
    [0xe1ff, 'an unknown EX'],
    [0xf1ff, 'an unknown FX'],
  ])('calls %s illegal (%s)', (op) => {
    expect(steps(machine([op]), 1).state.halt?.reason).toBe('illegal')
  })

  it('overflows past sixteen calls and underflows on a return with none', () => {
    const deep = machine([0x2200])
    for (let k = 0; k < 17; k++) deep.step()
    expect(deep.state.halt?.reason).toBe('stack-overflow')
    expect(steps(machine([0x00ee]), 1).state.halt?.reason).toBe('stack-underflow')
  })

  it('ends on 00FD and on running into empty memory, as Octo does', () => {
    expect(steps(machine([0x00fd], 'schip'), 1).state.halt?.reason).toBe('exit')
    expect(steps(machine([0x6001]), 2).state.halt?.reason).toBe('exit')
  })

  it('runs SUPER-CHIP instructions on a program marked CHIP-8, as Octo does', () => {
    const m = steps(machine([0x00ff, 0x6001], 'chip8'), 2)
    expect(m.running).toBe(true)
    expect(m.state.hires).toBe(true)
  })

  it('keeps the flags of FX75 for FX85', () => {
    const m = steps(machine([0x6007, 0x6109, 0xf175, 0x6000, 0x6100, 0xf185], 'schip'), 6)
    expect([m.state.v[0], m.state.v[1]]).toEqual([7, 9])
  })
})

describe('found in review (2026-09-30)', () => {
  it('takes a key value past F as a key that is up, as Octo does', () => {
    // v0 := 0x1F; if v0 -key then (skip when not pressed): pad F held must not count.
    const m = machine([0x601f, 0xe0a1, 0x6101, 0x6202])
    m.press(0xf)
    steps(m, 3)
    expect(m.state.v[1]).toBe(0)
    expect(m.state.sensed & (1 << 0xf)).toBe(0)
  })

  it('runs a scroll of nothing (00C0, 00D0) as no move, not a halt', () => {
    const m = machine([0x00c0, 0x00d0, 0x6001], 'xochip')
    steps(m, 3)
    expect(m.state.halt).toBeNull()
    expect(m.state.v[0]).toBe(1)
  })

  it('scrolls in place the same as by a copy, every way and on one plane only', () => {
    const naive = (
      pixels: Uint8Array,
      w: number,
      h: number,
      dx: number,
      dy: number,
      mask: number,
    ) => {
      const out = pixels.slice()
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const fx = x - dx
          const fy = y - dy
          const inside = fx >= 0 && fx < w && fy >= 0 && fy < h
          const value = inside ? (pixels[fy * w + fx] ?? 0) & mask : 0
          out[y * w + x] = ((pixels[y * w + x] ?? 0) & ~mask) | value
        }
      return out
    }
    for (const [op, dx, dy] of [
      [0x00c3, 0, 3],
      [0x00d2, 0, -2],
      [0x00fb, 4, 0],
      [0x00fc, -4, 0],
    ] as const) {
      // Hires, plane 1 selected; a noisy picture on both planes.
      const m = machine([0x00ff, 0xf101, op], 'xochip')
      steps(m, 2)
      const s = m.state
      for (let k = 0; k < 128 * 64; k++) s.pixels[k] = (k * 7 + (k >> 5)) & 3
      const expected = naive(s.pixels.slice(0, 128 * 64), 128, 64, dx, dy, 1)
      steps(m, 1)
      expect(Array.from(s.pixels.subarray(0, 128 * 64))).toEqual(Array.from(expected))
    }
  })

  it('keeps a machine whose program counter ran past the end of memory', () => {
    // jump0 with v0 = 0xFF from 0xF10 lands past 4 KB: the machine still runs, and restores.
    const m = machine([0x60ff, 0xbf10])
    steps(m, 2)
    expect(m.state.pc).toBeGreaterThanOrEqual(0x1000)
    const again = Chip8.restore(m.snapshot())
    expect(again?.state.pc).toBe(m.state.pc)
  })
})
