import ts from 'typescript'
import { FnCompiler, readType } from './body.js'
import type { Fn, Global, Program, RomString, StaticArray, Ty } from './ir.js'
import {
  BUILTINS,
  type CompileError,
  hex,
  I16,
  Refusal,
  rangeOf,
  type Sym,
  type TypeRef,
  U16,
} from './types.js'

/**
 * e16c's front end (docs/elec16.md section 6, e16c): the source files parsed with
 * TypeScript's own parser, their top-level declarations collected - functions, functions
 * written in assembly, constants, global variables, arrays and strings - and every function
 * body compiled to stack code (body.ts). RAM for globals and arrays is given out from the
 * data area the caller names, in declaration order.
 */

export interface SourceFile {
  name: string
  text: string
  /**
   * The ROM bank (0-11) this file's functions and strings go in; none for the fixed ROM. A
   * call into another bank goes through the ROM's `far_call` (docs/elec16.md section 6).
   */
  bank?: number
}

/** The ROM banks there are (shared/elec16/map.ts BANK_COUNT). */
const BANKS = 12

export interface FrontOptions {
  /** Where globals and static arrays go in RAM: from `start`, up to but not including `end`. */
  data: { start: number; end: number }
}

export interface Front {
  program: Program
  errors: CompileError[]
}

interface Parsed {
  name: string
  source: ts.SourceFile
  bank: number | null
}

export function front(files: SourceFile[], options: FrontOptions): Front {
  const parsed = files.map((f) => {
    if (f.bank !== undefined && !(Number.isInteger(f.bank) && f.bank >= 0 && f.bank < BANKS)) {
      throw new RangeError(`${f.name}: a bank is 0 to ${BANKS - 1}`)
    }
    return {
      name: f.name,
      source: ts.createSourceFile(f.name, f.text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS),
      bank: f.bank ?? null,
    }
  })
  return new ProgramBuilder(options).build(parsed)
}

class ProgramBuilder {
  readonly #symbols = new Map<string, Sym>()
  readonly #errors: CompileError[] = []
  /** The declaration that did not fit the data area, until #each reports it. */
  #full: ts.Node | null = null
  readonly #globals: Global[] = []
  readonly #arrays: StaticArray[] = []
  readonly #strings: RomString[] = []
  readonly #stringLabels = new Map<string, string>()
  readonly #externs = new Map<string, { params: number; returns: boolean }>()
  readonly #fns: Fn[] = []
  readonly #options: FrontOptions
  #next: number

  constructor(options: FrontOptions) {
    this.#options = options
    this.#next = options.data.start
  }

  build(files: Parsed[]): Front {
    // Functions first, from every file, so any may call any; then the rest in order.
    for (const f of files) this.#each(f, (s) => this.#signature(s, f))
    for (const f of files) this.#each(f, (s) => this.#topLevel(s, f))
    for (const f of files) this.#each(f, (s) => this.#body(s, f))
    return {
      program: {
        fns: this.#fns,
        globals: this.#globals,
        arrays: this.#arrays,
        strings: this.#strings,
        externs: this.#externs,
      },
      errors: this.#errors,
    }
  }

