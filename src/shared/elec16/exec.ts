/**
 * What each E16 operation does (docs/elec16.md section 4), one small function per operation
 * in a table indexed by the operation's number, so the CPU's step is a lookup and a call.
 *
 * Each handler does its work itself, reading the register file directly - not through a
 * shared wrapper that calls another function - so an instruction costs one call (measured:
 * the wrappers took about a third of the time of a simple instruction).
 *
 * Registers are 16 bits; arithmetic wraps, and writing a Uint16Array keeps the low 16 bits.
 * A register read as signed is sign-extended from bit 15. Division never traps: by zero the
 * quotient is all ones and the remainder the dividend; -32768 / -1 is -32768 remainder 0
 * (as RISC-V does).
 */

import type { Bus } from './bus.js'
import { type Inst, OPS, type OpName } from './isa.js'
import { CAUSE, type Elec16State } from './state.js'

/** What a handler may touch: the state, the bus, and where the CPU goes next. */
export interface Core {
  readonly s: Elec16State
  /** The register file (s.regs), held here so a handler reaches it in one step. */
  readonly r: Uint16Array
  readonly bus: Bus
  /** Where the next instruction is: past this one unless a handler says otherwise. */
  next: number
  /** A branch was taken (it costs a cycle more). */
  taken: boolean
  /** Enters the trap handler for an exception at the current instruction. */
  trap(cause: number, value: number): void
  /** Reads a CSR; null for one that does not exist. */
  csrRead(csr: number): number | null
  /** Writes a CSR (read-only ones ignore it). */
  csrWrite(csr: number, value: number): void
  /** Sleeps in WFI unless an enabled interrupt is already pending. */
  waitForInterrupt(): void
  /** MRET: back from a trap. */
  trapReturn(): void
}

type Handler = (c: Core, i: Inst, pc: number) => void

/** A register's value (always there: x0 to x15). */
const x = (r: Uint16Array, n: number): number => r[n] as number
/** A register's value, signed. */
const sx = (r: Uint16Array, n: number): number => ((r[n] as number) << 16) >> 16

const rotl = (v: number, n: number): number =>
  n === 0 ? v : ((v << n) | (v >>> (16 - n))) & 0xffff
const clz16 = (v: number): number => (v === 0 ? 16 : Math.clz32(v) - 16)
const ctz16 = (v: number): number => (v === 0 ? 16 : 31 - Math.clz32(v & -v))
const cpop16 = (v: number): number => {
  let n = 0
  for (let b = v; b !== 0; b &= b - 1) n++
  return n
}

/** Signed division by a divisor that is not zero; -32768 / -1 overflows to itself. */
function signedDivide(n: number, d: number, remainder: boolean): number {
  if (n === -32768 && d === -1) return remainder ? 0 : n
  return remainder ? n % d : Math.trunc(n / d)
}

function load8(c: Core, i: Inst, signed: boolean): void {
  const b = c.bus.read8((x(c.r, i.rs1) + i.imm) & 0xffff)
  if (i.rd !== 0) c.r[i.rd] = signed ? (b << 24) >> 24 : b
}

function store(c: Core, i: Inst, word: boolean): void {
  const a = (x(c.r, i.rs1) + i.imm) & 0xffff
  if (word && (a & 1) !== 0) {
    c.trap(CAUSE.storeMisaligned, a)
    return
  }
  const ok = word ? c.bus.write16(a, x(c.r, i.rs2)) : c.bus.write8(a, x(c.r, i.rs2))
  if (!ok) c.trap(CAUSE.storeFault, a)
}

/** An instruction's first half-word, which mtval holds for an illegal one. */
function firstHalf(c: Core, pc: number): number {
  return c.bus.peek(pc) | (c.bus.peek(pc + 1) << 8)
}

/** CSRRW, CSRRS and CSRRC, from a register or (the I forms) a 4-bit immediate in rs1. */
function csr(kind: 'w' | 's' | 'c', immediate: boolean): Handler {
  return (c, i, pc) => {
    const old = c.csrRead(i.imm)
    if (old === null) {
      // As for any illegal instruction: its first half-word, not the CSR's number.
      c.trap(CAUSE.illegal, firstHalf(c, pc))
      return
    }
    const v = immediate ? i.rs1 : x(c.r, i.rs1)
    // Setting or clearing nothing writes nothing (a plain read of a read-only CSR is fine).
    if (kind === 'w') c.csrWrite(i.imm, v)
    else if (i.rs1 !== 0) c.csrWrite(i.imm, kind === 's' ? old | v : old & ~v)
    if (i.rd !== 0) c.r[i.rd] = old
  }
}

/**
 * The bytes MCPY and MSET move in one step. A longer block takes several: the instruction
 * runs again from the same address with its registers moved on, so an interrupt or BRK is
 * taken between steps, as between any two instructions, and returns to finish it.
 */
export const BLOCK_STEP = 8

