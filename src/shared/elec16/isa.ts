/**
 * The E16 instruction set (docs/elec16.md section 4): every instruction's name, its encoding
 * in 32 bits and, where it has one, in 16, and the cycles it takes. The assembler, the
 * disassembler and the CPU all read this one table, so they cannot disagree.
 *
 * An instruction whose first half-word ends in binary 11 is 32 bits long; any other is a
 * 16-bit compressed one. A compressed instruction decodes to the same operation as its
 * 32-bit form (C.ADD rd, rs2 is ADD rd, rd, rs2) and keeps its own name for the disassembler.
 *
 * Pure: no DOM, no Node, no clock.
 */

/** Every operation, by the name the assembler and disassembler use. */
export const OPS = [
  'illegal',
  // integer, register
  'add',
  'sub',
  'and',
  'or',
  'xor',
  'sll',
  'srl',
  'sra',
  'slt',
  'sltu',
  // integer, immediate
  'addi',
  'andi',
  'ori',
  'xori',
  'slli',
  'srli',
  'srai',
  'slti',
  'sltiu',
  'li',
  'auipc',
  // loads and stores
  'lb',
  'lbu',
  'lw',
  'sb',
  'sw',
  // branches and jumps
  'beq',
  'bne',
  'blt',
  'bge',
  'bltu',
  'bgeu',
  'jal',
  'jalr',
  // multiply and divide
  'mul',
  'mulh',
  'mulhu',
  'mulhsu',
  'div',
  'divu',
  'rem',
  'remu',
  // bit manipulation
  'andn',
  'orn',
  'xnor',
  'clz',
  'ctz',
  'cpop',
  'min',
  'max',
  'minu',
  'maxu',
  'rol',
  'ror',
  'rori',
  'rev8',
  'sext.b',
  'zext.b',
  'bset',
  'bclr',
  'binv',
  'bext',
  'bseti',
  'bclri',
  'binvi',
  'bexti',
  // system
  'ecall',
  'ebreak',
  'wfi',
  'mret',
  'csrrw',
  'csrrs',
  'csrrc',
  'csrrwi',
  'csrrsi',
  'csrrci',
] as const
export type OpName = (typeof OPS)[number]

/** An operation's number: its place in OPS. */
export const OP = Object.fromEntries(OPS.map((name, k) => [name, k])) as Record<OpName, number>

/** The compressed forms, by the name the disassembler shows. */
export const C_OPS = [
  'c.lw',
  'c.sw',
  'c.lwsp',
  'c.swsp',
  'c.addi2spn',
  'c.addi',
  'c.nop',
  'c.li',
  'c.slli',
  'c.srli',
  'c.srai',
  'c.andi',
  'c.beqz',
  'c.bnez',
  'c.j',
  'c.jal',
  'c.mv',
  'c.add',
  'c.sub',
  'c.xor',
  'c.and',
  'c.or',
  'c.jr',
  'c.jalr',
  'c.ebreak',
] as const
export type COpName = (typeof C_OPS)[number]
export const C_OP = Object.fromEntries(C_OPS.map((name, k) => [name, k])) as Record<COpName, number>

/** One decoded instruction. Fields an operation does not use are 0. */
export interface Inst {
  /** The operation (an index into OPS); 0 for an illegal encoding. */
  op: number
  rd: number
  rs1: number
  rs2: number
  /** The immediate, as the operation uses it: signed where it is signed, an offset in bytes. */
  imm: number
  /** 2 or 4 bytes. */
  size: 2 | 4
  /** The compressed form's index in C_OPS, or -1 for a 32-bit instruction. */
  c: number
}

export const REG_NAMES = [
  'zero',
  'ra',
  'sp',
  'gp',
  'a0',
  'a1',
  'a2',
  'a3',
  't0',
  't1',
  't2',
  't3',
  's0',
  's1',
  's2',
  's3',
] as const

/* ---------------- the 32-bit encodings ---------------- */

/** The major opcodes: bits 6..2 of a 32-bit instruction. */
export const MAJOR = {
  load: 0,
  store: 1,
  opImm: 2,
  op: 3,
  branch: 4,
  jal: 5,
  jalr: 6,
  li: 7,
  auipc: 8,
  system: 9,
} as const

