<script lang="ts">
import {
  clockTime,
  FEED_MAX_SHOWN,
  FEED_MAX_URLS,
  type FeedItem,
  type FeedUpdate,
  feedHost,
  feedItemKey,
  mergeFeeds,
  paneFeeds,
  type ShownItem,
} from '@shared/feeds'
import {
  cleanTag,
  type FeedView,
  feedMarks,
  freeTurn,
  isMuted,
  matchesFind,
  paneSeenAt,
  paneView,
  paneWords,
  type StoredMark,
  storedMarks,
  wordPattern,
} from '@shared/feeds-view'
import { untrack } from 'svelte'
import { afterBlink } from '../../lib/blink.ts'
import { carryFresh, FreshTracker } from '../../lib/fresh.ts'
import { handOver } from '../../lib/hand-over.svelte.ts'
import { composing } from '../../lib/ime.ts'
import { NewAbove } from '../../lib/new-above.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'
import FeedMark from './FeedMark.svelte'
import RssArticle from './RssArticle.svelte'
import RssCards from './RssCards.svelte'
import RssList from './RssList.svelte'
import RssSettings, { type NewFeed, type SettingsTab } from './RssSettings.svelte'
import RssTicker from './RssTicker.svelte'

/**
 * Headlines from the RSS and Atom feeds the user lists, newest first (docs/architecture.md
 * §5.27, the look in docs/rss-mock).
 *
 * The feed URLs and the pane's choices are pane state - `feeds`, each feed's mark (`marks`),
 * the view (`view`: LIST, CARD or TICKER), the `highlight` and `mute` words, and when the
 * list was last seen (`seenAt`). Main fetches each listed feed every 15 minutes (see
 * main/feeds/service.ts) and keeps the read marks; this pane merges, filters and draws. It is
 * not in the default layout and starts with no feeds - with ADD and the starter packs in
 * front - so nothing is fetched until the user adds one. No timers of its own beyond one at
 * midnight; TICKER steps on the wall clock's grid only while shown.
 */
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
/** Shown in its tab, with the window on screen: what the pane does for the eye runs only then. */
const visible = $derived(seen(inTab))

const feeds = $derived(paneFeeds(paneState?.feeds))
/**
 * The feeds as one string, so the subscriptions below follow the list itself and
 * not every new array the pane state produces (a save of an identical list).
 */
const feedKey = $derived(feeds.join('\n'))
const view = $derived(paneView(paneState?.view))
const stored = $derived(storedMarks(paneState?.marks))
const highlightWords = $derived(paneWords(paneState?.highlight))
const muteWords = $derived(paneWords(paneState?.mute))
const highlight = $derived(wordPattern(highlightWords))
const mute = $derived(wordPattern(muteWords))
/** Only the headlines not yet read, when the bar's UNREAD is on. */
const unreadOnly = $derived(paneState?.unreadOnly === true)

let updates = $state.raw<Record<string, FeedUpdate>>({})

/** Settings open, and on which tab. */
let settingsOpen = $state(false)
let tab = $state<SettingsTab>('feeds')
/** The feed the chips narrow the list to, or null for all. */
let only = $state<string | null>(null)
/** What the find box searches for. */
let find = $state('')
/** The article open over the list, by its key. */
let openKey = $state<string | null>(null)
/** The row the article came from, to give the keyboard back to. */
let cameFrom: HTMLElement | null = null

/**
 * One subscription per listed feed, kept across edits of the list: only feeds
 * added or removed subscribe or unsubscribe, so an edit does not make main stop
 * and restart the feeds that stayed.
 */
const subscriptions = new Map<string, () => void>()

/**
 * Headlines that arrived after their feed's first download in this pane, marked
 * until their highlight ends. Each feed keeps its own record, so a feed added to
 * the list, or answering later than the others, does not bring all its items in
 * as new.
 */
let fresh = $state.raw<ReadonlySet<string>>(new Set())
const trackers = new Map<string, FreshTracker>()
const above = new NewAbove()

/** What a headline must pass to be shown at all: not muted, what is searched, and unread if asked. */
const keepItem = (item: FeedItem, read: boolean): boolean =>
  !isMuted(item, mute) && matchesFind(item, find) && !(unreadOnly && read)

