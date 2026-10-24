import { existsSync, readFileSync } from 'node:fs'
import { compileSci, sciRomFile } from '@shared/e16c/sci-rom'
import { REG } from '@shared/elec16/bus'
import { decode, format } from '@shared/elec16/decimal'
import { BIG_PITCH, BIG_WIDTH, bigGlyphColumns, screenText } from '@shared/elec16/font'
import { Elec16 } from '@shared/elec16/machine'
import { MODELS } from '@shared/elec16/map'
import { MATH_OP, MATH_REG } from '@shared/elec16/math-unit'
import { buildRom, romFile, romFromFile } from '@shared/elec16/rom'
import { SCI_KEYS, sciKeyCode } from '@shared/elec16/sci-keys'
import { SCI_ANNUNCIATORS } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'
import sciJson from '../../src/renderer/widgets/elec16/sci-rom.json'
import { settle } from './elec16-helpers.js'

/**
 * The ELEC-16 SCI ROM as S4 has it (resources/elec16/sci, docs/elec16-sci.md section 6): the
 * line typed with the calculator's keys and shown as one row of characters (LINE), evaluated
 * in the order of section 6.3 on the maths unit's decimal numbers, the answer in big digits,
 * the variables, Ans, the history, the errors and where they were, ON and OFF, MENU and SETUP;
 * then the 2D display - templates set as a textbook sets them - and answers in their exact
 * form (p + r√s)/q, read from RAM and from dots at the places the layout puts them.
 */

const DIR = 'resources/elec16/sci/'
const read = (name: string) => (existsSync(DIR + name) ? readFileSync(DIR + name, 'utf8') : null)
const built = buildRom((name) => {
  const file = `resources/elec16/${sciRomFile(name)}`
  return existsSync(file) ? readFileSync(file, 'utf8') : null
})

/**
 * Switched on: past the name, at the calculator's empty line - in LINE unless asked for 2D (a new
 * unit's display), as S3's tests read the line as one row of characters.
 */
const switchOn = (display: '2d' | 'line' = 'line'): Elec16 => {
  const m = Elec16.boot(built.image, 'sci-128')
  settle(m)
  if (display === 'line') keys(m, 'setup 2 ac')
  return m
}

/** Keys pressed by their ids (sci-keys.ts), separated by spaces. */
function keys(m: Elec16, ids: string): void {
  for (const id of ids.split(' ').filter((x) => x !== '')) {
    if (id === 'on') m.brk()
    else {
      const code = sciKeyCode(id)
      m.press(code)
      m.release(code)
    }
    settle(m)
  }
}

/** The screen's text rows, as the font reads them back (the line is on rows 0-3). */
const rows = (m: Elec16): string[] => screenText(m.state.vram, 128, 64).map((row) => row.trimEnd())

/** Ans as the unit keeps it (numbers.e16.ts KEEP_ANS), in ten digits. */
const ans = (m: Elec16): string => {
  const d = decode(m.state.ram.subarray(0xc08, 0xc10))
  return d === null ? '?' : format(d, 10)
}

/** A variable's value (KEEP_VARS: A-F, X, Y, M, a 36-byte value each, its decimal first). */
const variable = (m: Elec16, k: number): string => {
  const d = decode(m.state.ram.subarray(0xc30 + k * 36, 0xc38 + k * 36))
  return d === null ? '?' : format(d, 10)
}

/**
 * Ans's exact form as (p + r√s)/q in words: "1/2", "2√2", "-√3/2", "2-√3", or "-" when it has
 * none (numbers.e16.ts: the flag at 8, s at 10, p, r and q at 12, 20 and 28).
 */
function form(m: Elec16): string {
  const ram = m.state.ram
  if (ram[0xc08 + 8] !== 1) return '-'
  const part = (at: number) => {
    const d = decode(ram.subarray(0xc08 + at, 0xc08 + at + 8))
    return d === null ? '?' : format(d, 10)
  }
  const s = (ram[0xc08 + 10] ?? 0) | ((ram[0xc08 + 11] ?? 0) << 8)
  const [p, r, q] = [part(12), part(20), part(28)]
  const top = r === '0' ? p : withRoot(p, r, s)
  return q === '1' ? top : `${top}/${q}`
}

