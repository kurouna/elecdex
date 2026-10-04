import { assemble, romImage } from '@shared/elec16/asm'
import { KANA_KEYS, keyCode, MACHINE_KEYS } from '@shared/elec16/keys'
import { Elec16 } from '@shared/elec16/machine'
import { ANNUNCIATORS } from '@shared/elec16/state'
import { hzOfClock } from '@shared/elec16-units'
import { describe, expect, it } from 'vitest'
import { byteKind, labelsOf, readCore } from '../../src/renderer/widgets/elec16/core.js'
import {
  bodyFor,
  CASE,
  COMPACT_ROW,
  caseHeight,
  deviceFit,
  FULL_ROWS,
} from '../../src/renderer/widgets/elec16/layout.js'
import { FULL, LcdPainter, strength } from '../../src/renderer/widgets/elec16/lcd-painter.js'
import { panelShown, readElec16Pane } from '../../src/renderer/widgets/elec16/pane-state.js'
import { kanaLit, type PcKey, pcKeyFate } from '../../src/renderer/widgets/elec16/pc-keys.js'
import { SKIN_IDS, SKINS } from '../../src/renderer/widgets/elec16/skins.js'

/** The ELEC-16 pane's pure parts (docs/elec16.md section 7). */

const pc = (code: string, key: string, more: Partial<PcKey> = {}): PcKey => ({
  code,
  key,
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  ...more,
})

describe('the PC keyboard', () => {
  it('types letters by their place, the case left to CAPS and the PC Shift', () => {
    expect(pcKeyFate(pc('KeyA', 'a'))).toEqual({ kind: 'key', code: keyCode('a'), shift: false })
    expect(pcKeyFate(pc('KeyA', 'A', { shiftKey: true }))).toEqual({
      kind: 'key',
      code: keyCode('a'),
      shift: true,
    })
    // CapsLock on in the OS: still the letter's own key, no shift.
    expect(pcKeyFate(pc('KeyA', 'A'))).toEqual({ kind: 'key', code: keyCode('a'), shift: false })
    // The letter a key types, wherever it is; another alphabet's, by its place.
    expect(pcKeyFate(pc('KeyQ', 'a'))).toEqual({ kind: 'key', code: keyCode('a'), shift: false })
    expect(pcKeyFate(pc('KeyF', 'а'))).toEqual({ kind: 'key', code: keyCode('f'), shift: false })
  })

  it('types a symbol from the key whose shifted face it is on', () => {
    expect(pcKeyFate(pc('Digit1', '!', { shiftKey: true }))).toEqual({
      kind: 'key',
      code: keyCode('1'),
      shift: true,
    })
    expect(pcKeyFate(pc('Digit1', '1'))).toEqual({ kind: 'key', code: keyCode('1'), shift: false })
    expect(pcKeyFate(pc('Space', ' '))).toEqual({ kind: 'key', code: keyCode(' '), shift: false })
  })

  it('in KANA mode, presses the key at the place of the JIS kana layout, whatever the IME says', () => {
    const kanaOf = (event: PcKey): string | undefined => {
      const fate = pcKeyFate(event, true)
      if (fate.kind !== 'key') return undefined
      const pair = Object.entries(KANA_KEYS).find(([id]) => keyCode(id) === fate.code)?.[1]
      return fate.shift ? (pair?.[1] ?? pair?.[0]) : pair?.[0]
    }
    // The IME sends Process or a kana for the key; its place is what counts.
    expect(kanaOf(pc('KeyK', 'Process'))).toBe('ﾉ')
    expect(kanaOf(pc('Digit3', 'ぁ', { shiftKey: true }))).toBe('ｧ')
    // The JIS layout's own places right of the letters and below the digits.
    const places: [string, string][] = [
      ['Minus', 'ﾎ'],
      ['Equal', 'ﾍ'],
      ['IntlYen', 'ｰ'],
      ['BracketLeft', 'ﾞ'],
      ['BracketRight', 'ﾟ'],
      ['Semicolon', 'ﾚ'],
      ['Quote', 'ｹ'],
      ['Backslash', 'ﾑ'],
      ['Comma', 'ﾈ'],
      ['Period', 'ﾙ'],
      ['Slash', 'ﾒ'],
      ['IntlRo', 'ﾛ'],
      ['Digit0', 'ﾜ'],
    ]
    for (const [code, kana] of places) expect(kanaOf(pc(code, 'Process')), code).toBe(kana)
    expect(kanaOf(pc('Digit0', '0', { shiftKey: true }))).toBe('ｦ')
    // ENTER, SPACE and shortcuts are as ever.
    expect(pcKeyFate(pc('Space', ' '), true)).toEqual({
      kind: 'key',
      code: keyCode(' '),
      shift: false,
    })
    expect(pcKeyFate(pc('KeyC', 'c', { ctrlKey: true }), true)).toEqual({ kind: 'pass' })
    expect(kanaLit(1 << ANNUNCIATORS.indexOf('KANA'))).toBe(true)
    expect(kanaLit(1 << ANNUNCIATORS.indexOf('CAPS'))).toBe(false)
  })

  it('names the keys that type no character, and takes Pause as BRK', () => {
    expect(pcKeyFate(pc('Enter', 'Enter'))).toEqual({
      kind: 'key',
      code: keyCode('enter'),
      shift: false,
    })
    expect(pcKeyFate(pc('Home', 'Home'))).toEqual({
      kind: 'key',
      code: keyCode('cls'),
      shift: false,
    })
    expect(pcKeyFate(pc('Pause', 'Pause'))).toEqual({ kind: 'brk' })
  })

  it('never takes the app shortcuts or the ways out of the pane', () => {
    for (const event of [
      pc('KeyC', 'c', { ctrlKey: true }),
      pc('KeyF', 'f', { altKey: true }),
      pc('KeyA', 'a', { metaKey: true }),
      pc('Tab', 'Tab'),
      pc('Escape', 'Escape'),
      pc('F5', 'F5'),
      pc('Quote', 'Dead'),
      pc('Digit2', 'é'),
    ]) {
      expect(pcKeyFate(event), event.code).toEqual({ kind: 'pass' })
    }
  })
})

