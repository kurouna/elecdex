import { describe, expect, it } from 'vitest'
import { dropsLeadingSpace, trimFontOn } from '../../src/renderer/lib/canvas-font'

/** A 2D context as Chromium 156.0.8078.80 has it: a font with a space before it is dropped. */
function strictContext() {
  class Ctx {
    #font = '10px sans-serif'
    get font(): string {
      return this.#font
    }
    set font(value: string) {
      if (/^\s/.test(value)) return
      this.#font = value
    }
  }
  return Ctx
}

/** As Chromium 156.0.8078.75 had it: the space is taken. */
function lenientContext() {
  class Ctx {
    #font = '10px sans-serif'
    get font(): string {
      return this.#font
    }
    set font(value: string) {
      this.#font = value.trim()
    }
  }
  return Ctx
}

describe('a canvas font with a space before it', () => {
  it('is found dropped where the browser drops it, and only there', () => {
    const Strict = strictContext()
    const Lenient = lenientContext()
    expect(dropsLeadingSpace(() => new Strict())).toBe(true)
    expect(dropsLeadingSpace(() => new Lenient())).toBe(false)
    expect(dropsLeadingSpace(() => null)).toBe(false)
  })

  it('is taken as xterm means it once mended: its glyphs in the terminal font, not 10px sans-serif', () => {
    const Strict = strictContext()
    const before = new Strict()
    before.font = ' normal 13px "JetBrains Mono Variable", monospace'
    expect(before.font).toBe('10px sans-serif')
    trimFontOn(Strict.prototype)
    const after = new Strict()
    after.font = ' normal 13px "JetBrains Mono Variable", monospace'
    expect(after.font).toBe('normal 13px "JetBrains Mono Variable", monospace')
    // A font without the space is as it was.
    after.font = 'bold 12px monospace'
    expect(after.font).toBe('bold 12px monospace')
  })

  it('mends a prototype once, however often it is asked', () => {
    const Strict = strictContext()
    trimFontOn(Strict.prototype)
    const once = Object.getOwnPropertyDescriptor(Strict.prototype, 'font')?.set
    trimFontOn(Strict.prototype)
    expect(Object.getOwnPropertyDescriptor(Strict.prototype, 'font')?.set).toBe(once)
  })
})
