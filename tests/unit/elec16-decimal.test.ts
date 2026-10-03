import {
  acos,
  add,
  asin,
  atan,
  compare,
  cos,
  type Dec,
  DecError,
  decode,
  div,
  ERR,
  encode,
  exp,
  floor,
  format,
  frac,
  fromInt,
  ln,
  log,
  mul,
  parse,
  pow,
  sin,
  sqrt,
  sub,
  tan,
} from '@shared/elec16/decimal'
import { describe, expect, it } from 'vitest'

/** The ELEC-16's decimal numbers (docs/elec16.md section 5): twelve digits, shown in ten. */

const n = (text: string): Dec => {
  const minus = text.startsWith('-')
  const p = parse(minus ? text.slice(1) : text)
  if (p === null) throw new Error(text)
  return minus ? sub(fromInt(0), p.value) : p.value
}
const show = (d: Dec, digits?: number) => format(d, digits)
const fails = (f: () => unknown, code: number) => {
  try {
    f()
  } catch (e) {
    expect(e).toBeInstanceOf(DecError)
    expect((e as DecError).code).toBe(code)
    return
  }
  throw new Error('no error')
}

describe('the four operations', () => {
  it('are exact in decimal, rounded once to twelve digits', () => {
    expect(show(add(n('0.1'), n('0.2')))).toBe('0.3')
    expect(show(mul(div(n('1'), n('3')), n('3')))).toBe('1')
    expect(show(div(n('1'), n('3')), 12)).toBe('0.333333333333')
    expect(show(div(n('2'), n('3')), 12)).toBe('0.666666666667')
    expect(show(sub(n('1E12'), n('1')), 12)).toBe('999999999999')
    // The thirteenth digit rounds half away from zero.
    expect(show(add(n('999999999999'), n('0.5')), 12)).toBe('1E12')
    expect(show(mul(n('-2.5'), n('4')))).toBe('-10')
  })

  it('say when a result is too big, and let one too small go to zero', () => {
    fails(() => mul(n('1E60'), n('1E60')), ERR.overflow)
    expect(show(mul(n('1E-60'), n('1E-60')))).toBe('0')
    fails(() => div(n('1'), n('0')), ERR.divideByZero)
  })

  it('compare, and take whole and fractional parts as BASIC does', () => {
    expect(compare(n('2'), n('10'))).toBe(-1)
    expect(compare(n('-0.5'), n('-0.5'))).toBe(0)
    expect(show(floor(n('-2.5')))).toBe('-3')
    expect(show(floor(n('2.5')))).toBe('2')
    expect(show(frac(n('-2.25')))).toBe('-0.25')
  })
})

describe('functions', () => {
  it('take square roots exactly where they are exact', () => {
    expect(show(sqrt(n('144')))).toBe('12')
    expect(show(sqrt(n('2')), 12)).toBe('1.41421356237')
    expect(show(sqrt(n('0.01')))).toBe('0.1')
    fails(() => sqrt(n('-1')), ERR.domain)
  })

  it('give the angles a person expects in degrees, radians and grads', () => {
    expect(show(sin(n('30'), 0))).toBe('0.5')
    expect(show(cos(n('90'), 0))).toBe('0')
    expect(show(cos(n('450'), 0))).toBe('0')
    expect(show(tan(n('45'), 0))).toBe('1')
    expect(show(sin(n('100'), 2))).toBe('1')
    expect(show(asin(n('1'), 0))).toBe('90')
    expect(show(acos(n('0.5'), 0))).toBe('60')
    expect(show(atan(n('1'), 1))).toBe('0.7853981634')
    fails(() => tan(n('90'), 0), ERR.domain)
    // The pole is the exact angle, not a cosine that rounds to 0 beside it.
    fails(() => tan(n('270'), 0), ERR.domain)
    fails(() => tan(n('-90'), 0), ERR.domain)
    fails(() => tan(n('100'), 2), ERR.domain)
    expect(show(tan(n('89.9999999999'), 0))).toMatch(/^5\.7\d+E11$/)
    expect(show(tan(n('90.0000000001'), 0))).toMatch(/^-5\.7\d+E11$/)
    fails(() => asin(n('2'), 0), ERR.domain)
  })

  it('take logarithms and powers', () => {
    expect(show(log(n('1000')))).toBe('3')
    expect(show(ln(exp(n('1'))))).toBe('1')
    expect(show(pow(n('2'), n('10')))).toBe('1024')
    expect(show(pow(n('2'), n('-1')))).toBe('0.5')
    expect(show(pow(n('2'), n('0.5')))).toBe('1.414213562')
    expect(show(pow(n('-2'), n('3')))).toBe('-8')
    fails(() => pow(n('-2'), n('0.5')), ERR.domain)
    // A reciprocal of a power too large to hold is too small to show, as 2^-1000 is.
    expect(show(pow(n('2'), n('-999')))).toBe('0')
    expect(show(pow(n('2'), n('-1000')))).toBe('0')
    fails(() => pow(n('0.1'), n('-200')), ERR.overflow)
    fails(() => pow(n('0'), n('-1')), ERR.divideByZero)
    fails(() => ln(n('0')), ERR.domain)
  })
})

describe('in memory and as text', () => {
  it('fits eight bytes, and refuses bytes that are no number', () => {
    for (const text of ['0', '1', '-3.25', '1E99', '1E-99', '123456789012']) {
      const d = n(text)
      expect(decode(encode(d)), text).toEqual(d)
    }
    expect(Array.from(encode(n('-3.25')))).toEqual([0x80, 0, 0x32, 0x50, 0, 0, 0, 0])
    expect(decode([0x01, 0, 0x10, 0, 0, 0, 0, 0])).toBeNull()
    expect(decode([0, 0, 0x1a, 0, 0, 0, 0, 0])).toBeNull()
    expect(decode([0, 0, 0x01, 0, 0, 0, 0, 0])).toBeNull()
  })

  it('reads a number at the start of text, saying how much it took', () => {
    expect(parse('12.5+3')).toEqual({ value: n('12.5'), length: 4 })
    expect(parse('.5')?.length).toBe(2)
    expect(parse('2E3X')?.length).toBe(3)
    expect(parse('2EX')?.length).toBe(1)
    expect(parse('A1')).toBeNull()
  })

  it('shows numbers as a pocket computer does, in ten digits', () => {
    expect(show(n('1234567890'))).toBe('1234567890')
    expect(show(n('12345678901'))).toBe('1.23456789E10')
    expect(show(n('0.000123'))).toBe('0.000123')
    expect(show(n('1.5E-12'))).toBe('1.5E-12')
    expect(show(n('-0.5'))).toBe('-0.5')
    expect(show(div(n('2'), n('3')))).toBe('0.6666666667')
    expect(show(n('9999999999.9'))).toBe('1E10')
  })
})