/** How an operation sits in 32 bits: its format, major opcode, funct3 and its extra selector. */
export type Format = 'R' | 'I' | 'S' | 'B' | 'U' | 'J' | 'Ish' | 'Iun' | 'Isys' | 'Icsr' | 'Icsri'
interface Encoding {
  format: Format
  major: number
  f3: number
  /** R: funct10. Ish / Iun: the selector in imm[13:4]. Isys: the whole immediate. */
  sel: number
}

const R = (f3: number, f10: number): Encoding => ({ format: 'R', major: MAJOR.op, f3, sel: f10 })
const I = (major: number, f3: number): Encoding => ({ format: 'I', major, f3, sel: 0 })

/** Every operation's 32-bit encoding (illegal has none). */
export const ENCODINGS: Partial<Record<OpName, Encoding>> = {
  add: R(0, 0),
  sll: R(1, 0),
  slt: R(2, 0),
  sltu: R(3, 0),
  xor: R(4, 0),
  srl: R(5, 0),
  or: R(6, 0),
  and: R(7, 0),
  sub: R(0, 1),
  sra: R(5, 1),
  mul: R(0, 2),
  mulh: R(1, 2),
  mulhsu: R(2, 2),
  mulhu: R(3, 2),
  div: R(4, 2),
  divu: R(5, 2),
  rem: R(6, 2),
  remu: R(7, 2),
  rol: R(1, 3),
  xnor: R(4, 3),
  ror: R(5, 3),
  orn: R(6, 3),
  andn: R(7, 3),
  min: R(4, 4),
  minu: R(5, 4),
  max: R(6, 4),
  maxu: R(7, 4),
  bset: R(0, 5),
  bclr: R(1, 5),
  binv: R(2, 5),
  bext: R(3, 5),
  addi: I(MAJOR.opImm, 0),
  slti: I(MAJOR.opImm, 2),
  sltiu: I(MAJOR.opImm, 3),
  xori: I(MAJOR.opImm, 4),
  ori: I(MAJOR.opImm, 6),
  andi: I(MAJOR.opImm, 7),
  // Shifts and single bits by an immediate: the amount in imm[3:0], the operation in imm[13:4].
  slli: { format: 'Ish', major: MAJOR.opImm, f3: 1, sel: 0 },
  bseti: { format: 'Ish', major: MAJOR.opImm, f3: 1, sel: 1 },
  bclri: { format: 'Ish', major: MAJOR.opImm, f3: 1, sel: 2 },
  binvi: { format: 'Ish', major: MAJOR.opImm, f3: 1, sel: 3 },
  srli: { format: 'Ish', major: MAJOR.opImm, f3: 5, sel: 0 },
  srai: { format: 'Ish', major: MAJOR.opImm, f3: 5, sel: 1 },
  rori: { format: 'Ish', major: MAJOR.opImm, f3: 5, sel: 2 },
  bexti: { format: 'Ish', major: MAJOR.opImm, f3: 5, sel: 3 },
  // One register in, one out: the operation in imm[13:4], imm[3:0] zero.
  clz: { format: 'Iun', major: MAJOR.opImm, f3: 1, sel: 0x10 },
  ctz: { format: 'Iun', major: MAJOR.opImm, f3: 1, sel: 0x11 },
  cpop: { format: 'Iun', major: MAJOR.opImm, f3: 1, sel: 0x12 },
  'sext.b': { format: 'Iun', major: MAJOR.opImm, f3: 1, sel: 0x13 },
  'zext.b': { format: 'Iun', major: MAJOR.opImm, f3: 1, sel: 0x14 },
  rev8: { format: 'Iun', major: MAJOR.opImm, f3: 1, sel: 0x15 },
  lb: I(MAJOR.load, 0),
  lw: I(MAJOR.load, 1),
  lbu: I(MAJOR.load, 4),
  sb: { format: 'S', major: MAJOR.store, f3: 0, sel: 0 },
  sw: { format: 'S', major: MAJOR.store, f3: 1, sel: 0 },
  beq: { format: 'B', major: MAJOR.branch, f3: 0, sel: 0 },
  bne: { format: 'B', major: MAJOR.branch, f3: 1, sel: 0 },
  blt: { format: 'B', major: MAJOR.branch, f3: 4, sel: 0 },
  bge: { format: 'B', major: MAJOR.branch, f3: 5, sel: 0 },
  bltu: { format: 'B', major: MAJOR.branch, f3: 6, sel: 0 },
  bgeu: { format: 'B', major: MAJOR.branch, f3: 7, sel: 0 },
  jal: { format: 'J', major: MAJOR.jal, f3: 0, sel: 0 },
  jalr: I(MAJOR.jalr, 0),
  li: { format: 'U', major: MAJOR.li, f3: 0, sel: 0 },
  auipc: { format: 'U', major: MAJOR.auipc, f3: 0, sel: 0 },
  ecall: { format: 'Isys', major: MAJOR.system, f3: 0, sel: 0 },
  ebreak: { format: 'Isys', major: MAJOR.system, f3: 0, sel: 1 },
  mret: { format: 'Isys', major: MAJOR.system, f3: 0, sel: 2 },
  wfi: { format: 'Isys', major: MAJOR.system, f3: 0, sel: 3 },
  csrrw: { format: 'Icsr', major: MAJOR.system, f3: 1, sel: 0 },
  csrrs: { format: 'Icsr', major: MAJOR.system, f3: 2, sel: 0 },
  csrrc: { format: 'Icsr', major: MAJOR.system, f3: 3, sel: 0 },
  csrrwi: { format: 'Icsri', major: MAJOR.system, f3: 5, sel: 0 },
  csrrsi: { format: 'Icsri', major: MAJOR.system, f3: 6, sel: 0 },
  csrrci: { format: 'Icsri', major: MAJOR.system, f3: 7, sel: 0 },
}

