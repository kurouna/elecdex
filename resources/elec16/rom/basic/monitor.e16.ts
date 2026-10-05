// The machine-code monitor's U and B (docs/elec16.md section 6), ROM bank 4: E16 code back
// to text, in the syntax the assembler reads - the same text as src/shared/elec16/disasm.ts,
// which a test holds it to for every 16-bit encoding and the 32-bit forms - and breakpoints,
// which G writes into the code as C.EBREAK and every return to the monitor takes out again.
// Compiled by e16c; the hand-written monitor (monitor.s) calls it through far_call. BASIC's
// data area is full, so what this keeps lives in the monitor's own (ram.inc, 0082-00FF), and
// the text is written into the monitor's line buffer, done with once a command runs.
import {
  type bool,
  div,
  i16,
  peek,
  peek16,
  poke,
  poke16,
  str,
  u16,
  wrap16,
} from '../../../../src/shared/e16c/builtins'
import { newline, puts, ROWS } from './rom.e16'

/* ---------------- the monitor's work area (ram.inc) ---------------- */

/** The monitor's line buffer: U and B write their lines there. */
const LINEBUF = 0x40
/** Where the next character of the text goes. */
const OUT_AT = 0x82
/** The instruction decoded: its name, how its operands are written, and the operands. */
const D_NAME = 0x84
const D_FORMAT = 0x86
const D_RD = 0x88
const D_RS1 = 0x8a
const D_RS2 = 0x8c
const D_IMM = 0x8e
const D_SIZE = 0x90
/** Where U goes on when given no address. */
const U_NEXT = 0x92
/** 1 while G has the breakpoints written into the code. */
const ARMED = 0x94
/** Four breakpoints (0 for none), and the two bytes G wrote over at each. */
const BREAKS = 0x96
const SAVED = 0x9e

/* ---------------- writing the text ---------------- */

function emit(c: u16): void {
  const at = peek16(OUT_AT)
  poke(at, c)
  poke16(OUT_AT, at + 1)
}

function emitStr(s: u16): void {
  let p = s
  while (peek(p) !== 0) {
    emit(peek(p))
    p++
  }
}

/** The `n`th word of `list`, words parted by one space. */
function emitWord(list: u16, n: u16): void {
  let p = list
  let k: u16 = 0
  while (k < n) {
    while (peek(p) !== 0x20) p++
    p++
    k++
  }
  while (peek(p) !== 0x20 && peek(p) !== 0) {
    emit(peek(p))
    p++
  }
}

function emitReg(r: u16): void {
  emitWord(str('zero ra sp gp a0 a1 a2 a3 t0 t1 t2 t3 s0 s1 s2 s3'), r)
}

function comma(): void {
  emit(0x2c)
  emit(0x20)
}

function emitHex4(v: u16): void {
  let shift: u16 = 16
  while (shift !== 0) {
    shift -= 4
    const d = (v >> shift) & 15
    emit(d < 10 ? 0x30 + d : 0x37 + d)
  }
}

function emitHex(v: u16): void {
  emit(0x30)
  emit(0x78)
  emitHex4(v)
}

function emitUnsigned(v: u16): void {
  if (v >= 10) emitUnsigned(div(v, 10))
  emit(0x30 + (v % 10))
}

function emitNumber(v: i16): void {
  if (v < 0) {
    emit(0x2d)
    emitUnsigned(u16(-v))
  } else {
    emitUnsigned(u16(v))
  }
}

/** A CSR by its name, or its number when it has none. */
function emitCsr(n: u16): void {
  if (n === 0x300) emitStr(str('mstatus'))
  else if (n === 0x301) emitStr(str('misa'))
  else if (n === 0x304) emitStr(str('mie'))
  else if (n === 0x305) emitStr(str('mtvec'))
  else if (n === 0x340) emitStr(str('mscratch'))
  else if (n === 0x341) emitStr(str('mepc'))
  else if (n === 0x342) emitStr(str('mcause'))
  else if (n === 0x343) emitStr(str('mtval'))
  else if (n === 0x344) emitStr(str('mip'))
  else if (n === 0xc00) emitStr(str('cycle'))
  else if (n === 0xc02) emitStr(str('instret'))
  else if (n === 0xc80) emitStr(str('cycleh'))
  else if (n === 0xc82) emitStr(str('instreth'))
  else emitUnsigned(n)
}

