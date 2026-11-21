<script lang="ts">
import { alarms } from '../../../../stores/alarms.svelte.ts'
import { tasks } from '../../../../stores/tasks.svelte.ts'
import Readout from '../../parts/Readout.svelte'
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
const tall = $derived(height >= 90)
const size = $derived(
  tall
    ? Math.min(height * 0.32, width * 0.16)
    : Math.max(12, Math.min(height * 0.66, width * 0.11)),
)
const bandWidth = $derived(Math.max(0, tall ? width - 24 : width - readoutWidth - 24))
const bandHeight = $derived(
  tall ? Math.max(30, Math.min(height * 0.2, 120)) : Math.max(16, height - 6),
)
const text = $derived(Math.max(10, Math.min(bandHeight * 0.36, tall ? 22 : 13)))
const events = $derived(aheadEvents(alarms.items, tasks.items, minute))
const nearest = $derived(events[0] ?? null)
const midnight = $derived(nextMidnight(minute))
const midnightName = $derived(
  ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date(midnight).getDay()] ?? '',
)
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
  const d = new Date(at)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<div class="face" class:tall bind:clientWidth={width} bind:clientHeight={height}>
  <div class="time" bind:clientWidth={readoutWidth}><Readout {now} {zone} {size} /></div>
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
        <text class="midnight-label" x={x(midnight) + 3} y={text} font-size={text}>{midnightName}</text>
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
      {#if nearest}
        <text
          class="nearest"
          x={Math.min(x(nearest.at) + 7, bandWidth - 4)}
          y={bandHeight / 2 + text * 0.36}
          font-size={text}
          text-anchor={x(nearest.at) > bandWidth * 0.6 ? 'end' : 'start'}
          data-testid="clock-ahead-next">{nearest.label.slice(0, 24)} · {untilLabel(nearest.at - minute)}</text
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
</div>

<style>
.face {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  padding: 0 12px;
  box-sizing: border-box;
  font-family: var(--font-ui);
}

.face.tall {
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.time,
.band {
  flex: none;
}

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

.nearest {
  fill: var(--text);
}

.none {
  fill: var(--text-muted);
}

.list {
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

.what {
  color: var(--text-muted);
}
</style>
