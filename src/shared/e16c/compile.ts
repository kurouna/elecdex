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
}

export interface E16cResult {
  /** The assembly, or '' when there were errors. */
  asm: string
  errors: CompileError[]
  program: Program
}

export function compile(files: SourceFile[], options: E16cOptions): E16cResult {
  const { program: parsed, errors } = front(files, options)
  if (errors.length > 0) return { asm: '', errors, program: parsed }
  const program = options.opt === 2 ? optimise(parsed) : parsed
  return {
    asm: assembly(
      program,
      files.map((f) => f.name),
      options.opt === 0 ? 0 : 1,
    ),
    errors,
    program,
  }
}
