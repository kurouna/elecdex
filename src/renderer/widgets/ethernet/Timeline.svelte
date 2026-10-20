<script lang="ts">
import { type EtherEvent, type EtherPoint, etherBuckets, speedLabel } from '@shared/ethernet'
import { echoMs, megabits, type Palette, type Surface } from '../netpath/draw.ts'
import Timeline from '../netpath/Timeline.svelte'
import {
  drawEtherTimeline,
  ETHER_LANE_NAMES,
  etherL2Top,
  etherLaneBoxes,
  etherLatencyTop,
  etherTrafficTop,
} from './draw.ts'

/**
 * The last minutes, lane under lane on one time axis (netpath's Timeline): the
 * link's speed, damaged and broadcast frames, round trips, loss, traffic, and
 * the events that explain them - the Wi-Fi pane's timeline with the cable where
 * it has the radio. The crosshair reads every lane at a moment.
 */
interface Props {
  points: readonly EtherPoint[]
  events: readonly EtherEvent[]
  window: string
  onwindow: (id: string) => void
  bestSeen: number | null
  capMbps: number | null
  speedMbps: number | null
  /** Its own title, when it is not under a tab that says it already. */
  titled?: boolean
}

const {
  points,
  events,
  window: windowId,
  onwindow,
  bestSeen,
  capMbps,
  speedMbps,
  titled = true,
}: Props = $props()

const LEGEND = [
  { swatch: 'net', text: 'internet' },
  { swatch: 'gw', text: 'gateway' },
  { swatch: 'up', text: 'up' },
  { swatch: 'down', text: 'down' },
  { swatch: 'fell', text: 'fell' },
  { swatch: 'crc', text: 'crc' },
  { swatch: 'lost', text: 'link lost' },
] as const

// A new paint whenever what it reads changes, so the frame draws again for it.
const paint = $derived.by(() => {
  const shown = points
  const marked = events
  const best = bestSeen
  const cap = capMbps
  const speed = speedMbps
  return (
    surface: Surface,
    palette: Palette,
    f: { from: number; to: number; columns: number; hoverX: number | null },
  ) => {
    const buckets = etherBuckets(shown, f.from, f.to, f.columns)
    const traffic = etherTrafficTop(buckets, speed)
    return drawEtherTimeline(surface, palette, {
      buckets,
      events: marked,
      from: f.from,
      to: f.to,
      bestSeen: best,
      capMbps: cap,
      latencyTop: etherLatencyTop(buckets),
      trafficTop: traffic.top,
      trafficIsLink: traffic.isLink,
      l2Top: etherL2Top(buckets),
      hoverX: f.hoverX,
    })
  }
})
</script>

{#snippet readout(point: EtherPoint)}
  <span
    >link {point.state === 'up' ? `${speedLabel(point.speed)} ${point.duplex ?? ''}` : (point.state ?? '—')}</span
  >
  <span>crc {point.errors === null ? '—' : Math.round(point.errors)}/s</span>
  <span>broadcast {point.broadcast === null ? '—' : Math.round(point.broadcast)}/s</span>
  <span>gateway {echoMs(point.gateway)}</span>
  <span>internet {echoMs(point.internet)}</span>
  <span>↑ {point.up === null ? '—' : megabits(point.up)} ↓ {point.down === null ? '—' : megabits(point.down)}</span>
{/snippet}

<Timeline
  id="ether"
  {points}
  {events}
  window={windowId}
  {onwindow}
  {titled}
  label="link speed, damaged and broadcast frames, round trips, loss, traffic and events over time"
  legend={LEGEND}
  lanes={etherLaneBoxes}
  laneNames={ETHER_LANE_NAMES}
  {paint}
  {readout}
/>
