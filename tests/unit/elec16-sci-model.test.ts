import { assemble, romImage } from '@shared/elec16/asm'
import { REG } from '@shared/elec16/bus'
import { fromMachineText, sourceToMachine, toMachineText } from '@shared/elec16/charset'
import {
  BIG_CHARS,
  BIG_HEIGHT,
  BIG_PITCH,
  BIG_WIDTH,
  bigGlyphColumns,
  glyphColumns,
  SYMBOLS,
  screenText,
} from '@shared/elec16/font'
import { Elec16 } from '@shared/elec16/machine'
import {
  cursorModeMask,
  MODEL_IDS,
  MODELS,
  type ModelId,
  UNIT_MODEL_IDS,
  vramSize,
} from '@shared/elec16/map'
import { decodeSnapshot } from '@shared/elec16/snapshot'
import { ANNUNCIATORS, annunciatorsOf, SCI_ANNUNCIATORS } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'
import { LcdPainter } from '../../src/renderer/widgets/elec16/lcd-painter.js'
import { screen, switchOn, type } from './elec16-helpers.js'

/**
 * ELEC-16 SCI's first stage (docs/elec16-sci.md section 10, S1): the SCI-128 model in the core,
 * its annunciators, the calculator's symbols and big digits in the font, and the bar cursor -
 * and every other model as it was.
 */

const rom = romImage(assemble('.org 0x8000\nebreak'))
const machine = (model: ModelId): Elec16 => Elec16.boot(rom, model)
const POCKETS = MODEL_IDS.filter((id) => id !== 'sci-128')

describe('the SCI-128 model', () => {
  it('is MODEL 5, a 1-bit LCD of 128 x 64 in the E000 window, with nothing of PLAY-320', () => {
    const m = MODELS['sci-128']
    expect(MODEL_IDS.indexOf('sci-128')).toBe(5)
    expect(machine('sci-128').bus.read16(REG.model)).toBe(5)
    expect([m.width, m.height, m.depth, vramSize(m)]).toEqual([128, 64, 1, 1024])
    expect([m.video, m.pad, m.cart, m.apu, m.xramMax, m.drawHz]).toEqual([
      false,
      false,
      false,
      false,
      0,
      30,
    ])
    expect([m.rom, m.annunciators, m.cursor]).toEqual(['sci', 'sci', 'bar'])
  })

  it('is a unit model since its first ROM (S2): TUNE and main offer every model', () => {
    expect(UNIT_MODEL_IDS).toEqual(MODEL_IDS)
  })

  it('is typed to through its own keys and waits at them as at a prompt', () => {
    expect([MODELS['sci-128'].input, MODELS['sci-128'].prompt]).toEqual(['calc', 'key'])
    expect([MODELS['play-320'].input, MODELS['play-320'].prompt]).toEqual(['pad', 'start'])
    for (const id of POCKETS.filter((x) => x !== 'play-320')) {
      expect([MODELS[id].input, MODELS[id].prompt], id).toEqual(['keyboard', 'basic'])
    }
  })

  it('leaves every other model printing the pocket marks with the cell cursor', () => {
    for (const id of POCKETS) {
      expect([MODELS[id].annunciators, MODELS[id].cursor], id).toEqual(['pocket', 'cell'])
      expect(cursorModeMask(MODELS[id]), id).toBe(7)
    }
  })
})

describe('the annunciators', () => {
  it('keep BUSY at bit 0 in both sets, which CODE reads on every model', () => {
    expect(ANNUNCIATORS[0]).toBe('BUSY')
    expect(SCI_ANNUNCIATORS[0]).toBe('BUSY')
  })

  it('fit ANNUN: sixteen bits at most, each name once', () => {
    for (const set of ['pocket', 'sci'] as const) {
      const names = annunciatorsOf(set)
      expect(names.length).toBeLessThanOrEqual(16)
      expect(new Set(names).size).toBe(names.length)
    }
    expect(annunciatorsOf('sci')).toBe(SCI_ANNUNCIATORS)
    expect(annunciatorsOf('pocket')).toBe(ANNUNCIATORS)
  })
})

