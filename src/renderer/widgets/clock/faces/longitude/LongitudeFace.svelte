<script lang="ts">
import { zoneOffsetMinutes } from '../../../../lib/time-zone.ts'
import Readout from '../../parts/Readout.svelte'
import type { ClockFaceProps } from '../../types.ts'
import { bandLight, cityMarks, offsetX } from './longitude.ts'

/**
 * LONGITUDE: the time on the left, and the rest of the strip is the world's time zones from
 * UTC-11 to UTC+14 - lit where it is day, dark where it is night, with cities standing at their
 * offsets and here marked. The margin the clock used to leave says where in the world it is day
 * and what time it is for the people at the other end.
 *
 * Everything on the band changes with the minute, so it is worked out once a minute; only the
 * seconds change each second.
 */
const { now, zone, timeZone }: ClockFaceProps = $props()

let width = $state(0)
let height = $state(0)
let readoutWidth = $state(0)

const minute = $derived(Math.floor(now.getTime() / 60_000) * 60_000)
const tall = $derived(height >= 90)
const size = $derived(
  tall
    ? Math.min(height * 0.34, width * 0.16)
    : Math.max(12, Math.min(height * 0.66, width * 0.11)),
)
const bandWidth = $derived(Math.max(0, tall ? width - 24 : width - readoutWidth - 24))
const bandHeight = $derived(
  tall ? Math.max(30, Math.min(height * 0.24, 160)) : Math.max(16, height - 6),
)
// Two lines (the code over the time) where there is room; one ("NYC 07") in a low strip.
const twoLines = $derived(bandHeight >= 30)
const text = $derived(Math.max(10, Math.min(bandHeight * (twoLines ? 0.22 : 0.55), tall ? 26 : 14)))
const columns = $derived(Math.max(24, Math.floor(bandWidth / 4)))
const light = $derived(bandLight(minute, columns))
const here = $derived(zoneOffsetMinutes(timeZone, minute) ?? 0)
// A label centred on a city at the band's end would be cut by it: kept inside, by half its width.
const inside = (cx: number, chars: number): number => {
  const half = chars * text * 0.32
  return Math.max(half, Math.min(bandWidth - half, cx))
}
const cities = $derived(cityMarks(minute, here, bandWidth, text * (twoLines ? 3.2 : 4.6)))
</script>

<div class="face" class:tall bind:clientWidth={width} bind:clientHeight={height}>
  <div class="time" bind:clientWidth={readoutWidth}><Readout {now} {zone} {size} /></div>
  {#if bandWidth > 0}
    <svg class="band" width={bandWidth} height={bandHeight} data-testid="clock-longitude">
      {#each light as l, i (i)}
        <rect
          class="sky"
          x={(i / columns) * bandWidth}
          y="0"
          width={bandWidth / columns + 0.5}
          height={bandHeight}
          opacity={0.12 + l * 0.88}
        />
      {/each}
      <rect class="frame" x="0.5" y="0.5" width={bandWidth - 1} height={bandHeight - 1} />
      {#each cities as c (c.code)}
        {@const cx = offsetX(c.offset, bandWidth)}
        <line class="pin" x1={cx} x2={cx} y1={bandHeight - 4} y2={bandHeight} />
        {#if twoLines}
          <text class="code" x={inside(cx, 3)} y={bandHeight * 0.4} font-size={text}>{c.code}</text>
          <text class="at" x={inside(cx, 5)} y={bandHeight * 0.4 + text * 1.15} font-size={text}
            >{tall ? `${c.hh}:${c.mm}` : c.hh}</text
          >
        {:else}
          <text class="at" x={inside(cx, 6)} y={bandHeight / 2 + text * 0.36} font-size={text}>{c.code} {c.hh}</text>
        {/if}
      {/each}
      <line
        class="here"
        x1={offsetX(here, bandWidth)}
        x2={offsetX(here, bandWidth)}
        y1="0"
        y2={bandHeight}
        data-testid="clock-longitude-here"
      />
    </svg>
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
}

.face.tall {
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.time {
  flex: none;
}

.band {
  flex: none;
}

/* Day is the accent, faint; night is the panel showing through. */
.sky {
  fill: color-mix(in srgb, var(--accent) 22%, transparent);
}

.frame {
  fill: none;
  stroke: var(--panel-rule);
}

.pin {
  stroke: var(--text-muted);
}

text {
  font-family: var(--font-ui);
  text-anchor: middle;
}

.code {
  fill: var(--text-muted);
  letter-spacing: 0.06em;
}

.at {
  fill: var(--text);
  font-variant-numeric: tabular-nums;
}

.here {
  stroke: var(--accent-strong);
  stroke-width: 1.5;
}
</style>
