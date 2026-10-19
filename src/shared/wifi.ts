/**
 * The Wi-Fi pane's readings, and every decision made about them.
 *
 * The collector reads what the operating system gives without asking for the
 * user's location (architecture.md §5.12): since Windows 11 24H2 the BSSID, the
 * list of networks around and a scan are behind the location consent, and
 * elecdex never asks for it - so none of them is here, on any platform. What is
 * here is enough to say *where* a connection is failing: the radio (signal,
 * retries), the hop to the access point (a ping to the gateway), or beyond it
 * (a ping to the internet), and what the machine itself is sending meanwhile.
 *
 * Everything below the types is pure, so the pane's judgements are unit-tested
 * on their own (tests/unit/wifi.test.ts).
 */

import {
  correlation,
  DIAGNOSIS_WINDOW_MS,
  GONE_AFTER,
  gatewayEcho,
  type Health,
  hopHealth,
  hopLine,
  internetHealth,
  maskAddress,
  maskName,
  meanOf,
  median,
  type CounterMark as NetCounterMark,
  over,
  ownUploadDrags,
  PATH_LIMITS,
  type PathInternet,
  type PathProbe,
  type ProbeStats,
  probeStats,
  type Rates,
  roundMs,
  roundPct,
  type Spread,
  spread,
  stamp,
  under,
  worse,
} from './netpath.js'

// What the Ethernet pane shares with this one lives in netpath.ts; the Wi-Fi
// names stay, so nothing that reads them has to change.
export {
  correlation,
  DIAGNOSIS_WINDOW_MS,
  type GatewayEcho as WifiGatewayEcho,
  gatewayEcho,
  type Health,
  HISTORY_MS as WIFI_HISTORY_MS,
  maskAddress,
  maskName,
  mosEstimate,
  mosOf,
  PATH_WINDOWS as WIFI_WINDOWS,
  type PathProbe as WifiProbe,
  type PathWindowId as WifiWindowId,
  type ProbeStats,
  perMinute,
  pointAt,
  probeStats,
  pushPoint,
  regularInterval,
  type Spread,
  windowMs,
} from './netpath.js'

// ---------------------------------------------------------------------------
// Readings
// ---------------------------------------------------------------------------

/** How the interface stands. `off` is the radio switched off (airplane mode, a switch). */
export type WifiState = 'connected' | 'connecting' | 'disconnected' | 'off'

/** IEEE 802.11 amendment: `ax` is Wi-Fi 6, `be` Wi-Fi 7. */
export type WifiStandard = 'a' | 'b' | 'g' | 'n' | 'ac' | 'ad' | 'ax' | 'be'

export type WifiBand = '2.4' | '5' | '6'

/** What the OS says of the way out: `constrained` is a captive portal waiting for a sign-in. */
export type WifiInternet = PathInternet

/** One radio link of a multi-link (Wi-Fi 7 MLO) connection. */
export interface WifiRadioLink {
  freqMhz: number
  widthMhz: number | null
  rssi: number | null
}

/**
 * Frame counters since the interface came up. Null where the driver does not
 * keep them. The pane works in their differences.
 */
export interface WifiCounters {
  txFrames: number
  rxFrames: number
  retries: number
  multiRetries: number
  failed: number
  ackFailures: number
  fcsErrors: number
  decryptFailures: number
  handshakeFailures: number
}

