<script lang="ts">
import { CLIP_MAX_ENTRIES, type ClipBoard, filterEntries } from '@shared/clipboard'
import { SNIPPET_LIMITS, type SnippetView } from '@shared/snippets'
import { flip } from 'svelte/animate'
import { onBoundary } from '../../lib/frame-loop.ts'
import { carryFresh, FreshTracker } from '../../lib/fresh.ts'
import { anchorOf, type CardAnchor, type CardSize, HoverRest } from '../../lib/hover-card.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import ClipCard from './ClipCard.svelte'
import ClipRow from './ClipRow.svelte'
import SnippetsView from './SnippetsView.svelte'

/**
 * What was copied lately, to put back on the clipboard (architecture.md §5.14).
 *
 * Main keeps the history and reads the clipboard only while a pane like this is
 * seen: this one subscribes only then, so behind another tab or with the
 * window put away nothing is read, and what was copied meanwhile is not in the
 * list. The history is main's memory, never a file. The page is given previews;
 * an entry is put back by its id, its HTML with it.
 *
 * Behind the switch at the top are the snippets (SnippetsView.svelte): texts
 * kept on purpose, from the history with SNIP or written by hand, in main's
 * snippets.json. The clipboard is read while either is on screen - the lamp
 * says so in both - so going back to the history misses nothing.
 */
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))

const masked = $derived(paneState?.mask === true)
type View = 'history' | 'snippets'
const view = $derived<View>(paneState?.view === 'snippets' ? 'snippets' : 'history')
const showView = (next: View): void =>
  widgetState.patch(paneId, { view: next === 'history' ? undefined : next })

let board = $state.raw<ClipBoard | null>(null)
let query = $state('')

/** Entries that arrived while the pane was watching, lit until their highlight ends. */
let fresh = $state.raw<ReadonlySet<string>>(new Set())
const tracker = new FreshTracker()

function receive(next: ClipBoard): void {
  const ids = next.entries.map((entry) => entry.id)
  fresh = carryFresh(fresh, tracker.next(ids), ids)
  board = next
}

$effect(() => (visible ? window.elecdex.clipboard.subscribe(receive) : undefined))

/**
 * The snippets, while seen: main's file, told again after every change. A change
 * that arrives before the first list is newer than it, and the list is dropped.
 */
let snippets = $state.raw<SnippetView[] | null>(null)
$effect(() => {
  if (!visible) return
  let told = false
  const off = window.elecdex.snippets.onChange((next) => {
    told = true
    snippets = next
  })
  void window.elecdex.snippets.list().then((list) => {
    if (!told) snippets = list
  })
  return off
})

/** The time the ages are counted to: a minute's steps, only while seen. */
let now = $state(Date.now())
$effect(() => {
  if (!visible) return
  now = Date.now()
  return onBoundary(60_000, () => {
    now = Date.now()
  })
})

const entries = $derived(board?.entries ?? [])
const shown = $derived(masked ? entries : filterEntries(entries, query))

$effect(() => {
  const count = entries.length
  const kept = snippets?.length ?? 0
  paneMeta.set(paneId, {
    subtitle:
      view === 'history'
        ? `${count} ${count === 1 ? 'entry' : 'entries'} · memory only`
        : `${kept} ${kept === 1 ? 'snippet' : 'snippets'} · snippets.json`,
    ...(board?.paused === true ? { badge: 'paused', badgeKind: 'warn' as const } : {}),
  })
})

/** The row just put back, saying so for a moment. */
let copied = $state<string | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | undefined
let problem = $state<string | null>(null)

async function restore(id: string): Promise<void> {
  const result = await window.elecdex.clipboard.restore(id)
  if (result !== 'ok') {
    problem = result === 'failed' ? 'the clipboard is busy: try again' : null
    return
  }
  problem = null
  sfx.play('folder')
  copied = id
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied = null
  }, 1500)
}

/**
 * SNIP keeps an entry as a snippet. The snippets' switch blinks to say where it
 * went; an entry already kept (its ★) goes there and points the snippet out.
 */
let flash = $state<string | null>(null)
let bumped = $state(false)
let bumpTimer: ReturnType<typeof setTimeout> | undefined

