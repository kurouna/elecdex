<script lang="ts">
import {
  FEED_MAX_URLS,
  type FeedUpdate,
  formatItemTime,
  mergeFeeds,
  paneFeeds,
  parseFeedList,
} from '@shared/feeds'
import { untrack } from 'svelte'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import type { WidgetProps } from '../registry.ts'

/**
 * Headlines from the RSS and Atom feeds the user lists, newest first.
 *
 * The feed URLs are pane state; main fetches each listed feed every 15 minutes
 * (see main/feeds/service.ts) and this pane merges them. It is not in the default
 * layout and starts with no feeds, so nothing is fetched until the user adds one.
 * Plain text and no timers beyond one at midnight, so it costs nothing at idle.
 */
const { paneId, state: paneState }: WidgetProps = $props()

const feeds = $derived(paneFeeds(paneState?.feeds))
/**
 * The feeds as one string, so the subscriptions below follow the list itself and
 * not every new array the pane state produces (a save of an identical list).
 */
const feedKey = $derived(feeds.join('\n'))

let updates = $state.raw<Record<string, FeedUpdate>>({})
let editing = $state(false)
let draft = $state('')
let problem = $state<string | null>(null)

/**
 * One subscription per listed feed, kept across edits of the list: only feeds
 * added or removed subscribe or unsubscribe, so an edit does not make main stop
 * and restart the feeds that stayed.
 */
const subscriptions = new Map<string, () => void>()

$effect(() => {
  const urls = new Set(feedKey === '' ? [] : feedKey.split('\n'))
  for (const [url, off] of subscriptions) {
    if (urls.has(url)) continue
    off()
    subscriptions.delete(url)
  }
  for (const url of urls) {
    if (subscriptions.has(url)) continue
    subscriptions.set(
      url,
      window.elecdex.feeds.subscribe(url, (update) => {
        updates = { ...updates, [url]: update }
      }),
    )
  }
  // Forget feeds no longer listed; their items must not linger in memory.
  untrack(() => {
    updates = Object.fromEntries(Object.entries(updates).filter(([url]) => urls.has(url)))
  })
})

$effect(() => () => {
  for (const off of subscriptions.values()) off()
  subscriptions.clear()
})

/** Today's date as the list sees it: set at mount and at each midnight, for the time labels. */
let clock = $state(Date.now())

$effect(() => {
  const next = new Date(clock)
  next.setHours(24, 0, 0, 0)
  const timer = setTimeout(() => {
    clock = Date.now()
  }, next.getTime() - Date.now())
  return () => clearTimeout(timer)
})

const received = $derived(feeds.map((url) => updates[url]).filter((u) => u !== undefined))
const shown = $derived(mergeFeeds(received))
/** When every listed feed has failed and none has items, say why instead of waiting. */
const failure = $derived(
  received.length === feeds.length &&
    received.every((u) => u.error !== null && u.items.length === 0)
    ? (received[0]?.error ?? null)
    : null,
)

$effect(() => {
  if (feeds.length === 0) {
    paneMeta.set(paneId, {})
    return
  }
  const latest = Math.max(0, ...received.map((u) => u.fetchedAt ?? 0))
  const time = latest ? new Date(latest).toTimeString().slice(0, 5) : null
  const stale = received.some((u) => u.error !== null)
  const count = `${feeds.length} ${feeds.length === 1 ? 'feed' : 'feeds'}`
  paneMeta.set(paneId, {
    subtitle: time ? `${count} · updated ${time}` : count,
    ...(stale ? { badge: 'stale', badgeKind: 'warn' as const } : {}),
  })
})

function startEditing(): void {
  draft = feeds.join('\n')
  problem = null
  editing = true
}

function saveDraft(): void {
  const { urls, invalid } = parseFeedList(draft)
  if (invalid.length > 0) {
    problem = `not a feed URL: ${invalid[0]}`
    return
  }
  if (urls.length > FEED_MAX_URLS) {
    problem = `up to ${FEED_MAX_URLS} feeds`
    return
  }
  layout.setPaneState(paneId, { ...paneState, feeds: urls })
  editing = false
}
</script>

<div class="rss" data-testid="rss">
  <div class="tools">
    <button
      type="button"
      class="edit"
      aria-expanded={editing}
      onclick={() => (editing ? (editing = false) : startEditing())}
      data-testid="rss-edit"
    >
      feeds
    </button>
  </div>

  {#if editing}
    <form
      class="editor"
      onsubmit={(e) => {
        e.preventDefault()
        saveDraft()
      }}
    >
      <textarea
        bind:value={draft}
        rows="4"
        spellcheck="false"
        placeholder="https://example.com/feed.xml"
        data-testid="rss-feeds"
      ></textarea>
      <div class="editor-bar">
        <span class:problem={problem !== null} data-testid="rss-problem">
          {problem ?? `RSS or Atom feed URLs, one per line, up to ${FEED_MAX_URLS} · checked every 15 minutes`}
        </span>
        <button type="submit" data-testid="rss-save">save</button>
      </div>
    </form>
  {/if}

  {#if feeds.length === 0}
    {#if !editing}
      <p class="note" data-testid="rss-empty">No feeds yet. Press FEEDS to add RSS or Atom feed URLs.</p>
    {/if}
  {:else if shown.length === 0}
    <p class="note" data-testid="rss-status">
      {failure === null ? 'fetching feeds…' : `could not read the feeds: ${failure}`}
    </p>
  {:else}
    <ul class="items" data-testid="rss-items">
      {#each shown as item (item.key)}
        <li>
          <button
            type="button"
            class="item"
            disabled={item.link === null}
            title={item.title}
            onclick={() => {
              if (item.link !== null) void window.elecdex.system.openExternal(item.link)
            }}
            data-testid="rss-item"
          >
            <span class="title">{item.title}</span>
            <span class="meta">
              {item.source}{item.at === null ? '' : ` · ${formatItemTime(item.at, clock)}`}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
.rss {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: var(--space-1) var(--space-1) 0;
  font-family: var(--font-ui);
}

.tools {
  display: flex;
  justify-content: flex-end;
  min-height: 1.1rem;
}

.edit,
.editor button {
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text-muted);
  font: inherit;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.edit[aria-expanded='true'],
.edit:hover,
.editor button:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.editor textarea {
  resize: none;
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  padding: var(--space-1);
}

.editor-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.editor-bar .problem {
  color: var(--warn);
}

.note {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--step--1);
}

/* The list takes the pane's height and scrolls past it. */
.items {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.items li + li {
  border-top: 1px solid var(--panel-rule);
}

.item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  width: 100%;
  padding: var(--space-1);
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.item:disabled {
  cursor: default;
}

.item:not(:disabled):hover .title,
.item:focus-visible .title {
  color: var(--accent);
  text-decoration: underline;
}

.item:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: -1px;
}

.title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: var(--step--1);
  line-height: 1.3;
}

.meta {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: var(--step--2);
  color: var(--text-muted);
}
</style>