/* ---------------- what an instruction is ---------------- */

// How its operands are written (disasm.ts's textOf).
const F_ILLEGAL = 0
/** rd, rs1, rs2 */
const F_R = 1
/** rd, rs1, imm */
const F_I = 2
/** rd, imm(rs1): loads, JALR, C.LW */
const F_MEM = 3
/** rd, rs1 */
const F_UNARY = 4
/** rs2, imm(rs1): stores, C.SW */
const F_S = 5
/** rs1, rs2, target */
const F_B = 6
/** rd, target */
const F_J = 7
/** rd, 0xVALUE */
const F_U = 8
/** rd, csr, rs1 */
const F_CSR = 9
/** rd, csr, number */
const F_CSRI = 10
/** the name alone */
const F_NONE = 11
/** rd, imm */
const F_C_RI = 12
/** rd, rs2 */
const F_C_RR = 13
/** rd, imm (sp implied) */
const F_C_LWSP = 14
/** rs2, imm (sp implied) */
const F_C_SWSP = 15
/** rs1, target */
const F_C_B = 16
/** target */
const F_C_J = 17
/** rs1 */
const F_C_R = 18
/** rd, rs1, rs2, imm */
const F_RQ = 19

function decoded(name: u16, format: u16, rd: u16, rs1: u16): void {
  poke16(D_NAME, name)
  poke16(D_FORMAT, name === 0 ? F_ILLEGAL : format)
  poke16(D_RD, rd)
  poke16(D_RS1, rs1)
}

function illegal(): void {
  poke16(D_FORMAT, F_ILLEGAL)
}

function setImm(v: i16): void {
  poke16(D_IMM, u16(v))
}

function setRs2(r: u16): void {
  poke16(D_RS2, r)
}

function imm(): i16 {
  return i16(peek16(D_IMM))
}

/* ---------------- 32-bit instructions ---------------- */

/** The register-register operations, by funct10 and funct3; 0 for none. */
function rName(key: u16): u16 {
  switch (key) {
    case 0:
      return str('add')
    case 1:
      return str('sll')
    case 2:
      return str('slt')
    case 3:
      return str('sltu')
    case 4:
      return str('xor')
    case 5:
      return str('srl')
    case 6:
      return str('or')
    case 7:
      return str('and')
    case 8:
      return str('sub')
    case 13:
      return str('sra')
    case 16:
      return str('mul')
    case 17:
      return str('mulh')
    case 18:
      return str('mulhsu')
    case 19:
      return str('mulhu')
    case 20:
      return str('div')
    case 21:
      return str('divu')
    case 22:
      return str('rem')
    case 23:
      return str('remu')
    default:
      return bitName(key)
  }
}

function bitName(key: u16): u16 {
  switch (key) {
    case 25:
      return str('rol')
    case 28:
      return str('xnor')
    case 29:
      return str('ror')
    case 30:
      return str('orn')
    case 31:
      return str('andn')
    case 36:
      return str('min')
    case 37:
      return str('minu')
    case 38:
      return str('max')
    case 39:
      return str('maxu')
    case 40:
      return str('bset')
    case 41:
      return str('bclr')
    case 42:
      return str('binv')
    case 43:
      return str('bext')
    case 48:
      return str('mcpy')
    case 49:
      return str('mset')
    default:
      return 0
  }
}

/**
 * Whether MCPY (48) or MSET (49) names registers it may: three different ones, none zero but
 * MSET's value (isa.ts, blockRegisters). Any other operation takes any registers.
 */
function blockRegisters(key: u16, rd: u16, rs1: u16, rs2: u16): bool {
  if (key !== 48 && key !== 49) return true
  if (rd === 0 || rs2 === 0 || rd === rs2 || rd === rs1 || rs1 === rs2) return false
  return key === 49 || rs1 !== 0
}

/** Shifts and single bits by an immediate (selector 0 to 3), and the one-register ones. */
function shiftName(f3: u16, sel: u16): u16 {
  if (f3 === 5) {
    if (sel === 0) return str('srli')
    if (sel === 1) return str('srai')
    if (sel === 2) return str('rori')
    if (sel === 3) return str('bexti')
    return 0
  }
  switch (sel) {
    case 0:
      return str('slli')
    case 1:
      return str('bseti')
    case 2:
      return str('bclri')
    case 3:
      return str('binvi')
    case 0x10:
      return str('clz')
    case 0x11:
      return str('ctz')
    case 0x12:
      return str('cpop')
    case 0x13:
      return str('sext.b')
    case 0x14:
      return str('zext.b')
    case 0x15:
      return str('rev8')
    default:
      return 0
  }
}

