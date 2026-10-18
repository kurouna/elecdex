<script lang="ts">
import { roundMs } from '@shared/netpath'
import {
  CAUSE_LABELS,
  culpritStation,
  type Diagnosis,
  type PathFigures,
  WIFI_LIMITS,
  type WifiPoint,
} from '@shared/wifi'
import { SPARK_H, SPARK_W, type StationView, sparkPath, type WireView } from '../netpath/draw.ts'
import NetPathStrip from '../netpath/PathStrip.svelte'
import { megabits } from './draw.ts'

/**
 * The Wi-Fi pane's path: this machine, the radio, the access point's gateway,
 * the internet (netpath/PathStrip.svelte draws it, as it does the Ethernet
 * pane's). The radio's wire carries the signal's last minute; the gateway's and
 * the internet's their round trips.
 */
interface Props {
  diagnosis: Diagnosis
  figures: PathFigures
  /** The newest second, which the packets run for. */
  latest: WifiPoint | null
  points: readonly WifiPoint[]
}

const { diagnosis, figures, latest, points }: Props = $props()

const fmt = (v: number | null, unit: string, digits = 0): string =>
  v === null ? '—' : `${v.toFixed(digits)}${unit}`

const hop = (s: PathFigures['gateway']): string =>
  s.sent === 0
    ? 'no echo'
    : s.received === 0
      ? 'silent'
      : `${roundMs(s.median)} ±${fmt(s.jitter, '')}`

const loss = (s: PathFigures['gateway']): string =>
  s.sent === 0 ? '' : `loss ${s.loss < 10 ? s.loss.toFixed(1) : Math.round(s.loss)}%`

const stations = $derived<StationView[]>([
  {
    id: 'pc',
    name: 'PC',
    health: diagnosis.segments.pc,
    main: figures.up === null ? '—' : `↑ ${megabits(figures.up)}`,
    sub: figures.down === null ? '' : `↓ ${megabits(figures.down)}`,
  },
  {
    id: 'radio',
    name: 'RADIO',
    health: diagnosis.segments.radio,
    main: fmt(figures.rssi, ' dBm'),
    sub: figures.retry === null ? '' : `retry ${figures.retry.toFixed(1)}%`,
  },
  {
    id: 'gateway',
    name: 'GATEWAY',
    health: diagnosis.segments.gateway,
    main: hop(figures.gateway),
    sub: loss(figures.gateway),
  },
  {
    id: 'internet',
    name: 'INTERNET',
    health: diagnosis.segments.internet,
    main: hop(figures.internet),
    sub: loss(figures.internet),
  },
])

/** Each wire's last minute, and how far this second's echo got along it. */
const wires = $derived.by<WireView[]>(() => {
  const last = points.slice(-60)
  const top = (values: (number | null | undefined)[], floor: number): number =>
    Math.max(floor, ...values.filter((v): v is number => typeof v === 'number')) * 1.1
  const gateway = last.map((p) => p.gateway)
  const internet = last.map((p) => p.internet)
  return [
    {
      to: 'radio',
      health: diagnosis.segments.radio,
      spark: sparkPath(
        last.map((p) => p.rssi),
        -90,
        -30,
        SPARK_W,
        SPARK_H,
      ),
      runs: latest !== null && latest.state === 'connected',
      lost: false,
    },
    {
      to: 'gateway',
      health: diagnosis.segments.gateway,
      spark: sparkPath(gateway, 0, top(gateway, 20), SPARK_W, SPARK_H),
      runs: typeof latest?.gateway === 'number',
      lost: latest?.gateway === null,
    },
    {
      to: 'internet',
      health: diagnosis.segments.internet,
      spark: sparkPath(internet, 0, top(internet, 120), SPARK_W, SPARK_H),
      runs: typeof latest?.internet === 'number',
      lost: latest?.internet === null,
    },
  ]
})

/** The legend's example is the internet's own figure, so it reads as the station beside it does. */
const example = $derived(
  figures.internet.received === 0
    ? '— ±—'
    : `${roundMs(figures.internet.median)} ±${fmt(figures.internet.jitter, '')}`,
)
</script>

<NetPathStrip
  kind="wifi"
  {stations}
  {wires}
  culprit={culpritStation(diagnosis)}
  verdict={{
    key: diagnosis.cause,
    label: CAUSE_LABELS[diagnosis.cause],
    health: diagnosis.health,
    evidence: diagnosis.evidence,
  }}
  {example}
  {points}
  limits={{ gateway: WIFI_LIMITS.gatewayRtt, internet: WIFI_LIMITS.internetRtt }}
/>
