import { decode, format } from '@shared/elec16/decimal'
import type { Elec16 } from '@shared/elec16/machine'
import { sciKeyCode } from '@shared/elec16/sci-keys'
import { describe, expect, it } from 'vitest'
import {
  ans,
  band,
  bigText,
  form,
  keys,
  lineAt,
  rightAt,
  rows,
  switchOn,
  variable,
} from './elec16-sci-helpers.js'

/**
 * ELEC-16 SCI's v2 (docs/elec16-sci.md section 14): CONST, CONV, Σ, d/dx and ∫, CPLX, MATRIX
 * and PROG, pressed as a hand does and read back from the screen and from RAM. Written from
 * section 14 before the ROM had any of it.
 */

/** A number of the maths unit kept at `at` in RAM, in ten digits. */
const numberAt = (m: Elec16, at: number): string => {
  const d = decode(m.state.ram.subarray(at, at + 8))
  return d === null ? '?' : format(d, 10)
}

/** CPLX's Ans (section 14.1: 2870, its real part and then its imaginary part). */
const complexAns = (m: Elec16): [string, string] => [numberAt(m, 0x2870), numberAt(m, 0x2878)]

/** A matrix (MatA-MatD, MatAns: 0-4) as rows of numbers; its size first (section 14.1). */
const matrix = (m: Elec16, k: number): string[][] => {
  const at = 0x2900 + k * 80
  const r = m.state.ram[at] ?? 0
  const c = m.state.ram[at + 1] ?? 0
  return Array.from({ length: r }, (_, i) =>
    Array.from({ length: c }, (_, j) => numberAt(m, at + 2 + (i * 3 + j) * 8)),
  )
}

/** The length of program 1 as kept (section 14.1: 2C02). */
const peekLength = (m: Elec16): number => m.state.ram[0x2c02] ?? 0

/** A matrix put in through EDIT (FUNC page 3): its size, then its numbers row by row. */
function edit(m: Elec16, which: number, r: number, c: number, numbers: string[]): void {
  keys(m, `func down down ${which} ${r} ${c}`)
  for (const n of numbers) keys(m, `${n} eq`)
  keys(m, 'eq')
}

describe('MENU with the v2 modes (section 14.9)', () => {
  it('lists eight modes and keeps the one chosen through OFF and ON', () => {
    const m = switchOn()
    keys(m, 'menu')
    // CALC, the mode it is in, is marked (inverted): the rest of its line reads.
    expect(lineAt(m, 11).endsWith('2:STATS')).toBe(true)
    expect([20, 29, 38].map((y) => lineAt(m, y))).toEqual([
      '3:BASE    4:TABLE',
      '5:EQUATION 6:CPLX',
      '7:MATRIX  8:PROG',
    ])
    keys(m, '8')
    expect(lineAt(m, 1, true)).toBe('PROG')
    keys(m, 'shift on on')
    expect(lineAt(m, 1, true)).toBe('PROG')
  })
})

