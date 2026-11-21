<script lang="ts">
import Readout from '../../parts/Readout.svelte'
import Strip from '../../parts/Strip.svelte'
import { besideMark, stripMetrics } from '../../parts/strip.js'
import type { ClockFaceProps } from '../../types.ts'
import { nightSpans, tapeHours, tapeMarks } from './tape.ts'

/**
 * TAPE: the day as a tape of ticks, like an instrument's heading tape. In the low strip the time
 * is on the left and the tape runs ahead of it - the next hours, the night as a band, midnight
 * named by the day it begins - so the width says what is coming. Taller, the time stands over a
 * tape centred on a hairline at now, with the past dimmer on its left.
 *
 * The tape moves once a minute, not every second: only the seconds change each second.
 */
const { now, zone }: ClockFaceProps = $props()

let width = $state(0)
let height = $state(0)
let readoutWidth = $state(0)

const minute = $derived(Math.floor(now.getTime() / 60_000) * 60_000)
const metrics = $derived(stripMetrics(width, height, readoutWidth))
const tall = $derived(metrics.tall)
const size = $derived(metrics.size)
// The tape's own box: beside the readout in the strip, under it when tall.
const tapeWidth = $derived(metrics.bandWidth)
const tapeHeight = $derived(
  tall ? Math.max(24, Math.min(height * 0.26, 140)) : Math.max(16, height - 6),
)
const hours = $derived(tapeHours(tapeWidth))
const from = $derived(tall ? minute - (hours / 2) * 3_600_000 : minute)
const to = $derived(from + hours * 3_600_000)
const x = (at: number): number => ((at - from) / (to - from)) * tapeWidth
const marks = $derived(tapeMarks(from, to, tapeWidth / hours >= 40))
const nights = $derived(nightSpans(from, to))
const cursor = $derived(x(minute))
const label = $derived(Math.max(10, Math.min(tapeHeight * (tall ? 0.2 : 0.42), tall ? 24 : 14)))
</script>

<Strip {tall} bind:width bind:height bind:readoutWidth>
  {#snippet time()}<Readout {now} {zone} {size} />{/snippet}
  {#if tapeWidth > 0}
    <svg class="tape" width={tapeWidth} height={tapeHeight} data-testid="clock-tape">
      {#each nights as n (n.from)}
        <rect class="night" x={x(n.from)} y="0" width={x(n.to) - x(n.from)} height={tapeHeight} />
      {/each}
      {#if tall}<rect class="past" x="0" y="0" width={cursor} height={tapeHeight} />{/if}
      <line class="base" x1="0" x2={tapeWidth} y1={tapeHeight - 0.5} y2={tapeHeight - 0.5} />
      {#each marks as m (m.at)}
        {@const len = m.kind === 'day' ? 0.75 : m.kind === 'hour' ? 0.45 : 0.2}
        <line
          class="tick {m.kind}"
          x1={x(m.at)}
          x2={x(m.at)}
          y1={tapeHeight}
          y2={tapeHeight * (1 - len)}
        />
        {#if m.label}
          {@const place = besideMark(x(m.at), tapeWidth, m.label.length, label)}
          <text
            class="label {m.kind}"
            x={place.x}
            text-anchor={place.anchor}
            y={tall ? tapeHeight * (1 - len) + label * 0.9 : label}
            font-size={label}>{m.label}</text
          >
        {/if}
      {/each}
      <line class="cursor" x1={cursor} x2={cursor} y1="0" y2={tapeHeight} />
    </svg>
  {/if}
</Strip>

<style>
.tape {
  flex: none;
  overflow: hidden;
}

.night {
  fill: color-mix(in srgb, var(--accent) 9%, transparent);
}

.past {
  fill: color-mix(in srgb, var(--panel-bg, transparent) 45%, transparent);
}

.base {
  stroke: var(--panel-rule);
}

.tick {
  stroke: var(--text-muted);
  stroke-width: 1;
}

.tick.day {
  stroke: var(--accent);
}

.label {
  fill: var(--text-muted);
  font-family: var(--font-ui);
}

.label.day {
  fill: var(--accent-strong);
  letter-spacing: 0.06em;
}

.cursor {
  stroke: var(--accent-strong);
  stroke-width: 1.5;
}
</style>
