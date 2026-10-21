import { ELEC16_SKINS } from '@shared/elec16-units'
import { describe, expect, it } from 'vitest'
import { CAP_MARGIN, capScale, emOf, keyWidth } from '../../src/renderer/widgets/elec16/cap-fit.js'
import { faceFamily, faceStack } from '../../src/renderer/widgets/elec16/faces.js'
import { HALF_COLUMNS, KEY_GAP } from '../../src/renderer/widgets/elec16/layout.js'
import {
  board,
  deckImage,
  faceStyle,
  glassBoards,
} from '../../src/renderer/widgets/elec16/skin-art.js'
import { SKIN_IDS, SKINS, type SkinId } from '../../src/renderer/widgets/elec16/skins.js'

/**
 * The five skins of 2026-10-22 (docs/elec16.md section 7, docs/elec16-skins-mock): ALLOY,
 * GRAPHITE, NEO, MOCHI and GLASS - modelled in light, each in a face of its own - and the
 * eight before them left exactly as they were.
 */

const RELIEF: readonly SkinId[] = ['alloy', 'graphite', 'neo', 'mochi', 'glass']
const TODAY: readonly SkinId[] = [
  'elec',
  'plain',
  'tron',
  'business-light',
  'business-dark',
  'classic',
  'ivory',
  'night',
]

const linear = (c: number): number => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const luminance = (hex: string): number => {
  const n = Number.parseInt(hex.slice(1), 16)
  return 0.2126 * linear(n >> 16) + 0.7152 * linear((n >> 8) & 255) + 0.0722 * linear(n & 255)
}
const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