function receive(url: string, update: FeedUpdate): void {
  const next = { ...updates, [url]: update }
  // A feed never downloaded has no items to compare with yet.
  if (update.fetchedAt !== null) {
    const tracker = trackers.get(url) ?? new FreshTracker()
    trackers.set(url, tracker)
    const added = tracker.next(update.items.map((item) => feedItemKey(update, item)))
    // Only LIST plays the arrival and its "n new"; in CARD or TICKER a key kept for it would
    // light up when LIST came back, maybe an hour later (found in review).
    if (view === 'list') {
      // Only what makes the list as shown counts - the chip's feed, past the mute and the
      // search: an item too old for it, or another feed's, is not news here.
      const listed = mergeFeeds(narrowed(listedUpdates(next)), undefined, keepItem).map(
        (item) => item.key,
      )
      const shownAdded = added.filter((key) => listed.includes(key))
      fresh = carryFresh(fresh, shownAdded, listed)
      above.arrived(shownAdded.length)
    }
  }
  updates = next
}

function settled(key: string, event: AnimationEvent): void {
  if (event.animationName !== 'fx-fresh' || !fresh.has(key)) return
  fresh = new Set([...fresh].filter((k) => k !== key))
}

$effect(() => {
  const urls = new Set(feedKey === '' ? [] : feedKey.split('\n'))
  // Followed only while the pane is on screen: behind another tab main fetches no feed. The
  // headlines stay, and what arrived meanwhile comes in as new when the tab is back.
  const followed = visible ? urls : new Set<string>()
  for (const [url, off] of subscriptions) {
    if (followed.has(url)) continue
    off()
    subscriptions.delete(url)
  }
  for (const url of followed) {
    if (subscriptions.has(url)) continue
    subscriptions.set(
      url,
      window.elecdex.feeds.subscribe(url, (update) => receive(url, update)),
    )
  }
  // Forget feeds no longer listed; their items must not linger in memory.
  untrack(() => {
    // Only when one goes: a new object each time the pane is shown or hidden recomputed every
    // list derived from it for nothing (found in review).
    if (Object.keys(updates).some((url) => !urls.has(url)))
      updates = Object.fromEntries(Object.entries(updates).filter(([url]) => urls.has(url)))
    for (const url of trackers.keys()) if (!urls.has(url)) trackers.delete(url)
    if (only !== null && !urls.has(only)) only = null
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

/**
 * The last look: the LAST SEEN line marks where the list stood when the pane was last shown.
 * As the pane comes into view the previous look is read and this one written, so the line is
 * about the previous look, never this one. Written as a look begins, never as it ends: a pane
 * writing its state while it is closed held the close up (the pane stayed), found by the e2e.
 */
let lastLook = $state<number | null>(null)
$effect(() => {
  if (!visible) return
  untrack(() => {
    lastLook = paneSeenAt(paneState?.seenAt)
    if (feeds.length > 0) widgetState.patch(paneId, { seenAt: Date.now() })
  })
})

/** The updates of the listed feeds, in list order. */
const listedUpdates = (from: Record<string, FeedUpdate>): FeedUpdate[] =>
  feeds.map((url) => from[url]).filter((u) => u !== undefined)

const received = $derived(listedUpdates(updates))
const titles = $derived(Object.fromEntries(received.map((u) => [u.url, u.title])))
const marks = $derived(feedMarks(feeds, stored, titles))
/** The feeds the chips leave: all, or the one chosen. */
const narrowed = (from: FeedUpdate[]): FeedUpdate[] =>
  only === null ? from : from.filter((u) => u.url === only)
const shown = $derived(mergeFeeds(narrowed(received), undefined, keepItem))
/** Every listed item, before the chips and the search: what the bar counts. */
const everything = $derived(mergeFeeds(received, Number.POSITIVE_INFINITY, () => true))
const mutedCount = $derived(everything.filter((item) => isMuted(item, mute)).length)
const unreadCount = $derived(
  mergeFeeds(received, undefined, (item) => !isMuted(item, mute)).filter((item) => !item.read)
    .length,
)
/**
 * Whether MARK ALL READ has anything to do: it reads what is shown, so it asks the list as
 * shown, not the bar's count - narrowed to a feed read through, it pressed and did nothing
 * (found in review).
 */
const shownUnread = $derived(shown.some((item) => !item.read))
const article = $derived(
  openKey === null
    ? null
    : (shown.find((i) => i.key === openKey) ?? everything.find((i) => i.key === openKey) ?? null),
)
// The article's headline gone from every feed (the twenty move on): nothing is open any more,
// so TICKER, which waits while one is, goes on again (found in review).
$effect(() => {
  if (openKey !== null && article === null) openKey = null
})

/**
 * Whether a feed listed has yet to answer with a download or a failure. Main answers a
 * subscription at once with what it has, often nothing yet (fetchedAt null): counted as an
 * answer, that said "nothing matches" through the first fetch (found in review). The lamps wait
 * the same way: a first fetch that failed is the warning colour, not a lamp still waiting.
 */
const waiting = $derived(
  feeds.some((url) => {
    const update = updates[url]
    return update === undefined || (update.fetchedAt === null && update.error === null)
  }),
)

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
  const time = latest ? clockTime(latest) : null
  const failing = received.filter((u) => u.error !== null).length
  const count = `${feeds.length} ${feeds.length === 1 ? 'feed' : 'feeds'}`
  const parts = [count, time ? `updated ${time}` : null, failing > 0 ? `${failing} failing` : null]
  paneMeta.set(paneId, {
    subtitle: parts.filter((p) => p !== null).join(' · '),
    ...(failing > 0 ? { badge: 'stale', badgeKind: 'warn' as const } : {}),
  })
})

/* ---- Choices ---- */

function setView(next: FeedView, button: HTMLElement): void {
  if (next === view && !settingsOpen) return
  afterBlink(button, () => {
    sfx.play('panel')
    settingsOpen = false
    // An article open goes with the view it came from: its way back was a row of that view,
    // and TICKER, which waits while one is open, stood still under it (found in review).
    openKey = null
    cameFrom = null
    fresh = new Set()
    // LIST comes back at its top, so what the pill counted is in sight (found in review).
    above.clear()
    // TICKER shows neither the chips nor the find box, so it keeps none of their narrowing:
    // a search left from LIST would empty it with no way to see why (found in review).
    if (next === 'ticker') {
      only = null
      find = ''
    }
    widgetState.patch(paneId, { view: next === 'list' ? undefined : next })
  })
}

function setOnly(next: string | null, button: HTMLElement): void {
  afterBlink(button, () => {
    sfx.play('panel')
    only = next
  })
}

/**
 * Escape empties a search typed, as a search field does, before the pane is put back or its
 * popup closed (lib/escape-owner.ts): those went first, the search staying (found in review).
 */
function onFindKey(event: KeyboardEvent): void {
  if (composing(event)) return
  if (event.key !== 'Escape' || find === '') return
  event.stopPropagation()
  find = ''
}

function toggleSettings(): void {
  sfx.play(settingsOpen ? 'collapse' : 'expand')
  openKey = null
  if (!settingsOpen) tab = 'feeds'
  settingsOpen = !settingsOpen
}

/* ---- The article ---- */

/** The headlines opened since the article was opened from the list, read here (for step). */
let openedHere = new Set<string>()

function pick(item: ShownItem, row: HTMLElement): void {
  afterBlink(row, () => {
    sfx.play('expand')
    cameFrom = row
    openKey = item.key
    openedHere = new Set([item.key])
    if (!item.read) void window.elecdex.feeds.markRead(item.feed, item.key, true)
  })
}

/** The arrow keys in the article: the next or previous headline of the list as shown. */
function step(by: -1 | 1): void {
  // Over the list as shown, but for the headlines opened since the article was, which UNREAD
  // drops as they are read: the place is not lost. Not over every read headline: those read
  // before, which the list hides, opened one after another (found in review).
  const list = mergeFeeds(narrowed(received), Number.POSITIVE_INFINITY, (item) =>
    keepItem(item, false),
  )
    .filter((item) => !unreadOnly || !item.read || openedHere.has(item.key))
    .slice(0, FEED_MAX_SHOWN)
  const at = list.findIndex((item) => item.key === openKey)
  const next = at === -1 ? undefined : list[at + by]
  if (next === undefined) return
  sfx.play('panel')
  openKey = next.key
  openedHere.add(next.key)
  // The keyboard comes back to the row of the article last shown, if the list has it.
  cameFrom =
    [...(root?.querySelectorAll<HTMLElement>('[data-testid=rss-item]') ?? [])].find(
      (row) => row.dataset.key === next.key,
    ) ?? cameFrom
  if (!next.read) void window.elecdex.feeds.markRead(next.feed, next.key, true)
}

function toggleUnreadOnly(button: HTMLElement): void {
  afterBlink(button, () => {
    sfx.play('panel')
    widgetState.patch(paneId, { unreadOnly: unreadOnly ? undefined : true })
  })
}

/** Every headline shown that is not read yet, read at once (in every pane). */
function markAllRead(button: HTMLElement): void {
  const entries = shown
    .filter((item) => !item.read)
    .map((item) => ({ feed: item.feed, key: item.key }))
  if (entries.length === 0) return
  afterBlink(button, () => {
    sfx.play('folder')
    void window.elecdex.feeds.markAllRead(entries)
  })
}

/** A lamp's tooltip: the feed, and why it fails when it does. */
function lampTitle(url: string): string {
  const update = updates[url]
  const name = update?.title ?? url
  return update?.error ? `${name} - ${update.error}` : name
}

let root = $state<HTMLElement | null>(null)

function closeArticle(): void {
  sfx.play('collapse')
  openKey = null
  const back = cameFrom
  cameFrom = null
  // The row may have gone (redrawn, filtered); then the list keeps the keyboard.
  if (back?.isConnected) back.focus({ preventScroll: true })
}

/** The article as text for another pane: its headline, its summary, and where it is. */
function articleText(item: ShownItem): string {
  return [item.title, item.summary, item.link]
    .filter((part) => part !== undefined && part !== null)
    .join('\n\n')
}

/* ---- The list of feeds ---- */

function patchFeeds(next: string[], nextMarks: Record<string, StoredMark>): void {
  widgetState.patch(paneId, {
    feeds: next,
    marks: Object.keys(nextMarks).length > 0 ? nextMarks : undefined,
  })
}

/** Adds feeds not listed yet, each with a free turn of the colour wheel; says why some could not be. */
function addFeeds(list: NewFeed[]): string | null {
  const next = [...feeds]
  const nextMarks = { ...stored }
  let refused = 0
  for (const feed of list) {
    if (next.includes(feed.url)) continue
    if (next.length >= FEED_MAX_URLS) {
      refused += 1
      continue
    }
    next.push(feed.url)
    const taken = next
      .map((url) => nextMarks[url]?.turn ?? marks[url]?.turn)
      .filter((t): t is number => t !== undefined)
    nextMarks[feed.url] = { turn: freeTurn(taken) }
  }
  if (next.length !== feeds.length) patchFeeds(next, nextMarks)
  return refused > 0 ? `up to ${FEED_MAX_URLS} feeds: ${refused} not added` : null
}

function removeFeed(url: string): void {
  const nextMarks = { ...stored }
  delete nextMarks[url]
  patchFeeds(
    feeds.filter((u) => u !== url),
    nextMarks,
  )
}

function moveFeed(url: string, by: -1 | 1): void {
  const at = feeds.indexOf(url)
  const to = at + by
  if (at < 0 || to < 0 || to >= feeds.length) return
  const next = [...feeds]
  next.splice(at, 1)
  next.splice(to, 0, url)
  // Every listed feed keeps the turn it shows now, so moving one recolours nothing.
  const nextMarks: Record<string, StoredMark> = {}
  for (const u of next) {
    const mark = marks[u]
    if (mark === undefined) continue
    const tag = stored[u]?.tag
    nextMarks[u] = tag === undefined ? { turn: mark.turn } : { tag, turn: mark.turn }
  }
  patchFeeds(next, nextMarks)
}

function setTag(url: string, raw: string): void {
  const mark = marks[url]
  if (mark === undefined) return
  const tag = cleanTag(raw)
  patchFeeds(feeds, {
    ...stored,
    [url]: tag === null ? { turn: mark.turn } : { tag, turn: mark.turn },
  })
}

function setWords(kind: 'highlight' | 'mute', words: string[]): void {
  widgetState.patch(paneId, { [kind]: words.length > 0 ? words : undefined })
}

const VIEWS: Array<[FeedView, string]> = [
  ['list', 'list'],
  ['card', 'card'],
  ['ticker', 'ticker'],
]
</script>

<div class="rss" bind:this={root} data-testid="rss">
  {#if feeds.length > 0}
    <div class="top">
      <span class="lamps" aria-label="feeds" data-testid="rss-lamps">
        {#each feeds as url (url)}
          {@const update = updates[url]}
          <i class:warn={update?.error != null} class:wait={update === undefined || (update.fetchedAt === null && update.error === null)} title={lampTitle(url)}></i>
        {/each}
      </span>
      <span class="figure"><small>unread</small><span class="a" data-testid="rss-unread">{unreadCount}</span></span>
      <span class="figure wide"><small>muted</small><span class="z" data-testid="rss-muted">{mutedCount}</span></span>
      <span class="spacer"></span>
      {#if !settingsOpen}
        <button type="button" class="tool" aria-pressed={unreadOnly} onclick={(e) => toggleUnreadOnly(e.currentTarget)} title="only the headlines not yet read" data-testid="rss-unread-only">unread</button>
        <button type="button" class="tool" disabled={!shownUnread} onclick={(e) => markAllRead(e.currentTarget)} title="mark every headline shown read" data-testid="rss-mark-all-read">mark all read</button>
      {/if}
      {#if view !== 'ticker' && !settingsOpen}
        <!-- A search going on keeps its box, however narrow the pane: else the list is short for no reason seen (found in review). -->
        <span class="find-box" class:active={find.trim() !== ''}>
          <input class="find" class:active={find.trim() !== ''} bind:value={find} placeholder="find…" spellcheck="false" aria-label="find in headlines" data-owns-escape={find !== '' || undefined} onkeydown={onFindKey} data-testid="rss-search" />
          {#if find.trim() !== ''}
            <button type="button" class="clear" aria-label="clear the search" onclick={() => (find = '')} data-testid="rss-search-clear">×</button>
          {/if}
        </span>
      {/if}
      <span class="seg" role="radiogroup" aria-label="view">
        {#each VIEWS as [id, label] (id)}
          <button type="button" role="radio" aria-checked={view === id && !settingsOpen} onclick={(e) => setView(id, e.currentTarget)} data-testid="rss-view-{id}">{label}</button>
        {/each}
      </span>
    </div>
    <!-- With no feeds the settings are the pane itself: an icon there would do nothing (found in review). -->
    <SettingsButton
      open={settingsOpen}
      label="rss settings"
      testid="rss-settings-toggle"
      ontoggle={toggleSettings}
    />
  {/if}

  {#if feeds.length === 0 || settingsOpen}
    <RssSettings
      {paneId}
      first={feeds.length === 0}
      {feeds}
      {updates}
      {marks}
      tags={Object.fromEntries(Object.entries(stored).map(([url, mark]) => [url, mark.tag]))}
      highlight={highlightWords}
      mute={muteWords}
      {tab}
      ontab={(next) => {
        sfx.play('panel')
        tab = next
      }}
      onadd={addFeeds}
      onremove={removeFeed}
      onmove={moveFeed}
      ontag={setTag}
      onwords={setWords}
    />
  {:else}
    {#if view !== 'ticker' && feeds.length > 1}
      <div class="chips" role="radiogroup" aria-label="feeds shown" data-testid="rss-chips">
        <button type="button" role="radio" class="chip" aria-checked={only === null} onclick={(e) => setOnly(null, e.currentTarget)} data-testid="rss-chip">all</button>
        {#each feeds as url (url)}
          {@const update = updates[url]}
          <button
            type="button"
            role="radio"
            class="chip"
            class:stale={update?.error != null}
            aria-checked={only === url}
            onclick={(e) => setOnly(only === url ? null : url, e.currentTarget)}
            data-feed={url}
            data-testid="rss-chip"
          ><FeedMark mark={marks[url] ?? { tag: '··', turn: 0 }} /><span>{update?.title ?? feedHost(url)}</span></button>
        {/each}
      </div>
    {/if}
    <div class="body">
      {#if shown.length === 0}
        <p class="note" data-testid="rss-status">
          {#if failure !== null}could not read the feeds: {failure}
          {:else if waiting && everything.length === 0}fetching feeds…
          {:else}nothing matches{/if}
        </p>
      {:else}
        {#key view}
          <div class="view crt-on" data-testid="rss-view">
            {#if view === 'list'}
              <RssList items={shown} {marks} now={clock} seenAt={lastLook} {fresh} selected={openKey} {highlight} {find} {above} onpick={pick} onsettled={settled} />
            {:else if view === 'card'}
              <RssCards items={shown} {marks} now={clock} selected={openKey} {highlight} {find} onpick={pick} />
            {:else}
              <RssTicker items={shown} {marks} now={clock} running={visible && openKey === null} {highlight} {find} onpick={pick} />
            {/if}
          </div>
        {/key}
      {/if}
      {#if article !== null}
        <!-- Keyed: another headline's article is a new one, and takes the keyboard (with Escape)
             from the row clicked, as the first did (found in review). -->
        {#key article.key}
        <RssArticle
          item={article}
          mark={marks[article.feed] ?? { tag: '··', turn: 0 }}
          {highlight}
          {find}
          onclose={closeArticle}
          onopen={() => {
            if (article.link !== null) void window.elecdex.system.openExternal(article.link)
          }}
          ontranslate={() => void handOver('translate', articleText(article))}
          onask={() => void handOver('aichat', `Summarise this article in a few lines.\n\n${articleText(article)}`)}
          onread={(read) => void window.elecdex.feeds.markRead(article.feed, article.key, read)}
          onstep={step}
        />
        {/key}
      {/if}
    </div>
  {/if}
</div>

<style>
.rss {
  container: rss / inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  height: 100%;
  min-height: 0;
  padding: var(--space-1);
  font-family: var(--font-ui);
}

.top {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
  padding-right: 1.7rem;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.lamps {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.lamps i {
  width: 0.45rem;
  height: 0.45rem;
  transform: rotate(45deg);
  background: var(--ok);
  box-shadow: 0 0 calc(var(--glow) * 0.4rem) var(--ok);
}

.lamps i.warn {
  background: var(--warn);
  box-shadow: 0 0 calc(var(--glow) * 0.4rem) var(--warn);
}

.lamps i.wait {
  background: transparent;
  outline: 1px solid var(--text-muted);
  box-shadow: none;
}

.figure {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.figure small {
  color: var(--text-muted);
  font-size: var(--step--2);
}

.figure span {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0;
  text-transform: none;
}

.figure .a {
  color: var(--accent-strong);
}

.figure .z {
  color: var(--text-muted);
}

.spacer {
  flex: 1;
}

.find {
  width: 8rem;
  min-width: 0;
  padding: 0 0.2rem;
  border: 0;
  border-bottom: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0;
  text-transform: none;
  outline: none;
}

.find:focus {
  border-color: var(--accent);
}

.find::placeholder {
  color: var(--text-muted);
}

.seg {
  display: flex;
}

.seg button {
  margin-left: -1px;
  padding: 0 0.45rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.seg button[aria-checked="true"] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

@container rss (max-width: 30rem) {
  .figure.wide,
  .find-box:not(.active),
  .tool:not([aria-pressed="true"]) {
    display: none;
  }
}

.find-box {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.find.active {
  border-color: var(--accent);
}

.clear,
.tool {
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.clear {
  padding: 0 0.3rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

.tool {
  padding: 0 0.45rem;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.tool[aria-pressed="true"] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

.tool:disabled {
  cursor: default;
  opacity: 0.45;
}

.chips {
  display: flex;
  flex: none;
  gap: 0.25rem;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 0.05rem;
}

.chip {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.35rem;
  max-width: 14rem;
  padding: 0 0.45rem 0 0;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
  clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%);
}

.chip:first-child {
  padding-left: 0.45rem;
}

.chip span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.chip :global([data-testid="rss-mark"]) {
  width: auto;
  padding: 0 0.25rem;
  border-width: 0 1px 0 0;
}

.chip[aria-checked="true"] {
  border-color: var(--accent-dim);
  background: var(--accent-faint);
  color: var(--text);
}

.chip.stale span {
  color: var(--warn);
}

.body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--panel-rule);
}

.view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  transform-origin: 50% 0;
}

.note {
  margin: 0.4rem 0 0;
  color: var(--text-muted);
  font-size: var(--step--1);
}
</style>
