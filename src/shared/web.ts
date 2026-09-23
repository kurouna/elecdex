import { z } from 'zod'
import type { Theme } from './theme.js'
import { HEX_COLOUR } from './validate.js'

/**
 * Web panes: a page in a pane, shown by a WebContentsView that main owns
 * (docs/architecture.md section 5.4).
 *
 * One widget with presets rather than a widget per site: a preset is data - where
 * the pane starts and which hosts stay in it - so adding a site is one entry in
 * WEB_PRESETS. The renderer registers a widget per preset and main checks every
 * navigation against the same entry.
 */

export interface WebPreset {
  /** The widget is `web.<id>`. Lowercase letters and digits. */
  id: string
  /** The pane's title. */
  title: string
  /** One line for the add-pane picker. */
  description: string
  /** Where the pane starts; null for the general browser, which starts empty with an address bar. */
  home: string | null
  /**
   * Hosts (with their subdomains) whose pages open in the pane; null for any http(s)
   * page. Anything else goes to the default browser. Sign-in pages belong here too.
   */
  hosts: readonly string[] | null
  /**
   * What the pane tells the site it is, where the site serves a different interface to
   * a television. Left out, the pages are served the browser's own user agent.
   */
  userAgent?: string
  /**
   * Kept out of the add-pane picker, while panes and links that name it still work: the
   * plain YouTube pane cannot be signed in (Google refuses an embedded browser), so the
   * television one is the one to add. A layout saved with it, and a YouTube link opened
   * from another pane, still land here.
   */
  unlisted?: boolean
}

/**
 * A television, for YouTube's living-room interface. Google refuses to sign in from a
 * browser it does not know - an embedded one above all - so a YouTube pane can only be
 * signed out; its television interface instead signs in the way a TV does, with a code
 * entered on a phone (measured 2026-09-18: youtube.com/tv shows the QR code and pairing
 * code with this user agent). That is Google's own flow for devices, not a way around
 * the check.
 */
const TELEVISION =
  'Mozilla/5.0 (Linux; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/6.0 TV Safari/537.36'

export const WEB_PRESETS: readonly WebPreset[] = [
  {
    id: 'browser',
    title: 'browser',
    description:
      'A web page in a pane, with an address bar. Shares sign-ins with the YouTube and X panes.',
    home: null,
    hosts: null,
  },
  {
    id: 'youtube',
    title: 'youtube',
    description: 'YouTube in a pane. Other sites open in your browser.',
    home: 'https://www.youtube.com/',
    hosts: ['youtube.com', 'youtu.be', 'google.com'],
    // The television pane is offered instead: only that one can be signed in.
    unlisted: true,
  },
  {
    id: 'youtubetv',
    title: 'youtube (tv)',
    description:
      "YouTube's television interface: the remote-control layout, and the only YouTube pane that can be signed in - with a code entered on a phone.",
    home: 'https://www.youtube.com/tv',
    hosts: ['youtube.com', 'youtu.be', 'google.com'],
    userAgent: TELEVISION,
  },
  {
    id: 'x',
    title: 'x',
    description: 'X (Twitter) in a pane. Links to other sites open in your browser.',
    home: 'https://x.com/home',
    // t.co is X's link shortener: it redirects, and the redirect is checked in turn.
    hosts: ['x.com', 'twitter.com', 't.co', 'accounts.google.com', 'appleid.apple.com'],
  },
]

/** The widget id prefix; a pane's widget is `web.<preset id>`. */
export const WEB_WIDGET_PREFIX = 'web.'

export const webWidgetId = (preset: WebPreset): string => `${WEB_WIDGET_PREFIX}${preset.id}`

/** The preset a widget id names, or null. */
export function presetOfWidget(
  widget: string,
  presets: readonly WebPreset[] = WEB_PRESETS,
): WebPreset | null {
  if (!widget.startsWith(WEB_WIDGET_PREFIX)) return null
  const id = widget.slice(WEB_WIDGET_PREFIX.length)
  return presets.find((p) => p.id === id) ?? null
}

/**
 * Presets with their homes replaced, for tests: `youtube=http://127.0.0.1:5000/yt/,x=...`
 * (ELECDEX_WEB_HOMES). A replaced preset keeps only its new home's host, so a stub
 * server stands in for the site without any request leaving the machine. Entries
 * that do not parse are ignored.
 */
export function withHomes(presets: readonly WebPreset[], spec: string | undefined): WebPreset[] {
  const homes = new Map<string, URL>()
  for (const part of (spec ?? '').split(',')) {
    const at = part.indexOf('=')
    if (at <= 0) continue
    const url = httpUrl(part.slice(at + 1).trim())
    if (url !== null) homes.set(part.slice(0, at).trim(), url)
  }
  return presets.map((preset) => {
    const home = homes.get(preset.id)
    if (home === undefined || preset.home === null) return preset
    return { ...preset, home: home.toString(), hosts: [home.hostname] }
  })
}

/** An http(s) URL, or null for anything else. */
export function httpUrl(raw: string): URL | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
}

/** Whether `hostname` is `host` or one of its subdomains. */
export function hostMatches(hostname: string, host: string): boolean {
  const name = hostname.toLowerCase()
  return name === host || name.endsWith(`.${host}`)
}

/**
 * What to do with a page a pane is about to show: open it there, hand it to the
 * default browser, or drop it (a scheme a web pane never opens).
 */
export type WebVerdict = 'allow' | 'external' | 'block'

export function navigationVerdict(preset: WebPreset, raw: string): WebVerdict {
  if (raw === 'about:blank') return 'allow'
  const url = httpUrl(raw)
  if (url === null) return 'block'
  if (preset.hosts === null) return 'allow'
  return preset.hosts.some((host) => hostMatches(url.hostname, host)) ? 'allow' : 'external'
}

