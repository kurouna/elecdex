import {
  contrastRatio,
  parseRgb,
  QR_CAPACITY,
  QR_MIN_CONTRAST,
  type QrColours,
  qrColours,
  qrPayload,
  qrPixels,
  type Rgb,
  urlPayload,
  utf8Length,
  wifiPayload,
} from '@shared/qr'
import { BUILTIN_THEMES, type Theme } from '@shared/theme'
import { QR_ECC, readUtilityPane } from '@shared/utility'
import jsQR from 'jsqr'
import { describe, expect, it } from 'vitest'
import { qrBuild } from '../../src/renderer/lib/qr-code.js'

const BLACK_ON_WHITE: QrColours = { dark: [0, 0, 0], light: [255, 255, 255], themed: false }

/** Reads a code back as a phone would - and strictly: an inverted code is not tried. */
function scan(
  text: string,
  ecc: (typeof QR_ECC)[number] = 'M',
  colours = BLACK_ON_WHITE,
): string | null {
  const built = qrBuild(text, ecc)
  if (built.kind !== 'code') throw new Error(`no code: ${built.kind}`)
  const { width, data } = qrPixels(built.code, colours, 4)
  const found = jsQR(data, width, width, { inversionAttempts: 'dontInvert' })
  if (found === null) return null
  return new TextDecoder().decode(Uint8Array.from(found.binaryData))
}

describe('a code', () => {
  it('reads back as the text it was made from', () => {
    for (const text of ['hello', 'https://github.com/kurouna/elecdex', 'こんにちは、世界 🌏']) {
      expect(scan(text)).toBe(text)
    }
  })

  it('reads back at every error correction level', () => {
    for (const ecc of QR_ECC) expect(scan('elecdex utility', ecc)).toBe('elecdex utility')
  })

  it('holds exactly its capacity, and says when a text is over it', () => {
    const full = 'a'.repeat(QR_CAPACITY.H)
    const built = qrBuild(full, 'H')
    expect(built.kind).toBe('code')
    if (built.kind === 'code') expect(built.code.version).toBe(40)
    expect(qrBuild(`${full}a`, 'H')).toEqual({
      kind: 'over',
      bytes: QR_CAPACITY.H + 1,
      capacity: QR_CAPACITY.H,
    })
  })

  it('counts bytes, not characters', () => {
    expect(utf8Length('日本')).toBe(6)
    const built = qrBuild('日本', 'M')
    expect(built.kind === 'code' && built.code.bytes).toBe(6)
  })

  it('is nothing for an empty text', () => {
    expect(qrBuild('', 'M')).toEqual({ kind: 'empty' })
  })

  it('is the smallest version that holds the text', () => {
    const built = qrBuild('hi', 'L')
    expect(built.kind === 'code' && built.code.version).toBe(1)
    expect(built.kind === 'code' && built.code.size).toBe(21)
  })
})

describe('the Wi-Fi code', () => {
  it('is the format phones join from', () => {
    expect(wifiPayload({ ssid: 'home', auth: 'WPA', password: 'secret', hidden: false })).toBe(
      'WIFI:T:WPA;S:home;P:secret;;',
    )
    expect(wifiPayload({ ssid: 'cafe', auth: 'nopass', password: 'ignored', hidden: true })).toBe(
      'WIFI:T:nopass;S:cafe;H:true;;',
    )
  })

  it('escapes what the format uses to separate its fields', () => {
    const payload = wifiPayload({
      ssid: 'a;b,c:d"e\\f',
      auth: 'WPA',
      password: 'p;w',
      hidden: false,
    })
    expect(payload).toBe('WIFI:T:WPA;S:a\\;b\\,c\\:d\\"e\\\\f;P:p\\;w;;')
    expect(scan(payload)).toBe(payload)
  })

  it('is nothing without a network name', () => {
    expect(wifiPayload({ ssid: '', auth: 'WPA', password: 'x', hidden: false })).toBe('')
  })
})