/** p + r√s in words: r of 1 or -1 is only its sign, and p of 0 is left out. */
function withRoot(p: string, r: string, s: number): string {
  const coefficient = ({ '1': '', '-1': '-' } as Record<string, string>)[r] ?? r
  const root = `${coefficient}√${s}`
  if (p === '0') return root
  return `${p}${root.startsWith('-') ? '' : '+'}${root}`
}

/** Whether the dot at (x, y) is on. */
const dot = (m: Elec16, x: number, y: number): boolean =>
  (((m.state.vram[(y >> 3) * 128 + x] ?? 0) >> (y & 7)) & 1) === 1

/** The big digits on bands 6 and 7, read back from the right edge: the answer as drawn. */
function bigText(m: Elec16, right = 127): string {
  const col = (x: number) =>
    (m.state.vram[6 * 128 + x] ?? 0) | ((m.state.vram[7 * 128 + x] ?? 0) << 8)
  const glyphs = [...'0123456789-'].map((ch) => [ch, bigGlyphColumns(ch).join(',')] as const)
  let out = ''
  let r = right
  for (;;) {
    const cols = Array.from({ length: BIG_WIDTH }, (_, k) => col(r - BIG_PITCH + 1 + k))
    const found = glyphs.find(([, key]) => key === cols.join(','))
    if (found !== undefined) {
      out = found[0] + out
      r -= BIG_PITCH
      continue
    }
    if (col(r - 2) === 0x3000 && col(r - 1) === 0x3000) {
      out = `.${out}`
      r -= 3
      continue
    }
    return out
  }
}

/**
 * The text of the row of characters whose top is at dot row `y`: the screens other than the
 * calculator's set their text off the eight-row bands (a title a dot down, lines every nine
 * rows), and a dot in from the left: `x0` is where its cells start (1 for those screens).
 * `inverted` reads it off an inverted band.
 */
function lineAt(m: Elec16, y: number, inverted = false, x0 = 1): string {
  const band = y >> 3
  const shift = y & 7
  const one = Uint8Array.from({ length: 128 }, (_, x) => {
    const top = x + x0 < 128 ? (m.state.vram[band * 128 + x + x0] ?? 0) : 0
    const below = x + x0 < 128 ? (m.state.vram[(band + 1) * 128 + x + x0] ?? 0) : 0
    const col = ((top >> shift) | (below << (8 - shift))) & 0xff
    return (inverted ? ~col : col) & 0x7f
  })
  return (screenText(one, 128, 8)[0] ?? '').trim()
}

const lit = (m: Elec16): string[] =>
  SCI_ANNUNCIATORS.filter((_, bit) => (m.state.lcd.annunciators & (1 << bit)) !== 0)

/** A line typed and answered: Ans, and the big digits shown. */
function answer(line: string): { ans: string; shown: string; m: Elec16 } {
  const m = switchOn()
  keys(m, `${line} eq`)
  return { ans: ans(m), shown: bigText(m), m }
}