describe('the LCD painter', () => {
  const image = (w: number, h: number) =>
    ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }) as unknown as ImageData
  const colours = { ground: [0, 0, 0], dot: [200, 100, 50], shadow: [20, 20, 20] } as const
  /** A pixel's red, green, blue and opacity. */
  const at = (img: ImageData, x: number, y: number) => {
    const k = (y * img.width + x) * 4
    return Array.from(img.data.subarray(k, k + 4))
  }

  function setUp(width = 8, height = 8) {
    const dots = image(width, height)
    const shadows = image(width, height)
    const painter = new LcdPainter()
    painter.configure(dots, shadows, width, height, colours, 8)
    return { dots, shadows, painter, pixels: new Uint8Array(width * height) }
  }

  it('draws every dot at first, then only what changed, a pixel a dot', () => {
    const { dots, shadows, painter, pixels } = setUp()
    expect(painter.paint(pixels, 1, false, null).dirty).toEqual({ x: 0, y: 0, w: 8, h: 8 })
    expect(painter.paint(pixels, 1, false, null).dirty).toBeNull()
    pixels[2 * 8 + 3] = 1
    expect(painter.paint(pixels, 1, false, null).dirty).toEqual({ x: 3, y: 2, w: 1, h: 1 })
    // The dot in its colour, its shadow under it; a dot that is out is clear in both.
    expect(at(dots, 3, 2)).toEqual([200, 100, 50, 255])
    expect(at(shadows, 3, 2)).toEqual([20, 20, 20, 255])
    expect(at(dots, 4, 2)[3]).toBe(0)
    expect(at(shadows, 4, 2)[3]).toBe(0)
  })

  it('lights a dot at once and lets it go out a level a frame, saying so', () => {
    const { dots, painter, pixels } = setUp()
    pixels[0] = 1
    painter.paint(pixels, 1, true, null)
    pixels[0] = 0
    let frames = 0
    const opacity: number[] = []
    while (painter.paint(pixels, 1, true, null).fading) {
      frames++
      opacity.push(at(dots, 0, 0)[3] ?? 0)
    }
    expect(frames).toBe(FULL - 1)
    expect(opacity).toEqual([...opacity].sort((a, b) => b - a))
    expect(painter.paint(pixels, 1, true, null).dirty).toBeNull()
    expect(at(dots, 0, 0)[3]).toBe(0)
  })

  it('turns the cursor cell over for a block, and draws a line for an underline', () => {
    const { dots, painter, pixels } = setUp(12, 8)
    painter.paint(pixels, 1, false, { column: 1, row: 0, shape: 2 })
    expect(at(dots, 6, 0)[3]).toBe(255)
    expect(at(dots, 6, 7)[3]).toBe(0)
    painter.paint(pixels, 1, false, { column: 1, row: 0, shape: 1 })
    expect(at(dots, 6, 0)[3]).toBe(0)
    expect(at(dots, 6, 7)[3]).toBe(255)
  })

  it('blinks the cursor whole with the fade on: its cell changes at once', () => {
    const { dots, painter, pixels } = setUp(12, 8)
    painter.paint(pixels, 1, true, { column: 1, row: 0, shape: 2 })
    expect(at(dots, 6, 0)[3]).toBe(255)
    // The half of the blink without it: out at once, nothing left fading.
    expect(painter.paint(pixels, 1, true, null).fading).toBe(false)
    expect(at(dots, 6, 0)[3]).toBe(0)
    // A dot of the text still fades.
    pixels[0] = 1
    painter.paint(pixels, 1, true, null)
    pixels[0] = 0
    expect(painter.paint(pixels, 1, true, null).fading).toBe(true)
  })

  it('shows four shades on the handheld screen, and holds contrast to its range', () => {
    const { dots, painter, pixels } = setUp()
    pixels.set([1, 2, 3])
    painter.paint(pixels, 2, false, null)
    const opacity = [0, 1, 2].map((x) => at(dots, x, 0)[3] ?? 0)
    expect(opacity[0]).toBeLessThan(opacity[1] ?? 0)
    expect(opacity[1]).toBeLessThan(opacity[2] ?? 0)
    expect(strength(8)).toBe(1)
    expect(strength(-5)).toBe(strength(0))
  })
})