/** Sign-extends the low `bits` of `value`. */
export const signed = (value: number, bits: number): number => {
  const shift = 32 - bits
  return (value << shift) >> shift
}

/** Whether `value` fits `bits` as a signed number. */
export const fitsSigned = (value: number, bits: number): boolean =>
  value >= -(2 ** (bits - 1)) && value < 2 ** (bits - 1)

/** Whether `value` fits `bits` as an unsigned number. */
export const fitsUnsigned = (value: number, bits: number): boolean =>
  value >= 0 && value < 2 ** bits

const base = (e: Encoding): number => (e.major << 2) | 3 | (e.f3 << 11)

/**
 * The 32-bit word for an instruction, or an error when an operand does not fit. Branch and
 * jump immediates are byte offsets from the instruction; csr numbers sit in `imm`.
 */
export function encode32(name: OpName, i: Omit<Inst, 'op' | 'size' | 'c'>): number {
  const e = ENCODINGS[name]
  if (e === undefined) throw new RangeError(`${name} has no encoding`)
  return encodeAs(e, name, i) >>> 0
}

function encodeAs(e: Encoding, name: string, i: Omit<Inst, 'op' | 'size' | 'c'>): number {
  const rd = i.rd << 7
  const rs1 = i.rs1 << 14
  const rs2 = i.rs2 << 18
  switch (e.format) {
    case 'R':
      return base(e) | rd | rs1 | rs2 | (e.sel << 22)
    case 'I':
      need(fitsSigned(i.imm, 14), name, 'an immediate from -8192 to 8191')
      return base(e) | rd | rs1 | ((i.imm & 0x3fff) << 18)
    case 'Ish':
      need(fitsUnsigned(i.imm, 4), name, 'a shift or bit from 0 to 15')
      return base(e) | rd | rs1 | ((((e.sel << 4) | i.imm) & 0x3fff) << 18)
    case 'Iun':
      return base(e) | rd | rs1 | ((e.sel << 4) << 18)
    case 'Isys':
      return base(e) | (e.sel << 18)
    case 'Icsr':
    case 'Icsri':
      return encodeCsr(e, name, i)
    case 'S':
      need(fitsSigned(i.imm, 14), name, 'an offset from -8192 to 8191')
      return base(e) | ((i.imm & 15) << 7) | rs1 | rs2 | (((i.imm >> 4) & 0x3ff) << 22)
    case 'B':
      need(fitsSigned(i.imm, 15) && (i.imm & 1) === 0, name, 'an even offset within 16 KB')
      return base(e) | (((i.imm >> 1) & 15) << 7) | rs1 | rs2 | (((i.imm >> 5) & 0x3ff) << 22)
    case 'U':
      need(fitsUnsigned(i.imm & 0xffff, 16), name, 'a 16-bit value')
      return base(e) | rd | ((i.imm & 0xffff) << 11)
    case 'J':
      need((i.imm & 1) === 0, name, 'an even offset')
      return base(e) | rd | (((i.imm >> 1) & 0xffff) << 11)
  }
}