describe('CONST (section 14.3)', () => {
  it('lists the constants a page at a time on SHIFT FUNC, by name and what they are', () => {
    const m = switchOn()
    keys(m, 'shift func')
    expect(band(m)).toEqual(['CONST', '1/4'])
    expect([11, 20, 29, 38, 47].map((y) => lineAt(m, y))).toEqual([
      '1:c₀ LIGHT',
      '2:h PLANCK',
      '3:ħ PLANCK/2π',
      '4:G GRAVITATION',
      '5:ε₀ ELECTRIC',
    ])
    keys(m, 'down down down')
    expect(lineAt(m, 11)).toBe('1:g GRAVITY')
    expect(lineAt(m, 47)).toBe('5:Vm MOLAR VOLUME')
  })

  it.each([
    ['1', '299792458'],
    ['2', '6.62607015E-34'],
    ['3', '1.054571818E-34'],
    ['down 2', '1.602176634E-19'],
    ['down 3', '9.109383714E-31'],
    ['down down 2', '6.02214076E23'],
    ['down down 4', '8.314462618'],
    ['down down down 1', '9.80665'],
    ['down down down 2', '101325'],
    ['down down down 5', '2.241396955E-2'],
  ])('puts in the constant chosen by %s: %s', (choice, value) => {
    const m = switchOn()
    keys(m, `shift func ${choice} eq`)
    expect(ans(m)).toBe(value)
  })

  it('shows a constant by its name in the line and works with it', () => {
    const m = switchOn()
    keys(m, '2 shift func 2')
    expect(rows(m)[0]).toBe('2h')
    keys(m, 'eq')
    expect(ans(m)).toBe('1.32521403E-33')
  })

  it('goes back to the line on AC, and is not in BASE', () => {
    const m = switchOn()
    keys(m, '7 shift func ac')
    expect(rows(m)[0]).toBe('7')
    keys(m, 'menu 3 shift func')
    expect(band(m)[0]).not.toBe('CONST')
  })
})

describe('CONV (section 14.4)', () => {
  it('lists the conversions both ways on SHIFT MENU', () => {
    const m = switchOn()
    keys(m, 'shift menu')
    expect(band(m)).toEqual(['CONV', '1/4'])
    expect(lineAt(m, 11)).toBe('1:in→cm    2:cm→in')
    keys(m, 'down down')
    expect(lineAt(m, 11)).toBe('1:°F→°C    2:°C→°F')
  })

  it.each([
    ['2 shift menu 1', '5.08'],
    ['2 shift menu 2', '0.7874015748'],
    ['1 0 0 shift menu down down 1', '37.77777778'],
    ['1 0 0 shift menu down down 2', '212'],
    ['3 6 shift menu down down 3', '10'],
    ['1 shift menu down down down 9', '1.602176634E-19'],
  ])('%s is %s', (line, value) => {
    const m = switchOn()
    keys(m, line)
    expect(ans(m)).toBe(value)
  })

  it('converts Ans with no line, names the conversion over the answer, keeps its form', () => {
    const m = switchOn()
    keys(m, '3 eq shift menu 1')
    expect(ans(m)).toBe('7.62')
    expect(bigText(m)).toBe('7.62')
    expect(lineAt(m, 40)).toBe('in→cm')
    expect(form(m)).toBe('381/50')
  })

  it('is CALC alone', () => {
    const m = switchOn()
    keys(m, 'menu 3 1 eq shift menu')
    expect(band(m)[0]).not.toBe('CONV')
  })
})

