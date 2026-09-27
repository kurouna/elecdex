<script lang="ts">
import {
  type ClipEntryView,
  clipAge,
  clipSize,
  clipTags,
  maskedPreview,
  previewLines,
} from '@shared/clipboard'

/**
 * One entry of the clipboard history: its tags, a few lines of it, its size, and
 * how long ago. Pressing it puts it back on the clipboard; SNIP beside it keeps
 * it as a snippet (★ once it is one, which goes to it), and × takes it out of
 * the history. Resting on it (or the keyboard on it) asks for the card
 * with the whole of it, which the pane draws (ClipCard.svelte).
 */
interface Props {
  entry: ClipEntryView
  /** It is what the clipboard holds now. */
  current: boolean
  masked: boolean
  /** Lines of the preview shown. */
  lines: number
  now: number
  /** Just put back: says so for a moment in place of its age. */
  copied: boolean
  onrestore: () => void
  onsnip: () => void
  onremove: () => void
  /** The row came under the pointer (with where it is) or the keyboard; null when it left. */
  onhover: (event: { row: DOMRect; x: number | null } | null) => void
}

const { entry, current, masked, lines, now, copied, onrestore, onsnip, onremove, onhover }: Props =
  $props()

let rowEl = $state<HTMLElement | null>(null)
const hovered = (x: number | null): void => {
  if (rowEl !== null) onhover({ row: rowEl.getBoundingClientRect(), x })
}

const shown = $derived(masked ? [maskedPreview(entry)] : previewLines(entry.preview, lines))
const tags = $derived(clipTags(entry))
const more = $derived(!masked && entry.lines > shown.length)
</script>

<!-- The row, not its button, follows the pointer: a disabled button (an entry not kept) takes no pointer events. -->
<div
  class="row"
  class:current
  data-kind={entry.kind}
  data-testid="clip-row"
  data-id={entry.id}
  role="presentation"
  bind:this={rowEl}
  onpointerenter={(event) => hovered(event.clientX)}
  onpointerleave={() => onhover(null)}
>
  <button
    type="button"
    class="entry"
    disabled={!entry.kept}
    aria-current={current || undefined}
    onclick={onrestore}
    onfocus={(event) => {
      // The keyboard's focus, not the one a click leaves behind: the pointer has its own rest.
      if (event.currentTarget.matches(':focus-visible')) hovered(null)
    }}
    onblur={() => onhover(null)}
    data-testid="clip-entry"
  >
    <span class="tags">
      {#each tags as tag (tag)}<span class="tag" class:rich={tag === 'RICH'} data-testid="clip-tag">{tag}</span>{/each}
    </span>
    <span class="body">
      <span class="text" class:masked data-testid="clip-text">
        {#each shown as line, i (i)}<span class="line">{#if i === 0 && entry.kind === 'color' && !masked}<i class="swatch" style:background-color={entry.preview.trim()}></i>{/if}{line === '' ? ' ' : line}{#if more && i === shown.length - 1}<span class="ellipsis"> …</span>{/if}</span>{/each}
      </span>
      <span class="meta">
        {clipSize(entry)}{#if entry.copies > 1}<span class="flag">×{entry.copies}</span>{/if}{#if !entry.kept}<span class="flag warn">NOT KEPT</span>{/if}{#if current}<span class="flag on" data-testid="clip-current">ON CLIPBOARD</span>{/if}
      </span>
    </span>
    <span class="age" class:copied data-testid="clip-age">{copied ? 'COPIED' : clipAge(entry.at, now)}</span>
  </button>
  <button
    type="button"
    class="snip"
    class:kept={entry.snipped}
    disabled={!entry.kept}
    aria-label={entry.snipped ? 'kept as a snippet: show it' : 'keep as a snippet'}
    title={entry.snipped ? 'kept as a snippet: show it' : 'keep as a snippet'}
    onclick={onsnip}
    data-testid="clip-snip">{entry.snipped ? '★' : 'SNIP'}</button
  >
  <button
    type="button"
    class="drop"
    aria-label="remove from the history"
    title="remove from the history"
    onclick={onremove}
    data-testid="clip-remove">×</button
  >
</div>

<style>
.row {
  position: relative;
  display: flex;
  align-items: stretch;
}

/* What the clipboard holds now: a bar down its edge, its tag lit. */
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

.entry {
  display: grid;
  grid-template-columns: 2.6rem minmax(0, 1fr) auto;
  flex: 1;
  gap: var(--space-2);
  align-items: start;
  min-width: 0;
  padding: 0.3rem var(--space-1) 0.3rem 0.5rem;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.entry:disabled {
  cursor: default;
}

.entry:not(:disabled):hover {
  background: color-mix(in srgb, var(--accent) 7%, transparent);
}

.entry:not(:disabled):hover .text {
  color: var(--accent);
}

.entry:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: -1px;
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

.tags {
  display: flex;
  margin-top: 0.1rem;
  flex-direction: column;
  gap: 0.15rem;
}

/* Formatted: put back with its formatting. */
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

.text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  line-height: 1.35;
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

.flag.warn {
  color: var(--warn);
}

.age {
  margin-top: 0.1rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  font-variant-numeric: tabular-nums;
}

.age.copied {
  color: var(--accent);
  font-family: var(--font-ui);
  letter-spacing: 0.1em;
}

/* SNIP shows with the ×; a ★ (kept as a snippet) stays. */
.snip {
  flex: none;
  align-self: flex-start;
  margin-top: 0.3rem;
  padding: 0 0.3rem;
  border: 1px solid var(--accent-dim);
  background: transparent;
  color: var(--accent-strong);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.1em;
  cursor: pointer;
  opacity: 0;
}

.snip.kept {
  border-color: transparent;
  color: var(--accent);
  font-size: var(--step--1);
  opacity: 1;
}

.snip:disabled {
  display: none;
}

.row:hover .snip,
.row:focus-within .snip {
  opacity: 1;
}

.snip:not(.kept):hover,
.snip:not(.kept):focus-visible {
  border-color: var(--accent);
  background: var(--accent-faint);
  outline: none;
}

/* The × shows on the row under the pointer or the keyboard. */
.drop {
  flex: none;
  width: 1.4rem;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: var(--step-1);
  line-height: 1;
  cursor: pointer;
  opacity: 0;
}

.row:hover .drop,
.row:focus-within .drop {
  opacity: 1;
  color: var(--text);
}

.drop:hover,
.drop:focus-visible {
  color: var(--danger);
}
</style>