function encodeCsr(e: Encoding, name: string, i: Omit<Inst, 'op' | 'size' | 'c'>): number {
  need(fitsUnsigned(i.imm, 12), name, 'a csr number from 0 to 4095')
  if (e.format === 'Icsri') need(fitsUnsigned(i.rs1, 4), name, 'an immediate from 0 to 15')
  return base(e) | (i.rd << 7) | (i.rs1 << 14) | (i.imm << 18)
}

function need(ok: boolean, name: string, what: string): void {
  if (!ok) throw new RangeError(`${name} takes ${what}`)
}

/* ---------------- decoding ---------------- */

const ILLEGAL = (size: 2 | 4): Inst => ({ op: 0, rd: 0, rs1: 0, rs2: 0, imm: 0, size, c: -1 })

/** Looks an encoding up by its fields: built once from ENCODINGS. */
const R_TABLE = new Map<number, number>()
const SH_TABLE = new Map<number, number>()
const I_TABLE = new Map<number, number>()
for (const [name, e] of Object.entries(ENCODINGS) as [OpName, Encoding][]) {
  const op = OP[name]
  if (e.format === 'R') R_TABLE.set((e.sel << 3) | e.f3, op)
  else if (e.format === 'Ish' || e.format === 'Iun') SH_TABLE.set((e.f3 << 10) | e.sel, op)
  else I_TABLE.set((e.major << 8) | (e.format === 'Isys' ? 0x80 | e.sel : e.f3), op)
}

/**
 * One instruction from its first half-word `lo` and the next, `hi` (read only for a 32-bit
 * instruction). An encoding E16 does not have decodes as `illegal`, with its size.
 */
export function decode(lo: number, hi: number): Inst {
  if ((lo & 3) !== 3) return decode16(lo & 0xffff)
  return decode32((((hi & 0xffff) << 16) | (lo & 0xffff)) >>> 0)
}

function decode32(w: number): Inst {
  const major = (w >>> 2) & 31
  const rd = (w >>> 7) & 15
  const f3 = (w >>> 11) & 7
  const rs1 = (w >>> 14) & 15
  const rs2 = (w >>> 18) & 15
  const inst = (op: number, imm: number, r1 = rs1, r2 = rs2, d = rd): Inst => ({
    op: op ?? 0,
    rd: d,
    rs1: r1,
    rs2: r2,
    imm,
    size: 4,
    c: -1,
  })
  switch (major) {
    case MAJOR.op: {
      const op = R_TABLE.get((((w >>> 22) & 0x3ff) << 3) | f3)
      return op === undefined ? ILLEGAL(4) : inst(op, 0)
    }
    case MAJOR.opImm:
      return decodeOpImm(w, rd, f3, rs1)
    case MAJOR.load:
    case MAJOR.jalr: {
      const op = I_TABLE.get((major << 8) | f3)
      return op === undefined ? ILLEGAL(4) : inst(op, signed(w >>> 18, 14), rs1, 0)
    }
    case MAJOR.store: {
      const op = I_TABLE.get((major << 8) | f3)
      const imm = signed((((w >>> 22) & 0x3ff) << 4) | rd, 14)
      return op === undefined ? ILLEGAL(4) : inst(op, imm, rs1, rs2, 0)
    }
    case MAJOR.branch: {
      const op = I_TABLE.get((major << 8) | f3)
      const imm = signed((((w >>> 22) & 0x3ff) << 5) | (rd << 1), 15)
      return op === undefined ? ILLEGAL(4) : inst(op, imm, rs1, rs2, 0)
    }
    case MAJOR.li:
    case MAJOR.auipc:
    case MAJOR.jal:
      return decodeUpper(w, major, rd)
    case MAJOR.system:
      return decodeSystem(w, rd, f3, rs1)
    default:
      return ILLEGAL(4)
  }
}

