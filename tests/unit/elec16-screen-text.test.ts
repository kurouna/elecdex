import { glyphColumns } from '@shared/elec16/font'
import { MODELS, type ModelId } from '@shared/elec16/map'
import { createState, type Elec16State } from '@shared/elec16/state'
import { BITMAP_ROW, VCTRL_MODE_SHIFT, VCTRL_ON, VIDEO_MODE } from '@shared/elec16/video'
import { describe, expect, it } from 'vitest'
import { copyText, screenLines } from '../../src/renderer/widgets/elec16/screen-text.js'

/**
 * The text a screen shows, read back through the font (widgets/elec16/screen-text.ts): what a
 * screen reader is told and what COPY TEXT puts on the clipboard, by the model's own reading -
 * character cells on the pocket models, any dot row on SCI-128, PLAY-320's bitmap.
 */

/** `text` set in the LCD's top row of cells, from column `col`. */
function lcdWith(model: ModelId, text: string, col = 0): Elec16State {
  const s = createState(model)
  ;[...text].forEach((ch, k) => {
    glyphColumns(ch.charCodeAt(0)).forEach((bits, x) => {
      s.vram[(col + k) * 6 + x] = bits
    })
  })
  return s
}

/** `text` drawn on PLAY-320's bitmap at the top left, in colour 1. */
function playWith(text: string): Elec16State {
  const s = createState('play-320')
  const mem = s.video?.mem ?? new Uint8Array(0)
  ;[...text].forEach((ch, k) => {
    glyphColumns(ch.charCodeAt(0)).forEach((bits, cx) => {
      const x = k * 6 + cx
      for (let y = 0; y < 8; y++) {
        const at = y * BITMAP_ROW + (x >> 2)
        if ((bits >> y) & 1) mem[at] = (mem[at] ?? 0) | (1 << (6 - (x & 3) * 2))
      }
    })
  })
  return s
}

describe('the text a screen shows', () => {
  it('reads a pocket model by its character cells', () => {
    const lines = screenLines(MODELS['pocket-48'], lcdWith('pocket-48', 'HELLO'))
    expect(lines).toHaveLength(6)
    expect(lines[0]?.startsWith('HELLO ')).toBe(true)
  })

  it('reads SCI-128 by its dot rows', () => {
    const lines = screenLines(MODELS['sci-128'], lcdWith('sci-128', '12+3'))
    expect(lines.map((l) => l.trim())).toContain('12+3')
  })

  it("reads PLAY-320's bitmap", () => {
    const lines = screenLines(MODELS['play-320'], playWith('GO'))
    expect(lines[0]).toBe('GO')
  })

  it('reads nothing from a screen that shows nothing: off, the LCD out, the tile engine', () => {
    const off = lcdWith('pocket-48', 'HI')
    off.off = true
    expect(screenLines(MODELS['pocket-48'], off)).toEqual([])
    const out = lcdWith('pocket-48', 'HI')
    out.lcd.on = false
    expect(screenLines(MODELS['pocket-48'], out)).toEqual([])
    const tiles = playWith('GO')
    if (tiles.video !== null) tiles.video.ctrl = VCTRL_ON | (VIDEO_MODE.tiles << VCTRL_MODE_SHIFT)
    expect(screenLines(MODELS['play-320'], tiles)).toEqual([])
  })
})

describe('the text COPY TEXT puts on the clipboard', () => {
  it('drops the spaces at the end of each line and the empty lines round the text', () => {
    expect(copyText(['', '  ', 'A = 1   ', '', 'B   ', '    ', ''])).toBe('A = 1\n\nB')
  })

  it('is empty for a screen with nothing on it', () => {
    expect(copyText(['   ', '', '      '])).toBe('')
    expect(copyText([])).toBe('')
  })

  it('keeps the spaces a line starts with, as the screen sets them', () => {
    expect(copyText(['  10 PRINT "HI"', ' 20 END'])).toBe('  10 PRINT "HI"\n 20 END')
  })
})
