import {
  type Health,
  hopHealth,
  internetHealth,
  over,
  ownUploadDrags,
  type ProbeStats,
  roundMs,
  roundPct,
  worse,
} from '../netpath.js'
import { ADDRESS_WAIT_S, ETHER_LIMITS, type EtherFigures, LINK_WINDOW_MS } from './figures.js'
import { speedLabel } from './speed.js'
import type { EtherLink, EtherRoute, PowerKey } from './types.js'

// ---------------------------------------------------------------------------
// Diagnosis
// ---------------------------------------------------------------------------

export type EtherCause =
  | 'ok'
  | 'waiting'
  | 'no-carrier'
  | 'disabled'
  | 'link-lost'
  | 'auth'
  | 'address-conflict'
  | 'no-address'
  | 'sign-in'
  | 'upstream-lost'
  | 'link'
  | 'local'
  | 'own-upload'
  | 'upstream'

export interface EtherDiagnosis {
  cause: EtherCause
  health: Exclude<Health, 'idle'>
  /** The segments of the path, PC -> LINK -> GATEWAY -> INTERNET. */
  segments: { pc: Health; link: Health; gateway: Health; internet: Health }
  /** The figures the cause rests on, short. */
  evidence: string
}

/** CRC errors judged by count and share together. */
export function errorHealth(errors: number, share: number | null): Health {
  const l = ETHER_LIMITS.crc
  if (share === null) return 'ok'
  if (errors >= l.badCount && share >= l.badShare) return 'bad'
  if (errors >= l.warnCount && share >= l.warnShare) return 'warn'
  return 'ok'
}

/**
 * A trouble counter's colour in the detail's table, judged as the link's CRC
 * errors are: by a count and a share together, so one damaged frame on an idle
 * link is not red. Rates are a minute's; the count is taken over the ten minutes
 * the limits are set for. `frames` is the same direction's: errors on the way
 * out against frames sent.
 */
export function counterHealth(perMinute: number, framesPerMinute: number): Health {
  const share = (perMinute / Math.max(1, framesPerMinute)) * 100
  return errorHealth(perMinute * (LINK_WINDOW_MS / 60_000), share)
}

/** The speed and duplex judged: a fall from what this adapter had is a fault; a steady low speed is the other end's. */
export function speedHealth(link: EtherLink, f: EtherFigures): Health {
  if (link.state !== 'up' || f.speed === null) return 'idle'
  if (f.speed <= 10 || link.duplex === 'half') return 'bad'
  if (f.bestSeen !== null && f.speed < f.bestSeen) return 'warn'
  return 'ok'
}

export type SpeedGrade = 'BEST' | 'BELOW MAX' | 'DOWNSHIFTED' | 'HALF DUPLEX' | 'SLOW' | ''

/** The word under the speed, as the Wi-Fi gauge says GOOD under the signal. */
export function speedGrade(link: EtherLink, f: EtherFigures): SpeedGrade {
  if (link.state !== 'up' || f.speed === null) return ''
  if (link.duplex === 'half') return 'HALF DUPLEX'
  if (f.speed <= 10) return 'SLOW'
  if (f.bestSeen !== null && f.speed < f.bestSeen) return 'DOWNSHIFTED'
  const cap = link.settings?.capMbps ?? null
  return cap !== null && f.speed < cap ? 'BELOW MAX' : 'BEST'
}

/** The power-saving settings that are on. */
export function powerOn(link: EtherLink | null): PowerKey[] {
  const power = link?.settings?.power ?? {}
  return (Object.keys(power) as PowerKey[]).filter((k) => power[k] === true)
}

/**
 * Whether to name power saving: on, the speed negotiated, and a drop or a fall in
 * speed seen - never on a quiet link, which it would only worry.
 */
export function powerSuspect(link: EtherLink | null, f: EtherFigures): boolean {
  if (link === null || powerOn(link).length === 0) return false
  if (link.settings !== null && link.settings.speed !== null) return false
  const fell = f.speed !== null && f.bestSeen !== null && f.speed < f.bestSeen
  return f.drops > 0 || fell
}