function immName(f3: u16): u16 {
  switch (f3) {
    case 0:
      return str('addi')
    case 2:
      return str('slti')
    case 3:
      return str('sltiu')
    case 4:
      return str('xori')
    case 6:
      return str('ori')
    case 7:
      return str('andi')
    default:
      return 0
  }
}

function opImm(f3: u16, rd: u16, rs1: u16, imm14: u16): void {
  if (f3 !== 1 && f3 !== 5) {
    decoded(immName(f3), F_I, rd, rs1)
    setImm(i16(wrap16(imm14 << 2)) >> 2)
    return
  }
  const sel = imm14 >> 4
  if (sel < 0x10) {
    decoded(shiftName(f3, sel), F_I, rd, rs1)
    setImm(i16(imm14 & 15))
  } else if ((imm14 & 15) === 0) {
    decoded(shiftName(f3, sel), F_UNARY, rd, rs1)
  } else {
    illegal()
  }
}

function loadOrJalr(major: u16, f3: u16): u16 {
  if (major === 6) return f3 === 0 ? str('jalr') : 0
  if (f3 === 0) return str('lb')
  if (f3 === 1) return str('lw')
  if (f3 === 4) return str('lbu')
  return 0
}

function branchName(f3: u16): u16 {
  switch (f3) {
    case 0:
      return str('beq')
    case 1:
      return str('bne')
    case 4:
      return str('blt')
    case 5:
      return str('bge')
    case 6:
      return str('bltu')
    case 7:
      return str('bgeu')
    default:
      return 0
  }
}

function csrName(f3: u16): u16 {
  switch (f3) {
    case 1:
      return str('csrrw')
    case 2:
      return str('csrrs')
    case 3:
      return str('csrrc')
    case 5:
      return str('csrrwi')
    case 6:
      return str('csrrsi')
    case 7:
      return str('csrrci')
    default:
      return 0
  }
}

function sysName(kind: u16): u16 {
  if (kind === 0) return str('ecall')
  if (kind === 1) return str('ebreak')
  if (kind === 2) return str('mret')
  if (kind === 3) return str('wfi')
  return 0
}

function system(f3: u16, rd: u16, rs1: u16, imm14: u16): void {
  if (f3 === 0) {
    // ECALL and its kind take no registers.
    if (rd !== 0 || rs1 !== 0) illegal()
    else decoded(sysName(imm14), F_NONE, 0, 0)
  } else if (imm14 > 0xfff) {
    illegal()
  } else {
    decoded(csrName(f3), f3 >= 5 ? F_CSRI : F_CSR, rd, rs1)
    setImm(i16(imm14))
  }
}

/** LI, AUIPC and JAL: a 16-bit field from bit 11; bits 31..27 must be clear. */
function upperForm(major: u16, rd: u16, lo: u16, hi: u16): void {
  const field = wrap16((lo >> 11) | (hi << 5))
  if (hi >> 11 !== 0) {
    illegal()
  } else if (major === 5) {
    decoded(str('jal'), F_J, rd, 0)
    setImm(i16(wrap16(field << 1)))
  } else {
    decoded(major === 7 ? str('li') : str('auipc'), F_U, rd, 0)
    setImm(i16(field))
  }
}

/** OP: funct10 below 16 an R operation; above, MULQ (its amount, 1 to 15, in the low four bits). */
function registers(f10: u16, f3: u16, rd: u16, rs1: u16): void {
  if (f10 >= 16) {
    const amount = f10 & 15
    decoded(f10 >> 4 === 1 && f3 === 0 && amount !== 0 ? str('mulq') : 0, F_RQ, rd, rs1)
    setImm(i16(amount))
    return
  }
  const key = (f10 << 3) | f3
  decoded(blockRegisters(key, rd, rs1, peek16(D_RS2)) ? rName(key) : 0, F_R, rd, rs1)
}

