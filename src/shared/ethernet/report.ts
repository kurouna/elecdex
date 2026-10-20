import { hopLine, maskAddress, stamp } from '../netpath.js'
import { ETHER_CAUSE_LABELS, type EtherDiagnosis, powerOn, routeWord } from './diagnose.js'
import type { EtherEvent } from './events.js'
import type { EtherFigures } from './figures.js'
import { speedLabel } from './speed.js'
import { type EtherLink, POWER_LABELS } from './types.js'

// ---------------------------------------------------------------------------
// The report the copy button writes
// ---------------------------------------------------------------------------

export interface EtherReportInput {
  now: number
  link: EtherLink | null
  diagnosis: EtherDiagnosis
  lastMinute: EtherFigures
  lastFive: EtherFigures
  mos: number | null
  events: readonly EtherEvent[]
  mask: boolean
}

function linkLines(link: EtherLink, r: EtherReportInput): string[] {
  // The MAC and IPv6 never go into a report; the rest only unmasked.
  const hide = (v: string | null): string => (v === null ? '-' : r.mask ? maskAddress(v) : v)
  const f = r.lastMinute
  const settings = link.settings
  const set =
    settings === null
      ? '-'
      : settings.speed === null
        ? 'auto'
        : `fixed ${speedLabel(settings.speed)} ${settings.duplex ?? ''}`.trim()
  const power = powerOn(link).map((k) => POWER_LABELS[k])
  return [
    `link      ${speedLabel(f.speed)} ${link.duplex ?? ''}  best ${speedLabel(settings?.capMbps ?? null)}  setting ${set}`.trimEnd(),
    `errors    ${f.errors} CRC in ${f.packets} packets (10 min)  drops ${f.drops} (10 min)`,
    `broadcast ${f.broadcast === null ? '-' : `${Math.round(f.broadcast)}/s`}  multicast ${f.multicast === null ? '-' : `${Math.round(f.multicast)}/s`}`,
    `power     ${power.length === 0 ? 'none on' : power.join(', ')}`,
    `adapter   ${link.adapter}  ${link.busDetail ?? ''}`.trimEnd(),
    `address   ${hide(link.ip4)}${link.prefix4 === null || r.mask ? '' : `/${link.prefix4}`}  gateway ${hide(link.gateway)}  route ${routeWord(link.route)}`,
  ]
}

function eventLines(events: readonly EtherEvent[], now: number): string[] {
  const hour = events.filter((e) => e.at > now - 3_600_000)
  return [
    `events while watched, last hour (${hour.length})`,
    ...hour.slice(0, 20).map((e) => {
      const down = e.downFor === null ? '' : `  down ${e.downFor}s`
      return `  ${stamp(e.at).slice(11)}  ${e.kind.padEnd(13)} ${e.detail}${down}`
    }),
  ]
}

/** The text the copy button puts on the clipboard: for a colleague, a ticket, a chat. */
export function buildEtherReport(r: EtherReportInput): string {
  const link = r.link
  return [
    `elecdex Ethernet report — ${stamp(r.now)}`,
    `adapter   ${link?.alias ?? '-'}  ${link?.state ?? 'no adapter'}`,
    `verdict   ${ETHER_CAUSE_LABELS[r.diagnosis.cause]} (${r.diagnosis.health}) — ${r.diagnosis.evidence}`,
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
