<script lang="ts">
import { type DiffLine, type GitDiff, pairChanges, splitRows } from '@shared/git'
import { untrack } from 'svelte'
import { formatBytes } from '../../lib/format.ts'
import { highlightLines, languageOf, markSpan, type Token } from '../../lib/highlight.ts'
import ImageViewer from './ImageViewer.svelte'

/**
 * One file's diff: hunk bands, the old and new line numbers, the lines with
 * their syntax coloured and the changed part of each changed line lit.
 * Unified, or side by side when there is room (`split`).
 *
 * Shared by the git pane and whatever else shows a change to a file. A line
 * that arrives in a later diff of the same file than the one before lights up
 * once and settles (`bloom`), so a file being written can be watched without
 * the whole view flashing.
 */
interface Props {
  diff: GitDiff | null
  /** The file, for the language and the header. */
  path: string
  loading?: boolean
  split?: boolean
  onsplit?: (split: boolean) => void
  /** Double-click on a line: its number in the new file (the old one for a removal). */
  onopenline?: (line: number) => void
}

const { diff, path, loading = false, split = false, onsplit, onopenline }: Props = $props()

/** Every line of the diff in order, with the hunk each starts and its lit span. */
interface Row {
  line: DiffLine
  index: number
  tokens: Token[]
  fresh: boolean
}

let tokens = $state.raw<Token[][] | null>(null)
let fresh = $state.raw<ReadonlySet<number>>(new Set())
let body = $state<HTMLElement | null>(null)
/** An image's drawn size, once it has loaded, by side. */
let sizes = $state.raw<Partial<Record<'before' | 'after', { w: number; h: number }>>>({})
/**
 * The side of an image change shown alone, filling the body to be zoomed and
 * panned (ImageViewer); null for the two side by side. A click on either
 * picture opens it, ← in the bar goes back.
 */
let zoomed = $state<'before' | 'after' | null>(null)
let viewer = $state<ReturnType<typeof ImageViewer> | null>(null)
let viewScale = $state(1)
/** The picture to show alone, while the diff still has one on that side. */
const alone = $derived(zoomed !== null && diff?.images ? diff.images[zoomed] : null)
// Forgotten for another file only: a new reading of the same image keeps its <img>, which does not load again.
$effect(() => {
  void path
  sizes = {}
  zoomed = null
})

const lines = $derived(diff?.hunks.flatMap((hunk) => hunk.lines) ?? [])
const spans = $derived(pairChanges(lines))
const added = $derived(lines.filter((line) => line.kind === 'add').length)
const removed = $derived(lines.filter((line) => line.kind === 'del').length)

/** What was on screen for this file, to tell which lines are new. */
let seen: { path: string; keys: Map<string, number> } | null = null

const keyOf = (line: DiffLine): string => `${line.kind}\u0000${line.text}`

$effect(() => {
  const current = diff
  const texts = lines.map((line) => line.text)
  const language = languageOf(path)
  untrack(() => {
    fresh = newLines(current)
  })
  let cancelled = false
  void highlightLines(texts, language).then((result) => {
    if (!cancelled) tokens = result
  })
  return () => {
    cancelled = true
  }
})

/** Lines not in the last diff of the same file, counted so a repeated line is new only when added again. */
function newLines(current: GitDiff | null): ReadonlySet<number> {
  const keys = new Map<string, number>()
  for (const line of lines) keys.set(keyOf(line), (keys.get(keyOf(line)) ?? 0) + 1)
  const before = seen !== null && seen.path === path && current !== null ? seen.keys : null
  seen = current === null ? null : { path, keys }
  if (before === null) return new Set()
  const left = new Map(before)
  const out = new Set<number>()
  lines.forEach((line, i) => {
    if (line.kind === 'ctx') return
    const count = left.get(keyOf(line)) ?? 0
    if (count > 0) left.set(keyOf(line), count - 1)
    else out.add(i)
  })
  return out
}

const rowAt = (line: DiffLine, index: number): Row => ({
  line,
  index,
  tokens: markSpan(tokens?.[index] ?? [{ text: line.text, kind: '' }], spans.get(index)),
  fresh: fresh.has(index),
})

/** The hunks with each line's index into `lines`, which the tokens and spans are keyed by. */
const hunks = $derived.by(() => {
  let at = 0
  return (diff?.hunks ?? []).map((hunk) => {
    const start = at
    at += hunk.lines.length
    const rows = hunk.lines.map((line, i) => rowAt(line, start + i))
    return {
      header: `@@ -${hunk.oldStart} +${hunk.newStart} @@`,
      context: hunk.context,
      rows,
      split: split
        ? splitRows(hunk.lines).map((pair) => ({
            left: pair.left === null ? null : (rows[pair.left.index] ?? null),
            right: pair.right === null ? null : (rows[pair.right.index] ?? null),
          }))
        : [],
    }
  })
})

