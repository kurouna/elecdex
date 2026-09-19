import { describe, expect, it } from 'vitest'
import {
  buildXtermTheme,
  hsl,
  hslToHex,
  searchDecorations,
} from '../../src/renderer/widgets/terminal/xterm-theme.js'

const base = {
  hue: 183,
  saturation: 22,
  lightness: 74,
  foreground: '#aacfd1',
  background: '#05080d',
}

describe('hsl', () => {
  it('formats a colour', () => {
    expect(hsl(183, 22, 74)).toBe('hsl(183 22% 74%)')
  })

  it('formats a colour with alpha', () => {
    expect(hsl(183, 22, 74, 0.3)).toBe('hsl(183 22% 74% / 0.3)')
  })

  it('wraps the hue rather than clamping it', () => {
    expect(hsl(370, 50, 50)).toBe('hsl(10 50% 50%)')
    expect(hsl(-10, 50, 50)).toBe('hsl(350 50% 50%)')
  })

  it('clamps saturation and lightness into range', () => {
    expect(hsl(0, 150, -20)).toBe('hsl(0 100% 0%)')
  })
})

describe('buildXtermTheme', () => {
  it('passes the foreground and background through untouched', () => {
    const theme = buildXtermTheme(base)
    expect(theme.foreground).toBe('#aacfd1')
    expect(theme.background).toBe('#05080d')
  })

  it('derives the cursor from the accent', () => {
    expect(buildXtermTheme(base).cursor).toBe('hsl(183 22% 74%)')
  })

  it('provides all sixteen ANSI colours', () => {
    const theme = buildXtermTheme(base)
    const names = [
      'black',
      'red',
      'green',
      'yellow',
      'blue',
      'magenta',
      'cyan',
      'white',
      'brightBlack',
      'brightRed',
      'brightGreen',
      'brightYellow',
      'brightBlue',
      'brightMagenta',
      'brightCyan',
      'brightWhite',
    ] as const
    for (const name of names) {
      expect(theme[name], name).toMatch(/^hsl\(/)
    }
  })

  it('keeps the ANSI colours distinguishable from each other', () => {
    // The whole point of not fully adopting the accent: a terminal where red
    // and green are the same colour makes `git diff` unreadable.
    const theme = buildXtermTheme(base)
    const chromatic = [theme.red, theme.green, theme.yellow, theme.blue, theme.magenta, theme.cyan]
    expect(new Set(chromatic).size).toBe(chromatic.length)
  })

  it('makes each bright colour lighter than its normal counterpart', () => {
    const theme = buildXtermTheme(base)
    const lightnessOf = (colour: string): number =>
      Number.parseFloat(/hsl\(\S+ \S+ ([\d.]+)%/.exec(colour)?.[1] ?? '0')

    for (const [normal, bright] of [
      [theme.red, theme.brightRed],
      [theme.green, theme.brightGreen],
      [theme.blue, theme.brightBlue],
      [theme.cyan, theme.brightCyan],
    ] as const) {
      expect(lightnessOf(bright as string)).toBeGreaterThan(lightnessOf(normal as string))
    }
  })

  it('follows the theme hue, so a theme switch restyles the terminal', () => {
    const cyan = buildXtermTheme(base)
    const amber = buildXtermTheme({ ...base, hue: 35 })
    expect(amber.cursor).not.toBe(cyan.cursor)
    expect(amber.black).not.toBe(cyan.black)
  })

  it('omits selectionForeground so highlighting survives a selection', () => {
    expect('selectionForeground' in buildXtermTheme(base)).toBe(false)
  })
})

describe('hslToHex', () => {
  it('converts the corners of the colour wheel', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000')
    expect(hslToHex(120, 100, 50)).toBe('#00ff00')
    expect(hslToHex(240, 100, 50)).toBe('#0000ff')
  })

  it('converts greys, black and white', () => {
    expect(hslToHex(183, 0, 0)).toBe('#000000')
    expect(hslToHex(183, 0, 100)).toBe('#ffffff')
    expect(hslToHex(183, 0, 50)).toBe('#808080')
  })

  it('wraps the hue and clamps the rest, as hsl() does', () => {
    expect(hslToHex(360 + 120, 100, 50)).toBe('#00ff00')
    expect(hslToHex(-240, 100, 50)).toBe('#00ff00')
    expect(hslToHex(0, 500, 500)).toBe('#ffffff')
  })
})

describe('searchDecorations', () => {
  // The addon parses these itself instead of handing them to CSS, so an
  // hsl() string - which every other colour here is - would draw nothing.
  const HEX = /^#[0-9a-f]{6}$/

  it('gives every colour as #rrggbb', () => {
    for (const value of Object.values(searchDecorations(base, 'dark'))) {
      expect(value).toMatch(HEX)
    }
  })

  it('marks the active match apart from the rest', () => {
    const dark = searchDecorations(base, 'dark')
    expect(dark.activeMatchBackground).not.toBe(dark.matchBackground)
  })

  it('tints the ground on a light theme instead of darkening it', () => {
    const dark = searchDecorations(base, 'dark')
    const light = searchDecorations(base, 'light')
    const brightness = (hex: string): number =>
      Number.parseInt(hex.slice(1, 3), 16) +
      Number.parseInt(hex.slice(3, 5), 16) +
      Number.parseInt(hex.slice(5, 7), 16)
    expect(brightness(light.matchBackground as string)).toBeGreaterThan(
      brightness(dark.matchBackground as string),
    )
  })

  it('keeps a match visible on a near-monochrome theme', () => {
    // White and Phosphor carry almost no saturation; a match the same grey as
    // the ground would be no mark at all.
    const grey = searchDecorations({ ...base, saturation: 0 }, 'dark')
    const hex = grey.matchBackground as string
    const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((p) =>
      Number.parseInt(p, 16),
    ) as [number, number, number]
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeGreaterThan(8)
  })
})
