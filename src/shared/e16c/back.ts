import { callLines, O1, REGISTER } from './back1.js'
import type { BinOp, Fn, Op, Program } from './ir.js'
import { hex } from './types.js'

/**
 * e16c's back end (docs/elec16.md section 6, e16c): stack code to E16 assembly the ROM's
 * assembler reads. Readable on purpose - a function's label is its name, every statement is
 * preceded by its source line, every slot named - since the generated assembly is what is
 * built and shipped, and what CORE shows.
 *
 * The calling convention is the ROM's: arguments in a0-a3, the answer in a0, s0-s3 kept. A
 * function keeps its locals in a frame under fp (s0), saved with ra on entry. At -O0 the
 * expression stack is the machine's stack: every value pushed and popped through t0 and t1.
 */

/** Each operation on t0 and t1 into t0: the -O1 table's, with its registers fixed. */
const BIN = Object.fromEntries(
  Object.entries(REGISTER).map(([op, lines]) => [
    op,
    lines.map((l) => l.replace(/\$d|\$a/g, 't0').replace(/\$b/g, 't1')),
  ]),
) as Record<BinOp, string[]>

const UN: Record<'neg' | 'not' | 'lnot', string> = {
  neg: 'neg t0, t0',
  not: 'not t0, t0',
  lnot: 'seqz t0, t0',
}

const ARG_REGS = ['a0', 'a1', 'a2', 'a3']

/** Addresses below this are reached as `x(zero)`, one instruction (a 14-bit offset). */
const NEAR = 0x2000

class Out {
  readonly lines: string[] = []

  line(text: string): void {
    this.lines.push(`  ${text}`)
  }

  label(name: string): void {
    this.lines.push(`${name}:`)
  }

  comment(text: string): void {
    this.lines.push(`  ; ${text}`)
  }

  raw(text: string): void {
    this.lines.push(text)
  }

  push(reg: string): void {
    this.line('addi sp, sp, -2')
    this.line(`sw ${reg}, 0(sp)`)
  }

  pop(reg: string): void {
    this.line(`lw ${reg}, 0(sp)`)
    this.line('addi sp, sp, 2')
  }

  /** A load or store at a fixed address. */
  absolute(op: 'lw' | 'lbu' | 'sw' | 'sb', reg: string, at: number): void {
    if (at < NEAR) {
      this.line(`${op} ${reg}, ${hex(at)}(zero)`)
      return
    }
    this.line(`li t2, ${hex(at)}`)
    this.line(`${op} ${reg}, 0(t2)`)
  }
}

export interface Assembly {
  text: string
}

/**
 * The whole program as one assembly source, its functions at -O0 or -O1: the fixed ROM's
 * part, `e16c_fixed_end`, and then each bank a file goes in, at the window. So the file is
 * the last thing the ROM includes.
 */
export function assembly(program: Program, sources: string[], level: 0 | 1 = 0): string {
  const out = new Out()
  out.raw(`; Made by e16c from ${sources.join(', ')}: do not edit.`)
  out.raw('')
  data(out, program)
  init(out, program)
  // RAM arrays low enough for an instruction's offset: -O1 adds an index to them there.
  const near = new Map(
    program.arrays.filter((a) => a.at + a.bytes < 0x2000).map((a) => [a.name, a.at]),
  )
  const banks = new Map(program.fns.map((f) => [f.name, f.bank]))
  const section = (bank: number | null) => {
    for (const fn of program.fns.filter((f) => f.bank === bank)) {
      if (level === 0) func(out, fn, banks)
      else for (const line of new O1(fn, near, banks).emit()) out.raw(line)
    }
    strings(out, program, bank)
  }
  section(null)
  const used = [...new Set([...program.fns, ...program.strings].map((x) => x.bank))]
  const banked = used.filter((b): b is number => b !== null).sort((a, b) => a - b)
  out.label('e16c_fixed_end')
  for (const bank of banked) {
    out.raw('')
    out.line(`.bank ${bank}`)
    out.line('.org 0xc000')
    section(bank)
  }
  return `${out.lines.join('\n')}\n`
}

function data(out: Out, program: Program): void {
  for (const g of program.globals) out.raw(`; ${g.name} at ${hex(g.at)}`)
  for (const a of program.arrays) out.raw(`${a.name} = ${hex(a.at)} ; ${a.bytes} bytes`)
  out.raw('')
}

/** e16c_init: the globals' first values, and the arrays cleared. Called once before the rest. */
function init(out: Out, program: Program): void {
  out.label('e16c_init')
  for (const g of program.globals) {
    out.comment(`${g.name} = ${g.init}`)
    out.line(`li t0, ${g.init & 0xffff}`)
    out.absolute(g.byte ? 'sb' : 'sw', 't0', g.at)
  }
  for (const a of program.arrays) {
    out.comment(`${a.name}: ${a.bytes} bytes of 0`)
    out.line(`li t0, ${hex(a.at)}`)
    out.line(`li t1, ${hex(a.at + a.bytes + (a.bytes & 1))}`)
    out.label(`.clear_${a.name}`)
    out.line('sw zero, 0(t0)')
    out.line('addi t0, t0, 2')
    out.line(`bltu t0, t1, .clear_${a.name}`)
  }
  out.line('ret')
  out.raw('')
}

