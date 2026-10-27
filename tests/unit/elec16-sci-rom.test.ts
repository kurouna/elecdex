import { compileSci, SCI_SOURCES } from '@shared/e16c/sci-rom'
import { REG } from '@shared/elec16/bus'
import { decode, format } from '@shared/elec16/decimal'
import { BIG_PITCH, BIG_WIDTH, dotText } from '@shared/elec16/font'
import type { Elec16 } from '@shared/elec16/machine'
import { MODELS } from '@shared/elec16/map'
import { MATH_OP, MATH_REG } from '@shared/elec16/math-unit'
import { romFile, romFromFile } from '@shared/elec16/rom'
import { SCI_KEYS } from '@shared/elec16/sci-keys'
import { SCI_ANNUNCIATORS } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'
import sciJson from '../../src/renderer/widgets/elec16/sci-rom.json'
import { settle } from './elec16-helpers.js'
import {
  ans,
  answer,
  band,
  bigText,
  built,
  dot,
  form,
  keys,
  lineAt,
  lineY,
  lit,
  read,
  rightAt,
  rightWord,
  rows,
  switchOn,
  variable,
} from './elec16-sci-helpers.js'

/**
 * The ELEC-16 SCI ROM as S5 has it (resources/elec16/sci, docs/elec16-sci.md section 6): the
 * line typed with the calculator's keys and shown as one row of characters (LINE), evaluated
 * in the order of section 6.3 on the maths unit's decimal numbers, the answer in big digits,
 * the variables, Ans, the history, the errors and where they were, ON and OFF, MENU and SETUP;
 * then the 2D display - templates set as a textbook sets them - and answers in their exact
 * form (p + r√s)/q, read from RAM and from dots at the places the layout puts them.
 */

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
    // Every source of the ROM: a constant one of them copies is held to the machine's.
    const all = SCI_SOURCES.map((s) => read(s.name) ?? '').join('\n')
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
    let held = 0
    for (const [name, op] of Object.entries(MATH_OP)) {
      // fromI32 is M_FROMI32 in base.e16.ts, rndTo M_RNDTO: both spellings are looked for.
      for (const ours of [
        `M_${name.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}`,
        `M_${name.toUpperCase()}`,
      ]) {
        if (!all.includes(`const ${ours} =`)) continue
        expect(constant(ours), ours).toBe(op)
        held++
      }
    }
    expect(held).toBeGreaterThan(40)
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
    // AUTO shows ten digits on the display, the 0 before the point one of them (section 6.6).
    ['1 div 2 shift exp', '0.1591549431', '0.159154943'],
    ['6 div 2 lp 1 add 2 rp', '1'],
    ['2 pow 3 rp pow 2', '512'],
    ['neg 2 sq', '-4'],
    ['5 ncr 2', '10'],
    ['5 shift ncr 2', '20'],
    ['5 shift inv', '120'],
    ['4 inv', '0.25'],
    ['root 1 6', '4'],
    ['shift root neg 8', '-2'],
    ['3 shift sq', '27'],
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
  ] as [string, string, string?][])('%s is %s', (line, value, shown = value) => {
    const r = answer(line)
    expect(r.ans).toBe(value)
    expect(r.shown).toBe(shown)
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

  it('MENU lists the modes; AC goes back to the one it was in, a digit past 8 beeps', () => {
    const m = switchOn()
    keys(m, 'menu')
    expect(lineAt(m, 1, true)).toBe('MENU')
    expect(lineAt(m, 20)).toBe('3:BASE    4:TABLE')
    keys(m, '9')
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
    ['root 8', '2.828427125', '2√2'],
    ['root 1 2 right div 2', '1.732050808', '√3'],
    ['sin 4 5', '0.7071067812', '√2/2'],
    ['cos 1 5 0', '-0.8660254038', '-√3/2'],
    ['tan 1 5', '0.2679491924', '2-√3'],
    ['tan 7 5', '3.732050808', '2+√3'],
    ['lp 1 add root 2 right rp sq', '5.828427125', '3+2√2'],
    ['1 frac 2 right pow 3', '0.125', '1/8'],
    ['1 frac root 2', '0.7071067812', '√2/2'],
  ])('%s is %s, answered as %s', (line, value, shape) => {
    const r = exact(line)
    expect(r.ans).toBe(value)
    expect(r.form).toBe(shape)
    expect(r.shown).toBe('')
  })

  it.each([
    ['2 pow 1 0', '1024'],
    ['root 2 right add root 3', '3.14626437'],
    ['sin 1 0', '0.1736481777', '0.173648178'],
    ['shift exp', '3.141592654'],
  ] as [string, string, string?][])(
    '%s has no form to show and is answered in big digits',
    (line, value, shown = value) => {
      const r = exact(line)
      expect(r.ans).toBe(value)
      expect(r.shown).toBe(shown)
    },
  )

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
    expect(bigText(m)).toBe('0.333333333')
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

  // Found in a review: the template taken back was left in when it had a value in it (a/b
  // or a b/c around a number) or a 10 or e before it (10ˣ, eˣ) - the line as it was before.
  it.each([
    ['a/b around a number', 'frac'],
    ['a b/c around a number', 'shift frac'],
    ['10ˣ', 'shift log'],
    ['eˣ', 'shift ln'],
  ])('takes a too-tall %s back out whole, the line as it was', (_, key) => {
    const m = switchOn('2d')
    keys(m, 'frac frac frac 2')
    const before = Uint8Array.from(m.state.vram)
    keys(m, key)
    expect(Uint8Array.from(m.state.vram)).toEqual(before)
    // The line goes on from where it was, as one that never had the key pressed.
    const same = switchOn('2d')
    keys(same, 'frac frac frac 2 3 left del')
    keys(m, '3 left del')
    expect(Uint8Array.from(m.state.vram)).toEqual(Uint8Array.from(same.state.vram))
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

  it("SETUP's band shows its page at the right (once drawn over the lit band, unseen)", () => {
    const m = switchOn('2d')
    keys(m, 'setup')
    expect(lineAt(m, 1, true, 3).split(' ').pop()).toBe('1/2')
    keys(m, 'down')
    expect(lineAt(m, 1, true, 3).split(' ').pop()).toBe('2/2')
  })

  it("SETUP's page 2 steps the LCD's contrast with the arrows, kept through OFF and ON", () => {
    const m = switchOn('2d')
    expect(m.state.lcd.contrast).toBe(8)
    keys(m, 'setup down right right')
    expect(m.state.lcd.contrast).toBe(10)
    keys(m, 'left')
    expect(m.state.lcd.contrast).toBe(9)
    keys(m, 'ac shift on')
    m.state.lcd.contrast = 8
    m.brk()
    settle(m)
    expect(m.state.lcd.contrast).toBe(9)
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

describe('the rest of CALC (S5)', () => {
  /** The small text right-aligned on the row whose top is `y` (textRight's cells start at x = 3). */
  const right = (m: Elec16, y: number) => lineAt(m, y, false, 3)

  it.each([
    ['hyp sin 1', '1.175201194'],
    ['hyp cos 0', '1'],
    ['hyp shift tan 0 dot 5', '0.5493061443'],
    ['shift neg neg 3', '3'],
    ['2 shift pow 8', '2.828427125'],
    ['3 shift pow 8', '2'],
    ['3 shift pow neg 2 7', '-3'],
    ['1 2 dms 3 0 dms', '12.5'],
    ['1 dms 3 0 dms 3 6 dms', '1.51'],
    ['5 0 func 3', '0.5'],
    ['func 1 1 2 shift lp 1 8', '6'],
    ['func 2 4 shift lp 6', '12'],
    ['func 4 neg 2 dot 7', '-2'],
    ['2 shift frac 1 down 4', '2.25'],
    ['neg 1 shift frac 1 down 2', '-1.5'],
  ])('%s is %s', (line, value) => {
    const m = switchOn('2d')
    keys(m, `${line} eq`)
    expect(ans(m)).toBe(value)
  })

  it('lights HYP while it waits for SIN, COS or TAN, and shows the function by its name', () => {
    const m = switchOn()
    keys(m, 'hyp')
    expect(lit(m)).toContain('HYP')
    keys(m, 'sin')
    expect(lit(m)).not.toContain('HYP')
    expect(rows(m)[0]).toBe('sinh(')
  })

  it('keeps a mixed number exact and shows it as one when SETUP asks', () => {
    const m = switchOn('2d')
    keys(m, '7 frac 2 eq')
    expect(form(m)).toBe('7/2')
    keys(m, 'fd')
    // F⇄D: the form, then its mixed number, then the decimal.
    expect(bigText(m)).toBe('')
    keys(m, 'fd')
    expect(bigText(m)).toBe('3.5')
    keys(m, 'setup down 2 ac 7 frac 2 eq')
    expect(bigText(m)).toBe('')
    // 3 1/2: the whole part on the fraction's line, left of it.
    expect(lineAt(m, 49, false, 109).startsWith('3')).toBe(true)
  })

  it('shows Pol and Rec as X and Y, and keeps them there', () => {
    const m = switchOn()
    keys(m, 'func 6 3 shift lp 4 eq')
    expect(lineAt(m, 46, false, 1).startsWith('X=')).toBe(true)
    expect(right(m, 46).split(' ').pop()).toBe('5')
    expect(right(m, 55).split(' ').pop()).toBe('53.13010235')
    expect(variable(m, 6)).toBe('5')
    keys(m, 'ac func 7 2 shift lp 9 0 eq')
    expect(variable(m, 6)).toBe('0')
    expect(variable(m, 7)).toBe('2')
  })

  it('shows an answer in degrees, minutes and seconds with °′″, and back', () => {
    const m = switchOn()
    keys(m, '1 dot 5 1 eq dms')
    expect(right(m, 55)).toBe('1°30′36″')
    keys(m, 'dms')
    expect(bigText(m)).toBe('1.51')
  })

  it('shows ENG with an exponent a multiple of 3', () => {
    const m = switchOn()
    keys(m, '1 2 3 4 5 eq shift fd')
    // The digits end where x10 begins; the exponent is raised at the right edge.
    expect(bigText(m, 103)).toBe('12.345')
    expect(lineAt(m, 48, false, 122)).toBe('3')
  })

  it('shows FIX and EXP as SETUP sets them, the marks lit, and AUTO again', () => {
    const m = switchOn()
    keys(m, 'setup 8 3 ac 2 div 3 eq')
    expect(lit(m)).toContain('FIX')
    expect(bigText(m)).toBe('0.667')
    keys(m, 'setup 8 0 ac 2 dot 5 eq')
    expect(bigText(m)).toBe('3')
    keys(m, 'setup 9 4 ac 1 2 3 4 5 eq')
    expect(lit(m)).toContain('EXP')
    expect(bigText(m, 103)).toBe('1.235')
    expect(lineAt(m, 48, false, 122)).toBe('4')
    keys(m, 'setup 0 ac 1 div 8 eq')
    expect(lit(m)).not.toContain('FIX')
    expect(bigText(m)).toBe('0.125')
  })

  it('rounds with round( as the display does', () => {
    const m = switchOn()
    keys(m, 'setup 8 2 ac func 5 1 div 3 rp mul 3 eq')
    expect(ans(m)).toBe('0.99')
  })

  it('evaluates the line with the X given to f(x), and keeps X', () => {
    const m = switchOn()
    keys(m, 'alpha lp sq add 1 fx')
    expect(lineAt(m, 1, true, 1)).toBe('f(X)')
    keys(m, '3 eq')
    expect(ans(m)).toBe('10')
    expect(variable(m, 6)).toBe('3')
    keys(m, 'fx eq')
    expect(ans(m)).toBe('10')
  })

  it('finds an X where the line comes to 0 from the X it starts at, DIFF shown', () => {
    const m = switchOn()
    keys(m, 'alpha lp sq sub 2 shift fx')
    expect(lineAt(m, 1, true, 1)).toBe('FIND X')
    keys(m, '1 eq')
    expect(ans(m)).toBe('1.414213562')
    expect(variable(m, 6)).toBe('1.414213562')
    expect(lineAt(m, 37, false, 1).startsWith('DIFF=')).toBe(true)
    keys(m, 'ac alpha lp sq sub 2 shift fx neg 1 eq')
    expect(ans(m)).toBe('-1.414213562')
  })

  it('says FIND when there is no X to find', () => {
    const m = switchOn()
    keys(m, 'alpha lp sq add 1 shift fx eq')
    expect(lineAt(m, 1, true, 1)).toBe('ERR:FIND')
  })
})

describe('the modes (S6)', () => {
  /** The top of line `n` of the screens' rhythm (section 4.5). */

  it('MENU marks the mode it is in; a mode is kept through OFF and ON', () => {
    const m = switchOn()
    keys(m, 'menu 3')
    expect(band(m)[0]).toBe('BASE 32')
    keys(m, 'menu')
    // 3:BASE marked: its item inverted from a row above.
    expect(dot(m, 2, 19)).toBe(true)
    keys(m, 'ac shift on')
    m.brk()
    settle(m)
    expect(band(m)[0]).toBe('BASE 32')
    keys(m, 'menu 1')
    expect(lit(m)).not.toContain('STAT')
  })

  it("keeps each mode's line and history apart", () => {
    const m = switchOn()
    keys(m, '1 add 2 eq 7')
    keys(m, 'menu 3 5 eq menu 1')
    expect(rows(m)[0]).toBe('7')
    keys(m, 'ac up')
    expect(rows(m)[0]).toBe('1+2')
    keys(m, 'menu 3 ac up')
    expect(lineAt(m, 11, false, 1)).toBe('5')
  })

  it('STATS works out one variable from the grid, FREQ counted', () => {
    const m = switchOn()
    keys(m, 'menu 2')
    expect(lit(m)).toContain('STAT')
    keys(m, '8 1 2 eq 4 eq 6 eq right up up up 1 eq 2 eq 1 eq eq')
    expect(band(m)[0]).toBe('1-VAR RESULT')
    expect(rightWord(m, lineY(0))).toBe('4')
    expect(rightWord(m, lineY(1))).toBe('4')
    expect(rightWord(m, lineY(2))).toBe('1.414213562')
    expect(rightWord(m, lineY(3))).toBe('1.632993162')
    expect(rightWord(m, lineY(4))).toBe('16')
    expect(rightWord(m, lineY(5))).toBe('72')
  })

  it('STATS fits a line to two variables and keeps the data through OFF and ON', () => {
    const m = switchOn()
    keys(m, 'menu 2 2 1 eq 2 eq 3 eq right up up up 2 eq 4 eq 7 eq eq')
    expect(band(m)[0]).toBe('LINE RESULT')
    expect(rightWord(m, lineY(3))).toBe('0.993399268')
    expect(rightWord(m, lineY(4))).toBe('-0.666666667')
    expect(rightWord(m, lineY(5))).toBe('2.5')
    keys(m, 'down')
    expect(rightWord(m, lineY(2))).toBe('1')
    keys(m, 'ac shift on')
    m.brk()
    settle(m)
    keys(m, '1 eq')
    expect(rightWord(m, lineY(0))).toBe('3')
  })

  it('STATS puts a row in and takes one out by FUNC', () => {
    const m = switchOn()
    keys(m, 'menu 2 1 1 eq 2 eq 3 eq up up up func 2')
    expect(band(m)[1]).toBe('n=2')
    keys(m, 'func 1')
    expect(band(m)[1]).toBe('n=3')
    keys(m, 'func 3')
    expect(band(m)[1]).toBe('n=0')
  })

  it('BASE shows an answer in the base and the other three, and its bits', () => {
    const m = switchOn()
    keys(m, 'menu 3 func 1 sin 0 1 6 func down 1 0 neg tan tan 0 eq')
    expect(lineAt(m, 11, false, 1)).toBe('D016 AND 0AFF0')
    expect(rightWord(m, lineY(1))).toBe('00008010')
    expect(rightWord(m, lineY(2))).toBe('32784')
    expect(rightWord(m, lineY(3))).toBe('00000100020')
    expect(rightWord(m, lineY(4))).toBe('1000000000010000')
    // Bit 4 a block at the foot, bit 0 a line.
    expect(dot(m, 122 - 4 * 7, 58)).toBe(true)
    expect(dot(m, 122, 58)).toBe(false)
  })

  it('BASE works in 32 bits: a negative number, its bits, a carry out, a division', () => {
    const m = switchOn()
    keys(m, 'menu 3 func 2 neg 1 eq')
    expect(rightWord(m, lineY(1))).toBe('-1')
    expect(rightWord(m, lineY(2))).toBe('FFFFFFFF')
    keys(m, 'ac 2 1 4 7 4 8 3 6 4 7 add 1 eq')
    expect(rightWord(m, lineY(1))).toBe('-2147483648')
    keys(m, 'ac 7 div 2 eq')
    expect(rightWord(m, lineY(1))).toBe('3')
    keys(m, 'ac func down 5 0 eq')
    expect(rightWord(m, lineY(1))).toBe('-1')
    keys(m, 'ac fd fd 1 0 1 func down 3 1 1 eq')
    expect(rightWord(m, lineY(1))).toBe('0000000000000110')
  })

  it('BASE refuses a digit the base has not', () => {
    const m = switchOn()
    keys(m, 'menu 3 func 3 8 9 sin 7')
    expect(lineAt(m, 11, false, 1)).toBe('7')
  })

  it('TABLE shows f(X) from START to END by STEP, and says RANGE past 30 rows', () => {
    const m = switchOn()
    keys(m, 'menu 4 alpha lp sq sub 2 alpha lp eq')
    expect(lineAt(m, 11, false, 1)).toBe('START?')
    keys(m, '1 eq 5 eq 1 eq')
    expect(band(m)[0]).toBe('TABLE')
    // The first row is chosen (inverted); the others read as they are, right in the column.
    expect(lineAt(m, 30, false, 1).split(' ').pop()).toBe('0')
    expect(lineAt(m, 48, false, 1).split(' ').pop()).toBe('8')
    keys(m, 'ac eq 1 eq 1 0 0 eq 1 eq')
    expect(band(m)[0]).toBe('ERR:RANGE')
  })

  it('EQUATION solves two and three unknowns, exactly where it can', () => {
    const m = switchOn('2d')
    keys(m, 'menu 5 1 1 eq 1 eq 3 eq 1 eq neg 1 eq 1 eq eq')
    expect(rightWord(m, 7)).toBe('2')
    expect(rightWord(m, 28)).toBe('1')
    keys(m, 'ac ac 2 1 eq 1 eq 1 eq 6 eq 0 eq 2 eq 5 eq neg 4 eq 2 eq 5 eq neg 1 eq 2 7 eq eq')
    expect([rightWord(m, 7), rightWord(m, 28), rightWord(m, 49)]).toEqual(['5', '3', '-2'])
    keys(m, 'ac ac 1 1 eq 2 eq 3 eq 2 eq 4 eq 6 eq eq')
    expect(lineAt(m, 11, false, 1)).toBe('NO ONE SOLUTION:')
  })

  it("EQUATION's quadratic: roots in their exact form, the vertex on ▼", () => {
    const m = switchOn('2d')
    keys(m, 'menu 5 3 1 eq neg 2 eq neg 1 eq eq')
    // 1+√2: the 1, then the root's bar over the 2 at the right edge.
    expect(lineAt(m, 7, false, 1)).toContain('X1=')
    for (let x = 119; x <= 126; x++) expect(dot(m, x, 5)).toBe(true)
    keys(m, 'down')
    expect(rightWord(m, 21)).toBe('1')
    expect(rightWord(m, 42)).toBe('-2')
  })

  it("EQUATION's cubic: its three roots", () => {
    const m = switchOn()
    keys(m, 'menu 5 4 1 eq neg 6 eq 1 1 eq neg 6 eq eq')
    expect([rightWord(m, 7), rightWord(m, 28), rightWord(m, 49)]).toEqual(['3', '2', '1'])
  })
})

describe('the screen read back for a screen reader (S7)', () => {
  const read = (m: Elec16) => dotText(m.state.vram, 128, 64)

  it('reads a line set in 2D and its answer in big digits', () => {
    const m = switchOn('2d')
    keys(m, 'sin 3 0 rp add 1 dot 2 eq')
    expect(read(m)).toEqual(['sin(30)+1.2', '1.7'])
  })

  it("reads a fraction's parts a line each, and an exponent beside x10", () => {
    const m = switchOn('2d')
    keys(m, '1 frac 3 eq')
    expect(read(m)).toEqual(['1', '3', '1', '3'])
    keys(m, 'ac 2 pow 4 0 eq')
    const text = read(m)
    expect(text.at(-2)).toMatch(/^1\.099511628 +12$/)
    expect(text.at(-1)).toBe('\u00d710')
  })

  it("FUNC lists its functions in small letters as they go into the line, in the mock's order", () => {
    // S5 had them in other makers' spellings (Ran#, Rnd), which section 9 rules out.
    const m = switchOn()
    keys(m, 'func')
    expect(read(m).slice(1, 6)).toEqual([
      '1:gcd(   2:lcm(',
      '3:%      4:int(',
      '5:round( 6:pol(',
      '7:rec(   8:d/dx(',
      '9:∫(     0:Σ(',
    ])
    keys(m, '5')
    expect(rows(m)[0]).toBe('round(')
    keys(m, 'ac shift neg')
    expect(rows(m)[0]).toBe('abs(')
  })

  it('reads the screens set off the bands: a title band, its lines, a table', () => {
    const m = switchOn()
    keys(m, 'setup')
    const setup = read(m)
    expect(setup[0]).toMatch(/^SETUP +1\/2$/)
    expect(setup).toContain('3:DEG 4:RAD 5:GRAD')
    keys(m, 'ac menu 2 1 1 eq 2 eq')
    const table = read(m)
    expect(table[0]).toMatch(/^STATS 1-VAR +n=2$/)
    expect(table.some((l) => /^1 +1$/.test(l))).toBe(true)
  })
})

describe("the manual's examples (docs/elec16-sci-manual.md)", () => {
  it.each([
    ['2 pow 3 pow 2', '512'],
    ['neg 2 sq', '-4'],
    ['6 div 2 lp 1 add 2', '1'],
    ['1 div 2 shift exp', '0.1591549431'],
    ['1 2 dms 3 0 dms', '12.5'],
    ['func 1 1 2 shift lp 1 8', '6'],
    ['func 2 4 shift lp 6', '12'],
    ['func 4 neg 2 dot 7', '-2'],
    ['5 0 func 3', '0.5'],
    ['hyp sin 1', '1.175201194'],
    ['3 shift pow 8', '2'],
  ])('%s is %s', (line, value) => {
    expect(answer(line).ans).toBe(value)
  })

  it('says SYNTAX for a sign after a value: 2(-)3', () => {
    const m = switchOn()
    keys(m, '2 neg 3 eq')
    expect(lineAt(m, 1, true)).toBe('ERR:SYNTAX')
  })
})

describe("after EL-509E's list: % of what it is added to, STATS' results in a line", () => {
  it.each([
    ['5 0 0 add 2 5 func 3', '625'],
    ['5 0 0 sub 2 5 func 3', '375'],
    ['2 0 0 mul 5 func 3', '10'],
    ['5 0 div 2 5 func 3', '200'],
    ['2 5 func 3', '0.25'],
    // A % inside brackets is a share of nothing: 500+(25%) is 500.25.
    ['5 0 0 add lp 2 5 func 3 rp', '500.25'],
    // ... and so it is with the bracket left open at the end of the line, or a function's:
    // 2+(50% and 2+abs(50% were 3, a share of the 2 outside.
    ['2 add lp 5 0 func 3', '2.5'],
    ['2 add shift neg 5 0 func 3', '2.5'],
    ['2 add lp 5 0 func 3 rp', '2.5'],
  ])('%s is %s', (line, value) => {
    expect(answer(line).ans).toBe(value)
  })

  it('goes on from Ans after an answer with % and a/b, as with x² and the operators', () => {
    // In LINE both began an empty line, % and ⁄2 alone: ERR:SYNTAX.
    const m = switchOn()
    keys(m, '5 0 eq func 3 eq')
    expect(ans(m)).toBe('0.5')
    keys(m, 'ac 8 eq frac 2 eq')
    expect(ans(m)).toBe('4')
  })

  it('goes on from a long answered line with a template key, the room being the new line', () => {
    // The room was checked before the line was emptied: after a line of 199 tokens x^ beeped and
    // the 2 typed next was answered alone.
    const m = switchOn('2d')
    keys(m, `${'1 add '.repeat(99)}1 eq`)
    expect(ans(m)).toBe('100')
    keys(m, 'pow 2 eq')
    expect(ans(m)).toBe('10000')
    keys(m, `ac ${'1 add '.repeat(99)}1 eq frac 4 eq`)
    expect(ans(m)).toBe('25')
    // √ starts a line of its own: refused, the 9 typed next was answered alone.
    keys(m, `ac ${'1 add '.repeat(99)}1 eq root 9 eq`)
    expect(ans(m)).toBe('3')
  })

  /** STATS' 2-VAR table X 1, 2, 3 and Y 2, 4, 7, then back to CALC. */
  function withData(): Elec16 {
    const m = switchOn()
    keys(m, 'menu 2 2 1 eq 2 eq 3 eq right up up up 2 eq 4 eq 7 eq menu 1')
    return m
  }

  it.each([
    ['func fp:STATS 1', '3'],
    ['func fp:STATS 2', '2'],
    ['func fp:STATS 3', '0.8164965809'],
    ['func fp:STATS 4', '1'],
    ['func fp:STATS 5', '4.333333333'],
    ['func fp:STATS 8', '0.9933992678'],
    ['func fp:STATS 9', '-0.6666666667'],
    ['func fp:STATS 0', '2.5'],
    ['func fp:STATS down 1', '6'],
    ['func fp:STATS down 2', '14'],
    ['func fp:STATS down 5', '31'],
    // The estimates on y = a + bx: y'(4) = a + 4b, x'(9.333...) = 4.
    ['func fp:STATS down 7 4', '9.333333333'],
    ['func fp:STATS down 6 9 dot 3 3 3 3 3 3 3 3 3 3', '4'],
    // In a line like any value: 10 x̄ + 1.
    ['1 0 func fp:STATS 2 add 1', '21'],
  ])("STATS' %s is %s in CALC", (line, value) => {
    const m = withData()
    keys(m, `${line} eq`)
    expect(ans(m)).toBe(value)
  })

  it("shows STATS' results by their names in the line", () => {
    const m = withData()
    keys(m, 'setup 2 ac func fp:STATS 2 add func fp:STATS down 7')
    expect(rows(m)[0]).toBe('\u0078\u0304+y\u2032(')
  })

  it('says MATH with no data, and for y from one variable', () => {
    const m = switchOn()
    keys(m, 'menu 2 1 func 3 menu 1 func fp:STATS 1 eq')
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
    keys(m, 'ac menu 2 1 5 eq menu 1 func fp:STATS 5 eq')
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
    keys(m, 'ac func fp:STATS 2 eq')
    expect(ans(m)).toBe('5')
  })
})

describe("the rest of EL-509E's list", () => {
  const read = (m: Elec16) => dotText(m.state.vram, 128, 64)
  /** Ans within ten digits' rounding of `value`. */
  const near = (m: Elec16, value: number) =>
    expect(Math.abs(Number(ans(m)) - value)).toBeLessThan(Math.abs(value) * 2e-9 + 1e-12)

  /** STATS of kind `kind` (its key) with X `xs` and Y `ys`, then CALC. */
  function data(kind: string, xs: string[], ys: string[]): Elec16 {
    const m = switchOn()
    const up = xs.map(() => 'up').join(' ')
    keys(
      m,
      `menu 2 ${kind} ${xs.map((x) => `${x} eq`).join(' ')} right ${up} ${ys.map((y) => `${y} eq`).join(' ')} menu 1`,
    )
    return m
  }
  const XS = ['1', '2', '3', '4']
  const YS = ['2', '4', '7', '1 1']

  it.each([
    // kind, a, b, r, y'(5), x'(20) - by least squares on the line each kind is made into.
    ['4', 'EXP', 1.206045378, 0.5673860065, 0.9955036034, 20.57911563, 4.949691245],
    ['5', 'LOG', 1.131392851, 6.127784372, 0.940764154, 10.99368134, 21.74076674],
    ['6', 'PWR', 1.894293102, 1.217054281, 0.9943639351, 13.43171951, 6.93478504],
    ['7', 'INV', 11.25641026, -10.09230769, -0.8658000985, 9.237948718, -1.154252199],
  ] as const)('fits %s (%s): a, b, r and the estimates', (kind, _name, a, b, r, y5, x20) => {
    const m = data(kind, XS, YS)
    keys(m, 'func fp:STATS 9 eq')
    near(m, a)
    keys(m, 'ac func fp:STATS 0 eq')
    near(m, b)
    keys(m, 'ac func fp:STATS 8 eq')
    near(m, r)
    keys(m, 'ac func fp:STATS down 7 5 eq')
    near(m, y5)
    keys(m, 'ac func fp:STATS down 6 2 0 eq')
    near(m, x20)
  })

  it('fits a quadratic: a, b, c, no r, y′ and both x′', () => {
    // y = 1 + 2x + 3x² at x = 0..3.
    const m = data('3', ['0', '1', '2', '3'], ['1', '6', '1 7', '3 4'])
    keys(m, 'func fp:STATS 9 eq')
    expect(ans(m)).toBe('1')
    keys(m, 'ac func fp:STATS 0 eq')
    expect(ans(m)).toBe('2')
    keys(m, 'ac func fp:STATS down 8 eq')
    expect(ans(m)).toBe('3')
    keys(m, 'ac func fp:STATS down 7 4 eq')
    expect(ans(m)).toBe('57')
    keys(m, 'ac func fp:STATS down 6 1 7 eq')
    expect(ans(m)).toBe('2')
    keys(m, 'ac func fp:STATS down 9 1 7 eq')
    expect(ans(m)).toBe('-2.666666667')
    keys(m, 'ac func fp:STATS 8 eq')
    expect(band(m)[0]).toBe('ERR:MATH')
  })

  it('names the kind in the band and lists c on the results', () => {
    const m = switchOn()
    keys(m, 'menu 2 3')
    expect(band(m)[0]).toBe('STATS QUAD')
    keys(m, '0 eq 1 eq 2 eq 3 eq right up up up up 1 eq 6 eq 1 7 eq 3 4 eq eq')
    expect(band(m)[0]).toBe('QUAD RESULT')
    expect(rightWord(m, lineY(3))).toBe('-')
    keys(m, 'down')
    expect(lineAt(m, lineY(0), false, 1).startsWith('c=')).toBe(true)
    expect(rightWord(m, lineY(0))).toBe('3')
  })

  it("FUNC's random page: rand, dice 1-6, coin 0 or 1, rint 0-99", () => {
    const m = switchOn()
    const seen = (item: string, ok: (v: number) => boolean) => {
      keys(m, `ac func fp:RANDOM ${item} eq`)
      for (let k = 0; k < 20; k++) {
        const v = Number(ans(m))
        expect(ok(v), `${item}: ${v}`).toBe(true)
        keys(m, 'eq')
      }
    }
    seen('1', (v) => v >= 0 && v < 1)
    seen('2', (v) => Number.isInteger(v) && v >= 1 && v <= 6)
    seen('3', (v) => v === 0 || v === 1)
    seen('4', (v) => Number.isInteger(v) && v >= 0 && v <= 99)
    keys(m, 'ac func fp:RANDOM 2')
    expect(rows(m)[0]).toBe('dice')
  })

  it('converts the answer to the next angle unit with SHIFT SETUP, and the unit with it', () => {
    const m = switchOn()
    keys(m, '9 0 eq shift setup')
    expect(ans(m)).toBe('1.570796327')
    expect(lit(m)).toContain('R')
    keys(m, 'shift setup')
    expect(ans(m)).toBe('100')
    expect(lit(m)).toContain('G')
    keys(m, 'shift setup')
    expect(ans(m)).toBe('90')
    expect(lit(m)).toContain('D')
    keys(m, 'ac shift sin 0 dot 8 eq shift setup')
    expect(ans(m)).toBe('0.927295218')
  })

  it('keeps a constant: + − ÷ the number after, × the one before, K shown', () => {
    const m = switchOn()
    for (const [line, value] of [
      ['3 4 add 5 7 eq', '91'],
      ['4 5 eq', '102'],
      ['6 8 mul 2 5 eq', '1700'],
      ['4 0 eq', '2720'],
      ['7 9 sub 5 9 eq', '20'],
      ['5 6 eq', '-3'],
      ['5 6 div 8 eq', '7'],
      ['9 2 eq', '11.5'],
    ] as const) {
      keys(m, line)
      expect(ans(m), line).toBe(value)
    }
    expect(read(m)).toContain('K')
    keys(m, 'ac 2 add 3 mul 4 eq 5 eq')
    expect(ans(m)).toBe('5')
    // AC forgets the constant (it once outlived leaving SETUP, which ends with AC).
    keys(m, 'ac 3 4 add 5 7 eq ac 4 5 eq')
    expect(ans(m)).toBe('45')
  })

  it('shows numbers below 0.01 with an exponent in AUTO2', () => {
    const m = switchOn()
    keys(m, '3 div 1 0 0 0 eq')
    expect(bigText(m)).toBe('0.003')
    // 0 on SETUP when it is AUTO already: AUTO2.
    keys(m, 'setup 0')
    expect(read(m)).toContain('AUTO2')
    keys(m, 'ac 3 div 1 0 0 0 eq')
    expect(bigText(m, 97)).toBe('3')
    keys(m, 'ac 1 div 8 eq')
    expect(bigText(m)).toBe('0.125')
  })

  it('works in base 5 (PEN) beside the others', () => {
    const m = switchOn()
    keys(m, 'menu 3 func 5 1 2 3 4 eq')
    expect(lineAt(m, 1, true, 3).split(' ').pop()).toBe('PEN')
    expect(rightWord(m, lineY(1))).toBe('00000000001234')
    expect(rightWord(m, lineY(2))).toBe('000000C2')
    expect(rightWord(m, lineY(3))).toBe('194')
    keys(m, 'ac 5 7 2')
    expect(lineAt(m, 11, false, 1)).toBe('2')
  })

  it('clears every variable, Ans, M and STATS’ table from SETUP, after =', () => {
    const m = switchOn()
    keys(m, '7 eq sto neg 5 mplus menu 2 1 3 eq menu 1')
    keys(m, 'setup down 3 1 ac')
    expect(variable(m, 0)).toBe('7')
    keys(m, 'setup down 3 eq ac')
    expect(variable(m, 0)).toBe('0')
    expect(variable(m, 8)).toBe('0')
    expect(ans(m)).toBe('0')
    keys(m, 'func fp:STATS 1 eq')
    expect(band(m)[0]).toBe('ERR:MATH')
  })

  it('types over the token at the cursor after SHIFT DEL, OVR shown, and back', () => {
    const m = switchOn()
    keys(m, '1 2 3 left left shift del')
    expect(read(m)).toContain('OVR')
    keys(m, '9 eq')
    expect(ans(m)).toBe('193')
    keys(m, 'ac 1 2 left shift del 5 eq')
    expect(ans(m)).toBe('152')
  })
})

describe('AC on a screen that offers it', () => {
  // Every screen that says AC:BACK (or AC:EDIT) leaves on AC. EQUATION's kinds, the first time
  // before any was chosen, once beeped and stayed (the user's report).
  const cases: { name: string; to: string; hint: string; after?: (m: Elec16) => void }[] = [
    { name: 'MENU', to: 'menu', hint: 'AC:BACK' },
    { name: 'SETUP', to: 'setup', hint: 'AC:BACK' },
    { name: 'FUNC', to: 'func', hint: 'AC:BACK' },
    {
      name: "FUNC's last page",
      to: 'func down down down down down down down down',
      hint: 'AC:BACK',
    },
    { name: "BASE's FUNC", to: 'menu 3 func', hint: 'AC:BACK' },
    { name: "BASE's FUNC, its second page", to: 'menu 3 func down', hint: 'AC:BACK' },
    { name: "STATS' kinds, on coming in", to: 'menu 2', hint: 'AC:BACK' },
    { name: "STATS' kinds from FUNC", to: 'menu 2 1 func 4', hint: 'AC:BACK' },
    { name: "STATS' FUNC", to: 'menu 2 func', hint: 'AC:BACK' },
    // A page of results has no room for the words: what goes is the page.
    { name: "STATS' results", to: 'menu 2 2 1 eq 2 eq right up 2 eq 4 eq eq', hint: 'RESULT' },
    { name: 'f(x) asking for X', to: 'alpha lp add 1 fx', hint: 'AC:BACK' },
    {
      name: "EQUATION's kinds, the first time",
      to: 'menu 5',
      hint: 'AC:BACK',
      // Back to CALC, where a line works out.
      after: (m) => {
        keys(m, '1 add 2 eq')
        expect(ans(m)).toBe('3')
      },
    },
    {
      name: "EQUATION's kinds, chosen before",
      to: 'menu 5 1 ac',
      hint: 'AC:BACK',
      after: (m) => expect(read(m)).toContain('aX+bY=c'),
    },
    { name: "EQUATION's answers", to: 'menu 5 1 1 eq 1 eq 2 eq 1 eq neg 1 eq 0 eq eq', hint: 'X=' },
    // v2's screens (docs/elec16-sci.md section 14).
    { name: 'CONST', to: 'shift func', hint: 'AC:BACK' },
    { name: 'CONV', to: 'shift menu', hint: 'AC:BACK' },
    { name: "CPLX's FUNC", to: 'menu 6 func', hint: 'AC:BACK' },
    { name: "MATRIX's FUNC", to: 'menu 7 func', hint: 'AC:BACK' },
    { name: "MATRIX's FUNC, its functions", to: 'menu 7 func down', hint: 'AC:BACK' },
    { name: "MATRIX's FUNC, EDIT", to: 'menu 7 func down down', hint: 'AC:BACK' },
    { name: "MATRIX's EDIT, its size", to: 'menu 7 func down down 1', hint: 'AC:BACK' },
    { name: "PROG's FUNC", to: 'menu 8 1 func', hint: 'AC:BACK' },
    {
      name: "PROG's list",
      to: 'menu 8',
      hint: 'AC:BACK',
      after: (m) => {
        keys(m, '1 add 2 eq')
        expect(ans(m)).toBe('3')
      },
    },
  ]
  const read = (m: Elec16) => dotText(m.state.vram, 128, 64).join('\n')
  for (const c of cases) {
    it(`${c.name}: AC goes back`, () => {
      const m = switchOn()
      keys(m, c.to)
      expect(read(m)).toContain(c.hint)
      keys(m, 'ac')
      expect(read(m)).not.toContain(c.hint)
      c.after?.(m)
    })
  }
})

describe("the ROM's and the RAM's room (docs/elec16-sci.md section 6.7)", () => {
  /** e16c's globals as sci.s lists them: name = address ; size bytes. */
  const globals = () =>
    [...(read('sci.s') ?? '').matchAll(/^(\w+) = 0x([0-9a-f]{4}) ; (\d+) bytes?$/gm)].map((g) => ({
      name: g[1] ?? '',
      at: Number.parseInt(g[2] ?? '', 16),
      size: Number(g[3]),
    }))

  it("keeps e16c's globals inside their area, below what a load reaches from zero", () => {
    const all = globals()
    expect(all.length).toBeGreaterThan(20)
    for (const g of all) {
      expect(g.at, g.name).toBeGreaterThanOrEqual(0x0100)
      // KEEP starts at 0C00; a load or store reaches 8191 from zero in one instruction.
      expect(g.at + g.size, g.name).toBeLessThanOrEqual(0x0c00)
    }
  })

  it('lays the fixed RAM areas apart from one another and from the globals', () => {
    const areas: [string, number, number][] = [
      ['globals', 0x0100, Math.max(...globals().map((g) => g.at + g.size))],
      ['KEEP', 0x0c00, 0x0d82 + 10 * 200],
      ['MODES', 0x1600, 0x2100],
      ['EQN_WORK', 0x2100, 0x2100 + 24 * 36],
      ['STATS_WORK', 0x2500, 0x2500 + 44 * 8 + 44],
      ['WORK', 0x2700, 0x2800],
      // v2 (section 14.1): its kept region, then its working room.
      ['V2', 0x2800, 0x3000],
      ['CPLX_STACK', 0x3000, 0x3000 + 24 * 16 + 32],
      ['MATRIX_STACK', 0x3200, 0x3200 + 8 * 80 + 72],
      ['INTEGRAL_WORK', 0x3500, 0x3500 + 544 + 19 * 8],
      // CODE's area stays free (section 8.1).
      ['CODE', 0x7000, 0x7c00],
    ]
    for (const [i, [a, from, to]] of areas.entries()) {
      for (const [b, from2, to2] of areas.slice(i + 1)) {
        expect(to <= from2 || to2 <= from, `${a} and ${b}`).toBe(true)
      }
    }
    // numbers.e16.ts says the same addresses.
    const numbers = read('numbers.e16.ts') ?? ''
    for (const [name, at] of [
      ['KEEP', 0x0c00],
      ['MODES', 0x1600],
      ['EQN_WORK', 0x2100],
      ['STATS_WORK', 0x2500],
      ['WORK', 0x2700],
      ['V2', 0x2800],
      ['CPLX_STACK', 0x3000],
      ['MATRIX_STACK', 0x3200],
      ['INTEGRAL_WORK', 0x3500],
    ] as const) {
      expect(numbers, name).toContain(
        `export const ${name} = 0x${at.toString(16).padStart(4, '0')}`,
      )
    }
  })

  it('leaves room in the fixed ROM, where every bank calls', () => {
    // Every byte of the fixed ROM a key goes through is dear: the drawing and the key table
    // live in banks, so a later part has room here (it once had 2,610 bytes left). v3's ways in
    // took the floor from 4 KB to 3.5 KB (the user's decision, docs/elec16-sci.md section 15.8).
    let used = 0x4000
    while (used > 0 && built.image[used - 1] === 0xff) used--
    expect(0x4000 - used).toBeGreaterThanOrEqual(3584)
  })
})

describe('found in the review of 2026-10-25', () => {
  const at = (m: Elec16, a: number) => {
    const d = decode(m.state.ram.subarray(a, a + 8))
    return d === null ? '?' : format(d, 10)
  }

  it('keeps a/b and √ out of a line with no room for their marks', () => {
    // a/b wrapped 0 into a fraction past the 200 tokens the line holds; √ left its END out.
    for (const k of ['frac', 'root']) {
      const m = switchOn('2d')
      // 199 tokens: 0+0+...+0.
      keys(m, `${'0 add '.repeat(99)}0 ${k} eq`)
      expect(lineAt(m, 1, true), k).not.toMatch(/^ERR/)
      expect(ans(m), k).toBe('0')
    }
  })

  it('leaves f(x), STO, RCL and M+ out of TABLE, whose = asks for the range', () => {
    const m = switchOn()
    keys(m, '5 sto lp menu 4 alpha lp add 1 fx sto shift sto mplus 2')
    expect(rows(m)[0]).toBe('X+12')
    expect(lineAt(m, 47)).toBe('TABLE f(X)')
  })

  it('forgets STO, HYP and the constant on a new mode, and HYP on ON', () => {
    const m = switchOn()
    keys(m, 'sto menu 3 1 eq')
    expect(ans(m)).toBe('1')
    keys(m, 'menu 1 3 4 add 5 7 eq menu 3 menu 1 del del del del del 4 5 eq')
    expect(ans(m)).toBe('45')
    keys(m, 'hyp on sin 9 0 eq')
    expect(ans(m)).toBe('1')
  })

  it('puts X back when a TABLE row or a Σ stops at an error', () => {
    const m = switchOn()
    keys(m, '5 sto lp menu 4 1 div alpha lp eq neg 1 eq 1 eq 1 eq')
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
    expect(variable(m, 6)).toBe('5')
    keys(m, 'ac menu 1 func 0 1 div alpha lp shift lp 0 shift lp 2 eq')
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
    expect(variable(m, 6)).toBe('5')
  })

  it('says SYNTAX for a number of more than 30 characters, rather than cut it', () => {
    const m = switchOn()
    keys(m, `${'1 '.repeat(35)}eq`)
    expect(lineAt(m, 1, true)).toBe('ERR:SYNTAX')
  })

  it('carries 60 seconds into a minute in degrees-minutes-seconds', () => {
    const m = switchOn()
    keys(m, '1 dot 9 9 9 9 9 9 9 eq dms')
    expect(rightAt(m, 55)).toBe('2°0′0″')
  })

  it('keeps abs( exact, and takes a variable never stored and M as an exact 0', () => {
    const m = switchOn('2d')
    keys(m, 'shift neg neg 1 frac 3 eq')
    expect(form(m)).toBe('1/3')
    keys(m, 'ac 1 frac 3 mplus ac 1 frac 3 mplus shift sto mplus')
    expect(form(m)).toBe('2/3')
    keys(m, 'ac alpha neg add 1 frac 3 eq')
    expect(form(m)).toBe('1/3')
  })

  it('finds no special angle in a tiny one in RAD', () => {
    const m = switchOn()
    keys(m, 'setup 4 ac sin 1 exp neg 1 0 eq')
    expect(ans(m)).toBe('0.0000000001')
    expect(form(m)).toBe('-')
  })

  it('shows a long BASE line by its end, with nothing from past it', () => {
    const m = switchOn()
    keys(m, `menu 3 ${'1 '.repeat(45)}`)
    // The cursor after the last: its 20 before it, the cursor in the 21st place.
    expect(lineAt(m, 11, false, 1)).toBe('1'.repeat(20))
  })

  it('shows pol( as two answers only when the line is pol( alone', () => {
    const m = switchOn()
    keys(m, 'func 6 3 shift lp 4 rp mul 2 eq')
    expect(bigText(m)).toBe('10')
  })

  it('lights ▲ in BASE only where ▲ brings an earlier line', () => {
    const m = switchOn()
    keys(m, 'menu 3 1 eq')
    expect(lit(m)).not.toContain('UP')
  })

  it('leaves the history it was going through after M+', () => {
    const m = switchOn()
    keys(m, '1 eq 2 eq 3 eq up up up mplus down')
    expect(rows(m)[0]).toBe('1')
  })

  it('goes back to the end of the line after an error in what X? was given', () => {
    const m = switchOn()
    keys(m, 'alpha lp add 1 fx 1 div 0 eq')
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
    keys(m, 'left')
    expect((m.state.lcd.cursor & 0xff) + 1).toBe(3 * 6)
  })

  it('takes a variable after ALPHA into X? and into a cell of STATS, EQUATION and MATRIX', () => {
    const m = switchOn()
    keys(m, '5 sto neg alpha lp add 1 fx alpha neg eq')
    expect(ans(m)).toBe('6')
    keys(m, 'ac menu 2 1 alpha neg eq eq')
    expect(rightWord(m, lineY(1))).toBe('5')
  })

  it('works out σ about the mean, not from Σx² - n x̄² (which loses the digits)', () => {
    const m = switchOn()
    keys(m, 'menu 2 1 1 0 0 0 0 1 eq 1 0 0 0 0 2 eq 1 0 0 0 0 3 eq eq')
    // AUTO shows ten places, the 0 before the point one of them.
    expect(rightWord(m, lineY(2))).toBe('0.816496581')
  })

  it('finds both roots of x² + 10⁸x + 1, the small one too', () => {
    const m = switchOn()
    keys(m, 'menu 5 3 1 eq 1 exp 8 eq 1 eq eq')
    expect([at(m, 0x2100), at(m, 0x2124)].sort()).toEqual(['-0.00000001', '-100000000'])
  })
})
