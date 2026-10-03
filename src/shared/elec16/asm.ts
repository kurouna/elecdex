/**
 * The E16 assembler (docs/elec16.md section 6): what the ROM is written in, and what e16c's
 * output and a card's .asm go through. Pure, so the build script, the page and vitest run the
 * same one.
 *
 * A line is `label: mnemonic operands ; comment`. Labels starting with a dot are local to the
 * last global label. Directives: .org .bank .byte .word .ascii .asciz .space .align .equ
 * (and `name = expr`), .include, .macro/.endm (parameters as \name, \@ a unique number),
 * .option compress / nocompress. Every source instruction is one machine instruction; with
 * compression on (the default) an instruction whose operands fit takes its 16-bit form,
 * found by passes that only ever shorten, so the layout settles.
 */

import { evaluate, stringBytes, Unresolved } from './asm-expr.js'
import {
  type COpName,
  compress,
  compressAs,
  ENCODINGS,
  encode32,
  fitsSigned,
  type OpName,
  REG_NAMES,
} from './isa.js'
import {
  BANK_COUNT,
  BANK_SIZE,
  BANK_WINDOW,
  ROM_FIXED,
  ROM_FIXED_SIZE,
  ROM_MAX,
  VRAM,
} from './map.js'
import { CSR_NAMES } from './state.js'

export interface AsmOptions {
  /** Shorten instructions that fit 16 bits (default true). */
  compress?: boolean
  /** The text of an included file, or null when there is none. */
  include?: (name: string) => string | null
  /** The source's name in errors and the listing. */
  file?: string
}

export interface AsmError {
  file: string
  line: number
  message: string
}

/** Assembled bytes at an address; `bank` for the bank window, null elsewhere. */
export interface AsmChunk {
  address: number
  bank: number | null
  bytes: Uint8Array
}

export interface ListingLine {
  address: number
  bank: number | null
  bytes: number[]
  file: string
  line: number
  text: string
}

export interface AsmResult {
  chunks: AsmChunk[]
  symbols: Map<string, number>
  errors: AsmError[]
  listing: ListingLine[]
}

interface Source {
  file: string
  line: number
  text: string
}

/** One instruction as planned: its operation, registers, and immediate still as text. */
interface Plan {
  op: OpName
  rd: number
  rs1: number
  rs2: number
  imm: string
  /** The immediate is a target address; the field holds its distance from the instruction. */
  relative: boolean
  /** A c.* mnemonic: it must take that 16-bit form. */
  form: COpName | null
  /** The value a csr...i instruction writes, still as text: it goes in the rs1 field. */
  uimm: string | null
}

type Item =
  | { kind: 'label'; src: Source; name: string }
  | { kind: 'equ'; src: Source; name: string; expr: string; scope: string }
  | { kind: 'org' | 'bank' | 'align'; src: Source; expr: string; scope: string }
  | { kind: 'space'; src: Source; size: string; fill: string; scope: string }
  | { kind: 'data'; src: Source; width: 1 | 2; values: string[]; scope: string }
  | { kind: 'option'; src: Source; compress: boolean }
  | { kind: 'inst'; src: Source; plan: Plan; scope: string; size: 2 | 4 }

const REGISTERS = new Map<string, number>()
REG_NAMES.forEach((name, k) => {
  REGISTERS.set(name, k)
  REGISTERS.set(`x${k}`, k)
})
REGISTERS.set('fp', 12)

function register(text: string): number {
  const r = REGISTERS.get(text.trim().toLowerCase())
  if (r === undefined) throw new Error(`"${text.trim()}" is not a register`)
  return r
}

/**
 * Calls `visit` with each character outside quotes ('c' and "text", with backslash escapes)
 * until it answers true; the index it stopped at, or -1.
 */
function outsideQuotes(text: string, visit: (ch: string, k: number) => boolean): number {
  let quote = ''
  for (let k = 0; k < text.length; k++) {
    const ch = text[k] ?? ''
    if (quote !== '') {
      if (ch === '\\') k++
      else if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") quote = ch
    else if (visit(ch, k)) return k
  }
  return -1
}

/** Splits operands at commas outside parentheses and quotes. */
function operands(text: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = 0
  outsideQuotes(text, (ch, k) => {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ',' && depth === 0) {
      out.push(text.slice(start, k).trim())
      start = k + 1
    }
    return false
  })
  const last = text.slice(start).trim()
  if (last !== '' || out.length > 0) out.push(last)
  return out
}

/** `offset(reg)`; a bare `(reg)` has offset 0. */
function memory(text: string): { offset: string; base: number } {
  const m = /^(.*)\(\s*([\w]+)\s*\)$/.exec(text.trim())
  if (m === null) throw new Error(`"${text}" is not offset(register)`)
  return { offset: (m[1] ?? '').trim() || '0', base: register(m[2] ?? '') }
}

