import { assemble, romImage } from '@shared/elec16/asm'
import { REG_NAMES } from '@shared/elec16/isa'
import { Elec16 } from '@shared/elec16/machine'
import { MODEL_IDS, MODELS, type ModelId, VRAM } from '@shared/elec16/map'
import { decodeSnapshot, SNAPSHOT_MAX_SIZE } from '@shared/elec16/snapshot'
import { IRQ } from '@shared/elec16/state'
import {
  FRAME_HZ,
  VCTRL_ON,
  VIDEO_PAGE_SIZE,
  VIDEO_REG,
  VIDEO_SIZE,
  VSTAT_VBLANK,
} from '@shared/elec16/video'
import { describe, expect, it } from 'vitest'

/**
 * PLAY-320's video as a program sees it (docs/elec16-play.md section 4, G2): 64 KB of video
 * memory through the E000 window, the registers at F800, VBLANK sixty times a second on line
 * 5 - and the other models without any of it, as they were.
 */

const FRAME_MS = 1000 / FRAME_HZ

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

const video = (m: Elec16) => {
  const v = m.state.video
  if (v === null) throw new Error('no video')
  return v
}

/** Every model but PLAY-320: the pocket ROM's, which must stay as they were. */
const POCKETS = MODEL_IDS.filter((id) => MODELS[id].rom === 'pocket')

describe('the video memory', () => {
  it('is seen 4 KB at a time in the window, the page VPAGE says', () => {
    const m = boot(`
      li t0, ${VIDEO_REG.page}
      li t1, 0xe000
      li t2, 0x1111
      sw t2, 0(t1)
      li t3, 15
      sw t3, 0(t0)
      li t2, 0x2222
      sw t2, 0xffe(t1)
      lw a0, 0(t1)
      sw zero, 0(t0)
      lw a1, 0(t1)
      lw a2, 0(t0)
      ebreak`)
    const r = finish(m)
    expect([r.a0, r.a1, r.a2]).toEqual([0, 0x1111, 0])
    const mem = video(m).mem
    expect([mem[0], mem[1]]).toEqual([0x11, 0x11])
    expect([mem[15 * VIDEO_PAGE_SIZE + 0xffe], mem[VIDEO_SIZE - 1]]).toEqual([0x22, 0x22])
  })

  it('leaves F000-F7FF and the rest of the register block reading 0', () => {
    const m = boot('ebreak')
    for (const a of [0xf000, 0xf7fe, 0xf808, 0xf8fe, 0xf900, 0xfefe]) {
      expect(m.bus.write16(a, 0xffff)).toBe(true)
      expect(m.bus.read16(a), a.toString(16)).toBe(0)
    }
    expect(video(m).mem.every((b) => b === 0)).toBe(true)
  })

  it('counts a change to what is shown, only when one is made', () => {
    const m = boot('ebreak')
    const before = m.screenRevision
    m.bus.write8(VRAM + 5, 7)
    m.bus.write8(VRAM + 5, 7)
    expect(m.screenRevision).toBe(before + 1)
    m.bus.write16(VIDEO_REG.ctrl, 0)
    m.bus.write16(VIDEO_REG.ctrl, 0)
    expect(m.screenRevision).toBe(before + 2)
    // Turning the page shows nothing new: what is drawn comes from the whole memory.
    m.bus.write16(VIDEO_REG.page, 3)
    expect(m.screenRevision).toBe(before + 2)
  })
})

