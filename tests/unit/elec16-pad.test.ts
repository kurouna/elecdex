import { assemble, romImage } from '@shared/elec16/asm'
import { REG_NAMES } from '@shared/elec16/isa'
import { Elec16 } from '@shared/elec16/machine'
import { MODEL_IDS, MODELS, type ModelId } from '@shared/elec16/map'
import { PAD_ALL, PAD_BUTTONS, PAD_REG, padBit } from '@shared/elec16/pad'
import { decodeSnapshot } from '@shared/elec16/snapshot'
import { IRQ } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'

/**
 * PLAY-320's pad as a program sees it (docs/elec16-play.md section 6, G3): PAD holds what is
 * pressed now, PADHIT what went down or up since it was last cleared, which keeps interrupt
 * line 6 up - and every other model without any of it, as it was.
 */

const POCKETS = MODEL_IDS.filter((id) => !MODELS[id].pad)

function boot(src: string, model: ModelId = 'play-320'): Elec16 {
  const out = assemble(`.org 0x8000\n${src}`)
  expect(out.errors).toEqual([])
  return Elec16.boot(romImage(out), model)
}

function finish(m: Elec16): Record<string, number> {
  const result = m.run(1_000_000)
  expect(result.halted?.cause, `stopped at ${result.halted?.pc.toString(16)}`).toBe('breakpoint')
  return Object.fromEntries(REG_NAMES.map((name, k) => [name, m.state.regs[k] ?? 0]))
}

const A = padBit('a')
const START = padBit('start')
const UP = padBit('up')

describe('the pad buttons', () => {
  it('are twelve bits in the order the spec gives, and only PLAY-320 has them', () => {
    expect(PAD_BUTTONS).toEqual([
      'up',
      'down',
      'left',
      'right',
      'a',
      'b',
      'x',
      'y',
      'l',
      'r',
      'start',
      'select',
    ])
    expect(PAD_ALL).toBe(0xfff)
    expect([padBit('up'), padBit('a'), padBit('select')]).toEqual([1, 0x10, 0x800])
    for (const id of MODEL_IDS) expect(MODELS[id].pad, id).toBe(id === 'play-320')
    expect(PAD_REG).toEqual({ held: 0xf810, hit: 0xf812 })
  })
})

describe('PAD and PADHIT', () => {
  it('say what is held now, and what went down or up since PADHIT was cleared', () => {
    const m = boot('ebreak')
    m.pad(A | START)
    expect(m.bus.read16(PAD_REG.held)).toBe(A | START)
    expect(m.bus.read16(PAD_REG.hit)).toBe(A | START)
    m.bus.write16(PAD_REG.hit, A | START)
    expect(m.bus.read16(PAD_REG.hit)).toBe(0)
    // START let go, UP pressed: both are news; A, still held, is not.
    m.pad(A | UP)
    expect(m.bus.read16(PAD_REG.held)).toBe(A | UP)
    expect(m.bus.read16(PAD_REG.hit)).toBe(START | UP)
  })

  it('clears only the bits written as 1, a word reaching the high ones', () => {
    const m = boot('ebreak')
    m.pad(PAD_ALL)
    m.bus.write16(PAD_REG.hit, START | A)
    expect(m.bus.read16(PAD_REG.hit)).toBe(PAD_ALL & ~(START | A))
    // A byte write is the register's low byte with the high one zero: it reaches no high bit.
    m.bus.write8(PAD_REG.hit, 0xff)
    expect(m.bus.read16(PAD_REG.hit)).toBe(0xf00 & ~START)
    m.bus.write8(PAD_REG.hit + 1, 0xff)
    expect(m.bus.read16(PAD_REG.hit)).toBe(0xf00 & ~START)
    m.bus.write16(PAD_REG.hit, 0xffff)
    expect(m.bus.read16(PAD_REG.hit)).toBe(0)
  })

  it('cannot be written as PAD, and holds no thirteenth button', () => {
    const m = boot('ebreak')
    m.bus.write16(PAD_REG.held, 0xffff)
    expect(m.bus.read16(PAD_REG.held)).toBe(0)
    m.pad(0xffff)
    expect(m.bus.read16(PAD_REG.held)).toBe(PAD_ALL)
    expect(m.bus.read16(PAD_REG.hit)).toBe(PAD_ALL)
  })

  it('read by bytes as a program reads them, without taking anything', () => {
    const m = boot('ebreak')
    m.pad(START | A)
    expect([m.bus.read8(PAD_REG.held), m.bus.read8(PAD_REG.held + 1)]).toEqual([A, START >> 8])
    expect(m.bus.peek(PAD_REG.hit)).toBe(A)
    expect(m.bus.read16(PAD_REG.hit)).toBe(START | A)
  })
})

