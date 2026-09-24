import {
  bandOf,
  CAUSE_LABELS,
  type Diagnosis,
  isDfs,
  type PathFigures,
  type ProbeStats,
  RETRY_FRAMES_PER_SECOND,
  signalGrade,
  standardLabel,
  WIFI_LIMITS,
  type WifiCounters,
  type WifiLink,
} from '@shared/wifi'
import { megabits } from './draw.js'

/**
 * What the Wi-Fi pane's figures mean, for the card that opens when the pointer
 * rests on one (HintCard.svelte): what it is, how to read it, the limits the
 * pane judges it by, and what it reads now.
 *
 * The words are data and the live line is a pure function of what the pane
 * already holds, so both are unit-tested (wifi-hints.test.ts) and a figure's
 * explanation cannot drift from the limit it is judged by: the limits are
 * quoted from WIFI_LIMITS, not written out again.
 */

export interface Hint {
  title: string
  /** What it is and how to read it: a sentence or two a line. */
  body: string[]
  /** The limits it is judged by, when it has any. */
  limits?: string
}

/** What the pane knows when a card opens, for its NOW line. */
export interface HintContext {
  link: WifiLink | null
  figures: PathFigures
  diagnosis: Diagnosis
  mos: number | null
  /** Counters' increase per minute. */
  rates: WifiCounters | null
  host: string | null
}

const L = WIFI_LIMITS
const ms = (v: number | null): string => (v === null ? '—' : `${Math.round(v)} ms`)
const pct = (v: number): string => `${v < 10 ? v.toFixed(1) : Math.round(v)} %`
const hop = (s: ProbeStats): string =>
  s.sent === 0
    ? 'not asked'
    : s.received === 0
      ? `no answer to ${s.sent} echoes`
      : `median ${ms(s.median)}, jitter ${ms(s.jitter)}, loss ${pct(s.loss)} (${s.sent - s.received}/${s.sent}), worst ${ms(s.max)}`

const COUNTERS: Record<keyof WifiCounters, Hint> = {
  txFrames: {
    title: 'TX FRAMES',
    body: [
      '802.11 frames this adapter sent since it came up. The base the retry share is taken of.',
    ],
  },
  rxFrames: { title: 'RX FRAMES', body: ['802.11 frames this adapter received since it came up.'] },
  retries: {
    title: 'RETRIES',
    body: [
      'Frames sent again because no acknowledgement came back: interference, a weak signal, or a busy channel. The share of frames retried is what the RADIO segment is judged by.',
    ],
    limits: `warn ${L.retry.warn} %, bad ${L.retry.bad} % of frames (only above ${RETRY_FRAMES_PER_SECOND} frames a second: an idle link retries half its few frames however clean the air)`,
  },
  multiRetries: {
    title: 'MULTI-RETRIES',
    body: [
      'Frames that needed more than one retry. Climbing fast: the air is hostile, not just busy.',
    ],
  },
  ackFailures: {
    title: 'ACK FAILURES',
    body: [
      'Acknowledgements expected and not received. Rises with retries; on its own a hint of hidden stations.',
    ],
  },
  failed: {
    title: 'TX FAILED',
    body: [
      'Frames given up on after every retry: data that had to be sent again from higher up, or was lost.',
    ],
  },
  fcsErrors: {
    title: 'FCS ERRORS',
    body: [
      'Frames received with a bad checksum: corrupted in the air. Many of them point at interference.',
    ],
  },
  decryptFailures: {
    title: 'DECRYPT FAILURES',
    body: [
      'Frames that could not be decrypted. Rare; a burst can mean a key change that went wrong.',
    ],
  },
  handshakeFailures: {
    title: '4-WAY FAILURES',
    body: [
      'Failed WPA key handshakes. A wrong password, or an access point dropping the exchange.',
    ],
  },
}