describe('the bar cursor', () => {
  it('keeps its height bits on SCI-128 and drops bit 3, while every other model keeps 0-7', () => {
    const sci = machine('sci-128')
    sci.bus.write16(REG.cursorMode, 0xf3)
    expect(sci.bus.read16(REG.cursorMode)).toBe(0xf3)
    sci.bus.write16(REG.cursorMode, 0x0f)
    expect(sci.bus.read16(REG.cursorMode)).toBe(0x07)
    for (const id of POCKETS) {
      const m = machine(id)
      m.bus.write16(REG.cursorMode, 0xf3)
      expect(m.bus.read16(REG.cursorMode), id).toBe(3)
    }
  })

  it('goes through a snapshot on SCI-128, and a pocket snapshot with those bits is refused', () => {
    const sci = machine('sci-128')
    sci.bus.write16(REG.cursorMode, 0x57)
    sci.bus.write16(REG.cursor, 0x0a21)
    const back = decodeSnapshot(sci.snapshot())
    expect(back?.lcd.cursorMode).toBe(0x57)
    expect(back?.lcd.cursor).toBe(0x0a21)
    const pocket = machine('pocket-48')
    pocket.state.lcd.cursorMode = 0x13
    expect(decodeSnapshot(pocket.snapshot())).toBeNull()
  })

  it('is drawn one dot wide down from its dot, lit, and the dots beside it left as they are', () => {
    const image = () =>
      ({ width: 16, height: 16, data: new Uint8ClampedArray(16 * 16 * 4) }) as unknown as ImageData
    const dots = image()
    const painter = new LcdPainter()
    painter.configure(
      dots,
      image(),
      16,
      16,
      { ground: [0, 0, 0], dot: [9, 9, 9], shadow: [1, 1, 1] },
      8,
    )
    painter.paint(new Uint8Array(256), 1, false, { shape: 3, x: 5, y: 2, height: 6 })
    const lit = (x: number, y: number) => (dots.data[(y * 16 + x) * 4 + 3] ?? 0) > 0
    expect([1, 2, 7, 8].map((y) => lit(5, y))).toEqual([false, true, true, false])
    expect([lit(4, 3), lit(6, 3)]).toEqual([false, false])
  })
})

