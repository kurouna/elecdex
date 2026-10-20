<script lang="ts">
import { bucketize, type TrackEvent, type WifiPoint } from '@shared/wifi'
import { echoMs, type Palette, type Surface } from '../netpath/draw.ts'
import Timeline from '../netpath/Timeline.svelte'
import { drawTimeline, LANE_NAMES, laneBoxes, latencyTop, megabits, trafficTop } from './draw.ts'

/**
 * The last minutes, lane under lane on one time axis (netpath's Timeline):
 * signal, retries, round trips, loss, traffic, and the events that explain them.
 * The crosshair reads every lane at one moment.
 */
interface Props {
  points: readonly WifiPoint[]
  events: readonly TrackEvent[]
  window: string
  onwindow: (id: string) => void
  /** Its own title, when it is not under a tab that says it already. */
  titled?: boolean
}

const { points, events, window: windowId, onwindow, titled = true }: Props = $props()

const LEGEND = [
  { swatch: 'net', text: 'internet' },
  { swatch: 'gw', text: 'gateway' },
  { swatch: 'up', text: 'up' },
  { swatch: 'down', text: 'down' },
] as const

// A new paint whenever what it reads changes, so the frame draws again for it.
const paint = $derived.by(() => {
  const shown = points
  const marked = events
  return (
    surface: Surface,
    palette: Palette,
    f: { from: number; to: number; columns: number; hoverX: number | null },
  ) => {
    const buckets = bucketize(shown, f.from, f.to, f.columns)
    return drawTimeline(surface, palette, {
      buckets,
      events: marked,
      from: f.from,
      to: f.to,
      latencyTop: latencyTop(buckets),
      trafficTop: trafficTop(buckets),
      hoverX: f.hoverX,
    })
  }
})
</script>

{#snippet readout(point: WifiPoint)}
  <span>signal {point.rssi ?? '—'} dBm</span>
  <span>retry {point.retry === null ? '—' : `${point.retry.toFixed(1)} %`}</span>
  <span>gateway {echoMs(point.gateway)}</span>
  <span>internet {echoMs(point.internet)}</span>
  <span>↑ {point.up === null ? '—' : megabits(point.up)} ↓ {point.down === null ? '—' : megabits(point.down)}</span>
{/snippet}

<Timeline
  id="wifi"
  {points}
  {events}
  window={windowId}
  {onwindow}
  {titled}
  label="signal, retries, round trips, loss, traffic and events over time"
  legend={LEGEND}
  lanes={laneBoxes}
  laneNames={LANE_NAMES}
  {paint}
  {readout}
/>
