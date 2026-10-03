import ts from 'typescript'
import type { BinOp, Fn, Op, Ty } from './ir.js'
import {
  BOOL,
  BUILTINS,
  I16,
  isSigned,
  Refusal,
  type Sym,
  scalar,
  type Typed,
  type TypeRef,
  typeName,
  U16,
  word,
} from './types.js'

/**
 * Turns one function's body into e16c's stack code (docs/elec16.md section 6, e16c), deciding
 * every type as it goes: which comparison is signed, which access is a byte. Anything outside
 * the subset is refused with its place and why.
 */

/** What the compiler of a body needs from the program round it. */
export interface Context {
  lookup(name: string): Sym | undefined
  /** A string literal's label in ROM. */
  romString(text: string): string
  file: string
  source: ts.SourceFile
}

/** Arithmetic and bitwise operators, by token, and what each is for unsigned and signed words. */
const ARITH: Partial<Record<ts.SyntaxKind, [BinOp, BinOp]>> = {
  [ts.SyntaxKind.PlusToken]: ['add', 'add'],
  [ts.SyntaxKind.MinusToken]: ['sub', 'sub'],
  [ts.SyntaxKind.AsteriskToken]: ['mul', 'mul'],
  [ts.SyntaxKind.PercentToken]: ['remu', 'rem'],
  [ts.SyntaxKind.AmpersandToken]: ['and', 'and'],
  [ts.SyntaxKind.BarToken]: ['or', 'or'],
  [ts.SyntaxKind.CaretToken]: ['xor', 'xor'],
  [ts.SyntaxKind.LessThanLessThanToken]: ['shl', 'shl'],
  [ts.SyntaxKind.GreaterThanGreaterThanToken]: ['shr', 'sar'],
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken]: ['shr', 'shr'],
}

const COMPARE: Partial<Record<ts.SyntaxKind, [BinOp, BinOp]>> = {
  [ts.SyntaxKind.EqualsEqualsEqualsToken]: ['eq', 'eq'],
  [ts.SyntaxKind.EqualsEqualsToken]: ['eq', 'eq'],
  [ts.SyntaxKind.ExclamationEqualsEqualsToken]: ['ne', 'ne'],
  [ts.SyntaxKind.ExclamationEqualsToken]: ['ne', 'ne'],
  [ts.SyntaxKind.LessThanToken]: ['ltu', 'lt'],
  [ts.SyntaxKind.LessThanEqualsToken]: ['leu', 'le'],
  [ts.SyntaxKind.GreaterThanToken]: ['gtu', 'gt'],
  [ts.SyntaxKind.GreaterThanEqualsToken]: ['geu', 'ge'],
}

/** Prefix operators that compute: - ~ ! (+ changes nothing). */
const UNARY: Partial<Record<ts.SyntaxKind, 'neg' | 'not' | 'lnot'>> = {
  [ts.SyntaxKind.MinusToken]: 'neg',
  [ts.SyntaxKind.TildeToken]: 'not',
  [ts.SyntaxKind.ExclamationToken]: 'lnot',
}

function foldUnary(op: 'neg' | 'not' | 'lnot', v: number): number {
  if (op === 'neg') return -v
  if (op === 'not') return word(~v)
  return v === 0 ? 1 : 0
}

/** `a op= b` as `a = a op b`. */
const COMPOUND: Partial<Record<ts.SyntaxKind, ts.SyntaxKind>> = {
  [ts.SyntaxKind.PlusEqualsToken]: ts.SyntaxKind.PlusToken,
  [ts.SyntaxKind.MinusEqualsToken]: ts.SyntaxKind.MinusToken,
  [ts.SyntaxKind.AsteriskEqualsToken]: ts.SyntaxKind.AsteriskToken,
  [ts.SyntaxKind.PercentEqualsToken]: ts.SyntaxKind.PercentToken,
  [ts.SyntaxKind.AmpersandEqualsToken]: ts.SyntaxKind.AmpersandToken,
  [ts.SyntaxKind.BarEqualsToken]: ts.SyntaxKind.BarToken,
  [ts.SyntaxKind.CaretEqualsToken]: ts.SyntaxKind.CaretToken,
  [ts.SyntaxKind.LessThanLessThanEqualsToken]: ts.SyntaxKind.LessThanLessThanToken,
  [ts.SyntaxKind.GreaterThanGreaterThanEqualsToken]: ts.SyntaxKind.GreaterThanGreaterThanToken,
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken]:
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
}

