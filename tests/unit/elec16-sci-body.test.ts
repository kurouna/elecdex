import { keyCode } from '@shared/elec16/keys'
import { SCI_KEYS, SCI_NAME_LENGTH, sciKeyCode, sciNameTable } from '@shared/elec16/sci-keys'
import { KEY_ROWS } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'
import { pickerChoice, pickerRows } from '../../src/renderer/layout/popup.js'
import {
  COMPACT_PLACES,
  FACE_GAP_EM,
  FULL_PLACES,
  faceRuns,
  faceScale,
  facesEm,
  type Rect,
  SCI_SKIN_COLOURS,
  SCI_SKINS,
  type SciLayout,
  sciFit,
  sciLayout,
} from '../../src/renderer/widgets/elec16/sci-body.js'
import { sciKeyFate } from '../../src/renderer/widgets/elec16/sci-input.js'

/**
 * ELEC-16 SCI's second stage (docs/elec16-sci.md section 10, S2): the calculator's key table,
 * its body's geometry, its keys from the PC and its row in the add-pane picker.
 */

describe("the calculator's keys", () => {
  it('each have a code of their own in the matrix, SHIFT where the pocket has it and CAPS left free', () => {
    const codes = SCI_KEYS.map((k) => k.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(Math.max(...codes)).toBeLessThan(KEY_ROWS * 8)
    expect(sciKeyCode('shift')).toBe(keyCode('shift'))
    expect(codes).not.toContain(keyCode('caps'))
    expect(new Set(SCI_KEYS.map((k) => k.id)).size).toBe(SCI_KEYS.length)
  })

  it('have names the start screen can show: six characters of the machine at most', () => {
    for (const k of SCI_KEYS) {
      expect(k.name.length, k.id).toBeGreaterThan(0)
      expect(k.name.length, k.id).toBeLessThanOrEqual(SCI_NAME_LENGTH)
      expect(/^[ -~]+$/.test(k.name), k.id).toBe(true)
    }
    const table = sciNameTable(KEY_ROWS * 8)
    const at = sciKeyCode('sin') * SCI_NAME_LENGTH
    expect(String.fromCharCode(...table.subarray(at, at + 3))).toBe('SIN')
    expect(table[at + 3]).toBe(0)
  })

  it('are every one on the whole body once, ON beside them, the arrows on the pad', () => {
    const placed = FULL_PLACES.map((p) => p.id)
    expect(new Set(placed).size).toBe(placed.length)
    const arrows = ['up', 'down', 'left', 'right']
    expect([...placed, ...arrows].sort()).toEqual([...SCI_KEYS.map((k) => k.id), 'on'].sort())
    for (const id of COMPACT_PLACES.map((p) => p.id))
      expect(
        SCI_KEYS.some((k) => k.id === id),
        id,
      ).toBe(true)
  })
})

describe("the calculator's body", () => {
  const inside = (r: Rect, w: number, h: number) =>
    r.x >= 0 && r.y >= 0 && r.x + r.w <= w + 1e-9 && r.y + r.h <= h + 1e-9
  const apart = (a: Rect, b: Rect) =>
    a.x + a.w <= b.x + 1e-9 ||
    b.x + b.w <= a.x + 1e-9 ||
    a.y + a.h <= b.y + 1e-9 ||
    b.y + b.h <= a.y + 1e-9

  /** Every part of a layout, by name. */
  const parts = (l: SciLayout): [string, Rect][] => [
    ['glass', l.glass],
    ...(l.plate === null ? [] : [['plate', l.plate] as [string, Rect]]),
    ...(l.pad === null ? [] : [['pad', l.pad] as [string, Rect]]),
    ...l.keys.map((k): [string, Rect] => [k.id, k.at]),
    ...l.keys.filter((k) => k.over.h > 0).map((k): [string, Rect] => [`${k.id} faces`, k.over]),
  ]

  it('keeps every part on the case and none over another, at every scale and density', () => {
    for (const mode of ['full', 'compact', 'lcd'] as const) {
      for (const scale of [1, 2, 3, 4]) {
        for (const ratio of [1, 1.25, 1.5, 2]) {
          const l = sciLayout(mode, scale, ratio)
          const all = parts(l)
          for (const [name, r] of all)
            expect(inside(r, l.width, l.height), `${mode} ${scale} ${ratio} ${name}`).toBe(true)
          for (let i = 0; i < all.length; i++) {
            for (let j = i + 1; j < all.length; j++) {
              const [a, ra] = all[i] as [string, Rect]
              const [b, rb] = all[j] as [string, Rect]
              expect(apart(ra, rb), `${mode} ${scale} ${ratio}: ${a} over ${b}`).toBe(true)
            }
          }
        }
      }
    }
  })

  it('gives the LCD a whole number of device pixels a dot, its frame round it', () => {
    const l = sciLayout('full', 3, 1.25)
    expect(l.scale).toBe(3)
    expect(l.glass.w).toBeCloseTo((128 * 3) / 1.25 + 28)
  })

  it('takes the whole body where it fits at two or more, then COMPACT, then the LCD alone', () => {
    const full = sciFit({ w: 1000, h: 1200, ratio: 1 }, 'auto')
    expect(full?.mode).toBe('full')
    expect(full?.scale).toBeGreaterThanOrEqual(2)
    expect(sciFit({ w: 600, h: 300, ratio: 1 }, 'auto')?.mode).toBe('compact')
    expect(sciFit({ w: 200, h: 120, ratio: 1 }, 'auto')?.mode).toBe('lcd')
    // What is asked for is given, at as many device pixels a dot as fit.
    const asked = sciFit({ w: 1000, h: 1200, ratio: 1 }, 'lcd')
    expect(asked?.mode).toBe('lcd')
    for (const room of [
      { w: 1000, h: 1200, ratio: 1 },
      { w: 600, h: 300, ratio: 1.5 },
    ]) {
      const l = sciFit(room, 'auto')
      expect(l === null || (l.width <= room.w && l.height <= room.h)).toBe(true)
    }
    expect(sciFit({ w: 0, h: 500, ratio: 1 }, 'auto')).toBeNull()
  })

  it("prints what the keys' face lacks another way: raised letters, the mono face for primes", () => {
    const shown = (t: string) =>
      faceRuns(t).map((r) => (r.sup ? `^${r.text}` : r.mono ? `{${r.text}}` : r.text))
    expect(shown('10ˣ')).toEqual(['10', '^x'])
    expect(shown('SIN⁻¹')).toEqual(['SIN', '^-1'])
    expect(shown('ʸ√x')).toEqual(['^y', '√x'])
    expect(shown('∛')).toEqual(['^3', '√'])
    expect(shown('°′″')).toEqual(['{°′″}'])
    expect(shown('x²')).toEqual(['x²'])
  })

  it('has every colour for every skin, the LCD flat only on PLAIN', () => {
    for (const skin of SCI_SKINS) {
      const c = SCI_SKIN_COLOURS[skin]
      for (const [name, v] of Object.entries(c)) expect(v, `${skin} ${name}`).not.toBe('')
      expect(c.lcd.flat).toBe(skin === 'plain')
    }
  })
})

describe("the calculator's keys from the PC", () => {
  const key = (
    k: string,
    code = '',
    extra: Partial<Record<'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey', boolean>> = {},
  ) =>
    sciKeyFate({
      key: k,
      code,
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
      ...extra,
    })

  it('types digits and signs by the character, the rest by the place', () => {
    expect(key('7', 'Digit7')).toEqual({ kind: 'key', code: sciKeyCode('7'), shift: false })
    expect(key('*', 'Digit8', { shiftKey: true })).toEqual({
      kind: 'key',
      code: sciKeyCode('mul'),
      shift: false,
    })
    expect(key('Enter', 'Enter')).toEqual({ kind: 'key', code: sciKeyCode('eq'), shift: false })
    expect(key('Delete', 'Delete')).toEqual({ kind: 'key', code: sciKeyCode('ac'), shift: false })
    expect(key('s', 'KeyS')).toEqual({ kind: 'key', code: sciKeyCode('sin'), shift: false })
  })

  it('gives √ on its own key, x! after SHIFT, and ON on Pause', () => {
    expect(key('r', 'KeyR')).toEqual({ kind: 'key', code: sciKeyCode('root'), shift: false })
    expect(key('!', 'Digit1', { shiftKey: true })).toEqual({
      kind: 'key',
      code: sciKeyCode('inv'),
      shift: true,
    })
    expect(key('Pause', 'Pause')).toEqual({ kind: 'brk' })
  })

  // Found in a review: a capital letter (CapsLock, or Shift held) typed nothing.
  it('takes a letter in either case: with CapsLock its key, with Shift held its SHIFT face', () => {
    expect(key('S', 'KeyS')).toEqual({ kind: 'key', code: sciKeyCode('sin'), shift: false })
    expect(key('S', 'KeyS', { shiftKey: true })).toEqual({
      kind: 'key',
      code: sciKeyCode('sin'),
      shift: true,
    })
    expect(key('g', 'KeyG', { shiftKey: true })).toEqual({
      kind: 'key',
      code: sciKeyCode('log'),
      shift: true,
    })
    expect(key('Q', 'KeyQ', { shiftKey: true }).kind).toBe('pass')
  })

  it("never takes the app's keys: Ctrl, Alt or the system key, Tab, Escape, the function keys", () => {
    expect(key('7', 'Digit7', { ctrlKey: true }).kind).toBe('pass')
    expect(key('s', 'KeyS', { altKey: true }).kind).toBe('pass')
    expect(key('s', 'KeyS', { metaKey: true }).kind).toBe('pass')
    for (const [k, code] of [
      ['Tab', 'Tab'],
      ['Escape', 'Escape'],
      ['F5', 'F5'],
      ['q', 'KeyQ'],
    ]) {
      expect(key(k as string, code as string).kind, k).toBe('pass')
    }
  })
})

describe("the picker's rows", () => {
  const widget = {
    id: 'elec16',
    title: 'elec-16',
    description: 'pocket',
    popup: true,
    variants: [
      {
        key: 'sci',
        pickerTitle: 'elec-16 sci',
        description: 'calculator',
        state: { fresh: 'sci-128' },
      },
    ],
  }

  it("list a widget's own row, then its variants with the state each starts from", () => {
    const rows = pickerRows(widget)
    expect(rows.map((r) => [r.variant, r.title, r.description, r.state])).toEqual([
      [null, 'elec-16', 'pocket', undefined],
      ['sci', 'elec-16 sci', 'calculator', { fresh: 'sci-128' }],
    ])
  })

  it('never pop a variant up, whatever its widget can', () => {
    const [own, sci] = pickerRows(widget)
    expect(own && pickerChoice(own.widget, 'popup', null).kind).toBe('popup')
    expect(sci && pickerChoice(sci.widget, 'popup', null).kind).toBe('none')
    expect(sci && pickerChoice(sci.widget, 'tab', null)).toEqual({ kind: 'add', placement: 'tab' })
  })
})

describe('the faces printed over the keys (a review of 2026-10-25)', () => {
  // An em a letter, half of it for a mono one: what a canvas would measure, made simple.
  const measure = (text: string, mono: boolean) => [...text].length * (mono ? 0.5 : 1)

  it('count both faces, the gap between them, a raised run at its size', () => {
    expect(facesEm('CONST', '', measure, 0.72)).toBe(5)
    expect(facesEm('SIN⁻¹', 'D', measure, 0.72)).toBeCloseTo(3 + 2 * 0.72 + FACE_GAP_EM + 1)
    expect(facesEm('→DMS', 'B', measure, 1)).toBe(4 + FACE_GAP_EM + 1)
    expect(facesEm('°′″', '', measure, 1)).toBe(1.5)
  })

  it('narrow sideways what is wider than its band, and leave the rest', () => {
    // A 2x screen at the smallest scale: a dot a device pixel, a unit 1 CSS pixel, 20 a band.
    expect(faceScale(2.5, 10, 20)).toBeCloseTo(0.8)
    expect(faceScale(1.5, 10, 20)).toBe(1)
    expect(faceScale(0, 10, 20)).toBe(1)
  })
})