const STATIC: Record<string, Hint> = {
  cause: {
    title: 'CAUSE',
    body: [
      'Where the trouble is, from the last minute of readings, looked for from this machine outwards: trouble near the machine shows again at every hop after it, so the nearest bad segment is named.',
      'CLEAR all well · RADIO the signal or retries · LOCAL LINK the hop to the access point · OWN UPLOAD this machine filling its uplink · UPSTREAM beyond the access point · UPSTREAM LOST the access point answers, the internet does not (a train in a tunnel) · SIGN-IN NEEDED a captive portal · NO CARRIER not connected.',
    ],
  },
  legend: {
    title: 'READING THE FIGURES',
    body: [
      '18 ms ±2: the median round trip over the last minute, ± the jitter (the mean change from one echo to the next). Loss: echoes that never came back.',
      'Colours: accent all right, yellow worth watching, red the likely cause. Ribbon cells: one a second, coloured by round trip; a crossed cell is an echo lost.',
    ],
  },
  mos: {
    title: 'MOS · CALL QUALITY',
    body: [
      "An estimate of how a voice call would sound over this path, 1 to 4.5, from the simplified ITU-T G.107 E-model: the round trip plus twice the jitter as delay, less for every percent lost. It is the internet echoes' score, not a measured call.",
      'The slanted bars are the same number: one lit per point of the scale.',
    ],
    limits: '4.3+ excellent · 4.0 good · 3.6 fair · 3.1 poor · below that, calls break up',
  },
  'station-pc': {
    title: 'PC · THIS MACHINE',
    body: [
      'What goes out (↑) and comes in (↓) through this adapter each second. A video call needs about 1.5-4 Mb/s up; a sync, a backup or an upload filling the uplink delays everything behind it.',
    ],
    limits: `OWN UPLOAD when sending over ${megabits(L.ownUpload)} and the internet's delay rises with it`,
  },
  'station-radio': {
    title: 'RADIO',
    body: [
      'The signal (RSSI) the adapter hears from the access point, and the share of frames it had to send again.',
    ],
    limits: `signal warn below ${L.rssi.warn} dBm, bad below ${L.rssi.bad} dBm · retries warn ${L.retry.warn} %, bad ${L.retry.bad} %`,
  },
  'station-gateway': {
    title: 'GATEWAY · THE ACCESS POINT',
    body: [
      "An echo a second to this adapter's gateway: the Wi-Fi hop alone. A healthy one answers in a few ms and loses nothing; trouble here is the air or the access point, not the line behind it. A gateway that never answers is one that ignores pings, and is not blamed.",
    ],
    limits: `round trip warn ${L.gatewayRtt.warn} ms, bad ${L.gatewayRtt.bad} ms · jitter ${L.gatewayJitter.warn}/${L.gatewayJitter.bad} ms · loss ${L.gatewayLoss.warn}/${L.gatewayLoss.bad} %`,
  },
  'station-internet': {
    title: 'INTERNET',
    body: [
      "An echo a second to a host on the internet (the one the network status pane pings), out by the system's default route. Beyond the gateway: the line, the provider, or a train's mobile uplink.",
    ],
    limits: `round trip warn ${L.internetRtt.warn} ms, bad ${L.internetRtt.bad} ms · jitter ${L.internetJitter.warn}/${L.internetJitter.bad} ms · loss ${L.internetLoss.warn}/${L.internetLoss.bad} %`,
  },
  ribbons: {
    title: 'ECHO RIBBONS',
    body: [
      'The last minute of echoes, one cell a second, newest on the right: the gateway above (GW), the internet below (NET). Coloured by round trip; a crossed cell is an echo that never came back, so a burst of loss shows as a burst.',
    ],
  },
  gauge: {
    title: 'SIGNAL (RSSI)',
    body: [
      "How strongly the adapter hears the access point, in dBm: closer to zero is stronger. The marks on the arc are the level calls are designed for and the one they break up below. Q is the driver's own link quality; SNR, where the system gives the noise floor, the signal above the noise.",
    ],
    limits: `-55 and up excellent · to ${L.rssi.warn} good · to ${L.rssi.bad} fair · weaker is weak`,
  },
  channel: {
    title: 'CHANNEL',
    body: [
      'The three bands with the stretch this link occupies: its channel and width. The hatched part of 5 GHz is DFS: an access point there must leave when it hears radar, which clients feel as a drop.',
    ],
  },
  standard: {
    title: 'STANDARD · PHY RATES',
    body: [
      'The Wi-Fi generation and the rates the radio negotiated each way: what it could carry, not what it does. Rates falling with the signal is the radio stepping down to stay connected.',
    ],
  },
  dfs: {
    title: 'DFS CHANNEL',
    body: [
      'This channel is shared with radar. When the access point hears one it must move within seconds, and the link drops or stalls meanwhile. Frequent drops on a DFS channel: ask for a channel outside 52-144.',
    ],
  },
  bgscan: {
    title: 'BACKGROUND SCAN',
    body: [
      'Windows looks for other networks every minute or so, leaving its channel for a moment each time: a call feels it as a short stall. Media streaming mode holds the scan off; the pane can only report which is on.',
    ],
  },
  metered: {
    title: 'METERED',
    body: ['The system treats this network as metered, and may hold updates and syncs back on it.'],
  },
  'adapter-chip': {
    title: 'ADAPTER',
    body: [
      "Each wireless adapter, with its signal. The one chosen is the one the path, the radio, the timeline and the gateway echo follow; the internet echo leaves by the system's default route whichever is shown.",
    ],
  },
  'lane-signal': {
    title: 'SIGNAL LANE',
    body: [
      'The signal over time, its spread in each column shaded. The dotted lines are the call level and the break-up level.',
    ],
  },
  'lane-retry': {
    title: 'RETRY LANE',
    body: [
      'The share of frames retried in each column, where enough frames went for it to mean anything.',
    ],
  },
  'lane-rtt': {
    title: 'RTT LANE',
    body: [
      'Round trips on a square-root scale, so a few ms and a few hundred both read: the internet as a line with its spread shaded, the gateway dotted.',
    ],
  },
  'lane-loss': {
    title: 'LOSS LANE',
    body: ['Echoes to the internet lost in each column, as a share.'],
  },
  'lane-traffic': {
    title: 'TRAFFIC LANE',
    body: ['What went out through this adapter above the line, and what came in below it.'],
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
      'The pane reads nothing while it is not on screen, so these stretches have no readings. Drops in them are still in the log, from the system.',
    ],
  },
  uptime: {
    title: 'LAST 24 HOURS',
    body: [
      "Connected and not, from the system's own log: accent while connected, red while not, hatched before the log's first entry. Drops that keep a steady beat point at a service's session limit.",
    ],
  },
  'event-connected': {
    title: 'CONNECTED',
    body: ['The system connected to the network (its log).'],
  },
  'event-failed': {
    title: 'FAILED',
    body: ["An attempt to connect that failed, in the system's own words."],
  },
  'event-disconnected': {
    title: 'LINK LOST',
    body: [
      'The system\'s log of the link going, with its reason and how long it stayed down. "By the driver" with a weak signal: out of range, or a tunnel.',
    ],
  },
  'event-handover': {
    title: 'HANDOVER',
    body: [
      'The channel changed while the link stayed up: most likely another access point took over (the pane cannot read which: that needs location access). On a train, one per car or per station.',
    ],
  },
  'event-upstream-lost': {
    title: 'UPSTREAM LOST',
    body: [
      'Echoes to the internet stopped coming back while the gateway went on answering: the way beyond the access point went.',
    ],
  },
  'event-upstream-back': { title: 'UPSTREAM BACK', body: ['Echoes to the internet came back.'] },
  'event-sign-in': {
    title: 'SIGN-IN',
    body: [
      'The system found a captive portal: the network wants a sign-in page before it lets traffic through.',
    ],
  },
  'f-bssid': {
    title: 'BSSID',
    body: [
      "The access point's own address. Reading it needs the location permission on Windows 11 and macOS, which elecdex never asks for, so handovers are told from the channel instead.",
    ],
  },
  'f-scan': STATIC_SCAN(),
  'f-dhcp': {
    title: 'DHCP',
    body: [
      'Whether the address came from the network, and how long is left of its lease. A lease that runs out while the network does not answer is a drop.',
    ],
  },
  'f-echo': {
    title: 'ECHO HOST',
    body: [
      'The internet host the pane pings each second; the network status pane reads the same echo.',
    ],
  },
}

