import { assemble, ramImage, romImage } from '@shared/elec16/asm'
import { REG } from '@shared/elec16/bus'
import { REG_NAMES } from '@shared/elec16/isa'
import { Elec16 } from '@shared/elec16/machine'
import {
  BANK_COUNT,
  BANK_SIZE,
  bankTaken,
  MODEL_IDS,
  MODELS,
  type ModelId,
  XRAM_BANK,
  XRAM_MAX,
  XRAM_SIZES_KB,
  xramBytes,
} from '@shared/elec16/map'
import { decodeSnapshot, SNAPSHOT_MAX_SIZE } from '@shared/elec16/snapshot'
import { createState } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'
import { olderSnapshot } from './elec16-helpers'

/**
 * PLAY-320's extended RAM (docs/elec16-play.md section 3, G1): 8 KB banks in the bank window
 * from bank 0x20, as much as the unit chose, kept in the snapshot - and every other model
 * exactly as it was (section 1: the new parts are PLAY-320's alone).
 */

const KB = 1024

function boot(src: string, model: ModelId = 'play-320', xram = XRAM_MAX): Elec16 {
  const out = assemble(`.org 0x8000\n${src}`)
  expect(out.errors).toEqual([])
  return Elec16.boot(romImage(out), model, undefined, xram)
}

function finish(m: Elec16): Record<string, number> {
  const result = m.run(1_000_000)
  expect(result.halted?.cause, `stopped at ${result.halted?.pc.toString(16)}`).toBe('breakpoint')
  return Object.fromEntries(REG_NAMES.map((name, k) => [name, m.state.regs[k] ?? 0]))
}

/** Lines that select `bank` in the window (t0 keeps the register's address). */
const select = (bank: number) => `li t0, ${REG.bank}\nli t1, ${bank}\nsw t1, 0(t0)\n`

/** Lines that store `bytes` at `at`, a word at a time, as a program would write code. */
function storeWords(bytes: Uint8Array, at: number): string {
  const lines = [`li t2, ${at}`]
  for (let k = 0; k < bytes.length; k += 2) {
    lines.push(`li t1, ${(bytes[k] ?? 0) | ((bytes[k + 1] ?? 0) << 8)}`, `sw t1, ${k}(t2)`)
  }
  return `${lines.join('\n')}\n`
}

/** Code that runs wherever it is put, assembled in RAM's code area. */
const code = (src: string): Uint8Array => {
  const out = assemble(`.org 0x7000\n${src}`)
  expect(out.errors).toEqual([])
  return ramImage(out, 0x7000)
}

/** Every model but PLAY-320: the pocket ROM's, which must stay as they were. */
const POCKETS = MODEL_IDS.filter((id) => MODELS[id].rom === 'pocket')