function csrNumber(text: string): string {
  const named = CSR_NAMES[text.trim().toLowerCase() as keyof typeof CSR_NAMES]
  return named === undefined ? text : String(named)
}

const plan = (op: OpName, fields: Partial<Omit<Plan, 'op'>> = {}): Plan => ({
  op,
  rd: 0,
  rs1: 0,
  rs2: 0,
  imm: '0',
  relative: false,
  form: null,
  uimm: null,
  ...fields,
})

/* ---------------- operand forms ---------------- */

function count(args: string[], n: number, mnemonic: string): void {
  if (args.length !== n) throw new Error(`${mnemonic} takes ${n} operand${n === 1 ? '' : 's'}`)
}

/** An operation written as itself, by the shape of its encoding. */
function planBase(op: OpName, a: string[]): Plan {
  const format = ENCODINGS[op]?.format
  switch (format) {
    case 'R':
      count(a, 3, op)
      return plan(op, {
        rd: register(a[0] ?? ''),
        rs1: register(a[1] ?? ''),
        rs2: register(a[2] ?? ''),
      })
    case 'I':
      return planImmediate(op, a)
    case 'Ish':
      count(a, 3, op)
      return plan(op, { rd: register(a[0] ?? ''), rs1: register(a[1] ?? ''), imm: a[2] ?? '0' })
    case 'Iun':
      count(a, 2, op)
      return plan(op, { rd: register(a[0] ?? ''), rs1: register(a[1] ?? '') })
    case 'S': {
      count(a, 2, op)
      const m = memory(a[1] ?? '')
      return plan(op, { rs2: register(a[0] ?? ''), rs1: m.base, imm: m.offset })
    }
    case 'B':
      count(a, 3, op)
      return plan(op, {
        rs1: register(a[0] ?? ''),
        rs2: register(a[1] ?? ''),
        imm: a[2] ?? '0',
        relative: true,
      })
    default:
      return planOther(op, a)
  }
}

function planImmediate(op: OpName, a: string[]): Plan {
  if (op === 'jalr') return planJalr(a)
  if (op === 'lb' || op === 'lbu' || op === 'lw') {
    count(a, 2, op)
    const m = memory(a[1] ?? '')
    return plan(op, { rd: register(a[0] ?? ''), rs1: m.base, imm: m.offset })
  }
  count(a, 3, op)
  return plan(op, { rd: register(a[0] ?? ''), rs1: register(a[1] ?? ''), imm: a[2] ?? '0' })
}

function planJalr(a: string[]): Plan {
  if (a.length === 1) return plan('jalr', { rd: 1, rs1: register(a[0] ?? '') })
  if (a.length === 2 && (a[1] ?? '').includes('(')) {
    const m = memory(a[1] ?? '')
    return plan('jalr', { rd: register(a[0] ?? ''), rs1: m.base, imm: m.offset })
  }
  if (a.length === 2) return plan('jalr', { rd: register(a[0] ?? ''), rs1: register(a[1] ?? '') })
  count(a, 3, 'jalr')
  return plan('jalr', { rd: register(a[0] ?? ''), rs1: register(a[1] ?? ''), imm: a[2] ?? '0' })
}

function planOther(op: OpName, a: string[]): Plan {
  const format = ENCODINGS[op]?.format
  if (format === 'J') {
    if (a.length === 1) return plan('jal', { rd: 1, imm: a[0] ?? '0', relative: true })
    count(a, 2, op)
    return plan('jal', { rd: register(a[0] ?? ''), imm: a[1] ?? '0', relative: true })
  }
  if (format === 'U') {
    count(a, 2, op)
    return plan(op, { rd: register(a[0] ?? ''), imm: a[1] ?? '0' })
  }
  if (format === 'Isys') {
    count(a, 0, op)
    return plan(op)
  }
  count(a, 3, op)
  const value = format === 'Icsri' ? { uimm: a[2] ?? '0' } : { rs1: register(a[2] ?? '') }
  return plan(op, { rd: register(a[0] ?? ''), imm: csrNumber(a[1] ?? ''), ...value })
}

/** Makes a plan from operands, after checking how many there are. */
type Former = (a: string[], name: string) => Plan

/** A form that takes exactly `n` operands. */
const take =
  (n: number, make: (a: string[]) => Plan): Former =>
  (a, name) => {
    count(a, n, name)
    return make(a)
  }

const reg = (a: string[], k: number): number => register(a[k] ?? '')
const arg = (a: string[], k: number): string => a[k] ?? '0'

