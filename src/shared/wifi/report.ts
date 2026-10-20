import { hopLine, maskAddress, maskName, stamp } from '../netpath.js'
import { CAUSE_LABELS, type Diagnosis, type PathFigures } from './diagnose.js'
import type { TrackEvent } from './events.js'
import { bandOf, standardLabel } from './radio.js'
import type { WifiLink } from './types.js'

// ---------------------------------------------------------------------------
// The report the copy button writes
// ---------------------------------------------------------------------------

export interface ReportInput {
  now: number
  link: WifiLink | null
  diagnosis: Diagnosis
  lastMinute: PathFigures
  lastFive: PathFigures
  mos: number | null
  events: readonly TrackEvent[]
  mask: boolean
}

const or = (v: number | string | null, unit = ''): string => (v === null ? '-' : `${v}${unit}`)

function linkLines(link: WifiLink, r: ReportInput): string[] {
  const band = bandOf(link.freqMhz)
  const hide = (v: string | null): string => (v === null ? '-' : r.mask ? maskAddress(v) : v)
  const retry = r.lastMinute.retry === null ? '-' : `${r.lastMinute.retry.toFixed(1)}%`
  const prefix = link.prefix4 === null || r.mask ? '' : `/${link.prefix4}`
  return [
    `radio     ${standardLabel(link.standard, band)}  ${or(band)} GHz ch ${or(link.channel)}  width ${or(link.widthMhz, ' MHz')}`,
    `signal    ${or(link.rssi, ' dBm')}  quality ${or(link.quality, '%')}  retries ${retry}`,
    `phy rate  rx ${or(link.rxMbps)} / tx ${or(link.txMbps)} Mb/s`,
    `security  ${or(link.security)} ${link.cipher ?? ''}`.trimEnd(),
    `adapter   ${link.adapter}`,
    `address   ${hide(link.ip4)}${prefix}  gateway ${hide(link.gateway)}`,
  ]
}

function eventLines(events: readonly TrackEvent[], now: number): string[] {
  const hour = events.filter((e) => e.at > now - 3_600_000)
  return [
    `events, last hour (${hour.length})`,
    ...hour.slice(0, 20).map((e) => {
      const down = e.downFor === null ? '' : `  down ${e.downFor}s`
      const code = e.code === null ? '' : ` [${e.code}]`
      return `  ${stamp(e.at).slice(11)}  ${e.kind.padEnd(13)} ${e.detail}${code}${down}`
    }),
  ]
}

/** The text the copy button puts on the clipboard: for a colleague, a ticket, a chat. */
export function buildReport(r: ReportInput): string {
  const link = r.link
  const name = link?.ssid == null ? '(hidden)' : r.mask ? maskName(link.ssid) : link.ssid
  return [
    `elecdex Wi-Fi report — ${stamp(r.now)}`,
    `network   ${name}  ${link?.state ?? 'no adapter'}`,
    `verdict   ${CAUSE_LABELS[r.diagnosis.cause]} (${r.diagnosis.health}) — ${r.diagnosis.evidence}`,
    `call      MOS ≈ ${r.mos === null ? '-' : r.mos.toFixed(1)} (E-model estimate)`,
    ...(link === null ? [] : linkLines(link, r)),
    '',
    'last 1 min',
    `  ${hopLine('gateway', r.lastMinute.gateway)}`,
    `  ${hopLine('internet', r.lastMinute.internet)}`,
    'last 5 min',
    `  ${hopLine('gateway', r.lastFive.gateway)}`,
    `  ${hopLine('internet', r.lastFive.internet)}`,
    '',
    ...eventLines(r.events, r.now),
  ].join('\n')
}