describe('the SCI ROM file', () => {
  it('is what the sources build now (run npm run gen:elec16 after changing them)', () => {
    const sci = compileSci((name) => read(name) ?? '')
    expect(sci.errors).toEqual([])
    expect(read('sci.s')).toBe(sci.asm)
    expect(built.errors).toEqual([])
    expect(sciJson).toEqual(romFile(built))
    expect(romFromFile(sciJson)).toEqual(built.image)
  })

  it('says what the e16c sources say of the machine as the machine has it', () => {
    const all = ['lcd', 'tokens', 'numbers', 'calc', 'eval', 'screens', 'exact', 'layout', 'edit']
      .map((f) => read(`${f}.e16.ts`) ?? '')
      .join('\n')
    const constant = (name: string) => Number(all.match(new RegExp(`const ${name} = (\\w+)`))?.[1])
    for (const k of SCI_KEYS) {
      expect(constant(`K_${k.id.toUpperCase()}`), k.id).toBe(k.code)
    }
    const bit = (name: string) =>
      1 << SCI_ANNUNCIATORS.indexOf(name as (typeof SCI_ANNUNCIATORS)[number])
    for (const [name, mark] of [
      ['S', 'S'],
      ['A', 'A'],
      ['M', 'M'],
      ['STO', 'STO'],
      ['D', 'D'],
      ['R', 'R'],
      ['G', 'G'],
      ['2D', '2D'],
      ['UP', 'UP'],
      ['DOWN', 'DOWN'],
    ]) {
      expect(constant(`ANN_${name}`), name).toBe(bit(mark as string))
    }
    expect(constant('IO_ANNUNCIATORS')).toBe(REG.annunciators)
    expect(constant('IO_CURSOR')).toBe(REG.cursor)
    expect(constant('IO_CURMODE')).toBe(REG.cursorMode)
    expect(constant('WIDTH')).toBe(MODELS['sci-128'].width)
    expect([constant('BIG_WIDTH'), constant('BIG_PITCH')]).toEqual([BIG_WIDTH, BIG_PITCH])
    expect(constant('MATH_OP')).toBe(MATH_REG.op)
    expect(constant('MATH_ANGLE')).toBe(MATH_REG.angle)
    for (const [name, op] of Object.entries(MATH_OP)) {
      const ours = `M_${name.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}`
      if (all.includes(`const ${ours} =`)) expect(constant(ours), ours).toBe(op)
    }
  })
})

describe('switched on', () => {
  it('shows its name for a moment, then an empty line, the cursor at its start, DEG and 2D lit', () => {
    const m = switchOn('2d')
    expect(rows(m).filter((r) => r !== '')).toEqual([])
    expect(m.state.lcd.cursorMode & 3).toBe(3)
    expect(lit(m)).toEqual(['D', '2D'])
    expect(m.state.sleeping).toBe(true)
  })
})

describe('a line answered', () => {
  it('shows the line as typed and the answer in big digits', () => {
    const { ans: a, shown, m } = answer('1 add 2')
    expect(rows(m)[0]).toBe('1+2')
    expect([a, shown]).toEqual(['3', '3'])
  })

  it.each([
    ['2 add 3 mul 4', '14'],
    ['1 div 2 shift exp', '0.1591549431'],
    ['6 div 2 lp 1 add 2 rp', '1'],
    ['2 pow 3 rp pow 2', '512'],
    ['neg 2 sq', '-4'],
    ['5 ncr 2', '10'],
    ['5 shift ncr 2', '20'],
    ['5 shift inv', '120'],
    ['4 inv', '0.25'],
    ['shift sq 1 6', '4'],
    ['shift cube neg 8', '-2'],
    ['3 cube', '27'],
    ['log 1 0 0 0', '3'],
    ['shift log 2', '100'],
    ['2 shift log 3', '2000'],
    ['ln shift ln 1', '1'],
    ['sin 3 0', '0.5'],
    ['shift sin 1', '90'],
    ['1 exp 3', '1000'],
    ['exp 5', '100000'],
    ['1 exp neg 3', '0.001'],
    ['0 dot 1 add 0 dot 2', '0.3'],
    ['2 lp 3 add 4', '14'],
  ])('%s is %s', (line, value) => {
    const r = answer(line)
    expect(r.ans).toBe(value)
    expect(r.shown).toBe(value)
  })

  it('writes an exponent beside the digits when ten places do not hold the answer', () => {
    const { ans: a, m } = answer('2 pow 4 0')
    expect(a).toBe('1.099511628E12')
    expect(bigText(m, 127 - 2 * 6 - 18)).toBe('1.099511628')
    // The exponent ends at the right edge (its cells from 116, two dots past a multiple of 6).
    expect(lineAt(m, 48, false, 2).endsWith('12')).toBe(true)
    expect(lineAt(m, 55, false, 2)).toContain('×10')
  })

  it('goes on from Ans with an operator, and starts afresh with a number', () => {
    const m = switchOn()
    keys(m, '2 eq add 3 eq')
    expect(rows(m)[0]).toBe('Ans+3')
    expect(ans(m)).toBe('5')
    keys(m, '7 eq')
    expect(rows(m)[0]).toBe('7')
  })
})