/** Pseudo-instructions: names for common uses of one real instruction. */
const PSEUDO: Record<string, Former> = {
  nop: take(0, () => plan('addi')),
  mv: take(2, (a) => plan('add', { rd: reg(a, 0), rs2: reg(a, 1) })),
  not: take(2, (a) => plan('xori', { rd: reg(a, 0), rs1: reg(a, 1), imm: '-1' })),
  neg: take(2, (a) => plan('sub', { rd: reg(a, 0), rs2: reg(a, 1) })),
  j: take(1, (a) => plan('jal', { imm: arg(a, 0), relative: true })),
  call: take(1, (a) => plan('jal', { rd: 1, imm: arg(a, 0), relative: true })),
  ret: take(0, () => plan('jalr', { rs1: 1 })),
  jr: take(1, (a) => plan('jalr', { rs1: reg(a, 0) })),
  la: take(2, (a) => plan('li', { rd: reg(a, 0), imm: arg(a, 1) })),
  beqz: take(2, (a) => zeroBranch('beq', a, false)),
  bnez: take(2, (a) => zeroBranch('bne', a, false)),
  bltz: take(2, (a) => zeroBranch('blt', a, false)),
  bgez: take(2, (a) => zeroBranch('bge', a, false)),
  blez: take(2, (a) => zeroBranch('bge', a, true)),
  bgtz: take(2, (a) => zeroBranch('blt', a, true)),
  bgt: take(3, (a) => swapped('blt', a)),
  ble: take(3, (a) => swapped('bge', a)),
  bgtu: take(3, (a) => swapped('bltu', a)),
  bleu: take(3, (a) => swapped('bgeu', a)),
  seqz: take(2, (a) => plan('sltiu', { rd: reg(a, 0), rs1: reg(a, 1), imm: '1' })),
  snez: take(2, (a) => plan('sltu', { rd: reg(a, 0), rs2: reg(a, 1) })),
  csrr: take(2, (a) => plan('csrrs', { rd: reg(a, 0), imm: csrNumber(a[1] ?? '') })),
  csrw: take(2, (a) => csrPseudo('csrrw', a, false)),
  csrs: take(2, (a) => csrPseudo('csrrs', a, false)),
  csrc: take(2, (a) => csrPseudo('csrrc', a, false)),
  csrwi: take(2, (a) => csrPseudo('csrrwi', a, true)),
  csrsi: take(2, (a) => csrPseudo('csrrsi', a, true)),
  csrci: take(2, (a) => csrPseudo('csrrci', a, true)),
}

/** A branch against zero: `beqz r, t` is beq r, zero, t (`swap` puts zero first). */
function zeroBranch(op: OpName, a: string[], swap: boolean): Plan {
  const r = reg(a, 0)
  return plan(op, { rs1: swap ? 0 : r, rs2: swap ? r : 0, imm: arg(a, 1), relative: true })
}

/** `bgt a, b, t` is blt b, a, t. */
const swapped = (op: OpName, a: string[]): Plan =>
  plan(op, { rs1: reg(a, 1), rs2: reg(a, 0), imm: arg(a, 2), relative: true })

function csrPseudo(op: OpName, a: string[], immediate: boolean): Plan {
  const value = immediate ? { uimm: arg(a, 1) } : { rs1: reg(a, 1) }
  return plan(op, { imm: csrNumber(a[0] ?? ''), ...value })
}

/** The compressed mnemonics, in the syntax the disassembler writes them. */
const SHORT: Record<string, Former> = {
  'c.nop': take(0, () => plan('addi')),
  'c.li': take(2, (a) => plan('addi', { rd: reg(a, 0), imm: arg(a, 1) })),
  'c.addi': take(2, (a) => inPlace('addi', a)),
  'c.andi': take(2, (a) => inPlace('andi', a)),
  'c.slli': take(2, (a) => inPlace('slli', a)),
  'c.srli': take(2, (a) => inPlace('srli', a)),
  'c.srai': take(2, (a) => inPlace('srai', a)),
  'c.addi2spn': take(2, (a) => plan('addi', { rd: reg(a, 0), rs1: 2, imm: arg(a, 1) })),
  'c.mv': take(2, (a) => plan('add', { rd: reg(a, 0), rs2: reg(a, 1) })),
  'c.add': take(2, (a) => twoRegisters('add', a)),
  'c.sub': take(2, (a) => twoRegisters('sub', a)),
  'c.xor': take(2, (a) => twoRegisters('xor', a)),
  'c.and': take(2, (a) => twoRegisters('and', a)),
  'c.or': take(2, (a) => twoRegisters('or', a)),
  'c.lw': (a) => planBase('lw', a),
  'c.sw': (a) => planBase('sw', a),
  'c.lwsp': take(2, (a) => onStack('lw', a)),
  'c.swsp': take(2, (a) => onStack('sw', a)),
  'c.beqz': take(2, (a) => zeroBranch('beq', a, false)),
  'c.bnez': take(2, (a) => zeroBranch('bne', a, false)),
  'c.j': take(1, (a) => plan('jal', { imm: arg(a, 0), relative: true })),
  'c.jal': take(1, (a) => plan('jal', { rd: 1, imm: arg(a, 0), relative: true })),
  'c.jr': take(1, (a) => plan('jalr', { rs1: reg(a, 0) })),
  'c.jalr': take(1, (a) => plan('jalr', { rd: 1, rs1: reg(a, 0) })),
  'c.ebreak': take(0, () => plan('ebreak')),
}

