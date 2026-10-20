<script lang="ts">
import { type EtherEvent, type EtherPoint, quickDropPoints } from '@shared/ethernet'
import EventLog from '../netpath/EventLog.svelte'
import LogStrip from '../netpath/LogStrip.svelte'
import { every } from '../netpath/log.ts'
import { ETHER_EVENT_MARKS } from './draw.ts'

/**
 * What happened to the link while the pane was watching, newest first (netpath's
 * EventLog): the link going and coming back, its speed or duplex changing, the
 * way out going, CRC errors and broadcast floods beginning. No system keeps a log
 * of a wired link's drops that every driver writes (decisions.md), so where the
 * Wi-Fi pane has the day from the system's log, this one has the hour it watched:
 * lit where it watched, red where the link was down. Each row says how long after
 * the last of its kind it came, which is how a steady beat of drops shows; the
 * line above the list names one.
 */
interface Props {
  events: readonly EtherEvent[]
  /** The last hour's points, for the bar of what was watched. */
  points: readonly EtherPoint[]
  now: number
  /** The steady gap between drops, when there is one. */
  dropEvery: number | null
  titled?: boolean
}

const { events, points, now, dropEvery, titled = true }: Props = $props()

const LABELS: Record<EtherEvent['kind'], string> = {
  connected: 'CONNECTED',
  'link-lost': 'LINK LOST',
  speed: 'SPEED',
  duplex: 'DUPLEX',
  'upstream-lost': 'UPSTREAM LOST',
  'upstream-back': 'UPSTREAM BACK',
  'sign-in': 'SIGN-IN',
  crc: 'CRC ERRORS',
  broadcast: 'BROADCAST',
  unseen: 'NOT WATCHED',
  conflict: 'ADDRESS CONFLICT',
}

const HOUR = 3_600_000
const HOUR_TICKS = ['−60 m', '−45', '−30', '−15', 'now']

interface Watched {
  key: number
  left: number
  width: number
  state: 'up'
}

/** The hour as stretches watched, and the seconds the link was down in them. */
const hour = $derived.by(() => {
  const from = now - HOUR
  const share = (at: number): number => Math.max(0, Math.min(100, ((at - from) / HOUR) * 100))
  const watched: Watched[] = []
  const down: { key: number; left: number }[] = []
  // A second of watching is still drawn, a sliver wide.
  const stretch = (start: number, end: number): void => {
    const left = share(start)
    watched.push({ key: left, left, width: Math.max(0.2, share(end) - left), state: 'up' })
  }
  let start: number | null = null
  let previous: EtherPoint | null = null
  // A drop inside a second leaves no reading down: the system's count marks it instead.
  const quick = quickDropPoints(points)
  for (const p of points) {
    if (p.at < from) continue
    if (start === null) start = p.at
    else if (previous !== null && p.at - previous.at > 5000) {
      stretch(start, previous.at)
      start = p.at
    }
    if (p.state === 'no-carrier' || quick.has(p)) down.push({ key: down.length, left: share(p.at) })
    previous = p
  }
  if (start !== null && previous !== null) stretch(start, previous.at)
  return { watched, down }
})

const beat = $derived(
  dropEvery === null
    ? null
    : { text: `drops every ~${every(dropEvery)} — power saving?`, testid: 'ether-drop-beat' },
)
</script>

{#snippet strip()}
  <LogStrip
    testid="ether-hour"
    hint="watched"
    stretches={hour.watched}
    marks={hour.down}
    markTone="danger"
    ticks={HOUR_TICKS}
  />
{/snippet}

<EventLog
  {events}
  id="ether"
  labels={LABELS}
  marks={ETHER_EVENT_MARKS}
  span="while watched"
  spanHint="watched"
  {beat}
  {titled}
  empty="nothing happened in the hour watched"
  emptyTestid="ether-log-empty"
  {strip}
/>
