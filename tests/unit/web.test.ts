import { applySettingsPatch, defaultSettings } from '@shared/settings'
import { BUILTIN_THEMES, type Theme } from '@shared/theme'
import {
  colorSchemeCss,
  hostMatches,
  hslToHex,
  navigationVerdict,
  paneTint,
  parseAddress,
  presetOfWidget,
  tintCss,
  WEB_PRESETS,
  WebAppearanceSchema,
  WebCommandSchema,
  type WebPreset,
  WebRectSchema,
  webAppearance,
  webWidgetId,
  windowVerdict,
  withHomes,
} from '@shared/web'
import { describe, expect, it } from 'vitest'

const preset = (id: string): WebPreset => {
  const found = WEB_PRESETS.find((p) => p.id === id)
  if (found === undefined) throw new Error(`no preset ${id}`)
  return found
}
const theme = (id: string): Theme => {
  const found = BUILTIN_THEMES.find((t) => t.id === id)
  if (found === undefined) throw new Error(`no theme ${id}`)
  return found
}

describe('web presets', () => {
  it('are the browser, YouTube and X, each a widget of its own', () => {
    expect(WEB_PRESETS.map(webWidgetId)).toEqual(['web.browser', 'web.youtube', 'web.x'])
  })

  it('have unique, lowercase ids, http(s) homes and lowercase hosts', () => {
    const ids = WEB_PRESETS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of WEB_PRESETS) {
      expect(p.id).toMatch(/^[a-z0-9]+$/)
      if (p.home !== null) {
        expect(p.home).toMatch(/^https?:\/\//)
        // The home itself must stay in the pane.
        expect(navigationVerdict(p, p.home)).toBe('allow')
      }
      for (const host of p.hosts ?? []) expect(host).toBe(host.toLowerCase())
    }
  })

  it('only the general browser has no home and no host list', () => {
    expect(WEB_PRESETS.filter((p) => p.home === null).map((p) => p.id)).toEqual(['browser'])
    expect(WEB_PRESETS.filter((p) => p.hosts === null).map((p) => p.id)).toEqual(['browser'])
  })

  it('are found from their widget id, and nothing else is', () => {
    expect(presetOfWidget('web.youtube')?.id).toBe('youtube')
    expect(presetOfWidget('web.x')?.id).toBe('x')
    expect(presetOfWidget('web.nope')).toBeNull()
    expect(presetOfWidget('youtube')).toBeNull()
    expect(presetOfWidget('plugin:web.x')).toBeNull()
  })
})

describe('withHomes', () => {
  it('points a preset at a stub and keeps only the stub host', () => {
    const presets = withHomes(
      WEB_PRESETS,
      'youtube=http://127.0.0.1:5000/yt/, x = http://127.0.0.1:9/',
    )
    const youtube = presets.find((p) => p.id === 'youtube')
    expect(youtube?.home).toBe('http://127.0.0.1:5000/yt/')
    expect(youtube?.hosts).toEqual(['127.0.0.1'])
    expect(presets.find((p) => p.id === 'x')?.home).toBe('http://127.0.0.1:9/')
  })

  it('leaves the browser, unknown presets and bad entries alone', () => {
    const presets = withHomes(
      WEB_PRESETS,
      'browser=http://127.0.0.1/,nope=http://a.test/,youtube=file:///etc/passwd,x,=http://b.test/',
    )
    expect(presets).toEqual(WEB_PRESETS)
    expect(withHomes(WEB_PRESETS, undefined)).toEqual(WEB_PRESETS)
  })
})

describe('hostMatches', () => {
  it('matches the host and its subdomains only', () => {
    expect(hostMatches('youtube.com', 'youtube.com')).toBe(true)
    expect(hostMatches('www.YouTube.com', 'youtube.com')).toBe(true)
    expect(hostMatches('m.youtube.com', 'youtube.com')).toBe(true)
    expect(hostMatches('notyoutube.com', 'youtube.com')).toBe(false)
    expect(hostMatches('youtube.com.evil.test', 'youtube.com')).toBe(false)
  })
})