describe('extended RAM', () => {
  it('is a model property only PLAY-320 has, up to the most there can be', () => {
    expect(MODEL_IDS.indexOf('play-320')).toBe(4)
    for (const id of MODEL_IDS) {
      expect(MODELS[id].xramMax).toBe(id === 'play-320' ? XRAM_MAX : 0)
    }
    expect(XRAM_MAX).toBe(512 * KB)
    // Its banks run from 0x20 to 0x5F, clear of the ROM's.
    expect(XRAM_BANK).toBeGreaterThanOrEqual(BANK_COUNT)
    expect(XRAM_BANK + XRAM_MAX / BANK_SIZE - 1).toBe(0x5f)
    for (const kb of XRAM_SIZES_KB) {
      expect(xramBytes(MODELS['play-320'], kb)).toBe(kb * KB)
      expect(xramBytes(MODELS['pocket-48'], kb)).toBe(0)
    }
  })

  it('shows each bank in the window, keeps what each holds, and says which is shown', () => {
    const r = finish(
      boot(`
        ${select(0x20)}
        li t2, 0xc000
        li t1, 0x1111
        sw t1, 0(t2)
        ${select(0x5f)}
        li t1, 0x2222
        sw t1, 0x1ffe(t2)
        ${select(0x20)}
        lw a0, 0(t2)
        ${select(0x5f)}
        lw a1, 0x1ffe(t2)
        lw a2, 0(t0)
        li t3, ${REG.model}
        lw a3, 0(t3)
        ebreak`),
    )
    expect([r.a0, r.a1, r.a2, r.a3]).toEqual([0x1111, 0x2222, 0x5f, 4])
  })

  it('lands where a bank says: bank 0x21 is the second 8 KB', () => {
    const m = boot(`
      ${select(0x21)}
      li t2, 0xc000
      li t1, 0xabcd
      sw t1, 2(t2)
      ebreak`)
    finish(m)
    expect([m.state.xram[BANK_SIZE + 2], m.state.xram[BANK_SIZE + 3]]).toEqual([0xcd, 0xab])
  })

  it('does not take a bank past what the unit chose, nor between the ROM and it', () => {
    for (const kb of [0, 128, 256] as const) {
      const banks = (kb * KB) / BANK_SIZE
      const r = finish(
        boot(
          `
          ${select(3)}
          li t1, ${XRAM_BANK + banks}
          sw t1, 0(t0)
          lw a0, 0(t0)
          li t1, ${BANK_COUNT}
          sw t1, 0(t0)
          lw a1, 0(t0)
          li t1, ${XRAM_BANK - 1}
          sw t1, 0(t0)
          lw a2, 0(t0)
          li t1, ${XRAM_BANK + banks - 1}
          sw t1, 0(t0)
          lw a3, 0(t0)
          ebreak`,
          'play-320',
          kb * KB,
        ),
      )
      // With none, the last bank there is would be 0x1F: not taken either.
      expect([r.a0, r.a1, r.a2, r.a3]).toEqual([3, 3, 3, kb === 0 ? 3 : XRAM_BANK + banks - 1])
    }
  })

  it('still refuses a write to a ROM bank in the window', () => {
    const m = boot(`
      ${select(1)}
      li t2, 0xc000
      sw t1, 0(t2)
      ebreak`)
    expect(m.run(1_000_000).halted?.cause).toBe('write to ROM')
  })

  it('runs code written into it, and runs it again as it is after it is written over', () => {
    const first = code('li a0, 100\nret')
    const second = code('li a0, 200\nret')
    const r = finish(
      boot(`
        ${select(0x22)}
        ${storeWords(first, 0xc000)}
        call 0xc000
        mv s0, a0
        ${storeWords(second, 0xc000)}
        call 0xc000
        ebreak`),
    )
    expect([r.s0, r.a0]).toEqual([100, 200])
  })

  it('runs the code of the bank shown now, after a switch between two of its banks', () => {
    const m = boot(`
      ${select(0x30)}
      call 0xc000
      mv s0, a0
      ${select(0x31)}
      call 0xc000
      ebreak`)
    m.state.xram.set(code('li a0, 7\nret'), (0x30 - XRAM_BANK) * BANK_SIZE)
    m.state.xram.set(code('li a0, 9\nret'), (0x31 - XRAM_BANK) * BANK_SIZE)
    const r = finish(m)
    expect([r.s0, r.a0]).toEqual([7, 9])
  })

  it('is battery-backed like RAM: a reset keeps it and shows bank 0', () => {
    const m = boot(`${select(0x40)}\nebreak`)
    finish(m)
    m.state.xram[0x20 * BANK_SIZE] = 0x5a
    m.reset()
    expect(m.state.bank).toBe(0)
    expect(m.state.xram[0x20 * BANK_SIZE]).toBe(0x5a)
  })
})

