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

// ---------------------------------------------------------------------------
// Readings
// ---------------------------------------------------------------------------

/** How the interface stands. `off` is the radio switched off (airplane mode, a switch). */
export type WifiState = 'connected' | 'connecting' | 'disconnected' | 'off'

/** IEEE 802.11 amendment: `ax` is Wi-Fi 6, `be` Wi-Fi 7. */
export type WifiStandard = 'a' | 'b' | 'g' | 'n' | 'ac' | 'ad' | 'ax' | 'be'

export type WifiBand = '2.4' | '5' | '6'

/** What the OS says of the way out: `constrained` is a captive portal waiting for a sign-in. */
export type WifiInternet = 'internet' | 'constrained' | 'local' | 'none'

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

/**
 * One round of pings, taken together: to the Wi-Fi gateway and to the host the
 * network status pane pings (one ICMP echo serves both panes).
 *
 * A number is a round trip in ms; null is an echo that did not come back. The
 * gateway is undefined-free on purpose: `gatewayAddress` null means there was
 * no gateway to ask, and then `gateway` is null without meaning a loss.
 */
export interface WifiProbe {
  /** Epoch ms of the round: the key a history is kept by, so no round is counted twice. */
  at: number
  host: string
  internet: number | null
  gatewayAddress: string | null
  gateway: number | null
}

export interface NetWifi {
  links: WifiLink[]
  /** Null while the pings are starting, or where they cannot run. */
  probe: WifiProbe | null
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
  probe: WifiProbe | null,
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
    gateway: probe === null || probe.gatewayAddress === null ? undefined : probe.gateway,
    internet: probe === null ? undefined : probe.internet,
  }
}

/** Counters as they stood at a moment, for rates over the last minute. */
export interface CounterMark {
  at: number
  counters: WifiCounters
}

/**
 * Each counter's increase per minute, from the mark nearest a minute ago to the
 * latest; null with less than ten seconds between them or across a reset.
 */
export function perMinute(marks: readonly CounterMark[]): WifiCounters | null {
  const last = marks[marks.length - 1]
  if (last === undefined) return null
  const target = last.at - 60_000
  let first: CounterMark | undefined
  for (const m of marks) {
    if (first === undefined || Math.abs(m.at - target) < Math.abs(first.at - target)) first = m
  }
  if (first === undefined || last.at - first.at < 10_000) return null
  const minutes = (last.at - first.at) / 60_000
  const out = {} as WifiCounters
  for (const key of Object.keys(last.counters) as (keyof WifiCounters)[]) {
    const d = last.counters[key] - first.counters[key]
    if (d < 0) return null
    out[key] = d / minutes
  }
  return out
}

/** The span a timeline shows. */
export const WIFI_WINDOWS = [
  { id: '1m', ms: 60_000, label: '1M' },
  { id: '5m', ms: 300_000, label: '5M' },
  { id: '15m', ms: 900_000, label: '15M' },
  { id: '60m', ms: 3_600_000, label: '60M' },
] as const
export type WifiWindowId = (typeof WIFI_WINDOWS)[number]['id']

/** The longest span kept: the widest timeline. */
export const WIFI_HISTORY_MS = 3_600_000

export function windowMs(id: string | undefined): number {
  return (WIFI_WINDOWS.find((w) => w.id === id) ?? WIFI_WINDOWS[1]).ms
}

/**
 * Adds a point, dropping what fell out of the longest window. A point not newer
 * than the last is ignored: a re-subscription replays the last sample.
 */
export function pushPoint(points: readonly WifiPoint[], point: WifiPoint): WifiPoint[] {
  const last = points[points.length - 1]
  if (last !== undefined && point.at <= last.at) return points as WifiPoint[]
  const cutoff = point.at - WIFI_HISTORY_MS
  const start = points.findIndex((p) => p.at >= cutoff)
  const kept = start < 0 ? [] : points.slice(start)
  kept.push(point)
  return kept
}

// ---------------------------------------------------------------------------
// Statistics over a stretch of pings
// ---------------------------------------------------------------------------

export interface ProbeStats {
  /** Echoes asked for. */
  sent: number
  /** Echoes that came back. */
  received: number
  /** Percent lost. */
  loss: number
  min: number | null
  median: number | null
  max: number | null
  /** Mean change between consecutive round trips (RFC 3550's idea), ms. */
  jitter: number | null
}

/** Stats over one target's round trips; undefined entries were not asked and do not count. */
export function probeStats(samples: readonly (number | null | undefined)[]): ProbeStats {
  const asked = samples.filter((s): s is number | null => s !== undefined)
  const got = asked.filter((s): s is number => s !== null)
  const sorted = [...got].sort((a, b) => a - b)
  let jitter: number | null = null
  if (got.length >= 2) {
    let total = 0
    for (let i = 1; i < got.length; i++) total += Math.abs((got[i] ?? 0) - (got[i - 1] ?? 0))
    jitter = total / (got.length - 1)
  }
  return {
    sent: asked.length,
    received: got.length,
    loss: asked.length === 0 ? 0 : ((asked.length - got.length) / asked.length) * 100,
    min: sorted[0] ?? null,
    median: median(sorted),
    max: sorted[sorted.length - 1] ?? null,
    jitter,
  }
}

