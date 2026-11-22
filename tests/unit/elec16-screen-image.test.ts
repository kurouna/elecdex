import { MODELS } from '@shared/elec16/map'
import { createState } from '@shared/elec16/state'
import { createVideoState } from '@shared/elec16/video'
import { describe, expect, it } from 'vitest'
import { FULL, strength } from '../../src/renderer/widgets/elec16/lcd-painter.js'
import { paintPlay } from '../../src/renderer/widgets/elec16/play-painter.js'
import {
  LCD_SCALE,
  lcdImage,
  PLAY_SCALE,
  playImage,
  type ScreenImage,
  screenImage,
} from '../../src/renderer/widgets/elec16/screen-image.js'

/**
 * The screen as a picture for COPY IMAGE and SAVE PNG (widgets/elec16/screen-image.ts): the
 * dots in the pane's LCD colours, as the LCD draws them (lcd-painter.ts), at whole pixels a dot
 * with the gaps between them, opaque; PLAY-320's picture as it is drawn, twice the size.
 */

const COLOURS = { ground: [200, 210, 180], dot: [20, 30, 40], shadow: [0, 0, 0] } as const
const colours = {
  ground: [...COLOURS.ground] as [number, number, number],
  dot: [...COLOURS.dot] as [number, number, number],
  shadow: [...COLOURS.shadow] as [number, number, number],
}

const GAPS = { gap: true, unlit: 0 }
const FLAT = { gap: false, unlit: 0 }

const at = (image: ScreenImage, x: number, y: number): number[] => {
  const k = (y * image.width + x) * 4
  return [...image.data.slice(k, k + 4)]
}

const mix = (alpha: number): number[] => [
  ...COLOURS.ground.map((g, i) => Math.round(g + ((COLOURS.dot[i] ?? 0) - g) * alpha)),
  255,
]

describe('the LCD as a picture', () => {
  const model = MODELS['pocket-48']
  const pixels = new Uint8Array(model.width * model.height)
  pixels[0] = 1

  it('is the screen at whole pixels a dot', () => {
    const image = lcdImage(pixels, model, colours, 8, GAPS)
    expect(image.width).toBe(model.width * LCD_SCALE)
    expect(image.height).toBe(model.height * LCD_SCALE)
    expect(image.data.length).toBe(image.width * image.height * 4)
  })

  it('draws a dot in the dot colour and a dot out on the ground, at the machine contrast', () => {
    const image = lcdImage(pixels, model, colours, 8, GAPS)
    expect(at(image, 0, 0)).toEqual(mix(strength(8)))
    expect(at(image, LCD_SCALE, 0)).toEqual(mix(0))
  })

  it('leaves the gap between dots on the ground, unless the screen is flat', () => {
    const gapped = lcdImage(pixels, model, colours, 8, GAPS)
    expect(at(gapped, LCD_SCALE - 1, 0)).toEqual(mix(0))
    expect(at(gapped, 0, LCD_SCALE - 1)).toEqual(mix(0))
    const flat = lcdImage(pixels, model, colours, 8, FLAT)
    expect(at(flat, LCD_SCALE - 1, LCD_SCALE - 1)).toEqual(mix(strength(8)))
  })

  it('shows dots that are out faintly above the machine contrast, as the LCD does', () => {
    const image = lcdImage(pixels, model, colours, 12, GAPS)
    expect(at(image, 0, 0)).toEqual(mix(strength(12)))
    expect(at(image, LCD_SCALE, 0)).toEqual(mix((12 - 8) * 0.025))
  })

  it("lays the skin's faint unlit dot under every dot, only between the gaps", () => {
    const unlit = 0.05
    const gapped = lcdImage(pixels, model, colours, 8, { gap: true, unlit })
    expect(at(gapped, LCD_SCALE, 0)).toEqual(mix(unlit))
    expect(at(gapped, LCD_SCALE - 1, 0)).toEqual(mix(0))
    expect(at(gapped, 0, 0)).toEqual(mix(1 - (1 - unlit) * (1 - strength(8))))
    const flat = lcdImage(pixels, model, colours, 8, { gap: false, unlit })
    expect(at(flat, LCD_SCALE, 0)).toEqual(mix(0))
  })

  it('draws the four shades of a two-plane screen', () => {
    const handheld = MODELS['handheld-160']
    const shades = new Uint8Array(handheld.width * handheld.height)
    shades.set([0, 1, 2, 3])
    const image = lcdImage(shades, handheld, colours, 8, GAPS)
    const level = (shade: number) => Math.round((shade * FULL) / 3) / FULL
    for (const shade of [0, 1, 2, 3])
      expect(at(image, shade * LCD_SCALE, 0)).toEqual(mix(level(shade) * strength(8)))
  })
})

describe("PLAY-320's screen as a picture", () => {
  it('is the picture as it is drawn, each dot two pixels each way', () => {
    const video = createVideoState()
    video.mem[0] = 0b0100_0000
    const drawn = new Uint8ClampedArray(320 * 288 * 4)
    paintPlay(video, false, drawn)
    const image = playImage(video, false)
    expect(image.width).toBe(320 * PLAY_SCALE)
    expect(image.height).toBe(288 * PLAY_SCALE)
    const first = [...drawn.slice(0, 4)]
    const second = [...drawn.slice(4, 8)]
    expect(at(image, 0, 0)).toEqual(first)
    expect(at(image, 1, 1)).toEqual(first)
    expect(at(image, 2, 0)).toEqual(second)
  })
})

describe('the picture of what a model shows', () => {
  const lit = (n: number) => {
    const p = new Uint8Array(n)
    p[0] = 1
    return p
  }

  it("draws an LCD at the machine's contrast and the pane's together", () => {
    const model = MODELS['pocket-48']
    const s = createState('pocket-48')
    s.lcd.contrast = 9
    const dots = lit(model.width * model.height)
    const image = screenImage(model, s, () => dots, colours, 3, GAPS)
    expect(at(image, 0, 0)).toEqual(mix(strength(12)))
    expect(image).toEqual(lcdImage(dots, model, colours, 12, GAPS))
  })

  it('draws an LCD that is out, or a machine that is off, blank, without reading its dots', () => {
    const model = MODELS['sci-128']
    let read = 0
    const pixels = () => {
      read++
      return lit(model.width * model.height)
    }
    const out = createState('sci-128')
    out.lcd.on = false
    expect(at(screenImage(model, out, pixels, colours, 0, GAPS), 0, 0)).toEqual(mix(0))
    const off = createState('sci-128')
    off.off = true
    expect(at(screenImage(model, off, pixels, colours, 0, GAPS), 0, 0)).toEqual(mix(0))
    expect(read).toBe(0)
  })

  it("draws PLAY-320 as its own picture, not in the LCD's colours", () => {
    const s = createState('play-320')
    const image = screenImage(MODELS['play-320'], s, () => new Uint8Array(0), colours, 0, GAPS)
    expect(image).toEqual(playImage(s.video, s.off))
  })
})