describe('the line edited', () => {
  it('moves through the line and types and deletes at the cursor', () => {
    const m = switchOn()
    keys(m, '1 2 3 left del 9')
    expect(rows(m)[0]).toBe('193')
    keys(m, 'eq')
    expect(ans(m)).toBe('193')
    // From an answer, ◀ goes back into the line at its end.
    keys(m, 'left del eq')
    expect(ans(m)).toBe('19')
  })

  it('shows a function by its name and a sign as a minus', () => {
    const m = switchOn()
    keys(m, 'sin neg 3 0 rp shift sin')
    expect(rows(m)[0]).toBe('sin(-30)sin⁻¹(')
  })
})

describe('errors', () => {
  it('says MATH for a value out of a function or a division by 0, and AC clears the line', () => {
    const m = switchOn()
    keys(m, '1 div 0 eq')
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
    expect(lineAt(m, 11)).toBe("OUT OF A FUNCTION'S")
    keys(m, 'ac')
    expect(rows(m).filter((r) => r !== '')).toEqual([])
  })

  it('says SYNTAX for a line it cannot read, and an arrow goes back to where it was', () => {
    const m = switchOn()
    keys(m, '1 add mul 2 eq')
    expect(lineAt(m, 1, true)).toBe('ERR:SYNTAX')
    keys(m, 'left')
    expect(rows(m)[0]).toBe('1+×2')
    // The cursor before the token it failed at (the x): a bar at its cell's left.
    expect((m.state.lcd.cursor & 0xff) + 1).toBe(2 * 6)
  })

  it('stops a factorial past 69 rather than overflow', () => {
    const m = switchOn()
    keys(m, '7 0 shift inv eq')
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
  })
})

describe('variables, M and the history', () => {
  it('keeps the answer in a variable with STO, gives it back with ALPHA and RCL', () => {
    const m = switchOn()
    keys(m, '7 eq sto neg')
    expect(variable(m, 0)).toBe('7')
    keys(m, 'ac alpha neg mul 2 eq')
    expect(ans(m)).toBe('14')
    keys(m, 'ac shift sto neg')
    expect(ans(m)).toBe('7')
  })

  it('adds to M with M+ and takes with M-, lighting M while it is not 0', () => {
    const m = switchOn()
    keys(m, '5 mplus')
    expect(variable(m, 8)).toBe('5')
    expect(lit(m)).toContain('M')
    keys(m, '5 shift mplus')
    expect(variable(m, 8)).toBe('0')
    expect(lit(m)).not.toContain('M')
  })

  it('brings back earlier lines with up, newest first, and later ones with down', () => {
    const m = switchOn()
    keys(m, '1 add 1 eq 2 add 2 eq ac')
    expect(lit(m)).toContain('UP')
    keys(m, 'up')
    expect(rows(m)[0]).toBe('2+2')
    keys(m, 'up')
    expect(rows(m)[0]).toBe('1+1')
    keys(m, 'down')
    expect(rows(m)[0]).toBe('2+2')
  })

  it('keeps the variables, Ans and the history through OFF and ON', () => {
    const m = switchOn()
    keys(m, '7 eq sto neg 3 add 4 eq')
    keys(m, 'shift on')
    expect(m.state.off).toBe(true)
    m.brk()
    settle(m)
    expect(variable(m, 0)).toBe('7')
    expect(ans(m)).toBe('7')
    keys(m, 'up')
    expect(rows(m)[0]).toBe('3+4')
  })
})

describe('ON, MENU and SETUP', () => {
  it('ON is AC from anywhere', () => {
    const m = switchOn()
    keys(m, '1 add 2 on')
    expect(rows(m).filter((r) => r !== '')).toEqual([])
  })

  it('MENU lists the modes, CALC the one there is; AC goes back', () => {
    const m = switchOn()
    keys(m, 'menu')
    expect(lineAt(m, 1, true)).toBe('MENU')
    expect(lineAt(m, 20)).toBe('3:BASE    4:TABLE')
    keys(m, '2')
    expect(lineAt(m, 1, true)).toBe('MENU')
    keys(m, 'ac 1 eq')
    expect(ans(m)).toBe('1')
  })

  it('SETUP sets the angle the functions take, and its mark', () => {
    const m = switchOn()
    keys(m, 'setup 4 ac')
    expect(lit(m)).toContain('R')
    keys(m, 'sin shift exp div 2 eq')
    expect(ans(m)).toBe('1')
    keys(m, 'setup 5 ac sin 1 0 0 eq')
    expect(ans(m)).toBe('1')
  })
})

