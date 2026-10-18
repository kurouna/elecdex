<script lang="ts">
import type { EtherEvent, EtherPoint } from '@shared/ethernet'
import { ETHER_EVENT_MARKS } from './draw.ts'

/**
 * What happened to the link while the pane was watching, newest first: the link
 * going and coming back, its speed or duplex changing, the way out going, CRC
 * errors and broadcast floods beginning. No system keeps a log of a wired link's
 * drops that every driver writes (decisions.md), so where the Wi-Fi pane has the
 * day from the system's log, this one has the hour it watched: lit where it
 * watched, red where the link was down. Each row says how long after the one
 * before it came; a steady beat of drops is named above the list.
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
}

const HOUR = 3_600_000
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
    const older = events.slice(i + 1).find((x) => x.kind === e.kind)
    return { e, since: older === undefined ? null : gap(e.at - older.at) }
  }),
)

/** The hour as stretches watched, and the seconds the link was down in them. */
const hour = $derived.by(() => {
  const from = now - HOUR
  const share = (at: number): number => Math.max(0, Math.min(100, ((at - from) / HOUR) * 100))
  const watched: { left: number; width: number }[] = []
  const down: number[] = []
  let start: number | null = null
  let previous: EtherPoint | null = null
  for (const p of points) {
    if (p.at < from) continue
    if (start === null) start = p.at
    else if (previous !== null && p.at - previous.at > 5000) {
      watched.push({ left: share(start), width: share(previous.at) - share(start) })
      start = p.at
    }
    if (p.state === 'no-carrier') down.push(share(p.at))
    previous = p
  }
  if (start !== null && previous !== null)
    watched.push({ left: share(start), width: share(previous.at) - share(start) })
  return { watched, down }
})
</script>

<section class="log" data-testid="ether-log">
  <header>
    {#if titled}<span class="title">LOG</span>{/if}
    <span class="count" data-hint="watched">{events.length} {events.length === 1 ? 'event' : 'events'}, while watched</span>
    {#if dropEvery !== null}
      <span class="beat" data-testid="ether-drop-beat">drops every ~{every(dropEvery)} — power saving?</span>
    {/if}
  </header>
  <div class="hour" data-hint="watched" data-testid="ether-hour">
    <div class="bar">
      {#each hour.watched as stretch (stretch.left)}
        <i class="seen" style:left="{stretch.left}%" style:width="{Math.max(0.2, stretch.width)}%"></i>
      {/each}
      {#each hour.down as at, i (i)}<b style:left="{at}%"></b>{/each}
    </div>
    <div class="ticks"><span>−60 m</span><span>−45</span><span>−30</span><span>−15</span><span>now</span></div>
  </div>
  <ol>
    {#each rows as { e, since } (e.key)}
      {@const mark = ETHER_EVENT_MARKS[e.kind]}
      <li data-kind={e.kind} data-tone={mark.tone} data-testid="ether-event" data-hint="event-{e.kind}">
        <time>{clock(e.at)}</time>
        <span class="glyph">{mark.glyph}</span>
        <span class="kind">{LABELS[e.kind]}</span>
        <span class="detail">{e.detail}</span>
        <span class="down">{e.downFor === null ? '' : `down ${e.downFor}s`}</span>
        <span class="since">{since ?? ''}</span>
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

/* The hour, watched and not: a strip under the header, with the minutes below it. */
.hour {
  padding: 0.3rem 0.2rem 0.15rem;
}

.bar {
  position: relative;
  height: 0.55rem;
  background: repeating-linear-gradient(-45deg, var(--accent-faint) 0 2px, transparent 2px 5px);
}

.bar i {
  position: absolute;
  top: 0;
  bottom: 0;
  background: color-mix(in srgb, var(--accent) 70%, transparent);
}

.bar b {
  position: absolute;
  top: -0.15rem;
  bottom: -0.15rem;
  width: 2px;
  background: var(--danger);
}

.ticks {
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
  font-size: var(--step--1);
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
.since {
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
</style>