function decode32(lo: u16, hi: u16): void {
  poke16(D_SIZE, 4)
  const major = (lo >> 2) & 31
  const rd = (lo >> 7) & 15
  const f3 = (lo >> 11) & 7
  const rs1 = ((lo >> 14) | (hi << 2)) & 15
  const f10 = (hi >> 6) & 0x3ff
  const imm14 = (hi >> 2) & 0x3fff
  setRs2((hi >> 2) & 15)
  if (major === 3) {
    registers(f10, f3, rd, rs1)
  } else if (major === 2) {
    opImm(f3, rd, rs1, imm14)
  } else if (major === 0 || major === 6) {
    decoded(loadOrJalr(major, f3), F_MEM, rd, rs1)
    setImm(i16(wrap16(imm14 << 2)) >> 2)
  } else if (major === 1) {
    decoded(f3 === 0 ? str('sb') : f3 === 1 ? str('sw') : 0, F_S, 0, rs1)
    setImm(i16(wrap16(((f10 << 4) | rd) << 2)) >> 2)
  } else if (major === 4) {
    decoded(branchName(f3), F_B, 0, rs1)
    setImm(i16(wrap16(((f10 << 5) | (rd << 1)) << 1)) >> 1)
  } else if (major === 5 || major === 7 || major === 8) {
    upperForm(major, rd, lo, hi)
  } else if (major === 9) {
    system(f3, rd, rs1, imm14)
  } else {
    illegal()
  }
}

/* ---------------- 16-bit instructions ---------------- */

/** Quadrant 0: loads and stores, and an address on the stack. */
function quadrant0(h: u16): void {
  const f3 = h >> 13
  const r9 = (h >> 9) & 15
  if (f3 <= 1) {
    const reg = (h >> 7) & 15
    setImm(i16(((((h >> 11) & 3) << 1) | ((h >> 2) & 1)) << 1))
    if (f3 === 1) {
      decoded(str('c.sw'), F_S, 0, (h >> 3) & 15)
      setRs2(reg)
    } else {
      decoded(reg === 0 ? 0 : str('c.lw'), F_MEM, reg, (h >> 3) & 15)
    }
    return
  }
  const off7 = ((h >> 2) & 0x7f) << 1
  setImm(i16(off7))
  if (f3 === 2) {
    decoded(r9 === 0 ? 0 : str('c.lwsp'), F_C_LWSP, r9, 2)
  } else if (f3 === 3) {
    decoded(str('c.swsp'), F_C_SWSP, 0, 2)
    setRs2(r9)
  } else if (f3 === 4 && off7 !== 0 && r9 !== 0) {
    decoded(str('c.addi2spn'), F_C_RI, r9, 2)
  } else {
    illegal()
  }
}

/** A shift by 1 to 15 of a register that is not zero. */
function shiftC(name: u16, r: u16, amount: u16): void {
  if (amount > 15 || amount === 0 || r === 0) {
    illegal()
  } else {
    decoded(name, F_C_RI, r, r)
    setImm(i16(amount))
  }
}

/** Quadrant 1: small immediates, branches on zero, short jumps. */
function quadrant1(h: u16): void {
  const f3 = h >> 13
  const r = (h >> 9) & 15
  const raw6 = (h >> 3) & 63
  const imm6 = i16(wrap16(raw6 << 10)) >> 10
  setImm(imm6)
  switch ((f3 << 1) | ((h >> 2) & 1)) {
    case 0:
      if (r === 0) decoded(imm6 === 0 ? str('c.nop') : 0, F_NONE, 0, 0)
      else decoded(imm6 === 0 ? 0 : str('c.addi'), F_C_RI, r, r)
      break
    case 1:
      decoded(r === 0 ? 0 : str('c.li'), F_C_RI, r, 0)
      break
    case 2:
      shiftC(str('c.slli'), r, raw6)
      break
    case 3:
      shiftC(str('c.srli'), r, raw6)
      break
    case 4:
      shiftC(str('c.srai'), r, raw6)
      break
    case 5:
      // AND with all ones changes nothing.
      decoded(r === 0 || imm6 === -1 ? 0 : str('c.andi'), F_C_RI, r, r)
      break
    default:
      jumpsC(h, f3, r)
  }
}

