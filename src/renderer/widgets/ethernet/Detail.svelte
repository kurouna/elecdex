<script lang="ts">
import {
  counterHealth,
  ETHER_LIMITS,
  type EtherCounters,
  type EtherLink,
  POWER_LABELS,
  powerOn,
  routeWord,
  speedLabel,
} from '@shared/ethernet'
import { maskAddress } from '@shared/netpath'

/**
 * Everything else the link says, for whoever wants the figures (as the Wi-Fi
 * pane's detail): the cable's layer - the adapter, its driver and bus, the link,
 * the settings it was given - and the address's, with the counters beside them
 * and how fast each is climbing. The addresses only while the link is up; a dash
 * for a counter the driver does not keep, never a zero. Masked like the rest when
 * the pane is.
 */
interface Props {
  link: EtherLink
  /** Each counter's increase per minute, when it can be told. */
  rates: Partial<Record<keyof EtherCounters, number | null>> | null
  mask: boolean
  host: string | null
}

const { link, rates, mask, host }: Props = $props()

const addr = (v: string | null): string => (v === null ? '—' : mask ? maskAddress(v) : v)
const up = $derived(link.state === 'up')
const s = $derived(link.settings)

function lease(seconds: number | null): string {
  if (seconds === null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

function count(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}G`
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e4) return `${(v / 1e3).toFixed(1)}k`
  return String(Math.round(v))
}

const setting = $derived(
  s === null
    ? '—'
    : s.speed === null && s.duplex === null
      ? 'auto-negotiate'
      : `fixed ${speedLabel(s.speed)} ${s.duplex ?? ''}`.trim(),
)
const power = $derived(powerOn(link).map((k) => POWER_LABELS[k]))

/** The facts, with the card each has. */
const rows = $derived<[string, string, string | undefined][]>([
  ['adapter', link.adapter, 'adapter-chip'],
  ['driver', link.driver ?? '—', 'f-driver'],
  ['bus', link.busDetail ?? '—', 'f-bus'],
  [
    'link',
    up ? `${speedLabel(link.speedMbps)} ${link.duplex ?? ''}`.trim() : link.state,
    'station-link',
  ],
  ['setting', setting, 'f-setting'],
  ['power', s === null ? '—' : power.length === 0 ? 'none on' : `${power.join(' · ')} on`, 'power'],
  [
    'frames',
    s === null
      ? `MTU ${link.mtu ?? '—'}`
      : `MTU ${link.mtu ?? '—'} · jumbo ${s.jumbo ? `${s.jumbo}` : 'off'} · flow ${s.flow === null ? '—' : s.flow ? 'on' : 'off'}`,
    'jumbo',
  ],
  [
    '802.1X',
    link.authenticated === null ? '—' : link.authenticated ? 'through' : 'not authenticated',
    'f-auth',
  ],
  [
    'address',
    up ? `${addr(link.ip4)}${link.prefix4 === null || mask ? '' : `/${link.prefix4}`}` : '—',
    undefined,
  ],
  ['IPv6', up && link.ip6.length > 0 ? link.ip6.map(addr).join(', ') : '—', undefined],
  ['gateway', up ? addr(link.gateway) : '—', undefined],
  ['DNS', up && link.dns.length > 0 ? link.dns.map(addr).join(', ') : '—', undefined],
  [
    'DHCP',
    up
      ? `${link.dhcp === null ? '—' : link.dhcp ? 'on' : 'off'} · lease ${lease(link.leaseSeconds)}`
      : '—',
    'f-dhcp',
  ],
  ['MAC', addr(link.mac), undefined],
  ['route', up ? routeWord(link.route) : '—', 'f-route'],
  ['echo host', host ?? '—', 'f-echo'],
])

type Kind = 'frames' | 'trouble' | 'broadcast' | 'host'
const COUNTERS: [keyof EtherCounters, string, Kind, string][] = [
  ['rxPackets', 'rx frames', 'frames', 'c-rxPackets'],
  ['txPackets', 'tx frames', 'frames', 'c-txPackets'],
  ['rxNonUnicast', 'rx non-unicast', 'broadcast', 'c-broadcast'],
  ['rxMulticast', 'rx multicast', 'frames', 'c-multicast'],
  ['rxErrors', 'rx crc errors', 'trouble', 'c-rxErrors'],
  ['txErrors', 'tx errors', 'trouble', 'c-txErrors'],
  ['collisions', 'collisions', 'trouble', 'c-collisions'],
  ['rxDiscards', 'rx discards · host', 'host', 'c-rxDiscards'],
  ['txDiscards', 'tx discards · host', 'host', 'c-txDiscards'],
  ['rxUnknown', 'unknown protos · host', 'host', 'c-rxUnknown'],
]

/** The rows this platform keeps: a counter null in the reading has none. */
const kept = $derived(
  COUNTERS.filter(([key]) => link.counters !== null && link.counters[key] !== null),
)

/**
 * How far a counter's bar reaches, as Detail.svelte reaches Wi-Fi's: frames
 * against the busier direction, trouble as a share of frames received with the
 * bar half full at the limit's bad share, the rest not drawn.
 */
function reach(key: keyof EtherCounters, kind: Kind): number {
  const rate = rates?.[key]
  if (rates === null || rate == null) return 0
  const frames = Math.max(1, rates.rxPackets ?? 0, rates.txPackets ?? 0)
  if (kind === 'frames' || kind === 'broadcast') return Math.min(1, rate / frames)
  if (kind === 'trouble')
    return Math.min(1, ((rate / Math.max(1, framesFor(key))) * 100) / ETHER_LIMITS.crc.badShare / 2)
  return 0
}

/** The frames a trouble counter is a share of: those sent for what goes wrong on the way out. */
function framesFor(key: keyof EtherCounters): number {
  const out = key === 'txErrors' || key === 'collisions'
  return (out ? rates?.txPackets : rates?.rxPackets) ?? 0
}

function severity(key: keyof EtherCounters, kind: Kind): 'ok' | 'warn' | 'bad' {
  if (kind !== 'trouble' || rates === null) return 'ok'
  const health = counterHealth(rates[key] ?? 0, framesFor(key))
  return health === 'bad' || health === 'warn' ? health : 'ok'
}
</script>

<section class="detail" data-testid="ether-detail">
  <dl class="facts">
    {#each rows as [k, v, hint] (k)}
      <dt data-hint={hint}>{k}</dt>
      <dd data-hint={hint} class:gone={v === '—'}>{v}</dd>
    {/each}
  </dl>
  {#if link.counters !== null}
    <table class="counters">
      <thead><tr><th>frames</th><th>total</th><th>/min</th><th class="bar-head"></th></tr></thead>
      <tbody>
        {#each kept as [key, label, kind, hint] (key)}
          {@const rate = rates?.[key] ?? null}
          <tr class:rising={kind === 'trouble' && rate !== null && rate > 0} class:host={kind === 'host'} data-hint={hint} data-testid="ether-counter">
            <td>{label}</td>
            <td>{count(link.counters[key])}</td>
            <td>{count(rate)}</td>
            <td class="bar-cell"
              ><i class={severity(key, kind)} class:frames={kind !== 'trouble'} style:--reach={reach(key, kind)}></i></td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<style>
.detail {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 0.6rem;
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

.facts {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.05rem 0.6rem;
  margin: 0;
}

dt {
  font-size: var(--step--2);
  font-family: var(--font-ui);
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

dd {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
}

dd.gone {
  color: var(--text-muted);
}

.counters {
  width: 100%;
  border-collapse: collapse;
  align-self: start;
}

th {
  font-size: var(--step--2);
  font-family: var(--font-ui);
  font-weight: 400;
  letter-spacing: 0.06em;
  text-align: right;
  color: var(--text-muted);
}

th:first-child,
td:first-child {
  font-size: var(--step--2);
  text-align: left;
}

td {
  padding: 0 0 0 0.5rem;
  text-align: right;
  color: var(--text);
  white-space: nowrap;
}

td:first-child {
  padding-left: 0;
  color: var(--text-muted);
}

tr.host td {
  color: var(--text-muted);
}

tr.rising td:nth-child(3) {
  color: var(--warn);
}

.bar-head {
  width: 35%;
}

.bar-cell {
  padding-left: 0.6rem;
}

.bar-cell i {
  display: block;
  height: 0.4rem;
  background: linear-gradient(
    90deg,
    var(--tone, var(--accent)) calc(var(--reach) * 100%),
    var(--accent-faint) calc(var(--reach) * 100%)
  );
}

.bar-cell i.frames {
  --tone: var(--accent-dim);
}

.bar-cell i.warn {
  --tone: var(--warn);
}

.bar-cell i.bad {
  --tone: var(--danger);
}

@container (max-width: 30rem) {
  .detail {
    grid-template-columns: 1fr;
  }
}
</style>
