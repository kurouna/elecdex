<script lang="ts">
import { FEED_PACKS, type FeedPackEntry } from '@shared/feed-packs'
import { FEED_MAX_URLS, type FeedUpdate } from '@shared/feeds'
import type { DiscoveredFeed } from '@shared/feeds-discover'
import { discoverTarget } from '@shared/feeds-discover'
import { MARK_TAG_MAX, type FeedMark as Mark, WORDS_MAX } from '@shared/feeds-view'
import { untrack } from 'svelte'
import { afterBlink } from '../../lib/blink.ts'
import { keepTyped, recallTyped } from '../../lib/pane-memory.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import FeedMark from './FeedMark.svelte'

/**
 * The RSS pane's settings, in four tabs (docs/rss-mock): FEEDS lists what the pane reads, with
 * each feed's state, order, tag and removal; ADD finds feeds from a site, a feed, `github:` or
 * `youtube:` (main fetches the page only on FIND) and moves feeds in and out as OPML; PACKS
 * offers starter feeds; KEYWORDS lights or mutes words in headlines. With no feeds yet the
 * pane shows ADD and PACKS alone (`first`), so a first look is a way in, not a blank.
 */
export type SettingsTab = 'feeds' | 'add' | 'packs' | 'keywords'

export interface NewFeed {
  url: string
  title: string
}

interface Props {
  paneId: string
  first: boolean
  feeds: string[]
  updates: Record<string, FeedUpdate>
  marks: Record<string, Mark>
  /** The tags the user wrote, by feed; a feed without one shows its title's as a placeholder. */
  tags: Record<string, string | undefined>
  highlight: string[]
  mute: string[]
  tab: SettingsTab
  ontab: (tab: SettingsTab) => void
  /** Adds feeds; answers why some could not be (the limit), or null. */
  onadd: (feeds: NewFeed[]) => string | null
  onremove: (url: string) => void
  onmove: (url: string, by: -1 | 1) => void
  ontag: (url: string, tag: string) => void
  onwords: (kind: 'highlight' | 'mute', words: string[]) => void
}

const {
  paneId,
  first,
  feeds,
  updates,
  marks,
  tags,
  highlight,
  mute,
  tab,
  ontab,
  onadd,
  onremove,
  onmove,
  ontag,
  onwords,
}: Props = $props()

const fallback: Mark = { tag: '··', turn: 0 }

/* ---- ADD ---- */

// What was typed is kept through a move, which remounts the pane (lib/pane-memory.ts).
let input = $state(untrack(() => recallTyped(paneId, 'feed')))
$effect(() => keepTyped(paneId, 'feed', input))
let finding = $state(false)
let found = $state.raw<DiscoveredFeed[]>([])
let foundFor = $state('')
let problem = $state<string | null>(null)

async function find(): Promise<void> {
  const text = input.trim()
  if (text === '' || finding) return
  if (discoverTarget(text) === null) {
    problem = 'not a site, feed URL, github:owner/repo or youtube:@handle'
    found = []
    return
  }
  finding = true
  problem = null
  found = []
  try {
    const result = await window.elecdex.feeds.discover(text)
    if (result.ok) {
      found = result.feeds
      foundFor = text
      sfx.play('granted')
    } else {
      problem = result.error
    }
  } catch (error) {
    problem = error instanceof Error ? error.message : String(error)
  } finally {
    finding = false
  }
}

function add(list: NewFeed[]): void {
  problem = onadd(list)
  if (problem === null) sfx.play('folder')
}

/** A pack's entry as a feed: `github:` names become their releases feed. */
function packFeed(entry: FeedPackEntry): NewFeed | null {
  const target = discoverTarget(entry.url)
  return target === null ? null : { url: target.url, title: entry.name }
}

const listed = (url: string | undefined) => url !== undefined && feeds.includes(url)

/* ---- OPML ---- */

let opmlNote = $state<string | null>(null)

async function importOpml(): Promise<void> {
  opmlNote = null
  const answer = await window.elecdex.feeds.importOpml().catch((error: unknown) => ({
    ok: false as const,
    error: error instanceof Error ? error.message : String(error),
  }))
  if (answer === null) return
  if (!answer.ok) {
    opmlNote = `could not read it: ${answer.error}`
    return
  }
  const fresh = answer.feeds.filter((feed) => !feeds.includes(feed.url))
  const room = Math.max(0, FEED_MAX_URLS - feeds.length)
  const taken = fresh.slice(0, room)
  if (taken.length > 0) onadd(taken)
  const left = fresh.length - taken.length
  opmlNote =
    fresh.length === 0
      ? `nothing new in it (${answer.feeds.length} listed)`
      : `added ${taken.length}${left > 0 ? ` · ${left} left out, up to ${FEED_MAX_URLS} feeds` : ''}`
}

