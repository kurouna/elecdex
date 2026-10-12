<script lang="ts">
import { maskText, tokens } from '@shared/logwatch/text'
import type { LogLine } from '@shared/logwatch/types'
import { tick } from 'svelte'
import { SvelteSet } from 'svelte/reactivity'
import { appearance } from '../../stores/appearance.svelte.ts'
import {
  type ChooseHow,
  clockText,
  errorMarks,
  hitParts,
  markText,
  type Row,
  rowAt,
  rowLines,
  rowOffsets,
  type TimeMode,
  timeText,
} from './view.ts'

/**
 * The stream of a log (docs/logwatch.md §6.1-6.3): only the rows in sight are in the page, each
 * placed by the lines the rows above take - one each, or the text wrapped to the columns there
 * are (the font is monospaced, so that is counted, not measured), and an open trace's lines.
 *
 * It follows the end while it is there and the pointer is elsewhere; scrolled up, or with the
 * pointer over it, it holds still and counts what came below. When the oldest lines go (the
 * lines kept are full), the rows in sight stay where they are.
 */
interface Props {
  rows: readonly Row[]
  time: TimeMode
  /** For the times said as "ago". */
  now: number
  wrap: boolean
  errorBar: boolean
  mask: boolean
  match: RegExp | null
  /** The rows chosen (for EXPLAIN, COPY), by the number of each one's first line. */
  chosen: ReadonlySet<number>
  /** Said in the middle when no line is shown, or null. */
  empty?: string | null
  onselect: (row: Row, how: ChooseHow) => void
  onhover: (row: Row | null, event: { row: DOMRect; x: number | null } | null) => void
}

const {
  rows,
  time,
  now,
  wrap,
  errorBar,
  mask,
  match,
  chosen,
  empty = null,
  onselect,
  onhover,
}: Props = $props()

/** Rows drawn above and below what is in sight, so a quick scroll shows no gap. */
const OVERSCAN = 20
/** Columns kept for everything but the text, in `ch`: see `.row`'s grid. */
const FIXED_COLS = 41
const FIXED_COLS_NARROW = 30
/** Below this many columns in all, the source column goes. */
const NARROW_COLS = 80

let scroller = $state<HTMLDivElement | null>(null)
let probe = $state<HTMLSpanElement | null>(null)
let lineHeight = $state(18)
let charWidth = $state(8)
let viewHeight = $state(0)
let viewWidth = $state(0)
let scrollTop = $state(0)
const open = new SvelteSet<number>()

$effect(() => {
  const el = scroller
  if (el === null) return
  const observer = new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect
    if (box === undefined) return
    viewHeight = box.height
    viewWidth = box.width
  })
  observer.observe(el)
  return () => observer.disconnect()
})

// The type follows the window's height (reset.css): measured again with it and with the theme.
$effect(() => {
  void appearance.revision
  void viewHeight
  const p = probe
  if (p === null) return
  const box = p.getBoundingClientRect()
  if (box.height > 0) lineHeight = box.height
  if (box.width > 0) charWidth = box.width / 10
})

const narrow = $derived(viewWidth / charWidth < NARROW_COLS)
const cols = $derived(
  Math.max(10, Math.floor(viewWidth / charWidth) - (narrow ? FIXED_COLS_NARROW : FIXED_COLS)),
)
const heights = $derived(rows.map((row) => rowLines(row, open.has(row.item.seq), wrap, cols)))
const offsets = $derived(rowOffsets(heights))
const totalLines = $derived(offsets[rows.length] ?? 0)

const first = $derived(Math.max(0, rowAt(offsets, scrollTop / lineHeight) - OVERSCAN))
const last = $derived(
  Math.min(rows.length, rowAt(offsets, (scrollTop + viewHeight) / lineHeight) + 1 + OVERSCAN),
)
const shown = $derived(rows.slice(first, last).map((row, i) => ({ row, index: first + i })))

/* ---- Following ---- */

let atEnd = $state(true)
let pointerIn = $state(false)
/** The last row's seq when the stream stopped following: what came after is counted. */
let heldAfter = $state<number | null>(null)
/** The newest row's seq at the last arrival, for the rows that light as they come. */
let arrivedAfter = $state<number>(Number.POSITIVE_INFINITY)
/** The row at the top of the view, held in place across the oldest rows going. */
let anchor: { seq: number; within: number } | null = null