function decodeOpImm(w: number, rd: number, f3: number, rs1: number): Inst {
  const imm14 = (w >>> 18) & 0x3fff
  if (f3 === 1 || f3 === 5) {
    const sel = imm14 >>> 4
    const op = SH_TABLE.get((f3 << 10) | sel)
    if (op === undefined) return ILLEGAL(4)
    const unary = ENCODINGS[OPS[op] as OpName]?.format === 'Iun'
    if (unary && (imm14 & 15) !== 0) return ILLEGAL(4)
    return { op, rd, rs1, rs2: 0, imm: unary ? 0 : imm14 & 15, size: 4, c: -1 }
  }
  const op = I_TABLE.get((MAJOR.opImm << 8) | f3)
  if (op === undefined) return ILLEGAL(4)
  return { op, rd, rs1, rs2: 0, imm: signed(imm14, 14), size: 4, c: -1 }
}

function decodeUpper(w: number, major: number, rd: number): Inst {
  // Bits 31..27 are reserved and must be zero, so they can mean something one day.
  if (w >>> 27 !== 0) return ILLEGAL(4)
  const field = (w >>> 11) & 0xffff
  const op = major === MAJOR.li ? OP.li : major === MAJOR.auipc ? OP.auipc : OP.jal
  const imm = major === MAJOR.jal ? signed(field << 1, 17) : field
  return { op, rd, rs1: 0, rs2: 0, imm, size: 4, c: -1 }
}

function decodeSystem(w: number, rd: number, f3: number, rs1: number): Inst {
  const imm14 = (w >>> 18) & 0x3fff
  if (f3 === 0) {
    const op = I_TABLE.get((MAJOR.system << 8) | 0x80 | imm14)
    // The other fields of ECALL and its kind must be zero.
    if (op === undefined || rd !== 0 || rs1 !== 0) return ILLEGAL(4)
    return { op, rd: 0, rs1: 0, rs2: 0, imm: 0, size: 4, c: -1 }
  }
  const op = I_TABLE.get((MAJOR.system << 8) | f3)
  if (op === undefined || imm14 > 0xfff) return ILLEGAL(4)
  return { op, rd, rs1, rs2: 0, imm: imm14, size: 4, c: -1 }
}

/* ---------------- the 16-bit forms ---------------- */

const C = (c: COpName, op: OpName, rd: number, rs1: number, rs2: number, imm: number): Inst => ({
  op: OP[op],
  rd,
  rs1,
  rs2,
  imm,
  size: 2,
  c: C_OP[c],
})

const SP = 2
const RA = 1

function decode16(h: number): Inst {
  switch (h & 3) {
    case 0:
      return decodeQ0(h)
    case 1:
      return decodeQ1(h)
    default:
      return decodeQ2(h)
  }
}

/** Quadrant 0: loads and stores, and an address on the stack. */
function decodeQ0(h: number): Inst {
  const f3 = h >>> 13
  const r9 = (h >>> 9) & 15
  const off7 = ((h >>> 2) & 0x7f) << 1
  switch (f3) {
    case 0:
    case 1: {
      const reg = (h >>> 7) & 15
      const rs1 = (h >>> 3) & 15
      // A 3-bit offset in half-words: its top two bits at 12..11, its lowest at 2.
      const off = ((((h >>> 11) & 3) << 1) | ((h >>> 2) & 1)) << 1
      if (f3 === 0) return reg === 0 ? ILLEGAL(2) : C('c.lw', 'lw', reg, rs1, 0, off)
      return C('c.sw', 'sw', 0, rs1, reg, off)
    }
    case 2:
      return r9 === 0 ? ILLEGAL(2) : C('c.lwsp', 'lw', r9, SP, 0, off7)
    case 3:
      return C('c.swsp', 'sw', 0, SP, r9, off7)
    case 4:
      return off7 === 0 || r9 === 0 ? ILLEGAL(2) : C('c.addi2spn', 'addi', r9, SP, 0, off7)
    default:
      return ILLEGAL(2)
  }
}

