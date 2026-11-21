<script lang="ts">
import { formatClock } from '../../../lib/format.ts'

/**
 * The time as the faces that give the rest of the strip to something else write it: HH:MM
 * large, the seconds and the zone small beside it.
 *
 * - `stack`: the zone over the seconds, one small column - the readout takes the least width,
 *   for faces whose width is the point (WEEK, TAPE, LONGITUDE, AHEAD).
 * - `line`: the seconds and then the zone after HH:MM on one line, never wrapped (DIAL).
 *
 * `size` is the height of the digits in pixels, which the face works out from its room.
 */
interface Props {
  now: Date
  zone: string
  size: number
  layout?: 'stack' | 'line'
}

const { now, zone, size, layout = 'stack' }: Props = $props()
const parts = $derived(formatClock(now))
</script>

<span class="readout {layout}" style:--size="{size}px">
  <span class="hm">{parts.hh}:{parts.mm}</span>
  {#if layout === 'stack'}
    <span class="side">
      <span class="zone">{zone}</span>
      <span class="ss">{parts.ss}</span>
    </span>
  {:else}
    <span class="ss">{parts.ss}</span>{#if zone}<span class="zone">{zone}</span>{/if}
  {/if}
</span>

<style>
.readout {
  display: inline-flex;
  align-items: flex-end;
  gap: calc(var(--size) * 0.14);
  font-family: var(--font-ui);
  line-height: 1;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.hm {
  font-size: var(--size);
  font-weight: 300;
  letter-spacing: 0.02em;
}

.side {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--size) * 0.06);
  padding-bottom: calc(var(--size) * 0.08);
}

.ss {
  font-size: max(calc(var(--size) * 0.42), var(--step--2));
  color: var(--accent-strong);
}

.line .ss {
  padding-bottom: calc(var(--size) * 0.08);
}

.zone {
  font-size: max(calc(var(--size) * 0.28), var(--step--2));
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.line .zone {
  margin-left: calc(var(--size) * 0.12);
  padding-bottom: calc(var(--size) * 0.1);
}
</style>
