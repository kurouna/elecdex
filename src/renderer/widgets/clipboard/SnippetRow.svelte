<script lang="ts">
import { clipSize, clipTags, maskedPreview, previewLines } from '@shared/clipboard'
import { type SnippetView, slotNumber } from '@shared/snippets'

/**
 * One snippet: its slot number and the handle it is dragged by, its tags, its
 * name (when it was given one) and a few lines of it, and COPY. EDIT and × show
 * on the row under the pointer or the keyboard; × asks once more, since a
 * snippet, unlike a history entry, was kept on purpose. Resting on the row asks
 * for the card with the whole of it (SnippetCard.svelte).
 */
interface Props {
  snippet: SnippetView
  index: number
  /** It is what the clipboard holds now. */
  current: boolean
  masked: boolean
  lines: number
  /** Just put on the clipboard: COPY says so for a moment. */
  copied: boolean
  /** × pressed once: it asks before the snippet goes. */
  armed: boolean
  /** Being dragged to another place. */
  dragging: boolean
  /** Whether it can be dragged now (not while the list is filtered). */
  movable: boolean
  oncopy: () => void
  onedit: () => void
  onremove: () => void
  ondisarm: () => void
  ongrab: (event: PointerEvent) => void
  onhover: (event: { row: DOMRect; x: number | null; buttons?: DOMRect } | null) => void
}

const {
  snippet,
  index,
  current,
  masked,
  lines,
  copied,
  armed,
  dragging,
  movable,
  oncopy,
  onedit,
  onremove,
  ondisarm,
  ongrab,
  onhover,
}: Props = $props()

let rowEl = $state<HTMLElement | null>(null)
let actionsEl = $state<HTMLElement | null>(null)
// The row's own buttons (COPY, EDIT, ×) go with it, so a card that must go over the row leaves them in sight.
const hovered = (x: number | null): void => {
  if (rowEl === null) return
  const row = rowEl.getBoundingClientRect()
  onhover(actionsEl === null ? { row, x } : { row, x, buttons: actionsEl.getBoundingClientRect() })
}

/** A name of its own takes the first line; the text goes under it. */
const named = $derived(snippet.name !== '')
const shown = $derived(
  masked
    ? [maskedPreview(snippet)]
    : previewLines(snippet.preview, named ? Math.max(1, lines - 1) : lines),
)
const more = $derived(!masked && snippet.lines > shown.length)
</script>

<div
  class="row"
  class:current
  class:dragging
  data-kind={snippet.kind}
  data-testid="snip-row"
  data-id={snippet.id}
  role="presentation"
  bind:this={rowEl}
  onpointerenter={(event) => hovered(event.clientX)}
  onpointerleave={() => onhover(null)}