/**
 * MCPY rd, rs1, rs2: rs2 bytes from rs1 to rd, as memmove copies them - from the end when rd
 * lies inside the source, so an overlap is copied whole. A step forward moves rd and rs1 on
 * and rs2 down; one from the end only takes rs2 down. Each byte costs a read and a write.
 */
function blockCopy(c: Core, i: Inst, pc: number): void {
  const r = c.r
  const to = x(r, i.rd)
  const from = x(r, i.rs1)
  const left = x(r, i.rs2)
  if (left === 0) return
  const k = Math.min(left, BLOCK_STEP)
  const ahead = (to - from) & 0xffff
  const back = ahead !== 0 && ahead < left
  let done = 0
  for (; done < k; done++) {
    const at = back ? left - 1 - done : done
    const a = (to + at) & 0xffff
    if (!c.bus.write8(a, c.bus.read8((from + at) & 0xffff))) break
  }
  if (!back) {
    r[i.rd] = to + done
    r[i.rs1] = from + done
  }
  r[i.rs2] = left - done
  c.s.stall += 2 * done
  if (done < k) c.trap(CAUSE.storeFault, (to + (back ? left - 1 - done : done)) & 0xffff)
  else if (left > k) c.next = pc
}

/** MSET rd, rs1, rs2: rs2 bytes from rd set to rs1's low byte; a write a byte. */
function blockFill(c: Core, i: Inst, pc: number): void {
  const r = c.r
  const to = x(r, i.rd)
  const value = x(r, i.rs1) & 0xff
  const left = x(r, i.rs2)
  if (left === 0) return
  const k = Math.min(left, BLOCK_STEP)
  let done = 0
  for (; done < k; done++) if (!c.bus.write8((to + done) & 0xffff, value)) break
  r[i.rd] = to + done
  r[i.rs2] = left - done
  c.s.stall += done
  if (done < k) c.trap(CAUSE.storeFault, (to + done) & 0xffff)
  else if (left > k) c.next = pc
}

/** A branch taken: it goes `imm` bytes from the instruction. */
function jump(c: Core, i: Inst, pc: number): void {
  c.next = (pc + i.imm) & 0xffff
  c.taken = true
}