export interface WifiLink {
  /** The interface: its GUID on Windows, its name elsewhere. Never a path. */
  id: string
  /** The adapter, e.g. "Intel(R) Wi-Fi 6E AX211 160MHz", or the interface name. */
  adapter: string
  state: WifiState
  /** Null when the OS keeps it back (macOS without location access) or it is not connected. */
  ssid: string | null
  standard: WifiStandard | null
  freqMhz: number | null
  channel: number | null
  widthMhz: number | null
  /** dBm. */
  rssi: number | null
  /** dBm, where the platform reports a noise floor (macOS). */
  noise: number | null
  /** The driver's own link quality, 0-100 (Windows). */
  quality: number | null
  /** The PHY's negotiated rates, Mbit/s - what the radio could carry, not what it does. */
  rxMbps: number | null
  txMbps: number | null
  /** The links of a multi-link connection; empty for a single link. */
  radios: WifiRadioLink[]
  /** e.g. "WPA2-Personal"; null when unknown. */
  security: string | null
  /** e.g. "CCMP". */
  cipher: string | null
  internet: WifiInternet | null
  metered: boolean | null
  /** Windows' periodic background scan, which stalls traffic for a moment each time. */
  backgroundScan: boolean | null
  /** Windows' media streaming mode, which holds the scan off. */
  streamingMode: boolean | null
  mac: string | null
  ip4: string | null
  prefix4: number | null
  ip6: string[]
  gateway: string | null
  dns: string[]
  mtu: number | null
  dhcp: boolean | null
  /** Seconds left on the DHCP lease. */
  leaseSeconds: number | null
  /** Bytes per second through this adapter since the reading before. */
  rxSec: number | null
  txSec: number | null
  counters: WifiCounters | null
}

export interface NetWifi {
  links: WifiLink[]
  /** Null while the pings are starting, or where they cannot run. */
  probe: PathProbe | null
  /** What this platform cannot tell, so the pane can say why a figure is missing. */
  limits: WifiLimit[]
}

/** Something the platform will not tell, and the pane says so rather than show a dash. */
export type WifiLimit = 'bssid-location' | 'ssid-location' | 'no-log' | 'no-counters'

export type WifiEventKind = 'connected' | 'failed' | 'disconnected'

/** A connection event from the operating system's own log (Windows' WLAN-AutoConfig). */
export interface WifiEvent {
  /** Unique within the log, so a re-read never counts one twice. */
  key: string
  at: number
  kind: WifiEventKind
  ssid: string | null
  /** The OS's reason code, when it gives one. */
  code: number | null
  /** The OS's own words, in its display language. */
  reason: string
}

export interface NetWifiEvents {
  /** Newest first, the last 24 hours. */
  events: WifiEvent[]
}

// ---------------------------------------------------------------------------
// The radio
// ---------------------------------------------------------------------------

/** The band a centre frequency falls in. */
export function bandOf(freqMhz: number | null): WifiBand | null {
  if (freqMhz === null) return null
  if (freqMhz >= 2400 && freqMhz < 2500) return '2.4'
  if (freqMhz >= 5925 && freqMhz <= 7125) return '6'
  if (freqMhz >= 5150 && freqMhz < 5925) return '5'
  return null
}

/** The channel number of a 20 MHz centre frequency (802.11 channel numbering). */
export function channelOf(freqMhz: number | null): number | null {
  if (freqMhz === null) return null
  if (freqMhz === 2484) return 14
  const band = bandOf(freqMhz)
  if (band === '2.4') return Math.round((freqMhz - 2407) / 5)
  if (band === '5') return Math.round((freqMhz - 5000) / 5)
  if (band === '6') return freqMhz === 5935 ? 2 : Math.round((freqMhz - 5950) / 5)
  return null
}

/** The centre frequency of a channel on a band. */
export function freqOf(channel: number, band: WifiBand): number {
  if (band === '2.4') return channel === 14 ? 2484 : 2407 + channel * 5
  if (band === '5') return 5000 + channel * 5
  return 5950 + channel * 5
}

/**
 * 5 GHz channels under Dynamic Frequency Selection: an access point on one
 * must leave it when it hears radar, which clients feel as a drop or a stall.
 */
export function isDfs(channel: number | null, band: WifiBand | null): boolean {
  return band === '5' && channel !== null && channel >= 52 && channel <= 144
}

/** DOT11_PHY_TYPE, as Windows numbers it. */
const PHY_TYPES: Record<number, WifiStandard> = {
  4: 'a',
  5: 'b',
  6: 'g',
  7: 'n',
  8: 'ac',
  9: 'ad',
  10: 'ax',
  11: 'be',
}

export function standardOfPhy(phyType: number | null): WifiStandard | null {
  return phyType === null ? null : (PHY_TYPES[phyType] ?? null)
}

