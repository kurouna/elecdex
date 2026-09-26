<script lang="ts">
import { maskAddress, maskName, type WifiCounters, type WifiLink } from '@shared/wifi'

/**
 * Everything else the link says, for whoever wants the figures: the second
 * layer (security, the scan, the frame counters with how fast each is
 * climbing), the third (addresses, gateway, resolvers, MTU, the DHCP lease)
 * and the adapter. Masked like the rest when the pane is.
 */
interface Props {
  link: WifiLink
  /** Each counter's increase per minute, when it can be told. */
  rates: WifiCounters | null
  mask: boolean
  host: string | null
}

const { link, rates, mask, host }: Props = $props()

const addr = (v: string | null): string => (v === null ? '—' : mask ? maskAddress(v) : v)
const yesNo = (v: boolean | null): string => (v === null ? '—' : v ? 'on' : 'off')

function lease(seconds: number | null): string {
  if (seconds === null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

function count(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}G`
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e4) return `${(v / 1e3).toFixed(1)}k`
  return String(Math.round(v))
}

const COUNTERS: [keyof WifiCounters, string, boolean][] = [
  ['txFrames', 'tx frames', false],
  ['rxFrames', 'rx frames', false],
  ['retries', 'retries', true],
  ['multiRetries', 'multi-retries', true],
  ['ackFailures', 'ACK failures', true],
  ['failed', 'tx failed', true],
  ['fcsErrors', 'FCS errors', true],
  ['decryptFailures', 'decrypt failures', true],
  ['handshakeFailures', '4-way failures', true],
]

/**
 * How far a counter's bar reaches: the frames against the larger of the two
 * directions, and a trouble counter as a share of the frames sent in the same
 * minute - a full bar at half of them, where a link is well past broken.
 */
function reach(key: keyof WifiCounters, trouble: boolean): number {
  const rate = rates?.[key]
  if (rates === null || rate === undefined) return 0
  if (!trouble) return rate / Math.max(1, rates.txFrames, rates.rxFrames)
  return Math.min(1, rate / Math.max(1, rates.txFrames) / 0.5)
}

/** A trouble counter's share of the frames sent this minute, as the bar's colour. */
function severity(key: keyof WifiCounters, trouble: boolean): 'ok' | 'warn' | 'bad' {
  if (!trouble || rates === null) return 'ok'
  const share = ((rates[key] ?? 0) / Math.max(1, rates.txFrames)) * 100
  return share >= 30 ? 'bad' : share >= 15 ? 'warn' : 'ok'
}

/** The facts that have a card of their own. */
const FACT_HINTS: Record<string, string> = {
  BSSID: 'f-bssid',
  scan: 'f-scan',
  DHCP: 'f-dhcp',
  'echo host': 'f-echo',
}

const rows = $derived<[string, string][]>([
  ['SSID', link.ssid === null ? 'withheld by the OS' : mask ? maskName(link.ssid) : link.ssid],
  ['BSSID', 'not read — needs location access'],
  ['security', `${link.security ?? '—'} · ${link.cipher ?? '—'}`],
  [
    'scan',
    `background ${yesNo(link.backgroundScan)} · streaming mode ${yesNo(link.streamingMode)}`,
  ],
  ['address', `${addr(link.ip4)}${link.prefix4 === null ? '' : `/${link.prefix4}`}`],
  ['IPv6', link.ip6.length === 0 ? '—' : link.ip6.map(addr).join(', ')],
  ['gateway', addr(link.gateway)],
  ['DNS', link.dns.length === 0 ? '—' : link.dns.map(addr).join(', ')],
  ['DHCP', `${yesNo(link.dhcp)} · lease ${lease(link.leaseSeconds)} · MTU ${link.mtu ?? '—'}`],
  ['MAC', addr(link.mac)],
  ['adapter', link.adapter],
  ['echo host', host ?? '—'],
])
</script>

<section class="detail" data-testid="wifi-detail">
  <dl class="facts">
    {#each rows as [k, v] (k)}
      <dt data-hint={FACT_HINTS[k]}>{k}</dt>
      <dd data-hint={FACT_HINTS[k]}>{v}</dd>
    {/each}
  </dl>
  {#if link.counters !== null}
    <table class="counters">
      <thead><tr><th>frames</th><th>total</th><th>/min</th><th class="bar-head"></th></tr></thead>
      <tbody>
        {#each COUNTERS as [key, label, trouble] (key)}
          {@const rate = rates?.[key] ?? null}
          <tr class:rising={trouble && rate !== null && rate > 0} data-hint="c-{key}" data-testid="wifi-counter">
            <td>{label}</td>
            <td>{count(link.counters[key])}</td>
            <td>{rate === null ? '—' : count(rate)}</td>
            <td class="bar-cell"
              ><i class={severity(key, trouble)} class:frames={!trouble} style:--reach={reach(key, trouble)}></i></td
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

.counters {
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

tr.rising td:nth-child(3) {
  color: var(--warn);
}

.counters {
  width: 100%;
}

.bar-head {
  width: 40%;
}

/* The minute's rate as a bar: frames against the busier direction, trouble as a share of frames. */
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