describe('Σ, d/dx and ∫ (section 14.5)', () => {
  it('are on FUNC as 8, 9 and 0, shown by their names', () => {
    const m = switchOn()
    keys(m, 'func')
    expect(lineAt(m, 38)).toBe('7:rec(   8:d/dx(')
    expect(lineAt(m, 47)).toBe('9:∫(     0:Σ(')
    keys(m, '8 func 9 func 0')
    expect(rows(m)[0]).toBe('d/dx(∫(Σ(')
  })

  it.each([
    ['Σ(X²,1,10)', 'func 0 alpha lp sq shift lp 1 shift lp 1 0 rp', '385'],
    ['Σ(X,1,100)', 'func 0 alpha lp shift lp 1 shift lp 1 0 0', '5050'],
    ['d/dx(X³,2)', 'func 8 alpha lp shift sq shift lp 2 rp', '12'],
    ['d/dx(ln(X),2)', 'func 8 ln alpha lp rp shift lp 2', '0.5'],
    ['d/dx(sin(X),0) in DEG', 'func 8 sin alpha lp rp shift lp 0', '1.745329252E-2'],
    ['∫(X²,0,3)', 'func 9 alpha lp sq shift lp 0 shift lp 3 rp', '9'],
    ['∫(X,3,1)', 'func 9 alpha lp shift lp 3 shift lp 1', '-4'],
    // A power's ^( has its own ): the body's comma is still found after it.
    [
      '∫(e^(-X²),-3,3)',
      'func 9 shift ln neg alpha lp sq rp shift lp neg 3 shift lp 3',
      '1.772414697',
    ],
    ['Σ(2^(X),1,3)', 'func 0 2 pow alpha lp rp shift lp 1 shift lp 3', '14'],
  ])('%s is %s', (_, line, value) => {
    const m = switchOn()
    keys(m, `${line} eq`)
    expect(ans(m)).toBe(value)
  })

  it('integrates sin over half a turn in RAD, and 1/√X with its end at 0', () => {
    const m = switchOn()
    keys(m, 'setup 4 ac func 9 sin alpha lp rp shift lp 0 shift lp shift exp eq')
    expect(Number(ans(m))).toBeCloseTo(2, 9)
    keys(m, 'ac func 9 1 div root alpha lp rp shift lp 0 shift lp 1 eq')
    expect(Number(ans(m))).toBeCloseTo(2, 5)
  })

  it('keeps a sum exact: Σ(1/X,1,4) is 25/12', () => {
    const m = switchOn('2d')
    keys(m, 'func 0 1 frac alpha lp right shift lp 1 shift lp 4 rp eq')
    expect(form(m)).toBe('25/12')
  })

  it('puts X back as it was', () => {
    const m = switchOn()
    keys(m, '5 sto lp func 0 alpha lp shift lp 1 shift lp 3 eq')
    expect(ans(m)).toBe('6')
    expect(variable(m, 6)).toBe('5')
  })

  it('says MATH for a sum from a larger end or over more than 1000 terms, and ∫ in ∫', () => {
    for (const line of [
      'func 0 alpha lp shift lp 3 shift lp 1',
      'func 0 alpha lp shift lp 1 shift lp 2 0 0 0',
      'func 9 func 9 alpha lp shift lp 0 shift lp 1 rp shift lp 0 shift lp 1',
    ]) {
      const m = switchOn()
      keys(m, `${line} eq`)
      expect(lineAt(m, 1, true), line).toBe('ERR:MATH')
    }
  })
})

