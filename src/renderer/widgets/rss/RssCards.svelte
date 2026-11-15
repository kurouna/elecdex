<script lang="ts">
import { formatItemTime, type ShownItem } from '@shared/feeds'
import { daySections, type FeedMark as Mark } from '@shared/feeds-view'
import FeedMark from './FeedMark.svelte'
import FeedPicture from './FeedPicture.svelte'
import LitText from './LitText.svelte'

/**
 * CARD: the same headlines as cards, each with its picture (or its feed's plate), two lines
 * of title, a line of summary, and its feed and time, under the same day rules as LIST.
 * Pictures are asked for only here and in the article view, never for LIST or TICKER.
 */
interface Props {
  items: ShownItem[]
  marks: Record<string, Mark>
  now: number
  selected: string | null
  highlight: RegExp | null
  find: string
  onpick: (item: ShownItem, card: HTMLElement) => void
}

const { items, marks, now, selected, highlight, find, onpick }: Props = $props()
const sections = $derived(daySections(items, now))
const fallback: Mark = { tag: '··', turn: 0 }
</script>

<div class="cards" data-testid="rss-cards">
  {#each sections as section (section.day ?? 'undated')}
    <p class="day" data-testid="rss-day">{section.label}{#if section.date !== null}<b>{section.date}</b>{/if}</p>
    {#each section.items as item (item.key)}
      {@const mark = marks[item.feed] ?? fallback}
      <button
        type="button"
        class="card"
        class:read={item.read}
        class:sel={selected === item.key}
        style:--mark-turn={mark.turn}
        onclick={(e) => onpick(item, e.currentTarget)}
        data-key={item.key}
        data-read={item.read || undefined}
        data-testid="rss-item"
      >
        <span class="top">
          <FeedPicture src={item.image} turn={mark.turn} seed={item.key} />
          <span class="badge"><FeedMark {mark} read={item.read} /></span>
        </span>
        <span class="in">
          <span class="title"><LitText text={item.title} {highlight} {find} /></span>
          {#if item.summary !== undefined}<span class="sum">{item.summary}</span>{/if}
          <span class="meta"><span>{item.source}</span><b>{item.at === null ? '' : formatItemTime(item.at, now)}</b></span>
        </span>
      </button>
    {/each}
  {/each}
</div>

<style>
.cards {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13.5rem, 1fr));
  align-content: start;
  gap: 0.55rem;
  padding: 0 0 0.6rem;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.day {
  grid-column: 1 / -1;
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
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
  order: 3;
  border-top: 1px solid var(--accent-dim);
}

.day b {
  order: 2;
  font-family: var(--font-mono);
  font-weight: 400;
  letter-spacing: 0;
  color: var(--text);
}

.card {
  --tone: hsl(calc(var(--mark-h) + var(--mark-turn, 0)) var(--mark-s) var(--mark-l));
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

/* The frame's corners in the feed's hue, as the HUD's frames are cornered. */
.card::before,
.card::after {
  content: "";
  position: absolute;
  z-index: 1;
  width: 0.4rem;
  height: 0.4rem;
  border: solid var(--tone);
}

.card::before {
  left: -1px;
  top: -1px;
  border-width: 1px 0 0 1px;
}

.card::after {
  right: -1px;
  bottom: -1px;
  border-width: 0 1px 1px 0;
}

.card:hover,
.card.sel {
  background: var(--accent-faint);
}

.card.sel {
  border-color: var(--accent);
}

.card:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: -1px;
}

.card.read {
  opacity: 0.6;
}

.top {
  position: relative;
  border-bottom: 1px solid var(--panel-rule);
}

.top :global([data-testid="rss-picture"]) {
  aspect-ratio: 16 / 9;
}

.badge {
  position: absolute;
  left: 0.35rem;
  top: 0.35rem;
  background: var(--app-bg);
}

.in {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  padding: 0.3rem 0.45rem 0.4rem;
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

.sum {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--text-muted);
  font-size: var(--step--1);
}

.meta {
  display: flex;
  justify-content: space-between;
  gap: 0.4rem;
  color: var(--text-muted);
  font-size: var(--step--2);
}

.meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta b {
  font-family: var(--font-mono);
  font-weight: 400;
}
</style>
