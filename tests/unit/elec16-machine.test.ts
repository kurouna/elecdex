import { assemble, ramImage, romImage } from '@shared/elec16/asm'
import { REG } from '@shared/elec16/bus'
import { encode32, REG_NAMES } from '@shared/elec16/isa'
import { Elec16 } from '@shared/elec16/machine'
import type { ModelId } from '@shared/elec16/map'
import { describe, expect, it } from 'vitest'

/**
 * The ELEC-16 runs its instructions as docs/elec16.md section 4 says. Each program is
 * assembled into the ROM at the reset vector and ends with EBREAK, which with no trap handler
 * stops the machine ("breakpoint") - so a test reads its registers where it stopped.
 */

function boot(src: string, model?: ModelId): Elec16 {
  const out = assemble(`.org 0x8000\n${src}`)
  expect(out.errors).toEqual([])
  return Elec16.boot(romImage(out), model)
}

/** Runs to the end; the registers by ABI name. */
function finish(m: Elec16, cycles = 1_000_000): Record<string, number> {
  const result = m.run(cycles)
  expect(result.halted?.cause, `stopped at ${result.halted?.pc.toString(16)}`).toBe('breakpoint')
  return Object.fromEntries(REG_NAMES.map((name, k) => [name, m.state.regs[k] ?? 0]))
}

const run = (src: string) => finish(boot(src))

/** One instruction's bytes, as the assembler writes it (no shortening). */
function bytesAt(line: string): Uint8Array {
  const out = assemble(`.org 0x8000\n.option nocompress\n${line}`)
  expect(out.errors).toEqual([])
  return out.chunks[0]?.bytes ?? new Uint8Array()
}
const s16 = (v: number) => (v << 16) >> 16

describe('arithmetic', () => {
  it('wraps at 16 bits and keeps x0 at zero', () => {
    const r = run(`
      li a0, 0xffff
      addi a0, a0, 1
      li a1, 0x7fff
      addi a1, a1, 1
      li zero, 5
      addi zero, zero, 3
      sub a2, zero, a1
      ebreak`)
    expect([r.a0, r.a1, r.zero, r.a2]).toEqual([0, 0x8000, 0, 0x8000])
  })

  it('compares signed and unsigned', () => {
    const r = run(`
      li t0, -1
      li t1, 1
      slt a0, t0, t1
      sltu a1, t0, t1
      slti a2, t0, 0
      sltiu a3, t1, -1
      ebreak`)
    expect([r.a0, r.a1, r.a2, r.a3]).toEqual([1, 0, 1, 1])
  })

  it('shifts logically and arithmetically by the low four bits', () => {
    const r = run(`
      li t0, 0x8001
      li t1, 17
      sll a0, t0, t1
      srl a1, t0, t1
      sra a2, t0, t1
      srai a3, t0, 15
      ebreak`)
    expect([r.a0, r.a1, r.a2, r.a3]).toEqual([0x0002, 0x4000, 0xc000, 0xffff])
  })
})

describe('multiply and divide', () => {
  it('gives the low and the high halves of a product', () => {
    const r = run(`
      li t0, -3
      li t1, 1000
      mul a0, t0, t1
      mulh a1, t0, t1
      mulhu a2, t0, t1
      mulhsu a3, t0, t1
      ebreak`)
    expect(s16(r.a0 ?? 0)).toBe(-3000)
    expect(s16(r.a1 ?? 0)).toBe(-1)
    expect(r.a2).toBe(Math.floor((0xfffd * 1000) / 65536))
    expect(s16(r.a3 ?? 0)).toBe(-1)
  })

  it('never traps: by zero, and -32768 by -1', () => {
    const r = run(`
      li t0, -7
      li t1, 2
      div a0, t0, t1
      rem a1, t0, t1
      div a2, t0, zero
      rem a3, t0, zero
      li t2, 0x8000
      li t3, -1
      div s0, t2, t3
      rem s1, t2, t3
      divu s2, t0, t1
      remu s3, t0, zero
      ebreak`)
    expect([s16(r.a0 ?? 0), s16(r.a1 ?? 0), r.a2, s16(r.a3 ?? 0)]).toEqual([-3, -1, 0xffff, -7])
    expect([r.s0, r.s1, r.s2, r.s3]).toEqual([0x8000, 0, Math.floor(0xfff9 / 2), 0xfff9])
  })
})

