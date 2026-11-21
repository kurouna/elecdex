<script lang="ts">
import { zoneOffsetMinutes } from '../../../../lib/time-zone.ts'
import Readout from '../../parts/Readout.svelte'
import Strip from '../../parts/Strip.svelte'
import { stripMetrics } from '../../parts/strip.js'
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
const metrics = $derived(stripMetrics(width, height, readoutWidth))
const tall = $derived(metrics.tall)
const size = $derived(metrics.size)
const bandWidth = $derived(metrics.bandWidth)
const bandHeight = $derived(
  tall ? Math.max(30, Math.min(height * 0.24, 160)) : Math.max(16, height - 6),
)
// Two lines (the code over the time) where there is room; one ("NYC 07") in a low strip.
const twoLines = $derived(bandHeight >= 30)
const text = $derived(Math.max(10, Math.min(bandHeight * (twoLines ? 0.22 : 0.55), tall ? 26 : 14)))
const columns = $derived(Math.max(24, Math.floor(bandWidth / 8)))
/** The sky gradient's id, unique to this pane: two clock panes each draw their own. */
const uid = $props.id()
const skyId = `longitude-sky-${uid}`
const light = $derived(bandLight(minute, columns))
const here = $derived(zoneOffsetMinutes(timeZone, minute) ?? 0)
// A label centred on a city at the band's end would be cut by it: kept inside, by half its width.
const inside = (cx: number, chars: number): number => {
  const half = chars * text * 0.32
  return Math.max(half, Math.min(bandWidth - half, cx))
}
const cities = $derived(cityMarks(minute, here, bandWidth, text * (twoLines ? 3.2 : 4.6)))
</script>

<Strip {tall} bind:width bind:height bind:readoutWidth>
  {#snippet time()}<Readout {now} {zone} {size} />{/snippet}
  {#if bandWidth > 0}
    <svg class="band" width={bandWidth} height={bandHeight} data-testid="clock-longitude">
      <!-- One rect and a gradient: rects a column each, overlapped half a pixel to hide their
           seams, showed the overlaps as stripes every 4 px (review 2026-11-22). -->
      <defs>
        <linearGradient id={skyId} x1="0" x2="1" y1="0" y2="0">
          {#each light as l, i (i)}
            <stop class="sky" offset={columns > 1 ? i / (columns - 1) : 0} stop-opacity={0.12 + l * 0.88} />
          {/each}
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={bandWidth} height={bandHeight} fill="url(#{skyId})" />
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
</Strip>

<style>
/* Day is the accent, faint; night is the panel showing through. */
.sky {
  stop-color: color-mix(in srgb, var(--accent) 22%, transparent);
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

/* In the text colour: muted, a code sank into the lit band of a dark theme (review 2026-11-22).
   The time under it is told apart by its weight. */
.code {
  fill: var(--text);
  opacity: 0.8;
  letter-spacing: 0.06em;
}

.at {
  fill: var(--text);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.here {
  stroke: var(--accent-strong);
  stroke-width: 1.5;
}
</style>