describe('the body and the pane', () => {
  const lcd = { width: 240, height: 48 }
  it('draws the whole keyboard only where it fits, else a row of keys, else the LCD', () => {
    expect(bodyFor({ w: 900, h: 500, ratio: 1 }, lcd, true)).toBe('full')
    expect(bodyFor({ w: 400, h: 500, ratio: 1 }, lcd, true)).toBe('compact')
    expect(bodyFor({ w: 900, h: 220, ratio: 1 }, lcd, true)).toBe('compact')
    expect(bodyFor({ w: 900, h: 180, ratio: 1 }, lcd, true)).toBe('lcd')
    // The whole keyboard wants two device pixels a dot across: 500 is too narrow for them
    // at one CSS pixel each, wide enough at two.
    expect(bodyFor({ w: 500, h: 900, ratio: 1 }, lcd, true)).toBe('compact')
    expect(bodyFor({ w: 500, h: 900, ratio: 2 }, lcd, true)).toBe('full')
    // Under a dot a device pixel across, not even the LCD: it is shown as it can.
    expect(bodyFor({ w: 250, h: 900, ratio: 1 }, lcd, true)).toBe('lcd')
  })

  it('picks only a body that fits its room, whatever the pane, the display and the LCD', () => {
    // A pane 1300 by 322 once got the whole keyboard and lost its plate and its bottom row
    // to the clip: the body was chosen by one reckoning and laid out by another.
    const screens = [
      { width: 240, height: 48 },
      { width: 240, height: 32 },
      { width: 240, height: 64 },
      { width: 160, height: 144 },
    ]
    for (const screen of screens) {
      for (const ratio of [1, 1.25, 1.5, 2]) {
        for (let w = 200; w <= 1600; w += 70) {
          for (let h = 120; h <= 900; h += 11) {
            for (const plate of [true, false]) {
              const room = { w, h, ratio }
              const body = bodyFor(room, screen, plate)
              if (body === 'lcd') continue
              const fit = deviceFit(room, screen, body, plate)
              const height = caseHeight(body, fit.keyRow, fit.glass.h, plate)
              expect(height, JSON.stringify({ screen, room, plate, body })).toBeLessThanOrEqual(h)
              expect(fit.glass.w + 2 * (CASE.padX + CASE.border)).toBeLessThanOrEqual(fit.width)
              expect(fit.scale).toBeGreaterThanOrEqual(body === 'full' ? 2 : 1)
            }
          }
        }
      }
    }
  })

  it('keeps the case one body in a tall pane: its parts fit, the room left over and not stretched', () => {
    const screen = { width: 240, height: 48 }
    const short = deviceFit({ w: 900, h: 420, ratio: 1 }, screen, 'full', true)
    const tall = deviceFit({ w: 900, h: 1400, ratio: 1 }, screen, 'full', true)
    // The width decides once the height is plenty: a taller pane gives the same body.
    expect(tall).toEqual(deviceFit({ w: 900, h: 2000, ratio: 1 }, screen, 'full', true))
    expect(tall.scale).toBeGreaterThanOrEqual(short.scale)
    expect(caseHeight('full', tall.keyRow, tall.glass.h, true)).toBeLessThan(1400)
    // Never more than the room, and the dots never below one device pixel.
    expect(caseHeight('full', short.keyRow, short.glass.h, true)).toBeLessThanOrEqual(420)
    expect(
      deviceFit({ w: 300, h: 100, ratio: 2 }, screen, 'lcd', false).scale,
    ).toBeGreaterThanOrEqual(1)
    expect(tall.keyRow).toBeLessThanOrEqual(36)
  })

  it("lays the keys out as the mock did, every one of the machine's once, each row full", () => {
    const placed = FULL_ROWS.flatMap((row) => [...row.left, ...row.right].map((k) => k.id))
    expect(placed.filter((id) => id !== 'brk').sort()).toEqual(MACHINE_KEYS.map((k) => k.id).sort())
    for (const row of FULL_ROWS) {
      expect(row.left.reduce((n, k) => n + k.span, 0)).toBe(20)
      expect(row.right.reduce((n, k) => n + k.span, 0)).toBe(10)
    }
    expect(FULL_ROWS[0]?.left.map((k) => k.id)).toEqual([
      'brk',
      'mode',
      'cls',
      'ans',
      'kana',
      'ins',
      'del',
      'bs',
    ])
    expect(FULL_ROWS[4]?.left.map((k) => k.id)).toEqual(['shift', 'caps', ' ', 'enter'])
    expect(COMPACT_ROW).toEqual([
      'brk',
      'mode',
      'cls',
      'shift',
      'left',
      'up',
      'down',
      'right',
      'enter',
    ])
  })

  it('gives every skin but PLAIN and the Business ones the name plate', () => {
    expect(SKIN_IDS.filter((id) => !SKINS[id].body.plateShown)).toEqual([
      'plain',
      'business-light',
      'business-dark',
    ])
  })

  it("has PLAIN alone without a case, on a flat screen, in the theme's colours", () => {
    expect(SKIN_IDS.filter((id) => SKINS[id].body.bare)).toEqual(['plain'])
    expect(SKIN_IDS.filter((id) => SKINS[id].lcd.flat)).toEqual(['plain'])
    // Every colour of it is the theme's, or none: it changes with the theme.
    const colours = [...Object.values(SKINS.plain.body), ...Object.values(SKINS.plain.lcd)]
    for (const c of colours.filter((v) => typeof v === 'string' && v.length > 6)) {
      expect(c).toMatch(/^(var\(--|transparent$)/)
    }
  })

  it('reads its state with a default for anything strange', () => {
    expect(readElec16Pane(undefined)).toEqual({
      skin: 'elec',
      unit: undefined,
      seed: {},
      body: 'auto',
      panel: true,
      tab: 'core',
      ghost: true,
      contrast: 0,
      view: 'machine',
      codeFile: 'MAIN.TS',
      codeLevel: 2,
      playBody: 'auto',
      playSkin: 'graphite',
    })
    // PLAY-320's body and colours, each one of its own list.
    expect(readElec16Pane({ playBody: 'wide', playSkin: 'coral' })).toMatchObject({
      playBody: 'wide',
      playSkin: 'coral',
    })
    expect(readElec16Pane({ playBody: 'full', playSkin: 'night' })).toMatchObject({
      playBody: 'auto',
      playSkin: 'graphite',
    })
    // CODE's file is a .TS card name, its level 0 to 2.
    expect(readElec16Pane({ view: 'code', codeFile: 'GAME.TS', codeLevel: 0 })).toMatchObject({
      view: 'code',
      codeFile: 'GAME.TS',
      codeLevel: 0,
    })
    expect(readElec16Pane({ view: 'x', codeFile: '../A.TS', codeLevel: 3 })).toMatchObject({
      view: 'machine',
      codeFile: 'MAIN.TS',
      codeLevel: 2,
    })
    const odd = readElec16Pane({
      skin: 'gold',
      model: 'big',
      clock: 5,
      body: 1,
      contrast: 99,
      tab: 'x',
      unit: '../u1',
    })
    expect([odd.skin, odd.unit, odd.seed, odd.body, odd.contrast, odd.tab]).toEqual([
      'elec',
      undefined,
      {},
      'auto',
      7,
      'core',
    ])
    // A pane from before units: its clock and LCD seed its first unit.
    expect(
      readElec16Pane({ clock: 'max', model: 'pocket-64', skin: 'night', unit: 'u2' }),
    ).toMatchObject({
      seed: { clock: 'max', model: 'pocket-64' },
      unit: 'u2',
      skin: 'night',
    })
  })

  it('runs MAX as fast as the budget allows, and folds the panel where the LCD needs the room', () => {
    expect(hzOfClock('max')).toBe(Number.POSITIVE_INFINITY)
    expect(hzOfClock(32)).toBe(32_000_000)
    expect(panelShown(true, { w: 1000, h: 400 }, 240)).toBe(true)
    expect(panelShown(true, { w: 600, h: 400 }, 240)).toBe(false)
    expect(panelShown(false, { w: 2000, h: 400 }, 240)).toBe(false)
  })
})

describe('CORE and MEM', () => {
  it('read the code from the program counter, named by the labels', () => {
    const out = assemble('.org 0x8000\nstart:\nli a0, 5\nloop:\nj loop')
    const m = Elec16.boot(romImage(out))
    const reading = readCore(m, labelsOf({ start: 0x8000, loop: 0x8002 }))
    expect(reading.lines.slice(0, 2)).toEqual([
      expect.objectContaining({
        address: 0x8000,
        label: 'start',
        text: 'c.li a0, 5',
        current: true,
      }),
      expect.objectContaining({ address: 0x8002, label: 'loop', current: false }),
    ])
    expect(reading.regs).toHaveLength(16)
  })

  it('tell the parts of the address space apart', () => {
    expect([0x0100, 0x7000, 0x7c00, 0x8000, 0xc000, 0xe000, 0xf800, 0xff10].map(byteKind)).toEqual([
      'ram',
      'code',
      'ram',
      'rom',
      'bank',
      'vram',
      'none',
      'io',
    ])
  })
})

describe('the POWER lamp', () => {
  /** A colour's hue in degrees, from #rrggbb. */
  const hue = (hex: string): number => {
    const [r, g, b] = [1, 3, 5].map((k) => Number.parseInt(hex.slice(k, k + 2), 16) / 255) as [
      number,
      number,
      number,
    ]
    const max = Math.max(r, g, b)
    const d = max - Math.min(r, g, b)
    if (d === 0) return 0
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    return (h * 60 + 360) % 360
  }

  it('lit, reads as on in every skin: green to blue, never the red of a lamp gone off', () => {
    for (const skin of Object.values(SKINS)) {
      const led = skin.body.led
      if (led.startsWith('var(')) continue
      expect(hue(led), skin.id).toBeGreaterThanOrEqual(90)
      expect(hue(led), skin.id).toBeLessThanOrEqual(220)
    }
  })
})
