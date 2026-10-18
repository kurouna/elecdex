import {
  ETHER_CAUSE_LABELS,
  ETHER_LIMITS,
  type EtherCounters,
  type EtherDiagnosis,
  type EtherFigures,
  type EtherLink,
  POWER_LABELS,
  powerOn,
  routeWord,
  speedGrade,
  speedLabel,
  standardOf,
} from '@shared/ethernet'
import { type ProbeStats, roundMs, roundPct } from '@shared/netpath'
import type { Hint } from '../netpath/draw.js'
import { megabits } from '../netpath/draw.js'

/**
 * What the Ethernet pane's figures mean, for the card that opens when the
 * pointer rests on one (netpath/HintCard.svelte): what it is, how to read it, the
 * limits the pane judges it by, and what it reads now.
 *
 * The words are data and the live line is a pure function of what the pane
 * already holds, so both are unit-tested (ethernet-hints.test.ts); the limits are
 * quoted from ETHER_LIMITS, never written out again.
 */

export interface EtherHintContext {
  link: EtherLink | null
  figures: EtherFigures
  diagnosis: EtherDiagnosis
  mos: number | null
  host: string | null
  /** The counters' rates a minute, for a counter's NOW line. */
  rates?: Partial<Record<keyof EtherCounters, number | null>> | null
}

/** The counter each `c-` card in the detail's table explains. */
export const ETHER_COUNTER_FIELDS: Record<string, keyof EtherCounters> = {
  'c-rxPackets': 'rxPackets',
  'c-txPackets': 'txPackets',
  'c-broadcast': 'rxNonUnicast',
  'c-multicast': 'rxMulticast',
  'c-rxErrors': 'rxErrors',
  'c-txErrors': 'txErrors',
  'c-collisions': 'collisions',
  'c-rxDiscards': 'rxDiscards',
  'c-txDiscards': 'txDiscards',
  'c-rxUnknown': 'rxUnknown',
}

/** A counter's total since the adapter came up, and its rate, as Wi-Fi's cards say them. */
function counterLive(key: string, c: EtherHintContext): string | null {
  const field = ETHER_COUNTER_FIELDS[key]
  const total = field === undefined ? null : c.link?.counters?.[field]
  if (field === undefined || total == null) return null
  const rate = c.rates?.[field]
  const perMinute = rate == null ? '' : `, ${Math.round(rate).toLocaleString('en')} a minute`
  return `${Math.round(total).toLocaleString('en')} since the adapter came up${perMinute}`
}

const L = ETHER_LIMITS
const C = L.crc
const hop = (s: ProbeStats): string =>
  s.sent === 0
    ? 'not asked'
    : s.received === 0
      ? `no answer to ${s.sent} echoes`
      : `median ${roundMs(s.median)}, jitter ${roundMs(s.jitter)}, loss ${roundPct(s.loss)} (${s.sent - s.received}/${s.sent}), worst ${roundMs(s.max)}`