function STATIC_SCAN(): Hint {
  return {
    title: 'SCAN',
    body: [
      'Background scan: Windows leaving its channel every minute or so to look for other networks. Streaming mode: an application asked for the scan to be held off.',
    ],
  }
}

/** The card for a key, or null for one the pane does not know. */
export function hintFor(key: string): Hint | null {
  if (key.startsWith('c-')) return COUNTERS[key.slice(2) as keyof WifiCounters] ?? null
  return STATIC[key] ?? null
}

/** What a figure reads now, for the card's NOW line; null when there is nothing live to say. */
export function liveFor(key: string, c: HintContext): string | null {
  if (key.startsWith('c-')) return counterLive(key.slice(2) as keyof WifiCounters, c)
  const figure = FIGURES[key]
  return figure === undefined ? linkLive(key, c.link) : figure(c)
}

function counterLive(name: keyof WifiCounters, c: HintContext): string | null {
  const total = c.link?.counters?.[name]
  if (total === undefined) return null
  const rate = c.rates?.[name]
  const perMinute = rate === undefined ? '' : `, ${Math.round(rate).toLocaleString('en')} a minute`
  return `${Math.round(total).toLocaleString('en')} since the adapter came up${perMinute}`
}

function radioLive(c: HintContext): string | null {
  const rssi = c.link?.rssi
  if (rssi == null) return null
  const retry = c.figures.retry
  const retries =
    retry === null ? ', retries not judged: too few frames' : `, retries ${pct(retry)}`
  return `${rssi} dBm (${signalGrade(rssi)})${retries}`
}

