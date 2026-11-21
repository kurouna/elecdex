<script lang="ts">
import { formatClock, zoneAbbreviation } from '../../lib/format.ts'
import { onBoundary } from '../../lib/frame-loop.ts'
import { systemTimeZone } from '../../lib/time-zone.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import Digits from '../common/Digits.svelte'
import type { WidgetProps } from '../registry.ts'

/**
 * eDEX-UI's clock: large light digits, each in a fixed-width cell so the time
 * does not jitter as numerals change width.
 *
 * Ticks on the shared second boundary (lib/frame-loop.ts), rather than an
 * unaligned setInterval that would drift visibly behind the system clock - the
 * same boundary the frame loop wakes on, so each tick is drawn in its frame, and
 * none at all while the window is put away.
 *
 * The digits roll as they change (Digits.svelte), so the second is seen to land
 * rather than simply to be different. Only the column that changed plays it, so
 * the hours sit still through the hour.
 */
const { paneId, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))

let now = $state(new Date())

// Behind a tab it ticked every second for no one (found in the sweep); shown again, it is right
// at once.
$effect(() => {
  if (!visible) return
  now = new Date()
  return onBoundary(1000, () => {
    now = new Date()
  })
})

// The zone and its abbreviation change only with daylight saving or the system's zone being
// changed; once a minute is plenty. They must read only the minute: reading `now` too would
// rebuild their Intl formatters every second, the costliest script this widget runs. The zone is
// asked again each minute rather than once, so a zone changed in the system (a trip) is named
// as the digits follow it, not the zone the app started in.
const minute = $derived(Math.floor(now.getTime() / 60_000))
const timeZone = $derived.by(() => {
  void minute
  return systemTimeZone()
})
const zone = $derived(zoneAbbreviation(timeZone, new Date(minute * 60_000)))

const parts = $derived(formatClock(now))
const shown = $derived(`${parts.hh}:${parts.mm}:${parts.ss}`)
// What a screen reader says: the minute, not the second, and not digit by digit as the rolling
// cells would be read.
const spoken = $derived(`${parts.hh}:${parts.mm}`)
</script>

<div class="clock" data-testid="clock" data-pane-id={paneId}>
  <div class="face" style:--zone-chars={zone.length}>
    <time datetime={now.toISOString()} role="img" aria-label={spoken}>
      <Digits value={shown} />
    </time>
    {#if zone}<small class="zone" role="img" aria-label="time zone {zone}, {timeZone}" data-testid="clock-zone"
        >{zone}</small
      >{/if}
  </div>
</div>

<style>
.clock {
  container-type: size;
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 2rem;
}

/*
 * The digits and the zone, sized to fill the pane: bounded by its height and its width. The
 * zone's room is counted by its letters (--zone-chars), so a long one ("UTC+5:45") shrinks the
 * digits rather than running out of the pane, and its floor at --step--2 is counted too, so a
 * narrow pane makes the digits smaller rather than the zone unreadable. Every digit is 0.62em
 * and every colon 0.4em (4.52em for the six and two); a letter of the zone at most 0.8 of its
 * own em, with 0.3 of it before. For three or four letters the third and fourth bounds are
 * looser than 16.5cqw, so the usual clock is drawn as it always was.
 */
.face {
  --zone-em: calc(var(--zone-chars, 0) * 0.8 + 0.3);
  display: flex;
  align-items: center;
  font-family: var(--font-ui);
  font-weight: 300;
  font-size: min(
    92cqh,
    16.5cqw,
    calc(100cqw / (4.52 + 0.38 * var(--zone-em))),
    calc((100cqw - var(--step--2) * var(--zone-em)) / 4.52)
  );
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

time {
  display: flex;
  align-items: center;
}

/* The zone sits on the digits' baseline, small enough not to compete with them, and never
   below the smallest step a label may take. */
.zone {
  align-self: flex-end;
  margin: 0 0 0.1em 0.3em;
  font-size: max(0.38em, var(--step--2));
  font-weight: 400;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  white-space: nowrap;
}

</style>