describe('CPLX (section 14.6)', () => {
  const cplx = (line: string): Elec16 => {
    const m = switchOn()
    keys(m, `menu 6 ${line} eq`)
    return m
  }

  it.each([
    ['(1+2i)(3-i)', 'lp 1 add 2 hyp rp lp 3 sub hyp', ['5', '5']],
    ['i²', 'hyp sq', ['-1', '0']],
    ['1÷i', '1 div hyp', ['0', '-1']],
    ['2∠90', '2 shift hyp 9 0', ['0', '2']],
    ['√(-4)', 'root neg 4', ['0', '2']],
    ['abs(3+4i)', 'shift neg 3 add 4 hyp', ['5', '0']],
    ['arg(1+i)', 'func 4 1 add hyp', ['45', '0']],
    ['conj(2+3i)', 'func 5 2 add 3 hyp', ['2', '-3']],
    ['Im(2+3i)', 'func 7 2 add 3 hyp', ['3', '0']],
    ['(1+i)^4', 'lp 1 add hyp rp pow 4', ['-4', '0']],
    ['e^(iπ)', 'shift ln hyp shift exp rp', ['-1', '0']],
  ] as [string, string, [string, string]][])('%s is %s', (_, line, value) => {
    expect(complexAns(cplx(line))).toEqual(value)
  })

  it('shows a + bi on two lines, a real answer in big digits, and r∠θ after F⇄D', () => {
    const m = cplx('lp 1 add 2 hyp rp lp 3 sub hyp')
    expect(rows(m)[0]).toBe('(1+2i)(3-i')
    expect([rightAt(m, 47), rightAt(m, 56)]).toEqual(['5', '+5i'])
    keys(m, 'fd')
    expect([rightAt(m, 47), rightAt(m, 56)]).toEqual(['7.071067812', '∠45'])
    keys(m, 'ac hyp sq eq')
    expect(bigText(m)).toBe('-1')
  })

  it('says MATH for a real function of a complex number', () => {
    const m = cplx('sin hyp')
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
  })

  it('keeps its own Ans, apart from CALC’s, through OFF and ON', () => {
    const m = switchOn()
    keys(m, '7 eq menu 6 2 hyp eq')
    keys(m, 'shift on on')
    expect(complexAns(m)).toEqual(['0', '2'])
    keys(m, 'ans add 1 eq')
    expect(complexAns(m)).toEqual(['1', '2'])
    keys(m, 'menu 1')
    expect(ans(m)).toBe('7')
  })

  it('lists i, ∠ and its functions on FUNC, and beeps for STO, RCL, M+ and f(x)', () => {
    const m = switchOn()
    keys(m, '7 sto neg menu 6 func')
    expect(lineAt(m, 11)).toBe('1:i      2:∠')
    // STO waits for no variable: the next key types as it would.
    keys(m, '1 sto neg 1 shift sto mplus fx')
    expect(rows(m)[0]).toBe('i-1')
    expect(variable(m, 0)).toBe('7')
  })

  it('works out Re(, x³, x⁻¹ and a variable as a real number', () => {
    const m = switchOn()
    keys(m, '3 sto neg menu 6 func 6 alpha neg add 2 hyp rp eq')
    expect(complexAns(m)).toEqual(['3', '0'])
    keys(m, 'lp 1 add hyp rp shift sq eq')
    expect(complexAns(m)).toEqual(['-2', '2'])
    keys(m, 'lp 1 add hyp rp inv eq')
    expect(complexAns(m)).toEqual(['0.5', '-0.5'])
  })
})

describe('MATRIX (section 14.7)', () => {
  const withA = (): Elec16 => {
    const m = switchOn()
    keys(m, 'menu 7')
    edit(m, 1, 2, 2, ['1', '2', '3', '4'])
    return m
  }

  it('puts a matrix in through EDIT: its size, then its numbers row by row', () => {
    const m = withA()
    expect(matrix(m, 0)).toEqual([
      ['1', '2'],
      ['3', '4'],
    ])
    expect(rows(m)[0]).toBe('')
  })

  it.each([
    ['det(MatA)', 'func down 1 func 1 rp', '-2'],
    ['abs(det(MatA))', 'shift neg func down 1 func 1 rp rp', '2'],
  ])('%s is %s', (_, line, value) => {
    const m = withA()
    keys(m, `${line} eq`)
    expect(ans(m)).toBe(value)
  })

  it.each([
    [
      'MatA⁻¹',
      'func 1 inv',
      [
        ['-2', '1'],
        ['1.5', '-0.5'],
      ],
    ],
    [
      'MatA×MatA',
      'func 1 mul func 1',
      [
        ['7', '10'],
        ['15', '22'],
      ],
    ],
    [
      'MatA²',
      'func 1 sq',
      [
        ['7', '10'],
        ['15', '22'],
      ],
    ],
    [
      '2MatA',
      '2 func 1',
      [
        ['2', '4'],
        ['6', '8'],
      ],
    ],
    [
      'MatA-MatA',
      'func 1 sub func 1',
      [
        ['0', '0'],
        ['0', '0'],
      ],
    ],
    [
      'trn(MatA)',
      'func down 2 func 1',
      [
        ['1', '3'],
        ['2', '4'],
      ],
    ],
  ] as [string, string, string[][]][])('%s is %s', (_, line, value) => {
    const m = withA()
    keys(m, `${line} eq`)
    expect(matrix(m, 4)).toEqual(value)
    expect(lineAt(m, 1, true)).toBe('MatAns')
  })

  it('keeps Ans a matrix through OFF and ON, as MatAns is kept', () => {
    // Whether Ans was MatAns was not kept: switched on again, Ans was the last number instead.
    const m = withA()
    keys(m, 'func 1 eq')
    expect(lineAt(m, 1, true)).toBe('MatAns')
    keys(m, 'shift on on ac ans mul 2 eq')
    expect(matrix(m, 4)).toEqual([
      ['2', '4'],
      ['6', '8'],
    ])
  })

  it('works with vectors: dot, cross, length and the angle between', () => {
    const m = switchOn()
    keys(m, 'menu 7')
    edit(m, 2, 1, 3, ['1', '2', '3'])
    edit(m, 3, 1, 3, ['4', '5', '6'])
    keys(m, 'func down 3 func 2 shift lp func 3 eq')
    expect(ans(m)).toBe('32')
    keys(m, 'ac func down 4 func 2 shift lp func 3 eq')
    expect(matrix(m, 4)).toEqual([['-3', '6', '-3']])
    keys(m, 'ac shift neg func 2 eq')
    expect(ans(m)).toBe('3.741657387')
    keys(m, 'ac func down 5 func 2 shift lp func 3 eq')
    expect(ans(m)).toBe('12.93315449')
  })

  it('says DIM when the sizes do not fit, and MATH for a matrix with no inverse', () => {
    const m = withA()
    edit(m, 2, 1, 3, ['1', '2', '3'])
    keys(m, 'func 1 add func 2 eq')
    expect(lineAt(m, 1, true)).toBe('ERR:DIM')
    keys(m, 'ac')
    edit(m, 3, 2, 2, ['1', '2', '2', '4'])
    keys(m, 'func 3 inv eq')
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
  })

  it('goes back to the line from the answer, MatAns named under it', () => {
    const m = withA()
    keys(m, 'func 1 inv eq eq')
    expect(rows(m)[0]).toBe('MatA⁻¹')
    expect(rightAt(m, 47)).toBe('MatAns')
  })

  it('keeps the matrices through OFF and ON', () => {
    const m = withA()
    keys(m, 'shift on on')
    expect(matrix(m, 0)).toEqual([
      ['1', '2'],
      ['3', '4'],
    ])
  })
})

