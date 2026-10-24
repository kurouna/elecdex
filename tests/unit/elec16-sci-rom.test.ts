import { existsSync, readFileSync } from 'node:fs'
import { compileSci, sciRomFile } from '@shared/e16c/sci-rom'
import { REG } from '@shared/elec16/bus'
import { decode, format } from '@shared/elec16/decimal'
import { BIG_PITCH, BIG_WIDTH, bigGlyphColumns, dotText, screenText } from '@shared/elec16/font'
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
 * The ELEC-16 SCI ROM as S5 has it (resources/elec16/sci, docs/elec16-sci.md section 6): the
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
    // Past the right edge reads as the ground: lit on an inverted band, so it inverts to none.
    const past = inverted ? 0xff : 0
    const top = x + x0 < 128 ? (m.state.vram[band * 128 + x + x0] ?? 0) : past
    const below = x + x0 < 128 ? (m.state.vram[(band + 1) * 128 + x + x0] ?? 0) : past
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

  it('MENU lists the modes; AC goes back to the one it was in, a digit past 5 beeps', () => {
    const m = switchOn()
    keys(m, 'menu')
    expect(lineAt(m, 1, true)).toBe('MENU')
    expect(lineAt(m, 20)).toBe('3:BASE    4:TABLE')
    keys(m, '7')
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
    keys(m, 'func 7 3 shift lp 4 eq')
    expect(lineAt(m, 46, false, 1).startsWith('X=')).toBe(true)
    expect(right(m, 46).split(' ').pop()).toBe('5')
    expect(right(m, 55).split(' ').pop()).toBe('53.13010235')
    expect(variable(m, 6)).toBe('5')
    keys(m, 'ac func 8 2 shift lp 9 0 eq')
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
  const lineY = (n: number) => 11 + 9 * n
  /** The band's right-hand text (textRight's cells start at x = 3). */
  const bandRight = (m: Elec16) => lineAt(m, 1, true, 3).split(' ').pop() ?? ''
  /** The band's title, the text at its left. */
  const bandLeft = (m: Elec16) => lineAt(m, 1, true, 1).split('  ')[0]
  /** The small text right-aligned on the row whose top is `y`, its last word. */
  const rightWord = (m: Elec16, y: number) => lineAt(m, y, false, 3).split(' ').pop() ?? ''

  it('MENU marks the mode it is in; a mode is kept through OFF and ON', () => {
    const m = switchOn()
    keys(m, 'menu 3')
    expect(bandLeft(m)).toBe('BASE 32')
    keys(m, 'menu')
    // 3:BASE marked: its item inverted from a row above.
    expect(dot(m, 2, 19)).toBe(true)
    keys(m, 'ac shift on')
    m.brk()
    settle(m)
    expect(bandLeft(m)).toBe('BASE 32')
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
    keys(m, '3 1 2 eq 4 eq 6 eq right up up up 1 eq 2 eq 1 eq eq')
    expect(bandLeft(m)).toBe('1-VAR RESULT')
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
    expect(bandLeft(m)).toBe('2-VAR RESULT')
    expect(rightWord(m, lineY(3))).toBe('0.993399268')
    expect(rightWord(m, lineY(4))).toBe('-0.666666667')
    expect(rightWord(m, lineY(5))).toBe('2.5')
    keys(m, 'down')
    expect(rightWord(m, lineY(1))).toBe('1')
    keys(m, 'ac shift on')
    m.brk()
    settle(m)
    keys(m, '1 eq')
    expect(rightWord(m, lineY(0))).toBe('3')
  })

  it('STATS puts a row in and takes one out by FUNC', () => {
    const m = switchOn()
    keys(m, 'menu 2 1 1 eq 2 eq 3 eq up up up func 2')
    expect(bandRight(m)).toBe('n=2')
    keys(m, 'func 1')
    expect(bandRight(m)).toBe('n=3')
    keys(m, 'func 3')
    expect(bandRight(m)).toBe('n=0')
  })

  it('BASE shows an answer in the base and the other three, and its bits', () => {
    const m = switchOn()
    keys(m, 'menu 3 func 1 sin 0 1 6 func 5 0 neg tan tan 0 eq')
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
    keys(m, 'ac func 9 0 eq')
    expect(rightWord(m, lineY(1))).toBe('-1')
    keys(m, 'ac fd fd 1 0 1 func 7 1 1 eq')
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
    expect(bandLeft(m)).toBe('TABLE')
    // The first row is chosen (inverted); the others read as they are, right in the column.
    expect(lineAt(m, 30, false, 1).split(' ').pop()).toBe('0')
    expect(lineAt(m, 48, false, 1).split(' ').pop()).toBe('8')
    keys(m, 'ac eq 1 eq 1 0 0 eq 1 eq')
    expect(bandLeft(m)).toBe('ERR:RANGE')
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
    expect(read(m).slice(1, 5)).toEqual([
      '1:gcd(   2:lcm(',
      '3:%      4:int(',
      '5:round( 6:rand',
      '7:pol(   8:rec(',
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
  ])('%s is %s', (line, value) => {
    expect(answer(line).ans).toBe(value)
  })

  /** STATS' 2-VAR table X 1, 2, 3 and Y 2, 4, 7, then back to CALC. */
  function withData(): Elec16 {
    const m = switchOn()
    keys(m, 'menu 2 2 1 eq 2 eq 3 eq right up up up 2 eq 4 eq 7 eq menu 1')
    return m
  }

  it.each([
    ['func down 1', '3'],
    ['func down 2', '2'],
    ['func down 3', '0.8164965809'],
    ['func down 4', '1'],
    ['func down 5', '4.333333333'],
    ['func down 8', '0.9933992678'],
    ['func down 9', '-0.6666666667'],
    ['func down 0', '2.5'],
    ['func down down 1', '6'],
    ['func down down 2', '14'],
    ['func down down 5', '31'],
    // The estimates on y = a + bx: y'(4) = a + 4b, x'(9.333...) = 4.
    ['func down down 7 4', '9.333333333'],
    ['func down down 6 9 dot 3 3 3 3 3 3 3 3 3 3', '4'],
    // In a line like any value: 10 x̄ + 1.
    ['1 0 func down 2 add 1', '21'],
  ])("STATS' %s is %s in CALC", (line, value) => {
    const m = withData()
    keys(m, `${line} eq`)
    expect(ans(m)).toBe(value)
  })

  it("shows STATS' results by their names in the line", () => {
    const m = withData()
    keys(m, 'setup 2 ac func down 2 add func down down 7')
    expect(rows(m)[0]).toBe('\u0078\u0304+y\u2032(')
  })

  it('says MATH with no data, and for y from one variable', () => {
    const m = switchOn()
    keys(m, 'menu 2 func 3 menu 1 func down 1 eq')
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
    keys(m, 'ac menu 2 1 5 eq menu 1 func down 5 eq')
    expect(lineAt(m, 1, true)).toBe('ERR:MATH')
    keys(m, 'ac func down 2 eq')
    expect(ans(m)).toBe('5')
  })
})
