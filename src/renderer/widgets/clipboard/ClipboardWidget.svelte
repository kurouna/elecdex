<script lang="ts">
import { CLIP_MAX_ENTRIES, type ClipBoard, filterEntries } from '@shared/clipboard'
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

/**
 * What was copied lately, to put back on the clipboard (architecture.md §5.14).
 *
 * Main keeps the history and reads the clipboard only while a pane like this is
 * seen: this one subscribes only then, so behind another tab or with the
 * window put away nothing is read, and what was copied meanwhile is not in the
 * list. The history is main's memory, never a file. The page is given previews;
 * an entry is put back by its id, its HTML with it.
 */
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))

const masked = $derived(paneState?.mask === true)

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
  paneMeta.set(paneId, {
    subtitle: `${count} ${count === 1 ? 'entry' : 'entries'} · memory only`,
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

// Put away, the card goes with the pane's other moving parts.
$effect(() => {
  if (!visible) resting.leave()
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
  <header class="top">
    <span class="state" data-state={lamp} data-testid="clip-state"><i></i>{STATE_WORDS[lamp]}</span>
    <span class="count" data-testid="clip-count">{entries.length}<span class="of">/{CLIP_MAX_ENTRIES}</span></span>
    <span class="tools">
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
      <button
        type="button"
        class="tool"
        class:on={masked}
        aria-pressed={masked}
        title="hide what the entries say"
        onclick={() => widgetState.patch(paneId, { mask: masked ? undefined : true })}
        data-testid="clip-mask">MASK</button
      >
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
    </span>
  </header>

  {#if entries.length > 0 && !masked}
    <input
      class="filter"
      type="search"
      placeholder="filter"
      spellcheck="false"
      aria-label="filter the history"
      bind:value={query}
      data-testid="clip-filter"
    />
  {/if}

  {#if board === null}
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
            onremove={() => remove(entry.id)}
            onhover={(event) => onhover(entry.id, event)}
          />
        </li>
      {/each}
    </ul>
  {/if}

  {#if hovered !== null && hover !== null}
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
      <span class="problem">{problem}</span>
    {:else}
      <span>kept in memory while elecdex runs · read only while shown</span>
    {/if}
    {#if board !== null && board.skipped > 0}
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
