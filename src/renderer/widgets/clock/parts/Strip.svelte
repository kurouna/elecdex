<script lang="ts">
import type { Snippet } from 'svelte'
import { STRIP_GAP, STRIP_PAD } from './strip.js'

/**
 * The frame of a band face: the time on the left and the band across the rest of the strip, or
 * the time over the band when `tall`. It measures itself and its time, so the face can work out
 * the band's width with stripMetrics (strip.ts) - the same paddings and gap as drawn here.
 */
interface Props {
  tall: boolean
  width?: number
  height?: number
  readoutWidth?: number
  time: Snippet
  children: Snippet
}

let {
  tall,
  width = $bindable(0),
  height = $bindable(0),
  readoutWidth = $bindable(0),
  time,
  children,
}: Props = $props()
</script>

<div
  class="strip"
  class:tall
  bind:clientWidth={width}
  bind:clientHeight={height}
  style:--pad="{STRIP_PAD}px"
  style:--gap="{STRIP_GAP}px"
>
  <div class="time" bind:clientWidth={readoutWidth}>{@render time()}</div>
  {@render children()}
</div>

<style>
.strip {
  display: flex;
  align-items: center;
  gap: var(--gap);
  height: 100%;
  padding: 0 var(--pad);
  box-sizing: border-box;
  font-family: var(--font-ui);
}

.strip.tall {
  flex-direction: column;
  justify-content: center;
  gap: calc(var(--gap) * 0.7);
}

.time,
.strip > :global(svg) {
  flex: none;
}
</style>