function jumpsC(h: u16, f3: u16, r: u16): void {
  if (f3 === 3 || f3 === 4) {
    decoded(f3 === 3 ? str('c.beqz') : str('c.bnez'), F_C_B, 0, r)
    setImm(i16(wrap16(((h >> 2) & 0x7f) << 9)) >> 8)
  } else if (f3 === 5 || f3 === 6) {
    decoded(f3 === 5 ? str('c.j') : str('c.jal'), F_C_J, 0, 0)
    setImm(i16(wrap16(((h >> 2) & 0x7ff) << 5)) >> 4)
  } else {
    illegal()
  }
}

function pairName(form: u16): u16 {
  switch (form) {
    case 0:
      return str('c.mv')
    case 1:
      return str('c.add')
    case 2:
      return str('c.sub')
    case 3:
      return str('c.xor')
    case 4:
      return str('c.and')
    default:
      return str('c.or')
  }
}

/** Quadrant 2: register to register, and jumps through a register. */
function quadrant2(h: u16): void {
  const rd = (h >> 8) & 15
  const rs2 = (h >> 4) & 15
  const form = ((h >> 12) << 2) | ((h >> 2) & 3)
  setRs2(rs2)
  if (form === 8 || form === 9) {
    const ok = rd !== 0 && rs2 === 0
    decoded(!ok ? 0 : form === 8 ? str('c.jr') : str('c.jalr'), F_C_R, 0, rd)
  } else if (form === 10) {
    decoded(rd !== 0 || rs2 !== 0 ? 0 : str('c.ebreak'), F_NONE, 0, 0)
  } else {
    decoded(pairChanges(form, rd, rs2) ? pairName(form) : 0, F_C_RR, rd, rd)
  }
}

/**
 * Whether a register-to-register form is one: it writes a register, and changes it - a
 * register moved onto itself, or added, taken, XORed or ORed with zero, is unchanged.
 */
function pairChanges(form: u16, rd: u16, rs2: u16): bool {
  if (form > 5 || rd === 0) return false
  if (form === 0) return rd !== rs2
  return form === 4 || rs2 !== 0
}

function decode16(h: u16): void {
  poke16(D_SIZE, 2)
  const q = h & 3
  if (q === 0) quadrant0(h)
  else if (q === 1) quadrant1(h)
  else quadrant2(h)
}

/* ---------------- the text ---------------- */

/** `imm(rs1)` */
function emitOffset(): void {
  emitNumber(imm())
  emit(0x28)
  emitReg(peek16(D_RS1))
  emit(0x29)
}

/** The first operand: the register written, or for a store or a branch the one read. */
function emitFirst(format: u16, target: u16): void {
  if (format === F_S || format === F_C_SWSP) emitReg(peek16(D_RS2))
  else if (format === F_B || format === F_C_B || format === F_C_R) emitReg(peek16(D_RS1))
  else if (format === F_C_J) emitHex(target)
  else emitReg(peek16(D_RD))
}

/** What comes after the first operand and its comma. */
function emitRest(format: u16, target: u16): void {
  switch (format) {
    case F_R:
    case F_RQ:
      emitReg(peek16(D_RS1))
      comma()
      emitReg(peek16(D_RS2))
      if (format === F_RQ) {
        comma()
        emitNumber(imm())
      }
      break
    case F_I:
      emitReg(peek16(D_RS1))
      comma()
      emitNumber(imm())
      break
    case F_MEM:
    case F_S:
      emitOffset()
      break
    case F_UNARY:
      emitReg(peek16(D_RS1))
      break
    case F_B:
      emitReg(peek16(D_RS2))
      comma()
      emitHex(target)
      break
    case F_J:
    case F_C_B:
      emitHex(target)
      break
    case F_U:
      emitHex(peek16(D_IMM))
      break
    case F_C_RR:
      emitReg(peek16(D_RS2))
      break
    default:
      emitLast(format)
  }
}

function emitLast(format: u16): void {
  if (format === F_CSR || format === F_CSRI) {
    emitCsr(peek16(D_IMM))
    comma()
    if (format === F_CSR) emitReg(peek16(D_RS1))
    else emitUnsigned(peek16(D_RS1))
  } else {
    // C.LI and its kind, C.LWSP and C.SWSP: a number.
    emitNumber(imm())
  }
}