describe("the calculator's symbols", () => {
  /** Every code the font draws: ASCII, the symbols and the kana. */
  const drawn = [
    ...Array.from({ length: 0x7e - 0x20 + 1 }, (_, k) => 0x20 + k),
    ...SYMBOLS.map((s) => s.code),
    ...Array.from({ length: 0xdf - 0xa1 + 1 }, (_, k) => 0xa1 + k),
  ]
  const key = (code: number) => glyphColumns(code).join(',')

  it('fill 80-9F and then E0-E4 in order (v2 added 97 on), each unlike any other character', () => {
    expect(SYMBOLS.map((s) => s.code)).toEqual([
      ...Array.from({ length: 0x20 }, (_, k) => 0x80 + k),
      ...Array.from({ length: 5 }, (_, k) => 0xe0 + k),
    ])
    for (const s of SYMBOLS) {
      const same = drawn.filter((c) => c !== s.code && key(c) === key(s.code))
      expect(same, s.text).toEqual([])
    }
  })

  it('read back from the screen as their text, and the codes after them stay empty boxes', () => {
    const vram = new Uint8Array(128 * 8 * 4)
    SYMBOLS.forEach((s, k) => {
      vram.set(glyphColumns(s.code), (k % 21) * 6 + Math.floor(k / 21) * 128)
    })
    const lines = screenText(vram, 128, 32)
    expect(
      lines[0]?.startsWith(
        SYMBOLS.slice(0, 21)
          .map((s) => s.text)
          .join(''),
      ),
    ).toBe(true)
    expect(
      lines[1]?.startsWith(
        SYMBOLS.slice(21)
          .map((s) => s.text)
          .join(''),
      ),
    ).toBe(true)
    expect(key(0xe5)).toBe(key(0xff))
  })

  it("are v2's where the font kept room: the integral, ∠, the constants' letters, a program's signs", () => {
    const text = new Map(SYMBOLS.map((s) => [s.code, s.text]))
    expect([0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f].map((c) => text.get(c))).toEqual([
      '∫',
      '∠',
      '₀',
      'ₑ',
      'ₚ',
      'ₙ',
      'ħ',
      'ε',
      'μ',
    ])
    expect([0xe0, 0xe1, 0xe2, 0xe3, 0xe4].map((c) => text.get(c))).toEqual([
      'α',
      '⇒',
      '≠',
      '≤',
      '≥',
    ])
  })

  it('come in through IMPORT from the look-alikes a PC writes: the micro sign, a lunate epsilon', () => {
    expect(toMachineText('µϵ\r\n')).toEqual({ bytes: Uint8Array.from([0x9f, 0x9e, 0x0d]) })
  })

  it('go out and come back through EXPORT and IMPORT, the two-code-point ones too', () => {
    const bytes = Uint8Array.from([...SYMBOLS.map((s) => s.code), 0x0d])
    const text = fromMachineText(bytes)
    expect(text).toBe(`${SYMBOLS.map((s) => s.text).join('')}\r\n`)
    expect(toMachineText(text)).toEqual({ bytes })
    expect(sourceToMachine(text.replace('\r\n', ''))).toEqual({ bytes })
  })

  it("show in BASIC by their codes, as the BASIC manual's example says", () => {
    const m = switchOn('pocket-48')
    type(m, 'PRINT CHR$(128);CHR$(130)\n')
    expect(screen(m).join('\n')).toContain('π÷')
  })

  it('take x-bar only whole, y-bar either way, and leave a lone x or a lone macron to their own', () => {
    const one = (s: string) => toMachineText(s)
    expect(one('x\u0304=y\u0304')).toEqual({ bytes: Uint8Array.from([0x95, 0x3d, 0x96, 0x0d]) })
    expect(one('\u0233x')).toEqual({ bytes: Uint8Array.from([0x96, 0x78, 0x0d]) })
    expect(one('2⁻¹')).toEqual({ bytes: Uint8Array.from([0x32, 0x86, 0x0d]) })
    expect(one('⁻')).toHaveProperty('problem')
    expect(one('a\u0304')).toHaveProperty('problem')
  })
})

describe('the big digits', () => {
  /** A glyph as rows of # and ., for its shape to be read. */
  const picture = (ch: string) =>
    Array.from({ length: BIG_HEIGHT }, (_, y) =>
      bigGlyphColumns(ch)
        .map((col) => ((col >> y) & 1 ? '#' : '.'))
        .join(''),
    )

  it('draw 8 as one closed line two dots thick, its corners filled', () => {
    expect(picture('8')).toEqual([
      '#######',
      '#######',
      '##...##',
      '##...##',
      '##...##',
      '##...##',
      '#######',
      '#######',
      '##...##',
      '##...##',
      '##...##',
      '##...##',
      '#######',
      '#######',
    ])
  })

  it('give the minus a bar of five, and the point two dots square at the bottom', () => {
    expect(picture('-')[6]).toBe('.#####.')
    expect(picture('-').filter((row) => row.includes('#'))).toHaveLength(2)
    expect(picture('.')).toEqual([...Array(12).fill('..'), '##', '##'])
  })

  it('fit the longest answer in 128 dots: sign, ten digits, point, x10 and a three-character exponent', () => {
    for (const ch of BIG_CHARS) expect(bigGlyphColumns(ch).length).toBe(ch === '.' ? 2 : BIG_WIDTH)
    // Each piece's last column is its gap, so they are set edge to edge.
    const widest = BIG_PITCH * 11 + 3 + 3 * 6 + 3 * 6
    expect(widest).toBe(127)
  })
})