describe('PROG (section 14.8)', () => {
  /** PROG, program 1 chosen, `program` typed. */
  const typed = (program: string): Elec16 => {
    const m = switchOn()
    keys(m, `menu 8 1 ${program}`)
    return m
  }
  const HYPOTENUSE =
    'func 1 sto alpha neg func 4 func 1 sto alpha dms func 4 root alpha neg sq add alpha dms sq'
  const COUNT =
    '1 sto alpha lp func 4 func down down 1 1 func 4 alpha lp func 3 func 4 alpha lp add 1 sto alpha lp func 4 alpha lp func down 5 3 func 5 func down down 2 1'

  it('lists four programs, each EMPTY at first', () => {
    const m = switchOn()
    keys(m, 'menu 8')
    expect([11, 20, 29, 38].map((y) => lineAt(m, y))).toEqual([
      '1:P1  EMPTY',
      '2:P2  EMPTY',
      '3:P3  EMPTY',
      '4:P4  EMPTY',
    ])
  })

  it('edits a program as a line, STO typing →, its name and keys under it', () => {
    const m = typed(HYPOTENUSE)
    expect(rows(m)[0]).toBe('?→A:?→B:√(A²+B²')
    expect(lineAt(m, 47)).toBe('P1 =:RUN AC:LIST')
  })

  it('asks for each value and answers with the last', () => {
    const m = typed(HYPOTENUSE)
    keys(m, 'eq')
    expect(lineAt(m, 11)).toBe('A?')
    keys(m, '3 eq')
    expect(lineAt(m, 11)).toBe('B?')
    keys(m, '4 eq')
    expect(ans(m)).toBe('5')
    expect(bigText(m)).toBe('5')
  })

  it('shows a value at ▶ and waits for =, going round by lbl and goto while ⇒ holds', () => {
    const m = typed(COUNT)
    expect(rows(m)[0]).toBe('1→X:lbl 1:X▶:X+1→X:X≤')
    keys(m, 'eq')
    expect(bigText(m)).toBe('1')
    keys(m, 'eq')
    expect(bigText(m)).toBe('2')
    keys(m, 'eq')
    expect(bigText(m)).toBe('3')
    keys(m, 'eq')
    expect(ans(m)).toBe('4')
    expect(variable(m, 6)).toBe('4')
  })

  it('stops on ON, the program kept; AC on the line goes to the list', () => {
    const m = typed('func down down 1 1 func 4 func down down 2 1')
    // A loop that never ends: = pressed and the machine run a while, never waiting for a key.
    const eq = sciKeyCode('eq')
    m.press(eq)
    m.release(eq)
    for (let k = 0; k < 20; k++) m.run(200_000)
    keys(m, 'on')
    expect(lineAt(m, 1, true)).toBe('PROG')
    expect(lineAt(m, 11)).toBe('1:P1  5 STEPS')
    keys(m, '1')
    expect(rows(m)[0]).toBe('lbl 1:goto 1')
  })

  it('keeps the programs through OFF and ON', () => {
    const m = typed(HYPOTENUSE)
    keys(m, 'ac shift on on')
    expect(lineAt(m, 11)).toBe('1:P1  14 STEPS')
  })

  it('stops on AC at ? and at ▶, the program kept', () => {
    const m = typed('func 1 sto alpha neg func 4 alpha neg func 3')
    keys(m, 'eq ac')
    expect(lineAt(m, 1, true)).toBe('PROG')
    keys(m, '1 eq 5 eq')
    expect(bigText(m)).toBe('5')
    keys(m, 'ac')
    expect(lineAt(m, 11)).toBe('1:P1  6 STEPS')
  })

  it('says SYNTAX for a goto with no lbl, the cursor at it, and FUNC CLEAR empties the program', () => {
    const m = typed('1 add 1 func 4 func down down 2 5')
    keys(m, 'eq')
    expect(lineAt(m, 1, true)).toBe('ERR:SYNTAX')
    keys(m, 'left')
    // goto is token 4: the cursor before it.
    expect((m.state.lcd.cursor & 0xff) + 1).toBe(4 * 6)
    keys(m, 'func down down 0')
    expect(rows(m)[0]).toBe('')
    keys(m, 'ac')
    expect(lineAt(m, 11)).toBe('1:P1  EMPTY')
  })

  it.each([
    ['2<3', 'func down 3', '1'],
    ['3<2', 'func down 3', '0', '3', '2'],
    ['2=2', 'func down 1', '1', '2', '2'],
    ['2≠2', 'func down 2', '0', '2', '2'],
    ['3>2', 'func down 4', '1', '3', '2'],
    ['2≥2', 'func down 6', '1', '2', '2'],
  ] as [string, string, string, string?, string?][])(
    'compares at the outermost level: %s is %s',
    (_, op, value, a = '2', b = '3') => {
      const m = typed(`${a} ${op} ${b}`)
      keys(m, 'eq')
      expect(ans(m)).toBe(value)
    },
  )

  it('stores and shows in one statement, →V▶, and lists CALC’s FUNC after its own pages', () => {
    const m = typed('6 sto alpha neg func 3')
    keys(m, 'eq')
    expect(bigText(m)).toBe('6')
    keys(m, 'eq')
    expect(variable(m, 0)).toBe('6')
    keys(m, '1 func down down down')
    expect(lineAt(m, 11)).toBe('1:gcd(   2:lcm(')
  })

  it('takes 199 steps and no more', () => {
    const m = typed('1 '.repeat(200))
    expect(peekLength(m)).toBe(199)
  })
})