function inPlace(op: OpName, a: string[]): Plan {
  const r = register(a[0] ?? '')
  return plan(op, { rd: r, rs1: r, imm: a[1] ?? '0' })
}

function twoRegisters(op: OpName, a: string[]): Plan {
  const r = register(a[0] ?? '')
  return plan(op, { rd: r, rs1: r, rs2: register(a[1] ?? '') })
}

function onStack(op: 'lw' | 'sw', a: string[]): Plan {
  const offset = (a[1] ?? '').includes('(') ? memory(a[1] ?? '').offset : (a[1] ?? '0')
  const r = register(a[0] ?? '')
  return op === 'lw'
    ? plan('lw', { rd: r, rs1: 2, imm: offset })
    : plan('sw', { rs2: r, rs1: 2, imm: offset })
}

/** One source instruction as a plan; throws what is wrong with it. */
export function planInstruction(mnemonic: string, text: string): Plan {
  const name = mnemonic.toLowerCase()
  const args = operands(text)
  const short = SHORT[name]
  if (short !== undefined) return { ...short(args, name), form: name as COpName }
  const pseudo = PSEUDO[name]
  if (pseudo !== undefined) return pseudo(args, name)
  if (name in ENCODINGS) return planBase(name as OpName, args)
  throw new Error(`unknown instruction ${mnemonic}`)
}

/* ---------------- the source: includes, macros, lines ---------------- */

interface Macro {
  params: string[]
  body: Source[]
}

/** Strips a comment (; or //) outside quotes. */
function stripComment(text: string): string {
  const at = outsideQuotes(text, (ch, k) => ch === ';' || (ch === '/' && text[k + 1] === '/'))
  return at < 0 ? text : text.slice(0, at)
}

/** A label at the start of a line, and the space after it. */
const LABEL = /^([A-Za-z_.][\w.]*):\s*/

/**
 * The most a source may make: lines after expansion, and macro expansions. A source is a
 * person's file (IMPORT, the CODE view): a macro calling itself twice would otherwise expand
 * 2^32 times and hold whoever assembles it.
 */
const MAX_LINES = 200_000
const MAX_EXPANSIONS = 100_000
/** The most bytes `.space` and `.align` may lay down: all of memory, once. */
const MAX_SPACE = 0x10000

class Preprocessor {
  readonly lines: Source[] = []
  readonly errors: AsmError[] = []
  readonly #macros = new Map<string, Macro>()
  readonly #include: (name: string) => string | null
  #unique = 0
  #expansions = 0

  constructor(include: (name: string) => string | null) {
    this.#include = include
  }

  read(text: string, file: string, depth = 0): void {
    const raw = text.split(/\r?\n/)
    for (let k = 0; k < raw.length; k++) {
      const src = { file, line: k + 1, text: stripComment(raw[k] ?? '').trim() }
      const head = /^\.macro\s+([A-Za-z_][\w.]*)\s*(.*)$/i.exec(src.text)
      if (head !== null) {
        k = this.#define(head, raw, k, file)
        continue
      }
      this.#line(src, depth)
    }
  }