/** Quadrant 1: small immediates, branches on zero, short jumps. */
function decodeQ1(h: number): Inst {
  const f3 = h >>> 13
  const r = (h >>> 9) & 15
  const raw6 = (h >>> 3) & 63
  const imm6 = signed(raw6, 6)
  const sub = (h >>> 2) & 1
  switch ((f3 << 1) | sub) {
    case 0:
      if (r === 0) return imm6 === 0 ? C('c.nop', 'addi', 0, 0, 0, 0) : ILLEGAL(2)
      // Adding nothing is not an instruction: each encoding means one thing (c.nop is rd 0).
      return imm6 === 0 ? ILLEGAL(2) : C('c.addi', 'addi', r, r, 0, imm6)
    case 1:
      return r === 0 ? ILLEGAL(2) : C('c.li', 'addi', r, 0, 0, imm6)
    case 2:
      return shiftC('c.slli', 'slli', r, raw6)
    case 3:
      return shiftC('c.srli', 'srli', r, raw6)
    case 4:
      return shiftC('c.srai', 'srai', r, raw6)
    case 5:
      return r === 0 ? ILLEGAL(2) : C('c.andi', 'andi', r, r, 0, imm6)
    default:
      return decodeQ1Jumps(h, f3, r)
  }
}

/** A shift by 0 to 15: the amount's top two bits must be clear. */
const shiftC = (c: COpName, op: OpName, r: number, amount: number): Inst =>
  amount > 15 || r === 0 ? ILLEGAL(2) : C(c, op, r, r, 0, amount)

function decodeQ1Jumps(h: number, f3: number, r: number): Inst {
  const off8 = signed(((h >>> 2) & 0x7f) << 1, 8)
  const off12 = signed(((h >>> 2) & 0x7ff) << 1, 12)
  switch (f3) {
    case 3:
      return C('c.beqz', 'beq', 0, r, 0, off8)
    case 4:
      return C('c.bnez', 'bne', 0, r, 0, off8)
    case 5:
      return C('c.j', 'jal', 0, 0, 0, off12)
    case 6:
      return C('c.jal', 'jal', RA, 0, 0, off12)
    default:
      return ILLEGAL(2)
  }
}

/**
 * Quadrant 2's forms by funct4 and funct2: the compressed name, the operation, and which
 * registers it takes. Register-to-register forms write rd and need it; the jumps take their
 * register in the rd field and need rs2 clear; EBREAK takes none.
 */
const Q2: Record<number, { c: COpName; op: OpName; kind: 'rr' | 'mv' | 'jump' | 'none' }> = {
  0: { c: 'c.mv', op: 'add', kind: 'mv' },
  1: { c: 'c.add', op: 'add', kind: 'rr' },
  2: { c: 'c.sub', op: 'sub', kind: 'rr' },
  3: { c: 'c.xor', op: 'xor', kind: 'rr' },
  4: { c: 'c.and', op: 'and', kind: 'rr' },
  5: { c: 'c.or', op: 'or', kind: 'rr' },
  8: { c: 'c.jr', op: 'jalr', kind: 'jump' },
  9: { c: 'c.jalr', op: 'jalr', kind: 'jump' },
  10: { c: 'c.ebreak', op: 'ebreak', kind: 'none' },
}