const STATIC: Record<string, Hint> = {
  cause: {
    title: 'CAUSE',
    body: [
      'Where the trouble is, looked for from this machine outwards: the last minute of echoes, the last ten minutes of the link’s counters. Trouble near the machine shows again at every hop after it, so the nearest bad segment is named.',
      'CLEAR all well · LINK the cable, the ports or the adapter · LOCAL LINK the hop to the router · OWN UPLOAD this machine filling its uplink · UPSTREAM beyond the router · UPSTREAM LOST the router answers, the internet does not · NO CARRIER no cable, or nothing at its end · AUTH waiting for 802.1X · ADDRESS CONFLICT another machine claims this address (the last ten minutes) · NO ADDRESS no DHCP answer.',
    ],
  },
  legend: {
    title: 'READING THE FIGURES',
    body: [
      'A round trip as its median over the last minute ± the jitter (the mean change from one echo to the next). An echo measures whole milliseconds: <1 ms is a router one cable away. Loss: echoes that never came back.',
      'Colours: accent all right, yellow worth watching, red the likely cause. Ribbon cells: one a second, coloured by round trip; a crossed cell is an echo lost.',
    ],
  },
  mos: {
    title: 'MOS · CALL QUALITY',
    body: [
      'An estimate of how a voice call would sound over this path, 1 to 4.5, from the simplified ITU-T G.107 E-model. It is the internet echoes’ score, not a measured call; with the internet reached by another route, there is none.',
    ],
    limits: '4.3+ excellent · 4.0 good · 3.6 fair · 3.1 poor · below that, calls break up',
  },
  'station-pc': {
    title: 'PC · THIS MACHINE',
    body: [
      'What goes out (↑) and comes in (↓) through this adapter each second. The line to LINK is the link’s use: traffic over the link speed, the last minute.',
    ],
    limits: `OWN UPLOAD when sending over ${megabits(L.ownUpload)} and the internet’s delay rises with it`,
  },
  'station-link': {
    title: 'LINK · THE CABLE',
    body: [
      'The cable, the ports at both ends and this adapter: a fall in speed, half duplex, CRC errors, drops and broadcast floods. A wired fault rarely stops traffic; it slows it.',
    ],
    limits: `CRC warn ${C.warnCount} errors and ${C.warnShare} %, bad ${C.badCount} and ${C.badShare} % of frames in 10 min · drops warn ${L.drops.warn}, bad ${L.drops.bad} in 10 min · broadcast warn ${L.broadcast.warn}/s, bad ${L.broadcast.bad.toLocaleString('en')}/s`,
  },
  'station-gateway': {
    title: 'GATEWAY · THE ROUTER',
    body: [
      'An echo a second to this adapter’s gateway, sent from this adapter’s own address: the cable’s hop alone. A router one cable away answers within a millisecond or two; home routers answer pings from a busy processor and thin them out, so its jitter and loss are judged gently. One that never answers ignores pings, and is not blamed.',
    ],
    limits: `round trip warn ${L.gatewayRtt.warn} ms, bad ${L.gatewayRtt.bad} ms · jitter ${L.gatewayJitter.warn}/${L.gatewayJitter.bad} ms · loss ${L.gatewayLoss.warn}/${L.gatewayLoss.bad} %`,
  },
  'station-internet': {
    title: 'INTERNET',
    body: [
      'An echo a second to a host on the internet - the one the Wi-Fi and network status panes read: one echo serves all three. It leaves by the system’s default route; when that is not this adapter (a VPN, Wi-Fi), it is shown and not judged here.',
    ],
    limits: `round trip warn ${L.internetRtt.warn} ms, bad ${L.internetRtt.bad} ms · jitter ${L.internetJitter.warn}/${L.internetJitter.bad} ms · loss ${L.internetLoss.warn}/${L.internetLoss.bad} %`,
  },
  ribbons: {
    title: 'ECHO RIBBONS',
    body: [
      'The last minute of echoes, one cell a second, newest on the right: the gateway above (GW), the internet below (NET). Coloured by round trip; a crossed cell is an echo that never came back.',
    ],
  },
  speed: {
    title: 'LINK SPEED',
    body: [
      'What the two ends of the cable agreed on, on a ladder of the speeds there are; `max` marks the adapter’s best. A fall from a speed this adapter had while watched is a fault - a damaged pair, a worn port. A speed below its best that never changed is usually the other end (a 100M router port), and only noted: BELOW MAX.',
    ],
    limits: 'fell from a speed seen before: watch · 10 Mb/s or half duplex: cause',
  },
  standard: {
    title: 'STANDARD',
    body: ['The copper Ethernet standard of this speed, and the link’s use of it each way.'],
  },
  util: {
    title: 'LINK USE',
    body: [
      'Traffic against the link speed. A line flat at a ceiling below the speed points at something else holding it: the bus, the far end, or the plan.',
      'An adapter on USB tops out near 280 Mb/s on a USB 2.0 port whatever the link says. Windows cannot tell the port’s speed, so it is noted, not judged.',
    ],
  },
  crc: {
    title: 'CRC ERRORS',
    body: [
      'Frames that arrived damaged: a worn cable, a loose connector, interference. A good cable shows none; a few a day is noise. Frames this machine dropped itself are its own, and are not counted here.',
    ],
    limits: `warn ${C.warnCount} errors and ${C.warnShare} %, bad ${C.badCount} errors and ${C.badShare} % of frames received in 10 minutes`,
  },
  drops: {
    title: 'DROPS',
    body: [
      'The link going down and back within a minute, while watched. Unplugging, docking and sleep take longer and are not counted. Drops at a steady interval point at power saving, or a dock reconnecting.',
      'A drop inside a second, between two readings, is counted from the system’s own count of the link going down: NDIS’s events on Windows, the kernel’s on Linux.',
    ],
    limits: `warn ${L.drops.warn}, bad ${L.drops.bad} in 10 minutes`,
  },
  broadcast: {
    title: 'BROADCAST',
    body: [
      'Frames to everyone on the network, received each second: the median of the last half minute, so a network scan does not count. A loop between switch ports multiplies them until the whole LAN slows. Windows counts them by bytes only, so the figure leans high.',
    ],
    limits: `warn ${L.broadcast.warn}/s, bad ${L.broadcast.bad.toLocaleString('en')}/s · a home LAN is usually under 50/s`,
  },
  multicast: {
    title: 'MULTICAST',
    body: [
      'Frames to a group: discovery (mDNS, SSDP), IPv6’s neighbours, and IPTV, which sends a thousand and more a second. Shown, never judged.',
    ],
  },
  power: {
    title: 'POWER SAVING',
    body: [
      'Driver settings that lower the speed or put the link to sleep when it idles: EEE, Green Ethernet, Gigabit Lite (500 Mb/s), and the like. Read, never changed. They turn yellow, with a line under them, only after a drop or a fall in speed has been seen with them on.',
    ],
  },
  jumbo: {
    title: 'JUMBO FRAMES',
    body: [
      'Frames larger than 1500 bytes. Every device on the LAN must take them, or large packets vanish.',
    ],
  },
  flow: {
    title: 'FLOW CONTROL',
    body: [
      'Pause frames: a port asking the other to wait. On by default; a busy switch can stall a link with them.',
    ],
  },
  vlan: {
    title: 'VLAN',
    body: ['The VLAN this adapter tags its frames with, when it is set on the adapter.'],
  },
  wol: {
    title: 'WAKE ON LAN',
    body: ['The adapter can wake the machine when a magic packet arrives.'],
  },
  'adapter-chip': {
    title: 'ADAPTER',
    body: [
      'Each wired adapter in this machine - built in, a dock, a USB adapter - with its link. The one chosen is the one the path, the panel and the timeline follow; each keeps its own hour, and its gateway is echoed from its own address.',
    ],
  },
  'lane-link': {
    title: 'LINK LANE',
    body: [
      'The link’s speed as a step. Hatched while it holds; solid yellow where it fell below what it was; red hatch while down.',
    ],
  },
  'lane-l2': {
    title: 'L2 LANE',
    body: [
      'CRC errors (red) and broadcast frames (yellow) a second, on one scale. The dashed line is the broadcast limit, so a quiet LAN draws almost nothing.',
    ],
  },
  'lane-rtt': {
    title: 'RTT LANE',
    body: [
      'Round trips: the internet as a line with its spread shaded, the gateway dotted. The scale follows the window’s worst.',
    ],
  },
  'lane-loss': { title: 'LOSS LANE', body: ['Echoes to the internet lost in each column.'] },
  'lane-traffic': {
    title: 'TRAFFIC LANE',
    body: [
      'What went out above the line, what came in below it. When traffic nears the link speed, the scale becomes the link speed and its ceiling is drawn.',
    ],
  },
  'lane-events': {
    title: 'EVENTS LANE',
    body: [
      'What happened, marked where it happened, with a hairline up through the lanes to what it did.',
    ],
  },
  'not-watched': {
    title: 'NOT WATCHED',
    body: [
      'The pane reads nothing while it is not on screen, so these stretches have no readings.',
    ],
  },
  watched: {
    title: 'WHILE WATCHED',
    body: [
      'No system keeps a log of a wired link going down that every driver writes, so this log holds what the pane saw while it was on screen. On Linux the kernel’s count of drops adds the ones while it was not.',
      'The bar is the last hour: watched stretches lit, drops in red.',
    ],
  },
  'event-connected': {
    title: 'CONNECTED',
    body: ['The link came up, at the speed and duplex the two ends agreed on.'],
  },
  'event-link-lost': {
    title: 'LINK LOST',
    body: ['The link went down: nothing answered at the other end of the cable.'],
  },
  'event-speed': {
    title: 'SPEED',
    body: ['The link’s speed changed while it stayed up: a renegotiation, often to a lower speed.'],
  },
  'event-duplex': { title: 'DUPLEX', body: ['The link’s duplex changed while it stayed up.'] },
  'event-upstream-lost': {
    title: 'UPSTREAM LOST',
    body: [
      'Echoes to the internet stopped while the gateway went on answering: the way beyond the router went.',
    ],
  },
  'event-upstream-back': { title: 'UPSTREAM BACK', body: ['Echoes to the internet came back.'] },
  'event-sign-in': {
    title: 'SIGN-IN',
    body: ['The system found a captive portal: the network wants a sign-in first.'],
  },
  'event-crc': {
    title: 'CRC ERRORS',
    body: ['Damaged frames began: more in a minute than the limit allows in ten.'],
  },
  'event-broadcast': {
    title: 'BROADCAST',
    body: ['Broadcast frames held over the limit for half a minute.'],
  },
  'event-conflict': {
    title: 'ADDRESS CONFLICT',
    body: [
      'The system logged another machine on the network claiming this adapter’s address (Tcpip event 4199, Windows). Traffic to and from it goes astray while it lasts: a fixed address set twice, or a router handing one out twice. The other machine is not named here.',
    ],
  },
  'event-unseen': {
    title: 'WHILE NOT WATCHED',
    body: ['Drops the kernel counted while the pane was not on screen (Linux).'],
  },
  'f-driver': {
    title: 'DRIVER',
    body: [
      'Who made the driver, its version and date. An old driver is a common cause of drops and odd speeds.',
    ],
  },
  'f-bus': {
    title: 'BUS',
    body: ['How the adapter is attached: PCIe with its lane speed and width, or USB.'],
  },
  'f-setting': {
    title: 'SPEED & DUPLEX SETTING',
    body: [
      'Auto-negotiate is right almost always. A speed set by hand on one end and left to negotiate on the other makes the other end fall back to half duplex: a mismatch that shows as CRC errors and late collisions.',
    ],
  },
  'f-route': {
    title: 'ROUTE',
    body: [
      'Which way the internet’s echo leaves this machine: this adapter, or another (Wi-Fi, a VPN).',
    ],
  },
  'f-auth': {
    title: '802.1X',
    body: [
      'Port authentication: a network that lets the port through only after it is authenticated. Nothing of it is read but whether it is through.',
    ],
  },
  'f-dhcp': {
    title: 'DHCP',
    body: ['Whether the address came from the network, and how long is left of its lease.'],
  },
  'f-echo': {
    title: 'ECHO HOST',
    body: [
      'The internet host echoed each second; the Wi-Fi and network status panes read the same echo.',
    ],
  },
  'c-rxPackets': {
    title: 'RX FRAMES',
    body: ['Frames received since the adapter came up: the base the error share is taken of.'],
  },
  'c-txPackets': { title: 'TX FRAMES', body: ['Frames sent since the adapter came up.'] },
  'c-broadcast': {
    title: 'RX BROADCAST',
    body: ['Broadcast frames received (estimated from bytes on Windows).'],
  },
  'c-multicast': { title: 'RX MULTICAST', body: ['Multicast frames received.'] },
  'c-rxErrors': {
    title: 'RX CRC ERRORS',
    body: ['Frames received damaged. What the cable is judged by.'],
  },
  'c-txErrors': { title: 'TX ERRORS', body: ['Frames that failed on the way out.'] },
  'c-rxDiscards': {
    title: 'RX DISCARDS · HOST',
    body: [
      'Frames this machine dropped itself: full receive rings, filters. Its own doing, not the cable’s; not judged.',
    ],
  },
  'c-txDiscards': {
    title: 'TX DISCARDS · HOST',
    body: ['Frames this machine dropped before sending. Not judged.'],
  },
  'c-rxUnknown': {
    title: 'UNKNOWN PROTOCOLS · HOST',
    body: ['Frames for a protocol nothing here speaks (LLDP, say). Harmless; not judged.'],
  },
  'c-collisions': {
    title: 'COLLISIONS',
    body: ['Only half duplex can collide: any here on a full-duplex link is a mismatch.'],
  },
}