/** "Wi-Fi 6E", "Wi-Fi 5", "802.11g": the marketing name where there is one. */
export function standardLabel(standard: WifiStandard | null, band: WifiBand | null): string {
  switch (standard) {
    case null:
      return '—'
    case 'be':
      return 'Wi-Fi 7'
    case 'ax':
      return band === '6' ? 'Wi-Fi 6E' : 'Wi-Fi 6'
    case 'ac':
      return 'Wi-Fi 5'
    case 'n':
      return 'Wi-Fi 4'
    default:
      return `802.11${standard}`
  }
}

export type SignalGrade = 'excellent' | 'good' | 'fair' | 'weak' | 'none'

/**
 * How a signal reads for a call. -67 dBm is the level voice and video networks
 * are designed for; below -75 a call starts to break up.
 */
export function signalGrade(rssi: number | null): SignalGrade {
  if (rssi === null) return 'none'
  if (rssi >= -55) return 'excellent'
  if (rssi >= -67) return 'good'
  if (rssi >= -75) return 'fair'
  return 'weak'
}

/** 0-4 bars, as the taskbar would draw them. */
export function signalBars(rssi: number | null): number {
  if (rssi === null) return 0
  if (rssi >= -55) return 4
  if (rssi >= -67) return 3
  if (rssi >= -75) return 2
  if (rssi >= -85) return 1
  return 0
}

/** Where -90..-30 dBm puts a reading on a gauge, 0-1. */
export function signalFraction(rssi: number | null): number {
  if (rssi === null) return 0
  return Math.min(1, Math.max(0, (rssi + 90) / 60))
}

/** Windows' NetworkAuthenticationType names, as people know them. */
const AUTHENTICATION: Record<string, string> = {
  None: 'Open',
  Open80211: 'Open',
  SharedKey80211: 'WEP',
  Wpa: 'WPA-Enterprise',
  WpaPsk: 'WPA-Personal',
  WpaNone: 'WPA',
  Rsna: 'WPA2-Enterprise',
  RsnaPsk: 'WPA2-Personal',
  Ihv: 'Vendor',
  Wpa3: 'WPA3-Enterprise',
  Wpa3Enterprise192Bits: 'WPA3-Enterprise 192',
  Wpa3Enterprise: 'WPA3-Enterprise',
  Wpa3Sae: 'WPA3-Personal',
  Owe: 'Enhanced Open',
}

/** A security name from the platform's own spelling; unknown ones pass through. */
export function securityLabel(authentication: string | null): string | null {
  if (authentication === null || authentication === '' || authentication === 'Unknown') return null
  return AUTHENTICATION[authentication] ?? authentication
}

/** "Ccmp" -> "CCMP"; "None" stays readable. */
export function cipherLabel(cipher: string | null): string | null {
  if (cipher === null || cipher === '' || cipher === 'Unknown') return null
  if (cipher === 'None') return 'none'
  return cipher.toUpperCase()
}

// ---------------------------------------------------------------------------
// History: one point a second while the pane is seen
// ---------------------------------------------------------------------------

/** What the timeline draws for a second. Null where nothing was read. */
export interface WifiPoint {
  at: number
  state: WifiState | null
  rssi: number | null
  quality: number | null
  rxMbps: number | null
  txMbps: number | null
  /**
   * Share of transmitted frames that needed a retry since the point before,
   * 0-100; null while too few frames went for a share to mean anything.
   */
  retry: number | null
  /** Frames transmitted and retried since the point before, for shares over longer spans. */
  frames: number | null
  retries: number | null
  /** Round trips; null a lost echo; undefined when not asked (no gateway, no probe). */
  gateway: number | null | undefined
  internet: number | null | undefined
  /** Bytes per second. */
  up: number | null
  down: number | null
  freqMhz: number | null
  channel: number | null
  internetState: WifiInternet | null
}

/** The link the pane follows: the one chosen, else the first connected, else the first. */
export function primaryLink(links: readonly WifiLink[], chosen: string | null): WifiLink | null {
  return (
    links.find((link) => link.id === chosen) ??
    links.find((link) => link.state === 'connected') ??
    links[0] ??
    null
  )
}

