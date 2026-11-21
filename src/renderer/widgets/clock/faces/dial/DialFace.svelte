<script lang="ts">
import Readout from '../../parts/Readout.svelte'
import type { ClockFaceProps } from '../../types.ts'
import { dialLayout, dialTicks, handAngles } from './dial.ts'

/**
 * DIAL: a thin-lined analogue dial, and beside it the time in figures on one line - HH:MM, the
 * seconds and the zone, never wrapped - so the dial and the figures share the strip's width
 * rather than the dial sitting alone in its middle.
 *
 * Each second only the second hand's rotation changes; the hour and minute hands move with it,
 * by a fraction of a degree.
 */
const { now, zone }: ClockFaceProps = $props()

let width = $state(0)
let height = $state(0)

const layout = $derived(dialLayout(width, height))
const diameter = $derived(layout.diameter)
const size = $derived(layout.size)
const hands = $derived(handAngles(now))
const ticks = $derived(dialTicks(diameter))
</script>

<div class="face" class:stacked={layout.stacked} bind:clientWidth={width} bind:clientHeight={height}>
  <svg class="dial" width={diameter} height={diameter} viewBox="-50 -50 100 100" data-testid="clock-dial">
    <circle class="rim" r="48" />
    {#each ticks as t (t.angle)}
      <line
        class="tick"
        class:major={t.major}
        y1={t.major ? -39 : -44}
        y2="-47"
        transform="rotate({t.angle})"
      />
    {/each}
    <line class="hand hour" y1="6" y2="-26" transform="rotate({hands.hour})" />
    <line class="hand minute" y1="6" y2="-38" transform="rotate({hands.minute})" />
    <line class="hand second" y1="8" y2="-42" transform="rotate({hands.second})" />
    <circle class="hub" r="2.2" />
  </svg>
  <Readout {now} {zone} {size} layout="line" />
</div>

<style>
.face {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  height: 100%;
  padding: 0 12px;
  box-sizing: border-box;
}

.face.stacked {
  flex-direction: column;
  gap: 8px;
}

.dial {
  flex: none;
}

.rim {
  fill: none;
  stroke: var(--panel-rule);
  stroke-width: 1.2;
}

.tick {
  stroke: var(--text-muted);
  stroke-width: 0.8;
}

.tick.major {
  stroke: var(--accent);
  stroke-width: 1.8;
}

.hand {
  stroke: var(--text);
  stroke-linecap: round;
}

.hour {
  stroke-width: 3.4;
}

.minute {
  stroke-width: 2;
}

.second {
  stroke: var(--accent-strong);
  stroke-width: 1;
}

.hub {
  fill: var(--accent-strong);
}
</style>