const holding = $derived(!atEnd || pointerIn)
const pending = $derived.by(() => {
  if (!holding || heldAfter === null) return { rows: 0, errors: 0 }
  let count = 0
  let errors = 0
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i]
    if (row === undefined || row.item.seq <= heldAfter) break
    count++
    if (row.item.kind === 'line' && (row.item.level === 'ERR' || row.item.level === 'FTL')) errors++
  }
  return { rows: count, errors }
})

$effect(() => {
  if (holding && heldAfter === null) heldAfter = rows.at(-1)?.item.seq ?? -1
  if (!holding) heldAfter = null
})

// After the rows change: to the end while following, else the row at the top kept where it was.
$effect.pre(() => {
  void offsets
  const el = scroller
  if (el === null) return
  const following = !holding
  const keep = anchor
  void tick().then(() => {
    if (following) {
      el.scrollTop = el.scrollHeight
      return
    }
    if (keep === null) return
    const index = rows.findIndex((row) => row.item.seq >= keep.seq)
    if (index < 0) return
    const target = (offsets[index] ?? 0) * lineHeight + keep.within
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target
  })
})

$effect(() => {
  const newest = rows.at(-1)?.item.seq
  return () => {
    if (newest !== undefined) arrivedAfter = newest
  }
})

function onscroll(): void {
  const el = scroller
  if (el === null) return
  scrollTop = el.scrollTop
  atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - lineHeight
  const index = rowAt(offsets, el.scrollTop / lineHeight)
  const row = rows[index]
  anchor =
    row === undefined
      ? null
      : { seq: row.item.seq, within: el.scrollTop - (offsets[index] ?? 0) * lineHeight }
  onhover(null, null)
}

/** A press on the error bar: the stream goes there, the place pressed in the middle of the view. */
function jump(event: MouseEvent): void {
  const el = scroller
  const bar = event.currentTarget as HTMLElement
  if (el === null) return
  const box = bar.getBoundingClientRect()
  const at = (event.clientY - box.top) / Math.max(1, box.height)
  el.scrollTop = at * el.scrollHeight - el.clientHeight / 2
}

function toEnd(): void {
  const el = scroller
  if (el === null) return
  pointerIn = false
  el.scrollTop = el.scrollHeight
  atEnd = true
}

function toggle(row: Row, event: MouseEvent): void {
  event.stopPropagation()
  if (open.has(row.item.seq)) open.delete(row.item.seq)
  else open.add(row.item.seq)
}

function hover(row: Row, event: PointerEvent): void {
  const target = event.currentTarget as HTMLElement
  onhover(row, { row: target.getBoundingClientRect(), x: event.clientX })
}

function focusRow(row: Row, event: FocusEvent): void {
  const target = event.currentTarget as HTMLElement
  onhover(row, { row: target.getBoundingClientRect(), x: null })
}

/** Ctrl (⌘) adds or takes away, Shift chooses a run: as lists everywhere choose. */
const howOf = (event: MouseEvent | KeyboardEvent): ChooseHow =>
  event.shiftKey ? 'range' : event.ctrlKey || event.metaKey ? 'toggle' : 'one'

function onkey(row: Row, event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onselect(row, howOf(event))
  }
}

/** The height the bar stands for, in lines: the stream's, or the view's when it is shorter. */
const barLines = $derived(Math.max(totalLines, viewHeight / lineHeight))
const marks = $derived(errorBar ? errorMarks(rows, offsets, barLines) : [])
const shownText = (text: string): string => (mask ? maskText(text) : text)
const lineOf = (row: Row): LogLine | null => (row.item.kind === 'line' ? row.item : null)
</script>