/** The card for a key, or null for one the pane does not know. */
export function etherHintFor(key: string): Hint | null {
  return STATIC[key] ?? null
}

const FIGURES: Record<string, (c: EtherHintContext) => string | null> = {
  cause: (c) => `${ETHER_CAUSE_LABELS[c.diagnosis.cause]}: ${c.diagnosis.evidence}`,
  mos: (c) =>
    c.mos === null
      ? 'no echoes to judge by'
      : `${c.mos.toFixed(2)} from ${hop(c.figures.internet)}`,
  'station-pc': ({ figures: f }) =>
    f.up === null ? null : `↑ ${megabits(f.up)} · ↓ ${megabits(f.down ?? 0)}`,
  'station-link': linkLive,
  speed: linkLive,
  standard: (c) => (c.figures.speed === null ? null : standardOf(c.figures.speed)),
  'station-gateway': (c) => hop(c.figures.gateway),
  'station-internet': (c) =>
    c.link?.route !== 'default' && c.link?.route != null
      ? `by ${routeWord(c.link.route)}: ${hop(c.figures.internet)}`
      : `${c.host ?? '—'}: ${hop(c.figures.internet)}`,
  crc: ({ figures: f }) =>
    `${f.errors} in ${f.packets.toLocaleString('en')} frames (${f.errorShare === null ? '—' : `${f.errorShare.toFixed(3)} %`}) over 10 min`,
  drops: ({ figures: f }) => `${f.drops} in 10 min`,
  broadcast: ({ figures: f }) =>
    f.broadcast === null
      ? 'not counted on this system'
      : `${Math.round(f.broadcast).toLocaleString('en')}/s`,
  multicast: ({ figures: f }) =>
    f.multicast === null ? null : `${Math.round(f.multicast).toLocaleString('en')}/s`,
  power: (c) => {
    const on = powerOn(c.link).map((k) => POWER_LABELS[k])
    return on.length === 0 ? 'none on' : `on: ${on.join(', ')}`
  },
  util: ({ figures: f, link }) =>
    f.speed === null
      ? null
      : `↓ ${megabits(f.down ?? 0)} · ↑ ${megabits(f.up ?? 0)} of ${speedLabel(f.speed)}${link?.bus === 'usb' ? ', on USB' : ''}`,
  'adapter-chip': (c) => c.link?.adapter ?? null,
  'f-driver': (c) => c.link?.driver ?? null,
  'f-bus': (c) => c.link?.busDetail ?? null,
  'f-route': (c) => (c.link === null ? null : routeWord(c.link.route)),
  'f-echo': (c) => c.host,
}