  #define(head: RegExpExecArray, raw: string[], start: number, file: string): number {
    const body: Source[] = []
    let k = start + 1
    for (; k < raw.length; k++) {
      const text = stripComment(raw[k] ?? '').trim()
      if (/^\.endm\b/i.test(text)) break
      body.push({ file, line: k + 1, text })
    }
    if (k >= raw.length)
      this.errors.push({ file, line: start + 1, message: '.macro without .endm' })
    const params = operands(head[2] ?? '').filter((p) => p !== '')
    // A parameter is a name: it goes into a pattern, and `\name` must find only it.
    const bad = params.find((p) => !/^[A-Za-z_]\w*$/.test(p))
    if (bad !== undefined) {
      this.errors.push({ file, line: start + 1, message: `"${bad}" is not a name` })
    }
    this.#macros.set((head[1] ?? '').toLowerCase(), { params, body })
    return k
  }

  #line(src: Source, depth: number): void {
    const inc = /^\.include\s+"([^"]+)"$/i.exec(src.text)
    if (inc !== null) {
      this.#includeFile(src, inc[1] ?? '', depth)
      return
    }
    // Labels first, as the parser takes them, so `push:` is a label even where push is a macro.
    let text = src.text
    const labels: string[] = []
    for (let label = LABEL.exec(text); label !== null; label = LABEL.exec(text)) {
      labels.push(label[1] ?? '')
      text = text.slice(label[0].length)
    }
    // A name then its arguments; `name = value` is not a call.
    const call = /^([A-Za-z_][\w.]*)(?:\s+(?!=)(.*))?$/.exec(text)
    const macro = call !== null ? this.#macros.get((call[1] ?? '').toLowerCase()) : undefined
    if (call === null || macro === undefined) {
      if (this.lines.length >= MAX_LINES) {
        this.#once(src, `the source makes more than ${MAX_LINES} lines`)
        return
      }
      this.lines.push(src)
      return
    }
    if (depth > 32) {
      this.#once(src, 'macros nest deeper than 32')
      return
    }
    if (labels.length > 0) this.lines.push({ ...src, text: labels.map((l) => `${l}:`).join(' ') })
    this.#expand(macro, operands(call[2] ?? ''), src, depth)
  }

  #includeFile(src: Source, name: string, depth: number): void {
    if (depth >= 16) {
      this.#once(src, 'includes nest deeper than 16')
      return
    }
    const text = this.#include(name)
    if (text === null) this.errors.push({ ...src, message: `cannot include ${name}` })
    else this.read(text, name, depth + 1)
  }

  /** An error said once for its line, however many times a loop of expansions meets it. */
  #once(src: Source, message: string): void {
    if (!this.errors.some((e) => e.message === message && e.line === src.line)) {
      this.errors.push({ file: src.file, line: src.line, message })
    }
  }

  #expand(macro: Macro, args: string[], at: Source, depth: number): void {
    if (++this.#expansions > MAX_EXPANSIONS) {
      this.#once(at, `macros expand more than ${MAX_EXPANSIONS} times`)
      return
    }
    const unique = String(this.#unique++)
    for (const line of macro.body) {
      let text = line.text.replace(/\\@/g, unique)
      macro.params.forEach((p, k) => {
        text = text.replace(new RegExp(`\\\\${p}\\b`, 'g'), args[k] ?? '')
      })
      this.#line({ file: at.file, line: at.line, text }, depth + 1)
    }
  }
}

/* ---------------- parsing lines into items ---------------- */

const DIRECTIVES = new Set([
  '.org',
  '.bank',
  '.align',
  '.byte',
  '.word',
  '.ascii',
  '.asciz',
  '.space',
  '.equ',
  '.option',
])

class Parser {
  readonly items: Item[] = []
  readonly errors: AsmError[] = []
  #scope = ''

  parse(lines: Source[]): void {
    for (const src of lines) {
      try {
        this.#parseLine(src)
      } catch (e) {
        this.errors.push({ file: src.file, line: src.line, message: (e as Error).message })
      }
    }
  }

  #parseLine(src: Source): void {
    let text = src.text
    for (let label = LABEL.exec(text); label !== null; label = LABEL.exec(text)) {
      this.#label(src, label[1] ?? '')
      text = text.slice(label[0].length)
    }
    if (text === '') return
    const equ = /^([A-Za-z_][\w.]*)\s*=\s*(.+)$/.exec(text)
    if (equ !== null) {
      this.items.push({
        kind: 'equ',
        src,
        name: equ[1] ?? '',
        expr: equ[2] ?? '',
        scope: this.#scope,
      })
      return
    }
    const m = /^(\S+)\s*(.*)$/.exec(text)
    const word = (m?.[1] ?? '').toLowerCase()
    const rest = m?.[2] ?? ''
    if (DIRECTIVES.has(word)) this.#directive(src, word, rest)
    else
      this.items.push({
        kind: 'inst',
        src,
        plan: planInstruction(word, rest),
        scope: this.#scope,
        size: 4,
      })
  }

  #label(src: Source, name: string): void {
    if (name.startsWith('.')) {
      this.items.push({ kind: 'label', src, name: `${this.#scope}${name}` })
      return
    }
    this.#scope = name
    this.items.push({ kind: 'label', src, name })
  }

  #directive(src: Source, word: string, rest: string): void {
    const scope = this.#scope
    const args = operands(rest)
    switch (word) {
      case '.org':
      case '.bank':
      case '.align':
        this.items.push({ kind: word.slice(1) as 'org' | 'bank' | 'align', src, expr: rest, scope })
        return
      case '.byte':
      case '.ascii':
        this.items.push({ kind: 'data', src, width: 1, values: args, scope })
        return
      case '.asciz':
        this.items.push({ kind: 'data', src, width: 1, values: [...args, '0'], scope })
        return
      case '.word':
        this.items.push({ kind: 'data', src, width: 2, values: args, scope })
        return
      case '.space':
        this.items.push({ kind: 'space', src, size: args[0] ?? '0', fill: args[1] ?? '0', scope })
        return
      case '.equ':
        count(args, 2, '.equ')
        this.items.push({ kind: 'equ', src, name: args[0] ?? '', expr: args[1] ?? '', scope })
        return
      default:
        this.#option(src, rest)
    }
  }

  #option(src: Source, rest: string): void {
    const o = rest.trim().toLowerCase()
    if (o !== 'compress' && o !== 'nocompress') throw new Error(`unknown option ${rest}`)
    this.items.push({ kind: 'option', src, compress: o === 'compress' })
  }
}

