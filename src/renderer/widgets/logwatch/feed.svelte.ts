import type { LogEncodingChoice, LogItem, LogStatus, LogWatchEvent } from '@shared/logwatch/types'
import { keyOf } from '@shared/logwatch/types'
import { refCounted } from '../../lib/ref-counted.ts'
import { appearance } from '../../stores/appearance.svelte.ts'

/**
 * What the page holds of one file in one encoding, shared by the panes that show it
 * (docs/logwatch.md §6). Subscribed while one of them is seen; between, it keeps what it held,
 * and asks main only for what came after its last item - which main reads from where it stopped,
 * with a banner for what was written meanwhile.
 *
 * The items are a plain array, never a `$state` proxy: tens of thousands of lines would be
 * wrapped one by one. `version` is what the panes follow.
 */
export class LogFeed {
  readonly key: string
  readonly id: string
  readonly encoding: LogEncodingChoice
  items: LogItem[] = []
  version = $state(0)
  status = $state.raw<LogStatus | null>(null)
  /** Followed by a pane now. */
  inUse = false
  /** When the last pane let go of it, for forgetting the least recently used. */
  lastUsed = 0
  readonly use: () => () => void

  constructor(id: string, encoding: LogEncodingChoice) {
    this.id = id
    this.encoding = encoding
    this.key = keyOf(id, encoding)
    this.use = refCounted(() => {
      this.inUse = true
      const stop = window.elecdex.logwatch.subscribe(
        { id, encoding, since: this.items.at(-1)?.seq ?? -1 },
        (event) => this.receive(event),
      )
      return () => {
        stop()
        this.inUse = false
        this.lastUsed = Date.now()
      }
    })
  }

  /**
   * A new array on every change, never the old one added to: what the panes derive from it
   * compares by reference, and an array grown in place would look unchanged.
   */
  receive(event: LogWatchEvent): void {
    this.status = event.status
    if (!event.reset && event.items.length === 0) return
    const next = event.reset ? event.items : this.items.concat(event.items)
    // The setting itself, read now: the feed outlives the pane that made it.
    const over = next.length - appearance.settings.logWatch.keepLines
    this.items = over > 0 ? next.slice(over) : next
    this.version++
  }
}

/** Feeds kept with what they hold after their last pane went. */
const KEPT = 8
const feeds = new Map<string, LogFeed>()

/** The page's feed for a file and an encoding, made the first time it is asked for. */
export function feedFor(id: string, encoding: LogEncodingChoice): LogFeed {
  const key = keyOf(id, encoding)
  const known = feeds.get(key)
  if (known !== undefined) return known
  const feed = new LogFeed(id, encoding)
  // Room is made before the new one goes in, so it is never the one forgotten.
  forgetOld()
  feeds.set(key, feed)
  return feed
}

function forgetOld(): void {
  if (feeds.size < KEPT) return
  const idle = [...feeds.values()]
    .filter((feed) => !feed.inUse)
    .sort((a, b) => a.lastUsed - b.lastUsed)
  for (const feed of idle.slice(0, feeds.size - KEPT + 1)) feeds.delete(feed.key)
}