<div class="frame" class:narrow class:wrap>
  <div
    class="stream"
    bind:this={scroller}
    {onscroll}
    onpointerenter={() => (pointerIn = true)}
    onpointerleave={() => {
      pointerIn = false
      onhover(null, null)
    }}
    data-testid="logwatch-stream"
    role="list"
  >
    <span class="probe" bind:this={probe} aria-hidden="true">0000000000</span>
    {#if empty !== null}
      <p class="empty" data-testid="logwatch-empty">{empty}</p>
    {/if}
    <div class="space" style:height="{totalLines * lineHeight}px">
      {#each shown as { row, index } (row.item.seq)}
        {@const line = lineOf(row)}
        {#if line === null && row.item.kind === 'mark'}
          {@const mark = row.item}
          <div
            class="mark"
            style:top="{(offsets[index] ?? 0) * lineHeight}px"
            style:height="{(heights[index] ?? 1) * lineHeight}px"
            data-testid="logwatch-mark"
            data-mark={mark.mark}
            role="listitem"
          >
            <span class="what">{markText(mark, clockText)}</span>
          </div>
        {:else if line !== null}
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <div
            class="row lv-{line.level}"
            class:selected={chosen.has(row.item.seq)}
            class:arrive={row.last.seq > arrivedAfter}
            style:top="{(offsets[index] ?? 0) * lineHeight}px"
            role="listitem"
            tabindex="-1"
            data-testid="logwatch-row"
            data-seq={line.seq}
            data-level={line.level}
            onclick={(event) => {
              // A Shift-click would also select the text between: the lines are chosen instead.
              if (event.shiftKey) window.getSelection()?.removeAllRanges()
              onselect(row, howOf(event))
            }}
            onkeydown={(event) => onkey(row, event)}
            onpointerenter={(event) => hover(row, event)}
            onpointerleave={() => onhover(null, null)}
            onfocus={(event) => focusRow(row, event)}
          >
            <span class="t">{timeText(row, time, now)}</span>
            <span class="lvl">{line.level}</span>
            <span class="src">{shownText(line.source)}</span>
            <span class="msg"
              >{#each tokens(shownText(line.text)) as part, i (i)}<span class="k-{part.kind}"
                  >{#each hitParts(part.text, match) as piece, j (j)}{#if piece.hit}<mark>{piece.text}</mark
                      >{:else}{piece.text}{/if}{/each}</span
                >{/each}</span
            >
            <span class="tail">
              {#if row.reps > 1}<span class="rep" data-testid="logwatch-reps">×{row.reps}</span>{/if}
              {#if line.fresh}<span class="new" data-testid="logwatch-new">NEW</span>{/if}
              {#if line.more.length > 0}
                <button
                  type="button"
                  class="more"
                  aria-expanded={open.has(line.seq)}
                  onclick={(event) => toggle(row, event)}
                  data-testid="logwatch-more"
                  >{open.has(line.seq) ? '▾' : '▸'} +{line.more.length + line.moreCut}</button
                >
              {/if}
            </span>
            {#if open.has(line.seq)}
              <div class="trace" data-testid="logwatch-trace">{line.more.map(shownText).join('\n')}{line.moreCut > 0 ? `\n… ${line.moreCut} more lines` : ''}</div>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  </div>
  {#if errorBar}
    <!-- The list scrolls by keyboard too: the bar is a shortcut for the pointer. -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="bar" data-testid="logwatch-errorbar" aria-hidden="true" onclick={jump}>
      {#each marks as mark, i (i)}
        <i class:err={mark.level === 'ERR'} style:top="{mark.at * 100}%"></i>
      {/each}
      {#if totalLines > 0}
        <span
          class="view"
          style:top="{(scrollTop / (barLines * lineHeight)) * 100}%"
          style:height="{Math.min(100, (viewHeight / (barLines * lineHeight)) * 100)}%"
        ></span>
      {/if}
    </div>
  {/if}
  {#if pending.rows > 0}
    <button type="button" class="follow" onclick={toEnd} data-testid="logwatch-follow">
      ▼ {pending.rows} NEW{#if pending.errors > 0}<span class="err">{pending.errors} ERR</span>{/if}
    </button>
  {/if}
</div>

<style>
.frame {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
}

.stream {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  line-height: 1.5;
  scrollbar-width: none;
}

.stream::-webkit-scrollbar {
  display: none;
}

.probe {
  position: absolute;
  visibility: hidden;
  white-space: pre;
}

.space {
  position: relative;
}

.empty {
  position: absolute;
  top: 40%;
  left: 0;
  right: 0;
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
  text-align: center;
}

.row,
.mark {
  position: absolute;
  left: 0;
  right: 0;
}

/* Every column but the text in `ch` (FIXED_COLS in the script counts them). */
.row {
  display: grid;
  grid-template-columns: 12ch 4ch 10ch minmax(0, 1fr) 9ch;
  column-gap: 1ch;
  align-items: baseline;
  padding: 0 1ch 0 0.5ch;
  border-left: 2px solid transparent;
  cursor: default;
}

.narrow .row {
  grid-template-columns: 12ch 4ch minmax(0, 1fr) 9ch;
}

.narrow .src {
  display: none;
}

.row:hover {
  background: var(--accent-faint);
}

.row.selected {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  outline: 1px solid var(--accent-dim);
  outline-offset: -1px;
}

.row:focus-visible {
  outline: 1px solid var(--accent);
}

.lv-ERR,
.lv-FTL {
  border-left-color: var(--danger);
}

.lv-WRN {
  border-left-color: var(--warn);
}

/* A row that came lights once: an overlay fading by opacity, never a colour animated. */
.row.arrive::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--accent);
  opacity: 0;
  pointer-events: none;
  animation: logwatch-arrive calc(900ms * var(--motion-scale)) ease-out backwards;
  animation-play-state: var(--ambient-play-state);
}

@keyframes logwatch-arrive {
  from {
    opacity: 0.16;
  }
}

.t,
.src {
  overflow: hidden;
  color: var(--text-muted);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.lvl {
  font-size: var(--step--2);
  font-weight: 700;
  text-align: center;
  border: 1px solid var(--panel-rule);
  color: var(--text-muted);
  line-height: 1.4;
}

.lv-INF .lvl,
.lv-LOG .lvl {
  color: var(--text);
  border-color: var(--accent-dim);
}

.lv-WRN .lvl {
  color: var(--warn);
  border-color: var(--warn);
}

.lv-ERR .lvl,
.lv-FTL .lvl {
  color: var(--text-inverse);
  background: var(--danger);
  border-color: var(--danger);
}

.msg {
  min-width: 0;
  overflow: hidden;
  color: var(--text);
  white-space: pre;
  text-overflow: ellipsis;
}

.wrap .msg {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-all;
}

.lv-DBG .msg,
.lv-TRC .msg {
  opacity: 0.65;
}

.k-number {
  color: var(--accent-strong);
}

.k-string {
  color: var(--ok);
}

.k-address {
  color: var(--info);
}

.k-path {
  text-decoration: underline;
  text-decoration-color: var(--accent-dim);
  text-underline-offset: 2px;
}

.k-key,
.k-id {
  color: var(--text-muted);
}

mark {
  background: var(--warn);
  color: var(--text-inverse);
}

.tail {
  display: flex;
  gap: 0.5ch;
  justify-content: flex-end;
  white-space: nowrap;
}

.rep {
  color: var(--accent-strong);
  font-weight: 700;
}

.new {
  padding: 0 0.4ch;
  background: var(--info);
  color: var(--text-inverse);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
}

.more {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  cursor: pointer;
}

.more:hover {
  color: var(--text);
}

.trace {
  grid-column: 3 / -1;
  overflow-x: auto;
  color: var(--text-muted);
  white-space: pre;
  border-left: 1px solid var(--panel-rule);
  padding-left: 1ch;
}

.narrow .trace {
  grid-column: 2 / -1;
}

.mark {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 1.2rem;
  padding: 0 0.6rem;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.mark::before,
.mark::after {
  content: "";
  flex: 1;
  border-top: 1px dashed var(--panel-rule);
}

.bar {
  position: relative;
  flex: none;
  cursor: pointer;
  width: 0.6rem;
  margin-left: 0.15rem;
  border-left: 1px solid var(--panel-rule);
}

.bar i {
  position: absolute;
  left: 1px;
  right: 1px;
  height: 2px;
  background: var(--warn);
  opacity: 0.8;
}

.bar i.err {
  background: var(--danger);
  opacity: 1;
}

.bar .view {
  position: absolute;
  left: 0;
  right: 0;
  min-height: 4px;
  border: 1px solid var(--accent-dim);
  background: var(--accent-faint);
}

.follow {
  position: absolute;
  bottom: 0.6rem;
  left: 50%;
  translate: -50% 0;
  padding: 0.1rem 0.8rem;
  border: 1px solid var(--accent);
  background: var(--panel-bg-raised);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
}

.follow .err {
  margin-left: 0.5rem;
  color: var(--danger);
}
</style>
