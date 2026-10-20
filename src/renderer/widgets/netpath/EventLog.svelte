<script lang="ts" generics="E extends LogEvent">
import type { Snippet } from 'svelte'
import { clock, type LogEvent, type LogMark, sinceRows } from './log.ts'

/**
 * A network pane's log, newest first: the frame the Wi-Fi and Ethernet panes
 * share - the header with its count and the line naming a steady beat, a strip
 * of time under it, and the rows. A row is its time, its kind's glyph and name,
 * its words, how long the link was down for it, and how long after the last of
 * its kind it came. What the kinds are, what they are called and how a row's
 * words read are the pane's.
 */
interface Props {
  events: readonly E[]
  /** The prefix of the log's test ids: `wifi`, `ether`. */
  id: string
  labels: Record<E['kind'], string>
  marks: Record<E['kind'], LogMark>
  /** What the count is over: "last 24 h", "while watched". */
  span: string
  /** The count's card, where it has one. */
  spanHint?: string
  /** The steady beat named above the list, if any. */
  beat?: { text: string; testid: string } | null
  /** Its own title, when it is not under a tab that says it already. */
  titled?: boolean
  /** What an empty log says. */
  empty: string
  emptyTestid?: string
  /** The strip of time between the header and the rows. */
  strip?: Snippet
  /** A row's words, where they are more than its `detail`. */
  detail?: Snippet<[E]>
}

const {
  events,
  id,
  labels,
  marks,
  span,
  spanHint,
  beat = null,
  titled = true,
  empty,
  emptyTestid,
  strip,
  detail,
}: Props = $props()

const rows = $derived(sinceRows(events))
</script>

<section class="log" data-testid="{id}-log">
  <header>
    {#if titled}<span class="title">LOG</span>{/if}
    <span class="count" data-hint={spanHint}>{events.length} {events.length === 1 ? 'event' : 'events'}, {span}</span>
    {#if beat !== null}
      <span class="beat" data-testid={beat.testid}>{beat.text}</span>
    {/if}
  </header>
  {@render strip?.()}
  <ol>
    {#each rows as { e, since } (e.key)}
      {@const mark = marks[e.kind as E['kind']]}
      <li data-kind={e.kind} data-tone={mark.tone} data-testid="{id}-event" data-hint="event-{e.kind}">
        <time>{clock(e.at)}</time>
        <span class="glyph">{mark.glyph}</span>
        <span class="kind">{labels[e.kind as E['kind']]}</span>
        <span class="detail">{#if detail}{@render detail(e)}{:else}{e.detail}{/if}</span>
        <span class="down">{e.downFor === null ? '' : `down ${e.downFor}s`}</span>
        <span class="since" data-hint="since">{since ?? ''}</span>
      </li>
    {:else}
      <li class="empty" data-testid={emptyTestid}>{empty}</li>
    {/each}
  </ol>
</section>

<style>
.log {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

header {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding-bottom: 0.15rem;
  border-bottom: 1px solid var(--panel-rule);
}

.title {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wider);
  color: var(--text-muted);
}

.count {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.beat {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--warn);
}

ol {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

li {
  --tone: var(--accent-strong);
  display: grid;
  grid-template-columns: auto 1em 7.5em minmax(0, 1fr) auto 3em;
  gap: 0.4rem;
  align-items: baseline;
  padding: 0.05rem 0.2rem;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text);
}

li:nth-child(even) {
  background: color-mix(in srgb, var(--accent) 4%, transparent);
}

li[data-tone='ok'] {
  --tone: var(--ok);
}

li[data-tone='warn'] {
  --tone: var(--warn);
}

li[data-tone='danger'] {
  --tone: var(--danger);
}

time,
.since {
  color: var(--text-muted);
}

.since {
  text-align: right;
}

.glyph,
.kind {
  color: var(--tone);
}

.kind {
  font-family: var(--font-ui);
  letter-spacing: 0.06em;
}

.detail {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.down {
  color: var(--warn);
}

.empty {
  display: block;
  padding: 0.3rem;
  color: var(--text-muted);
}
</style>