describe('the 2D display and exact answers (S4)', () => {
  /** A line typed in 2D and answered: Ans, its form, and the big digits (empty for a form). */
  function exact(line: string): { ans: string; form: string; shown: string; m: Elec16 } {
    const m = switchOn('2d')
    keys(m, `${line} eq`)
    return { ans: ans(m), form: form(m), shown: bigText(m), m }
  }

  it.each([
    ['1 frac 3 right add 1 frac 6', '0.5', '1/2'],
    ['1 div 3', '0.3333333333', '1/3'],
    ['shift sq 8', '2.828427125', '2√2'],
    ['shift sq 1 2 right div 2', '1.732050808', '√3'],
    ['sin 4 5', '0.7071067812', '√2/2'],
    ['cos 1 5 0', '-0.8660254038', '-√3/2'],
    ['tan 1 5', '0.2679491924', '2-√3'],
    ['tan 7 5', '3.732050808', '2+√3'],
    ['lp 1 add shift sq 2 right rp sq', '5.828427125', '3+2√2'],
    ['1 frac 2 right pow 3', '0.125', '1/8'],
    ['1 frac shift sq 2', '0.7071067812', '√2/2'],
  ])('%s is %s, answered as %s', (line, value, shape) => {
    const r = exact(line)
    expect(r.ans).toBe(value)
    expect(r.form).toBe(shape)
    expect(r.shown).toBe('')
  })

  it.each([
    ['2 pow 1 0', '1024'],
    ['shift sq 2 right add shift sq 3', '3.14626437'],
    ['sin 1 0', '0.1736481777'],
    ['shift exp', '3.141592654'],
  ])('%s has no form to show and is answered in big digits', (line, value) => {
    const r = exact(line)
    expect(r.ans).toBe(value)
    expect(r.shown).toBe(value)
  })

  it('leaves the form when a part would pass ten digits, the decimal going on', () => {
    expect(exact('2 pow 4 0').form).toBe('-')
    const small = exact('1 frac 3 right pow 2 5')
    expect(small.form).toBe('-')
    expect(small.ans.startsWith('1.18')).toBe(true)
  })

  it('sets a fraction as a textbook does, the answer right on its rows', () => {
    const m = switchOn('2d')
    keys(m, '1 frac 2')
    // The line: its tallest reach 13 rows over a foot at row 15, the bar 4 above it, the parts
    // two dots off the bar and centred in a box 12 wide from x = 1.
    expect(lineAt(m, 2, false, 4)).toBe('1')
    expect(lineAt(m, 13, false, 4)).toBe('2')
    for (let x = 2; x <= 10; x++) expect(dot(m, x, 11)).toBe(true)
    keys(m, 'eq')
    // The answer: its lowest dot on row 62, its right edge on the screen's.
    expect(lineAt(m, 43, false, 119)).toBe('1')
    expect(lineAt(m, 54, false, 119)).toBe('2')
    for (let x = 117; x <= 125; x++) expect(dot(m, x, 52)).toBe(true)
  })

  it('puts the cursor in the part being typed: a bar at its dots, eight rows high', () => {
    const m = switchOn('2d')
    keys(m, '1 frac')
    // In the empty denominator under the 1: its left edge at x = 4, its foot at row 20.
    expect(m.state.lcd.cursor).toBe(12 * 256 + 3)
    expect(m.state.lcd.cursorMode & 3).toBe(3)
  })

  it('answers a line with a decimal typed in it in decimals, F⇄D going to its form and back', () => {
    const r = exact('0 dot 1 add 0 dot 2')
    expect(r.shown).toBe('0.3')
    expect(r.form).toBe('3/10')
    keys(r.m, 'fd')
    expect(bigText(r.m)).toBe('')
    keys(r.m, 'fd')
    expect(bigText(r.m)).toBe('0.3')
  })

  it('answers in decimals after SHIFT = (≈), and F⇄D does nothing for a whole number', () => {
    const m = switchOn('2d')
    keys(m, '1 frac 3 shift eq')
    expect(bigText(m)).toBe('0.3333333333')
    keys(m, 'fd')
    expect(bigText(m)).toBe('')
    keys(m, 'ac 4 eq fd')
    expect(bigText(m)).toBe('4')
  })

  it('makes the value just typed the numerator, or an empty fraction where there is none', () => {
    const m = switchOn('2d')
    keys(m, '1 2 frac 5 eq')
    expect(form(m)).toBe('12/5')
    keys(m, 'ac frac 7 down 2 eq')
    expect(form(m)).toBe('7/2')
    keys(m, 'ac 2 frac 3 up 1 eq')
    expect(form(m)).toBe('7')
  })

  it('goes on from Ans with a/b and a power', () => {
    const m = switchOn('2d')
    keys(m, '3 eq frac 4 eq')
    expect(form(m)).toBe('3/4')
    keys(m, 'pow 2 eq')
    expect(form(m)).toBe('9/16')
  })

  it('DEL goes into a template at its mark and takes it away when it is empty', () => {
    const m = switchOn('2d')
    keys(m, '1 frac 2 left left del 3 eq')
    expect(form(m)).toBe('3/2')
    keys(m, 'ac 2 pow 3 del del 5 eq')
    expect(ans(m)).toBe('25')
    keys(m, 'ac frac del del 6 eq')
    expect(ans(m)).toBe('6')
  })

  it("moves between a fraction's parts with up and down, to the end of the other part", () => {
    const m = switchOn('2d')
    keys(m, '1 frac 2 up 3 eq')
    expect(form(m)).toBe('13/2')
    keys(m, 'ac 1 frac 2 up down 3 eq')
    expect(form(m)).toBe('1/23')
  })

  it('does not put in a template that would make the line too tall to show', () => {
    const m = switchOn('2d')
    keys(m, 'frac frac frac')
    const before = Uint8Array.from(m.state.vram)
    keys(m, 'frac')
    expect(Uint8Array.from(m.state.vram)).toEqual(before)
  })

  it('keeps a form in a variable, through OFF and ON', () => {
    const m = switchOn('2d')
    keys(m, '1 frac 3 eq sto neg ac alpha neg add 1 eq')
    expect(form(m)).toBe('4/3')
    keys(m, 'shift on')
    m.brk()
    settle(m)
    keys(m, 'ac shift sto neg')
    expect(form(m)).toBe('1/3')
    expect(bigText(m)).toBe('')
  })

  it('SETUP 2 (LINE) types a/b as / and answers in decimals; 1 goes back to 2D', () => {
    const m = switchOn('2d')
    keys(m, 'setup 2 ac 1 frac 4')
    expect(rows(m)[0]).toBe('1/4')
    expect(lit(m)).not.toContain('2D')
    keys(m, 'eq')
    expect(bigText(m)).toBe('0.25')
    keys(m, 'setup 1 ac')
    expect(lit(m)).toContain('2D')
  })

  it('SETUP 7 answers in decimals first, F⇄D still showing the form', () => {
    const m = switchOn('2d')
    keys(m, 'setup 7 ac 1 frac 4 eq')
    expect(bigText(m)).toBe('0.25')
    keys(m, 'fd')
    expect(bigText(m)).toBe('')
    keys(m, 'setup 6 ac 1 frac 4 eq')
    expect(bigText(m)).toBe('')
  })

  it('SETUP marks the display, the angle and the answer chosen', () => {
    const m = switchOn('2d')
    keys(m, 'setup')
    // A mark inverts its item from a row above to a row below: 1:2D is x 0-24 on line 0 (row 11).
    expect(dot(m, 2, 10)).toBe(true)
    expect(dot(m, 38, 10)).toBe(false)
    keys(m, '2')
    expect(dot(m, 2, 10)).toBe(false)
    expect(dot(m, 38, 10)).toBe(true)
    expect(dot(m, 50, 28)).toBe(false)
    keys(m, '7')
    expect(dot(m, 50, 28)).toBe(true)
  })
})