function median(sorted: readonly number[]): number | null {
  if (sorted.length === 0) return null
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? (sorted[mid] ?? null)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
}

/**
 * The mean opinion score a voice call would get over this path, 1-4.5, from
 * the simplified E-model (ITU-T G.107) that network tools commonly use: the
 * round trip plus twice the jitter as effective latency, less 2.5 R per percent
 * lost. An estimate for a call's audio, not a measurement of one.
 */
export function mosEstimate(rttMs: number, jitterMs: number, lossPercent: number): number {
  const effective = rttMs + jitterMs * 2 + 10
  let r = effective < 160 ? 93.2 - effective / 40 : 93.2 - (effective - 120) / 10
  r -= lossPercent * 2.5
  r = Math.min(100, Math.max(0, r))
  const mos = 1 + 0.035 * r + 0.000007 * r * (r - 60) * (100 - r)
  return Math.min(4.5, Math.max(1, mos))
}

/** The call score over a stretch, or null before any echo was asked for. */
export function mosOf(s: ProbeStats): number | null {
  if (s.sent === 0) return null
  if (s.received === 0) return 1
  return mosEstimate(s.median ?? 0, s.jitter ?? 0, s.loss)
}

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
  internetRtt: { warn: 120, bad: 250 },
  internetJitter: { warn: 30, bad: 60 },
  internetLoss: { warn: 1, bad: 5 },
  /** Bytes per second sent that can crowd a call out of its own uplink. */
  ownUpload: 500_000,
} as const

export type Health = 'ok' | 'warn' | 'bad' | 'idle'

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

/** The seconds a diagnosis looks back over. */
export const DIAGNOSIS_WINDOW_MS = 60_000

const worse = (a: Health, b: Health): Health => {
  const order: Health[] = ['idle', 'ok', 'warn', 'bad']
  return order.indexOf(a) >= order.indexOf(b) ? a : b
}

/** Higher is worse: a latency, a jitter, a loss. */
function over(value: number | null, limit: { warn: number; bad: number }): Health {
  if (value === null) return 'idle'
  if (value >= limit.bad) return 'bad'
  if (value >= limit.warn) return 'warn'
  return 'ok'
}

/** Lower is worse: a signal. */
function under(value: number | null, limit: { warn: number; bad: number }): Health {
  if (value === null) return 'idle'
  if (value < limit.bad) return 'bad'
  if (value < limit.warn) return 'warn'
  return 'ok'
}

function meanOf(values: readonly (number | null)[]): number | null {
  const got = values.filter((v): v is number => v !== null)
  return got.length === 0 ? null : got.reduce((a, b) => a + b, 0) / got.length
}

/** Pearson's correlation, or null with too few pairs or no spread. */
export function correlation(pairs: readonly (readonly [number, number])[]): number | null {
  if (pairs.length < 8) return null
  const mx = pairs.reduce((s, [x]) => s + x, 0) / pairs.length
  const my = pairs.reduce((s, [, y]) => s + y, 0) / pairs.length
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (const [x, y] of pairs) {
    sxy += (x - mx) * (y - my)
    sxx += (x - mx) ** 2
    syy += (y - my) ** 2
  }
  return sxx === 0 || syy === 0 ? null : sxy / Math.sqrt(sxx * syy)
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

/** Consecutive lost echoes to the internet that make the way out "gone". */
const GONE_AFTER = 4

export function pathFigures(
  points: readonly WifiPoint[],
  now: number,
  span = DIAGNOSIS_WINDOW_MS,
): PathFigures {
  const recent = points.filter((p) => p.at > now - span && p.at <= now)
  const tail = recent.slice(-GONE_AFTER)
  const upstreamGone =
    tail.length === GONE_AFTER &&
    tail.every((p) => p.internet === null && p.gateway !== null && p.state === 'connected')
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
  const gateway =
    f.gateway.sent === 0 || gatewaySilent
      ? 'idle'
      : worse(
          over(f.gateway.median, WIFI_LIMITS.gatewayRtt),
          worse(
            over(f.gateway.jitter, WIFI_LIMITS.gatewayJitter),
            over(f.gateway.loss, WIFI_LIMITS.gatewayLoss),
          ),
        )
  const internet =
    f.internet.sent === 0
      ? 'idle'
      : worse(
          over(f.internet.median, WIFI_LIMITS.internetRtt),
          worse(
            over(f.internet.jitter, WIFI_LIMITS.internetJitter),
            over(f.internet.loss, WIFI_LIMITS.internetLoss),
          ),
        )
  const pc: Health = f.up === null ? 'idle' : ownUploadDrags(f) ? 'warn' : 'ok'
  return { pc, radio, gateway, internet }
}

function ownUploadDrags(f: PathFigures): boolean {
  return f.up !== null && f.up >= WIFI_LIMITS.ownUpload && (f.uploadDrag ?? 0) >= 0.6
}

const ms = (v: number | null): string => (v === null ? '—' : `${Math.round(v)} ms`)
const pct = (v: number): string => `${v < 10 ? v.toFixed(1) : Math.round(v)} %`

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
      evidence: `gateway ${ms(f.gateway.median)}, internet not answering`,
    }
  return judgeSegments(segments, f)
}

