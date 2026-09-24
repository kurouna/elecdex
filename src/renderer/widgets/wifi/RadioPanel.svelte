<script lang="ts">
import {
  bandOf,
  freqOf,
  isDfs,
  signalFraction,
  signalGrade,
  standardLabel,
  type WifiBand,
  type WifiLink,
  type WifiStandard,
} from '@shared/wifi'

/**
 * The radio as it stands: a gauge of the signal, the three bands with the
 * channel the link sits on (and the stretch of 5 GHz where radar can move it),
 * the standard, and the rates the PHY negotiated in each direction.
 *
 * SVG, changed once a second at most; nothing in it moves by itself.
 */
interface Props {
  link: WifiLink
  wide: boolean
}

const { link, wide }: Props = $props()

const SEGMENTS = 28
const START = 135
const SWEEP = 270

const band = $derived(bandOf(link.freqMhz))
const grade = $derived(signalGrade(link.rssi))
const lit = $derived(Math.round(signalFraction(link.rssi) * SEGMENTS))
const tone = $derived(grade === 'weak' ? 'danger' : grade === 'fair' ? 'warn' : 'accent')
const snr = $derived(link.rssi !== null && link.noise !== null ? link.rssi - link.noise : null)

function polar(angle: number, r: number): [number, number] {
  const a = (angle * Math.PI) / 180
  return [60 + r * Math.cos(a), 60 + r * Math.sin(a)]
}

/** One gauge segment: a short arc between two radii. */
function segment(i: number): string {
  const step = SWEEP / SEGMENTS
  const a0 = START + i * step + 0.9
  const a1 = START + (i + 1) * step - 0.9
  const [x0, y0] = polar(a0, 50)
  const [x1, y1] = polar(a1, 50)
  const [x2, y2] = polar(a1, 41)
  const [x3, y3] = polar(a0, 41)
  return `M${x0} ${y0} A50 50 0 0 1 ${x1} ${y1} L${x2} ${y2} A41 41 0 0 0 ${x3} ${y3} Z`
}

const segments = Array.from({ length: SEGMENTS }, (_, i) => segment(i))

/** The limits the gauge marks: the call level (-67) and the break-up level (-75). */
const marks = [-67, -75].map((dbm) => {
  const angle = START + ((dbm + 90) / 60) * SWEEP
  const [x0, y0] = polar(angle, 53)
  const [x1, y1] = polar(angle, 38)
  return { dbm, d: `M${x0} ${y0} L${x1} ${y1}` }
})

// ---- the band map ----

interface BandRow {
  band: WifiBand
  label: string
  from: number
  to: number
  channels: number[]
}

const ROWS: BandRow[] = [
  { band: '2.4', label: '2.4', from: 2400, to: 2495, channels: range(1, 13, 1) },
  { band: '5', label: '5', from: 5150, to: 5895, channels: range(36, 177, 4) },
  { band: '6', label: '6', from: 5925, to: 7125, channels: range(1, 233, 4) },
]

function range(from: number, to: number, step: number): number[] {
  const out: number[] = []
  for (let n = from; n <= to; n += step) out.push(n)
  return out
}

let mapWidth = $state(240)
const LABEL = 22
const ROW_H = 17

const xOf = (row: BandRow, mhz: number): number =>
  LABEL + ((mhz - row.from) / (row.to - row.from)) * Math.max(1, mapWidth - LABEL - 2)

/** The stretches the link occupies: its own channel, or each link of a multi-link one. */
const occupied = $derived(
  (link.radios.length > 0
    ? link.radios.map((r) => ({ freq: r.freqMhz, width: r.widthMhz }))
    : link.freqMhz === null
      ? []
      : [{ freq: link.freqMhz, width: link.widthMhz }]
  )
    .map((o) => ({ ...o, band: bandOf(o.freq) }))
    .filter((o): o is { freq: number; width: number | null; band: WifiBand } => o.band !== null),
)

// ---- the standard and the rates ----

const GENERATION: Partial<Record<WifiStandard, string>> = { be: '7', ax: '6', ac: '5', n: '4' }
const generation = $derived(
  link.standard === null
    ? '—'
    : link.standard === 'ax' && band === '6'
      ? '6E'
      : (GENERATION[link.standard] ?? link.standard.toUpperCase()),
)