describe('the PAD line', () => {
  it('wakes a program waiting in WFI with it enabled, and reads the press', () => {
    const m = boot(`
      li t0, ${1 << IRQ.pad}
      csrw mie, t0
      csrr a1, mie
      wfi
      li t1, ${PAD_REG.held}
      lw a0, 0(t1)
      lw a2, 2(t1)
      ebreak`)
    const asleep = m.run(1_000_000)
    expect(asleep.sleeping).toEqual({ key: false, pad: true, timerMs: null })
    // Asleep it stays while nothing is pressed; time passing does not wake it.
    m.advance(500)
    expect(m.run(1_000_000).sleeping).not.toBeNull()
    m.pad(START)
    const r = finish(m)
    expect([r.a0, r.a1, r.a2]).toEqual([START, 1 << IRQ.pad, START])
  })

  it('does not wake a program that has not enabled it', () => {
    const m = boot(`
      li t0, ${1 << IRQ.timer}
      csrw mie, t0
      wfi
      ebreak`)
    expect(m.run(1_000_000).sleeping).not.toBeNull()
    m.pad(A)
    expect(m.run(1_000_000).sleeping).not.toBeNull()
  })

  it('is taken as an interrupt, on line 6, until PADHIT is cleared', () => {
    const m = boot(`
      la t0, handler
      csrw mtvec, t0
      li t0, ${1 << IRQ.pad}
      csrw mie, t0
      csrsi mstatus, 8
    spin:
      beqz a0, spin
      csrw mtvec, zero
      ebreak
    handler:
      csrr a1, mcause
      addi a0, a0, 1
      li t1, ${PAD_REG.hit}
      li t2, 0xfff
      sw t2, 0(t1)
      mret`)
    m.run(10_000)
    m.pad(A)
    const r = finish(m)
    // Taken once: the handler cleared PADHIT, so the line went down.
    expect([r.a0, r.a1]).toEqual([1, 0x8000 | IRQ.pad])
  })

  it('goes down at a reset (the buttons stay as they are held), and all go up on releaseAll', () => {
    const m = boot('ebreak')
    m.pad(A)
    m.reset()
    expect([m.bus.read16(PAD_REG.held), m.bus.read16(PAD_REG.hit)]).toEqual([A, 0])
    m.releaseAll()
    expect([m.bus.read16(PAD_REG.held), m.bus.read16(PAD_REG.hit)]).toEqual([0, A])
  })
})

describe('the pad and the rest of the machine', () => {
  it("is a person's action for LINK when a button goes down, not when one goes up", () => {
    const m = boot('ebreak')
    m.state.link.vouched = false
    m.pad(0)
    expect(m.state.link.vouched).toBe(false)
    m.pad(A)
    expect(m.state.link.vouched).toBe(true)
    m.state.link.vouched = false
    m.pad(0)
    expect(m.state.link.vouched).toBe(false)
  })

  it('is not kept in a snapshot: a machine comes back with every button up', () => {
    const m = boot('ebreak')
    finish(m)
    // Already vouched for, as a press would make it: only the pad could differ.
    m.vouch()
    const before = m.snapshot()
    m.pad(A | START)
    expect(m.snapshot()).toEqual(before)
    const back = decodeSnapshot(m.snapshot())
    expect(back?.pad).toEqual({ held: 0, hit: 0 })
  })
})

describe('the other models, without a pad', () => {
  it('have none: its registers read 0, a press does nothing, and mie keeps its five lines', () => {
    for (const id of POCKETS) {
      const m = boot(
        `
        li t0, 0x7f
        csrw mie, t0
        csrr a0, mie
        ebreak`,
        id,
      )
      const r = finish(m)
      expect(m.state.pad, id).toBeNull()
      expect(r.a0, id).toBe(0x1f)
      m.pad(PAD_ALL)
      m.bus.write16(PAD_REG.hit, 0xffff)
      expect([m.bus.read16(PAD_REG.held), m.bus.read16(PAD_REG.hit)], id).toEqual([0, 0])
    }
  })
})