function func(out: Out, fn: Fn, banks: Map<string, number | null>): void {
  const frame = fn.slots.length * 2
  out.raw(`; ${fn.file}:${fn.line} ${fn.name}(${fn.slots.slice(0, fn.params).join(', ')})`)
  fn.slots.forEach((name, k) => {
    out.raw(`;   ${name} at ${k * 2}(fp)`)
  })
  out.label(fn.name)
  out.line(`addi sp, sp, -${frame + 4}`)
  out.line(`sw ra, ${frame + 2}(sp)`)
  out.line(`sw fp, ${frame}(sp)`)
  out.line('mv fp, sp')
  for (let k = 0; k < fn.params; k++) out.line(`sw ${ARG_REGS[k]}, ${k * 2}(fp)`)
  for (const op of fn.body) operation(out, op, fn, banks)
  out.label('.return')
  out.line('mv sp, fp')
  out.line(`lw fp, ${frame}(sp)`)
  out.line(`lw ra, ${frame + 2}(sp)`)
  out.line(`addi sp, sp, ${frame + 4}`)
  out.line('ret')
  out.raw('')
}

function operation(out: Out, op: Op, fn: Fn, banks: Map<string, number | null>): void {
  switch (op.k) {
    case 'line':
      out.comment(`${op.file}:${op.line}  ${op.text}`)
      return
    case 'push':
      out.line(`li t0, ${op.v}`)
      out.push('t0')
      return
    case 'addr':
      out.line(`la t0, ${op.label}`)
      out.push('t0')
      return
    case 'ld':
      out.line(`lw t0, ${op.slot * 2}(fp) ; ${fn.slots[op.slot]}`)
      out.push('t0')
      return
    case 'st':
      out.pop('t0')
      out.line(`sw t0, ${op.slot * 2}(fp) ; ${fn.slots[op.slot]}`)
      return
    case 'ldg':
      out.absolute(op.byte ? 'lbu' : 'lw', 't0', op.at)
      out.push('t0')
      return
    case 'stg':
      out.pop('t0')
      out.absolute(op.byte ? 'sb' : 'sw', 't0', op.at)
      return
    default:
      memoryOrFlow(out, op, fn, banks)
      return
  }
}

function memoryOrFlow(out: Out, op: Op, fn: Fn, banks: Map<string, number | null>): void {
  switch (op.k) {
    case 'load':
      out.pop('t1')
      out.line(`${op.byte ? 'lbu' : 'lw'} t0, 0(t1)`)
      out.push('t0')
      return
    case 'store':
      out.pop('t0')
      out.pop('t1')
      out.line(`${op.byte ? 'sb' : 'sw'} t0, 0(t1)`)
      return
    case 'bin':
      out.pop('t1')
      out.pop('t0')
      for (const line of BIN[op.op]) out.line(line)
      out.push('t0')
      return
    case 'un':
      out.pop('t0')
      out.line(UN[op.op])
      out.push('t0')
      return
    case 'label':
      out.label(op.name)
      return
    case 'jmp':
      out.line(`j ${op.to}`)
      return
    case 'jz':
    case 'jnz':
      out.pop('t0')
      out.line(`${op.k === 'jz' ? 'beqz' : 'bnez'} t0, ${op.to}`)
      return
    default:
      callsAndRest(out, op, fn, banks)
      return
  }
}

function callsAndRest(out: Out, op: Op, fn: Fn, banks: Map<string, number | null>): void {
  switch (op.k) {
    case 'call':
      for (let k = op.argc - 1; k >= 0; k--) out.pop(ARG_REGS[k] as string)
      for (const line of callLines(op.fn, fn.bank, banks)) out.line(line)
      if (op.ret) out.push('a0')
      return
    case 'ret':
      if (op.value) out.pop('a0')
      out.line('j .return')
      return
    case 'ecall':
      for (let k = op.argc - 1; k >= 0; k--) out.pop(ARG_REGS[k] as string)
      out.pop('t0')
      out.line('ecall')
      out.push('a0')
      return
    case 'csrr':
      out.line(`csrr t0, ${op.csr}`)
      out.push('t0')
      return
    case 'csrw':
      out.pop('t0')
      out.line(`csrw ${op.csr}, t0`)
      return
    case 'wfi':
      out.line('wfi')
      return
    case 'asm':
      for (const line of op.text.split('\n')) if (line.trim() !== '') out.line(line.trim())
      return
    case 'drop':
      out.line('addi sp, sp, 2')
      return
    case 'dup':
      out.line('lw t0, 0(sp)')
      out.push('t0')
      return
    default:
      return
  }
}

function strings(out: Out, program: Program, bank: number | null): void {
  for (const s of program.strings.filter((x) => x.bank === bank)) {
    out.label(s.label)
    out.line(`.byte ${[...s.bytes, 0].join(', ')}`)
  }
  out.line('.align 2')
}