/**
 * The instruction at `at` as text at `out`, ended by a zero: the instruction's size. Read
 * with `peek`, as D reads (a byte of I/O is read as D reads it).
 */
export function disasmInto(at: u16, out: u16): u16 {
  poke16(OUT_AT, out)
  const lo = peek(at) | (peek(at + 1) << 8)
  if ((lo & 3) === 3) decode32(lo, peek(at + 2) | (peek(at + 3) << 8))
  else decode16(lo)
  const format = peek16(D_FORMAT)
  if (format === F_ILLEGAL) {
    emitStr(peek16(D_SIZE) === 2 ? str('.word ?') : str('.word ?, ?'))
  } else {
    emitStr(peek16(D_NAME))
    if (format !== F_NONE) {
      const target = u16(at + peek16(D_IMM))
      emit(0x20)
      emitFirst(format, target)
      // A short jump has its target as its only operand; a jump through a register its register.
      if (format !== F_C_J && format !== F_C_R) {
        comma()
        emitRest(format, target)
      }
    }
  }
  emit(0)
  return peek16(D_SIZE)
}

/* ---------------- U and B ---------------- */

/** U [addr]: a screenful of instructions, from addr or from where the last U stopped. */
export function unassemble(from: u16, given: bool): void {
  let at = given ? from : peek16(U_NEXT)
  for (let k: u16 = 1; k < peek16(ROWS); k++) {
    poke16(OUT_AT, LINEBUF)
    emitHex4(at)
    emit(0x20)
    at = u16(at + disasmInto(at, peek16(OUT_AT)))
    puts(LINEBUF)
    newline()
  }
  poke16(U_NEXT, at)
}

/** C.EBREAK: two bytes, so it fits over any instruction's start. */
const C_EBREAK = 0x200a

function breakAt(k: u16): u16 {
  return peek16(BREAKS + k * 2)
}

/**
 * B [addr]: a breakpoint at addr, or none there any more; then the list. Only RAM above the
 * work areas takes one (G writes it into the code). 0, or 1 when B cannot.
 */
export function breakCommand(at: u16, given: bool): u16 {
  if (given && !toggleBreak(at)) return 1
  listBreaks()
  return 0
}

/** A breakpoint at `at`, or none there any more: false when there is no room or no RAM. */
function toggleBreak(at: u16): bool {
  // Instructions sit on even addresses: C.EBREAK at an odd one would split one.
  if (at >= 0x8000 || at < 0x0800 || (at & 1) !== 0) return false
  let free: u16 = 4
  for (let k: u16 = 0; k < 4; k++) {
    if (breakAt(k) === at) {
      poke16(BREAKS + k * 2, 0)
      return true
    }
    if (breakAt(k) === 0 && free === 4) free = k
  }
  if (free === 4) return false
  poke16(BREAKS + free * 2, at)
  return true
}

function listBreaks(): void {
  poke16(OUT_AT, LINEBUF)
  let any = false
  for (let k: u16 = 0; k < 4; k++) {
    if (breakAt(k) !== 0) {
      if (any) emit(0x20)
      emitHex4(breakAt(k))
      any = true
    }
  }
  if (!any) emitStr(str('NO BREAKPOINTS'))
  emit(0)
  puts(LINEBUF)
  newline()
}

/** Before G runs code at `start`: C.EBREAK at every breakpoint but one there. */
export function armBreaks(start: u16): void {
  disarmBreaks()
  for (let k: u16 = 0; k < 4; k++) {
    const at = breakAt(k)
    if (at !== 0 && at !== start) {
      poke16(SAVED + k * 2, peek(at) | (peek(at + 1) << 8))
      poke(at, C_EBREAK & 0xff)
      poke(at + 1, C_EBREAK >> 8)
    }
  }
  poke16(ARMED, 1)
}

/** Back in the monitor, by a return, a break or a fault: the code as it was. */
export function disarmBreaks(): void {
  if (peek16(ARMED) === 0) return
  for (let k: u16 = 0; k < 4; k++) {
    const at = breakAt(k)
    if (at !== 0 && peek(at) === (C_EBREAK & 0xff) && peek(at + 1) === C_EBREAK >> 8) {
      const was = peek16(SAVED + k * 2)
      poke(at, was & 0xff)
      poke(at + 1, was >> 8)
    }
  }
  poke16(ARMED, 0)
}
