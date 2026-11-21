<script lang="ts">
import { formatClock, zoneAbbreviation } from '../../lib/format.ts'
import { onBoundary } from '../../lib/frame-loop.ts'
import { systemTimeZone } from '../../lib/time-zone.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import { clockFace } from './faces.ts'

/**
 * The CLOCK pane: it keeps the time and draws it with the face chosen in settings (faces.ts).
 *
 * The time ticks here, once, on the shared second boundary (lib/frame-loop.ts) rather than an
 * unaligned setInterval that would drift behind the system clock, and not at all while the pane
 * is not seen: behind a tab it ticked every second for no one (found in the sweep), and shown
 * again it is right at once. A face is handed the second and the zone and only draws them.
 *
 * What a screen reader hears is said here too, the same for every face: the minute and the
 * zone, not the face's drawing - a face's digits, ticks and cells are its picture.
 */
const { paneId, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))

let now = $state(new Date())

$effect(() => {
  if (!visible) return
  now = new Date()
  return onBoundary(1000, () => {
    now = new Date()
  })
})

// The zone and its abbreviation change only with daylight saving or the system's zone being
// changed; once a minute is plenty. They must read only the minute: reading `now` too would
// rebuild their Intl formatters every second, the costliest script this pane runs. The zone is
// asked again each minute rather than once, so a zone changed in the system (a trip) is named
// as the time follows it, not the zone the app started in.
const minute = $derived(Math.floor(now.getTime() / 60_000))
const timeZone = $derived.by(() => {
  void minute
  return systemTimeZone()
})
const zone = $derived(zoneAbbreviation(timeZone, new Date(minute * 60_000)))

const face = $derived(clockFace(appearance.settings.clock.face))
const parts = $derived(formatClock(now))
const spoken = $derived(`${parts.hh}:${parts.mm}${zone ? `, time zone ${zone}, ${timeZone}` : ''}`)
</script>

<div
  class="clock"
  role="img"
  aria-label={spoken}
  data-testid="clock"
  data-pane-id={paneId}
  data-face={face.id}
  data-time="{parts.hh}:{parts.mm}:{parts.ss}"
  data-datetime={now.toISOString()}
  data-zone={zone}
>
  <face.component {now} {zone} {timeZone} {visible} />
</div>

<style>
.clock {
  container-type: size;
  position: relative;
  height: 100%;
  min-height: 2rem;
  overflow: hidden;
}
</style>
