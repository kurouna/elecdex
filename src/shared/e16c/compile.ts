import { assembly } from './back.js'
import { type FrontOptions, front, type SourceFile } from './front.js'
import type { Program } from './ir.js'
import { optimise } from './opt.js'
import type { CompileError } from './types.js'

/**
 * e16c: a subset of TypeScript to E16 assembly (docs/elec16.md section 6, e16c). Pure, so the
 * build script, the tests and (later) the CODE view's worker compile the same way.
 */

export type { CompileError, SourceFile }

export interface E16cOptions extends FrontOptions {
  /**
   * How hard it works: 0 a plain translation, 1 registers and fused branches, 2 also inlining,
   * folding, dead code and pure calls worked out while compiling (opt.ts).
   */
  opt: 0 | 1 | 2
  /**
   * The machine's number for bank 0 of `SourceFile.bank`: 0 for the ROM's banks, 0x100 for a
   * cartridge's (its banks seen through the window from there).
   */
  bankBase?: number
}

export interface E16cResult {
  /** The assembly, or '' when there were errors. */
  asm: string
  errors: CompileError[]
  program: Program
}

/**
 * Whatever goes wrong comes back as an error, never as an exception: a source too deep for
 * the parser, or a function the back end cannot place (more values across a branch than it
 * has registers). The CODE view hands it a person's text.
 */
export function compile(files: SourceFile[], options: E16cOptions): E16cResult {
  try {
    return compileNow(files, options)
  } catch (e) {
    const message = e instanceof Error ? e.message.replace(/^e16c: /, '') : String(e)
    const file = files[0]?.name ?? ''
    const deep = e instanceof RangeError ? 'the source nests too deeply' : message
    return {
      asm: '',
      errors: [{ file: placeOf(files, message) ?? file, line: 0, column: 0, message: deep }],
      program: { fns: [], globals: [], arrays: [], strings: [], externs: new Map() },
    }
  }
}

/** The file whose function a back end's message names, when one does. */
function placeOf(files: SourceFile[], message: string): string | null {
  const name = /\bin (\w+)/.exec(message)?.[1]
  if (name === undefined) return null
  const pattern = new RegExp(`function\\s+${name}\\b`)
  return files.find((f) => pattern.test(f.text))?.name ?? null
}

function compileNow(files: SourceFile[], options: E16cOptions): E16cResult {
  const { program: parsed, errors } = front(files, options)
  if (errors.length > 0) return { asm: '', errors, program: parsed }
  const program = options.opt === 2 ? optimise(parsed) : parsed
  return {
    asm: assembly(
      program,
      files.map((f) => f.name),
      options.opt === 0 ? 0 : 1,
      options.bankBase ?? 0,
    ),
    errors,
    program,
  }
}
