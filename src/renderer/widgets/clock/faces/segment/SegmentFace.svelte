<script lang="ts">
import { formatClock } from '../../../../lib/format.ts'
import type { ClockFaceProps } from '../../types.ts'
import {
  COLON_DOTS,
  DOT_HEIGHT,
  DOT_WIDTH,
  HM_BOX,
  HM_OFFSETS,
  lit,
  SECONDS_SCALE,
  SEGMENT_NAMES,
  SS_BOX,
  SS_OFFSETS,
  segmentPoints,
  segmentSize,
} from './segments.ts'

/**
 * SEGMENT: a vacuum fluorescent display. HH:MM in seven-segment digits of our own
 * (segments.ts), the seconds at 0.6 of their size on the same baseline, and the zone small in
 * the room above the seconds. An unlit segment stays faintly where it is, as on a real tube;
 * a lit one glows on a dark theme and is plain on a light one, where a glow is only a blur.
 *
 * The unlit segments are drawn once and never change; each second only the lit group of the
 * digits that changed is redrawn, and the glow is a static filter on that group, not an
 * animation.
 */
const { now, zone }: ClockFaceProps = $props()

let width = $state(0)
let height = $state(0)

const parts = $derived(formatClock(now))
const hm = $derived(`${parts.hh}${parts.mm}`)
const size = $derived(segmentSize(width, height, zone.length))
const viewBox = (box: readonly number[]): string => box.join(' ')
</script>

{#snippet digits(text: string, offsets: readonly number[])}
  <g class="ghost">
    {#each offsets as x, i (i)}
      {#each SEGMENT_NAMES as s (s)}<polygon points={segmentPoints(s, x)} />{/each}
    {/each}
  </g>
  <g class="lit">
    {#each offsets as x, i (i)}
      {#each SEGMENT_NAMES as s (s)}{#if lit(text[i] ?? '', s)}<polygon points={segmentPoints(s, x)} />{/if}{/each}
    {/each}
  </g>
{/snippet}

<div class="face" bind:clientWidth={width} bind:clientHeight={height} style:--size="{size}px">
  {#if size > 0}
    <svg class="hm" viewBox={viewBox(HM_BOX)} height={size} width={(size * HM_BOX[2]) / HM_BOX[3]} aria-hidden="true">
      {@render digits(hm, HM_OFFSETS)}
      <g class="lit">
        {#each COLON_DOTS as [x, y] (y)}<rect {x} {y} width={DOT_WIDTH} height={DOT_HEIGHT} />{/each}
      </g>
    </svg>
    <span class="side">
      {#if zone}<span class="zone" data-testid="clock-zone">{zone}</span>{/if}
      <svg
        class="ss"
        viewBox={viewBox(SS_BOX)}
        height={size * SECONDS_SCALE}
        width={(size * SECONDS_SCALE * SS_BOX[2]) / SS_BOX[3]}
        aria-hidden="true"
      >
        {@render digits(parts.ss, SS_OFFSETS)}
      </svg>
    </span>
  {/if}
</div>

<style>
.face {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: calc(var(--size) * 0.12);
  height: 100%;
  box-sizing: border-box;
  /* The row stands on the digits' baseline, centred in the pane: the room the digits leave
     is shared above and below. */
  padding-bottom: max(0px, calc(50cqh - var(--size) / 2));
}

svg {
  display: block;
  flex: none;
  overflow: visible;
}

.side {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--size) * 0.04);
}

.zone {
  font-family: var(--font-ui);
  font-size: max(calc(var(--size) * 0.28), var(--step--2));
  line-height: 1;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  white-space: nowrap;
}

/* A segment that is off is still there, faintly: what makes a VFD read as one. */
.ghost {
  fill: var(--accent-strong);
  opacity: 0.08;
}

.lit {
  fill: var(--accent-strong);
  filter: drop-shadow(0 0 calc(var(--size) * 0.03) color-mix(in srgb, var(--accent-strong) 75%, transparent));
}

/* On a white ground a glow is a blur round the digits, not light. */
:global([data-mode='light']) .lit {
  filter: none;
}
</style>