describe('v2 in the RAM map (section 14.1)', () => {
  it('sets out its region, marked 5C48 at 2800, over what a machine from before v2 left there', () => {
    const m = switchOn()
    keys(m, '4 2 eq')
    // RAM from before v2: whatever was at 2800-2FFF, no mark.
    m.state.ram.fill(0xa5, 0x2800, 0x3000)
    keys(m, 'shift on on')
    expect((m.state.ram[0x2800] ?? 0) | ((m.state.ram[0x2801] ?? 0) << 8)).toBe(0x5c48)
    expect(ans(m)).toBe('42')
    expect(complexAns(m)).toEqual(['0', '0'])
    expect(matrix(m, 0)).toEqual([])
    keys(m, 'menu 8')
    expect([11, 20, 29, 38].map((y) => lineAt(m, y))).toEqual([
      '1:P1  EMPTY',
      '2:P2  EMPTY',
      '3:P3  EMPTY',
      '4:P4  EMPTY',
    ])
  })
})

describe('what section 14 promises across the modes', () => {
  it('puts a constant into CPLX, MATRIX and PROG lines too', () => {
    const m = switchOn()
    keys(m, 'menu 6 2 shift func 1 eq')
    expect(complexAns(m)).toEqual(['599584916', '0'])
    keys(m, 'menu 7 shift func down down down 1 eq')
    expect(ans(m)).toBe('9.80665')
    keys(m, 'menu 8 1 shift func 2 eq')
    expect(ans(m)).toBe('6.62607015E-34')
  })

  it("clears CPLX's Ans and the matrices with SETUP's CLEAR MEMORY, the programs kept", () => {
    const m = switchOn()
    keys(m, 'menu 6 2 hyp eq menu 7')
    edit(m, 1, 1, 2, ['5', '6'])
    keys(m, 'menu 8 1 7 ac menu 1 setup down 3 eq')
    expect(complexAns(m)).toEqual(['0', '0'])
    expect(matrix(m, 0)).toEqual([])
    keys(m, 'ac menu 8')
    expect(lineAt(m, 11)).toBe('1:P1  1 STEPS')
  })

  it("keeps a matrix's numbers where both sizes have them, and = keeps its size", () => {
    const m = switchOn()
    keys(m, 'menu 7')
    edit(m, 1, 2, 2, ['1', '2', '3', '4'])
    keys(m, 'func down down 1 3 3 eq')
    expect(matrix(m, 0)).toEqual([
      ['1', '2', '0'],
      ['3', '4', '0'],
      ['0', '0', '0'],
    ])
    keys(m, 'func down down 1 eq 9 eq eq')
    expect(matrix(m, 0)[0]).toEqual(['9', '2', '0'])
  })

  it('turns a real CPLX answer to r∠θ with F⇄D as well', () => {
    const m = switchOn()
    keys(m, 'menu 6 neg 2 eq fd')
    expect([rightAt(m, 47), rightAt(m, 56)]).toEqual(['2', '∠180'])
  })

  it('goes back into the program at the error in the statement that made it', () => {
    const m = switchOn()
    // 1→A:2÷0 - the division by 0 is token 5 of the program.
    keys(m, 'menu 8 1 1 sto alpha neg func 4 2 div 0 eq')
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
    keys(m, 'left')
    expect(rows(m)[0]).toBe('1→A:2÷0')
    expect((m.state.lcd.cursor & 0xff) + 1).toBe(5 * 6)
  })

  it("makes the manual's 2 in→cm 127/25 in 2D, F⇄D showing it", () => {
    const m = switchOn('2d')
    keys(m, '2 shift menu 1')
    expect(bigText(m)).toBe('5.08')
    keys(m, 'fd')
    expect(form(m)).toBe('127/25')
    expect(bigText(m)).toBe('')
  })
})