/** The link's health and the words for it. */
export function linkJudgement(link: EtherLink, f: EtherFigures): { health: Health; why: string[] } {
  const why: string[] = []
  let health: Health = 'ok'
  const add = (h: Health, words: string): void => {
    if (h !== 'warn' && h !== 'bad') return
    health = worse(health, h)
    why.push(words)
  }
  const speed = speedHealth(link, f)
  add(
    speed,
    link.duplex === 'half'
      ? 'half duplex'
      : (f.speed ?? 0) <= 10
        ? `linked at ${speedLabel(f.speed)}`
        : `fell to ${speedLabel(f.speed)} from ${speedLabel(f.bestSeen)}`,
  )
  const fixed =
    link.settings !== null && (link.settings.speed !== null || link.settings.duplex !== null)
  add(
    errorHealth(f.errors, f.errorShare),
    `CRC errors ${(f.errorShare ?? 0).toFixed(2)}%, ${f.errors} in 10 min${fixed ? '; set by hand here: the other end may be at half duplex' : ''}`,
  )
  add(
    over(f.drops, ETHER_LIMITS.drops),
    `${f.drops} drops in 10 min${powerSuspect(link, f) ? ', power saving on' : ''}`,
  )
  add(
    f.broadcast === null ? 'idle' : over(f.broadcast, ETHER_LIMITS.broadcast),
    `broadcast ${Math.round(f.broadcast ?? 0).toLocaleString('en')}/s${f.gateway.loss >= ETHER_LIMITS.gatewayLoss.warn ? ' with the gateway losing echoes: a loop?' : ''}`,
  )
  add(link.usbMbps === 480 && f.usbPlateau ? 'warn' : 'ok', 'USB 2.0 port holds it near 300 Mb/s')
  return { health, why }
}

function segmentsOf(link: EtherLink, f: EtherFigures): EtherDiagnosis['segments'] {
  // A gateway that never answers is one that does not answer pings, not a lossy hop.
  const gatewaySilent = f.gateway.sent > 0 && f.gateway.received === 0
  return {
    pc: f.up === null ? 'idle' : ownUploadDrags(f.up, f.uploadDrag) ? 'warn' : 'ok',
    link: linkJudgement(link, f).health,
    gateway: gatewaySilent
      ? 'idle'
      : hopHealth(f.gateway, {
          rtt: ETHER_LIMITS.gatewayRtt,
          jitter: ETHER_LIMITS.gatewayJitter,
          loss: ETHER_LIMITS.gatewayLoss,
        }),
    internet: link.route === 'default' ? internetHealth(f.internet) : 'idle',
  }
}

const DARK = { pc: 'idle', link: 'idle', gateway: 'idle', internet: 'idle' } as const

/** What stops the judging before any segment is looked at. */
function stopped(link: EtherLink | null, f: EtherFigures): EtherDiagnosis | null {
  const down = { ...DARK, pc: 'ok', link: 'bad' } as const
  if (link === null)
    return { cause: 'waiting', health: 'warn', segments: DARK, evidence: 'no wired adapter' }
  if (link.state === 'disabled')
    return {
      cause: 'disabled',
      health: 'warn',
      segments: DARK,
      evidence: 'the adapter is switched off',
    }
  if (link.state === 'no-carrier')
    return f.drops > 0
      ? {
          cause: 'link-lost',
          health: 'bad',
          segments: down,
          evidence: `the link dropped just now; ${f.drops} drops in 10 min`,
        }
      : {
          cause: 'no-carrier',
          health: 'bad',
          segments: down,
          evidence: 'no cable, or nothing at its other end',
        }
  if (link.authenticated === false)
    return {
      cause: 'auth',
      health: 'bad',
      segments: down,
      evidence: `link up at ${speedLabel(f.speed)}, 802.1X not authenticated yet`,
    }
  const conflict = recentConflict(link, f.now)
  if (conflict !== null)
    return {
      cause: 'address-conflict',
      health: 'bad',
      segments: down,
      // Never the address itself: the verdict is drawn, carded and copied whatever MASK says.
      evidence: `another machine claimed this adapter’s address ${Math.max(1, Math.round((f.now - conflict) / 60_000))} min ago`,
    }
  if (link.ip4 === null && link.ip6.length === 0) return noAddress(f)
  return null
}

/** How long an address conflict stays the verdict: as long as a drop counts. */
export const CONFLICT_WINDOW_MS = LINK_WINDOW_MS

/** The latest address conflict logged for this adapter within the window, or null. */
export function recentConflict(link: EtherLink, now: number): number | null {
  const recent = link.conflicts.filter((at) => at <= now && now - at <= CONFLICT_WINDOW_MS)
  return recent.length === 0 ? null : Math.max(...recent)
}

function noAddress(f: EtherFigures): EtherDiagnosis {
  const waiting = f.upFor !== null && f.upFor < ADDRESS_WAIT_S
  return waiting
    ? {
        cause: 'waiting',
        health: 'ok',
        segments: { ...DARK, pc: 'ok', link: 'ok' },
        evidence: `link up ${Math.round(f.upFor ?? 0)} s, waiting for an address`,
      }
    : {
        cause: 'no-address',
        health: 'bad',
        segments: { ...DARK, pc: 'ok', link: 'bad' },
        evidence:
          'link up, no address: no DHCP answer, or the adapter is bridged to a virtual switch',
      }
}

