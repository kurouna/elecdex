import { charsOf, trimHeld } from '@shared/logwatch/held'
import type { LogEncodingChoice, LogItem, LogStatus, LogWatchEvent } from '@shared/logwatch/types'
import { keyOf } from '@shared/logwatch/types'
import { refCounted } from '../../lib/ref-counted.ts'
import { appearance } from '../../stores/appearance.svelte.ts'

/**
 * What the page holds of one file in one encoding, shared by the panes that show it
 * (docs/logwatch.md §6). Subscribed while one of them is seen; between, it keeps what it held,
 * and asks main only for what came after its last item - which main reads from where it stopped,
 * sending what was written meanwhile as any other lines.
 *
 * The items are a plain array, never a `$state` proxy: tens of thousands of lines would be
 * wrapped one by one. `version` is what the panes follow.
 */
export class LogFeed {
  readonly key: string
  readonly id: string
  readonly encoding: LogEncodingChoice
  items: LogItem[] = []
  /** Characters held in `items`. */
  #held = 0
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
    const added = event.reset ? next : event.items
    this.#held =
      (event.reset ? 0 : this.#held) + added.reduce((sum, item) => sum + charsOf(item), 0)
    // As main holds them (shared/logwatch/held.ts), with the setting itself, read now: the feed
    // outlives the pane that made it.
    this.#held = trimHeld(next, appearance.settings.logWatch.keepLines, this.#held)
    this.items = next
    this.version++
  }

  /** Lets go of what it holds: it asks main for everything when it is used again. */
  forget(): void {
    if (this.items.length === 0) return
    this.items = []
    this.#held = 0
    this.status = null
    this.version++
  }
}

/** Feeds kept with what they hold after their last pane went. */
const KEPT = 8
/**
 * Every feed made, by key. One past the kept forgets its lines but stays here: a hidden pane
 * still holds it, and a second feed of the same key would never be sent what came before
 * (preload subscribes a key once).
 */
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
  const holding = [...feeds.values()].filter((feed) => feed.items.length > 0)
  if (holding.length < KEPT) return
  const idle = holding.filter((feed) => !feed.inUse).sort((a, b) => a.lastUsed - b.lastUsed)
  for (const feed of idle.slice(0, holding.length - KEPT + 1)) feed.forget()
}