/** Quadrant 2: register to register, and jumps through a register. */
function decodeQ2(h: number): Inst {
  const rd = (h >>> 8) & 15
  const rs2 = (h >>> 4) & 15
  const form = Q2[((h >>> 12) << 2) | ((h >>> 2) & 3)]
  if (form === undefined) return ILLEGAL(2)
  switch (form.kind) {
    case 'mv':
      return rd === 0 ? ILLEGAL(2) : C(form.c, form.op, rd, 0, rs2, 0)
    case 'rr':
      return rd === 0 ? ILLEGAL(2) : C(form.c, form.op, rd, rd, rs2, 0)
    case 'jump':
      if (rd === 0 || rs2 !== 0) return ILLEGAL(2)
      return C(form.c, form.op, form.c === 'c.jr' ? 0 : RA, rd, 0, 0)
    case 'none':
      return rd !== 0 || rs2 !== 0 ? ILLEGAL(2) : C(form.c, form.op, 0, 0, 0, 0)
  }
}

type Operands = Omit<Inst, 'op' | 'size' | 'c'>

/** Whether the operands are one register written and read (rd = rd op ...), and not zero. */
const inPlace = (i: Operands): boolean => i.rd !== 0 && i.rd === i.rs1

const isEven = (value: number): boolean => (value & 1) === 0

const quad1 = (sel: number, r: number, imm: number): number =>
  ((sel >> 1) << 13) | (r << 9) | ((imm & 63) << 3) | ((sel & 1) << 2) | 1

const quad2 = (f4: number, rd: number, rs2: number, f2: number): number =>
  (f4 << 12) | (rd << 8) | (rs2 << 4) | (f2 << 2) | 2

/** CL / CS: a 3-bit offset in half-words, its top two bits at 12..11 and its lowest at 2. */
function memoryShort(f3: 0 | 1, reg: number, i: Operands): number | null {
  if (!fitsUnsigned(i.imm, 4) || !isEven(i.imm)) return null
  const off = i.imm >> 1
  return (f3 << 13) | ((off >> 1) << 11) | (reg << 7) | (i.rs1 << 3) | ((off & 1) << 2)
}

/** On the stack: a 7-bit offset in half-words. */
function stackShort(f3: 2 | 3, reg: number, i: Operands): number | null {
  if (i.rs1 !== SP || !fitsUnsigned(i.imm, 8) || !isEven(i.imm)) return null
  return (f3 << 13) | (reg << 9) | ((i.imm >> 1) << 2)
}

const shiftShort = (sel: number) => (i: Operands) =>
  inPlace(i) && fitsUnsigned(i.imm, 4) ? quad1(sel, i.rd, i.imm) : null

const pairShort = (f4: number, f2: number) => (i: Operands) =>
  inPlace(i) ? quad2(f4, i.rd, i.rs2, f2) : null

function branchShort(f3: 3 | 4, i: Operands): number | null {
  if (i.rs2 !== 0 || !fitsSigned(i.imm, 8) || !isEven(i.imm)) return null
  return (f3 << 13) | (i.rs1 << 9) | (((i.imm >> 1) & 0x7f) << 2) | 1
}

function jumpShort(rd: 0 | 1, i: Operands): number | null {
  if (i.rd !== rd || !fitsSigned(i.imm, 12) || !isEven(i.imm)) return null
  return ((rd === 0 ? 5 : 6) << 13) | (((i.imm >> 1) & 0x7ff) << 2) | 1
}

function addi2spn(i: Operands): number | null {
  if (i.rd === 0 || i.rs1 !== SP || !(i.imm > 0) || !fitsUnsigned(i.imm, 8) || !isEven(i.imm)) {
    return null
  }
  return (4 << 13) | (i.rd << 9) | ((i.imm >> 1) << 2)
}

