/**
 * What the RSS pane's ADD box was given, before main looks anything up: a feed or site URL
 * (the scheme may be left out), `github:owner/repo` for a project's releases, or
 * `youtube:@handle` / `youtube:UC...` for a channel's uploads. Pure; main does the fetching
 * (main/feeds/discover.ts).
 */

import { feedUrl } from './feeds.js'

export type DiscoverTarget =
  /** A feed known without asking: added as it is. */
  | { kind: 'feed'; url: string; title: string }
  /** A page to read: a feed itself, or a site whose page names its feeds. */
  | { kind: 'page'; url: string }

const GITHUB = /^github:\s*([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100})$/i
const YT_HANDLE = /^youtube:\s*@?([A-Za-z0-9._-]{3,30})$/i
const YT_CHANNEL = /^youtube:\s*(UC[A-Za-z0-9_-]{22})$/

/** The longest text the ADD box takes. */
export const DISCOVER_INPUT_MAX = 2048

export function discoverTarget(raw: unknown): DiscoverTarget | null {
  if (typeof raw !== 'string' || raw.length > DISCOVER_INPUT_MAX) return null
  const text = raw.trim()
  // The prefix in any case ("YouTube:"); what follows keeps its own, as a channel id's does.
  if (/^(github|youtube):/i.test(text))
    return nameTarget(text.replace(/^\w+:/, (p) => p.toLowerCase()))
  return pageTarget(text)
}

/** `github:owner/repo`, `youtube:@handle` or `youtube:UC…`; null for anything else after them. */
function nameTarget(text: string): DiscoverTarget | null {
  const github = GITHUB.exec(text)
  if (github?.[1] !== undefined && github[2] !== undefined) {
    const repo = github[2].replace(/\.git$/i, '')
    if (repo === '.' || repo === '..' || repo === '') return null
    return {
      kind: 'feed',
      url: `https://github.com/${github[1]}/${repo}/releases.atom`,
      title: `${github[1]}/${repo} releases`,
    }
  }
  const channel = YT_CHANNEL.exec(text)
  if (channel?.[1] !== undefined) {
    return {
      kind: 'feed',
      url: `https://www.youtube.com/feeds/videos.xml?channel_id=${channel[1]}`,
      title: `YouTube ${channel[1]}`,
    }
  }
  const handle = YT_HANDLE.exec(text)
  if (handle?.[1] !== undefined) {
    return { kind: 'page', url: `https://www.youtube.com/@${handle[1]}` }
  }
  return null
}

/** A site or feed URL, the scheme optional; never another scheme (file:, javascript:). */
function pageTarget(text: string): DiscoverTarget | null {
  // A host with a port ("localhost:8080") looks like a scheme; anything else that does is one.
  const scheme = /^[a-z][a-z0-9+.-]*:/i.test(text) && !/^[^:/]+:\d/.test(text)
  if (scheme && !/^https?:/i.test(text)) return null
  const withScheme = /^https?:\/\//i.test(text) ? text : `https://${text}`
  // A bare word is not a site: a host needs a dot (or is localhost, for the tests' stub).
  const url = feedUrl(withScheme)
  if (url === null) return null
  const host = new URL(url).hostname
  if (!host.includes('.') && host !== 'localhost') return null
  return { kind: 'page', url }
}

/** What main found for the ADD box: feeds to choose from, or why there are none. */
export interface DiscoveredFeed {
  url: string
  title: string
  /** rss, atom, or feed when the page did not say. */
  format: 'rss' | 'atom' | 'feed'
}

export type DiscoverResult = { ok: true; feeds: DiscoveredFeed[] } | { ok: false; error: string }

/** The most candidates one page gives: enough for its tags and comments, never a sitemap. */
export const DISCOVER_MAX = 8
