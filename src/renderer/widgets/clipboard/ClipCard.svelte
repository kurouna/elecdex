<script lang="ts">
import {
  CLIP_PREVIEW_CHARS,
  type ClipEntryView,
  clipAge,
  clipFormats,
  clipSize,
  clipTags,
} from '@shared/clipboard'
import { crtPower } from '../../lib/crt-transitions.ts'

/**
 * An entry of the clipboard history as a whole, shown while the pointer rests on
 * its row (or the keyboard is on it): what it says, as far as the page has it,
 * what came with it, and when. Drawn like the git pane's commit card, and like it
 * laid over the pane beside the row and kept inside the pane. What was copied is
 * someone's text: it is drawn as text.
 */
interface Props {
  entry: ClipEntryView
  current: boolean
  now: number
  /** Where to put it, in the pane's own pixels; it keeps inside `bounds`. */
  at: { x: number; top: number; bottom: number }
  bounds: { width: number; height: number }
}

const { entry, current, now, at, bounds }: Props = $props()

let cardWidth = $state(0)
let cardHeight = $state(0)
const GAP = 6

// Below the row, or above it where there is no room below; never past the pane's edges.
const left = $derived(Math.max(GAP, Math.min(at.x + 14, bounds.width - cardWidth - GAP)))
const top = $derived(
  at.bottom + GAP + cardHeight <= bounds.height
    ? at.bottom + GAP
    : Math.max(GAP, at.top - GAP - cardHeight),
)

const time = (at: number): string =>
  new Date(at).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
/** The page has the beginning of a long entry only; the card says how much more there is. */
const cut = $derived(entry.chars > CLIP_PREVIEW_CHARS)
</script>

<div
  class="card crt-on"
  role="tooltip"
  data-testid="clip-card"
  style:left="{left}px"
  style:top="{top}px"
  bind:clientWidth={cardWidth}
  bind:clientHeight={cardHeight}
  transition:crtPower
>
  <p class="meta">
    {#each clipTags(entry) as tag (tag)}<span class="tag" class:rich={tag === 'RICH'}>{tag}</span>{/each}
    <span>{clipSize(entry)}</span>
    {#if current}<span class="on">ON CLIPBOARD</span>{/if}
  </p>
  <p class="text" data-testid="clip-card-text">{#if entry.kind === 'color'}<i class="swatch" style:background-color={entry.preview.trim()}></i>{/if}{entry.preview}{#if cut}<span class="more">…</span>{/if}</p>
  {#if cut}
    <p class="note">the first {CLIP_PREVIEW_CHARS.toLocaleString('en-US')} of {entry.chars.toLocaleString('en-US')} characters</p>
  {/if}
  <p class="foot">
    <span data-testid="clip-card-formats">{clipFormats(entry)}</span>
    <span>copied {time(entry.at)} · {clipAge(entry.at, now)}</span>
    {#if entry.copies > 1}
      <span>{entry.copies} times, first {time(entry.firstAt)}</span>
    {/if}
    {#if entry.kept}
      <span>click to put back{entry.rich ? ' with its formatting' : ''}</span>
    {:else}
      <span class="warn">too long to have been kept whole: cannot be put back</span>
    {/if}
  </p>
</div>

<style>
.card {
  position: absolute;
  z-index: 5;
  width: max-content;
  max-width: min(32rem, calc(100% - 12px));
  max-height: calc(100% - 12px);
  overflow: hidden;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--accent);
  background: var(--panel-bg-raised);
  box-shadow: 0 0 0.8rem color-mix(in srgb, var(--accent) 25%, transparent);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  pointer-events: none;
}

p {
  margin: 0;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 0.6rem;
  color: var(--text-muted);
}

.tag {
  padding: 0 0.3rem;
  border: 1px solid var(--accent-dim);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.06em;
}

.tag.rich {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 22%, transparent);
}

.on {
  color: var(--accent-strong);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.08em;
}

/* What was copied, its lines kept and a long one wrapped. */
.text {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 0.3rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 16;
  line-clamp: 16;
}

.more {
  color: var(--text-muted);
}

.swatch {
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  margin-right: 0.4rem;
  border: 1px solid var(--panel-rule);
  vertical-align: -0.15rem;
}

.note {
  margin-top: 0.2rem;
  color: var(--text-muted);
  font-size: var(--step--2);
}

.foot {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.9rem;
  margin-top: 0.35rem;
  padding-top: 0.25rem;
  border-top: 1px solid var(--panel-rule);
  color: var(--text-muted);
  font-size: var(--step--2);
}

.warn {
  color: var(--warn);
}
</style>
