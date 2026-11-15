import { feedUrl } from '@shared/feeds'
import {
  DISCOVER_MAX,
  type DiscoveredFeed,
  type DiscoverResult,
  discoverTarget,
} from '@shared/feeds-discover'
import type { ParsedFeed } from './parse.js'

/**
 * The RSS pane's ADD: from what the user typed to feeds they can pick (docs/architecture.md
 * §5.27). Asked only when the user presses FIND, one page at a time per press:
 *
 *  1. `github:` and `youtube:UC…` are feeds already; nothing is fetched.
 *  2. Otherwise the page is fetched once. A feed is itself the answer.
 *  3. A web page names its feeds in `<link rel="alternate" type="application/rss+xml">` (RSS
 *     Board's autodiscovery; also atom+xml, and rel="feed").
 *  4. A page that names none gets the usual places tried on its site, one after another,
 *     stopping at the first feed: at most FALLBACK_PATHS more requests.
 *
 * Electron-free: the network and the parser are injected.
 */

export interface PageResponse {
  status: number
  /** The final URL after redirects, the base for relative links. */
  url: string
  text(): Promise<string>
}

export interface DiscoverDeps {
  fetch(url: string): Promise<PageResponse>
  parse(xml: string, url: string): Promise<ParsedFeed>
}

/** Where sites usually keep a feed, tried only when the page names none. */
export const FALLBACK_PATHS = ['/feed', '/rss.xml', '/atom.xml', '/index.xml', '/feed.xml']

const LINK_TAG = /<link\b[^>]*>/gi
const ATTRIBUTE = /([a-z][a-z0-9:_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi

function attributes(tag: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const match of tag.matchAll(ATTRIBUTE)) {
    const name = match[1]?.toLowerCase()
    if (name !== undefined) out[name] = match[2] ?? match[3] ?? match[4] ?? ''
  }
  return out
}

function decodeAttribute(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function formatOf(type: string): DiscoveredFeed['format'] | null {
  const t = type.toLowerCase().split(';')[0]?.trim() ?? ''
  if (t === 'application/rss+xml' || t === 'application/rdf+xml') return 'rss'
  if (t === 'application/atom+xml') return 'atom'
  return null
}

/**
 * The feeds a page names in its `<link>` tags, resolved against `base`, http(s) only,
 * distinct, at most DISCOVER_MAX, in the page's order (its main feed comes first).
 */
export function feedLinks(html: string, base: string): DiscoveredFeed[] {
  const found: DiscoveredFeed[] = []
  for (const tag of html.match(LINK_TAG) ?? []) {
    const feed = linkFeed(tag, base)
    if (feed === null || found.some((f) => f.url === feed.url)) continue
    found.push(feed)
    if (found.length === DISCOVER_MAX) break
  }
  return found
}

/** One `<link>` tag as a feed, or null when it names none elecdex would fetch. */
function linkFeed(tag: string, base: string): DiscoveredFeed | null {
  const attrs = attributes(tag)
  const rels = (attrs.rel ?? '').toLowerCase().split(/\s+/)
  const format = formatOf(attrs.type ?? '')
  const isFeed = rels.includes('feed') || (rels.includes('alternate') && format !== null)
  if (!isFeed || attrs.href === undefined) return null
  let url: URL
  try {
    url = new URL(decodeAttribute(attrs.href).trim(), base)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username !== '' || url.password !== '') return null
  url.hash = ''
  // What the pane would refuse to list (too long, odd form) is not offered: ADD would do nothing.
  if (feedUrl(url.href) !== url.href) return null
  const title = decodeAttribute(attrs.title ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
  return { url: url.href, title: title || url.pathname, format: format ?? 'feed' }
}

const looksLikeFeed = (text: string) => /<(rss|feed|rdf:RDF)\b/i.test(text.slice(0, 4096))

async function asFeed(
  deps: DiscoverDeps,
  url: string,
  text: string,
): Promise<DiscoveredFeed | null> {
  // A redirect's last address is offered as the feed: only in the form the pane lists.
  if (!looksLikeFeed(text) || feedUrl(url) !== url) return null
  try {
    const parsed = await deps.parse(text, url)
    const atom = /<feed\b/i.test(text.slice(0, 4096))
    return { url, title: parsed.title ?? new URL(url).hostname, format: atom ? 'atom' : 'rss' }
  } catch {
    return null
  }
}

/** Reads a page; null for anything but a 200. */
async function read(
  deps: DiscoverDeps,
  url: string,
): Promise<{ url: string; text: string } | null> {
  const response = await deps.fetch(url)
  if (response.status !== 200) return null
  return { url: response.url || url, text: await response.text() }
}

export async function discover(deps: DiscoverDeps, input: unknown): Promise<DiscoverResult> {
  const target = discoverTarget(input)
  if (target === null) return { ok: false, error: 'not a site, feed or github:/youtube: name' }
  if (target.kind === 'feed') {
    return { ok: true, feeds: [{ url: target.url, title: target.title, format: 'atom' }] }
  }
  let page: { url: string; text: string } | null
  try {
    page = await read(deps, target.url)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
  if (page === null) return { ok: false, error: 'the page did not answer' }
  const itself = await asFeed(deps, page.url, page.text)
  if (itself !== null) return { ok: true, feeds: [itself] }
  const named = feedLinks(page.text, page.url)
  if (named.length > 0) return { ok: true, feeds: named }
  const origin = new URL(page.url).origin
  for (const path of FALLBACK_PATHS) {
    const url = `${origin}${path}`
    try {
      const tried = await read(deps, url)
      const feed = tried === null ? null : await asFeed(deps, tried.url, tried.text)
      if (feed !== null) return { ok: true, feeds: [feed] }
    } catch {
      // The next place.
    }
  }
  return { ok: false, error: 'no feed found on that page' }
}