/**
 * Frames a second must carry for its retry share to be drawn. An idle link
 * sends a few dozen frames a second - keep-alives, power-save polls - and
 * retries a good half of them however clean the air is (measured on an Intel
 * AX211 at -55 dBm: 54 %), which says nothing about a call.
 */
export const RETRY_FRAMES_PER_SECOND = 100

/** The frames sent and retried between two counter readings; null across a reset or with none. */
export function counterDelta(
  before: WifiCounters | null,
  after: WifiCounters | null,
): { frames: number; retries: number } | null {
  if (before === null || after === null) return null
  const frames = after.txFrames - before.txFrames
  const retries = after.retries - before.retries
  return frames < 0 || retries < 0 ? null : { frames, retries }
}

/** The share of frames retried, or null below `minFrames`. */
export function retryShare(
  delta: { frames: number; retries: number } | null,
  minFrames = RETRY_FRAMES_PER_SECOND,
): number | null {
  if (delta === null || delta.frames < minFrames || delta.frames === 0) return null
  return Math.min(100, (delta.retries / delta.frames) * 100)
}

const NO_LINK = {
  state: null,
  rssi: null,
  quality: null,
  rxMbps: null,
  txMbps: null,
  up: null,
  down: null,
  freqMhz: null,
  channel: null,
  internetState: null,
} as const

/** The link's part of a point. */
function linkPart(link: WifiLink | null) {
  if (link === null) return NO_LINK
  return {
    state: link.state,
    rssi: link.rssi,
    quality: link.quality,
    rxMbps: link.rxMbps,
    txMbps: link.txMbps,
    up: link.txSec,
    down: link.rxSec,
    freqMhz: link.freqMhz,
    channel: link.channel,
    internetState: link.internet,
  }
}

/** The second a reading stands for, from the probe round or the sample. */
export function toPoint(
  link: WifiLink | null,
  probe: PathProbe | null,
  at: number,
  previous: WifiLink | null,
): WifiPoint {
  const counted = previous !== null && link !== null && previous.id === link.id
  const delta = counted ? counterDelta(previous.counters, link.counters) : null
  return {
    at,
    ...linkPart(link),
    retry: retryShare(delta),
    frames: delta?.frames ?? null,
    retries: delta?.retries ?? null,
    gateway: gatewayEcho(probe, link?.id ?? null),
    internet: probe === null ? undefined : probe.internet,
  }
}

/** Counters as they stood at a moment, for rates over the last minute (netpath's `perMinute`). */
export type CounterMark = NetCounterMark<WifiCounters>
/** Each counter's increase per minute; null for one reset since the mark a minute ago. */
export type WifiRates = Rates<WifiCounters>

// ---------------------------------------------------------------------------
// Diagnosis
// ---------------------------------------------------------------------------

/**
 * The limits a segment is judged by: `warn` and `bad`. Chosen from what calls
 * tolerate (ITU-T G.114 puts one-way delay under 150 ms; video services ask for
 * jitter under 30 ms and loss under 1 %), and for the gateway from what a
 * healthy Wi-Fi hop does (a few ms). Tuned in one place.
 */
export const WIFI_LIMITS = {
  rssi: { warn: -67, bad: -75 },
  retry: { warn: 15, bad: 30 },
  gatewayRtt: { warn: 20, bad: 60 },
  gatewayJitter: { warn: 10, bad: 30 },
  gatewayLoss: { warn: 1, bad: 5 },
  ...PATH_LIMITS,
} as const

export type WifiCause =
  | 'ok'
  | 'off'
  | 'disconnected'
  | 'sign-in'
  | 'upstream-lost'
  | 'radio'
  | 'local'
  | 'own-upload'
  | 'upstream'
  | 'waiting'

export interface Diagnosis {
  cause: WifiCause
  health: Exclude<Health, 'idle'>
  /** The segments of the path, PC -> RADIO -> GATEWAY -> INTERNET. */
  segments: { pc: Health; radio: Health; gateway: Health; internet: Health }
  /** The figures the cause rests on, short. */
  evidence: string
}