>
  <span class="slot" class:movable onpointerdown={movable ? ongrab : undefined} role="presentation"
    title={movable ? 'drag to move (Alt+↑ ↓)' : undefined} data-testid="snip-handle">
    <span class="number">{slotNumber(index)}</span>
    {#if movable}<span class="grip" aria-hidden="true"></span>{/if}
  </span>
  <span class="tags">
    {#each clipTags(snippet) as tag (tag)}<span class="tag" class:rich={tag === 'RICH'} data-testid="snip-tag">{tag}</span>{/each}
  </span>
  <span class="body">
    {#if named}<span class="name" data-testid="snip-name">{snippet.name}</span>{/if}
    <span class="text" class:masked class:under={named} data-testid="snip-text">
      {#each shown as line, i (i)}<span class="line">{#if i === 0 && snippet.kind === 'color' && !masked}<i class="swatch" style:background-color={snippet.preview.trim()}></i>{/if}{line === '' ? ' ' : line}{#if more && i === shown.length - 1}<span class="ellipsis"> …</span>{/if}</span>{/each}
    </span>
    <span class="meta">
      {clipSize(snippet)}{#if snippet.copies > 0}<span class="flag">×{snippet.copies}</span>{/if}{#if current}<span class="flag on" data-testid="snip-current">ON CLIPBOARD</span>{/if}
    </span>
  </span>
  <span class="actions" bind:this={actionsEl}>
    <button
      type="button"
      class="copy"
      class:copied
      onclick={oncopy}
      onfocus={(event) => {
        if (event.currentTarget.matches(':focus-visible')) hovered(null)
      }}
      onblur={() => onhover(null)}
      data-testid="snip-copy">{copied ? 'COPIED' : 'COPY'}</button
    >
    <span class="more">
      {#if !masked}
        <button type="button" class="edit" title="edit (F2)" onclick={onedit} data-testid="snip-edit">EDIT</button>
      {/if}
      <button
        type="button"
        class="drop"
        class:armed
        aria-label={armed ? 'press again to delete the snippet' : 'delete the snippet'}
        title="delete the snippet"
        onclick={onremove}
        onblur={ondisarm}
        data-testid="snip-remove">{armed ? 'DELETE?' : '×'}</button
      >
    </span>
  </span>
</div>

<style>
.row {
  position: relative;
  display: grid;
  grid-template-columns: 1.9rem 2.6rem minmax(0, 1fr) auto;
  gap: var(--space-2);
  align-items: start;
  padding: 0.3rem var(--space-1) 0.3rem 0.35rem;
}

.row:hover {
  background: color-mix(in srgb, var(--accent) 7%, transparent);
}

/* What the clipboard holds now: a bar down its edge, as in the history. */
.row.current::after {
  content: "";
  position: absolute;
  top: 0.2rem;
  bottom: 0.2rem;
  left: 0;
  width: 2px;
  background: var(--accent);
  box-shadow: 0 0 calc(var(--glow) * 0.4rem) var(--accent);
  pointer-events: none;
}

.row.dragging {
  z-index: 1;
  outline: 1px solid var(--accent);
  outline-offset: -1px;
  background: color-mix(in srgb, var(--accent) 12%, var(--app-bg));
}

.slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem;
  margin-top: 0.05rem;
  color: var(--text-muted);
  user-select: none;
}

.slot.movable {
  cursor: grab;
  touch-action: none;
}

.dragging .slot {
  cursor: grabbing;
}

.number {
  font-family: var(--font-display);
  font-size: var(--step--1);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.current .number,
.dragging .number {
  color: var(--accent-strong);
}

.grip {
  width: 0.55rem;
  height: 0.5rem;
  background: radial-gradient(circle, currentColor 0.8px, transparent 1.1px) 0 0 / 0.275rem 0.25rem;
  opacity: 0.6;
}

.row:hover .grip,
.dragging .grip {
  opacity: 1;
  color: var(--accent);
}

.tags {
  display: flex;
  margin-top: 0.1rem;
  flex-direction: column;
  gap: 0.15rem;
}

.tag {
  padding: 0 0.2rem;
  border: 1px solid var(--panel-rule);
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.08em;
  text-align: center;
}

.tag.rich {
  border-color: var(--accent-dim);
  color: var(--accent);
}

.current .tag:not(.rich) {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--app-bg);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.name {
  overflow: hidden;
  color: var(--accent-strong);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.06em;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  line-height: 1.35;
}

.text.under {
  color: var(--text-muted);
}

.text.masked {
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.line {
  overflow: hidden;
  white-space: pre;
  text-overflow: ellipsis;
}

.ellipsis {
  color: var(--text-muted);
}

.swatch {
  display: inline-block;
  width: 0.8rem;
  height: 0.8rem;
  margin-right: 0.4rem;
  border: 1px solid var(--panel-rule);
  vertical-align: -0.1rem;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.5rem;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.04em;
}

.flag {
  letter-spacing: 0.1em;
}

.flag.on {
  color: var(--accent);
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.actions button {
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.1em;
  white-space: nowrap;
  cursor: pointer;
}

/* The same width pressed or not: a control that moves as its label changes gets missed. */
.copy {
  min-width: 4.4rem;
  padding: 0.1rem 0.4rem;
  border-color: var(--accent-dim) !important;
  color: var(--accent-strong) !important;
}

.copy:hover,
.copy:focus-visible {
  border-color: var(--accent) !important;
  background: var(--accent-faint);
  outline: none;
}

/* Put on the clipboard: a quick blink of the accent, the launcher's. */
.copy.copied {
  animation: snip-blink 100ms linear 6;
}

@keyframes snip-blink {
  50% {
    background: var(--accent);
    color: var(--text-inverse);
  }
}

.more {
  display: flex;
  gap: 0.2rem;
  opacity: 0;
}

.row:hover .more,
.row:focus-within .more,
.more:has(.armed) {
  opacity: 1;
}

.edit,
.drop {
  padding: 0 0.3rem;
}

.edit:hover,
.edit:focus-visible {
  color: var(--text);
}

.drop:hover,
.drop:focus-visible {
  color: var(--danger);
}

.drop.armed {
  border-color: var(--danger);
  color: var(--danger);
}
</style>