/** Mbit/s at the top of the rate bars: what the standard can reach at its widest. */
const RATE_TOP: Partial<Record<WifiStandard, number>> = { be: 5765, ax: 2402, ac: 1734, n: 600 }
const rateTop = $derived(
  Math.max(link.rxMbps ?? 0, link.txMbps ?? 0, RATE_TOP[link.standard ?? 'g'] ?? 54),
)
const rateShare = (mbps: number | null): number => (mbps === null ? 0 : Math.min(1, mbps / rateTop))
const mbps = (v: number | null): string => (v === null ? '—' : `${Math.round(v)}`)

const notes = $derived(
  [
    isDfs(link.channel, band) ? 'DFS channel: radar can move the access point' : null,
    link.backgroundScan === true && link.streamingMode !== true
      ? 'background scan on: brief stalls every minute or so'
      : null,
    link.metered === true ? 'metered connection' : null,
  ].filter((n): n is string => n !== null),
)
</script>

<section class="radio" class:wide data-testid="wifi-radio" data-tone={tone}>
  <div class="gauge">
    <svg viewBox="0 0 120 108" role="img" aria-label="signal {link.rssi ?? 'unknown'} dBm, {grade}">
      {#each segments as d, i (i)}
        <path {d} class:on={i < lit} class="seg" />
      {/each}
      {#each marks as mark (mark.dbm)}
        <path d={mark.d} class="mark" data-dbm={mark.dbm} />
      {/each}
      <text x="60" y="60" class="dbm" data-testid="wifi-rssi">{link.rssi ?? '—'}</text>
      <text x="60" y="74" class="unit">dBm</text>
      <text x="60" y="100" class="grade">{grade.toUpperCase()}</text>
    </svg>
    <p class="quality">
      Q {link.quality ?? '—'}{link.quality === null ? '' : '%'}
      {#if snr !== null}· SNR {snr} dB{/if}
    </p>
  </div>

  <div class="side">
    <div class="map" bind:clientWidth={mapWidth}>
      <svg
        width={mapWidth}
        height={ROWS.length * ROW_H}
        role="img"
        aria-label="channel {link.channel ?? 'unknown'} on the {band ?? 'unknown'} GHz band"
      >
        <defs>
          <pattern id="wifi-dfs" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" class="hatch" />
          </pattern>
        </defs>
        {#each ROWS as row, r (row.band)}
          {@const y = r * ROW_H}
          <text x="0" y={y + ROW_H / 2} class="band" class:here={row.band === band}>{row.label}</text>
          <line x1={LABEL} x2={mapWidth - 2} y1={y + ROW_H / 2} y2={y + ROW_H / 2} class="axis" />
          {#if row.band === '5'}
            <rect x={xOf(row, 5250)} width={xOf(row, 5730) - xOf(row, 5250)} y={y + 3} height={ROW_H - 6} fill="url(#wifi-dfs)" class="dfs" />
          {/if}
          {#each row.channels as ch (ch)}
            {@const x = xOf(row, freqOf(ch, row.band))}
            <line x1={x} x2={x} y1={y + ROW_H / 2 - 2} y2={y + ROW_H / 2 + 2} class="tick" />
          {/each}
          {#each occupied.filter((o) => o.band === row.band) as o (o.freq)}
            {@const half = (o.width ?? 20) / 2}
            <rect
              x={xOf(row, o.freq - half)}
              width={Math.max(3, xOf(row, o.freq + half) - xOf(row, o.freq - half))}
              y={y + 2}
              height={ROW_H - 4}
              class="here-block"
              data-testid="wifi-channel-block"
            />
          {/each}
        {/each}
      </svg>
      <p class="chan" data-testid="wifi-channel">
        CH <b>{link.channel ?? '—'}</b> · {link.freqMhz ?? '—'} MHz · width {link.widthMhz ?? '—'}{link.widthMhz ===
        null
          ? ''
          : ' MHz'}
      </p>
    </div>

    <div class="std">
      <svg viewBox="0 0 52 46" class="hex" aria-hidden="true">
        <polygon points="13,1 39,1 51,23 39,45 13,45 1,23" />
        <text x="26" y="29">{generation}</text>
      </svg>
      <div class="rates">
        <span class="label" data-testid="wifi-standard">{standardLabel(link.standard, band)}</span>
        <div class="rate">
          <span>↓</span><i style:--share={rateShare(link.rxMbps)}></i><b>{mbps(link.rxMbps)}</b>
        </div>
        <div class="rate">
          <span>↑</span><i style:--share={rateShare(link.txMbps)}></i><b>{mbps(link.txMbps)}</b>
        </div>
        <span class="label">PHY Mb/s · {link.security ?? '—'} {link.cipher ?? ''}</span>
      </div>
    </div>
  </div>

  {#if notes.length > 0}
    <ul class="notes" data-testid="wifi-notes">
      {#each notes as note (note)}<li>{note}</li>{/each}
    </ul>
  {/if}
</section>

<style>
.radio {
  --tone: var(--accent);
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.3rem 0.8rem;
  align-items: center;
}

.radio.wide {
  /* Brought forward, the map and the bars would stretch across the screen. */
  grid-template-columns: 8.5rem minmax(0, 38rem);
}

.radio[data-tone='warn'] {
  --tone: var(--warn);
}

.radio[data-tone='danger'] {
  --tone: var(--danger);
}

.gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge svg {
  width: 100%;
  max-width: 8.5rem;
}

.radio:not(.wide) .gauge svg {
  max-width: 6.5rem;
}

.seg {
  fill: var(--accent-faint);
}

.seg.on {
  fill: var(--tone);
  filter: drop-shadow(0 0 calc(var(--glow) * 2px) var(--tone));
}

.mark {
  stroke: var(--text-muted);
  stroke-width: 1;
}

.mark[data-dbm='-75'] {
  stroke: var(--danger);
  opacity: 0.6;
}

.dbm {
  font-family: var(--font-display);
  font-size: 26px;
  text-anchor: middle;
  fill: var(--tone);
}

.unit,
.grade {
  font-family: var(--font-ui);
  font-size: 9px;
  letter-spacing: 0.15em;
  text-anchor: middle;
  fill: var(--text-muted);
}

.grade {
  font-size: 10px;
  fill: var(--tone);
}

.quality {
  margin: -0.2rem 0 0;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.side {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.map {
  min-width: 0;
}

.map svg {
  display: block;
  overflow: visible;
}

.band {
  font-family: var(--font-mono);
  font-size: 9px;
  dominant-baseline: middle;
  fill: var(--text-muted);
}

.band.here {
  fill: var(--accent-strong);
}

.axis {
  stroke: var(--panel-rule);
}

.tick {
  stroke: var(--accent-dim);
}

.hatch {
  stroke: var(--warn);
  stroke-width: 1;
  opacity: 0.45;
}

.dfs {
  stroke: none;
}

.here-block {
  fill: color-mix(in srgb, var(--accent-strong) 35%, transparent);
  stroke: var(--accent-strong);
  stroke-width: 1;
  filter: drop-shadow(0 0 calc(var(--glow) * 3px) var(--accent-strong));
}

.chan {
  margin: 0.1rem 0 0;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.chan b {
  font-weight: 500;
  color: var(--accent-strong);
}

.std {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.hex {
  flex: none;
  width: 2.8rem;
}

.hex polygon {
  fill: color-mix(in srgb, var(--accent) 10%, transparent);
  stroke: var(--accent);
  stroke-width: 1.2;
  filter: drop-shadow(0 0 calc(var(--glow) * 3px) var(--accent));
}

.hex text {
  font-family: var(--font-display);
  font-size: 17px;
  text-anchor: middle;
  fill: var(--accent-strong);
}

.rates {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.rate {
  display: grid;
  grid-template-columns: 1em 1fr 3.2em;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.rate i {
  height: 5px;
  background: linear-gradient(
    90deg,
    var(--accent) calc(var(--share) * 100%),
    var(--accent-faint) calc(var(--share) * 100%)
  );
}

.rate b {
  font-weight: 400;
  color: var(--text);
  text-align: right;
}

.notes {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem 0.8rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--warn);
}

.notes li::before {
  content: '△ ';
}
</style>