describe('the video registers', () => {
  it('hold the display switch and mode in three bits and the page in four', () => {
    const m = boot('ebreak')
    expect(m.bus.read16(VIDEO_REG.ctrl)).toBe(VCTRL_ON)
    m.bus.write16(VIDEO_REG.ctrl, 0xffff)
    expect(m.bus.read16(VIDEO_REG.ctrl)).toBe(7)
    m.bus.write16(VIDEO_REG.page, 0x13)
    expect(m.bus.read16(VIDEO_REG.page)).toBe(3)
    // A byte at the odd address is ignored, as for every register.
    m.bus.write8(VIDEO_REG.page + 1, 9)
    expect(m.bus.read16(VIDEO_REG.page)).toBe(3)
    m.bus.write8(VIDEO_REG.page, 5)
    expect(m.bus.read8(VIDEO_REG.page)).toBe(5)
  })

  it('raise VBLANK sixty times a second of the time given, count frames, and let go when told', () => {
    const m = boot('ebreak')
    m.advance(FRAME_MS / 2)
    expect(m.bus.read16(VIDEO_REG.stat)).toBe(0)
    m.advance(FRAME_MS / 2 + 0.01)
    expect(m.bus.read16(VIDEO_REG.stat)).toBe(VSTAT_VBLANK)
    expect(m.bus.read16(VIDEO_REG.frame)).toBe(1)
    // Reading does not clear it; writing 0 does not either.
    m.bus.write16(VIDEO_REG.stat, 0)
    expect(m.bus.read16(VIDEO_REG.stat)).toBe(VSTAT_VBLANK)
    m.bus.write16(VIDEO_REG.stat, VSTAT_VBLANK)
    expect(m.bus.read16(VIDEO_REG.stat)).toBe(0)
    m.advance(1000)
    expect(m.bus.read16(VIDEO_REG.frame)).toBe(1 + FRAME_HZ)
    video(m).frame = 0xffff
    m.advance(FRAME_MS + 0.01)
    expect(m.bus.read16(VIDEO_REG.frame)).toBe(0)
  })

  it('wake a program waiting in WFI for VBLANK, and say how long it may sleep', () => {
    const m = boot(`
      li t0, ${1 << IRQ.vblank}
      csrw mie, t0
      csrr a1, mie
      li t1, ${VIDEO_REG.stat}
      li t2, 3
    wait:
      wfi
      li t3, ${VSTAT_VBLANK}
      sw t3, 0(t1)
      addi a0, a0, 1
      blt a0, t2, wait
      ebreak`)
    const asleep = m.run(1_000_000)
    expect(asleep.sleeping?.key).toBe(false)
    expect(asleep.sleeping?.timerMs).toBeCloseTo(FRAME_MS, 6)
    m.advance(FRAME_MS * 0.25)
    expect(m.run(1_000_000).sleeping?.timerMs).toBeCloseTo(FRAME_MS * 0.75, 6)
    for (let k = 0; k < 2; k++) {
      m.advance(FRAME_MS)
      expect(m.run(1_000_000).sleeping).not.toBeNull()
    }
    m.advance(FRAME_MS)
    const r = finish(m)
    expect([r.a0, r.a1]).toEqual([3, 1 << IRQ.vblank])
  })

  it('take VBLANK as an interrupt, on line 5', () => {
    const m = boot(`
      la t0, handler
      csrw mtvec, t0
      li t0, ${1 << IRQ.vblank}
      csrw mie, t0
      csrsi mstatus, 8
    spin:
      beqz a0, spin
      csrw mtvec, zero
      ebreak
    handler:
      csrr a1, mcause
      li a0, 1
      li t1, ${VIDEO_REG.stat}
      li t2, ${VSTAT_VBLANK}
      sw t2, 0(t1)
      mret`)
    m.run(10_000)
    m.advance(FRAME_MS + 0.01)
    const r = finish(m)
    expect(r.a1).toBe(0x8000 | IRQ.vblank)
  })

  it('come back to the display on, page 0 and no VBLANK at a reset, the memory kept', () => {
    const m = boot('ebreak')
    m.bus.write16(VIDEO_REG.ctrl, 0)
    m.bus.write16(VIDEO_REG.page, 9)
    m.bus.write8(VRAM, 0x42)
    m.advance(FRAME_MS * 2)
    m.reset()
    const v = video(m)
    expect([v.ctrl, v.page, v.pending]).toEqual([VCTRL_ON, 0, false])
    expect(v.mem[9 * VIDEO_PAGE_SIZE]).toBe(0x42)
  })
})

describe('a snapshot with video', () => {
  it('brings back the video memory and every register', () => {
    const m = boot('ebreak')
    finish(m)
    const v = video(m)
    v.mem[0] = 1
    v.mem[VIDEO_SIZE - 1] = 2
    v.ctrl = 3
    v.page = 11
    m.advance(FRAME_MS * 7.5)
    const bytes = m.snapshot()
    expect(bytes.length).toBeLessThanOrEqual(SNAPSHOT_MAX_SIZE)
    const back = decodeSnapshot(bytes)?.video
    expect(back).toEqual({ ...v, mem: expect.any(Uint8Array) })
    expect([back?.mem[0], back?.mem[VIDEO_SIZE - 1]]).toEqual([1, 2])
  })

  it('is not ours with registers out of range, or video the model has not', () => {
    const m = boot('ebreak')
    finish(m)
    const good = m.snapshot()
    expect(decodeSnapshot(good)).not.toBeNull()
    // The video byte, then CTRL and PAGE, after the count of extended RAM banks.
    const cause = m.state.halt?.cause.length ?? 0
    const at = good.length - (0x8000 + 0x1800 + 0x10000) - cause - 13 - 1
    expect([good[at], good[at - 1]]).toEqual([1, 0])
    const broken = (k: number, value: number) => {
      const b = good.slice()
      b[k] = value
      return decodeSnapshot(b)
    }
    expect(broken(at, 0)).toBeNull()
    expect(broken(at + 1, 8)).toBeNull()
    expect(broken(at + 2, 16)).toBeNull()
  })
})

describe('the other models, without video', () => {
  it('have none, raise no VBLANK and keep mie to the five lines they had', () => {
    for (const id of POCKETS) {
      const m = boot(
        `
        li t0, 0x3f
        csrw mie, t0
        csrr a0, mie
        ebreak`,
        id,
      )
      const r = finish(m)
      expect(m.state.video, id).toBeNull()
      expect(r.a0, id).toBe(0x1f)
      m.advance(1000)
      expect(m.bus.read16(VIDEO_REG.stat), id).toBe(0)
      expect(m.bus.read16(VIDEO_REG.frame), id).toBe(0)
    }
  })
})