  #each(f: Parsed, visit: (s: ts.Statement) => void): void {
    for (const statement of f.source.statements) {
      try {
        visit(statement)
        const full = this.#full
        this.#full = null
        if (full !== null) {
          const { data } = this.#options
          throw new Refusal(
            full.getStart(),
            `the data area (${hex(data.start)}-${hex(data.end)}) is full`,
          )
        }
      } catch (e) {
        if (!(e instanceof Refusal)) throw e
        const at = e.at > 0 ? e.at : statement.getStart(f.source)
        const { line, character } = f.source.getLineAndCharacterOfPosition(at)
        this.#errors.push({
          file: f.name,
          line: line + 1,
          column: character + 1,
          message: e.message,
        })
      }
    }
  }

  #define(name: string, sym: Sym, at: ts.Node): void {
    if (this.#symbols.has(name)) throw new Refusal(at.getStart(), `${name} is declared twice`)
    if (BUILTINS.has(name)) throw new Refusal(at.getStart(), `${name} is a built-in`)
    this.#symbols.set(name, sym)
  }

  /* ---------------- pass 1: functions ---------------- */

  #signature(s: ts.Statement, f: Parsed): void {
    if (!ts.isFunctionDeclaration(s) || s.name === undefined) return
    if (s.parameters.length > 4)
      throw new Refusal(s.getStart(), 'a function takes at most four arguments')
    const params = s.parameters.map((p) => {
      if (p.type === undefined || !ts.isIdentifier(p.name)) {
        throw new Refusal(p.getStart(), 'a parameter is a name with a type')
      }
      return readType(p.type)
    })
    const ret = returnType(s)
    const extern = s.body === undefined
    if (extern && !hasModifier(s, ts.SyntaxKind.DeclareKeyword)) {
      throw new Refusal(
        s.getStart(),
        'a function without a body is `declare`d (written in assembly)',
      )
    }
    const bank = extern ? null : f.bank
    this.#define(s.name.text, { kind: 'fn', params, ret, extern, bank }, s)
    if (extern) this.#externs.set(s.name.text, { params: params.length, returns: ret !== 'void' })
  }

  /* ---------------- pass 2: constants, globals, arrays ---------------- */

  #topLevel(s: ts.Statement, f: Parsed): void {
    if (ts.isFunctionDeclaration(s) || ts.isImportDeclaration(s) || ts.isTypeAliasDeclaration(s))
      return
    if (ts.isInterfaceDeclaration(s) || ts.isEmptyStatement(s)) return
    if (ts.isExportDeclaration(s)) return
    if (!ts.isVariableStatement(s)) {
      throw new Refusal(
        s.getStart(),
        `${ts.SyntaxKind[s.kind]} is not in the subset at the top level`,
      )
    }
    const isConst = (s.declarationList.flags & ts.NodeFlags.Const) !== 0
    for (const d of s.declarationList.declarations) this.#declaration(d, isConst, f)
  }

  #declaration(d: ts.VariableDeclaration, isConst: boolean, f: Parsed): void {
    if (!ts.isIdentifier(d.name))
      throw new Refusal(d.getStart(), 'destructuring is not in the subset')
    const name = d.name.text
    const init = d.initializer
    const annotated = d.type === undefined ? null : readType(d.type)
    if (init !== undefined && ts.isCallExpression(init) && ts.isIdentifier(init.expression)) {
      const made = this.#allocation(name, init.expression.text, init, f.bank)
      if (made !== null) {
        this.#define(name, made, d)
        return
      }
    }
    const value = init === undefined ? 0 : this.#constant(init, f)
    // Unsaid, a negative constant is an i16 (EDIT_CLS = -1), anything else a word.
    const type = annotated ?? (value < 0 ? I16 : U16)
    if (type.kind === 'array')
      throw new Refusal(d.getStart(), 'an array is made with bytes(n) or words(n)')
    // As a local's: a value its type holds alike in TypeScript and on the machine.
    const [lo, hi] = rangeOf(type.ty)
    if (value < lo || value > hi) {
      throw new Refusal(d.getStart(), `${value} does not fit a ${type.ty}: say which with i16()`)
    }
    if (isConst) {
      if (init === undefined) throw new Refusal(d.getStart(), `${name} needs a value`)
      this.#define(name, { kind: 'const', value, type }, d)
      return
    }
    const byte = type.ty === 'u8'
    const at = this.#allocate(2, d)
    this.#globals.push({ name, at, byte, init: value })
    this.#define(name, { kind: 'global', at, type }, d)
  }

  /** bytes(n), words(n) or str("..."): a static array in RAM or a string in ROM. */
  #allocation(name: string, fn: string, call: ts.CallExpression, bank: number | null): Sym | null {
    if (fn === 'str') {
      const arg = call.arguments[0]
      if (arg === undefined || !ts.isStringLiteral(arg))
        throw new Refusal(call.getStart(), 'str takes one string literal')
      return { kind: 'static', label: this.romString(arg.text, bank), type: U16, bank }
    }
    if (fn !== 'bytes' && fn !== 'words') return null
    const arg = call.arguments[0]
    const count = arg !== undefined && ts.isNumericLiteral(arg) ? Number(arg.text) : Number.NaN
    if (!Number.isInteger(count) || count <= 0)
      throw new Refusal(call.getStart(), `${fn} takes a count`)
    const size = fn === 'bytes' ? count : count * 2
    const at = this.#allocate(size, call)
    this.#arrays.push({ name, at, bytes: size })
    return {
      kind: 'static',
      label: name,
      type: { kind: 'array', elem: fn === 'bytes' ? 'u8' : 'u16' },
      bank: null,
    }
  }

  /**
   * Room in the data area. When it is full the declaration is still made, so its uses raise
   * no errors of their own: the one error, at the first that does not fit, is said by #each.
   */
  #allocate(size: number, at: ts.Node): number {
    const start = this.#next
    this.#next += size + (size & 1)
    if (this.#next > this.#options.data.end && start <= this.#options.data.end) this.#full = at
    return start
  }

  /** A top-level value known while compiling: compiled into a scratch function and read back. */
  #constant(init: ts.Expression, f: Parsed): number {
    const scratch = new FnCompiler(this.#context(f), 'void')
    const t = scratch.expr(init)
    if (t.constant === undefined)
      throw new Refusal(init.getStart(), 'a top-level value must be known while compiling')
    return t.constant
  }

  /* ---------------- pass 3: bodies ---------------- */

  #body(s: ts.Statement, f: Parsed): void {
    if (!ts.isFunctionDeclaration(s) || s.name === undefined || s.body === undefined) return
    const sym = this.#symbols.get(s.name.text)
    if (sym?.kind !== 'fn') return
    const c = new FnCompiler(this.#context(f), sym.ret)
    s.parameters.forEach((p, k) => {
      c.param((p.name as ts.Identifier).text, sym.params[k] ?? U16)
    })
    c.body(s.body)
    const line = f.source.getLineAndCharacterOfPosition(s.getStart(f.source)).line + 1
    this.#fns.push(
      c.finish(s.name.text, sym.params.length, hasModifier(s, ts.SyntaxKind.ExportKeyword), line),
    )
  }

  #context(f: Parsed) {
    return {
      lookup: (name: string) => this.#symbols.get(name),
      romString: (text: string) => this.romString(text, f.bank),
      file: f.name,
      bank: f.bank,
      source: f.source,
    }
  }

  /** The label of a string in ROM, ended by a zero; the same text is stored once a bank. */
  romString(text: string, bank: number | null): string {
    const key = `${bank ?? '-'}:${text}`
    const known = this.#stringLabels.get(key)
    if (known !== undefined) return known
    const label = `str_${this.#strings.length}`
    const bytes = Array.from(text, (c) => {
      const code = c.charCodeAt(0)
      // Half-width kana are the machine's A1 to DF, as IMPORT reads them.
      if (code >= 0xff61 && code <= 0xff9f) return code - 0xff61 + 0xa1
      if (code > 0xff) throw new Refusal(0, `"${c}" is not in the machine's character set`)
      return code
    })
    this.#strings.push({ label, bytes, bank })
    this.#stringLabels.set(key, label)
    return label
  }
}

function returnType(s: ts.FunctionDeclaration): Ty {
  if (s.type === undefined || s.type.kind === ts.SyntaxKind.VoidKeyword) return 'void'
  const t: TypeRef = readType(s.type)
  if (t.kind === 'array')
    throw new Refusal(s.type.getStart(), 'a function returns a word, not an array')
  return t.ty
}

function hasModifier(s: ts.FunctionDeclaration, kind: ts.SyntaxKind): boolean {
  return (ts.getModifiers(s) ?? []).some((m) => m.kind === kind)
}
