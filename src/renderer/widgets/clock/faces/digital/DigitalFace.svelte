<script lang="ts">
import { formatClock } from '../../../../lib/format.ts'
import Digits from '../../../common/Digits.svelte'
import type { ClockFaceProps } from '../../types.ts'

/**
 * DIGITAL: eDEX-UI's clock, the face elecdex began with. Large light digits, each in a
 * fixed-width cell so the time does not jitter as numerals change width; a digit rolls as it
 * changes (Digits.svelte), so the second is seen to land, and only the column that changed
 * plays it.
 */
const { now, zone }: ClockFaceProps = $props()

const parts = $derived(formatClock(now))
const shown = $derived(`${parts.hh}:${parts.mm}:${parts.ss}`)
</script>

<div class="face" style:--zone-chars={zone.length}>
  <time datetime={now.toISOString()}><Digits value={shown} /></time>{#if zone}<small class="zone"
      data-testid="clock-zone">{zone}</small
    >{/if}
</div>

<style>
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
  justify-content: center;
  height: 100%;
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