describe('bit manipulation', () => {
  it('counts, swaps, rotates and sets bits', () => {
    const r = run(`
      li t0, 0x00f0
      clz a0, t0
      ctz a1, t0
      cpop a2, t0
      rev8 a3, t0
      li t1, 4
      rol s0, t0, t1
      rori s1, t0, 8
      sext.b s2, t0
      bseti s3, zero, 15
      ebreak`)
    expect([r.a0, r.a1, r.a2, r.a3]).toEqual([8, 4, 4, 0xf000])
    expect([r.s0, r.s1, r.s2, r.s3]).toEqual([0x0f00, 0xf000, 0xfff0, 0x8000])
  })

  it('counts sixteen zeros in zero, and takes min and max either way', () => {
    const r = run(`
      clz a0, zero
      ctz a1, zero
      li t0, -1
      li t1, 1
      min a2, t0, t1
      minu a3, t0, t1
      bext s0, t0, t1
      andn s1, t0, t1
      ebreak`)
    expect([r.a0, r.a1, r.a2, r.a3, r.s0, r.s1]).toEqual([16, 16, 0xffff, 1, 1, 0xfffe])
  })
})

describe('memory', () => {
  it('loads bytes signed or not, and words little-endian', () => {
    const r = run(`
      li t0, 0x1234
      li t1, 0x0100
      sw t0, 0(t1)
      lb a0, 0(t1)
      lbu a1, 1(t1)
      li t2, 0x80
      sb t2, 2(t1)
      lb a2, 2(t1)
      lbu a3, 2(t1)
      ebreak`)
    expect([r.a0, r.a1, r.a2, r.a3]).toEqual([0x34, 0x12, 0xff80, 0x80])
  })

  it('stops on a misaligned word, and on a write to the ROM, with no handler to go to', () => {
    const odd = boot(`
      li t0, 0x0101
      lw a0, 0(t0)
      ebreak`)
    expect(odd.run(1000).halted).toEqual({ cause: 'misaligned load', pc: 0x8004 })
    const rom = boot(`
      li t0, 0x8000
      sw t0, 0(t0)
      ebreak`)
    expect(rom.run(1000).halted?.cause).toBe('write to ROM')
  })

  it('shows the bank the program chose in the window, and runs code from it', () => {
    const out = assemble(`
      .org 0x8000
      call 0xc000
      mv s0, a0
      li t0, ${REG.bank}
      li t1, 1
      sw t1, 0(t0)
      call 0xc000
      ebreak
      .bank 0
      .org 0xc000
      li a0, 100
      ret
      .bank 1
      .org 0xc000
      li a0, 200
      ret`)
    expect(out.errors).toEqual([])
    const m = Elec16.boot(romImage(out))
    const r = finish(m)
    // The same address again, after the switch: what the bank holds now, not what ran before.
    expect([r.s0, r.a0]).toEqual([100, 200])
  })

  it('keeps the bank it had when told to show one the ROM cannot have', () => {
    const r = run(`
      li t0, ${REG.bank}
      li t1, 2
      sw t1, 0(t0)
      li t1, 12
      sw t1, 0(t0)
      lw a0, 0(t0)
      li t1, 0xffff
      sw t1, 0(t0)
      lw a1, 0(t0)
      ebreak`)
    expect([r.a0, r.a1]).toEqual([2, 2])
  })

  it('runs a 32-bit instruction across the edge of the bank window as the bank has it now', () => {
    // LI's low half sits in the fixed ROM at 0xBFFE, its high half in the window at 0xC000.
    const low = (imm: number) => encode32('li', { rd: 4, rs1: 0, rs2: 0, imm }) & 0xffff
    const high = (imm: number) => encode32('li', { rd: 4, rs1: 0, rs2: 0, imm }) >>> 16
    expect(low(0x100)).toBe(low(0x200))
    const out = assemble(`
      .org 0x8000
      call 0xbffe
      mv s0, a0
      li t0, ${REG.bank}
      li t1, 1
      sw t1, 0(t0)
      call 0xbffe
      ebreak
      .org 0xbffe
      .word ${low(0x100)}
      .bank 0
      .org 0xc000
      .word ${high(0x100)}
      ret
      .bank 1
      .org 0xc000
      .word ${high(0x200)}
      ret`)
    expect(out.errors).toEqual([])
    const r = finish(Elec16.boot(romImage(out)))
    expect([r.s0, r.a0]).toEqual([0x100, 0x200])
  })

  it('runs a 32-bit instruction whose high half is in video memory as that memory is now', () => {
    const word = (imm: number) => encode32('li', { rd: 4, rs1: 0, rs2: 0, imm })
    const ret = ramImage(assemble('.org 0x7000\nc.jr ra'), 0x7000)
    const out = assemble(`
      .org 0x8000
      li t0, 0xe000
      li t1, ${word(0x100) >>> 16}
      sw t1, 0(t0)
      li t1, ${(ret[0] ?? 0) | ((ret[1] ?? 0) << 8)}
      sw t1, 2(t0)
      call 0xdffe
      mv s0, a0
      li t1, ${word(0x200) >>> 16}
      sw t1, 0(t0)
      call 0xdffe
      ebreak
      .bank 0
      .org 0xdffe
      .word ${word(0x100) & 0xffff}`)
    expect(out.errors).toEqual([])
    const r = finish(Elec16.boot(romImage(out)))
    expect([r.s0, r.a0]).toEqual([0x100, 0x200])
  })

  it('runs code written into RAM, and again after the code there changes', () => {
    const three = ramImage(assemble('.org 0x7000\nc.li a0, 3'), 0x7000)
    const m = boot(`
      li t0, 0x7000
      call 0x7000
      mv s0, a0
      li t1, ${(three[0] ?? 0) | ((three[1] ?? 0) << 8)}
      sw t1, 0(t0)
      call 0x7000
      ebreak`)
    // c.li a0, 7 ; c.jr ra - then the program writes c.li a0, 3 over the first.
    const code = ramImage(assemble('.org 0x7000\nc.li a0, 7\nc.jr ra'), 0x7000)
    m.state.ram.set(code, 0x7000)
    const r = finish(m)
    expect(r.s0).toBe(7)
    expect(r.a0).toBe(3)
  })
})

