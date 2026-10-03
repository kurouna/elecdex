/**
 * What each E16 operation does (docs/elec16.md section 4), one small function per operation
 * in a table indexed by the operation's number, so the CPU's step is a lookup and a call.
 *
 * Registers are 16 bits; arithmetic wraps. A register read as signed is sign-extended from
 * bit 15. Division never traps: by zero the quotient is all ones and the remainder the
 * dividend; -32768 / -1 is -32768 remainder 0 (as RISC-V does).
 */

import type { Bus } from './bus.js'
import { type Inst, OPS, type OpName } from './isa.js'
import { CAUSE, type Elec16State } from './state.js'

/** What a handler may touch: the state, the bus, and where the CPU goes next. */
export interface Core {
  readonly s: Elec16State
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

const x = (c: Core, r: number): number => c.s.regs[r] ?? 0
const sx = (c: Core, r: number): number => ((c.s.regs[r] ?? 0) << 16) >> 16
const set = (c: Core, rd: number, value: number): void => {
  if (rd !== 0) c.s.regs[rd] = value
}
const s16 = (value: number): number => (value << 16) >> 16
const sh = (value: number): number => value & 15

const rotl = (v: number, n: number): number =>
  n === 0 ? v : ((v << n) | (v >>> (16 - n))) & 0xffff
const clz16 = (v: number): number => (v === 0 ? 16 : Math.clz32(v) - 16)
const ctz16 = (v: number): number => (v === 0 ? 16 : 31 - Math.clz32(v & -v))
const cpop16 = (v: number): number => {
  let n = 0
  for (let b = v; b !== 0; b &= b - 1) n++
  return n
}

const regOp =
  (f: (a: number, b: number, c: Core, i: Inst) => number): Handler =>
  (c, i) =>
    set(c, i.rd, f(x(c, i.rs1), x(c, i.rs2), c, i))
const immOp =
  (f: (a: number, imm: number, c: Core, i: Inst) => number): Handler =>
  (c, i) =>
    set(c, i.rd, f(x(c, i.rs1), i.imm, c, i))
const unary =
  (f: (a: number) => number): Handler =>
  (c, i) =>
    set(c, i.rd, f(x(c, i.rs1)))

function branch(test: (c: Core, i: Inst) => boolean): Handler {
  return (c, i, pc) => {
    if (!test(c, i)) return
    c.next = (pc + i.imm) & 0xffff
    c.taken = true
  }
}

function load(signedByte: boolean | null): Handler {
  return (c, i) => {
    const a = (x(c, i.rs1) + i.imm) & 0xffff
    if (signedByte === null) {
      if ((a & 1) !== 0) return c.trap(CAUSE.loadMisaligned, a)
      return set(c, i.rd, c.bus.read16(a))
    }
    const b = c.bus.read8(a)
    set(c, i.rd, signedByte ? (b << 24) >> 24 : b)
  }
}

function store(word: boolean): Handler {
  return (c, i) => {
    const a = (x(c, i.rs1) + i.imm) & 0xffff
    if (word && (a & 1) !== 0) return c.trap(CAUSE.storeMisaligned, a)
    const ok = word ? c.bus.write16(a, x(c, i.rs2)) : c.bus.write8(a, x(c, i.rs2))
    if (!ok) c.trap(CAUSE.storeFault, a)
  }
}

function divide(signed: boolean, remainder: boolean): Handler {
  return regOp((a, b, c, i) => {
    if (b === 0) return remainder ? a : 0xffff
    if (!signed) return remainder ? a % b : Math.floor(a / b)
    return signedDivide(sx(c, i.rs1), sx(c, i.rs2), remainder)
  })
}

/** Signed division by a divisor that is not zero; -32768 / -1 overflows to itself. */
function signedDivide(n: number, d: number, remainder: boolean): number {
  if (n === -32768 && d === -1) return remainder ? 0 : n
  return remainder ? n % d : Math.trunc(n / d)
}

/** CSRRW, CSRRS and CSRRC, from a register or (the I forms) a 4-bit immediate in rs1. */
function csr(kind: 'w' | 's' | 'c', immediate: boolean): Handler {
  return (c, i) => {
    const old = c.csrRead(i.imm)
    if (old === null) return c.trap(CAUSE.illegal, i.imm)
    const v = immediate ? i.rs1 : x(c, i.rs1)
    // Setting or clearing nothing writes nothing (a plain read of a read-only CSR is fine).
    if (kind === 'w') c.csrWrite(i.imm, v)
    else if (i.rs1 !== 0) c.csrWrite(i.imm, kind === 's' ? old | v : old & ~v)
    set(c, i.rd, old)
  }
}

const HANDLERS: Record<OpName, Handler> = {
  // mtval holds the instruction's first half-word, so a handler can see what it was.
  illegal: (c, _i, pc) => c.trap(CAUSE.illegal, c.bus.peek(pc) | (c.bus.peek(pc + 1) << 8)),
  add: regOp((a, b) => a + b),
  sub: regOp((a, b) => a - b),
  and: regOp((a, b) => a & b),
  or: regOp((a, b) => a | b),
  xor: regOp((a, b) => a ^ b),
  sll: regOp((a, b) => a << sh(b)),
  srl: regOp((a, b) => a >>> sh(b)),
  sra: regOp((a, b) => s16(a) >> sh(b)),
  slt: regOp((a, b) => (s16(a) < s16(b) ? 1 : 0)),
  sltu: regOp((a, b) => (a < b ? 1 : 0)),
  addi: immOp((a, imm) => a + imm),
  andi: immOp((a, imm) => a & imm),
  ori: immOp((a, imm) => a | imm),
  xori: immOp((a, imm) => a ^ imm),
  slli: immOp((a, n) => a << n),
  srli: immOp((a, n) => a >>> n),
  srai: immOp((a, n) => s16(a) >> n),
  slti: immOp((a, imm) => (s16(a) < imm ? 1 : 0)),
  sltiu: immOp((a, imm) => (a < (imm & 0xffff) ? 1 : 0)),
  li: (c, i) => set(c, i.rd, i.imm),
  auipc: (c, i, pc) => set(c, i.rd, pc + i.imm),
  lb: load(true),
  lbu: load(false),
  lw: load(null),
  sb: store(false),
  sw: store(true),
  beq: branch((c, i) => x(c, i.rs1) === x(c, i.rs2)),
  bne: branch((c, i) => x(c, i.rs1) !== x(c, i.rs2)),
  blt: branch((c, i) => sx(c, i.rs1) < sx(c, i.rs2)),
  bge: branch((c, i) => sx(c, i.rs1) >= sx(c, i.rs2)),
  bltu: branch((c, i) => x(c, i.rs1) < x(c, i.rs2)),
  bgeu: branch((c, i) => x(c, i.rs1) >= x(c, i.rs2)),
  jal: (c, i, pc) => {
    set(c, i.rd, pc + i.size)
    c.next = (pc + i.imm) & 0xffff
  },
  jalr: (c, i, pc) => {
    // Read the target before writing rd: they may be one register.
    const target = (x(c, i.rs1) + i.imm) & 0xfffe
    set(c, i.rd, pc + i.size)
    c.next = target
  },
  mul: regOp((a, b) => Math.imul(a, b)),
  mulh: regOp((_a, _b, c, i) => Math.floor((sx(c, i.rs1) * sx(c, i.rs2)) / 65536)),
  mulhu: regOp((a, b) => Math.floor((a * b) / 65536)),
  mulhsu: regOp((_a, b, c, i) => Math.floor((sx(c, i.rs1) * b) / 65536)),
  div: divide(true, false),
  divu: divide(false, false),
  rem: divide(true, true),
  remu: divide(false, true),
  andn: regOp((a, b) => a & ~b),
  orn: regOp((a, b) => a | ~b),
  xnor: regOp((a, b) => ~(a ^ b)),
  clz: unary(clz16),
  ctz: unary(ctz16),
  cpop: unary(cpop16),
  min: regOp((a, b) => (s16(a) < s16(b) ? a : b)),
  max: regOp((a, b) => (s16(a) > s16(b) ? a : b)),
  minu: regOp((a, b) => Math.min(a, b)),
  maxu: regOp((a, b) => Math.max(a, b)),
  rol: regOp((a, b) => rotl(a, sh(b))),
  ror: regOp((a, b) => rotl(a, (16 - sh(b)) & 15)),
  rori: immOp((a, n) => rotl(a, (16 - n) & 15)),
  rev8: unary((a) => ((a >>> 8) & 0xff) | ((a & 0xff) << 8)),
  'sext.b': unary((a) => (a << 24) >> 24),
  'zext.b': unary((a) => a & 0xff),
  bset: regOp((a, b) => a | (1 << sh(b))),
  bclr: regOp((a, b) => a & ~(1 << sh(b))),
  binv: regOp((a, b) => a ^ (1 << sh(b))),
  bext: regOp((a, b) => (a >>> sh(b)) & 1),
  bseti: immOp((a, n) => a | (1 << n)),
  bclri: immOp((a, n) => a & ~(1 << n)),
  binvi: immOp((a, n) => a ^ (1 << n)),
  bexti: immOp((a, n) => (a >>> n) & 1),
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