function judgeSegments(segments: Diagnosis['segments'], f: PathFigures): Diagnosis {
  const radioWords = (): string =>
    [
      f.rssi === null ? null : `signal ${Math.round(f.rssi)} dBm`,
      f.retry === null ? null : `retries ${pct(f.retry)}`,
    ]
      .filter(Boolean)
      .join(', ')
  const hop = (name: string, s: ProbeStats): string =>
    `${name} ${ms(s.median)} ±${ms(s.jitter).replace(' ms', '')}, loss ${pct(s.loss)}`

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
      () => `${hop('internet', f.internet)}; gateway ${ms(f.gateway.median)}`,
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
      : `internet ${ms(f.internet.median)}, loss ${pct(f.internet.loss)}`,
  }
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
  const lost = p.internet === null && p.gateway !== null && p.state === 'connected'
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

/** Both kinds together, newest first. */
export function mergeEvents(
  log: readonly TrackEvent[],
  derived: readonly TrackEvent[],
): TrackEvent[] {
  return [...log, ...derived].sort((a, b) => b.at - a.at || a.key.localeCompare(b.key))
}

/**
 * Whether moments recur at a steady interval - drops every 30 minutes (a
 * service's session limit), stalls every minute (a background scan). The
 * median gap, when at least three gaps agree with it to within a fifth; null
 * otherwise.
 */
export function regularInterval(times: readonly number[]): number | null {
  const sorted = [...times].sort((a, b) => a - b)
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) gaps.push((sorted[i] ?? 0) - (sorted[i - 1] ?? 0))
  if (gaps.length < 3) return null
  const typical = median([...gaps].sort((a, b) => a - b))
  if (typical === null || typical <= 0) return null
  const agreeing = gaps.filter((g) => Math.abs(g - typical) <= typical * 0.2)
  return agreeing.length >= 3 && agreeing.length >= gaps.length * 0.75 ? typical : null
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
  rssi: Spread | null
  retry: Spread | null
  gateway: Spread | null
  internet: Spread | null
  /** Echoes lost to the internet in the bucket, 0-100. */
  loss: number | null
  up: number | null
  down: number | null
}

export interface Spread {
  min: number
  mid: number
  max: number
}

function spread(values: readonly (number | null | undefined)[]): Spread | null {
  const got = values.filter((v): v is number => typeof v === 'number').sort((a, b) => a - b)
  if (got.length === 0) return null
  return { min: got[0] ?? 0, mid: median(got) ?? 0, max: got[got.length - 1] ?? 0 }
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

/** The point nearest a moment, within a column's width, for the crosshair. */
export function pointAt(
  points: readonly WifiPoint[],
  at: number,
  tolerance: number,
): WifiPoint | null {
  let best: WifiPoint | null = null
  for (const p of points) {
    if (Math.abs(p.at - at) > tolerance) continue
    if (best === null || Math.abs(p.at - at) < Math.abs(best.at - at)) best = p
  }
  return best
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
  return {
    radio,
    radioWide: width >= 460,
    stacked: room >= h.timeline + h.log + h.detail,
  }
}

// ---------------------------------------------------------------------------
// The report the copy button writes
// ---------------------------------------------------------------------------

/** Shows the first and last characters of a name, the rest as dots. */
export function maskName(name: string): string {
  const chars = [...name]
  if (chars.length <= 2) return '•'.repeat(chars.length)
  return `${chars[0]}${'•'.repeat(chars.length - 2)}${chars[chars.length - 1]}`
}

/** An address with its host part hidden: 192.168.1.23 -> 192.168.x.x. */
export function maskAddress(address: string): string {
  if (address.includes('.')) return address.split('.').slice(0, 2).concat('x', 'x').join('.')
  if (address.includes(':')) return `${address.split(':').slice(0, 2).join(':')}:…`
  return '•••'
}

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

const fmtMs = (v: number | null): string => (v === null ? '-' : `${Math.round(v)}ms`)
const stamp = (at: number): string => {
  const d = new Date(at)
  const two = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`
}

function hopLine(name: string, s: ProbeStats): string {
  return `${name.padEnd(9)} median ${fmtMs(s.median)}  jitter ${fmtMs(s.jitter)}  loss ${s.loss.toFixed(1)}% (${s.sent - s.received}/${s.sent})  max ${fmtMs(s.max)}`
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