function linkLive(c: EtherHintContext): string | null {
  const link = c.link
  if (link === null || link.state !== 'up') return null
  const grade = speedGrade(link, c.figures)
  const cap = link.settings?.capMbps ?? null
  return `${speedLabel(c.figures.speed)} ${link.duplex ?? ''} (${grade.toLowerCase()})${cap === null ? '' : `, best ${speedLabel(cap)}`}${c.figures.bestSeen !== null && c.figures.bestSeen !== c.figures.speed ? `, was ${speedLabel(c.figures.bestSeen)}` : ''}`
}

/** What a figure reads now, for the card's NOW line; null when there is nothing live to say. */
export function etherLiveFor(key: string, c: EtherHintContext): string | null {
  if (key.startsWith('c-')) return counterLive(key, c)
  return FIGURES[key]?.(c) ?? null
}

/** The card and its NOW line together, for the pane's HintCard. */
export function lookupEtherHint(
  key: string,
  c: EtherHintContext,
): { hint: Hint; live: string | null } | null {
  const hint = etherHintFor(key)
  return hint === null ? null : { hint, live: etherLiveFor(key, c) }
}

/**
 * A short name for an adapter's chip: its model where the description has one
 * ("Realtek Gaming GbE Family Controller" -> "Realtek GbE"), else the description cut short.
 */
export function shortWired(description: string): string {
  const words = description
    .replace(/\(R\)|\(TM\)|®|™|\(stub[^)]*\)/gi, '')
    .split(/\s+/)
    .filter(Boolean)
  const model = words.find((w) => /^(I\d{3}|RTL\d+|AX\d+|AQC\d+|E\d{4})/i.test(w))
  const maker = words[0] ?? ''
  if (model !== undefined) return `${maker === model ? '' : `${maker} `}${model}`.trim()
  const kind = words.find((w) => /^(GbE|2\.5GbE|5GbE|10GbE|Gigabit|Ethernet|LAN)$/i.test(w))
  if (kind !== undefined && maker !== kind) return `${maker} ${kind}`
  const text = words.join(' ')
  return text.length <= 24 ? text : `${text.slice(0, 23)}…`
}