describe('navigationVerdict', () => {
  it('keeps a preset to its hosts and sends the rest to the browser', () => {
    const youtube = preset('youtube')
    expect(navigationVerdict(youtube, 'https://www.youtube.com/watch?v=1')).toBe('allow')
    expect(navigationVerdict(youtube, 'https://accounts.google.com/signin')).toBe('allow')
    expect(navigationVerdict(youtube, 'https://example.com/')).toBe('external')
    expect(navigationVerdict(preset('x'), 'https://t.co/abc')).toBe('allow')
    expect(navigationVerdict(preset('x'), 'https://www.youtube.com/')).toBe('external')
  })

  it('lets the browser go to any http(s) page', () => {
    expect(navigationVerdict(preset('browser'), 'http://intranet.test:8080/')).toBe('allow')
  })

  it('never opens another scheme, whatever the preset', () => {
    for (const p of WEB_PRESETS) {
      for (const url of [
        'file:///C:/Windows/win.ini',
        'javascript:alert(1)',
        'chrome://settings',
        'devtools://devtools/bundled/inspector.html',
        'data:text/html,<p>',
        'mailto:a@b.test',
        'not a url',
      ]) {
        expect(navigationVerdict(p, url)).toBe('block')
      }
      expect(navigationVerdict(p, 'about:blank')).toBe('allow')
    }
  })
})

describe('windowVerdict', () => {
  const x = preset('x')

  it('opens a sign-in popup on a preset host as a window', () => {
    expect(windowVerdict(x, 'https://accounts.google.com/o/oauth2', 'new-window')).toBe('popup')
  })

  it('opens other links on the hosts in the pane itself', () => {
    expect(windowVerdict(x, 'https://x.com/someone', 'foreground-tab')).toBe('same-pane')
    expect(windowVerdict(preset('browser'), 'https://example.com/', 'background-tab')).toBe(
      'same-pane',
    )
  })

  it('sends other hosts to the browser, and drops other schemes and blank windows', () => {
    expect(windowVerdict(x, 'https://example.com/', 'new-window')).toBe('external')
    expect(windowVerdict(x, 'file:///etc/passwd', 'foreground-tab')).toBe('block')
    expect(windowVerdict(x, 'about:blank', 'new-window')).toBe('block')
  })
})

describe('parseAddress', () => {
  it('takes http(s) URLs as typed and bare hosts as https', () => {
    expect(parseAddress('https://example.com/a?b')).toBe('https://example.com/a?b')
    expect(parseAddress(' http://127.0.0.1:8080/x ')).toBe('http://127.0.0.1:8080/x')
    expect(parseAddress('example.com')).toBe('https://example.com/')
    expect(parseAddress('example.com/path')).toBe('https://example.com/path')
    expect(parseAddress('localhost:3000')).toBe('https://localhost:3000/')
    expect(parseAddress('localhost')).toBe('https://localhost/')
  })

  it('refuses other schemes, searches and nonsense', () => {
    for (const input of [
      '',
      '   ',
      'file:///C:/Windows',
      'ftp://example.com/',
      'javascript:alert(1)',
      'javascript:alert(1).x',
      'chrome://settings',
      'cats',
      'two words.com',
      'data:text/html,a.b',
    ]) {
      expect(parseAddress(input), input).toBeNull()
    }
  })
})