/** Figures the diagnosis and the pane share, over the last minute. */
export interface PathFigures {
  rssi: number | null
  retry: number | null
  gateway: ProbeStats
  internet: ProbeStats
  up: number | null
  down: number | null
  /** The internet's round trip moving with the upload (a bufferbloated uplink). */
  uploadDrag: number | null
  /** The last few echoes to the internet all lost, with the gateway answering. */
  upstreamGone: boolean
}

/** The retry share over a stretch, from its frames: null while the link idles. */
function retryOver(points: readonly WifiPoint[]): number | null {
  let frames = 0
  let retries = 0
  for (const p of points) {
    frames += p.frames ?? 0
    retries += p.retries ?? 0
  }
  return retryShare({ frames, retries }, RETRY_FRAMES_PER_SECOND * points.length)
}

export function pathFigures(
  points: readonly WifiPoint[],
  now: number,
  span = DIAGNOSIS_WINDOW_MS,
): PathFigures {
  const recent = points.filter((p) => p.at > now - span && p.at <= now)
  const tail = recent.slice(-GONE_AFTER)
  const upstreamGone =
    tail.length === GONE_AFTER &&
    tail.every(
      (p) => p.internet === null && typeof p.gateway === 'number' && p.state === 'connected',
    )
  const drag = correlation(
    recent
      .filter((p) => p.up !== null && typeof p.internet === 'number')
      .map((p) => [p.up as number, p.internet as number] as const),
  )
  return {
    rssi: meanOf(recent.slice(-5).map((p) => p.rssi)),
    retry: retryOver(recent.slice(-10)),
    gateway: probeStats(recent.map((p) => p.gateway)),
    internet: probeStats(recent.map((p) => p.internet)),
    up: meanOf(recent.slice(-5).map((p) => p.up)),
    down: meanOf(recent.slice(-5).map((p) => p.down)),
    uploadDrag: drag,
    upstreamGone,
  }
}

function segmentsOf(f: PathFigures): Diagnosis['segments'] {
  const radio = worse(under(f.rssi, WIFI_LIMITS.rssi), over(f.retry, WIFI_LIMITS.retry))
  // A gateway that never answers is one that does not answer pings, not a lossy hop.
  const gatewaySilent = f.gateway.sent > 0 && f.gateway.received === 0
  const gateway = gatewaySilent
    ? 'idle'
    : hopHealth(f.gateway, {
        rtt: WIFI_LIMITS.gatewayRtt,
        jitter: WIFI_LIMITS.gatewayJitter,
        loss: WIFI_LIMITS.gatewayLoss,
      })
  const internet = internetHealth(f.internet)
  const pc: Health = f.up === null ? 'idle' : ownUploadDrags(f.up, f.uploadDrag) ? 'warn' : 'ok'
  return { pc, radio, gateway, internet }
}

/**
 * Where the trouble is, from the last minute and the link as it stands.
 *
 * In order: nothing to judge (off, disconnected), a sign-in page in the way,
 * the way out gone while the access point still answers (a train's mobile
 * uplink in a tunnel), then the segments from the machine outwards - the radio,
 * the hop to the gateway, the machine's own upload, the internet beyond - since
 * trouble near the machine shows up again at every hop after it.
 */
export function diagnose(link: WifiLink | null, f: PathFigures): Diagnosis {
  const segments = segmentsOf(f)
  const base = { segments }
  if (link === null)
    return { ...base, cause: 'waiting', health: 'warn', evidence: 'no wireless adapter' }
  if (link.state === 'off')
    return { ...base, cause: 'off', health: 'bad', evidence: 'the radio is switched off' }
  if (link.state !== 'connected')
    return { ...base, cause: 'disconnected', health: 'bad', evidence: `link ${link.state}` }
  if (link.internet === 'constrained')
    return { ...base, cause: 'sign-in', health: 'bad', evidence: 'the network wants a sign-in' }
  if (f.upstreamGone)
    return {
      ...base,
      cause: 'upstream-lost',
      health: 'bad',
      evidence: `gateway ${roundMs(f.gateway.median)}, internet not answering`,
    }
  return judgeSegments(segments, f)
}

