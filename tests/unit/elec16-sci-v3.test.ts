import { dotText } from '@shared/elec16/font'
import type { Elec16 } from '@shared/elec16/machine'
import { describe, expect, it } from 'vitest'
import {
  ans,
  band,
  bigText,
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

describe('→PRIME (section 15.4)', () => {
  /** The answer rows as the screen reader reads them, spaces left out: exponents a line above. */
  const shown = (m: Elec16) => answerRows(m).map((line) => line.replaceAll(' ', ''))

  const prime = (line: string) => {
    const m = switchOn('2d')
    keys(m, `${line} func fp:MORE 3`)
    return m
  }

  it('is the third on FUNC MORE', () => {
    const m = switchOn()
    keys(m, 'func fp:MORE')
    expect(lineAt(m, lineY(1))).toContain('3:→PRIME')
  })

  it.each([
    ['360', '3 6 0', ['32', '2×3×5']],
    ['2026', '2 0 2 6', ['2×1013']],
    ['-12', 'neg 1 2', ['2', '-2×3']],
    ['1024', '1 0 2 4', ['10', '2']],
    ['97', '9 7', ['97']],
    ['12/4', '1 2 frac 4 right', ['3']],
  ])('shows %s as its prime factors, the line answered first', (_, line, factors) => {
    const m = prime(line)
    expect(shown(m)).toEqual(factors)
  })

  it('factors Ans when the line is empty, and leaves Ans as it was', () => {
    const m = switchOn('2d')
    keys(m, '3 6 0 eq ac func fp:MORE 3')
    expect(shown(m)).toEqual(['32', '2×3×5'])
    expect(ans(m)).toBe('360')
    // F⇄D goes back to the answer as it was.
    keys(m, 'fd')
    expect(bigText(m)).toBe('360')
  })

  it('puts a product too wide for the screen on two lines, after the × nearest its middle', () => {
    // By width: 2×3×5×7×11× is 66 dots of 148, 2×3×5×7×11×13× 84.
    const m = prime('6 4 6 9 6 9 3 2 3 0')
    expect(shown(m)).toEqual(['2×3×5×7×11×', '13×17×19×23×29'])
  })

  it('factors the largest prime of ten digits in under five seconds at 4 MHz', () => {
    const m = switchOn('2d')
    keys(m, '9 9 9 9 9 9 9 9 6 7 eq')
    const before = m.state.cycles
    keys(m, 'func fp:MORE 3')
    expect(shown(m)).toEqual(['9999999967'])
    expect(m.state.cycles - before).toBeLessThan(5 * 4_000_000)
  })

  it.each([
    ['0', '0'],
    ['1', '1'],
    ['-1', 'neg 1'],
    ['1.5', '1 dot 5'],
    ['1/3', '1 frac 3 right'],
    ['√2', 'root 2 right'],
    ['10¹⁰', '1 exp 1 0'],
  ])('beeps for %s, which has no prime factors to show', (_, line) => {
    const m = switchOn('2d')
    keys(m, `${line} eq`)
    const before = bigTextOrForm(m)
    keys(m, 'func fp:MORE 3')
    expect(bigTextOrForm(m)).toEqual(before)
  })
})

/** The answer rows (39-63) as the screen reader reads them: the line above them left out. */
function answerRows(m: Elec16): string[] {
  const vram = Uint8Array.from(m.state.vram)
  // Rows 0-38 cleared: bands 0-3 whole, and band 4 but its last row.
  vram.fill(0, 0, 4 * 128)
  for (let x = 0; x < 128; x++) vram[4 * 128 + x] = (vram[4 * 128 + x] ?? 0) & 0x80
  return dotText(vram, 128, 64)
}

/** The answer rows read back, to see that nothing changed. */
const bigTextOrForm = answerRows

describe('the SI prefixes (section 15.3)', () => {
  it('are on FUNC ENG, the page after FUNC, in the line as their letters', () => {
    const m = switchOn()
    keys(m, 'func down')
    expect(band(m)[0]).toBe('FUNC ENG')
    expect(lineAt(m, lineY(0)).replaceAll(' ', '')).toBe('1:k2:M3:G')
    keys(m, 'ac 4 7 func fp:ENG 1 mul 2 2 0 func fp:ENG 8')
    expect(rows(m)[0]).toBe('47k×220p')
  })

  it.each([
    ['k', '1'],
    ['M', '2'],
    ['G', '3'],
    ['T', '4'],
    ['m', '5'],
    ['μ', '6'],
    ['n', '7'],
    ['p', '8'],
    ['f', '9'],
  ])('%s is its power of ten', (_, item) => {
    const m = switchOn()
    // 1 with the prefix, times 1000 to the prefix's power the other way: 1.
    const exps: Record<string, number> = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: -1,
      6: -2,
      7: -3,
      8: -4,
      9: -5,
    }
    const e = exps[item] ?? 0
    const back = e > 0 ? `div 1 0 0 0 pow ${e}` : `mul 1 0 0 0 pow ${-e}`
    keys(m, `1 func fp:ENG ${item} ${back} eq`)
    expect(ans(m)).toBe('1')
  })

  it('works out a circuit: 47k×220p, and an RC filter of 1k and 100n', () => {
    const m = switchOn()
    keys(m, '4 7 func fp:ENG 1 mul 2 2 0 func fp:ENG 8 eq')
    expect(ans(m)).toBe('0.00001034')
    keys(m, 'ac 1 div lp 2 shift exp mul 1 func fp:ENG 1 mul 1 0 0 func fp:ENG 7 rp eq')
    expect(ans(m)).toBe('1591.549431')
  })

  it('answers in decimals first, as a line with a point does, its form on F⇄D', () => {
    const m = switchOn('2d')
    keys(m, '1 func fp:ENG 5 add 1 func fp:ENG 5 eq')
    expect(bigText(m)).toBe('0.002')
    expect(form(m)).toBe('1/500')
    keys(m, 'fd')
    expect(answerRows(m)).toEqual(['1', '500'])
  })

  it('goes on from Ans after an answer, as x² does', () => {
    const m = switchOn()
    keys(m, '2 eq func fp:ENG 1 eq')
    expect(ans(m)).toBe('2000')
  })

  it('shows an ENG answer with its prefix on ENG again, and ×10 on the next', () => {
    const m = switchOn()
    keys(m, '4 7 func fp:ENG 1 mul 2 2 0 func fp:ENG 8 eq shift fd')
    expect(answerRows(m).join(' ')).toContain('-6')
    keys(m, 'shift fd')
    expect(bigText(m, 121)).toBe('10.34')
    expect(answerRows(m).join(' ')).toContain('μ')
    expect(answerRows(m).join(' ')).not.toContain('-6')
    keys(m, 'shift fd')
    expect(answerRows(m).join(' ')).toContain('-6')
  })

  it.each([
    ['no exponent', '5'],
    ['an exponent no prefix has', '1 exp 1 5'],
  ])('beeps on ENG again for %s', (_, line) => {
    const m = switchOn()
    keys(m, `${line} eq shift fd`)
    const before = answerRows(m)
    keys(m, 'shift fd')
    expect(answerRows(m)).toEqual(before)
  })
})