/* ---------------- layout and emission ---------------- */

/** Where the output lands: an address, and the bank when it is in the window. */
const keyOf = (address: number, bank: number | null): number =>
  bank === null ? address : 0x10000 * (bank + 1) + address

const inWindow = (address: number): boolean =>
  address >= BANK_WINDOW && address < BANK_WINDOW + BANK_SIZE

/** Passes in which a size may shrink; after them sizes only grow, up to the last pass. */
const SHRINK_PASSES = 16
const MAX_PASSES = 400

function sameSymbols(a: Map<string, number>, b: Map<string, number>): boolean {
  if (a.size !== b.size) return false
  for (const [name, value] of a) if (b.get(name) !== value) return false
  return true
}

/** A data value fits its width, signed or not. */
function fits(n: number, width: 1 | 2, directive: string): void {
  const bits = width * 8
  if (!(n >= -(2 ** (bits - 1)) && n < 2 ** bits)) {
    throw new Error(`${directive} takes ${-(2 ** (bits - 1))} to ${2 ** bits - 1}`)
  }
}

class Layout {
  readonly symbols = new Map<string, number>()
  readonly errors: AsmError[] = []
  readonly listing: ListingLine[] = []
  readonly #bytes = new Map<number, number>()
  readonly #items: Item[]
  readonly #compressDefault: boolean
  #address = 0
  #bank = 0
  #compress = true
  #emit = false
  /** Past the passes that may shrink: sizes only grow now, so the layout must end. */
  #growOnly = false
  /** An overlap is said once (see #put). */
  #overlapped = false
  /** Names defined in this pass, to find one defined twice. */
  readonly #defined = new Set<string>()

  constructor(items: Item[], compressDefault: boolean) {
    this.#items = items
    this.#compressDefault = compressDefault
  }

  /**
   * Passes until one changes no instruction's size and no symbol - nothing then moves - and
   * one that writes. A size is chosen afresh each pass, so one that shrank can grow back when
   * what shrank before it moved its target out of reach; after SHRINK_PASSES sizes only grow,
   * which ends (each instruction grows once).
   */
  run(): void {
    let settled = false
    for (let pass = 0; pass < MAX_PASSES && !settled; pass++) {
      this.#growOnly = pass >= SHRINK_PASSES
      const before = new Map(this.symbols)
      settled = !this.#pass() && sameSymbols(before, this.symbols)
    }
    this.#emit = true
    this.#pass()
    if (!settled) {
      const src = this.#items[0]?.src ?? { file: 'source', line: 1, text: '' }
      this.#error(src, 'the layout does not settle')
    }
  }

  get bytes(): Map<number, number> {
    return this.#bytes
  }

