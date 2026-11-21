<script lang="ts">
import { formatClock } from '../../../../lib/format.ts'
import { alarms } from '../../../../stores/alarms.svelte.ts'
import { tasks } from '../../../../stores/tasks.svelte.ts'
import Readout from '../../parts/Readout.svelte'
import Strip from '../../parts/Strip.svelte'
import { besideMark, stripMetrics } from '../../parts/strip.js'
import { WEEKDAYS } from '../../parts/words.js'
import type { ClockFaceProps } from '../../types.ts'
import { AHEAD_TICKS, aheadEvents, aheadX, nextMidnight, untilLabel } from './ahead.ts'

/**
 * AHEAD: the time on the left, and the rest of the strip is the next 24 hours - on a log scale,
 * so the coming minutes have most of the width and tomorrow morning still fits - with the alarms
 * (◆) and the tasks falling due (●) standing where they come. The nearest is named, with how
 * long until it.
 *
 * The alarms and tasks are main's files, read through the stores the TIMER and TASKS panes share,
 * and only while the pane is seen. The axis moves once a minute; only the seconds change each
 * second.
 */
const { now, zone, visible }: ClockFaceProps = $props()

$effect(() => {
  if (!visible) return
  const releaseAlarms = alarms.use()
  const releaseTasks = tasks.use()
  return () => {
    releaseAlarms()
    releaseTasks()
  }
})

let width = $state(0)
let height = $state(0)
let readoutWidth = $state(0)

const minute = $derived(Math.floor(now.getTime() / 60_000) * 60_000)
const metrics = $derived(stripMetrics(width, height, readoutWidth))
const tall = $derived(metrics.tall)
const size = $derived(metrics.size)
const bandWidth = $derived(metrics.bandWidth)
const bandHeight = $derived(
  tall ? Math.max(30, Math.min(height * 0.2, 120)) : Math.max(16, height - 6),
)
const text = $derived(Math.max(10, Math.min(bandHeight * 0.36, tall ? 22 : 13)))
const events = $derived(aheadEvents(alarms.items, tasks.items, minute))
const nearest = $derived(events[0] ?? null)
const midnight = $derived(nextMidnight(minute))
const midnightName = $derived(WEEKDAYS[new Date(midnight).getDay()] ?? '')
const x = (at: number): number => aheadX(at - minute, bandWidth)
// The ticks' labels only where they do not crowd: the scale is dense at the far end.
const ticks = $derived(
  AHEAD_TICKS.filter(
    ([ms], i) =>
      i === 0 ||
      aheadX(ms, bandWidth) - aheadX(AHEAD_TICKS[i - 1]?.[0] ?? 0, bandWidth) > text * 2.4,
  ),
)
const listed = $derived(events.slice(0, 4))
const clockOf = (at: number): string => {
  const { hh, mm } = formatClock(new Date(at))
  return `${hh}:${mm}`
}
const nearestLabel = $derived(
  nearest === null ? '' : `${nearest.label.slice(0, 24)} · ${untilLabel(nearest.at - minute)}`,
)
// 7 px clear of its marker on whichever side it fits: right-aligned at the band's end it once
// ended 7 px right of the marker, over it (review 2026-11-22).
const nearestPlace = $derived(
  nearest === null ? null : besideMark(x(nearest.at), bandWidth, nearestLabel.length, text, 7),
)
</script>

<Strip {tall} bind:width bind:height bind:readoutWidth>
  {#snippet time()}<Readout {now} {zone} {size} />{/snippet}
  {#if bandWidth > 0}
    <svg class="band" width={bandWidth} height={bandHeight} data-testid="clock-ahead">
      <line class="base" x1="0" x2={bandWidth} y1={bandHeight - 0.5} y2={bandHeight - 0.5} />
      {#each ticks as [ms, label] (ms)}
        <line class="tick" x1={aheadX(ms, bandWidth)} x2={aheadX(ms, bandWidth)} y1={bandHeight} y2={bandHeight - 5} />
        {#if tall}
          <text
            class="tick-label"
            x={Math.min(aheadX(ms, bandWidth), bandWidth - text * 0.9)}
            y={bandHeight - 7} font-size={text}>{label}</text>
        {/if}
      {/each}
      {#if midnight - minute < 24 * 3_600_000}
        <line class="midnight" x1={x(midnight)} x2={x(midnight)} y1="0" y2={bandHeight} />
        {@const place = besideMark(x(midnight), bandWidth, midnightName.length, text)}
        <text class="midnight-label" x={place.x} y={text} font-size={text} text-anchor={place.anchor}
          >{midnightName}</text
        >
      {/if}
      {#each events as e (e.key)}
        {@const ex = x(e.at)}
        {#if e.kind === 'alarm'}
          <rect
            class="mark alarm"
            x={ex - 3.5}
            y={bandHeight / 2 - 3.5}
            width="7"
            height="7"
            transform="rotate(45 {ex} {bandHeight / 2})"
          />
        {:else}
          <circle class="mark task" cx={ex} cy={bandHeight / 2} r="3.5" />
        {/if}
      {/each}
      {#if nearest && nearestPlace}
        <text
          class="nearest"
          x={nearestPlace.x}
          y={bandHeight / 2 + text * 0.36}
          font-size={text}
          text-anchor={nearestPlace.anchor}
          data-testid="clock-ahead-next">{nearestLabel}</text
        >
      {:else}
        <text class="none" x="4" y={bandHeight / 2 + text * 0.36} font-size={text}>nothing in 24h</text>
      {/if}
    </svg>
  {/if}
  {#if tall && listed.length > 0}
    <ol class="list">
      {#each listed as e (e.key)}
        <li><span class="glyph">{e.kind === 'alarm' ? '◆' : '●'}</span> {clockOf(e.at)} <span class="what">{e.label}</span> <span class="until">{untilLabel(e.at - minute)}</span></li>
      {/each}
    </ol>
  {/if}
</Strip>

<style>
.base,
.tick {
  stroke: var(--panel-rule);
}

text {
  font-family: var(--font-ui);
}

.tick-label {
  fill: var(--text-muted);
  text-anchor: middle;
}

.midnight {
  stroke: var(--text-muted);
  stroke-dasharray: 2 2;
}

.midnight-label {
  fill: var(--text-muted);
  letter-spacing: 0.06em;
}

.mark {
  fill: var(--accent-strong);
}

.mark.task {
  fill: none;
  stroke: var(--accent-strong);
  stroke-width: 1.5;
}

/* Haloed in the pane's ground: the name runs over the markers of the events after it. */
.nearest {
  fill: var(--text);
  paint-order: stroke;
  stroke: var(--app-bg);
  stroke-width: 3px;
  stroke-linejoin: round;
}

.none {
  fill: var(--text-muted);
}

/* One line an event, whatever its name: a long task name ends in an ellipsis rather than
   wrapping past the pane's edge (review 2026-11-22). */
.list {
  align-self: stretch;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--step--1);
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.glyph,
.until {
  color: var(--accent-strong);
}

.list li {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.what {
  color: var(--text-muted);
}
</style>