describe('the other models, as they were', () => {
  it('cannot be made with extended RAM', () => {
    for (const id of POCKETS) {
      expect(() => createState(id, BANK_SIZE)).toThrow(RangeError)
      expect(createState(id).xram.length).toBe(0)
    }
    // Nor PLAY-320 with more than it can have, or part of a bank.
    expect(() => createState('play-320', XRAM_MAX + BANK_SIZE)).toThrow(RangeError)
    expect(() => createState('play-320', BANK_SIZE / 2)).toThrow(RangeError)
  })

  it('ignore every bank from 0x20 up, and the window shows the ROM bank it had', () => {
    for (const id of POCKETS) {
      const out = assemble(`
        .org 0x8000
        ${select(2)}
        li t1, ${XRAM_BANK}
        sw t1, 0(t0)
        lw a0, 0(t0)
        li t1, 0x5f
        sw t1, 0(t0)
        lw a1, 0(t0)
        li t2, 0xc000
        lw a2, 0(t2)
        ebreak
        .bank 2
        .org 0xc000
        .word 0x1234`)
      expect(out.errors).toEqual([])
      const m = Elec16.boot(romImage(out), id)
      const r = finish(m)
      expect([r.a0, r.a1, r.a2], id).toEqual([2, 2, 0x1234])
      expect(bankTaken(XRAM_BANK, m.state.xram.length)).toBe(false)
    }
  })

  it('read 0 from the reserved block and nothing changes when it is written', () => {
    for (const id of POCKETS) {
      const m = boot('ebreak', id, 0)
      for (const a of [0xf800, 0xfa00, 0xfefe]) {
        expect(m.bus.write16(a, 0xffff)).toBe(true)
        expect(m.bus.read16(a), `${id} ${a.toString(16)}`).toBe(0)
      }
    }
  })

  it('keep a snapshot of the same bytes as version 2, but for the wider bank, no banks and no video', () => {
    for (const id of POCKETS) {
      const m = boot('ebreak', id, 0)
      finish(m)
      const now = m.snapshot()
      for (const [version, fewer] of [
        [3, 1],
        [2, 3],
        [1, 3 + 14],
      ] as const) {
        const older = olderSnapshot(now, version)
        expect(now.length - older.length).toBe(fewer)
        expect(decodeSnapshot(older), `${id} ${version}`).toEqual(decodeSnapshot(now))
      }
    }
  })
})

describe('a snapshot with extended RAM', () => {
  it('brings back every bank it has and the one shown', () => {
    const m = boot(`${select(0x2f)}\nebreak`, 'play-320', 128 * KB)
    finish(m)
    m.state.xram[0] = 1
    m.state.xram[128 * KB - 1] = 2
    const bytes = m.snapshot()
    expect(bytes.length).toBeLessThanOrEqual(SNAPSHOT_MAX_SIZE)
    const back = decodeSnapshot(bytes)
    expect(back?.xram.length).toBe(128 * KB)
    expect([back?.xram[0], back?.xram[128 * KB - 1], back?.bank]).toEqual([1, 2, 0x2f])
  })

  it('keeps the most there can be within the size main allows', () => {
    const m = boot('ebreak')
    finish(m)
    expect(m.snapshot().length).toBeLessThanOrEqual(SNAPSHOT_MAX_SIZE)
  })

  it('is not ours with more than the model can have, a bank it lacks, or bytes missing', () => {
    const m = boot(`${select(0x21)}\nebreak`, 'play-320', 2 * BANK_SIZE)
    finish(m)
    const good = m.snapshot()
    expect(decodeSnapshot(good)).not.toBeNull()
    // The count follows LINK, then the video byte and video's registers, the halt's cause
    // ("breakpoint"), RAM, VRAM, the banks and the video memory.
    const cause = m.state.halt?.cause.length ?? 0
    const countAt = good.length - (0x8000 + 0x1800 + 2 * BANK_SIZE + 0x10000) - cause - 13 - 2
    expect(good[countAt]).toBe(2)
    // One bank fewer: the bank shown is not there, and a bank's bytes are left over.
    const fewer = good.slice()
    fewer[countAt] = 1
    expect(decodeSnapshot(fewer)).toBeNull()
    expect(decodeSnapshot(good.subarray(0, good.length - 1))).toBeNull()
    // The model said to be one without extended RAM.
    const pocket = good.slice()
    pocket[5] = MODEL_IDS.indexOf('pocket-48')
    expect(decodeSnapshot(pocket)).toBeNull()
    // More banks than PLAY-320 can have.
    const many = good.slice()
    many[countAt] = XRAM_MAX / BANK_SIZE + 1
    expect(decodeSnapshot(many)).toBeNull()
  })
})
