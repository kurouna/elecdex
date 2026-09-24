<script lang="ts">
import { maskName, type Stretch, type TrackEvent } from '@shared/wifi'
import { EVENT_MARKS } from './draw.ts'

/**
 * What happened to the connection, newest first: the operating system's own
 * log (a day of it, so drops from before the pane was opened are here too)
 * together with what the pane saw itself - a change of access point, the way
 * out going and coming back. Each row says how long after the one before it
 * came, which is how a drop every half hour gives itself away; when the drops
 * keep a steady beat, the line above the list says so.
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
/** The way out lost, which the log does not hold, marked on the day where the pane saw it. */
const lostMarks = $derived(events.filter((e) => e.kind === 'upstream-lost' && e.at >= dayFrom))

const LABELS: Record<TrackEvent['kind'], string> = {
  connected: 'CONNECTED',
  failed: 'FAILED',
  disconnected: 'LINK LOST',
  handover: 'HANDOVER',
  'upstream-lost': 'UPSTREAM LOST',
  'upstream-back': 'UPSTREAM BACK',
  'sign-in': 'SIGN-IN',
}

const clock = (at: number): string => new Date(at).toTimeString().slice(0, 8)

function gap(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 90) return `+${s}s`
  const m = Math.round(s / 60)
  return m < 90 ? `+${m}m` : `+${Math.round(m / 60)}h`
}

function every(ms: number): string {
  const s = Math.round(ms / 1000)
  return s < 120 ? `${s} s` : `${Math.round(s / 60)} min`
}

const rows = $derived(
  events.slice(0, 120).map((e, i) => {
    const older = events[i + 1]
    return { e, since: older === undefined ? null : gap(e.at - older.at) }
  }),
)
</script>

<section class="log" data-testid="wifi-log">
  <header>
    {#if titled}<span class="title">LOG</span>{/if}
    <span class="count">{events.length} {events.length === 1 ? 'event' : 'events'}, last 24 h</span>
    {#if dropEvery !== null}
      <span class="beat" data-testid="wifi-drop-beat">drops every ~{every(dropEvery)} — a session limit?</span>
    {:else if spikeEvery !== null}
      <span class="beat" data-testid="wifi-spike-beat">delay spikes every ~{every(spikeEvery)} — a scan?</span>
    {/if}
  </header>
  {#if !noLog && day.length > 0}
    <div class="day" data-hint="uptime" data-testid="wifi-day">
      <div class="bar">
        {#each day as stretch (stretch.from)}
          <i
            class={stretch.state}
            style:left="{share(stretch.from)}%"
            style:width="{share(stretch.to) - share(stretch.from)}%"
            data-testid="wifi-day-stretch"
            data-state={stretch.state}
          ></i>
        {/each}
        {#each lostMarks as mark (mark.key)}<b style:left="{share(mark.at)}%"></b>{/each}
      </div>
      <div class="hours"><span>−24 h</span><span>−18</span><span>−12</span><span>−6</span><span>now</span></div>
    </div>
  {/if}
  <ol>
    {#each rows as { e, since } (e.key)}
      {@const mark = EVENT_MARKS[e.kind]}
      <li data-kind={e.kind} data-tone={mark.tone} data-testid="wifi-event" data-hint="event-{e.kind}">
        <time>{clock(e.at)}</time>
        <span class="glyph">{mark.glyph}</span>
        <span class="kind">{LABELS[e.kind]}</span>
        <span class="detail"
          >{e.detail}{#if e.code !== null && e.code !== 0}<span class="code"> [{e.code}]</span>{/if}{#if e.ssid !== null}<span
              class="ssid"> · {mask ? maskName(e.ssid) : e.ssid}</span
            >{/if}</span
        >
        <span class="down">{e.downFor === null ? '' : `down ${e.downFor}s`}</span>
        <span class="since">{since ?? ''}</span>
      </li>
    {:else}
      <li class="empty">
        {noLog ? 'nothing seen yet — this system keeps no connection log elecdex can read' : 'no events in the last day'}
      </li>
    {/each}
  </ol>
</section>

<style>
.log {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

header {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding-bottom: 0.15rem;
  border-bottom: 1px solid var(--panel-rule);
}

.title {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wider);
  color: var(--text-muted);
}

.count {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.beat {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--warn);
}

/* The last day, connected and not: a strip under the header, with the hours below it. */
.day {
  padding: 0.3rem 0.2rem 0.15rem;
}

.bar {
  position: relative;
  height: 0.55rem;
  background: repeating-linear-gradient(
    -45deg,
    var(--accent-faint) 0 2px,
    transparent 2px 5px
  );
}

.bar i {
  position: absolute;
  top: 0;
  bottom: 0;
}

.bar i.up {
  background: color-mix(in srgb, var(--accent) 70%, transparent);
}

.bar i.down {
  background: var(--danger);
}

.bar b {
  position: absolute;
  top: -0.15rem;
  bottom: -0.15rem;
  width: 2px;
  background: var(--warn);
}

.hours {
  display: flex;
  justify-content: space-between;
  margin-top: 0.1rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

ol {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

li {
  --tone: var(--accent-strong);
  display: grid;
  grid-template-columns: auto 1em 7.5em minmax(0, 1fr) auto 3em;
  gap: 0.4rem;
  align-items: baseline;
  padding: 0.05rem 0.2rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text);
}

li:nth-child(even) {
  background: color-mix(in srgb, var(--accent) 4%, transparent);
}

li[data-tone='ok'] {
  --tone: var(--ok);
}

li[data-tone='warn'] {
  --tone: var(--warn);
}

li[data-tone='danger'] {
  --tone: var(--danger);
}

time,
.since,
.code,
.ssid {
  color: var(--text-muted);
}

.since {
  text-align: right;
}

.glyph,
.kind {
  color: var(--tone);
}

.kind {
  font-family: var(--font-ui);
  letter-spacing: 0.06em;
}

.detail {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.down {
  color: var(--warn);
}

.empty {
  display: block;
  padding: 0.3rem;
  color: var(--text-muted);
}
</style>