async function exportOpml(): Promise<void> {
  opmlNote = null
  const list = feeds.map((url) => ({ url, title: updates[url]?.title ?? new URL(url).hostname }))
  try {
    const path = await window.elecdex.feeds.exportOpml(list)
    if (path !== null) opmlNote = `saved ${path}`
  } catch (error) {
    // A folder that cannot be written to says so here, not as a fault of the pane.
    opmlNote = `could not save it: ${error instanceof Error ? error.message : String(error)}`
  }
}

/* ---- KEYWORDS ---- */

let words = $state({ highlight: '', mute: '' })
function addWord(kind: 'highlight' | 'mute'): void {
  const word = words[kind].trim()
  if (word === '') return
  const list = kind === 'highlight' ? highlight : mute
  if (list.length >= WORDS_MAX || list.some((w) => w.toLowerCase() === word.toLowerCase())) return
  onwords(kind, [...list, word])
  words[kind] = ''
}

/* ---- FEEDS ---- */

function feedState(url: string): { tone: 'ok' | 'warn' | 'wait'; text: string } {
  const update = updates[url]
  if (update === undefined || update.fetchedAt === null) {
    return update?.error ? { tone: 'warn', text: update.error } : { tone: 'wait', text: 'waiting' }
  }
  if (update.error !== null) return { tone: 'warn', text: update.error }
  const d = new Date(update.fetchedAt)
  return {
    tone: 'ok',
    text: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  }
}

const TABS: Array<[SettingsTab, string]> = [
  ['feeds', 'feeds'],
  ['add', 'add'],
  ['packs', 'packs'],
  ['keywords', 'keywords'],
]
</script>

