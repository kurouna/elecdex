import { describe, expect, it } from 'vitest'
import {
  ans,
  band,
  form,
  keys,
  lineAt,
  lineY,
  rightWord,
  rows,
  switchOn,
  variable,
} from './elec16-sci-helpers.js'

/**
 * ELEC-16 SCI's v3 (docs/elec16-sci.md section 15): mod, Π, →PRIME, the SI prefixes, the normal
 * distribution and inequalities, pressed as a hand does and read back from the screen and RAM.
 * Written from section 15 before the ROM had any of it.
 */

describe('mod (section 15.2)', () => {
  it('is on FUNC MORE and shows as a word between its numbers', () => {
    const m = switchOn()
    keys(m, 'func fp:MORE')
    expect(lineAt(m, lineY(0)).startsWith('1:mod')).toBe(true)
    keys(m, 'ac 1 2 7 func fp:MORE 1 1 6')
    expect(rows(m)[0]).toBe('127 mod 16')
  })

  it.each([
    ['127 mod 16', '1 2 7 func fp:MORE 1 1 6', '15'],
    ['1024 mod 7', '1 0 2 4 func fp:MORE 1 7', '2'],
    ['12 mod 4', '1 2 func fp:MORE 1 4', '0'],
    ['0 mod 5', '0 func fp:MORE 1 5', '0'],
    // As strong as x and ÷, from the left; + is weaker.
    ['10 + 7 mod 3', '1 0 add 7 func fp:MORE 1 3', '11'],
    ['6 mod 4 × 2', '6 func fp:MORE 1 4 mul 2', '4'],
    ['20 ÷ 2 mod 3', '2 0 div 2 func fp:MORE 1 3', '1'],
  ])('%s is %s', (_, line, value) => {
    const m = switchOn()
    keys(m, `${line} eq`)
    expect(ans(m)).toBe(value)
    expect(form(m)).toBe(value)
  })

  it('takes the multiplication with no sign after it as its divisor: 100 mod 3A', () => {
    const m = switchOn()
    keys(m, '7 eq sto neg ac 1 0 0 func fp:MORE 1 3 alpha neg eq')
    expect(ans(m)).toBe('16')
  })

  it.each([
    ['-7 mod 3', 'neg 7 func fp:MORE 1 3'],
    ['7 mod -3', '7 func fp:MORE 1 neg 3'],
    ['7 mod 0', '7 func fp:MORE 1 0'],
    ['7.5 mod 2', '7 dot 5 func fp:MORE 1 2'],
    ['7 mod 1/2', '7 func fp:MORE 1 1 frac 2'],
  ])('is MATH for %s: whole numbers from 0, by one or more, alone', (_, line) => {
    const m = switchOn()
    keys(m, `${line} eq`)
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
  })

  it("is in BASE's FUNC, in 32 bits, from 0 alone", () => {
    const m = switchOn()
    keys(m, 'menu 3 func 1 tan tan func down 7 1 0 eq')
    expect(lineAt(m, 11, false, 1)).toBe('FF mod 10')
    expect(rightWord(m, lineY(1))).toBe('0000000F')
    keys(m, 'ac func 2 neg 1 func down 7 2 eq')
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
  })

  it("is not in CPLX's FUNC, which has no remainders", () => {
    const m = switchOn()
    keys(m, 'menu 6 func down')
    expect(band(m)[0]).not.toBe('FUNC MORE')
  })
})

describe('Π (section 15.2)', () => {
  it('is on FUNC MORE, in the line as Π(', () => {
    const m = switchOn()
    keys(m, 'func fp:MORE')
    expect(lineAt(m, lineY(0))).toContain('2:Π(')
    keys(m, '2')
    expect(rows(m)[0]).toBe('Π(')
  })

  it.each([
    ['Π(X,1,5)', 'func fp:MORE 2 alpha lp shift lp 1 shift lp 5', '120', '120'],
    ['Π(1+1/X,1,9)', 'func fp:MORE 2 1 add 1 frac alpha lp shift lp 1 shift lp 9', '10', '10'],
    ['Π(X/2,1,3)', 'func fp:MORE 2 alpha lp frac 2 shift lp 1 shift lp 3', '0.75', '3/4'],
    ['Π(2,3,3)', 'func fp:MORE 2 2 shift lp 3 shift lp 3', '2', '2'],
  ])('%s is %s, its form kept', (_, line, value, exact) => {
    const m = switchOn()
    keys(m, `${line} eq`)
    expect(ans(m)).toBe(value)
    expect(form(m)).toBe(exact)
  })

  it('gives X back as it was', () => {
    const m = switchOn()
    keys(m, '5 sto lp func fp:MORE 2 alpha lp shift lp 1 shift lp 3 eq')
    expect(ans(m)).toBe('6')
    expect(variable(m, 6)).toBe('5')
  })

  it.each([
    ['from more to less', 'func fp:MORE 2 alpha lp shift lp 3 shift lp 1'],
    ['past 1000 terms', 'func fp:MORE 2 1 shift lp 1 shift lp 2 0 0 0'],
    ['from a fraction', 'func fp:MORE 2 alpha lp shift lp 1 frac 2 shift lp 3'],
  ])('is MATH %s, as Σ is', (_, line) => {
    const m = switchOn()
    keys(m, `${line} eq`)
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
  })
})