describe('the skins', () => {
  it('adds the five after the eight, in the settings and TUNE alike', () => {
    expect(ELEC16_SKINS.slice(-5)).toEqual(RELIEF)
    expect(SKIN_IDS).toEqual(ELEC16_SKINS)
    expect(RELIEF.map((id) => SKINS[id].label)).toEqual([
      'ALLOY',
      'GRAPHITE',
      'NEO',
      'MOCHI',
      'GLASS',
    ])
  })

  it('leaves the eight before them drawn as they were: no relief, material, deck or face of its own', () => {
    for (const id of TODAY) {
      const { body, lcd } = SKINS[id]
      expect(
        [
          body.relief,
          body.texture,
          body.deck,
          body.grille,
          body.oneFace,
          body.gloss,
          body.stripes.length,
        ],
        id,
      ).toEqual([false, 'none', null, 'none', false, false, 0])
      expect(
        [
          body.keyWeight,
          body.fnWeight,
          body.keyTrack,
          body.fnTrack,
          body.plateWeight,
          body.plateTrack,
        ],
        id,
      ).toEqual([600, 600, '0.04em', '0.1em', 700, '0.14em'])
      expect([body.padKey, body.padText, body.padLegend], id).toEqual([
        body.key,
        body.keyText,
        body.legend,
      ])
      expect([lcd.unlit, lcd.glare], id).toEqual([0, 0])
      expect(['ui', 'display'], id).toContain(body.font)
      expect(faceStyle(SKINS[id]), id).toBeNull()
    }
  })

  it('models the five in light, each in a face of its own, printed in it throughout', () => {
    for (const id of RELIEF) {
      const { body, lcd } = SKINS[id]
      expect(body.relief && body.oneFace && body.plateShown && !body.bare, id).toBe(true)
      expect(body.texture, id).not.toBe('none')
      expect(lcd.unlit, id).toBeGreaterThan(0)
      expect(lcd.unlit, id).toBeLessThanOrEqual(0.035)
    }
    expect(new Set(RELIEF.map((id) => SKINS[id].body.font)).size).toBe(5)
  })

  it('prints every small label of the fixed-colour ones at 4.5:1 or more, and the plate at 3:1', () => {
    for (const id of ['alloy', 'graphite', 'neo', 'mochi'] as const) {
      const { body: b, lcd } = SKINS[id]
      const small = {
        key: [b.keyText, b.key],
        fn: [b.fnText, b.fnKey],
        pad: [b.padText, b.padKey],
        brk: [b.brkText, b.brk],
        enter: [b.enterText, b.enter],
        legend: [b.legend, b.key],
        padLegend: [b.padLegend, b.padKey],
        print: [b.print, b.face],
        lcd: [lcd.dot, lcd.ground],
      } as const
      for (const [what, [fore, ground]] of Object.entries(small)) {
        expect(contrast(fore, ground), `${id} ${what}`).toBeGreaterThanOrEqual(4.5)
      }
      expect(contrast(b.plate, b.face), `${id} plate`).toBeGreaterThanOrEqual(3)
    }
  })

  it("has GLASS follow the theme: its glass, letters and accent are the theme's variables", () => {
    const b = SKINS.glass.body
    for (const c of [
      b.face,
      b.edge,
      b.plate,
      b.print,
      b.key,
      b.keyText,
      b.fnKey,
      b.fnText,
      b.brk,
      b.enter,
      b.enterText,
      b.legend,
      b.bezel,
      b.padKey,
      b.padText,
      b.padLegend,
    ]) {
      expect(c).toMatch(/var\(--/)
    }
    // ENTER's letters are the glass's own, its colour the accent's tint: readable whatever it is.
    expect(b.enter).toContain('var(--accent)')
    expect(b.enterText).toBe('var(--gl-text)')
  })

  it('keeps every lamp green, and none a brand colour', () => {
    expect(SKINS.glass.body.led).not.toBe('#3ddc84')
  })
})

describe('the materials', () => {
  it('are pictures of their own (data: URLs), made once per skin', () => {
    for (const id of RELIEF) {
      const style = faceStyle(SKINS[id])
      expect(style, id).not.toBeNull()
      expect(style?.image, id).not.toMatch(/https?:\/\//)
      expect(faceStyle(SKINS[id]), id).toBe(style)
    }
    expect(faceStyle(SKINS.alloy)?.image).toContain('data:image/svg+xml')
  })

  it('bake the noise on the colour (one opaque tile: the page blends nothing)', () => {
    const url =
      /data:image\/svg\+xml,([^"]+)/.exec(faceStyle(SKINS.graphite)?.image ?? '')?.[1] ?? ''
    const image = decodeURIComponent(url)
    expect(image).toContain(`flood-color='${SKINS.graphite.body.face}'`)
    expect(image).toContain("mode='soft-light'")
    expect(faceStyle(SKINS.graphite)?.image).not.toContain('blend-mode')
  })

  it('give a deck its own grain, and no deck to a skin without one', () => {
    expect(deckImage(SKINS.alloy)).toContain('data:image/svg+xml')
    expect(deckImage(SKINS.graphite)).toContain('data:image/svg+xml')
    expect(deckImage(SKINS.neo)).toBeNull()
    expect(deckImage(SKINS.classic)).toBeNull()
  })

  it("draw GLASS's board as one sheet for each mode, never a repeating tile", () => {
    const { dark, light } = glassBoards()
    expect(dark).not.toBe(light)
    expect(board(true)).toBe(dark)
    const layers = faceStyle(SKINS.glass)
    expect(layers?.image).toContain('var(--e16-board)')
    expect(layers?.repeat.split(', ').at(-1)).toBe('no-repeat')
    expect(decodeURIComponent(dark)).toContain("width='100%'")
  })
})

describe('the faces', () => {
  it("set a skin's face with the kana face that suits it, then the app's", () => {
    expect(faceStack('barlow')).toBe('"Barlow Condensed", "E16 Kana BIZ", var(--font-ui)')
    expect(faceStack('plex')).toContain('"E16 Kana Plex"')
    // M PLUS Rounded's own kana are its own family.
    expect(faceStack('mplus')).toBe('"M PLUS Rounded 1c", var(--font-ui)')
    expect(faceStack('ui')).toBe('var(--font-ui)')
    expect(faceFamily('interTight')).toBe('"Inter Tight"')
  })
})

describe('fitting a label to its key', () => {
  it('leaves a label that fits as it is', () => {
    expect(capScale(2, 0.04, 4, 10, 40, 0.8)).toBe(1)
  })

  it('narrows one that does not to the room inside its key, never below the floor', () => {
    const room = 33 - 2 * (CAP_MARGIN + 1)
    expect(capScale(2.9, 0, 4, 10, 33, 0.8)).toBeCloseTo(room / 29)
    expect(capScale(5, 0, 4, 10, 27, 0.8)).toBe(0.8)
    expect(capScale(5, 0, 4, 10, 27, 0.88)).toBe(0.88)
  })

  it('counts tracking after each letter', () => {
    expect(capScale(2, 0.1, 4, 10, 26, 0.5)).toBeLessThan(capScale(2, 0, 4, 10, 26, 0.5))
  })

  it('measures a key as its half-columns and the gaps between them', () => {
    const width = 900
    const half = (width - (HALF_COLUMNS - 1) * KEY_GAP) / HALF_COLUMNS
    expect(keyWidth(width, HALF_COLUMNS, KEY_GAP, 2)).toBeCloseTo(half * 2 + KEY_GAP)
    // Every row of the full keyboard adds up to the keyboard's width.
    expect(keyWidth(width, HALF_COLUMNS, KEY_GAP, HALF_COLUMNS)).toBeCloseTo(width)
  })

  it('reads an em length, and nothing else', () => {
    expect(emOf('0.04em')).toBe(0.04)
    expect(emOf('.1em')).toBe(0.1)
    expect(emOf('2px')).toBe(0)
  })
})
