import { COPY_LIMITS, isPngData } from '@shared/utility'
import { describe, expect, it } from 'vitest'
import { isScreenPng, screenPngName, withPngExtension } from '../../src/main/elec16/screen-png.js'

/**
 * SAVE PNG from an ELEC-16 pane (main/elec16/screen-png.ts): main takes only a PNG it can
 * check and a model it knows, and names the file itself from its own clock - the page never
 * names a file main writes.
 */

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const png = (size = 64) => {
  const data = new Uint8Array(size)
  data.set(PNG)
  return data
}

describe('a PNG from the page', () => {
  it('is taken by its signature, within the clipboard limit', () => {
    expect(isPngData(png())).toBe(true)
    expect(isPngData(png(COPY_LIMITS.png))).toBe(true)
    expect(isPngData(png(COPY_LIMITS.png + 1))).toBe(false)
    expect(isPngData(new Uint8Array(PNG))).toBe(false)
    expect(isPngData(new Uint8Array(64))).toBe(false)
    expect(isPngData([...png()])).toBe(false)
    expect(isPngData('png')).toBe(false)
  })

  it('comes with a model main knows', () => {
    expect(isScreenPng(png(), 'pocket-48')).toBe(true)
    expect(isScreenPng(png(), 'sci-128')).toBe(true)
    expect(isScreenPng(png(), 'pocket-99')).toBe(false)
    expect(isScreenPng(png(), '../x')).toBe(false)
    expect(isScreenPng(png(), 48)).toBe(false)
    expect(isScreenPng(new Uint8Array(64), 'pocket-48')).toBe(false)
  })
})

describe("a saved screen's name", () => {
  it('is the model and the local time, to the second', () => {
    const at = new Date(2026, 10, 22, 9, 5, 7)
    expect(screenPngName('pocket-48', at)).toBe('elec16-pocket-48-20261122-090507.png')
    expect(screenPngName('play-320', at)).toBe('elec16-play-320-20261122-090507.png')
  })
})

describe('the path a saved screen is written to', () => {
  it('ends in .png: put on when the save dialog left it off, or another was typed', () => {
    expect(withPngExtension('/home/me/shot')).toBe('/home/me/shot.png')
    expect(withPngExtension('C:\\shots\\a.png')).toBe('C:\\shots\\a.png')
    expect(withPngExtension('/home/me/shot.PNG')).toBe('/home/me/shot.PNG')
    expect(withPngExtension('/home/me/shot.jpg')).toBe('/home/me/shot.jpg.png')
    expect(withPngExtension('/home/me/v1.2')).toBe('/home/me/v1.2.png')
  })
})
