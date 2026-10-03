import { assemble, ramImage } from '../elec16/asm.js'
import { Elec16 } from '../elec16/machine.js'
import {
  CODE_END,
  CODE_START,
  DATA_END,
  DATA_START,
  LIBRARY,
  LIBRARY_FILE,
  MEASURE_LIMIT,
  RETURN_AT,
} from './code-area.js'
import { type CompileError, compile } from './compile.js'

/**
 * CODE's programs (docs/elec16.md section 6, CODE): a person's TypeScript compiled by e16c
 * with a small library of the ROM's services, linked for the code area, and measured on a
 * machine of its own. Pure: the page runs it in a worker, the tests as they are. Nothing of
 * the person's code is ever run as JavaScript - it runs only as E16 code on the core.
 */

export { CODE_END, CODE_START, LIBRARY_FILE, MEASURE_LIMIT, SAMPLE } from './code-area.js'

export type Level = 0 | 1 | 2

export interface CodeBuild {
  level: Level
  /** The assembly e16c wrote (empty when it could not). */
  asm: string
  /** What is wrong, by file, line and column; none when it built. */
  errors: CompileError[]
  /** The code and strings from CODE_START: what RUN and LOAD put in RAM. */
  image: Uint8Array
}

/**
 * A program at one level: compiled with the library, an entry at CODE_START that clears its
 * globals and calls main, assembled and checked to fit the code area.
 */
export function buildCode(file: string, source: string, level: Level): CodeBuild {
  const failed = (errors: CompileError[], asm = ''): CodeBuild => ({
    level,
    asm,
    errors,
    image: new Uint8Array(),
  })
  if (!/\bfunction\s+main\s*\(/.test(source)) {
    return failed([
      { file, line: 1, column: 1, message: 'there is no main: export function main(): void' },
    ])
  }
  const out = compile(
    [
      { name: LIBRARY_FILE, text: LIBRARY },
      { name: file, text: source },
    ],
    { opt: level, data: { start: DATA_START, end: DATA_END } },
  )
  if (out.errors.length > 0) return failed(out.errors)
  const entry = [
    `.org 0x${CODE_START.toString(16)}`,
    'start:',
    '  addi sp, sp, -2',
    '  sw ra, 0(sp)',
    '  call e16c_init',
    '  call main',
    '  lw ra, 0(sp)',
    '  addi sp, sp, 2',
    '  ret',
  ].join('\n')
  const asm = `${entry}\n${out.asm}`
  const linked = assemble(asm, { file })
  if (linked.errors.length > 0) {
    return failed(
      linked.errors.map((e) => ({ file, line: 0, column: 0, message: e.message })),
      out.asm,
    )
  }
  // Measured before the image is made: a program past RAM's end could not be made at all.
  const end = Math.max(CODE_START, ...linked.chunks.map((c) => c.address + c.bytes.length))
  const size = end - CODE_START
  if (end > CODE_END || linked.chunks.some((c) => c.bank !== null || c.address < CODE_START)) {
    return failed(
      [
        {
          file,
          line: 0,
          column: 0,
          message: `the program is ${size} bytes: the code area holds ${CODE_END - CODE_START}`,
        },
      ],
      out.asm,
    )
  }
  return { level, asm: out.asm, errors: [], image: ramImage(linked, CODE_START) }
}

/* ---------------- measuring ---------------- */

/** How a measured run ended: back from main, waiting for a key, still going, or a fault. */
export type RunEnd = 'returned' | 'waits' | 'limit' | 'fault'

export interface Measured {
  cycles: number
  end: RunEnd
}

/**
 * A machine switched on and asleep at BASIC's prompt, as a snapshot to measure from: every
 * level starts from the same one.
 */
export function measuringMachine(rom: Uint8Array): Uint8Array {
  const m = Elec16.boot(rom)
  runToSleep(m, 10_000_000)
  return m.snapshot()
}

/** The program's main called from the prompt, as CALL does: its cycles, and how it ended. */
export function measure(rom: Uint8Array, snapshot: Uint8Array, image: Uint8Array): Measured {
  const m = Elec16.restore(rom, snapshot)
  if (m === null || !m.loadCode(CODE_START, image)) return { cycles: 0, end: 'fault' }
  m.breakpoints.add(RETURN_AT)
  m.callAt(CODE_START, RETURN_AT)
  const start = m.state.cycles
  const end = runToSleep(m, MEASURE_LIMIT)
  return { cycles: m.state.cycles - start, end }
}

/** Runs until the machine waits for a key, stops at a breakpoint, faults, or `limit` passes. */
function runToSleep(m: Elec16, limit: number): RunEnd {
  const start = m.state.cycles
  while (m.state.cycles - start < limit) {
    const r = m.run(500_000)
    if (m.breakAt !== null) return 'returned'
    if (r.halted !== null) return 'fault'
    if (r.sleeping !== null) {
      // Asleep on the timer (WAIT, BEEP): time passes at once here.
      if (r.sleeping.timerMs === null) return 'waits'
      m.advance(Math.max(1, r.sleeping.timerMs))
    } else if (r.cycles === 0) {
      return 'fault'
    }
  }
  return 'limit'
}