/** Each compressed form's encoder: the 16 bits, or null when the operands do not fit it. */
const FORMS: Record<COpName, (i: Operands) => number | null> = {
  'c.lw': (i) => (i.rd === 0 ? null : memoryShort(0, i.rd, i)),
  'c.sw': (i) => memoryShort(1, i.rs2, i),
  'c.lwsp': (i) => (i.rd === 0 ? null : stackShort(2, i.rd, i)),
  'c.swsp': (i) => stackShort(3, i.rs2, i),
  'c.addi2spn': addi2spn,
  'c.addi': (i) =>
    inPlace(i) && i.imm !== 0 && fitsSigned(i.imm, 6) ? quad1(0, i.rd, i.imm) : null,
  'c.nop': (i) => (i.rd === 0 && i.rs1 === 0 && i.imm === 0 ? 1 : null),
  'c.li': (i) => (i.rd !== 0 && i.rs1 === 0 && fitsSigned(i.imm, 6) ? quad1(1, i.rd, i.imm) : null),
  'c.slli': shiftShort(2),
  'c.srli': shiftShort(3),
  'c.srai': shiftShort(4),
  'c.andi': (i) => (inPlace(i) && fitsSigned(i.imm, 6) ? quad1(5, i.rd, i.imm) : null),
  'c.beqz': (i) => branchShort(3, i),
  'c.bnez': (i) => branchShort(4, i),
  'c.j': (i) => jumpShort(0, i),
  'c.jal': (i) => jumpShort(1, i),
  'c.mv': (i) => (i.rd !== 0 && i.rs1 === 0 ? quad2(0, i.rd, i.rs2, 0) : null),
  'c.add': pairShort(0, 1),
  'c.sub': pairShort(0, 2),
  'c.xor': pairShort(0, 3),
  'c.and': pairShort(1, 0),
  'c.or': pairShort(1, 1),
  'c.jr': (i) => (i.rd === 0 && i.rs1 !== 0 && i.imm === 0 ? quad2(2, i.rs1, 0, 0) : null),
  'c.jalr': (i) => (i.rd === RA && i.rs1 !== 0 && i.imm === 0 ? quad2(2, i.rs1, 0, 1) : null),
  'c.ebreak': () => quad2(2, 0, 0, 2),
}

/** The forms an operation may shorten to, in the order they are tried. */
const SHORTENS: Partial<Record<OpName, readonly COpName[]>> = {
  lw: ['c.lwsp', 'c.lw'],
  sw: ['c.swsp', 'c.sw'],
  addi: ['c.nop', 'c.li', 'c.addi', 'c.addi2spn'],
  add: ['c.mv', 'c.add'],
  sub: ['c.sub'],
  xor: ['c.xor'],
  and: ['c.and'],
  or: ['c.or'],
  andi: ['c.andi'],
  slli: ['c.slli'],
  srli: ['c.srli'],
  srai: ['c.srai'],
  beq: ['c.beqz'],
  bne: ['c.bnez'],
  jal: ['c.j', 'c.jal'],
  jalr: ['c.jr', 'c.jalr'],
  ebreak: ['c.ebreak'],
}

/** The operation a compressed form shortens: what it decodes to. */
export const FORM_OF: Record<COpName, OpName> = Object.fromEntries(
  Object.entries(SHORTENS).flatMap(([op, forms]) => (forms ?? []).map((f) => [f, op])),
) as Record<COpName, OpName>

/** One compressed form's 16 bits for these operands, or null when they do not fit it. */
export function compressAs(form: COpName, i: Operands): number | null {
  return FORMS[form](i)
}

/**
 * The 16-bit form of an instruction, or null when it has none or its operands do not fit.
 * The assembler asks this for every instruction it may shorten; what it gives back decodes
 * to the same operation (a unit test round-trips them all).
 */
export function compress(name: OpName, i: Operands): number | null {
  for (const form of SHORTENS[name] ?? []) {
    const half = FORMS[form](i)
    if (half !== null) return half
  }
  return null
}

/* ---------------- cycles ---------------- */

/** What each operation costs, compressed or not (docs/elec16.md section 4). */
export function cyclesOf(op: number, taken: boolean): number {
  const name = OPS[op]
  switch (name) {
    case 'lb':
    case 'lbu':
    case 'lw':
    case 'sb':
    case 'sw':
    case 'csrrw':
    case 'csrrs':
    case 'csrrc':
    case 'csrrwi':
    case 'csrrsi':
    case 'csrrci':
    case 'jal':
    case 'jalr':
      return 2
    case 'mul':
    case 'mulh':
    case 'mulhu':
    case 'mulhsu':
      return 4
    case 'div':
    case 'divu':
    case 'rem':
    case 'remu':
      return 18
    case 'beq':
    case 'bne':
    case 'blt':
    case 'bge':
    case 'bltu':
    case 'bgeu':
      return taken ? 2 : 1
    default:
      return 1
  }
}