function judgeSegments(segments: Diagnosis['segments'], f: PathFigures): Diagnosis {
  const radioWords = (): string =>
    [
      f.rssi === null ? null : `signal ${Math.round(f.rssi)} dBm`,
      f.retry === null ? null : `retries ${roundPct(f.retry)}`,
    ]
      .filter(Boolean)
      .join(', ')
  const hop = (name: string, s: ProbeStats): string =>
    `${name} ${roundMs(s.median)} ±${s.jitter === null ? '—' : Math.round(s.jitter)}, loss ${roundPct(s.loss)}`

  const ordered: [keyof Diagnosis['segments'], WifiCause, () => string][] = [
    ['radio', 'radio', radioWords],
    ['gateway', 'local', () => hop('gateway', f.gateway)],
    [
      'pc',
      'own-upload',
      () => `sending ${(((f.up ?? 0) * 8) / 1e6).toFixed(1)} Mb/s, delay rises with it`,
    ],
    [
      'internet',
      'upstream',
      () => `${hop('internet', f.internet)}; gateway ${roundMs(f.gateway.median)}`,
    ],
  ]
  for (const level of ['bad', 'warn'] as const) {
    for (const [segment, cause, words] of ordered) {
      if (segments[segment] === level) return { segments, cause, health: level, evidence: words() }
    }
  }
  const quiet = f.internet.sent === 0 && f.gateway.sent === 0
  return {
    segments,
    cause: quiet ? 'waiting' : 'ok',
    health: 'ok',
    evidence: quiet
      ? 'measuring…'
      : `internet ${roundMs(f.internet.median)}, loss ${roundPct(f.internet.loss)}`,
  }
}

/** A station on the path. */
export type Station = 'pc' | 'radio' | 'gateway' | 'internet'

const CULPRITS: Partial<Record<WifiCause, Station>> = {
  radio: 'radio',
  off: 'radio',
  disconnected: 'radio',
  local: 'gateway',
  'own-upload': 'pc',
  upstream: 'internet',
  'upstream-lost': 'internet',
  'sign-in': 'internet',
}

/**
 * The station a diagnosis blames, for the path to single out, or null when all
 * is well (or there is nothing yet to judge).
 */
export function culpritStation(d: Diagnosis): Station | null {
  return d.health === 'ok' ? null : (CULPRITS[d.cause] ?? null)
}

/** What each cause is called on screen. */
export const CAUSE_LABELS: Record<WifiCause, string> = {
  ok: 'CLEAR',
  off: 'RADIO OFF',
  disconnected: 'NO CARRIER',
  'sign-in': 'SIGN-IN NEEDED',
  'upstream-lost': 'UPSTREAM LOST',
  radio: 'RADIO',
  local: 'LOCAL LINK',
  'own-upload': 'OWN UPLOAD',
  upstream: 'UPSTREAM',
  waiting: 'STANDBY',
}

// ---------------------------------------------------------------------------
// Events: the OS's log, and what the history itself shows
// ---------------------------------------------------------------------------

export type TrackKind = WifiEventKind | 'handover' | 'upstream-lost' | 'upstream-back' | 'sign-in'

/** A mark on the timeline and a row in the log. */
export interface TrackEvent {
  key: string
  at: number
  kind: TrackKind
  /** Short words beside it: the OS's reason, or what changed. */
  detail: string
  code: number | null
  ssid: string | null
  /** Seconds the link was down, for a disconnection the log saw end. */
  downFor: number | null
}

/**
 * What the history shows happening that no log records: a change of channel
 * on a connection that stayed up (roaming to another access point - the pane
 * cannot see the access point itself, but a new channel is a new one), the way
 * out going and coming back, and a sign-in page appearing.
 */
export function derivedEvents(points: readonly WifiPoint[]): TrackEvent[] {
  const events: TrackEvent[] = []
  const way = { lostRun: 0, gone: false }
  let previous: WifiPoint | null = null
  for (const p of points) {
    if (previous !== null && p.at - previous.at > 5000) {
      // A gap (the pane was not seen): nothing is claimed across it.
      way.lostRun = 0
      way.gone = false
    } else {
      events.push(...changesBetween(previous, p), ...wayOut(way, p))
    }
    previous = p
  }
  return events
}