{#snippet wordList(kind: 'highlight' | 'mute', list: string[], note: string)}
  <h5>{kind} <em>{list.length}</em></h5>
  <div class="kwrow">
    {#each list as word (word)}
      <span class="kw" class:mute={kind === 'mute'} data-testid="rss-word">{word}<button type="button" aria-label="remove {word}" onclick={() => onwords(kind, list.filter((w) => w !== word))}>×</button></span>
    {/each}
    <form
      onsubmit={(e) => {
        e.preventDefault()
        addWord(kind)
      }}
    >
      <input bind:value={words[kind]} placeholder="add a word…" spellcheck="false" aria-label="add a word to {kind}" data-testid="rss-word-input-{kind}" />
    </form>
  </div>
  <p class="hint">In titles, any case, {note}. A Latin word matches only whole.</p>
{/snippet}

<div class="set crt-on" data-testid="rss-settings">
  {#if first}
    <div class="hero" data-testid="rss-empty">
      <b>no feeds</b>
      <span>paste a site, or start from a pack</span>
    </div>
  {:else}
    <div class="tabs" role="tablist" aria-label="rss settings">
      {#each TABS as [id, label] (id)}
        <button
          type="button"
          role="tab"
          aria-selected={tab === id}
          onclick={(e) => afterBlink(e.currentTarget, () => ontab(id))}
          data-testid="rss-tab-{id}"
        >{label}{#if id === 'feeds'}<em>{feeds.length}</em>{:else if id === 'keywords'}<em>{highlight.length + mute.length}</em>{/if}</button>
      {/each}
    </div>
  {/if}

  <div class="sc">
    {#if first || tab === 'add'}
      <form
        class="addline"
        onsubmit={(e) => {
          e.preventDefault()
          afterBlink(e.currentTarget.querySelector('button'), () => void find())
        }}
      >
        <input
          bind:value={input}
          spellcheck="false"
          placeholder="site or feed URL, github:owner/repo, youtube:@handle"
          aria-label="site or feed to add"
          data-testid="rss-add-input"
        />
        <button type="submit" class="act primary" disabled={finding} data-testid="rss-find">{finding ? 'finding…' : 'find'}</button>
      </form>
      <p class="hint" class:problem={problem !== null} data-testid="rss-problem">
        {#if problem !== null}{problem}{:else}A site's feeds are found from its page. Also <code>github:owner/repo</code> (releases) and <code>youtube:@handle</code> (uploads). Nothing is fetched until FIND.{/if}
      </p>
      {#if found.length > 0}
        <div class="found crt-on" data-testid="rss-found">
          <p class="lbl">found for <b>{foundFor}</b></p>
          {#each found as feed (feed.url)}
            <div class="cand" data-testid="rss-candidate">
              <span class="k">{feed.format}</span>
              <span class="nm"><b>{feed.title}</b><small>{feed.url}</small></span>
              {#if listed(feed.url)}
                <span class="mini on">added</span>
              {:else}
                <button type="button" class="mini" onclick={(e) => afterBlink(e.currentTarget, () => add([{ url: feed.url, title: feed.title }]))} data-testid="rss-candidate-add">add</button>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
      <!-- On the first look too: someone moving from another reader starts with its list. -->
      <h5>opml</h5>
      <div class="row-btns">
        <button type="button" class="act" onclick={(e) => afterBlink(e.currentTarget, () => void importOpml())} data-testid="rss-opml-import">import opml…</button>
        {#if !first}
          <button type="button" class="act" disabled={feeds.length === 0} onclick={(e) => afterBlink(e.currentTarget, () => void exportOpml())} data-testid="rss-opml-export">export opml…</button>
        {/if}
      </div>
      <p class="hint" data-testid="rss-opml-note">{opmlNote ?? `Move from another reader: its OPML file lists every feed. Up to ${FEED_MAX_URLS} are taken.`}</p>
    {/if}

    {#if first || tab === 'packs'}
      {#if first}<h5>packs</h5>{/if}
      <p class="hint">Each publisher's own feed. ADD ALL takes a pack up to {FEED_MAX_URLS} feeds in all.</p>
      <div class="packs">
        {#each FEED_PACKS as pack (pack.id)}
          {@const entries = pack.feeds.map((entry) => ({ entry, feed: packFeed(entry) }))}
          <section class="pack" data-testid="rss-pack">
            <h4>{pack.name}<small>{pack.note} · {pack.feeds.length}</small>
              <button
                type="button"
                class="mini"
                disabled={entries.every(({ feed }) => listed(feed?.url))}
                onclick={(e) => afterBlink(e.currentTarget, () => add(entries.flatMap(({ feed }) => (feed === null || listed(feed.url) ? [] : [feed]))))}
                data-testid="rss-pack-add-all"
              >add all</button>
            </h4>
            <ul>
              {#each entries as { entry, feed } (entry.url)}
                <li>
                  <span>{entry.name}</span>
                  {#if listed(feed?.url)}
                    <span class="mini on">added</span>
                  {:else if feed !== null}
                    <button type="button" class="mini" aria-label="add {entry.name}" onclick={(e) => afterBlink(e.currentTarget, () => add([feed]))} data-testid="rss-pack-add">+</button>
                  {/if}
                </li>
              {/each}
            </ul>
          </section>
        {/each}
      </div>
    {/if}

    {#if !first && tab === 'feeds'}
      {#if feeds.length === 0}
        <p class="hint">No feeds. ADD or PACKS brings some in.</p>
      {/if}
      {#each feeds as url, i (url)}
        {@const s = feedState(url)}
        <div class="frow" data-testid="rss-feed-row">
          <FeedMark mark={marks[url] ?? fallback} />
          <span class="nm"><b>{updates[url]?.title ?? new URL(url).hostname}</b><small>{url}</small></span>
          <span class="st {s.tone}" title={s.text}><i></i>{s.tone === 'ok' ? 'ok' : s.tone === 'warn' ? 'stale' : 'wait'} <small>{s.text}</small></span>
          <span class="ops">
            <input
              class="tag"
              value={tags[url] ?? ''}
              placeholder={marks[url]?.tag ?? ''}
              maxlength={MARK_TAG_MAX}
              spellcheck="false"
              aria-label="tag for {updates[url]?.title ?? url}"
              onchange={(e) => ontag(url, e.currentTarget.value)}
              data-testid="rss-tag"
            />
            <button type="button" class="mini" disabled={i === 0} aria-label="move up" onclick={() => onmove(url, -1)} data-testid="rss-feed-up">↑</button>
            <button type="button" class="mini" disabled={i === feeds.length - 1} aria-label="move down" onclick={() => onmove(url, 1)} data-testid="rss-feed-down">↓</button>
            <button type="button" class="mini" aria-label="remove" onclick={(e) => afterBlink(e.currentTarget, () => onremove(url))} data-testid="rss-feed-remove">×</button>
          </span>
        </div>
      {/each}
      <p class="hint">Up to {FEED_MAX_URLS} feeds, each checked every 15 minutes (less often when it asks) while this pane is shown. The tag is the mark's text: up to {MARK_TAG_MAX} characters, empty for one from the feed's title.</p>
    {/if}

    {#if !first && tab === 'keywords'}
      {@render wordList('highlight', highlight, 'lit in every view')}
      {@render wordList('mute', mute, 'hidden, and counted in the bar')}
    {/if}
  </div>
</div>

<style>
.set {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  transform-origin: 50% 0;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.8rem 0 0.4rem;
  text-align: center;
}

.hero b {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: var(--step-1);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--accent-strong);
  text-shadow: 0 0 calc(var(--glow) * 0.5rem) var(--accent);
}

.hero span {
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.tabs {
  display: flex;
  gap: 0.2rem;
  border-bottom: 1px solid var(--panel-rule);
}

.tabs button {
  padding: 0.05rem 0.7rem;
  border: 1px solid var(--panel-rule);
  border-bottom: 0;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.tabs button[aria-selected="true"] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

.tabs em,
h5 em {
  margin-left: 0.3rem;
  font-style: normal;
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

.sc {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.4rem 0.1rem;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

h5 {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0.7rem 0 0.25rem;
  font-size: var(--step--2);
  font-weight: 400;
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-muted);
}

h5::after {
  content: "";
  flex: 1;
  border-top: 1px solid var(--panel-rule);
}

.addline {
  display: flex;
  gap: 0.35rem;
  max-width: 40rem;
}

input {
  min-width: 0;
  padding: 0.15rem 0.45rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  outline: none;
}

input:focus {
  border-color: var(--accent);
}

input::placeholder {
  color: var(--text-muted);
}

.addline input {
  flex: 1;
}

.hint {
  margin: 0.3rem 0 0.4rem;
  font-size: var(--step--2);
  line-height: 1.5;
  color: var(--text-muted);
}

.hint.problem {
  color: var(--warn);
}

.hint code {
  font-family: var(--font-mono);
  color: var(--text);
}

.act,
.mini {
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.act {
  padding: 0.05rem 0.6rem;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.mini {
  padding: 0 0.35rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

.act:hover:not(:disabled),
button.mini:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
}

.act:disabled,
.mini:disabled {
  cursor: default;
  opacity: 0.45;
}

.act.primary:not(:disabled),
.mini.on {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

.row-btns {
  display: flex;
  gap: 0.3rem;
}

.found {
  max-width: 40rem;
  padding: 0.35rem 0.45rem;
  border: 1px solid var(--accent-dim);
  background: var(--accent-faint);
  transform-origin: 50% 0;
}

.lbl {
  margin: 0 0 0.25rem;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.lbl b {
  font-family: var(--font-mono);
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
  color: var(--text);
}

.cand {
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr) auto;
  gap: 0.5rem;
  align-items: center;
  padding: 0.15rem 0;
}

.k {
  border: 1px solid var(--panel-rule);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  text-align: center;
}

.nm {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.nm b {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: var(--step--1);
  font-weight: 500;
}

.nm small {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.packs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 0.45rem;
}

.pack {
  position: relative;
  padding: 0.35rem 0.5rem 0.45rem;
  border: 1px solid var(--panel-rule);
}

.pack::before {
  content: "";
  position: absolute;
  left: -1px;
  top: -1px;
  width: 0.4rem;
  height: 0.4rem;
  border: solid var(--accent);
  border-width: 1px 0 0 1px;
}

.pack h4 {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin: 0 0 0.25rem;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: var(--step-0);
  letter-spacing: 0.05em;
}

.pack h4 small {
  flex: 1;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.pack ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.pack li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.06rem 0;
  font-size: var(--step--1);
}

.pack li span:first-child {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.frow {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 6.5rem auto;
  gap: 0.55rem;
  align-items: center;
  padding: 0.25rem 0.1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--panel-rule) 40%, transparent);
}

.st {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.st i {
  flex: none;
  width: 0.4rem;
  height: 0.4rem;
  transform: rotate(45deg);
  background: currentColor;
}

.st.ok {
  color: var(--ok);
}

.st.warn {
  color: var(--warn);
}

.st.wait {
  color: var(--text-muted);
}

.st small {
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-mono);
  letter-spacing: 0;
  text-transform: none;
  color: var(--text-muted);
}

.ops {
  display: flex;
  gap: 0.2rem;
  align-items: center;
}

.ops .tag {
  width: 3.2rem;
  text-transform: uppercase;
  text-align: center;
}

@container rss (max-width: 30rem) {
  .frow {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .st,
  .ops .tag {
    display: none;
  }
}

.kwrow {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: center;
}

.kw {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0 0.1rem 0 0.4rem;
  border: 1px solid var(--accent-dim);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

.kw.mute {
  border-style: dashed;
  color: var(--text-muted);
  text-decoration: line-through;
}

.kw button {
  padding: 0 0.2rem;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: var(--step--2);
  cursor: pointer;
}

.kwrow input {
  width: 10rem;
}
</style>
