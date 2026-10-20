<script lang="ts">
import { maskName, type Stretch, type TrackEvent } from '@shared/wifi'
import EventLog from '../netpath/EventLog.svelte'
import LogStrip from '../netpath/LogStrip.svelte'
import { every } from '../netpath/log.ts'
import { EVENT_MARKS } from './draw.ts'

/**
 * What happened to the connection, newest first (netpath's EventLog): the
 * operating system's own log (a day of it, so drops from before the pane was
 * opened are here too) together with what the pane saw itself - a change of
 * access point, the way out going and coming back. Each row says how long after
 * the last of its kind it came, which is how a drop every half hour gives itself
 * away; when the drops keep a steady beat, the line above the list says so.
 */
interface Props {
  events: readonly TrackEvent[]
  mask: boolean
  /** The steady gap between drops, when there is one. */
  dropEvery: number | null
  /** The steady gap between latency spikes, when there is one. */
  spikeEvery: number | null
  /** Whether the platform keeps no log, so the list holds only what the pane saw. */
  noLog: boolean
  /** Its own title, when it is not under a tab that says it already. */
  titled?: boolean
  /** The last day as connected and not, from the system's log (`availability`). */
  day?: readonly Stretch[]
}

const { events, mask, dropEvery, spikeEvery, noLog, titled = true, day = [] }: Props = $props()

/** The day bar's span: from its first stretch to its last. */
const dayFrom = $derived(day[0]?.from ?? 0)
const dayTo = $derived(day[day.length - 1]?.to ?? 1)
const share = (at: number): number => ((at - dayFrom) / Math.max(1, dayTo - dayFrom)) * 100
const stretches = $derived(
  day.map((s) => ({
    key: s.from,
    left: share(s.from),
    width: share(s.to) - share(s.from),
    state: s.state,
  })),
)
/** The way out lost, which the log does not hold, marked on the day where the pane saw it. */
const lostMarks = $derived(
  events
    .filter((e) => e.kind === 'upstream-lost' && e.at >= dayFrom)
    .map((e) => ({ key: e.key, left: share(e.at) })),
)

const LABELS: Record<TrackEvent['kind'], string> = {
  connected: 'CONNECTED',
  failed: 'FAILED',
  disconnected: 'LINK LOST',
  handover: 'HANDOVER',
  'upstream-lost': 'UPSTREAM LOST',
  'upstream-back': 'UPSTREAM BACK',
  'sign-in': 'SIGN-IN',
}

const DAY_TICKS = ['−24 h', '−18', '−12', '−6', 'now']

const beat = $derived(
  dropEvery !== null
    ? { text: `drops every ~${every(dropEvery)} — a session limit?`, testid: 'wifi-drop-beat' }
    : spikeEvery !== null
      ? { text: `delay spikes every ~${every(spikeEvery)} — a scan?`, testid: 'wifi-spike-beat' }
      : null,
)

const empty = $derived(
  noLog
    ? 'nothing seen yet — this system keeps no connection log elecdex can read'
    : 'no events in the last day',
)
</script>

{#snippet strip()}
  {#if !noLog && day.length > 0}
    <LogStrip
      testid="wifi-day"
      hint="uptime"
      {stretches}
      stretchTestid="wifi-day-stretch"
      marks={lostMarks}
      markTone="warn"
      ticks={DAY_TICKS}
    />
  {/if}
{/snippet}

{#snippet detail(e: TrackEvent)}{e.detail}{#if e.code !== null && e.code !== 0}<span class="code"> [{e.code}]</span>{/if}{#if e.ssid !== null}<span
      class="ssid"> · {mask ? maskName(e.ssid) : e.ssid}</span
    >{/if}{/snippet}

<EventLog
  {events}
  id="wifi"
  labels={LABELS}
  marks={EVENT_MARKS}
  span="last 24 h"
  {beat}
  {titled}
  {empty}
  {strip}
  {detail}
/>

<style>
.code,
.ssid {
  color: var(--text-muted);
}
</style>