describe('appearance', () => {
  it('converts HSL accents to hex', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000')
    expect(hslToHex(120, 100, 50)).toBe('#00ff00')
    expect(hslToHex(240, 100, 50)).toBe('#0000ff')
    expect(hslToHex(0, 0, 100)).toBe('#ffffff')
    expect(hslToHex(200, 0, 0)).toBe('#000000')
  })

  it("offers an SF theme's accent, on its ground, in the dark scheme", () => {
    const tron = theme('tron')
    const look = webAppearance(tron, true)
    expect(look).toEqual({
      accent: hslToHex(tron.accent.h, tron.accent.s, tron.accent.l),
      tint: true,
      dark: true,
      background: tron.surfaces.s0,
    })
    expect(WebAppearanceSchema.safeParse(look).success).toBe(true)
  })

  it('offers no colour in the Business themes, and asks for light pages in the light one', () => {
    expect(webAppearance(theme('business-dark'), true)).toMatchObject({ accent: null, dark: true })
    expect(webAppearance(theme('business-light'), true)).toMatchObject({
      accent: null,
      dark: false,
    })
  })

  it('draws a pane in its own choice, else the setting, and never where there is no colour', () => {
    const on = webAppearance(theme('tron'), true)
    const off = webAppearance(theme('tron'), false)
    const business = webAppearance(theme('business-dark'), true)
    expect(paneTint(on, null)).toBe(on.accent)
    expect(paneTint(off, null)).toBeNull()
    // The pane's own switch wins either way.
    expect(paneTint(off, true)).toBe(off.accent)
    expect(paneTint(on, false)).toBeNull()
    expect(paneTint(business, true)).toBeNull()
  })

  it('tells a page which scheme its own colours should follow, without overriding it', () => {
    // A view sits on the theme's ground, so a page that declares no colours of its own
    // must not be left with the light scheme's black text on it.
    expect(colorSchemeCss(true)).toBe(':root { color-scheme: dark; }')
    expect(colorSchemeCss(false)).toBe(':root { color-scheme: light; }')
    // A page that declares a scheme of its own keeps it: nothing here is !important.
    expect(colorSchemeCss(true)).not.toContain('!important')
  })

  it('draws a page as its brightness times the tint', () => {
    const css = tintCss('#00ffff')
    expect(css).toMatch(/^html \{ filter: url\("data:image\/svg\+xml,[^"]+#t"\) !important; \}$/)
    const svg = decodeURIComponent(css.slice(css.indexOf(',') + 1, css.lastIndexOf('#t')))
    const values = svg
      .match(/values='([^']+)'/)?.[1]
      ?.split(' ')
      .map(Number)
    // Red gets nothing; green and blue get the luma of the pixel; alpha is kept.
    expect(values).toEqual([
      0, 0, 0, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0, 0, 0, 1, 0,
    ])
    // Nothing in the CSS can close the string or the rule early.
    expect(css.slice(0, -4)).not.toMatch(/[;}]\s*\S/)
  })
})

describe('inputs from the page', () => {
  it('accept only whole-pixel, sized rectangles', () => {
    expect(WebRectSchema.safeParse({ x: 0, y: 30, width: 100, height: 50 }).success).toBe(true)
    expect(WebRectSchema.safeParse({ x: 0, y: 0, width: 0, height: 50 }).success).toBe(false)
    expect(WebRectSchema.safeParse({ x: 0.5, y: 0, width: 1, height: 1 }).success).toBe(false)
    expect(WebRectSchema.safeParse({ x: 0, y: 0, width: 1e9, height: 1 }).success).toBe(false)
  })

  it('accept only known commands', () => {
    expect(WebCommandSchema.safeParse({ t: 'back' }).success).toBe(true)
    expect(WebCommandSchema.safeParse({ t: 'address', input: 'example.com' }).success).toBe(true)
    expect(WebCommandSchema.safeParse({ t: 'tint', on: false }).success).toBe(true)
    expect(WebCommandSchema.safeParse({ t: 'tint', on: null }).success).toBe(true)
    expect(WebCommandSchema.safeParse({ t: 'tint', on: 'yes' }).success).toBe(false)
    expect(WebCommandSchema.safeParse({ t: 'address' }).success).toBe(false)
    expect(WebCommandSchema.safeParse({ t: 'eval', code: '1' }).success).toBe(false)
    expect(
      WebAppearanceSchema.safeParse({
        accent: 'red',
        tint: true,
        dark: true,
        background: '#000000',
      }).success,
    ).toBe(false)
  })
})

describe('settings', () => {
  it('leave web pages in their own colours until asked, and a patch turns the tint on', () => {
    expect(defaultSettings().web).toEqual({ tint: false })
    expect(applySettingsPatch(defaultSettings(), { web: { tint: true } })?.web).toEqual({
      tint: true,
    })
    expect(applySettingsPatch(defaultSettings(), { web: { tint: 'no' } })).toBeNull()
  })
})