describe('branches, calls and cycles', () => {
  it('adds 1 to 100 in a loop, and counts the cycles the table says', () => {
    const m = boot(`
      li a0, 0
      li t0, 1
      li t1, 100
    loop:
      add a0, a0, t0
      addi t0, t0, 1
      bge t1, t0, loop
      ebreak`)
    const r = finish(m)
    expect(r.a0).toBe(5050)
    // Three set-ups, then per pass two ALU and a branch: taken 99 times (2), not once (1).
    expect(m.state.cycles).toBe(3 + 100 * 2 + 99 * 2 + 1)
  })

  it('calls and returns, and JALR jumps where its register said before writing it', () => {
    const r = run(`
      call double
      li ra, after
      jalr ra, 0(ra)
    after:
      ebreak
    double:
      li a0, 21
      add a0, a0, a0
      ret`)
    expect(r.a0).toBe(42)
  })
})

describe('traps, CSRs and sleeping', () => {
  // With a handler, EBREAK traps too: a test clears mtvec before its last EBREAK to stop.
  const handler = `
      la t0, trap
      csrw mtvec, t0`

  it('ECALL goes to the handler, which returns past it with MRET', () => {
    const r = run(`
      ${handler}
      li a0, 1
      ecall
      addi a0, a0, 10
      csrw mtvec, zero
      ebreak
    trap:
      csrr t1, mepc
      addi t1, t1, 4
      csrw mepc, t1
      csrr a1, mcause
      li a0, 5
      mret`)
    expect([r.a0, r.a1]).toEqual([15, 11])
  })

  it('a fault inside the handler halts the machine as a double fault', () => {
    const m = boot(`
      ${handler}
      ecall
      ebreak
    trap:
      .word 0, 0`)
    expect(m.run(1000).halted?.cause).toBe('double fault')
  })

  it('an unknown CSR is an illegal instruction; misa says M, B and C', () => {
    const r = run(`
      csrr a0, misa
      ebreak`)
    expect(r.a0).toBe((1 << 12) | 2 | 4)
    const m = boot(`
      csrr a0, 0x123
      ebreak`)
    expect(m.run(100).halted?.cause).toBe('illegal instruction')
  })

  it('sleeps in WFI until a key, takes the interrupt, and reads the key', () => {
    const m = boot(`
      ${handler}
      csrsi mie, 2
      csrsi mstatus, 8
    idle:
      wfi
      j idle
    trap:
      li t0, ${REG.keyData}
      lw a0, 0(t0)
      csrr a1, mcause
      csrw mtvec, zero
      ebreak`)
    const asleep = m.run(10_000)
    expect(asleep.sleeping).toEqual({ key: true, timerMs: null })
    expect(m.run(10_000).cycles).toBe(0)
    m.press(17)
    const r = finish(m)
    expect([r.a0, r.a1]).toEqual([17, 0x8000 | 1])
  })

  it('wakes from WFI without trapping when interrupts are off, and goes on', () => {
    const m = boot(`
      csrsi mie, 2
      wfi
      li a0, 9
      ebreak`)
    expect(m.run(1000).sleeping?.key).toBe(true)
    m.press(3)
    expect(finish(m).a0).toBe(9)
  })

  it('says when the timer will wake it, and wakes when host time gets there', () => {
    const m = boot(`
      ${handler}
      li t0, ${REG.timerCompare}
      li t1, 1024
      sw t1, 0(t0)
      li t0, ${REG.timerCtrl}
      li t1, 1
      sw t1, 0(t0)
      csrsi mie, 1
      csrsi mstatus, 8
      wfi
    trap:
      csrr a0, mcause
      csrw mtvec, zero
      ebreak`)
    const asleep = m.run(10_000)
    expect(asleep.sleeping?.timerMs).toBeCloseTo(1000)
    m.advance(999)
    expect(m.run(10_000).sleeping).not.toBeNull()
    m.advance(2)
    expect(finish(m).a0).toBe(0x8000)
  })

  it('an unknown CSR and an unknown word leave the first half-word of the instruction in mtval', () => {
    const csr = bytesAt('csrr a0, 0x123')
    const r = run(`
      ${handler}
      csrr a0, 0x123
      mv s0, a1
      .word 0x007f, 0
      csrw mtvec, zero
      ebreak
    trap:
      csrr a1, mtval
      csrr t1, mepc
      addi t1, t1, 4
      csrw mepc, t1
      mret`)
    expect([r.s0, r.a1]).toEqual([(csr[0] ?? 0) | ((csr[1] ?? 0) << 8), 0x007f])
  })

  it('stops when an interrupt is let in with no handler to go to', () => {
    const m = boot(`
      csrsi mie, 2
      csrsi mstatus, 8
    spin:
      j spin`)
    expect(m.run(1000).halted).toBeNull()
    m.press(5)
    expect(m.run(1000).halted?.cause).toBe('interrupt with no handler')
  })

  it('takes BRK with interrupts off, and from WFI with nothing enabled', () => {
    const m = boot(`
      ${handler}
    spin:
      j spin
    trap:
      csrr a0, mcause
      csrr s0, mepc
      csrw mtvec, zero
      ebreak`)
    m.run(1000)
    m.brk()
    const r = finish(m)
    expect(r.a0).toBe(0x8000 | 15)
    expect(r.s0).toBeGreaterThan(0x8000)
    const asleep = boot(`
      ${handler}
      wfi
    trap:
      csrr a0, mcause
      csrw mtvec, zero
      ebreak`)
    expect(asleep.run(1000).sleeping).toEqual({ key: false, timerMs: null })
    asleep.brk()
    expect(finish(asleep).a0).toBe(0x8000 | 15)
  })

  it('stops on BRK with no handler; BRK then starts it again, as it does a machine off', () => {
    const m = boot(`
      li t0, 0x100
      lw a0, 0(t0)
      addi a0, a0, 1
      sw a0, 0(t0)
      li t0, ${REG.power}
      sw zero, 0(t0)
    spin:
      j spin`)
    m.run(1000)
    expect(m.running).toBe(false)
    expect(m.run(1000).sleeping).toEqual({ key: false, timerMs: null })
    m.brk()
    expect(m.running).toBe(true)
    m.run(1000)
    // Started again from the reset vector with its RAM: the count went on.
    expect(m.state.ram[0x100]).toBe(2)
    const spinning = boot('spin:\nj spin')
    spinning.run(100)
    spinning.brk()
    expect(spinning.run(100).halted?.cause).toBe('break')
    spinning.brk()
    expect([spinning.running, spinning.state.pc]).toEqual([true, 0x8000])
  })

  it('takes the lowest line first when two are up', () => {
    const m = boot(`
      ${handler}
      li t0, ${REG.timerCompare}
      li t1, 1
      sw t1, 0(t0)
      li t0, ${REG.timerCtrl}
      sw t1, 0(t0)
      csrsi mie, 3
      wfi
      csrsi mstatus, 8
      nop
    trap:
      csrr a0, mcause
      csrw mtvec, zero
      ebreak`)
    expect(m.run(10_000).sleeping).not.toBeNull()
    m.press(4)
    m.advance(5)
    expect(finish(m).a0).toBe(0x8000)
  })

  it('counts the timer round 16 bits, and a compare equal to the count is a whole turn away', () => {
    const m = boot('ebreak')
    const t = m.state.timer
    t.enabled = true
    t.count = 0xfffe
    t.compare = 1
    m.advance(2 / 1.024)
    expect([t.count, t.pending]).toEqual([0, false])
    m.advance(1 / 1.024 + 0.001)
    expect([t.count, t.pending]).toEqual([1, true])
    t.pending = false
    t.compare = t.count
    m.advance(65_535 / 1.024)
    expect(t.pending).toBe(false)
    m.advance(1 / 1.024 + 0.001)
    expect(t.pending).toBe(true)
  })

  it('keeps the first sixteen keys when more come than the program reads', () => {
    const m = boot(`
      li t0, ${REG.keyData}
      lbu a2, 1(t0)
      lw a0, 0(t0)
      lw a1, 2(t0)
      ebreak`)
    for (let k = 0; k < 20; k++) m.press(k)
    const r = finish(m)
    // A byte read of the high half does not take a key.
    expect([r.a2, r.a0, r.a1]).toEqual([0, 0, 15])
  })

  it('resets to the vector with the CSRs cleared, the RAM kept and bank 0 shown', () => {
    const m = boot(`
      li t0, 0x100
      li t1, 77
      sw t1, 0(t0)
      li t0, ${REG.bank}
      li t1, 3
      sw t1, 0(t0)
      li t0, 0x2000
      csrw mtvec, t0
      li a0, 5
      ebreak`)
    m.run(1000)
    m.reset()
    const s = m.state
    expect([s.pc, s.halt, s.csr.mtvec, s.bank, s.regs[4], s.ram[0x100]]).toEqual([
      0x8000,
      null,
      0,
      0,
      0,
      77,
    ])
  })

  it('steps one instruction at a time, runs a sixtieth of its clock a frame, and holds the clock in range', () => {
    const m = boot(`
    loop:
      addi a0, a0, 1
      j loop`)
    expect(m.step().cycles).toBe(1)
    expect(m.state.regs[4]).toBe(1)
    m.hz = 600_000_000
    expect(m.hz).toBe(32_000_000)
    m.hz = 1
    expect(m.hz).toBe(1_000_000)
    const before = m.state.cycles
    m.frame()
    expect(m.state.cycles - before).toBeGreaterThanOrEqual(1_000_000 / 60)
    expect(m.state.cycles - before).toBeLessThan(1_000_000 / 60 + 4)
  })

  it('runs a 32-bit instruction in RAM again after one byte of its high half changes', () => {
    const word = (imm: number) => encode32('li', { rd: 4, rs1: 0, rs2: 0, imm })
    const m = boot(`
      call 0x7000
      mv s0, a0
      li t0, 0x7003
      li t1, ${word(0x4000) >>> 24}
      sb t1, 0(t0)
      call 0x7000
      ebreak`)
    const ret = ramImage(assemble('.org 0x7000\nc.jr ra'), 0x7000)
    const w = word(0x2000)
    m.state.ram.set([w & 0xff, (w >>> 8) & 0xff, (w >>> 16) & 0xff, w >>> 24, ...ret], 0x7000)
    expect(word(0x2000) & 0xffffff).toBe(word(0x4000) & 0xffffff)
    const r = finish(m)
    expect([r.s0, r.a0]).toEqual([0x2000, 0x4000])
  })
})