// Each handler writes rd only when it is not x0, which stays zero.
const HANDLERS: Record<OpName, Handler> = {
  // mtval holds the instruction's first half-word, so a handler can see what it was.
  illegal: (c, _i, pc) => c.trap(CAUSE.illegal, firstHalf(c, pc)),
  add: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) + x(c.r, i.rs2)
  },
  sub: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) - x(c.r, i.rs2)
  },
  and: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) & x(c.r, i.rs2)
  },
  or: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) | x(c.r, i.rs2)
  },
  xor: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) ^ x(c.r, i.rs2)
  },
  sll: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) << (x(c.r, i.rs2) & 15)
  },
  srl: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) >>> (x(c.r, i.rs2) & 15)
  },
  sra: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = sx(c.r, i.rs1) >> (x(c.r, i.rs2) & 15)
  },
  slt: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = sx(c.r, i.rs1) < sx(c.r, i.rs2) ? 1 : 0
  },
  sltu: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) < x(c.r, i.rs2) ? 1 : 0
  },
  addi: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) + i.imm
  },
  andi: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) & i.imm
  },
  ori: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) | i.imm
  },
  xori: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) ^ i.imm
  },
  slli: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) << i.imm
  },
  srli: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) >>> i.imm
  },
  srai: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = sx(c.r, i.rs1) >> i.imm
  },
  slti: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = sx(c.r, i.rs1) < i.imm ? 1 : 0
  },
  sltiu: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) < (i.imm & 0xffff) ? 1 : 0
  },
  li: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = i.imm
  },
  auipc: (c, i, pc) => {
    if (i.rd !== 0) c.r[i.rd] = pc + i.imm
  },
  lb: (c, i) => load8(c, i, true),
  lbu: (c, i) => load8(c, i, false),
  lw: (c, i) => {
    const a = (x(c.r, i.rs1) + i.imm) & 0xffff
    if ((a & 1) !== 0) {
      c.trap(CAUSE.loadMisaligned, a)
      return
    }
    const v = c.bus.read16(a)
    if (i.rd !== 0) c.r[i.rd] = v
  },
  sb: (c, i) => store(c, i, false),
  sw: (c, i) => store(c, i, true),
  beq: (c, i, pc) => {
    if (x(c.r, i.rs1) === x(c.r, i.rs2)) jump(c, i, pc)
  },
  bne: (c, i, pc) => {
    if (x(c.r, i.rs1) !== x(c.r, i.rs2)) jump(c, i, pc)
  },
  blt: (c, i, pc) => {
    if (sx(c.r, i.rs1) < sx(c.r, i.rs2)) jump(c, i, pc)
  },
  bge: (c, i, pc) => {
    if (sx(c.r, i.rs1) >= sx(c.r, i.rs2)) jump(c, i, pc)
  },
  bltu: (c, i, pc) => {
    if (x(c.r, i.rs1) < x(c.r, i.rs2)) jump(c, i, pc)
  },
  bgeu: (c, i, pc) => {
    if (x(c.r, i.rs1) >= x(c.r, i.rs2)) jump(c, i, pc)
  },
  jal: (c, i, pc) => {
    if (i.rd !== 0) c.r[i.rd] = pc + i.size
    c.next = (pc + i.imm) & 0xffff
  },
  jalr: (c, i, pc) => {
    // Read the target before writing rd: they may be one register.
    const target = (x(c.r, i.rs1) + i.imm) & 0xfffe
    if (i.rd !== 0) c.r[i.rd] = pc + i.size
    c.next = target
  },
  mul: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = Math.imul(x(c.r, i.rs1), x(c.r, i.rs2))
  },
  mulh: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = Math.floor((sx(c.r, i.rs1) * sx(c.r, i.rs2)) / 65536)
  },
  mulhu: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = Math.floor((x(c.r, i.rs1) * x(c.r, i.rs2)) / 65536)
  },
  mulhsu: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = Math.floor((sx(c.r, i.rs1) * x(c.r, i.rs2)) / 65536)
  },
  div: (c, i) => {
    const d = sx(c.r, i.rs2)
    const v = d === 0 ? 0xffff : signedDivide(sx(c.r, i.rs1), d, false)
    if (i.rd !== 0) c.r[i.rd] = v
  },
  divu: (c, i) => {
    const d = x(c.r, i.rs2)
    const v = d === 0 ? 0xffff : Math.floor(x(c.r, i.rs1) / d)
    if (i.rd !== 0) c.r[i.rd] = v
  },
  rem: (c, i) => {
    const d = sx(c.r, i.rs2)
    const v = d === 0 ? x(c.r, i.rs1) : signedDivide(sx(c.r, i.rs1), d, true)
    if (i.rd !== 0) c.r[i.rd] = v
  },
  remu: (c, i) => {
    const d = x(c.r, i.rs2)
    const v = d === 0 ? x(c.r, i.rs1) : x(c.r, i.rs1) % d
    if (i.rd !== 0) c.r[i.rd] = v
  },
  andn: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) & ~x(c.r, i.rs2)
  },
  orn: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) | ~x(c.r, i.rs2)
  },
  xnor: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = ~(x(c.r, i.rs1) ^ x(c.r, i.rs2))
  },
  clz: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = clz16(x(c.r, i.rs1))
  },
  ctz: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = ctz16(x(c.r, i.rs1))
  },
  cpop: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = cpop16(x(c.r, i.rs1))
  },
  min: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = Math.min(sx(c.r, i.rs1), sx(c.r, i.rs2))
  },
  max: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = Math.max(sx(c.r, i.rs1), sx(c.r, i.rs2))
  },
  minu: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = Math.min(x(c.r, i.rs1), x(c.r, i.rs2))
  },
  maxu: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = Math.max(x(c.r, i.rs1), x(c.r, i.rs2))
  },
  rol: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = rotl(x(c.r, i.rs1), x(c.r, i.rs2) & 15)
  },
  ror: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = rotl(x(c.r, i.rs1), (16 - (x(c.r, i.rs2) & 15)) & 15)
  },
  rori: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = rotl(x(c.r, i.rs1), (16 - i.imm) & 15)
  },
  rev8: (c, i) => {
    const v = x(c.r, i.rs1)
    if (i.rd !== 0) c.r[i.rd] = ((v >>> 8) & 0xff) | ((v & 0xff) << 8)
  },
  'sext.b': (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = (x(c.r, i.rs1) << 24) >> 24
  },
  'zext.b': (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) & 0xff
  },
  bset: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) | (1 << (x(c.r, i.rs2) & 15))
  },
  bclr: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) & ~(1 << (x(c.r, i.rs2) & 15))
  },
  binv: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) ^ (1 << (x(c.r, i.rs2) & 15))
  },
  bext: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = (x(c.r, i.rs1) >>> (x(c.r, i.rs2) & 15)) & 1
  },
  bseti: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) | (1 << i.imm)
  },
  bclri: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) & ~(1 << i.imm)
  },
  binvi: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = x(c.r, i.rs1) ^ (1 << i.imm)
  },
  bexti: (c, i) => {
    if (i.rd !== 0) c.r[i.rd] = (x(c.r, i.rs1) >>> i.imm) & 1
  },
  mcpy: blockCopy,
  mset: blockFill,
  ecall: (c) => c.trap(CAUSE.ecall, 0),
  ebreak: (c, _i, pc) => c.trap(CAUSE.breakpoint, pc),
  wfi: (c) => c.waitForInterrupt(),
  mret: (c) => c.trapReturn(),
  csrrw: csr('w', false),
  csrrs: csr('s', false),
  csrrc: csr('c', false),
  csrrwi: csr('w', true),
  csrrsi: csr('s', true),
  csrrci: csr('c', true),
}

/** The handlers by operation number. */
export const EXEC: readonly Handler[] = OPS.map((name) => HANDLERS[name])
