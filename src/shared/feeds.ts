/**
 * RSS and Atom feeds, shared by main (which fetches them) and the RSS widget.
 *
 * A pane lists feed URLs; main keeps each listed feed's latest items and sends
 * them per feed, and the widget merges the feeds it shows into one list, newest
 * first. Merging in the renderer means several panes can share a feed's single
 * fetch while each shows its own mix.
 */

/** Feeds one pane may list. Also the most requests one pane can cause per check. */
export const FEED_MAX_URLS = 10
/** Items shown in a pane, across all its feeds; the rest of each feed is not shown. */
export const FEED_MAX_SHOWN = 20
/** Items kept per feed: a pane shows at most 20 in all, so a feed never needs more. */
export const FEED_ITEMS_PER_FEED = FEED_MAX_SHOWN
/** How often a watched feed is checked (a feed may ask for less often; see service). */
export const FEED_INTERVAL_MS = 15 * 60_000

const MAX_URL_LENGTH = 2048

export interface FeedItem {
  title: string
  /** The article, http(s) only; null when the feed gives none. */
  link: string | null
  /** Publication time, ms since epoch; null when the feed gives none. */
  at: number | null
}

export interface FeedUpdate {
  url: string
  /** The feed's own title, or its host name when it has none. */
  title: string
  /** Newest first. */
  items: FeedItem[]
  /** When the items were last downloaded (not merely re-checked), ms since epoch. */
  fetchedAt: number | null
  /** Why the last check failed; the items are those of the last good one. */
  error: string | null
}

/**
 * A feed URL in canonical form, or null when it is not one elecdex will fetch:
 * http or https, no user name or password, and of reasonable length.
 */
export function feedUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > MAX_URL_LENGTH) return null
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username !== '' || url.password !== '') return null
  url.hash = ''
  return url.href.length > MAX_URL_LENGTH ? null : url.href
}

/** The feed URLs of a pane's state, dropping anything that is not one. */
export function paneFeeds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const urls = raw.map(feedUrl).filter((u): u is string => u !== null)
  return [...new Set(urls)].slice(0, FEED_MAX_URLS)
}

/**
 * Reads the editor's text, one URL per line. Lines that are not feed URLs are
 * reported rather than silently dropped, and so is going over the limit.
 */
export function parseFeedList(text: string): { urls: string[]; invalid: string[] } {
  const urls: string[] = []
  const invalid: string[] = []
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed === '') continue
    const url = feedUrl(trimmed)
    if (url === null) invalid.push(trimmed)
    else if (!urls.includes(url)) urls.push(url)
  }
  return { urls, invalid }
}

/** An item's key in the merged list: its link, or its feed and title when it has none. */
export const feedItemKey = (update: Pick<FeedUpdate, 'title'>, item: FeedItem): string =>
  item.link ?? `${update.title}\n${item.title}`

export interface ShownItem extends FeedItem {
  /** The title of the feed it came from. */
  source: string
  /** A key unique within the merged list. */
  key: string
}

/**
 * The newest `limit` items across feeds.
 *
 * The same article in two feeds (by link, or by source and title when it has no
 * link) is shown once. Items without a date go after dated ones, in feed order,
 * so a feed that dates nothing still shows but cannot push dated news down.
 */
export function mergeFeeds(updates: readonly FeedUpdate[], limit = FEED_MAX_SHOWN): ShownItem[] {
  const seen = new Set<string>()
  const items: ShownItem[] = []
  for (const update of updates) {
    for (const item of update.items) {
      const key = feedItemKey(update, item)
      if (seen.has(key)) continue
      seen.add(key)
      items.push({ ...item, source: update.title, key })
    }
  }
  // Array.prototype.sort is stable, so undated items keep their order.
  items.sort((a, b) => (b.at ?? Number.NEGATIVE_INFINITY) - (a.at ?? Number.NEGATIVE_INFINITY))
  return items.slice(0, limit)
}

/**
 * When an item was published, as shown in the list: the time for today's
 * items, the month and day for older ones. No "5 minutes ago", which would need
 * a timer to keep it true.
 */
export function formatItemTime(at: number, now: number): string {
  const date = new Date(at)
  const today = new Date(now)
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  if (sameDay) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  return `${date.getMonth() + 1}/${date.getDate()}`
}