  #lookup(scope: string): (name: string) => number | undefined {
    return (name) => {
      const v = this.symbols.get(name.startsWith('.') ? `${scope}${name}` : name)
      if (v === undefined && REGISTERS.has(name.toLowerCase())) {
        throw new Error(`${name} is a register where a value was wanted`)
      }
      return v
    }
  }

  /** One pass over the items; true when an instruction changed size. */
  #pass(): boolean {
    this.#address = 0
    this.#bank = 0
    this.#compress = this.#compressDefault
    this.#defined.clear()
    let resized = false
    for (const item of this.#items) {
      try {
        if (this.#item(item)) resized = true
      } catch (e) {
        // Only the pass that writes reports: an earlier one sees addresses still moving.
        if (this.#emit) this.#error(item.src, (e as Error).message)
      }
    }
    return resized
  }

  #error(src: Source, message: string): void {
    if (
      !this.errors.some((e) => e.line === src.line && e.file === src.file && e.message === message)
    ) {
      this.errors.push({ file: src.file, line: src.line, message })
    }
  }

  #value(expr: string, scope: string): number {
    return evaluate(expr, this.#lookup(scope), this.#address)
  }

  #item(item: Item): boolean {
    switch (item.kind) {
      case 'label':
        this.#define(item.name, this.#address)
        return false
      case 'equ':
        this.#define(item.name, this.#value(item.expr, item.scope))
        return false
      case 'option':
        this.#compress = item.compress
        return false
      case 'inst':
        return this.#instruction(item)
      default:
        this.#placement(item)
        return false
    }
  }

  #define(name: string, value: number): void {
    if (this.#defined.has(name)) throw new Error(`${name} is defined twice`)
    this.#defined.add(name)
    this.symbols.set(name, value)
  }

  #placement(item: Exclude<Item, { kind: 'label' | 'equ' | 'option' | 'inst' }>): void {
    switch (item.kind) {
      case 'org':
        this.#address = this.#value(item.expr, item.scope) & 0xffff
        return
      case 'bank': {
        const bank = this.#value(item.expr, item.scope)
        if (!(bank >= 0 && bank < BANK_COUNT)) {
          throw new Error(`.bank takes 0 to ${BANK_COUNT - 1}`)
        }
        this.#bank = bank
        return
      }
      case 'align': {
        const n = this.#value(item.expr, item.scope)
        if (n > MAX_SPACE) {
          this.#error(item.src, `an alignment past ${hex(MAX_SPACE)}`)
          return
        }
        while (n > 0 && this.#address % n !== 0) this.#put(0, item.src, [])
        return
      }
      case 'space': {
        const size = this.#value(item.size, item.scope)
        const fill = this.#value(item.fill, item.scope)
        if (size > MAX_SPACE) {
          this.#error(item.src, `more space than memory has (${size} bytes)`)
          return
        }
        for (let k = 0; k < size; k++) this.#put(fill, item.src, [])
        return
      }
      case 'data':
        this.#data(item)
    }
  }

  #data(item: Extract<Item, { kind: 'data' }>): void {
    const start = this.#address
    const out: number[] = []
    for (const v of item.values) {
      if (v.startsWith('"')) {
        for (const b of stringBytes(v)) this.#put(b, item.src, out)
      } else this.#number(v, item, out)
    }
    this.#list(start, out, item.src)
  }

  /** One value of .byte or .word, little-endian; checked against its width when writing. */
  #number(v: string, item: Extract<Item, { kind: 'data' }>, out: number[]): void {
    const n = this.#emit ? this.#value(v, item.scope) : this.#tryValue(v, item.scope)
    if (this.#emit) fits(n, item.width, item.width === 1 ? '.byte' : '.word')
    this.#put(n & 0xff, item.src, out)
    if (item.width === 2) this.#put((n >> 8) & 0xff, item.src, out)
  }

  /** A value before every symbol is known: 0 stands in for one defined later. */
  #tryValue(expr: string, scope: string): number {
    try {
      return this.#value(expr, scope)
    } catch (e) {
      if (e instanceof Unresolved) return 0
      throw e
    }
  }

  #put(byte: number, src: Source, out: number[]): void {
    const bank = inWindow(this.#address) ? this.#bank : null
    if (this.#emit) {
      const key = keyOf(this.#address, bank)
      // The first overlap only: code run past the end of memory overlaps at every byte, and
      // each error is looked for among the others.
      if (this.#bytes.has(key) && !this.#overlapped) {
        this.#overlapped = true
        this.#error(src, `overlaps what is already at ${hex(this.#address)}`)
      }
      this.#bytes.set(key, byte & 0xff)
      out.push(byte & 0xff)
    }
    this.#address = (this.#address + 1) & 0xffff
  }

  #list(address: number, bytes: number[], src: Source): void {
    if (!this.#emit) return
    const bank = inWindow(address) ? this.#bank : null
    this.listing.push({ address, bank, bytes, file: src.file, line: src.line, text: src.text })
  }

  /** Places (and when writing, writes) an instruction; true when its size changed. */
  #instruction(item: Extract<Item, { kind: 'inst' }>): boolean {
    const start = this.#address
    try {
      if ((start & 1) !== 0) throw new Error(`an instruction at an odd address ${hex(start)}`)
      const fields = this.#fields(item.plan, item.scope)
      const short = fields === null ? null : shortForm(item.plan, fields)
      const size = this.#size(item, fields, short)
      const resized = size !== item.size
      item.size = size
      // Writing, every symbol is known: #fields throws rather than give null.
      if (this.#emit && fields !== null) this.#write(item, fields, short)
      return resized
    } finally {
      // Even when it is wrong, it takes its room, so what follows stays where it was.
      this.#address = (start + item.size) & 0xffff
    }
  }

  /**
   * The size this pass gives an instruction: a c.* form's is 2; otherwise short when it fits
   * and compression is on. Unknown yet, or writing, it keeps the size it has.
   */
  #size(item: Extract<Item, { kind: 'inst' }>, fields: Fields | null, short: number | null) {
    if (item.plan.form !== null) return 2
    if (fields === null || this.#emit) return item.size
    const size = this.#compress && short !== null ? 2 : 4
    return this.#growOnly && size < item.size ? item.size : size
  }

  /** The fields as the encoding holds them; null while a symbol is not known yet. */
  #fields(p: Plan, scope: string): Fields | null {
    const v = this.#known(p.imm, scope)
    const rs1 = p.uimm === null ? p.rs1 : this.#known(p.uimm, scope)
    if (v === null || rs1 === null) return null
    if (ENCODINGS[p.op]?.format === 'U' && !(v >= -0x8000 && v <= 0xffff)) {
      throw new Error(`${p.op} takes a value from -32768 to 65535`)
    }
    // A target: the distance to it, wrapping round the 64 KB address space.
    const imm = p.relative ? ((((v - this.#address) & 0xffff) + 0x8000) & 0xffff) - 0x8000 : v
    return { rd: p.rd, rs1, rs2: p.rs2, imm }
  }

  #known(expr: string, scope: string): number | null {
    try {
      return this.#value(expr, scope)
    } catch (e) {
      if (e instanceof Unresolved && !this.#emit) return null
      throw e
    }
  }

  #write(item: Extract<Item, { kind: 'inst' }>, fields: Fields, short: number | null): void {
    const start = this.#address
    const out: number[] = []
    if (item.size === 2) {
      if (short === null) throw new Error(`${describe(item.plan)} does not fit 16 bits`)
      this.#put(short & 0xff, item.src, out)
      this.#put(short >>> 8, item.src, out)
    } else {
      const word = encode32(item.plan.op, fields)
      for (let k = 0; k < 4; k++) this.#put((word >>> (8 * k)) & 0xff, item.src, out)
    }
    this.#list(start, out, item.src)
  }
}

type Fields = { rd: number; rs1: number; rs2: number; imm: number }

const describe = (p: Plan): string => p.form ?? p.op
const hex = (n: number): string => `0x${n.toString(16).toUpperCase().padStart(4, '0')}`

/** The 16-bit encoding of a planned instruction, or null. `li` small enough is c.li. */
function shortForm(p: Plan, f: Fields): number | null {
  if (p.form !== null) return compressAs(p.form, f)
  if (p.op === 'li') {
    const v = ((f.imm & 0xffff) << 16) >> 16
    return fitsSigned(v, 6) && f.rd !== 0 ? compress('addi', { ...f, rs1: 0, imm: v }) : null
  }
  return compress(p.op, f)
}

/* ---------------- the whole ---------------- */

export function assemble(source: string, options: AsmOptions = {}): AsmResult {
  const file = options.file ?? 'source'
  const pre = new Preprocessor(options.include ?? (() => null))
  pre.read(source, file)
  const parser = new Parser()
  parser.parse(pre.lines)
  const layout = new Layout(parser.items, options.compress ?? true)
  layout.run()
  return {
    chunks: chunksOf(layout.bytes),
    symbols: layout.symbols,
    errors: [...pre.errors, ...parser.errors, ...layout.errors],
    listing: layout.listing,
  }
}

/** Runs of consecutive bytes, in address order. */
function chunksOf(bytes: Map<number, number>): AsmChunk[] {
  const keys = [...bytes.keys()].sort((a, b) => a - b)
  const chunks: AsmChunk[] = []
  let start = -1
  let run: number[] = []
  const flush = () => {
    if (run.length === 0) return
    const bank = start >= 0x10000 ? Math.floor(start / 0x10000) - 1 : null
    chunks.push({ address: start & 0xffff, bank, bytes: Uint8Array.from(run) })
    run = []
  }
  for (const key of keys) {
    if (key !== start + run.length) {
      flush()
      start = key
    }
    run.push(bytes.get(key) ?? 0)
  }
  flush()
  return chunks
}

/**
 * The ROM image the machine boots: the fixed 16 KB, then each bank used. Bytes nobody wrote
 * read 0xFF, as an erased ROM does. Anything assembled outside the ROM is an error here.
 */
export function romImage(result: AsmResult): Uint8Array {
  let length = ROM_FIXED_SIZE
  for (const c of result.chunks) {
    if (c.bank !== null) length = Math.max(length, ROM_FIXED_SIZE + (c.bank + 1) * BANK_SIZE)
  }
  if (length > ROM_MAX) throw new RangeError('more banks than the ROM has')
  const image = new Uint8Array(length).fill(0xff)
  for (const c of result.chunks) {
    if (c.bank !== null)
      image.set(c.bytes, ROM_FIXED_SIZE + c.bank * BANK_SIZE + (c.address - BANK_WINDOW))
    else if (c.address >= ROM_FIXED && c.address + c.bytes.length <= BANK_WINDOW)
      image.set(c.bytes, c.address - ROM_FIXED)
    else throw new RangeError(`bytes at ${hex(c.address)} are not in the ROM`)
  }
  return image
}

/** Bytes assembled for RAM (below the ROM), as one block from `start`: e16c's and a card's. */
export function ramImage(result: AsmResult, start: number): Uint8Array {
  let end = start
  for (const c of result.chunks) {
    if (c.bank !== null || c.address < start || c.address + c.bytes.length > ROM_FIXED) {
      throw new RangeError(`bytes at ${hex(c.address)} are not in RAM from ${hex(start)}`)
    }
    end = Math.max(end, c.address + c.bytes.length)
  }
  const image = new Uint8Array(end - start)
  for (const c of result.chunks) image.set(c.bytes, c.address - start)
  return image
}

/** The LCD's memory is not somewhere code is assembled to. */
export const ASSEMBLY_LIMIT = VRAM