/**
 * A new window a page asks for: a sign-in popup (window.open with a size, which
 * Chromium reports as 'new-window') on a host of the preset opens as a small window
 * of its own, since the page waits for it to report back; any other link on such
 * a host opens in the pane itself, which has no tabs.
 */
export type WindowVerdict = 'popup' | 'same-pane' | 'external' | 'block'

export function windowVerdict(preset: WebPreset, raw: string, disposition: string): WindowVerdict {
  const verdict = navigationVerdict(preset, raw)
  if (verdict !== 'allow') return verdict
  if (raw === 'about:blank') return 'block'
  return disposition === 'new-window' ? 'popup' : 'same-pane'
}

/**
 * What the address bar's text means: an http(s) URL as typed, or a bare host
 * ("example.com", "localhost:8080") taken as https. Null for anything else,
 * which the pane reports rather than guessing a search.
 */
export function parseAddress(input: string): string | null {
  const text = input.trim()
  if (text === '' || /\s/.test(text)) return null
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) return httpUrl(text)?.toString() ?? null
  if (!/^[^/?#]+\.[^/?#]+|^localhost(:\d+)?([/?#]|$)/i.test(text)) return null
  return httpUrl(`https://${text}`)?.toString() ?? null
}

export const HexColor = z.string().regex(HEX_COLOUR)

/** How web pages are drawn, from the theme and settings; applied to every web pane. */
export const WebAppearanceSchema = z.object({
  /**
   * The colour pages can be tinted in, or null for a theme that shows sites in their
   * own colours (Business). A pane that turns its tint on uses this colour.
   */
  accent: HexColor.nullable(),
  /** The setting: whether panes that do not say otherwise are tinted. */
  tint: z.boolean(),
  /** Asks pages for their dark scheme. */
  dark: z.boolean(),
  /** Shown before a page paints. */
  background: HexColor,
})
export type WebAppearance = z.infer<typeof WebAppearanceSchema>

/** A theme's HSL accent as #rrggbb. */
export function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const light = l / 100
  const a = sat * Math.min(light, 1 - light)
  const channel = (n: number): string => {
    const k = (n + h / 30) % 12
    const value = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

export function webAppearance(theme: Theme, tintSetting: boolean): WebAppearance {
  const tintable = theme.effects?.iconTint !== false
  return {
    accent: tintable ? hslToHex(theme.accent.h, theme.accent.s, theme.accent.l) : null,
    tint: tintSetting,
    dark: theme.mode !== 'light',
    background: theme.surfaces.s0,
  }
}

/** The colour a pane's pages are drawn in: its own choice, else the setting. */
export function paneTint(appearance: WebAppearance, pane: boolean | null): string | null {
  return (pane ?? appearance.tint) ? appearance.accent : null
}

/**
 * What a page's own defaults should be, told to it as CSS rather than only through
 * `nativeTheme`: a view sits on the theme's ground (`setBackgroundColor`), and a page
 * that declares no background of its own would otherwise keep the light scheme's black
 * text on it and be unreadable. A page that declares a scheme of its own keeps it -
 * nothing here is `!important`.
 */
export function colorSchemeCss(dark: boolean): string {
  return `:root { color-scheme: ${dark ? 'dark' : 'light'}; }`
}

/** Rec. 709 luma weights: how bright each channel looks. */
const LUMA = [0.2126, 0.7152, 0.0722] as const

/**
 * The CSS that draws a page in one colour: each pixel's brightness times the tint,
 * so white becomes the tint and black stays black, as the launcher's icons are
 * drawn. An SVG colour matrix, which Chromium applies on the compositor.
 */
export function tintCss(tint: string): string {
  const rgb = [1, 3, 5].map((i) => Number.parseInt(tint.slice(i, i + 2), 16) / 255)
  const row = (c: number): string => [...LUMA.map((w) => +(w * c).toFixed(4)), 0, 0].join(' ')
  const values = [...rgb.map(row), '0 0 0 1 0'].join(' ')
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg'><filter id='t' color-interpolation-filters='sRGB'>" +
    `<feColorMatrix type='matrix' values='${values}'/></filter></svg>`
  return `html { filter: url("data:image/svg+xml,${encodeURIComponent(svg)}#t") !important; }`
}

/** A pane's rectangle in the window, in CSS pixels. */
export const WebRectSchema = z.object({
  x: z.number().int().min(-100_000).max(100_000),
  y: z.number().int().min(-100_000).max(100_000),
  width: z.number().int().min(1).max(100_000),
  height: z.number().int().min(1).max(100_000),
})
export type WebRect = z.infer<typeof WebRectSchema>

export const WebPaneIdSchema = z.string().min(1).max(64)
/** A pane component's mount, which placed its view last (main/web/views.ts). */
export const WebClaimSchema = z.string().min(1).max(64)

export const WebCommandSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('address'), input: z.string().max(4096) }),
  z.object({ t: z.literal('back') }),
  z.object({ t: z.literal('forward') }),
  z.object({ t: z.literal('reload') }),
  z.object({ t: z.literal('stop') }),
  z.object({ t: z.literal('home') }),
  z.object({ t: z.literal('external') }),
  /** This pane's tint: on, off, or null to follow the setting. */
  z.object({ t: z.literal('tint'), on: z.boolean().nullable() }),
])
export type WebCommand = z.infer<typeof WebCommandSchema>

/** What a pane shows about its page. */
export interface WebState {
  paneId: string
  /** The page's URL; empty before the first page. */
  url: string
  title: string
  loading: boolean
  canGoBack: boolean
  canGoForward: boolean
  /** Why the last page did not load, or why an address was refused; null when fine. */
  error: string | null
}
