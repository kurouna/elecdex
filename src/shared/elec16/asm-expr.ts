/**
 * The assembler's expressions (docs/elec16.md section 6): numbers in decimal, 0x hex, 0b
 * binary and 'c' characters; symbols; `$` for the address of the line; unary - ~ +; and
 * * / % + - << >> & ^ | with C's precedence; parentheses; lo(e) and hi(e) for the bytes of
 * a word. Arithmetic is on whole numbers; what a field can hold is checked where it is used.
 */

export type Lookup = (name: string) => number | undefined

/** An expression that names a symbol not defined yet: the pass that sees it tries again. */
export class Unresolved extends Error {}

const BINARY: readonly (readonly string[])[] = [
  ['|'],
  ['^'],
  ['&'],
  ['<<', '>>'],
  ['+', '-'],
  ['*', '/', '%'],
]

interface Cursor {
  text: string
  at: number
}

const skip = (c: Cursor): void => {
  while (c.text[c.at] === ' ' || c.text[c.at] === '\t') c.at++
}

/** Evaluates `text` whole; throws an Error with what is wrong, or Unresolved. */
export function evaluate(text: string, lookup: Lookup, here: number): number {
  const c: Cursor = { text, at: 0 }
  const value = level(c, 0, lookup, here)
  skip(c)
  if (c.at < text.length) throw new Error(`unexpected "${text.slice(c.at)}" in "${text}"`)
  return value
}

function level(c: Cursor, depth: number, lookup: Lookup, here: number): number {
  const ops = BINARY[depth]
  if (ops === undefined) return unary(c, lookup, here)
  let left = level(c, depth + 1, lookup, here)
  for (;;) {
    skip(c)
    const op = ops.find((o) => c.text.startsWith(o, c.at))
    if (op === undefined) return left
    c.at += op.length
    const right = level(c, depth + 1, lookup, here)
    left = apply(op, left, right)
  }
}

function apply(op: string, a: number, b: number): number {
  switch (op) {
    case '|':
      return a | b
    case '^':
      return a ^ b
    case '&':
      return a & b
    case '<<':
      return a << b
    case '>>':
      return a >> b
    case '+':
      return a + b
    case '-':
      return a - b
    case '*':
      return Math.imul(a, b)
    default:
      if (b === 0) throw new Error('division by zero')
      return op === '/' ? Math.trunc(a / b) : a % b
  }
}

function unary(c: Cursor, lookup: Lookup, here: number): number {
  skip(c)
  const ch = c.text[c.at]
  if (ch === '-' || ch === '~' || ch === '+') {
    c.at++
    const v = unary(c, lookup, here)
    return ch === '-' ? -v : ch === '~' ? ~v : v
  }
  return primary(c, lookup, here)
}

function primary(c: Cursor, lookup: Lookup, here: number): number {
  skip(c)
  const rest = c.text.slice(c.at)
  if (rest.startsWith('(')) {
    c.at++
    const v = level(c, 0, lookup, here)
    skip(c)
    if (c.text[c.at] !== ')') throw new Error(`missing ) in "${c.text}"`)
    c.at++
    return v
  }
  const literal = /^(0x[0-9a-f_]+|0b[01_]+|\d[\d_]*|'(\\.|[^'\\])')/i.exec(rest)
  if (literal !== null) {
    c.at += literal[0].length
    return number(literal[0])
  }
  if (rest.startsWith('$')) {
    c.at++
    return here
  }
  return symbol(c, rest, lookup, here)
}

function symbol(c: Cursor, rest: string, lookup: Lookup, here: number): number {
  const name = /^[A-Za-z_.][\w.]*/.exec(rest)?.[0]
  if (name === undefined) throw new Error(`expected a value in "${c.text}"`)
  c.at += name.length
  skip(c)
  const fn = name.toLowerCase()
  if ((fn === 'lo' || fn === 'hi') && c.text[c.at] === '(') {
    const v = primary(c, lookup, here)
    return fn === 'lo' ? v & 0xff : (v >> 8) & 0xff
  }
  const v = lookup(name)
  if (v === undefined) throw new Unresolved(`undefined symbol ${name}`)
  return v
}

const ESCAPES: Record<string, number> = { n: 10, r: 13, t: 9, '0': 0, '\\': 92, "'": 39, '"': 34 }

function number(text: string): number {
  if (text.startsWith("'")) {
    const inner = text.slice(1, -1)
    return inner.startsWith('\\')
      ? (ESCAPES[inner[1] ?? ''] ?? inner.charCodeAt(1))
      : inner.charCodeAt(0)
  }
  const clean = text.replace(/_/g, '').toLowerCase()
  if (clean.startsWith('0x')) return Number.parseInt(clean.slice(2), 16)
  if (clean.startsWith('0b')) return Number.parseInt(clean.slice(2), 2)
  return Number.parseInt(clean, 10)
}

/** A string literal's bytes ("..." with \n \r \t \0 \\ \" escapes), ASCII only. */
export function stringBytes(literal: string): number[] {
  const inner = literal.slice(1, -1)
  const out: number[] = []
  for (let k = 0; k < inner.length; k++) {
    const ch = inner[k] ?? ''
    if (ch === '\\') {
      const next = inner[++k] ?? ''
      out.push(ESCAPES[next] ?? next.charCodeAt(0))
    } else {
      const code = ch.charCodeAt(0)
      if (code > 0xff) throw new Error(`"${ch}" is not in the character set`)
      out.push(code)
    }
  }
  return out
}
