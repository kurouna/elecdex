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
  /** The feed's summary as plain text, cut to FEED_SUMMARY_MAX; absent when it gives none. */
  summary?: string | undefined
  /** A picture for the article (enclosure, media:thumbnail, or the first image), http(s) only. */
  image?: string | undefined
  /** Who wrote it, as the feed names them. */
  author?: string | undefined
  /** The feed's categories for it, at most FEED_CATEGORIES_MAX. */
  categories?: string[] | undefined
}

/** The longest summary kept: enough for the article view's few lines, never the article. */
export const FEED_SUMMARY_MAX = 400
export const FEED_AUTHOR_MAX = 80
export const FEED_CATEGORIES_MAX = 4
export const FEED_CATEGORY_MAX = 32
/** The longest picture address kept: a longer one is dropped (the cache and the image channel take none). */
export const FEED_IMAGE_URL_MAX = 2048

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
  /** The keys (feedItemKey) of its items that have been read, in any pane. */
  read?: string[]
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

/**
 * A feed's or an article's host as shown in place of a title, without "www."; the text as it
 * is when it is no URL. One helper: four copies, two of them unguarded, were found in review.
 */
export function feedHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www./, '')
  } catch {
    return url
  }
}

/** A time as HH:MM on the local clock. */
export function clockTime(at: number): string {
  const d = new Date(at)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** An item's key in the merged list: its link, or its feed and title when it has none. */
export const feedItemKey = (update: Pick<FeedUpdate, 'title'>, item: FeedItem): string =>
  item.link ?? `${update.title}\n${item.title}`

export interface ShownItem extends FeedItem {
  /** The title of the feed it came from. */
  source: string
  /** The URL of the feed it came from, as the pane lists it. */
  feed: string
  /** A key unique within the merged list. */
  key: string
  /** Opened, here or in another pane. */
  read: boolean
}

/**
 * The newest `limit` items across feeds.
 *
 * The same article in two feeds (by link, or by source and title when it has no
 * link) is shown once. Items without a date go after dated ones, in feed order,
 * so a feed that dates nothing still shows but cannot push dated news down.
 *
 * `keep` leaves items out before the limit is taken (a muted word, a search, the read ones
 * when only the unread are asked for), so what it drops makes room for older items instead
 * of shortening the list. It is told whether the item has been read.
 */
export function mergeFeeds(
  updates: readonly FeedUpdate[],
  limit = FEED_MAX_SHOWN,
  keep: (item: FeedItem, read: boolean) => boolean = () => true,
): ShownItem[] {
  const seen = new Set<string>()
  const items: ShownItem[] = []
  for (const update of updates) {
    const read = new Set(update.read ?? [])
    for (const item of update.items) {
      const key = feedItemKey(update, item)
      if (seen.has(key) || !keep(item, read.has(key))) continue
      seen.add(key)
      items.push({ ...item, source: update.title, feed: update.url, key, read: read.has(key) })
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