/** The live line of each figure the path and the header show. */
const FIGURES: Record<string, (c: HintContext) => string | null> = {
  cause: (c) => `${CAUSE_LABELS[c.diagnosis.cause]}: ${c.diagnosis.evidence}`,
  mos: (c) =>
    c.mos === null ? 'no echoes yet' : `${c.mos.toFixed(2)} from ${hop(c.figures.internet)}`,
  'station-pc': ({ figures: f }) =>
    f.up === null ? null : `↑ ${megabits(f.up)} · ↓ ${megabits(f.down ?? 0)}`,
  'station-radio': radioLive,
  gauge: radioLive,
  'station-gateway': (c) => hop(c.figures.gateway),
  'station-internet': (c) => `${c.host ?? '—'}: ${hop(c.figures.internet)}`,
}

function linkLive(key: string, link: WifiLink | null): string | null {
  if (link === null) return null
  const band = bandOf(link.freqMhz)
  switch (key) {
    case 'channel':
    case 'dfs':
      return `channel ${link.channel ?? '—'} on ${band ?? '—'} GHz, ${link.widthMhz ?? '—'} MHz wide${isDfs(link.channel, band) ? ', a DFS channel' : ''}`
    case 'standard':
      return `${standardLabel(link.standard, band)}: ↓ ${link.rxMbps ?? '—'} ↑ ${link.txMbps ?? '—'} Mb/s`
    case 'bgscan':
    case 'f-scan':
      return `background scan ${onOff(link.backgroundScan)}, streaming mode ${onOff(link.streamingMode)}`
    case 'adapter-chip':
      return link.adapter
    default:
      return null
  }
}

const onOff = (v: boolean | null): string => (v === null ? 'unknown' : v ? 'on' : 'off')

/**
 * A short name for an adapter's chip: its model where the description has one
 * ("Intel(R) Wi-Fi 6E AX211 160MHz" -> "AX211"), else the description cut short.
 */
export function shortAdapter(description: string): string {
  const words = description
    .replace(/\(R\)|\(TM\)|®|™/gi, '')
    .split(/\s+/)
    .filter(Boolean)
  const model = words.find(
    (w) =>
      /[A-Za-z]/.test(w) &&
      /\d/.test(w) &&
      !/^(wi-?fi|\d+mhz|802\.11\w*|6e?)$/i.test(w) &&
      w.length >= 3,
  )
  if (model !== undefined) return model
  const text = words.join(' ')
  return text.length <= 14 ? text : `${text.slice(0, 13)}…`
}
