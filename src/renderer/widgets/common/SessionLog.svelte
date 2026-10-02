<script lang="ts" generics="T extends { id: string; title: string; updatedAt: number }">
import { ago } from '@shared/ai'
import type { Snippet } from 'svelte'
import ConfirmButton from '../../ConfirmButton.svelte'

/**
 * A session log - the AI chat's conversations, the ELEC council's deliberations: one line each,
 * its number, what was asked, how long ago, and what can be done to it (open, export, delete).
 * Both panes draw the same list, so it is drawn here once and cannot drift apart.
 */
interface Props {
  entries: readonly T[]
  current: string | null
  /** When the log was opened: "how long ago" is counted from there, not live. */
  openedAt: number
  /** Said when there is nothing: "No conversations yet." */
  empty: string
  /** What deleting one is called: "Delete this conversation". */
  deleteTitle: string
  /** What follows "how long ago" (a conversation's message count), when anything does. */
  suffix?: (entry: T) => string | undefined
  /** Drawn between the title and the time (the council's outcome). */
  badge?: Snippet<[T]>
  testids: { list: string; item: string; delete: string }
  onopen: (id: string) => void
  onexport: (id: string) => void
  ondelete: (id: string) => void
}

const {
  entries,
  current,
  openedAt,
  empty,
  deleteTitle,
  suffix,
  badge,
  testids,
  onopen,
  onexport,
  ondelete,
}: Props = $props()

function when(entry: T): string {
  const more = suffix?.(entry)
  const since = ago(entry.updatedAt, openedAt)
  return more === undefined ? since : `${since} · ${more}`
}
</script>

<ul class="log" data-testid={testids.list}>
  {#each entries as entry, n (entry.id)}
    <li class="fx-rise" class:current={entry.id === current} style:--fx-delay={`${Math.min(n, 12) * 22}ms`}>
      <button type="button" class="open" onclick={() => onopen(entry.id)} data-testid={testids.item}>
        <span class="index">{String(n + 1).padStart(2, '0')}</span>
        <span class="name">{entry.title === '' ? 'untitled' : entry.title}</span>
        {@render badge?.(entry)}
        <span class="when" title={new Date(entry.updatedAt).toLocaleString()}>{when(entry)}</span>
      </button>
      <button type="button" class="cmd" title="save as markdown" onclick={() => onexport(entry.id)}>export</button>
      <ConfirmButton
        label="delete"
        action="delete"
        title={deleteTitle}
        testid={testids.delete}
        onconfirm={() => ondelete(entry.id)}
      />
    </li>
  {:else}
    <li class="none">{empty}</li>
  {/each}
</ul>

<style>
.log {
  /* As tall as its entries, up to two fifths of the pane; then it scrolls. */
  flex: 0 0 auto;
  max-height: 40%;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  border: 1px solid var(--panel-border);
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.log li {
  display: flex;
  align-items: stretch;
  gap: var(--space-1);
  padding: 0.1rem var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

/* What can be done to an entry shows when it is pointed at, or reached by keyboard. */
.log li > :global(:not(.open)) {
  opacity: 0;
}

.log li:hover > :global(:not(.open)),
.log li:focus-within > :global(:not(.open)) {
  opacity: 1;
}

.log li + li {
  border-top: 1px solid var(--panel-rule);
}

.log li.current .name {
  color: var(--accent-strong);
}

.none {
  color: var(--text-muted);
}

.open {
  display: flex;
  flex: 1;
  min-width: 0;
  gap: var(--space-2);
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.open:hover .name,
.open:focus-visible .name {
  color: var(--accent);
}

.name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* A time is read, so it stays at the line's size (CLAUDE.md, type sizes by role). */
.index,
.when {
  flex: none;
  color: var(--text-muted);
}

.cmd {
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.cmd:hover {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
