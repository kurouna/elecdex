<script lang="ts">
import { formatItemTime, type ShownItem } from '@shared/feeds'
import { daySections, lastSeenKey, type FeedMark as Mark } from '@shared/feeds-view'
import { flip } from 'svelte/animate'
import type { NewAbove } from '../../lib/new-above.svelte.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import NewPill from '../common/NewPill.svelte'
import FeedMark from './FeedMark.svelte'
import LitText from './LitText.svelte'

/**
 * LIST: headlines newest first under day rules that stay at the top while their day scrolls
 * by, each with its feed's mark, two lines of title, its source and author, and its time.
 * A broken rule, LAST SEEN, marks where the pane was last looked at. Headlines that arrive
 * while it is shown slide in lit (fx-fresh), and *n new* takes a reader scrolled down back up.
 */
interface Props {
  items: ShownItem[]
  marks: Record<string, Mark>
  now: number
  seenAt: number | null
  fresh: ReadonlySet<string>
  selected: string | null
  highlight: RegExp | null
  find: string
  above: NewAbove
  onpick: (item: ShownItem, row: HTMLElement) => void
  onsettled: (key: string, event: AnimationEvent) => void
}

const {
  items,
  marks,
  now,
  seenAt,
  fresh,
  selected,
  highlight,
  find,
  above,
  onpick,
  onsettled,
}: Props = $props()

const sections = $derived(daySections(items, now))
const seenKey = $derived(lastSeenKey(items, seenAt))
const pad = (n: number) => String(n).padStart(2, '0')
const seenLabel = $derived.by(() => {
  if (seenAt === null) return ''
  const d = new Date(seenAt)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
})
const fallback: Mark = { tag: '··', turn: 0 }
</script>

<div class="list-frame">
  <NewPill count={above.count} onjump={() => above.jump(!appearance.reducedMotion)} testid="rss-new" />
  <ul class="items" bind:this={above.list} onscroll={() => above.scrolled()} data-testid="rss-items">
    {#each sections as section (section.day ?? 'undated')}
      <li class="day" data-testid="rss-day">{section.label}{#if section.date !== null}<b>{section.date}</b>{/if}</li>
      {#each section.items as item (item.key)}
        <li
          class="entry"
          class:fx-fresh={fresh.has(item.key)}
          animate:flip={{ duration: appearance.reducedMotion ? 0 : 360 }}
          onanimationend={(e) => onsettled(item.key, e)}
          data-fresh={fresh.has(item.key) || undefined}
        >
          {#if item.key === seenKey}
            <div class="seen" data-testid="rss-lastseen">last seen {seenLabel}</div>
          {/if}
          <button
            type="button"
            class="item"
            class:read={item.read}
            class:sel={selected === item.key}
            aria-current={selected === item.key || undefined}
            onclick={(e) => onpick(item, e.currentTarget)}
            data-key={item.key}
            data-read={item.read || undefined}
            data-testid="rss-item"
          >
            <FeedMark mark={marks[item.feed] ?? fallback} read={item.read} />
            <span class="tx">
              <span class="title"><LitText text={item.title} {highlight} {find} /></span>
              <span class="meta">{item.source}{item.author !== undefined && item.author !== item.source ? ` · ${item.author}` : ''}</span>
            </span>
            <span class="tm">{item.at === null ? '' : formatItemTime(item.at, now)}</span>
          </button>
        </li>
      {/each}
    {/each}
  </ul>
</div>

<style>
/* The list takes the pane's height and scrolls past it. */
.list-frame {
  position: relative;
  flex: 1;
  min-height: 0;
}

.items {
  height: 100%;
  margin: 0;
  padding: 0 0 0.6rem;
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.day {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.3rem 0.2rem 0.15rem;
  background: var(--app-bg);
  color: var(--text-muted);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}

.day::before {
  content: "";
  width: 0.8rem;
  border-top: 1px solid var(--accent-dim);
}

.day::after {
  content: "";
  flex: 1;
  border-top: 1px solid var(--accent-dim);
  order: 3;
}

.day b {
  order: 2;
  font-family: var(--font-mono);
  font-weight: 400;
  letter-spacing: 0;
  color: var(--text);
}

.seen {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.15rem 0.2rem;
  color: var(--accent-strong);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.seen::before,
.seen::after {
  content: "";
  flex: 1;
  border-top: 1px dashed var(--accent);
  opacity: 0.7;
}

.entry + .entry {
  border-top: 1px solid color-mix(in srgb, var(--panel-rule) 40%, transparent);
}

.item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.55rem;
  align-items: start;
  width: 100%;
  padding: 0.3rem 0.4rem 0.3rem 0.3rem;
  border: 0;
  border-left: 2px solid transparent;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.item :global([data-testid="rss-mark"]) {
  margin-top: 0.1rem;
}

.item:hover,
.item.sel {
  background: var(--accent-faint);
}

.item.sel {
  border-left-color: var(--accent);
}

.item:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: -1px;
}

.tx {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
  min-width: 0;
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

.item.read .title {
  color: var(--text-muted);
}

.meta {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: var(--step--2);
  color: var(--text-muted);
}

.tm {
  padding-top: 0.15rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}
</style>