/** Folds two known words with an operator; null where the machine would trap or the result is not a word's. */
function fold(op: BinOp, a: number, b: number, signedArgs: boolean): number | null {
  const sa = signedArgs ? (word(a) << 16) >> 16 : word(a)
  const sb = signedArgs ? (word(b) << 16) >> 16 : word(b)
  const table: Record<BinOp, () => number | null> = {
    add: () => a + b,
    sub: () => a - b,
    mul: () => word(a) * word(b),
    div: () => (sb === 0 ? null : Math.trunc(sa / sb)),
    divu: () => (sb === 0 ? null : Math.trunc(sa / sb)),
    rem: () => (sb === 0 ? null : sa % sb),
    remu: () => (sb === 0 ? null : sa % sb),
    and: () => word(a) & word(b),
    or: () => word(a) | word(b),
    xor: () => word(a) ^ word(b),
    shl: () => word(word(a) << (b & 15)),
    shr: () => word(a) >>> (b & 15),
    sar: () => sa >> (b & 15),
    eq: () => (word(a) === word(b) ? 1 : 0),
    ne: () => (word(a) !== word(b) ? 1 : 0),
    lt: () => (sa < sb ? 1 : 0),
    ltu: () => (sa < sb ? 1 : 0),
    le: () => (sa <= sb ? 1 : 0),
    leu: () => (sa <= sb ? 1 : 0),
    gt: () => (sa > sb ? 1 : 0),
    gtu: () => (sa > sb ? 1 : 0),
    ge: () => (sa >= sb ? 1 : 0),
    geu: () => (sa >= sb ? 1 : 0),
  }
  return table[op]()
}

export class FnCompiler {
  readonly ops: Op[] = []
  readonly slots: string[] = []
  readonly #ctx: Context
  readonly #scopes: Map<string, Sym>[] = [new Map()]
  readonly #loops: { brk: string; cont: string }[] = []
  readonly #ret: Ty
  /** Slots of scopes that have ended, for later locals to take (fewer slots, more in registers). */
  readonly #free: number[] = []
  #labels = 0

  constructor(ctx: Context, ret: Ty) {
    this.#ctx = ctx
    this.#ret = ret
  }

  /** A parameter, in the next slot. */
  param(name: string, type: TypeRef): void {
    this.#declare(name, type, null)
  }

  /** Compiles the body and finishes it: a function that runs off its end returns (0). */
  body(block: ts.Block): void {
    for (const statement of block.statements) this.statement(statement)
    if (this.#ret !== 'void') this.#emit({ k: 'push', v: 0 })
    this.#emit({ k: 'ret', value: this.#ret !== 'void' })
  }

  finish(name: string, params: number, exported: boolean, line: number): Fn {
    return {
      name,
      params,
      slots: this.slots,
      returns: this.#ret !== 'void',
      body: this.ops,
      exported,
      file: this.#ctx.file,
      line,
    }
  }

  /* ---------------- names ---------------- */

  #emit(op: Op): void {
    this.ops.push(op)
  }

