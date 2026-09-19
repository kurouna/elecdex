<script lang="ts">
import { formatClock, zoneAbbreviation } from '../../lib/format.ts'
import { msUntilBoundary } from '../../lib/frame-loop.ts'
import Digits from '../common/Digits.svelte'
import type { WidgetProps } from '../registry.ts'

/**
 * eDEX-UI's clock: large light digits, each in a fixed-width cell so the time
 * does not jitter as numerals change width.
 *
 * Ticks on its own timer aligned to the second boundary, rather than an
 * unaligned setInterval that would drift visibly behind the system clock - the
 * same boundary the frame loop wakes on, so each tick is drawn in its frame.
 *
 * The digits roll as they change (Digits.svelte), so the second is seen to land
 * rather than simply to be different. Only the column that changed plays it, so
 * the hours sit still through the hour.
 */
const { paneId }: WidgetProps = $props()

let now = $state(new Date())

$effect(() => {
  let timer: ReturnType<typeof setTimeout>
  const schedule = (): void => {
    timer = setTimeout(() => {
      now = new Date()
      schedule()
    }, msUntilBoundary(1000))
  }
  schedule()
  return () => clearTimeout(timer)
})

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
// The abbreviation changes only with daylight saving; once a minute is plenty. It
// must read only the minute: reading `now` too would rebuild its Intl formatters
// every second, the costliest script this widget runs.
const minute = $derived(Math.floor(now.getTime() / 60_000))
const zone = $derived(zoneAbbreviation(timeZone, new Date(minute * 60_000)))

const parts = $derived(formatClock(now))
const shown = $derived(`${parts.hh}:${parts.mm}:${parts.ss}`)
</script>

<div class="clock" data-testid="clock" data-pane-id={paneId}>
  <time datetime={now.toISOString()}>
    <Digits value={shown} />
    {#if zone}<small class="zone" title={timeZone} data-testid="clock-zone">{zone}</small>{/if}
  </time>
</div>

<style>
.clock {
  container-type: size;
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 2rem;
}

time {
  display: flex;
  align-items: center;
  font-family: var(--font-ui);
  font-weight: 300;
  /* Fill the pane: bounded by both its height and its width. */
  font-size: min(92cqh, 16.5cqw);
  line-height: 1;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  /* Every digit takes the same room, so the row does not shuffle as one rolls
     through it; the colons are narrower, as they were when they were their own
     element. */
  --digit-width: 0.62em;
  --separator-width: 0.4em;
  --separator-opacity: 0.8;
}

/* The zone sits on the digits' baseline, small enough not to compete with them. */
.zone {
  align-self: flex-end;
  margin: 0 0 0.1em 0.3em;
  font-size: 0.38em;
  font-weight: 400;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}
</style>