async function snip(id: string): Promise<void> {
  const result = await window.elecdex.snippets.fromClip(id)
  if ('error' in result) {
    problem =
      result.error === 'full'
        ? `${SNIPPET_LIMITS.snippets} snippets kept: delete one first`
        : result.error === 'not-kept'
          ? 'too long to have been kept whole: cannot be a snippet'
          : null
    return
  }
  problem = null
  flash = result.id
  if (!result.added) {
    showView('snippets')
    return
  }
  sfx.play('folder')
  bumped = false
  clearTimeout(bumpTimer)
  requestAnimationFrame(() => {
    bumped = true
    bumpTimer = setTimeout(() => {
      bumped = false
    }, 600)
  })
}

let snippetsView = $state<ReturnType<typeof SnippetsView> | null>(null)
let editorOpen = $state(false)

function remove(id: string): void {
  sfx.play('collapse')
  window.elecdex.clipboard.remove(id)
}

/**
 * CLEAR asks once more: the first press arms it for a few seconds, and says that
 * the clipboard is emptied too (without that, a text copied again after the
 * clear could not be told from the one left on it, and would not be listed).
 */
let armed = $state(false)
let armTimer: ReturnType<typeof setTimeout> | undefined

function clearPressed(): void {
  clearTimeout(armTimer)
  if (!armed) {
    armed = true
    armTimer = setTimeout(() => {
      armed = false
    }, 3000)
    return
  }
  armed = false
  sfx.play('glitch')
  window.elecdex.clipboard.clear()
}

$effect(() => () => {
  clearTimeout(copiedTimer)
  clearTimeout(armTimer)
  clearTimeout(bumpTimer)
})

/**
 * Going to the snippets ends the rows' highlight: their elements go, and the
 * highlight would otherwise play again, whole, on rows no longer new when the
 * history comes back. What arrives meanwhile is new when it does.
 */
$effect(() => {
  if (view !== 'history') fresh = new Set()
})

function settled(id: string, event: AnimationEvent): void {
  if (event.animationName !== 'fx-fresh' || !fresh.has(id)) return
  fresh = new Set([...fresh].filter((key) => key !== id))
}

/** Up and down move between rows; Delete takes the focused one out. */
function onListKey(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null
  const row = target?.closest<HTMLElement>('[data-testid="clip-row"]')
  // The rows' items are the list's children; the row is inside its item.
  const item = row?.closest('li')
  if (row == null || item == null) return
  const focusIn = (other: Element | null): void =>
    other?.querySelector<HTMLElement>('[data-testid="clip-entry"]')?.focus()
  if (event.key === 'Delete') {
    event.preventDefault()
    focusIn(item.nextElementSibling ?? item.previousElementSibling)
    remove(row.dataset.id ?? '')
    return
  }
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  event.preventDefault()
  focusIn(event.key === 'ArrowDown' ? item.nextElementSibling : item.previousElementSibling)
}

const lamp = $derived(
  board === null ? 'idle' : board.paused ? 'paused' : board.watching ? 'watching' : 'idle',
)
const STATE_WORDS = { watching: 'WATCHING', paused: 'PAUSED', idle: 'STANDBY' } as const

/**
 * The entry whose card is up, and where its row is (in the pane's own pixels).
 * The card waits for a moment's rest, so passing over the rows does not flash
 * one per row; the keyboard brings it at once. Masked, there is no card: it
 * would say what the mask hides.
 */
let rootEl = $state<HTMLElement | null>(null)
let hover = $state.raw<{ id: string; anchor: CardAnchor; bounds: CardSize } | null>(null)
const resting = new HoverRest<string>(() => (hover = null))

function onhover(id: string, event: { row: DOMRect; x: number | null } | null): void {
  if (event === null) {
    resting.leave(id)
    return
  }
  const show = (): void => {
    if (rootEl === null) return
    const box = rootEl.getBoundingClientRect()
    hover = {
      id,
      anchor: anchorOf(box, event.row, event.x),
      bounds: { width: box.width, height: box.height },
    }
  }
  resting.enter(id, show, event.x === null)
}

const hovered = $derived(
  hover === null || masked ? null : (entries.find((entry) => entry.id === hover?.id) ?? null),
)