  #label(): string {
    return `.L${++this.#labels}`
  }

  #find(name: string): Sym | undefined {
    for (let k = this.#scopes.length - 1; k >= 0; k--) {
      const found = this.#scopes[k]?.get(name)
      if (found !== undefined) return found
    }
    return this.#ctx.lookup(name)
  }

  #declare(name: string, type: TypeRef, constant: number | null): Sym {
    const scope = this.#scopes[this.#scopes.length - 1] as Map<string, Sym>
    if (scope.has(name)) throw new Refusal(0, `${name} is declared twice`)
    if (constant !== null) {
      const sym: Sym = { kind: 'const', value: constant, type }
      scope.set(name, sym)
      return sym
    }
    this.#free.sort((a, b) => a - b)
    const reused = this.#free.shift()
    const slot = reused ?? this.slots.length
    if (reused === undefined) this.slots.push(name)
    else if (!(this.slots[slot] ?? '').split('/').includes(name))
      this.slots[slot] = `${this.slots[slot]}/${name}`
    const sym: Sym = { kind: 'local', slot, type }
    scope.set(name, sym)
    return sym
  }

  #scoped(fill: () => void): void {
    this.#scopes.push(new Map())
    try {
      fill()
    } finally {
      for (const sym of this.#scopes.pop()?.values() ?? [])
        if (sym.kind === 'local') this.#free.push(sym.slot)
    }
  }

  /* ---------------- statements ---------------- */

  statement(node: ts.Statement): void {
    const at = this.#ctx.source.getLineAndCharacterOfPosition(node.getStart(this.#ctx.source))
    const text = node.getText(this.#ctx.source).split('\n')[0] ?? ''
    if (!ts.isBlock(node)) this.#emit({ k: 'line', file: this.#ctx.file, line: at.line + 1, text })
    try {
      this.#statement(node)
    } catch (e) {
      if (e instanceof Refusal && e.at === 0)
        throw new Refusal(node.getStart(this.#ctx.source), e.message)
      throw e
    }
  }

  #statement(node: ts.Statement): void {
    if (ts.isBlock(node)) {
      this.#scoped(() => {
        for (const s of node.statements) this.statement(s)
      })
      return
    }
    if (ts.isVariableStatement(node)) {
      this.#variables(node.declarationList)
      return
    }
    if (ts.isExpressionStatement(node)) {
      this.#effect(node.expression)
      return
    }
    if (ts.isIfStatement(node)) {
      this.#if(node)
      return
    }
    if (ts.isWhileStatement(node)) {
      this.#while(node)
      return
    }
    if (ts.isDoStatement(node)) {
      this.#do(node)
      return
    }
    if (ts.isForStatement(node)) {
      this.#for(node)
      return
    }
    if (ts.isReturnStatement(node)) {
      this.#return(node)
      return
    }
    if (ts.isSwitchStatement(node)) {
      this.#switch(node)
      return
    }
    if (ts.isBreakStatement(node) || ts.isContinueStatement(node)) {
      this.#jumpOut(node)
      return
    }
    if (ts.isEmptyStatement(node)) return
    throw new Refusal(
      node.getStart(this.#ctx.source),
      `${ts.SyntaxKind[node.kind]} is not in the subset`,
    )
  }

  #variables(list: ts.VariableDeclarationList): void {
    const isConst = (list.flags & ts.NodeFlags.Const) !== 0
    for (const d of list.declarations) {
      if (!ts.isIdentifier(d.name))
        throw new Refusal(d.getStart(), 'destructuring is not in the subset')
      const annotated = d.type === undefined ? null : readType(d.type)
      if (d.initializer === undefined) {
        if (annotated === null)
          throw new Refusal(d.getStart(), `${d.name.text} needs a type or a value`)
        const sym = this.#declare(d.name.text, annotated, null)
        if (sym.kind === 'local') this.#store(sym.slot, { k: 'push', v: 0 })
        continue
      }
      this.#variable(d.name.text, annotated, d.initializer, isConst)
    }
  }

  #variable(name: string, annotated: TypeRef | null, init: ts.Expression, isConst: boolean): void {
    const mark = this.ops.length
    const value = this.expr(init)
    const type =
      annotated ?? (value.type.kind === 'scalar' && value.type.ty === 'u8' ? U16 : value.type)
    this.#assignable(type, value, init)
    // A constant that is a constant: no slot, its value used where it is named.
    if (isConst && value.constant !== undefined && type.kind === 'scalar') {
      this.ops.length = mark
      this.#declare(name, type, value.constant)
      return
    }
    const sym = this.#declare(name, type, null)
    if (sym.kind === 'local') this.#emit({ k: 'st', slot: sym.slot })
  }

  #store(slot: number, value: Op): void {
    this.#emit(value)
    this.#emit({ k: 'st', slot })
  }

  /** An expression for its effect: an assignment, a step, a call. */
  #effect(e: ts.Expression): void {
    if (ts.isBinaryExpression(e) && isAssignment(e.operatorToken.kind)) {
      this.#assign(e)
      return
    }
    if (ts.isPostfixUnaryExpression(e) || isStep(e)) {
      this.#step(e as ts.PrefixUnaryExpression)
      return
    }
    if (ts.isTaggedTemplateExpression(e)) {
      this.#asm(e)
      return
    }
    if (ts.isCallExpression(e)) {
      const t = this.#call(e)
      if (t !== null) this.#emit({ k: 'drop' })
      return
    }
    throw new Refusal(e.getStart(), 'this expression does nothing as a statement')
  }

  #assign(e: ts.BinaryExpression): void {
    const op = e.operatorToken.kind
    const compound = COMPOUND[op]
    const value =
      compound === undefined
        ? () => this.expr(e.right)
        : () => this.#binary(e.left, compound, e.right)
    this.#assignTo(e.left, value)
  }

  #step(e: ts.PrefixUnaryExpression | ts.PostfixUnaryExpression): void {
    const kind =
      e.operator === ts.SyntaxKind.PlusPlusToken
        ? ts.SyntaxKind.PlusToken
        : ts.SyntaxKind.MinusToken
    const one = (): Typed => {
      this.#emit({ k: 'push', v: 1 })
      return { type: U16, constant: 1 }
    }
    this.#assignTo(e.operand, () => this.#binaryTyped(this.expr(e.operand), kind, one, e))
  }

  /** Stores what `value` leaves into a variable or an element. */
  #assignTo(target: ts.Expression, value: () => Typed): void {
    if (ts.isIdentifier(target)) {
      const sym = this.#find(target.text)
      if (sym?.kind === 'local') {
        this.#assignable(sym.type, value(), target)
        this.#emit({ k: 'st', slot: sym.slot })
        return
      }
      if (sym?.kind === 'global') {
        this.#assignable(sym.type, value(), target)
        this.#emit({
          k: 'stg',
          at: sym.at,
          byte: sym.type.kind === 'scalar' && sym.type.ty === 'u8',
        })
        return
      }
      throw new Refusal(target.getStart(), `${target.text} cannot be assigned`)
    }
    if (ts.isElementAccessExpression(target)) {
      const elem = this.#element(target)
      this.#assignable(scalar(elem), value(), target)
      this.#emit({ k: 'store', byte: elem === 'u8' })
      return
    }
    throw new Refusal(target.getStart(), 'only a variable or an element can be assigned')
  }

  #assignable(to: TypeRef, value: Typed, at: ts.Node): void {
    if (to.kind !== value.type.kind) {
      throw new Refusal(at.getStart(), `a ${typeName(value.type)} is not a ${typeName(to)}`)
    }
    if (to.kind === 'array' && value.type.kind === 'array' && to.elem !== value.type.elem) {
      throw new Refusal(at.getStart(), `a ${typeName(value.type)} is not a ${typeName(to)}`)
    }
    if (value.constant === undefined || to.kind !== 'scalar') return
    const [lo, hi] = to.ty === 'i16' ? [-32768, 32767] : to.ty === 'u8' ? [0, 255] : [-32768, 65535]
    if (value.constant < lo || value.constant > hi) {
      throw new Refusal(at.getStart(), `${value.constant} does not fit a ${to.ty}`)
    }
  }

  #asm(e: ts.TaggedTemplateExpression): void {
    if (
      !ts.isIdentifier(e.tag) ||
      e.tag.text !== 'asm' ||
      !ts.isNoSubstitutionTemplateLiteral(e.template)
    ) {
      throw new Refusal(e.getStart(), 'only asm`...` with no substitutions is a template here')
    }
    this.#emit({ k: 'asm', text: e.template.text })
  }

  #if(node: ts.IfStatement): void {
    const otherwise = this.#label()
    this.#condition(node.expression)
    this.#emit({ k: 'jz', to: otherwise })
    this.#scoped(() => this.statement(node.thenStatement))
    if (node.elseStatement === undefined) {
      this.#emit({ k: 'label', name: otherwise })
      return
    }
    const end = this.#label()
    this.#emit({ k: 'jmp', to: end })
    this.#emit({ k: 'label', name: otherwise })
    const other = node.elseStatement
    this.#scoped(() => this.statement(other))
    this.#emit({ k: 'label', name: end })
  }

  #loop(brk: string, cont: string, body: () => void): void {
    this.#loops.push({ brk, cont })
    try {
      this.#scoped(body)
    } finally {
      this.#loops.pop()
    }
  }

  #while(node: ts.WhileStatement): void {
    const top = this.#label()
    const end = this.#label()
    this.#emit({ k: 'label', name: top })
    this.#condition(node.expression)
    this.#emit({ k: 'jz', to: end })
    this.#loop(end, top, () => this.statement(node.statement))
    this.#emit({ k: 'jmp', to: top })
    this.#emit({ k: 'label', name: end })
  }

  #do(node: ts.DoStatement): void {
    const top = this.#label()
    const cont = this.#label()
    const end = this.#label()
    this.#emit({ k: 'label', name: top })
    this.#loop(end, cont, () => this.statement(node.statement))
    this.#emit({ k: 'label', name: cont })
    this.#condition(node.expression)
    this.#emit({ k: 'jnz', to: top })
    this.#emit({ k: 'label', name: end })
  }

  #for(node: ts.ForStatement): void {
    this.#scoped(() => {
      const init = node.initializer
      if (init !== undefined) {
        if (ts.isVariableDeclarationList(init)) this.#variables(init)
        else this.#effect(init)
      }
      const top = this.#label()
      const cont = this.#label()
      const end = this.#label()
      this.#emit({ k: 'label', name: top })
      if (node.condition !== undefined) {
        this.#condition(node.condition)
        this.#emit({ k: 'jz', to: end })
      }
      this.#loop(end, cont, () => this.statement(node.statement))
      this.#emit({ k: 'label', name: cont })
      if (node.incrementor !== undefined) this.#effect(node.incrementor)
      this.#emit({ k: 'jmp', to: top })
      this.#emit({ k: 'label', name: end })
    })
  }

  #jumpOut(node: ts.BreakStatement | ts.ContinueStatement): void {
    if (node.label !== undefined) throw new Refusal(node.getStart(), 'labels are not in the subset')
    const loop = this.#loops[this.#loops.length - 1]
    if (loop === undefined) throw new Refusal(node.getStart(), 'not inside a loop or a switch')
    if (ts.isContinueStatement(node) && loop.cont === '') {
      throw new Refusal(node.getStart(), 'continue inside a switch is not in the subset')
    }
    this.#emit({ k: 'jmp', to: ts.isBreakStatement(node) ? loop.brk : loop.cont })
  }

  #return(node: ts.ReturnStatement): void {
    if (node.expression === undefined) {
      if (this.#ret !== 'void') throw new Refusal(node.getStart(), 'this function returns a value')
      this.#emit({ k: 'ret', value: false })
      return
    }
    if (this.#ret === 'void') throw new Refusal(node.getStart(), 'this function returns nothing')
    this.#assignable(scalar(this.#ret), this.expr(node.expression), node.expression)
    this.#emit({ k: 'ret', value: true })
  }

  /** A switch on a word: the value kept in a slot, compared with each case's constant. */
  #switch(node: ts.SwitchStatement): void {
    const end = this.#label()
    this.#scoped(() => {
      const value = this.expr(node.expression)
      const slot = this.#declare(`switch${this.#labels}`, value.type, null)
      if (slot.kind !== 'local') return
      this.#emit({ k: 'st', slot: slot.slot })
      const clauses = node.caseBlock.clauses.map((c) => ({ clause: c, label: this.#label() }))
      this.#emit({ k: 'jmp', to: this.#caseTests(slot.slot, clauses, end) })
      this.#loops.push({ brk: end, cont: this.#loops[this.#loops.length - 1]?.cont ?? '' })
      try {
        for (const { clause, label } of clauses) {
          this.#emit({ k: 'label', name: label })
          for (const s of clause.statements) this.statement(s)
        }
      } finally {
        this.#loops.pop()
      }
    })
    this.#emit({ k: 'label', name: end })
  }

  /** A test for each case, jumping to its body; where to go when none matched. */
  #caseTests(
    slot: number,
    clauses: { clause: ts.CaseOrDefaultClause; label: string }[],
    end: string,
  ): string {
    let fallback = end
    for (const { clause, label } of clauses) {
      if (ts.isDefaultClause(clause)) {
        fallback = label
        continue
      }
      const c = this.expr(clause.expression)
      if (c.constant === undefined)
        throw new Refusal(clause.getStart(), 'a case must be a constant')
      this.ops.pop()
      this.#emit({ k: 'ld', slot })
      this.#emit({ k: 'push', v: word(c.constant) })
      this.#emit({ k: 'bin', op: 'eq' })
      this.#emit({ k: 'jnz', to: label })
    }
    return fallback
  }

  /** A condition: any word, true when not 0. */
  #condition(e: ts.Expression): void {
    const t = this.expr(e)
    if (t.type.kind !== 'scalar') throw new Refusal(e.getStart(), 'an array is not a condition')
  }

  /* ---------------- expressions ---------------- */

  /** Compiles an expression, leaving its value on the stack. */
  expr(e: ts.Expression): Typed {
    if (ts.isParenthesizedExpression(e) || ts.isNonNullExpression(e)) return this.expr(e.expression)
    if (ts.isNumericLiteral(e)) return this.#literal(e)
    if (e.kind === ts.SyntaxKind.TrueKeyword || e.kind === ts.SyntaxKind.FalseKeyword) {
      const v = e.kind === ts.SyntaxKind.TrueKeyword ? 1 : 0
      this.#emit({ k: 'push', v })
      return { type: BOOL, constant: v }
    }
    if (ts.isIdentifier(e)) return this.#name(e)
    if (ts.isPrefixUnaryExpression(e)) return this.#unary(e)
    if (ts.isBinaryExpression(e)) return this.#binaryExpr(e)
    if (ts.isCallExpression(e)) return this.#callValue(e)
    if (ts.isElementAccessExpression(e)) return this.#elementValue(e)
    if (ts.isConditionalExpression(e)) return this.#conditional(e)
    if (ts.isAsExpression(e) || ts.isTypeAssertionExpression(e)) return this.#cast(e)
    throw new Refusal(e.getStart(), `${ts.SyntaxKind[e.kind]} is not in the subset`)
  }

  #literal(e: ts.NumericLiteral): Typed {
    const v = Number(e.text)
    if (!Number.isInteger(v) || v > 0xffff)
      throw new Refusal(e.getStart(), `${e.text} is not a word`)
    this.#emit({ k: 'push', v: word(v) })
    return { type: U16, constant: v }
  }

  #name(e: ts.Identifier): Typed {
    const sym = this.#find(e.text)
    switch (sym?.kind) {
      case 'local':
        this.#emit({ k: 'ld', slot: sym.slot })
        return { type: sym.type }
      case 'const':
        this.#emit({ k: 'push', v: word(sym.value) })
        return { type: sym.type, constant: sym.value }
      case 'global':
        this.#emit({
          k: 'ldg',
          at: sym.at,
          byte: sym.type.kind === 'scalar' && sym.type.ty === 'u8',
        })
        return { type: sym.type }
      case 'static':
        this.#emit({ k: 'addr', label: sym.label })
        return { type: sym.type }
      case 'fn':
        throw new Refusal(e.getStart(), `${e.text} is a function, not a value`)
      default:
        throw new Refusal(e.getStart(), `${e.text} is not known`)
    }
  }

  #unary(e: ts.PrefixUnaryExpression): Typed {
    if (
      e.operator === ts.SyntaxKind.PlusPlusToken ||
      e.operator === ts.SyntaxKind.MinusMinusToken
    ) {
      throw new Refusal(e.getStart(), '++ and -- are statements here, not values')
    }
    const mark = this.ops.length
    const t = this.expr(e.operand)
    const op = UNARY[e.operator]
    if (op === undefined) return t
    const type = op === 'lnot' ? BOOL : t.type
    if (t.constant === undefined) {
      this.#emit({ k: 'un', op })
      return { type }
    }
    this.ops.length = mark
    const v = foldUnary(op, t.constant)
    this.#emit({ k: 'push', v: word(v) })
    return { type, constant: v }
  }

  #binaryExpr(e: ts.BinaryExpression): Typed {
    const kind = e.operatorToken.kind
    if (isAssignment(kind))
      throw new Refusal(e.getStart(), 'an assignment is a statement here, not a value')
    if (kind === ts.SyntaxKind.AmpersandAmpersandToken || kind === ts.SyntaxKind.BarBarToken) {
      return this.#logical(e, kind === ts.SyntaxKind.AmpersandAmpersandToken)
    }
    if (kind === ts.SyntaxKind.SlashToken) {
      throw new Refusal(e.getStart(), '/ gives a fraction in TypeScript: use div(a, b)')
    }
    return this.#binary(e.left, kind, e.right)
  }

  #binary(left: ts.Expression, kind: ts.SyntaxKind, right: ts.Expression): Typed {
    return this.#binaryTyped(this.expr(left), kind, () => this.expr(right), left)
  }

  /** `a op b` with a already compiled; folded when both are known. */
  #binaryTyped(a: Typed, kind: ts.SyntaxKind, right: () => Typed, at: ts.Node): Typed {
    const mark = this.ops.length
    const b = right()
    const ops = COMPARE[kind] ?? ARITH[kind]
    if (ops === undefined) {
      throw new Refusal(at.getStart(), `${ts.tokenToString(kind)} is not in the subset`)
    }
    const signedness = this.#signedness(a, b, at)
    const op = ops[signedness ? 1 : 0]
    const isCompare = COMPARE[kind] !== undefined
    const type = isCompare ? BOOL : signedness ? I16 : U16
    const v =
      a.constant !== undefined && b.constant !== undefined
        ? fold(op, a.constant, b.constant, signedness)
        : null
    if (v === null) {
      this.#emit({ k: 'bin', op })
      return { type }
    }
    // Both were one push each: the answer replaces them.
    this.ops.length = mark - 1
    this.#emit({ k: 'push', v: word(v) })
    return { type, constant: signedness ? (word(v) << 16) >> 16 : isCompare ? v : word(v) }
  }

  /** Whether an operation on a and b is signed: both i16, or one i16 and the other a constant. */
  #signedness(a: Typed, b: Typed, at: ts.Node): boolean {
    if (a.type.kind === 'array' || b.type.kind === 'array') {
      // Run as TypeScript an array is an object: its address is asked for by name.
      throw new Refusal(at.getStart(), 'an array is not a number: use addr(a) for its address')
    }
    const sa = isSigned(a.type)
    const sb = isSigned(b.type)
    if (sa === sb) return sa
    if (sa && b.constant !== undefined) return true
    if (sb && a.constant !== undefined) return true
    throw new Refusal(at.getStart(), 'this mixes i16 and an unsigned value: say which with `as`')
  }

  /** && and ||, stopping as soon as the answer is known; 0 or 1. */
  #logical(e: ts.BinaryExpression, and: boolean): Typed {
    const end = this.#label()
    this.#truth(e.left)
    this.#emit({ k: 'dup' })
    this.#emit({ k: and ? 'jz' : 'jnz', to: end })
    this.#emit({ k: 'drop' })
    this.#truth(e.right)
    this.#emit({ k: 'label', name: end })
    return { type: BOOL }
  }

  /** A value as 0 or 1. */
  #truth(e: ts.Expression): void {
    const t = this.expr(e)
    if (t.type.kind === 'scalar' && t.type.ty === 'bool') return
    this.#emit({ k: 'push', v: 0 })
    this.#emit({ k: 'bin', op: 'ne' })
  }

  #conditional(e: ts.ConditionalExpression): Typed {
    const otherwise = this.#label()
    const end = this.#label()
    this.#condition(e.condition)
    this.#emit({ k: 'jz', to: otherwise })
    const a = this.expr(e.whenTrue)
    this.#emit({ k: 'jmp', to: end })
    this.#emit({ k: 'label', name: otherwise })
    const b = this.expr(e.whenFalse)
    this.#emit({ k: 'label', name: end })
    if (a.type.kind !== b.type.kind)
      throw new Refusal(e.getStart(), 'the two answers are of different kinds')
    return { type: a.constant !== undefined ? b.type : a.type }
  }

  #cast(e: ts.AsExpression | ts.TypeAssertion): Typed {
    const to = readType(e.type)
    const t = this.expr(e.expression)
    if (to.kind !== t.type.kind)
      throw new Refusal(e.getStart(), `a ${typeName(t.type)} cannot be read as a ${typeName(to)}`)
    if (to.kind === 'scalar' && to.ty === 'u8') {
      this.#emit({ k: 'push', v: 0xff })
      this.#emit({ k: 'bin', op: 'and' })
    }
    return { type: to }
  }

  /** The address of an element, left on the stack; the element's type. */
  #element(e: ts.ElementAccessExpression): 'u8' | 'u16' {
    const base = this.expr(e.expression)
    if (base.type.kind !== 'array') throw new Refusal(e.getStart(), 'only an array can be indexed')
    const index = this.expr(e.argumentExpression)
    if (index.type.kind !== 'scalar') throw new Refusal(e.getStart(), 'an index is a word')
    if (base.type.elem === 'u16') {
      this.#emit({ k: 'push', v: 1 })
      this.#emit({ k: 'bin', op: 'shl' })
    }
    this.#emit({ k: 'bin', op: 'add' })
    return base.type.elem
  }

  #elementValue(e: ts.ElementAccessExpression): Typed {
    const elem = this.#element(e)
    this.#emit({ k: 'load', byte: elem === 'u8' })
    return { type: scalar(elem) }
  }

  #callValue(e: ts.CallExpression): Typed {
    const t = this.#call(e)
    if (t === null) throw new Refusal(e.getStart(), 'this call gives no value')
    return t
  }

  /** A call; its value's type, or null for one that gives none. */
  #call(e: ts.CallExpression): Typed | null {
    if (!ts.isIdentifier(e.expression))
      throw new Refusal(e.getStart(), 'only a named function can be called')
    const name = e.expression.text
    if (BUILTINS.has(name) && this.#find(name) === undefined) return this.#builtin(name, e)
    const sym = this.#find(name)
    if (sym?.kind !== 'fn') throw new Refusal(e.getStart(), `${name} is not a function`)
    if (e.arguments.length !== sym.params.length) {
      throw new Refusal(e.getStart(), `${name} takes ${sym.params.length} arguments`)
    }
    e.arguments.forEach((arg, k) => {
      this.#assignable(sym.params[k] ?? U16, this.expr(arg), arg)
    })
    this.#emit({ k: 'call', fn: name, argc: sym.params.length, ret: sym.ret !== 'void' })
    return sym.ret === 'void' ? null : { type: scalar(sym.ret) }
  }

  #args(e: ts.CallExpression, count: number): Typed[] {
    if (e.arguments.length !== count) {
      throw new Refusal(
        e.getStart(),
        `${(e.expression as ts.Identifier).text} takes ${count} arguments`,
      )
    }
    return e.arguments.map((a) => this.expr(a))
  }

  #constantArg(e: ts.CallExpression, k: number): number {
    const mark = this.ops.length
    const t = this.expr(e.arguments[k] as ts.Expression)
    this.ops.length = mark
    if (t.constant === undefined) throw new Refusal(e.getStart(), 'a CSR is named by a constant')
    return t.constant
  }

  #builtin(name: string, e: ts.CallExpression): Typed | null {
    switch (name) {
      case 'peek':
      case 'peek16':
        this.#args(e, 1)
        this.#emit({ k: 'load', byte: name === 'peek' })
        return { type: scalar(name === 'peek' ? 'u8' : 'u16') }
      case 'poke':
      case 'poke16':
        this.#args(e, 2)
        this.#emit({ k: 'store', byte: name === 'poke' })
        return null
      case 'div': {
        const [a, b] = this.#args(e, 2) as [Typed, Typed]
        const s = this.#signedness(a, b, e)
        this.#emit({ k: 'bin', op: s ? 'div' : 'divu' })
        return { type: s ? I16 : U16 }
      }
      case 'wrap16':
        this.#args(e, 1)
        return { type: U16 }
      case 'ecall':
        return this.#ecall(e)
      case 'csrr':
        this.#emit({ k: 'csrr', csr: this.#constantArg(e, 0) })
        return { type: U16 }
      case 'csrw': {
        const csr = this.#constantArg(e, 0)
        this.expr(e.arguments[1] as ts.Expression)
        this.#emit({ k: 'csrw', csr })
        return null
      }
      case 'wfi':
        this.#args(e, 0)
        this.#emit({ k: 'wfi' })
        return null
      case 'str':
        return this.#string(e)
      case 'addr': {
        const [a] = this.#args(e, 1) as [Typed]
        if (a.type.kind !== 'array') throw new Refusal(e.getStart(), 'addr takes an array')
        return { type: U16 }
      }
      default:
        throw new Refusal(e.getStart(), `${name} is only for a top-level const`)
    }
  }

  #ecall(e: ts.CallExpression): Typed {
    const count = e.arguments.length
    if (count < 1 || count > 5)
      throw new Refusal(e.getStart(), 'ecall takes a service and up to four arguments')
    for (const a of e.arguments) this.expr(a)
    this.#emit({ k: 'ecall', argc: count - 1 })
    return { type: U16 }
  }

  /** str("...") in a function: the string's address in ROM. */
  #string(e: ts.CallExpression): Typed {
    const arg = e.arguments[0]
    if (e.arguments.length !== 1 || arg === undefined || !ts.isStringLiteral(arg)) {
      throw new Refusal(e.getStart(), 'str takes one string literal')
    }
    this.#emit({ k: 'addr', label: this.#ctx.romString(arg.text) })
    return { type: U16 }
  }
}

function isAssignment(kind: ts.SyntaxKind): boolean {
  return kind === ts.SyntaxKind.EqualsToken || COMPOUND[kind] !== undefined
}

function isStep(e: ts.Expression): boolean {
  return (
    ts.isPrefixUnaryExpression(e) &&
    (e.operator === ts.SyntaxKind.PlusPlusToken || e.operator === ts.SyntaxKind.MinusMinusToken)
  )
}

/** A written type: u16, i16, u8, bool (or boolean), u8[] or u16[]. */
export function readType(node: ts.TypeNode): TypeRef {
  if (node.kind === ts.SyntaxKind.BooleanKeyword) return BOOL
  if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
    const name = node.typeName.text
    if (name === 'u16' || name === 'i16' || name === 'u8' || name === 'bool') return scalar(name)
  }
  if (ts.isArrayTypeNode(node) && ts.isTypeReferenceNode(node.elementType)) {
    const name = node.elementType.typeName.getText()
    if (name === 'u8' || name === 'u16') return { kind: 'array', elem: name }
  }
  throw new Refusal(
    node.getStart(),
    `${node.getText()} is not a type of the subset (u16, i16, u8, bool, u8[], u16[])`,
  )
}
