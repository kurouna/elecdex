import { applySettingsPatch, defaultSettings } from '@shared/settings'
import { BUILTIN_THEMES, type Theme } from '@shared/theme'
import {
  colorSchemeCss,
  EXTERNAL_LIMITS,
  externalPage,
  hostMatches,
  hslToHex,
  loadFailure,
  mayOpenOutside,
  navigationVerdict,
  pageToKeep,
  pageToReopen,
  paneTint,
  parseAddress,
  passesThrough,
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
  it('are the browser, YouTube (twice) and X, each a widget of its own', () => {
    expect(WEB_PRESETS.map(webWidgetId)).toEqual([
      'web.browser',
      'web.youtube',
      'web.youtubetv',
      'web.x',
    ])
  })

  it('offers the television pane rather than the plain YouTube one, which still resolves', () => {
    // Only the television pane can be signed in, so it is the one in the picker; a layout
    // saved with the plain one still opens it.
    expect(WEB_PRESETS.filter((p) => p.unlisted === true).map((p) => p.id)).toEqual(['youtube'])
    expect(presetOfWidget('web.youtube')?.id).toBe('youtube')
  })

  it("tells only YouTube's television pane that it is a television", () => {
    const televisions = WEB_PRESETS.filter((p) => p.userAgent !== undefined)
    expect(televisions.map((p) => p.id)).toEqual(['youtubetv'])
    // A television interface is served by the user agent; nothing else is claimed.
    expect(televisions[0]?.userAgent).toMatch(/TV Safari/)
    expect(televisions[0]?.userAgent).not.toMatch(/Electron|elecdex/)
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

describe('pageToKeep', () => {
  it('keeps a page as it is, a routing fragment included', () => {
    for (const page of [
      'https://www.youtube.com/watch?v=1&t=30',
      'https://www.youtube.com/tv#/watch?v=abc',
      'https://x.com/home',
    ]) {
      expect(pageToKeep(page)).toBe(page)
    }
  })

  it('keeps a sign-in callback only by its path, never its tokens', () => {
    // Found in review: the last page went into layout.json as it was, a token in its fragment.
    expect(pageToKeep('https://x.com/i/callback#access_token=abc&state=1')).toBe(
      'https://x.com/i/callback',
    )
    expect(pageToKeep('https://accounts.google.com/o/oauth2?code=4/xyz&scope=a')).toBe(
      'https://accounts.google.com/o/oauth2',
    )
    expect(pageToKeep('https://example.com/#/cb?id_token=e30')).toBe('https://example.com/')
  })

  it('takes the page kept of the one a view is on as that page, not another to go to', () => {
    const on = 'https://x.com/i/callback?code=1'
    expect(pageToReopen(preset('x'), on, pageToKeep(on))).toBeNull()
  })
})

describe('passing a link on', () => {
  it('keeps no page of t.co, which only hands the link on', () => {
    // Found in review: the t.co page was saved, and every start opened its link again.
    expect(pageToKeep('https://t.co/AbCdEf123')).toBeNull()
    expect(passesThrough('https://t.co/AbCdEf123')).toBe(true)
    expect(passesThrough('https://x.com/home')).toBe(false)
    expect(passesThrough('https://not-t.co/')).toBe(false)
  })
})

describe('externalPage', () => {
  it("gives a desktop browser a television video as the video's own page", () => {
    // Found in review: "open in your browser" handed out the television interface.
    expect(externalPage('https://www.youtube.com/tv#/watch?v=dQw4w9WgXcQ&list=a')).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
  })

  it('leaves every other page as it is', () => {
    for (const page of [
      'https://www.youtube.com/tv',
      'https://www.youtube.com/tv#/browse',
      'https://www.youtube.com/watch?v=1',
      'https://x.com/home',
      'https://www.youtube.com/tv#/watch?v=<script>',
    ]) {
      expect(externalPage(page)).toBe(page)
    }
  })
})

describe('loadFailure', () => {
  it('says the common failures in words, and keeps the code beside them', () => {
    expect(loadFailure(-105, 'ERR_NAME_NOT_RESOLVED')).toBe(
      'no such site: the name did not resolve (ERR_NAME_NOT_RESOLVED)',
    )
    expect(loadFailure(-999, 'ERR_SOMETHING_ELSE')).toBe('ERR_SOMETHING_ELSE')
    expect(loadFailure(-999, '')).toBe('error -999')
  })
})

describe('pageToReopen', () => {
  const youtube = () => preset('youtube')
  const at = 'https://www.youtube.com/watch?v=1'

  it('leaves a view on the page its remounting pane saved: a move', () => {
    expect(pageToReopen(youtube(), at, at)).toBeNull()
  })

  it("sends it to another saved page: another layout's pane of that id", () => {
    const other = 'https://www.youtube.com/watch?v=2'
    expect(pageToReopen(youtube(), at, other)).toBe(other)
  })

  it('leaves it where it is with no page saved, or one off the preset', () => {
    expect(pageToReopen(youtube(), at, null)).toBeNull()
    expect(pageToReopen(youtube(), at, '')).toBeNull()
    expect(pageToReopen(youtube(), at, 'https://example.com/')).toBeNull()
    expect(pageToReopen(youtube(), at, 'file:///C:/Windows/win.ini')).toBeNull()
  })
})

describe('navigationVerdict', () => {
  it('keeps a preset to its hosts and sends the rest to the browser', () => {
    const youtube = preset('youtube')
    expect(navigationVerdict(youtube, 'https://www.youtube.com/watch?v=1')).toBe('allow')
    expect(navigationVerdict(youtube, 'https://accounts.google.com/signin')).toBe('allow')
    expect(navigationVerdict(youtube, 'https://consent.google.com/ml?continue=x')).toBe('allow')
    // Found in review: the whole of google.com was the pane's, Gmail and Drive included.
    for (const elsewhere of [
      'https://mail.google.com/',
      'https://drive.google.com/',
      'https://www.google.com/search?q=a',
    ]) {
      expect(navigationVerdict(youtube, elsewhere)).toBe('external')
      expect(navigationVerdict(preset('youtubetv'), elsewhere)).toBe('external')
    }
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

  it("opens a sized window on the site's own hosts in the pane, not as a second X", () => {
    // Found in review: X's intents and share pages opened as a stray window with no toolbar.
    expect(windowVerdict(x, 'https://x.com/intent/post?text=a', 'new-window')).toBe('same-pane')
    expect(windowVerdict(x, 'https://appleid.apple.com/auth/authorize', 'new-window')).toBe('popup')
    expect(windowVerdict(preset('browser'), 'https://example.com/login', 'new-window')).toBe(
      'popup',
    )
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

describe('a page sending the browser somewhere (issue 31)', () => {
  const { afterInputMs, gapMs } = EXTERNAL_LIMITS
  const NOW = 1_000_000

  it('may only just after the person touched the pane', () => {
    // A page's script sent the default browser wherever it liked, as often as it liked.
    expect(mayOpenOutside({ inputAt: null, openedAt: null }, NOW)).toBe(false)
    expect(mayOpenOutside({ inputAt: NOW - 100, openedAt: null }, NOW)).toBe(true)
    // A click through a link that redirects off the site: still the person's.
    expect(mayOpenOutside({ inputAt: NOW - afterInputMs + 1, openedAt: null }, NOW)).toBe(true)
    expect(mayOpenOutside({ inputAt: NOW - afterInputMs - 1, openedAt: null }, NOW)).toBe(false)
  })

  it('once in a while, however much the person does', () => {
    expect(mayOpenOutside({ inputAt: NOW, openedAt: NOW - gapMs + 1 }, NOW)).toBe(false)
    expect(mayOpenOutside({ inputAt: NOW, openedAt: NOW - gapMs - 1 }, NOW)).toBe(true)
  })

  it('keeps its limits a person would not notice', () => {
    expect(afterInputMs).toBeGreaterThanOrEqual(3000)
    expect(gapMs).toBeLessThanOrEqual(2000)
  })
})
