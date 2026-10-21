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
   * Of the hosts, the ones a sized `window.open` opens as a sign-in popup (Google's, Apple's).
   * Such a window on the site's own hosts opens in the pane: X's own intents and share pages
   * were a stray second X with no toolbar (found in review). The browser, with no hosts of its
   * own, opens every sized window as a popup.
   */
  signIn?: readonly string[]
  /**
   * What the pane tells the site it is, where the site serves a different interface to
   * a television. Left out, the pages are served the browser's own user agent.
   */
  userAgent?: string
  /**
   * Kept out of the add-pane picker, while layouts that name it still open it: the plain
   * YouTube pane cannot be signed in (Google refuses an embedded browser), so the television
   * one is the one to add.
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

/**
 * YouTube's own hosts, and Google's sign-in and cookie consent pages, which YouTube sends a
 * pane to. Not the whole of google.com: Gmail, Drive and the rest opened inside the pane, which
 * has no address bar, under the television's user agent (found in review).
 */
const YOUTUBE_HOSTS = ['youtube.com', 'youtu.be', 'accounts.google.com', 'consent.google.com']

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
    hosts: YOUTUBE_HOSTS,
    signIn: ['accounts.google.com'],
    // The television pane is offered instead: only that one can be signed in.
    unlisted: true,
  },
  {
    id: 'youtubetv',
    title: 'youtube (tv)',
    description:
      "YouTube's television interface: the remote-control layout, and the only YouTube pane that can be signed in - with a code entered on a phone.",
    home: 'https://www.youtube.com/tv',
    hosts: YOUTUBE_HOSTS,
    signIn: ['accounts.google.com'],
    userAgent: TELEVISION,
  },
  {
    id: 'x',
    title: 'x',
    description: 'X (Twitter) in a pane. Links to other sites open in your browser.',
    home: 'https://x.com/home',
    // t.co is X's link shortener: it redirects, and the redirect is checked in turn.
    hosts: ['x.com', 'twitter.com', 't.co', 'accounts.google.com', 'appleid.apple.com'],
    signIn: ['accounts.google.com', 'appleid.apple.com'],
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
    return { ...preset, home: home.toString(), hosts: [home.hostname], signIn: [home.hostname] }
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
 * The page a pane's existing view goes to as the pane mounts again, or null to stay where it
 * is. A moved pane asks for the page it last reported (the pane writes every page into its
 * state), so the view stays on its document. Another saved layout's pane of the same id asks
 * for its own saved page, which the view - main's, kept by pane id - is not on: it goes there.
 */
export function pageToReopen(
  preset: WebPreset,
  current: string,
  saved: string | null,
): string | null {
  if (saved === null || saved === '' || saved === current || saved === pageToKeep(current)) {
    return null
  }
  return navigationVerdict(preset, saved) === 'allow' ? saved : null
}

/**
 * Hosts whose pages only pass a link on: X's t.co answers a browser with a page whose script
 * goes on to the link. Such a page is never the pane's page to keep, and when it hands the link
 * to the browser the pane goes back to where it was (found in review: the t.co page was saved,
 * and every start opened the link in the browser again, the pane left on a blank page).
 */
const PASS_THROUGH = ['t.co']

export function passesThrough(raw: string): boolean {
  const url = httpUrl(raw)
  return url !== null && PASS_THROUGH.some((host) => hostMatches(url.hostname, host))
}

/** Query and fragment keys that carry a sign-in: a callback page's tokens and codes. */
const SIGN_IN_KEYS =
  /^(access_token|id_token|refresh_token|code|oauth_token|oauth_verifier|token|state|session_state|client_secret|password|ticket|saml(request|response))$/i

/**
 * The page a pane writes into its state - and so into layout.json and the saved layouts - for a
 * restart to open again: the page as it is, but a sign-in callback (`?code=`, `#access_token=`)
 * only by its path, never its tokens (found in review). A fragment that routes (YouTube's
 * television interface: `#/watch?v=`) is kept.
 */
export function pageToKeep(raw: string): string | null {
  if (passesThrough(raw)) return null
  const url = httpUrl(raw)
  if (url === null) return raw
  const hash = url.hash.slice(1)
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : hash
  const carries = (params: URLSearchParams): boolean =>
    [...params.keys()].some((key) => SIGN_IN_KEYS.test(key))
  if (!carries(url.searchParams) && !carries(new URLSearchParams(hashQuery))) return raw
  return `${url.origin}${url.pathname}`
}

/**
 * What a page that did not load says in the pane: Chromium's code, in words for the common
 * ones, the code kept beside them.
 */
const LOAD_FAILURES: Record<string, string> = {
  ERR_NAME_NOT_RESOLVED: 'no such site: the name did not resolve',
  ERR_INTERNET_DISCONNECTED: 'not connected to the internet',
  ERR_CONNECTION_REFUSED: 'the site refused the connection',
  ERR_CONNECTION_TIMED_OUT: 'the site did not answer in time',
  ERR_TIMED_OUT: 'the site did not answer in time',
  ERR_CONNECTION_RESET: 'the connection was cut',
  ERR_ADDRESS_UNREACHABLE: 'the address cannot be reached',
  ERR_CERT_AUTHORITY_INVALID: 'the certificate is not one to trust',
  ERR_CERT_COMMON_NAME_INVALID: 'the certificate is for another site',
  ERR_CERT_DATE_INVALID: 'the certificate has expired or is not valid yet',
}

export function loadFailure(code: number, description: string): string {
  const words = LOAD_FAILURES[description]
  if (words !== undefined) return `${words} (${description})`
  return description || `error ${code}`
}

/**
 * The page "open in your browser" hands out: the page itself, but a video in YouTube's
 * television interface (`/tv#/watch?v=ID`) as the video's own page, which a desktop browser
 * shows (found in review: it was given the television interface).
 */
export function externalPage(raw: string): string {
  const url = httpUrl(raw)
  if (url === null || !hostMatches(url.hostname, 'youtube.com') || url.pathname !== '/tv') {
    return raw
  }
  const hash = url.hash.slice(1)
  const query = hash.startsWith('/watch?') ? new URLSearchParams(hash.slice(7)) : null
  const video = query?.get('v')
  if (video == null || !/^[\w-]{1,32}$/.test(video)) return raw
  return `https://www.youtube.com/watch?v=${video}`
}

/** The longest address a pane sends main, typed or saved. */
export const WEB_URL_MAX = 8192

/**
 * A new window a page asks for: a sign-in popup (window.open with a size, which
 * Chromium reports as 'new-window') on a host of the preset opens as a small window
 * of its own, since the page waits for it to report back; any other link on such
 * a host opens in the pane itself, which has no tabs.
 */
export type WindowVerdict = 'popup' | 'same-pane' | 'external' | 'block'

/**
 * When a page may send the default browser to a link off its site (issue 31): only just after
 * the person pressed or typed in the pane - a click through a link that redirects away is still
 * theirs - and once in a while, so neither a page's own script nor one press opens a run of tabs.
 */
export const EXTERNAL_LIMITS = { afterInputMs: 5000, gapMs: 1500 } as const

/** When the person last pressed or typed in a page, and when it last opened the browser. */
export interface OutsideOpens {
  inputAt: number | null
  openedAt: number | null
}

export function mayOpenOutside(state: OutsideOpens, now: number): boolean {
  if (state.inputAt === null || now - state.inputAt > EXTERNAL_LIMITS.afterInputMs) return false
  return state.openedAt === null || now - state.openedAt > EXTERNAL_LIMITS.gapMs
}

export function windowVerdict(preset: WebPreset, raw: string, disposition: string): WindowVerdict {
  const verdict = navigationVerdict(preset, raw)
  if (verdict !== 'allow') return verdict
  if (raw === 'about:blank') return 'block'
  return disposition === 'new-window' && opensAsPopup(preset, raw) ? 'popup' : 'same-pane'
}

function opensAsPopup(preset: WebPreset, raw: string): boolean {
  if (preset.hosts === null) return true
  const host = httpUrl(raw)?.hostname ?? ''
  return (preset.signIn ?? []).some((signIn) => hostMatches(host, signIn))
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
  z.object({ t: z.literal('address'), input: z.string().max(WEB_URL_MAX) }),
  /**
   * The page the pane's state names, changed under a mounted pane (another saved layout's pane
   * of the same id): gone to only on the preset's site (`pageToReopen`), never handed out.
   */
  z.object({ t: z.literal('reopen'), url: z.string().max(WEB_URL_MAX) }),
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
