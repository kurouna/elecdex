<script lang="ts">
import { untrack } from 'svelte'
import { formatClock } from '../../../../lib/format.ts'
import type { ClockFaceProps } from '../../types.ts'
import { minuteShare, nextSlots, numeral, type Slot, vectorLayout } from './strokes.ts'

/**
 * VECTOR: thin single-stroke numerals of our own (strokes.ts), drawn as a plotter would. When
 * a digit changes only that digit is drawn again, the pen running along its path for half a
 * second while the old one fades; the rest of the face stands still. The seconds are small,
 * the zone smaller, and a hairline under the digits fills over the minute.
 *
 * The pen is a CSS animation of stroke-dashoffset, its length scaled by `--motion-scale`, so
 * with motion reduced (or the window out of sight) the new digit is simply there and the old
 * one gone. It is stepped five times rather than run smoothly: a smooth one would repaint the
 * digit at the display's rate, and five steps read just as well as a pen.
 */
const { now, zone }: ClockFaceProps = $props()

let width = $state(0)
let height = $state(0)
let slots = $state.raw<Slot[]>([])

const parts = $derived(formatClock(now))
const layout = $derived(vectorLayout(width, height, zone.length))
const digitHeight = $derived(16 * layout.k)
const share = $derived(minuteShare(now.getSeconds()))

// The slots follow the digits: the ones that changed get a new generation, which draws them
// afresh below; the others are kept as they were, so nothing redraws them.
$effect.pre(() => {
  const digits = `${parts.hh}${parts.mm}${parts.ss}`
  slots = nextSlots(
    untrack(() => slots),
    digits,
  )
})
</script>

<div class="face" bind:clientWidth={width} bind:clientHeight={height} style:--size="{digitHeight}px">
  {#if layout.k > 0}
    <svg {width} {height} aria-hidden="true">
      {#each slots as slot, i (i)}
        {@const place = layout.slots[i]}
        {#if place}
          <g transform="translate({place.x} {place.y}) scale({place.scale})" stroke-width={layout.stroke / place.scale}>
            {#key slot.gen}
              {#if slot.old !== null}<path class="old" d={numeral(slot.old)} />{/if}
              <path class:pen={slot.old !== null} d={numeral(slot.digit)} pathLength="1" />
            {/key}
          </g>
        {/if}
      {/each}
      {#each layout.colon as dot (dot.y)}<circle class="dot" cx={dot.x} cy={dot.y} r={dot.r} />{/each}
      {#if zone}
        <text class="zone" class:compact={layout.compact} x={layout.zone.x} y={layout.zone.y} data-testid="clock-zone"
          >{zone}</text
        >
      {/if}
      <line class="bed" x1={layout.line.x1} x2={layout.line.x2} y1={layout.line.y} y2={layout.line.y} />
      <line
        class="progress"
        data-testid="clock-seconds-line"
        x1={layout.line.x1}
        x2={layout.line.x1 + (layout.line.x2 - layout.line.x1) * share}
        y1={layout.line.y}
        y2={layout.line.y}
      />
    </svg>
  {/if}
</div>

<style>
.face {
  height: 100%;
}

svg {
  display: block;
}

path {
  fill: none;
  stroke: var(--text);
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* The pen: the path drawn from its start to its end. Its resting dash covers the whole path,
   so when the animation ends (or never plays) the digit is simply whole. */
.pen {
  stroke-dasharray: 1 1;
  animation: vector-pen calc(500ms * var(--motion-scale)) steps(5) backwards;
  animation-play-state: var(--ambient-play-state);
}

@keyframes vector-pen {
  from {
    stroke-dashoffset: 1;
  }
}

/* The digit it replaced, fading as the new one is drawn; at rest it is not seen. */
.old {
  opacity: 0;
  animation: vector-fade calc(600ms * var(--motion-scale)) steps(6) backwards;
  animation-play-state: var(--ambient-play-state);
}

@keyframes vector-fade {
  from {
    opacity: 0.6;
  }
}

.dot {
  fill: var(--text);
}

.zone {
  font-family: var(--font-ui);
  font-size: max(calc(var(--size) * 0.22), var(--step--2));
  letter-spacing: 0.08em;
  fill: var(--text-muted);
}

.zone.compact {
  font-size: max(calc(var(--size) * 0.3), var(--step--2));
}

.bed {
  stroke: var(--text-muted);
  stroke-width: 1;
  opacity: 0.45;
  shape-rendering: crispEdges;
}

.progress {
  stroke: var(--accent);
  stroke-width: 1.6;
}
</style>