describe('found in the review of 2026-10-25', () => {
  it('goes on with a program after its answer, never over it', () => {
    const m = switchOn()
    keys(m, 'menu 8 1 1 add 2 eq 5')
    expect(rows(m)[0]).toBe('1+25')
    keys(m, 'eq add')
    expect(rows(m)[0]).toBe('1+25+')
    expect(peekLength(m)).toBe(5)
  })

  it('beeps for STO and f(x) after ALPHA too in v2 modes, and for SHIFT FUNC in BASE', () => {
    const m = switchOn()
    keys(m, '7 sto neg menu 8 1 1 add 2 eq alpha sto')
    expect(rows(m)[0]).toBe('1+2')
    expect(variable(m, 0)).toBe('7')
    keys(m, 'ac menu 6 2 add hyp alpha sto alpha fx eq')
    expect(complexAns(m)).toEqual(['2', '1'])
    keys(m, 'menu 3 shift func')
    expect(band(m)[0]).not.toBe('FUNC')
  })

  it.each([
    ['1ᴇ90', '1 exp 9 0', ['1E90', '0']],
    ['1÷1ᴇ50', '1 div 1 exp 5 0', ['1E-50', '0']],
    ['1÷1ᴇ-50', '1 div 1 exp neg 5 0', ['1E50', '0']],
    ['abs(1ᴇ60)', 'shift neg 1 exp 6 0', ['1E60', '0']],
    ['1÷(1ᴇ50 i)', '1 div lp 1 exp 5 0 hyp rp', ['0', '-1E-50']],
  ] as [string, string, [string, string]][])(
    'CPLX works out %s without leaving the range',
    (_, line, value) => {
      const m = switchOn()
      keys(m, `menu 6 ${line} eq`)
      expect(complexAns(m)).toEqual(value)
    },
  )

  it('finds the angle between a vector and itself: 0', () => {
    const m = switchOn()
    keys(m, 'menu 7')
    edit(m, 2, 1, 3, ['1', '1', '1'])
    keys(m, 'func down 5 func 2 shift lp func 2 eq')
    expect(ans(m)).toBe('0')
  })

  it('places the next error right after ON stopped a program', () => {
    const m = switchOn()
    keys(m, 'menu 8 1 func down down 1 1 func 4 1 add 1 func 4 func down down 2 1')
    const eq = sciKeyCode('eq')
    m.press(eq)
    m.release(eq)
    for (let k = 0; k < 20; k++) m.run(200_000)
    keys(m, 'on menu 1 1 add mul 2 eq left 9')
    expect(rows(m)[0]).toBe('1+9×2')
  })

  it('goes back to the grid from an error in a cell, and ON leaves EDIT for the line', () => {
    const m = switchOn()
    keys(m, 'menu 7 func down down 1 1 1 1 add eq')
    expect(lineAt(m, 1, true)).toBe('ERR:SYNTAX')
    keys(m, 'left')
    expect(band(m)[0]).toBe('MatA')
    keys(m, 'ac ac')
    expect(band(m)[0]).not.toBe('MatA')
    keys(m, 'func down down 1 on')
    expect(band(m)[0]).not.toBe('MatA')
    keys(m, '2 add 3 eq')
    expect(ans(m)).toBe('5')
  })

  it('goes back to the ? statement after an error in what was typed for it', () => {
    const m = switchOn()
    // 1→B:?→A, the ? at token 4.
    keys(m, 'menu 8 1 1 sto alpha dms func 4 func 1 sto alpha neg eq 1 div 0 eq')
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
    keys(m, 'left')
    expect((m.state.lcd.cursor & 0xff) + 1).toBe(4 * 6)
  })

  it('beeps in CPLX and MATRIX for what their lines cannot hold: a b/c, ʸ√x, x!, nCr, °′″, ∛, HYP in MATRIX', () => {
    const m = switchOn()
    keys(m, 'menu 6 2 shift frac 3 shift pow 4 shift inv ncr dms shift root')
    expect(rows(m)[0]).toBe('234')
    keys(m, 'ac menu 7 2 hyp sin')
    expect(rows(m)[0]).toBe('2sin(')
  })
})