describe('the screen', () => {
  it('counts a change only when what is shown changes, and draws a byte as eight rows', () => {
    const m = boot(`
      li t0, 0xe000
      li t1, 0x81
      sb t1, 3(t0)
      sb t1, 3(t0)
      ebreak`)
    finish(m)
    expect(m.screenRevision).toBe(1)
    const pixels = m.pixels()
    expect(pixels[0 * 240 + 3]).toBe(1)
    expect(pixels[7 * 240 + 3]).toBe(1)
    expect(pixels[1 * 240 + 3]).toBe(0)
  })

  it('tells the program its size, and keeps the four shades of the handheld one', () => {
    const r = finish(
      boot(
        `
      li t0, ${REG.width}
      lw a0, 0(t0)
      lw a1, 2(t0)
      lw a2, 4(t0)
      li t1, 0xe000 + 160 * 144 / 8
      li t2, 1
      sb t2, 0(t1)
      ebreak`,
        'handheld-160',
      ),
    )
    expect([r.a0, r.a1, r.a2]).toEqual([160, 144, 2])
  })

  it("ignores what is written past the model's screen in the window", () => {
    const m = boot(`
      li t0, 0xe000 + 1440
      li t1, 0xff
      sb t1, 0(t0)
      lbu a0, 0(t0)
      ebreak`)
    expect(finish(m).a0).toBe(0)
    expect(m.screenRevision).toBe(0)
  })
})

describe('speed', () => {
  it('runs a tight loop well past real time at 32 MHz (measured, logged)', () => {
    const m = boot(`
    loop:
      addi a0, a0, 1
      add a1, a1, a0
      xor a2, a2, a1
      bne a0, zero, loop
      j loop`)
    const cycles = 20_000_000
    const started = performance.now()
    m.run(cycles)
    const ms = performance.now() - started
    const mips = m.state.instret / ms / 1000
    const mhz = m.state.cycles / ms / 1000
    console.log(`elec16: ${mips.toFixed(1)} M instructions/s, ${mhz.toFixed(1)} MHz of cycles`)
    // vitest's transforms make this slower than plain Node (docs/elec16.md section 4 has both);
    // the floor is far below either, to catch a slowdown of an order of magnitude.
    expect(mhz).toBeGreaterThan(5)
  })
})