describe('what a pane says', () => {
  it('follows its kind, with the password main unsealed for Wi-Fi', () => {
    const pane = readUtilityPane({ qrText: 'memo', qrUrl: 'example.com', wifiSsid: 'lab' })
    expect(qrPayload(pane, 'pw')).toBe('memo')
    expect(qrPayload({ ...pane, qrKind: 'url' }, 'pw')).toBe('https://example.com')
    expect(qrPayload({ ...pane, qrKind: 'wifi' }, 'pw')).toBe('WIFI:T:WPA;S:lab;P:pw;;')
  })

  it('adds https:// only to an address with no scheme', () => {
    expect(urlPayload('  example.com/a ')).toBe('https://example.com/a')
    expect(urlPayload('http://x.test')).toBe('http://x.test')
    expect(urlPayload('mailto:a@b.test')).toBe('mailto:a@b.test')
    expect(urlPayload('')).toBe('')
  })
})

/** A theme's colours as the page reads them: the ground, the accent and the text. */
function hsl(h: number, s: number, l: number): Rgb {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const f = (n: number): number => {
    const k = (n + h / 30) % 12
    return Math.round(255 * (l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
  }
  return [f(0), f(8), f(4)]
}

function themeColours(theme: Theme): { accent: Rgb; ground: Rgb; text: Rgb } {
  const accent = hsl(theme.accent.h, theme.accent.s, theme.accent.l)
  const ground = parseRgb(theme.surfaces.s1)
  const text = theme.text?.primary === undefined ? accent : parseRgb(theme.text.primary)
  if (ground === null || text === null) throw new Error(theme.id)
  return { accent, ground, text }
}

describe('the colours', () => {
  it('are the theme’s own, dark on light, and scan, for every built-in theme', () => {
    for (const theme of BUILTIN_THEMES) {
      const colours = qrColours(themeColours(theme))
      expect(colours.themed, theme.id).toBe(true)
      expect(contrastRatio(colours.dark, colours.light), theme.id).toBeGreaterThanOrEqual(
        QR_MIN_CONTRAST,
      )
      expect(scan('WIFI:T:WPA;S:lab;P:secret;;', 'M', colours), theme.id).toBe(
        'WIFI:T:WPA;S:lab;P:secret;;',
      )
    }
  })

  it('put the modules in the ground colour on a dark theme, and in the text on a light one', () => {
    const tron = BUILTIN_THEMES.find((t) => t.id === 'tron') as Theme
    const light = BUILTIN_THEMES.find((t) => t.id === 'business-light') as Theme
    expect(qrColours(themeColours(tron)).dark).toEqual(parseRgb(tron.surfaces.s1))
    expect(qrColours(themeColours(light)).dark).toEqual(parseRgb('#1a1a1a'))
  })

  it('fall back to black on white when a theme has no contrast to spare', () => {
    const grey: Rgb = [120, 120, 120]
    expect(qrColours({ accent: grey, ground: [110, 110, 110], text: grey })).toEqual(BLACK_ON_WHITE)
    expect(qrColours({ accent: null, ground: null, text: null })).toEqual(BLACK_ON_WHITE)
  })

  it('are read from what a canvas says a colour is', () => {
    expect(parseRgb('#05080d')).toEqual([5, 8, 13])
    expect(parseRgb('rgb(174, 207, 209)')).toEqual([174, 207, 209])
    expect(parseRgb('rgba(1, 2, 3, 0.5)')).toEqual([1, 2, 3])
    expect(parseRgb('hsl(0 0% 0%)')).toBeNull()
  })

  it('are never an inverted code: that one a strict reader does not scan', () => {
    const inverted: QrColours = { dark: [255, 255, 255], light: [0, 0, 0], themed: true }
    expect(scan('inverted', 'M', inverted)).toBeNull()
  })
})