const SIGN: Record<DiffLine['kind'], string> = { add: '+', del: '−', ctx: ' ' }

function open(line: DiffLine): void {
  const at = line.new ?? line.old
  if (at !== null) onopenline?.(at)
}

/** Scrolls to the next or previous hunk band below the top of the view. */
function jump(step: 1 | -1): void {
  if (body === null) return
  const view = body
  // Where each band sits in the scrolled content, whatever is positioned around the view.
  const origin = view.getBoundingClientRect().top - view.scrollTop
  const at = (band: HTMLElement): number => band.getBoundingClientRect().top - origin
  const bands = [...view.querySelectorAll<HTMLElement>('.band')]
  const top = view.scrollTop + 4
  const target =
    step === 1
      ? bands.find((band) => at(band) > top)
      : bands.filter((band) => at(band) < top - 8).at(-1)
  view.scrollTo({ top: target ? at(target) : step === 1 ? view.scrollHeight : 0 })
}
</script>

<div class="diffview" data-testid="diff-view">
  <div class="bar">
    {#if alone !== null}
      <button
        type="button"
        class="back"
        title="Back to before and after (Escape)"
        aria-label="Back to before and after"
        data-testid="image-back"
        onclick={() => (zoomed = null)}>←</button
      >
    {/if}
    <span class="file" title={path}>{path}</span>
    {#if diff !== null && !diff.binary && diff.hunks.length > 0}
      <span class="count"
        >{#if added > 0}<span class="plus">+{added}</span>{/if}
        {#if removed > 0}<span class="minus">−{removed}</span>{/if}</span
      >
      <span class="count">{diff.hunks.length} {diff.hunks.length === 1 ? 'hunk' : 'hunks'}</span>
    {/if}
    {#if alone !== null && diff?.images}
      {@const images = diff.images}
      <span class="tools" data-testid="image-tools">
        <button
          type="button"
          class="before"
          class:on={zoomed === 'before'}
          aria-pressed={zoomed === 'before'}
          disabled={images.before === null}
          onclick={() => (zoomed = 'before')}>BEFORE</button
        ><button
          type="button"
          class="after"
          class:on={zoomed === 'after'}
          aria-pressed={zoomed === 'after'}
          disabled={images.after === null}
          onclick={() => (zoomed = 'after')}>AFTER</button
        >
        <button type="button" class="nav" title="Zoom out (-)" onclick={() => viewer?.zoom(0.8)}
          >−</button
        ><span class="scale" data-testid="image-scale">{Math.round(viewScale * 100)}%</span><button
          type="button"
          title="Zoom in (+)"
          onclick={() => viewer?.zoom(1.25)}>+</button
        >
        <button type="button" class="nav" title="The whole picture (0)" onclick={() => viewer?.showWhole()}
          >FIT</button
        ><button type="button" title="Its own size (1)" onclick={() => viewer?.showActual()}>1:1</button>
      </span>
    {:else}
    <span class="tools" class:hidden={diff?.images !== undefined}>
      <button
        type="button"
        class:on={!split}
        aria-pressed={!split}
        data-testid="diff-unified"
        onclick={() => onsplit?.(false)}>UNIFIED</button
      ><button
        type="button"
        class:on={split}
        aria-pressed={split}
        data-testid="diff-split"
        onclick={() => onsplit?.(true)}>SPLIT</button
      >
      <button type="button" class="nav" title="previous hunk" onclick={() => jump(-1)}>◀</button>
      <button type="button" class="nav" title="next hunk" onclick={() => jump(1)}>▶</button>
    </span>
    {/if}
  </div>

  <div class="body" bind:this={body} data-testid="diff-body">
    {#if diff === null}
      <p class="note">{loading ? 'reading…' : 'nothing selected'}</p>
    {:else if diff.problem !== null}
      <p class="note" data-testid="diff-problem">{diff.problem}</p>
    {:else if alone !== null}
      <ImageViewer
        bind:this={viewer}
        bind:scale={viewScale}
        src={alone.dataUrl}
        alt="{path}, {zoomed} the change"
        onback={() => (zoomed = null)}
      />
    {:else if diff.images}
      {@const images = diff.images}
      <div class="images" data-testid="diff-images">
        {#each [['BEFORE', images.before, 'before'], ['AFTER', images.after, 'after']] as const as [label, image, side] (side)}
          <figure class="side" data-side={side}>
            <figcaption>
              <span class="which">{label}</span>
              {#if image !== null}
                {@const size = sizes[side]}
                {#if size}<span>{size.w} × {size.h}</span>{/if}
                <span>{formatBytes(image.bytes)}</span>
              {/if}
            </figcaption>
            {#if image !== null}
              <button
                type="button"
                class="frame"
                title="Look closer: zoom and pan"
                data-testid="diff-image-open"
                onclick={() => (zoomed = side)}
              >
                <img
                  src={image.dataUrl}
                  alt="{path}, {side} the change"
                  data-testid="diff-image"
                  onload={(event) => {
                    const img = event.currentTarget as HTMLImageElement
                    sizes = { ...sizes, [side]: { w: img.naturalWidth, h: img.naturalHeight } }
                  }}
                />
              </button>
            {:else}
              <p class="note">{side === 'before' ? 'none - the file is new' : 'none - the file is gone'}</p>
            {/if}
          </figure>
        {/each}
      </div>
      {#if images.note}<p class="note">{images.note}</p>{/if}
    {:else if diff.binary}
      <p class="note">BINARY · not drawn</p>
    {:else if diff.tooLarge}
      <p class="note">TOO LARGE · not drawn</p>
    {:else if diff.hunks.length === 0}
      <p class="note">no changes in the text</p>
    {:else}
      {#each hunks as hunk, h (h)}
        <div class="band"><span>{hunk.header}</span> <span class="ctx">{hunk.context}</span></div>
        {#if split}
          {#each hunk.split as pair, i (i)}
            <div class="pair">
              {@render side(pair.left, 'left')}
              {@render side(pair.right, 'right')}
            </div>
          {/each}
        {:else}
          {#each hunk.rows as row (row.index)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="ln {row.line.kind}"
              class:bloom={row.fresh}
              data-testid="diff-line"
              data-kind={row.line.kind}
              ondblclick={() => open(row.line)}
            >
              <span class="no">{row.line.old ?? ''}</span><span class="no">{row.line.new ?? ''}</span
              ><span class="sign">{SIGN[row.line.kind]}</span>{@render text(row.tokens)}
            </div>
          {/each}
        {/if}
      {/each}
      {#if diff.cut}<p class="note">… cut here: the rest is too long to draw</p>{/if}
    {/if}
  </div>
</div>

{#snippet text(runs: Token[])}
  <span class="code"
    >{#each runs as run, i (i)}<span class="t-{run.kind || 'plain'}" class:mark={run.mark}
        >{run.text}</span
      >{/each}</span
  >
{/snippet}

{#snippet side(row: Row | null, which: 'left' | 'right')}
  {#if row === null}
    <div class="ln blank {which}"></div>
  {:else}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="ln {row.line.kind} {which}"
      class:bloom={row.fresh}
      data-testid="diff-line"
      data-kind={row.line.kind}
      ondblclick={() => open(row.line)}
    >
      <span class="no">{(which === 'left' ? row.line.old : row.line.new) ?? ''}</span><span
        class="sign">{SIGN[row.line.kind]}</span
      >{@render text(row.tokens)}
    </div>
  {/if}
{/snippet}

<style>
.diffview {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  min-width: 0;
  min-height: 0;
  /*
   * Syntax colours come from the theme's own tokens, never a highlight.js theme:
   * they follow a theme switch, and each is a colour the theme already keeps
   * legible on its ground (tokens.css darkens the status colours in light mode).
   */
  --syn-keyword: var(--info);
  --syn-string: var(--warn);
  --syn-number: var(--accent-strong);
  --syn-comment: var(--text-muted);
  --syn-name: var(--text);
  --syn-meta: var(--accent);
  /* Kept faint: the text on top must read in every theme, light ones included. */
  --row-add: color-mix(in srgb, var(--ok) 11%, transparent);
  --row-del: color-mix(in srgb, var(--danger) 11%, transparent);
  --mark-add: color-mix(in srgb, var(--ok) 30%, transparent);
  --mark-del: color-mix(in srgb, var(--danger) 30%, transparent);
}

.bar {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding: 0.2rem var(--space-2);
  border-bottom: 1px solid var(--panel-rule);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  min-width: 0;
}

.file {
  overflow: hidden;
  min-width: 0;
  color: var(--text);
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
  text-align: left;
}

.count {
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: 0.9em;
}

.plus {
  color: var(--ok);
}

.minus {
  color: var(--danger);
}

.tools {
  display: flex;
  flex-shrink: 0;
  margin-left: auto;
}

.tools.hidden {
  visibility: hidden;
}

.back {
  flex-shrink: 0;
  align-self: center;
  padding: 0 0.45rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  line-height: 1.3;
  cursor: pointer;
}

.back:hover,
.back:focus-visible {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.tools .scale {
  display: inline-block;
  min-width: 3.6em;
  padding: 0 0.3rem;
  border-block: 1px solid var(--panel-rule);
  color: var(--text);
  font-size: var(--step--2);
  text-align: center;
}

.tools .scale + button {
  border-left: 1px solid var(--panel-rule);
}

.tools .before.on {
  border-color: var(--danger);
  background: color-mix(in srgb, var(--danger) 14%, transparent);
}

.tools .after.on {
  border-color: var(--ok);
  background: color-mix(in srgb, var(--ok) 14%, transparent);
}

.tools button:disabled {
  opacity: 0.4;
  cursor: default;
}

.tools button {
  padding: 0 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.1em;
  cursor: pointer;
}

.tools button + button {
  border-left: none;
}

.tools .nav {
  margin-left: 0.3rem;
  border-left: 1px solid var(--panel-rule);
}

.tools button.on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--text);
}

.tools button:hover {
  color: var(--text);
}

.body {
  overflow: auto;
  min-height: 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  line-height: 1.55;
}

.note {
  margin: var(--space-2);
  font-family: var(--font-ui);
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

/*
 * An image's change: before and after side by side, each on a checkerboard so a
 * transparent part shows as one, scaled down to fit and never up.
 */
.images {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-2);
  padding: var(--space-2);
}

.side {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0.3rem;
  margin: 0;
  min-width: 0;
}

.side figcaption {
  display: flex;
  gap: 0.8rem;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.side .which {
  color: var(--text);
}

.side[data-side='before'] .which {
  color: var(--danger);
}

.side[data-side='after'] .which {
  color: var(--ok);
}

.frame {
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 4rem;
  padding: 0.4rem;
  border: 1px solid var(--panel-rule);
  cursor: zoom-in;
  background:
    repeating-conic-gradient(
      color-mix(in srgb, var(--text-muted) 18%, transparent) 0 25%,
      transparent 0 50%
    )
    0 0 / 16px 16px;
}

.frame:hover,
.frame:focus-visible {
  border-color: var(--accent);
  outline: none;
}

.frame img {
  display: block;
  max-width: 100%;
  max-height: 60vh;
  image-rendering: auto;
}

/* A hunk's head: where it starts, and the function git found it in. */
.band {
  padding: 0.05rem var(--space-2);
  border-block: 1px solid var(--panel-rule);
  background: color-mix(in srgb, var(--info) 7%, transparent);
  color: var(--info);
  white-space: pre;
}

.band .ctx {
  color: var(--text-muted);
}

.ln {
  display: grid;
  grid-template-columns: 3.4em 3.4em 1.3em minmax(0, 1fr);
  white-space: pre;
  color: var(--text);
}

.pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.pair .ln {
  grid-template-columns: 3.4em 1.3em minmax(0, 1fr);
}

.pair .ln.left {
  border-right: 1px solid var(--panel-rule);
}

.ln.add {
  background: var(--row-add);
}

.ln.del {
  background: var(--row-del);
}

.ln.ctx .code {
  opacity: 0.8;
}

.no {
  padding-right: 0.5em;
  text-align: right;
  color: var(--text-muted);
  opacity: 0.7;
  user-select: none;
}

.sign {
  text-align: center;
  user-select: none;
}

.add .sign {
  color: var(--ok);
}

.del .sign {
  color: var(--danger);
}

.code {
  overflow: hidden;
  text-overflow: clip;
}

.mark {
  border-radius: 1px;
}

.add .mark {
  background: var(--mark-add);
}

.del .mark {
  background: var(--mark-del);
}

.t-keyword {
  color: var(--syn-keyword);
}

.t-string {
  color: var(--syn-string);
}

.t-number {
  color: var(--syn-number);
}

.t-comment {
  color: var(--syn-comment);
  font-style: italic;
}

.t-name {
  color: var(--syn-name);
}

.t-meta {
  color: var(--syn-meta);
}

/*
 * A line that arrived with this diff: it comes up bright, as a phosphor does, and
 * settles. Opacity and a filter only, played once, nothing left behind.
 */
.bloom {
  animation: diff-bloom calc(700ms * var(--motion-scale)) var(--ease-emphasized) backwards;
}

@keyframes diff-bloom {
  from {
    opacity: 0;
    filter: brightness(2.2);
  }
  35% {
    opacity: 1;
  }
}
</style>