/**
 * Where the trouble is, from the last minute of echoes and the last ten of the
 * link's counters.
 *
 * In order: nothing to judge (no adapter, switched off, no carrier, waiting for
 * 802.1X or an address), a sign-in page, the way out gone while the gateway
 * answers, then the segments from the machine outwards as the Wi-Fi pane walks
 * them: every bad one nearest first, then every warning one - trouble near the
 * machine shows again at every hop after it.
 */
export function diagnoseEthernet(link: EtherLink | null, f: EtherFigures): EtherDiagnosis {
  const stop = stopped(link, f)
  if (stop !== null || link === null) return stop ?? (stopped(null, f) as EtherDiagnosis)
  const segments = segmentsOf(link, f)
  if (link.internet === 'constrained')
    return { cause: 'sign-in', health: 'bad', segments, evidence: 'the network wants a sign-in' }
  if (f.upstreamGone && link.route === 'default')
    return {
      cause: 'upstream-lost',
      health: 'bad',
      segments: { ...segments, internet: 'bad' },
      evidence: `gateway ${roundMs(f.gateway.median)}, internet not answering`,
    }
  return judgeSegments(link, segments, f)
}

function hop(name: string, s: ProbeStats): string {
  return `${name} ${roundMs(s.median)} ±${s.jitter === null ? '—' : Math.round(s.jitter)}, loss ${roundPct(s.loss)}`
}

function judgeSegments(
  link: EtherLink,
  segments: EtherDiagnosis['segments'],
  f: EtherFigures,
): EtherDiagnosis {
  const ordered: [keyof EtherDiagnosis['segments'], EtherCause, () => string][] = [
    ['link', 'link', () => linkJudgement(link, f).why.join('; ')],
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
  const beyond = internetWords(link.route, f)
  return {
    segments,
    cause: quiet ? 'waiting' : 'ok',
    health: 'ok',
    evidence: quiet ? 'measuring…' : `${beyond}; gateway ${roundMs(f.gateway.median)}`,
  }
}

/**
 * What the verdict says of the internet. By this adapter it is judged; by another
 * it is that one's; with no way out known it is not judged either - "route
 * unknown" while echoes still come back (Windows' GetBestInterface can fail for
 * a moment), "no default route" when nothing does.
 */
export function internetWords(route: EtherRoute | null, f: EtherFigures): string {
  if (route === 'default')
    return `internet ${roundMs(f.internet.median)}, loss ${roundPct(f.internet.loss)}`
  if (route !== null) return `internet by ${routeWord(route)}, not judged here`
  return f.internet.received > 0
    ? `route unknown, internet ${roundMs(f.internet.median)} not judged`
    : 'no default route on this machine'
}

/**
 * "Wi-Fi", "a VPN": what carries the internet's echo when this adapter does not.
 * With no way out known it is "unknown", never this adapter: the route's row and
 * the copied report would otherwise claim a way out the machine does not have.
 */
export function routeWord(route: EtherRoute | null): string {
  switch (route) {
    case 'default':
      return 'this adapter'
    case 'wifi':
      return 'Wi-Fi'
    case 'vpn':
      return 'VPN'
    case 'other':
      return 'another adapter'
    case null:
      return 'unknown'
  }
}

/** A station on the path. */
export type EtherStation = 'pc' | 'link' | 'gateway' | 'internet'

const CULPRITS: Partial<Record<EtherCause, EtherStation>> = {
  'no-carrier': 'link',
  'link-lost': 'link',
  auth: 'link',
  'address-conflict': 'link',
  'no-address': 'link',
  link: 'link',
  local: 'gateway',
  'own-upload': 'pc',
  upstream: 'internet',
  'upstream-lost': 'internet',
  'sign-in': 'internet',
}

/** The station a diagnosis blames, or null when all is well. */
export function etherCulprit(d: EtherDiagnosis): EtherStation | null {
  return d.health === 'ok' ? null : (CULPRITS[d.cause] ?? null)
}

/** What each cause is called on screen: the Wi-Fi pane's words where they mean the same. */
export const ETHER_CAUSE_LABELS: Record<EtherCause, string> = {
  ok: 'CLEAR',
  waiting: 'STANDBY',
  'no-carrier': 'NO CARRIER',
  disabled: 'DISABLED',
  'link-lost': 'LINK LOST',
  auth: 'AUTH',
  'address-conflict': 'ADDRESS CONFLICT',
  'no-address': 'NO ADDRESS',
  'sign-in': 'SIGN-IN NEEDED',
  'upstream-lost': 'UPSTREAM LOST',
  link: 'LINK',
  local: 'LOCAL LINK',
  'own-upload': 'OWN UPLOAD',
  upstream: 'UPSTREAM',
}