/** A new channel on a connection that stayed up, and a sign-in page appearing. */
function changesBetween(previous: WifiPoint | null, p: WifiPoint): TrackEvent[] {
  const out: TrackEvent[] = []
  const bothUp = previous?.state === 'connected' && p.state === 'connected'
  if (bothUp && previous?.channel != null && p.channel !== null && previous.channel !== p.channel) {
    out.push(mark(p.at, 'handover', `ch ${previous.channel} → ${p.channel}`))
  }
  if (p.internetState === 'constrained' && previous?.internetState !== 'constrained') {
    out.push(mark(p.at, 'sign-in', 'captive portal'))
  }
  return out
}

/** The way out going (a run of lost echoes with the gateway answering) and coming back. */
function wayOut(way: { lostRun: number; gone: boolean }, p: WifiPoint): TrackEvent[] {
  const lost = p.internet === null && typeof p.gateway === 'number' && p.state === 'connected'
  way.lostRun = lost ? way.lostRun + 1 : 0
  if (!way.gone && way.lostRun === GONE_AFTER) {
    way.gone = true
    return [mark(p.at - (GONE_AFTER - 1) * 1000, 'upstream-lost', 'gateway up, internet silent')]
  }
  if (way.gone && typeof p.internet === 'number') {
    way.gone = false
    return [mark(p.at, 'upstream-back', `internet ${Math.round(p.internet)} ms`)]
  }
  return []
}

const mark = (at: number, kind: TrackKind, detail: string): TrackEvent => ({
  key: `${kind}:${at}`,
  at,
  kind,
  detail,
  code: null,
  ssid: null,
  downFor: null,
})

/**
 * The log's events as marks, each disconnection told how long it lasted when
 * the connection after it is in the log too.
 */
export function logEvents(events: readonly WifiEvent[]): TrackEvent[] {
  const ascending = [...events].sort((a, b) => a.at - b.at)
  return ascending.map((e, i) => {
    let downFor: number | null = null
    if (e.kind === 'disconnected') {
      const back = ascending.slice(i + 1).find((next) => next.kind === 'connected')
      if (back !== undefined) downFor = Math.round((back.at - e.at) / 1000)
    }
    return {
      key: e.key,
      at: e.at,
      kind: e.kind,
      detail: e.reason,
      code: e.code,
      ssid: e.ssid,
      downFor,
    }
  })
}

export type LinkState = 'up' | 'down' | 'unknown'

/** What held at a moment: the last change before it, in events sorted oldest first. */
function stateAt(ascending: readonly WifiEvent[], at: number): LinkState {
  let state: LinkState = 'unknown'
  for (const e of ascending) {
    if (e.at >= at) break
    if (e.kind === 'connected') state = 'up'
    else if (e.kind === 'disconnected') state = 'down'
  }
  return state
}

/** A stretch of the day in one state, for the connection bar. */
export interface Stretch {
  from: number
  to: number
  state: LinkState
}

/**
 * The last `span` as stretches of up and down, from the system's log: up from a
 * connection until the next disconnection, down from a disconnection until the
 * next connection, unknown before the first event the log holds. A failed
 * attempt changes nothing: the link was down already, or stays up.
 */
export function availability(
  events: readonly WifiEvent[],
  now: number,
  span = 86_400_000,
): Stretch[] {
  const from = now - span
  const ascending = events.filter((e) => e.at <= now).sort((a, b) => a.at - b.at)
  let state = stateAt(ascending, from)
  const out: Stretch[] = []
  let at = from
  for (const e of ascending) {
    if (e.at < from || e.kind === 'failed') continue
    const next: LinkState = e.kind === 'connected' ? 'up' : 'down'
    if (next === state) continue
    if (e.at > at) out.push({ from: at, to: e.at, state })
    at = e.at
    state = next
  }
  out.push({ from: at, to: now, state })
  return out
}

/** Both kinds together, newest first. */
export function mergeEvents(
  log: readonly TrackEvent[],
  derived: readonly TrackEvent[],
): TrackEvent[] {
  return [...log, ...derived].sort((a, b) => b.at - a.at || a.key.localeCompare(b.key))
}

