import { assemble, romImage } from '@shared/elec16/asm'
import { KANA_KEYS, keyCode } from '@shared/elec16/keys'
import { Elec16 } from '@shared/elec16/machine'
import { ANNUNCIATORS } from '@shared/elec16/state'
import { hzOfClock } from '@shared/elec16-units'
import { describe, expect, it } from 'vitest'
import { byteKind, labelsOf, readCore } from '../../src/renderer/widgets/elec16/core.js'
import { bodyFor } from '../../src/renderer/widgets/elec16/layout.js'
import { FULL, LcdPainter, strength } from '../../src/renderer/widgets/elec16/lcd-painter.js'
import { panelShown, readElec16Pane } from '../../src/renderer/widgets/elec16/pane-state.js'
import { kanaLit, type PcKey, pcKeyFate } from '../../src/renderer/widgets/elec16/pc-keys.js'

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
  const lcd = { w: 480, h: 96 }
  it('draws the whole keyboard only where it fits, else a row of keys, else the LCD', () => {
    expect(bodyFor({ w: 900, h: 500 }, lcd)).toBe('full')
    expect(bodyFor({ w: 400, h: 500 }, lcd)).toBe('compact')
    expect(bodyFor({ w: 900, h: 180 }, lcd)).toBe('compact')
    expect(bodyFor({ w: 900, h: 120 }, lcd)).toBe('lcd')
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