// Put away, or the other view shown, the card goes with the pane's other moving parts.
$effect(() => {
  if (!visible || view !== 'history') resting.leave()
})
$effect(() => () => resting.dispose())

/** Rows show fewer lines when the pane is short. */
let height = $state(0)
const lines = $derived(height > 0 && height < 260 ? 1 : 3)
</script>

<div
  class="clip"
  data-testid="clipboard"
  data-pane-id={paneId}
  bind:clientHeight={height}
  bind:this={rootEl}
>
  <div class="modes">
    <button
      type="button"
      class:on={view === 'history'}
      aria-pressed={view === 'history'}
      onclick={() => showView('history')}
      data-testid="clip-view-history">history</button
    >
    <button
      type="button"
      class:on={view === 'snippets'}
      class:bumped
      aria-pressed={view === 'snippets'}
      onclick={() => showView('snippets')}
      data-testid="clip-view-snippets"
      >snippets{#if snippets !== null && snippets.length > 0}<span class="n" data-testid="clip-snippet-count">{snippets.length}</span>{/if}</button
    >
    <span class="state" data-state={lamp} data-testid="clip-state"><i></i>{STATE_WORDS[lamp]}</span>
  </div>

  <header class="top">
    {#if view === 'history'}
      <span class="count" data-testid="clip-count">{entries.length}<span class="of">/{CLIP_MAX_ENTRIES}</span></span>
    {:else}
      <span class="count" data-testid="snip-count">{snippets?.length ?? 0}<span class="of">/{SNIPPET_LIMITS.snippets}</span></span>
    {/if}
    <span class="tools">
      {#if view === 'history'}
      <button
        type="button"
        class="tool"
        class:on={board?.paused === true}
        aria-pressed={board?.paused === true}
        title="stop reading the clipboard until resumed"
        disabled={board === null}
        onclick={() => window.elecdex.clipboard.pause(board?.paused !== true)}
        data-testid="clip-pause">PAUSE</button
      >
      {/if}
      <button
        type="button"
        class="tool"
        class:on={masked}
        aria-pressed={masked}
        title="hide what the entries say"
        onclick={() => widgetState.patch(paneId, { mask: masked ? undefined : true })}
        data-testid="clip-mask">MASK</button
      >
      {#if view === 'snippets'}
        <button
          type="button"
          class="tool"
          disabled={snippets === null || snippets.length >= SNIPPET_LIMITS.snippets || editorOpen}
          title="write a snippet by hand"
          onclick={() => snippetsView?.create()}
          data-testid="snip-new">+ NEW</button
        >
      {:else}
      <button
        type="button"
        class="tool"
        class:armed
        disabled={entries.length === 0}
        title="empty the history, and the clipboard with it"
        onclick={clearPressed}
        onblur={() => (armed = false)}
        data-testid="clip-clear">{armed ? `CLEAR ${entries.length} + CLIPBOARD?` : 'CLEAR'}</button
      >
      {/if}
    </span>
  </header>

  {#if !masked && !(view === 'snippets' && editorOpen) && (view === 'history' ? entries.length : (snippets?.length ?? 0)) > 0}
    <input
      class="filter"
      type="search"
      placeholder="filter"
      spellcheck="false"
      aria-label={view === 'history' ? 'filter the history' : 'filter the snippets'}
      bind:value={query}
      data-testid="clip-filter"
    />
  {/if}

  {#if view === 'snippets'}
    {#if snippets === null}
      <p class="empty">…</p>
    {:else}
      <SnippetsView
        bind:this={snippetsView}
        {snippets}
        current={board?.snippet ?? null}
        {masked}
        {lines}
        {now}
        {query}
        root={rootEl}
        {flash}
        onflashed={() => (flash = null)}
        oneditor={(open) => (editorOpen = open)}
      />
    {/if}
  {:else if board === null}
    <p class="empty">…</p>
  {:else if entries.length === 0}
    <div class="empty" data-testid="clip-empty">
      <b>NO ENTRIES</b>
      <span>{board.paused ? 'paused: nothing is being read' : 'copy something: it appears here while this pane is on screen'}</span>
    </div>
  {:else if shown.length === 0}
    <div class="empty"><b>NOTHING MATCHES</b></div>
  {:else}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <ul class="list" onkeydown={onListKey} onscroll={() => resting.leave()} data-testid="clip-list">
      {#each shown as entry (entry.id)}
        <li
          class:fx-fresh={fresh.has(entry.id)}
          animate:flip={{ duration: appearance.reducedMotion ? 0 : 280 }}
          onanimationend={(e) => settled(entry.id, e)}
        >
          <ClipRow
            {entry}
            current={board.current === entry.id}
            {masked}
            {lines}
            {now}
            copied={copied === entry.id}
            onrestore={() => void restore(entry.id)}
            onsnip={() => void snip(entry.id)}
            onremove={() => remove(entry.id)}
            onhover={(event) => onhover(entry.id, event)}
          />
        </li>
      {/each}
    </ul>
  {/if}

  {#if view === 'history' && hovered !== null && hover !== null}
    <ClipCard
      entry={hovered}
      current={board?.current === hovered.id}
      {now}
      anchor={hover.anchor}
      bounds={hover.bounds}
    />
  {/if}

  <footer class="foot" data-testid="clip-foot">
    {#if problem !== null}
      <span class="problem" data-testid="clip-problem">{problem}</span>
    {:else if view === 'snippets'}
      <span>kept on disk in snippets.json · drag a number to move one</span>
    {:else}
      <span>kept in memory while elecdex runs · read only while shown</span>
    {/if}
    {#if view === 'history' && board !== null && board.skipped > 0}
      <span class="skipped" data-testid="clip-skipped"
        title="copies their application marked as private (a password manager's) are never read">
        {board.skipped} private {board.skipped === 1 ? 'copy' : 'copies'} left out</span
      >
    {/if}
  </footer>
</div>

<style>
.clip {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  height: 100%;
  min-height: 0;
  padding: var(--space-1);
  font-family: var(--font-ui);
}

.modes {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  min-width: 0;
}

.modes button {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.modes button:hover {
  color: var(--text);
}

.modes button.on {
  border-color: var(--accent);
  color: var(--accent-strong);
  background: var(--accent-faint);
}

.modes .n {
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
}

/* A snippet just kept from the history: the switch it went behind blinks, the launcher's way. */
.modes button.bumped {
  animation: snip-bump 100ms linear 6;
}

@keyframes snip-bump {
  50% {
    background: var(--accent);
    color: var(--text-inverse);
  }
}

.modes .state {
  margin-left: auto;
}

.top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  row-gap: 0.3rem;
  gap: 0.7rem;
  min-width: 0;
}

.state {
  --tone: var(--ok);
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  color: var(--tone);
}

.state[data-state="paused"] {
  --tone: var(--warn);
}

.state[data-state="idle"] {
  --tone: var(--text-muted);
}

.state i {
  width: 0.45rem;
  height: 0.45rem;
  transform: rotate(45deg);
  background: var(--tone);
  box-shadow: 0 0 calc(var(--glow) * 0.5rem) var(--tone);
}

.count {
  font-family: var(--font-display);
  font-size: var(--step-0);
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.count .of {
  font-size: var(--step--2);
  color: var(--text-muted);
}

.tools {
  display: flex;
  gap: 0.35rem;
  margin-left: auto;
}

.tool {
  flex: none;
  padding: 0.1rem 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.1em;
  white-space: nowrap;
  cursor: pointer;
}

.tool:hover:not(:disabled) {
  color: var(--text);
}

.tool:disabled {
  opacity: 0.45;
  cursor: default;
}

.tool.on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--text);
}

.tool.armed {
  border-color: var(--danger);
  color: var(--danger);
}

.filter {
  padding: 0.15rem 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

.filter:focus {
  border-color: var(--accent);
  outline: none;
}

.list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.list li + li {
  border-top: 1px solid var(--panel-rule);
}

.empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0;
  color: var(--text-muted);
  font-size: var(--step--1);
  text-align: center;
}

.empty b {
  font-family: var(--font-display);
  font-size: var(--step-1);
  font-weight: 400;
  letter-spacing: var(--tracking-wider);
}

.foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0 var(--space-2);
  color: var(--text-muted);
  font-size: var(--step--2);
  letter-spacing: 0.04em;
}

.foot .problem {
  color: var(--warn);
}

.skipped {
  color: var(--text);
}
</style>