/**
 * The moments the internet's round trip jumped well above its usual level:
 * over three times the median and at least 50 ms more. What a background scan
 * does to a call, every minute or so.
 */
export function latencySpikes(points: readonly WifiPoint[]): number[] {
  const rtts = points
    .map((p) => p.internet)
    .filter((v): v is number => typeof v === 'number')
    .sort((a, b) => a - b)
  const typical = median(rtts)
  if (typical === null) return []
  const spikes: number[] = []
  let inSpike = false
  for (const p of points) {
    const high = typeof p.internet === 'number' && p.internet > Math.max(typical * 3, typical + 50)
    if (high && !inSpike) spikes.push(p.at)
    inSpike = high
  }
  return spikes
}

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

/** A stretch of the timeline drawn as one column: a lane's lowest, middle and highest. */
export interface Bucket {
  from: number
  to: number
  /** Points in the column; none is time the pane was not watched. */
  count: number
  rssi: Spread | null
  retry: Spread | null
  gateway: Spread | null
  internet: Spread | null
  /** Echoes lost to the internet in the bucket, 0-100. */
  loss: number | null
  up: number | null
  down: number | null
}

/**
 * The points between `from` and `to` in `count` equal columns - one second each
 * for the short windows, several for the long ones, so a spike still shows as a
 * column's top however many seconds share it. A column with no points is null
 * throughout: the gap stays a gap.
 */
export function bucketize(
  points: readonly WifiPoint[],
  from: number,
  to: number,
  count: number,
): Bucket[] {
  const width = (to - from) / Math.max(1, count)
  const columns: WifiPoint[][] = Array.from({ length: Math.max(1, count) }, () => [])
  for (const p of points) {
    if (p.at < from || p.at >= to) continue
    const i = Math.min(columns.length - 1, Math.floor((p.at - from) / width))
    columns[i]?.push(p)
  }
  return columns.map((column, i) => {
    const asked = column.filter((p) => p.internet !== undefined)
    return {
      from: from + i * width,
      to: from + (i + 1) * width,
      count: column.length,
      rssi: spread(column.map((p) => p.rssi)),
      retry: spread(column.map((p) => p.retry)),
      gateway: spread(column.map((p) => p.gateway)),
      internet: spread(column.map((p) => p.internet)),
      loss:
        asked.length === 0
          ? null
          : (asked.filter((p) => p.internet === null).length / asked.length) * 100,
      up: meanOf(column.map((p) => p.up)),
      down: meanOf(column.map((p) => p.down)),
    }
  })
}

// ---------------------------------------------------------------------------
// The pane's shape
// ---------------------------------------------------------------------------

export interface WifiSections {
  /** The radio's gauge, map and rates. */
  radio: boolean
  /** Radio gauge beside the channel map, or stacked. */
  radioWide: boolean
  /**
   * The timeline, the log and the detail one under another; otherwise they
   * share the room as tabs, one at a time.
   */
  stacked: boolean
  /**
   * Room for two columns: the path beside the radio, and the log beside the
   * detail - what a pane brought forward on a wide screen has, where one column
   * of parts spread its figures to the far edges.
   */
  wide: boolean
}

/** The height each part wants, in CSS pixels, at the type scale of a 1080p screen. */
export const SECTION_HEIGHTS = {
  header: 34,
  path: 124,
  radio: 132,
  timeline: 190,
  log: 130,
  detail: 210,
} as const

/**
 * How the pane lays itself out at this size. The path and its verdict always
 * show; the radio when there is room for it beside what follows; and the
 * timeline, log and detail stacked when all three fit, else as tabs - so none
 * of them is ever out of reach, only a click away.
 */
export function wifiSections(width: number, height: number): WifiSections {
  const h = SECTION_HEIGHTS
  const radio = height >= h.header + h.path + h.radio + h.timeline
  const room = height - h.header - h.path - (radio ? h.radio : 0)
  const stacked = room >= h.timeline + h.log + h.detail
  return {
    radio,
    radioWide: width >= 460,
    stacked,
    wide: stacked && width >= WIDE_FROM,
  }
}

/** The width, in CSS pixels, from which the stacked pane goes to two columns. */
export const WIDE_FROM = 1100

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
