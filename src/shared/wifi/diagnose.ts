import {
  correlation,
  DIAGNOSIS_WINDOW_MS,
  GONE_AFTER,
  type Health,
  hopHealth,
  internetHealth,
  meanOf,
  over,
  ownUploadDrags,
  PATH_LIMITS,
  type ProbeStats,
  probeStats,
  roundMs,
  roundPct,
  under,
  worse,
} from '../netpath.js'
import { RETRY_FRAMES_PER_SECOND, retryShare, type WifiPoint } from './points.js'
import type { WifiLink } from './types.js'

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
