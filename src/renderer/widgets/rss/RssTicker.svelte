<script lang="ts">
import { formatItemTime, type ShownItem } from '@shared/feeds'
import { type FeedMark as Mark, TICKER_PERIOD_MS } from '@shared/feeds-view'
import { afterBlink } from '../../lib/blink.ts'
import { onBoundary } from '../../lib/frame-loop.ts'
import FeedMark from './FeedMark.svelte'
import LitText from './LitText.svelte'

/**
 * TICKER: one headline at a time, the next every TICKER_PERIOD_MS on the wall clock's grid
 * (onBoundary, never a timer of its own), only while the pane is seen. ‹ › step by hand; a
 * row of slots shows where in the list it is. For a short pane or a status strip.
 */
interface Props {
  items: ShownItem[]
  marks: Record<string, Mark>
  now: number
  running: boolean
  highlight: RegExp | null
  find: string
  onpick: (item: ShownItem, row: HTMLElement) => void
}

const { items, marks, now, running, highlight, find, onpick }: Props = $props()

let at = $state(0)
const index = $derived(items.length === 0 ? 0 : at % items.length)
const item = $derived(items[index])
const fallback: Mark = { tag: '··', turn: 0 }

/**
 * Held still while the pointer or the keyboard is on it: a headline being read or stepped to by
 * hand is not taken away by the next beat (the beat once landed between two presses of ‹).
 */
let held = $state(false)

$effect(() => {
  if (!running || held || items.length < 2) return
  return onBoundary(TICKER_PERIOD_MS, () => {
    at = (at + 1) % Math.max(1, items.length)
  })
})

function step(by: number): void {
  if (items.length === 0) return
  at = (index + by + items.length) % items.length
}

const SLOTS = 20
</script>

{#if item !== undefined}
  <div
    class="ticker"
    role="group"
    aria-label="headlines, one at a time"
    onpointerenter={() => (held = true)}
    onpointerleave={() => (held = false)}
    onfocusin={() => (held = true)}
    onfocusout={() => (held = false)}
    data-held={held || undefined}
    data-testid="rss-ticker"
  >
    <button type="button" class="line" onclick={(e) => onpick(item, e.currentTarget)} data-key={item.key} data-testid="rss-item">
      <FeedMark mark={marks[item.feed] ?? fallback} solid read={item.read} />
      {#key item.key}
        <span class="title crt-on" data-testid="rss-ticker-title"><LitText text={item.title} {highlight} {find} /></span>
      {/key}
      <span class="tm">{item.at === null ? '' : formatItemTime(item.at, now)}</span>
    </button>
    <div class="bar">
      <span class="src">{item.source}</span>
      <span class="slots" aria-hidden="true">
        {#each items.slice(0, SLOTS) as slot, i (slot.key)}<i class:on={i === index}></i>{/each}
      </span>
      <span class="count" data-testid="rss-ticker-count">{index + 1}/{items.length}</span>
      <button type="button" class="step" onclick={(e) => afterBlink(e.currentTarget, () => step(-1))} aria-label="previous headline" data-testid="rss-ticker-prev">‹</button>
      <button type="button" class="step" onclick={(e) => afterBlink(e.currentTarget, () => step(1))} aria-label="next headline" data-testid="rss-ticker-next">›</button>
    </div>
  </div>
{/if}

<style>
.ticker {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.3rem 0 0.2rem;
}

.line {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.6rem;
  align-items: center;
  padding: 0.2rem 0.3rem;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.line:hover {
  background: var(--accent-faint);
}

.title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: var(--step-0);
  transform-origin: 50% 50%;
}

.tm {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-muted);
}

.bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.3rem;
  color: var(--text-muted);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.src {
  max-width: 40%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--text);
}

.slots {
  flex: 1;
  display: flex;
  gap: 2px;
}

.slots i {
  flex: 1;
  height: 3px;
  background: var(--accent-faint);
}

.slots i.on {
  background: var(--accent);
  box-shadow: 0 0 calc(var(--glow) * 0.3rem) var(--accent);
}

.count {
  font-family: var(--font-mono);
  letter-spacing: 0;
}

.step {
  padding: 0 0.35rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  cursor: pointer;
}

.step:hover {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
