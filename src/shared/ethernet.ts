import {
  columnsOf,
  correlation,
  DIAGNOSIS_WINDOW_MS,
  GONE_AFTER,
  gatewayEcho,
  type Health,
  hopHealth,
  hopLine,
  internetHealth,
  maskAddress,
  meanOf,
  median,
  over,
  ownUploadDrags,
  PATH_LIMITS,
  type PathInternet,
  type PathProbe,
  type ProbeStats,
  probeStats,
  roundMs,
  roundPct,
  type Spread,
  spread,
  stamp,
  worse,
} from './netpath.js'

/**
 * The Ethernet pane's readings, and every decision made about them
 * (architecture.md §5.23).
 *
 * The wired sibling of the Wi-Fi pane: the same path - this machine, the link,
 * the gateway, the internet - with the cable and its two ports where the Wi-Fi
 * pane has the radio. A wired fault rarely stops traffic; it slows it: a link
 * that fell from 1 Gb/s to 100 Mb/s (a damaged pair), CRC errors (a worn cable,
 * a bad connector), a duplex mismatch, a link that sleeps every few minutes
 * (power saving), a broadcast storm (a loop between switch ports).
 *
 * Nothing here reads anything. Everything below the types is pure, so the
 * judgements are unit-tested on their own (tests/unit/ethernet.test.ts).
 */

// ---------------------------------------------------------------------------
// Readings
// ---------------------------------------------------------------------------

/**
 * How the port stands. `no-carrier` is no cable, or nothing at its other end;
 * `disabled` is the adapter turned off by the user - not a fault, and not a drop.
 */
export type EtherState = 'up' | 'no-carrier' | 'disabled'

export type EtherBus = 'pci' | 'usb' | 'thunderbolt' | 'other'

export type Duplex = 'full' | 'half'

/** Driver settings that lower the speed or sleep the link when idle, by what they do. */
export type PowerKey =
  | 'eee'
  | 'advancedEee'
  | 'green'
  | 'gigaLite'
  | 'powerSave'
  | 'autoDisableGigabit'
  | 'reduceSpeed'

export const POWER_LABELS: Record<PowerKey, string> = {
  eee: 'EEE',
  advancedEee: 'ADV EEE',
  green: 'GREEN',
  gigaLite: 'GIGA LITE',
  powerSave: 'POWER SAVE',
  autoDisableGigabit: 'AUTO 100M',
  reduceSpeed: 'REDUCE SPEED',
}

/**
 * What the driver is set to, read when the pane opens and whenever the link
 * comes up - never changed. Null fields are settings this driver does not have.
 */
export interface EtherSettings {
  /** A speed fixed by hand, Mb/s; null when the adapter negotiates. */
  speed: number | null
  /** A duplex fixed by hand; null when negotiated. */
  duplex: Duplex | null
  /** The fastest speed the driver offers: the adapter's own best. */
  capMbps: number | null
  power: Partial<Record<PowerKey, boolean>>
  /** The jumbo frame size in bytes when on, 0 when off. */
  jumbo: number | null
  flow: boolean | null
  vlan: number | null
  wol: boolean | null
}

/**
 * Counters since the adapter came up. A null is one this driver or platform does
 * not keep: shown as a dash, never as a zero.
 */
export interface EtherCounters {
  rxPackets: number | null
  txPackets: number | null
  /** Broadcast and multicast together (Windows' non-unicast). */
  rxNonUnicast: number | null
  /** Bytes received in broadcast frames: Windows counts broadcast only by bytes. */
  rxBroadcastOctets: number | null
  /** Multicast frames, where the platform counts them apart (Linux). */
  rxMulticast: number | null
  /** Frames received damaged: CRC, framing, length. What the cable is judged by. */
  rxErrors: number | null
  txErrors: number | null
  /** Frames this machine dropped itself (full rings, filters): its own doing, not the cable's. */
  rxDiscards: number | null
  txDiscards: number | null
  rxUnknown: number | null
  /** Collisions: none can happen on full duplex, so any is a mismatch (Linux). */
  collisions: number | null
}

/** Which way the internet's echo leaves, when it is not by this adapter. */
export type EtherRoute = 'default' | 'wifi' | 'vpn' | 'other'

export interface EtherLink {
  /** The interface: `if<index>` on Windows, its name elsewhere. Never a GUID or a path. */
  id: string
  /** The adapter, e.g. "Realtek Gaming GbE Family Controller". */
  adapter: string
  /** The system's name for it: "Ethernet", "eth0". */
  alias: string | null
  bus: EtherBus | null
  /** e.g. "PCIe 2.5 GT/s x1", "USB 5 Gb/s". */
  busDetail: string | null
  /** The USB port's own speed, Mb/s, where the platform tells it (Linux): 480 is USB 2.0. */
  usbMbps: number | null
  driver: string | null
  state: EtherState
  /** The negotiated speed, Mb/s; null while down. */
  speedMbps: number | null
  /** Null while down, or where the platform does not say. */
  duplex: Duplex | null
  /** False while 802.1X has not let the port through; null where not known. */
  authenticated: boolean | null
  settings: EtherSettings | null
  internet: PathInternet | null
  /** Whether the internet's echo leaves by this adapter, and if not, by what. */
  route: EtherRoute | null
  mac: string | null
  ip4: string | null
  prefix4: number | null
  ip6: string[]
  gateway: string | null
  dns: string[]
  mtu: number | null
  dhcp: boolean | null
  leaseSeconds: number | null
  /** Bytes per second through this adapter since the reading before. */
  rxSec: number | null
  txSec: number | null
  counters: EtherCounters | null
  /**
   * Times the link went down, counted by the system: since boot on Linux, since the
   * pane began to watch on Windows (NDIS's events). A rise between two readings
   * that both found the link up is a drop inside a second.
   */
  carrierDowns: number | null
  /** When the system logged another machine claiming this adapter's address, the last day, epoch ms. */
  conflicts: number[]
}

/** Something the platform will not tell, so the pane says so rather than show a dash. */
export type EtherLimit = 'no-log' | 'no-capability' | 'no-broadcast' | 'no-settings'

export interface NetEthernet {
  links: EtherLink[]
  /** The echo round, shared with the Wi-Fi and network status panes. */
  probe: PathProbe | null
  limits: EtherLimit[]
  /**
   * What went wrong while reading, in the reader's words, each said once: the pane
   * shows it as a toast, so a fault on a machine nobody here has tried reaches
   * whoever can report it.
   */
  problems: string[]
}

// ---------------------------------------------------------------------------
// Speeds
// ---------------------------------------------------------------------------

/** The steps of the speed ladder, Mb/s; 500 is Realtek's Gigabit Lite. */
export const SPEED_STEPS = [10, 100, 500, 1000, 2500, 5000, 10000] as const

/** "1 Gb/s", "100 Mb/s", "2.5 Gb/s". */
export function speedLabel(mbps: number | null): string {
  if (mbps === null) return '—'
  if (mbps >= 1000) return `${+(mbps / 1000).toFixed(1)} Gb/s`
  return `${Math.round(mbps)} Mb/s`
}

/** The ladder's short word for a speed: "1G", "100M". */
export function speedWord(mbps: number | null): string {
  if (mbps === null) return '—'
  if (mbps >= 1000) return `${+(mbps / 1000).toFixed(1)}G`
  return `${Math.round(mbps)}M`
}

/** The copper standard of a speed. */
export function standardOf(mbps: number | null): string {
  switch (mbps) {
    case 10:
      return '10BASE-T'
    case 100:
      return '100BASE-TX'
    case 500:
      return '1000BASE-T at 500M'
    case 1000:
      return '1000BASE-T'
    case 2500:
      return '2.5GBASE-T'
    case 5000:
      return '5GBASE-T'
    case 10000:
      return '10GBASE-T'
    default:
      return mbps === null ? '—' : speedLabel(mbps)
  }
}

/** The step a speed lights up to: the highest step not above it (an odd speed lights the one below). */
export function stepIndex(mbps: number | null): number {
  if (mbps === null) return -1
  let index = -1
  SPEED_STEPS.forEach((s, i) => {
    if (s <= mbps) index = i
  })
  return index
}

// ---------------------------------------------------------------------------
// History: one point a second while the pane is seen
// ---------------------------------------------------------------------------

/** What the timeline draws for a second. Null where nothing was read. */
export interface EtherPoint {
  at: number
  state: EtherState | null
  speed: number | null
  duplex: Duplex | null
  /** Bytes per second. */
  up: number | null
  down: number | null
  /** Frames received this second. */
  rxPackets: number | null
  /** Frames received damaged this second. */
  errors: number | null
  /** Broadcast frames received a second (from bytes on Windows: an estimate on the high side). */
  broadcast: number | null
  multicast: number | null
  /** Round trips; null a lost echo; undefined when not asked (no gateway, no probe). */
  gateway: number | null | undefined
  internet: number | null | undefined
  internetState: PathInternet | null
  route: EtherRoute | null
  carrierDowns: number | null
}

/**
 * Bytes of a broadcast frame, for the count Windows does not keep: an ARP request,
 * the commonest broadcast, is the smallest frame there is, so the estimate errs high.
 */
export const BROADCAST_FRAME_BYTES = 60

/** A counter's increase a second; null across a reset, with no baseline, or where it is not kept. */
function perSecond(
  now: number | null | undefined,
  then: number | null | undefined,
  seconds: number,
): number | null {
  if (now == null || then == null || seconds <= 0 || now < then) return null
  return (now - then) / seconds
}

function counterPart(
  link: EtherLink,
  previous: EtherLink | null,
  seconds: number,
): Pick<EtherPoint, 'rxPackets' | 'errors' | 'broadcast' | 'multicast'> {
  const c = link.counters
  const b = previous?.id === link.id ? previous.counters : null
  if (c === null || b === null)
    return { rxPackets: null, errors: null, broadcast: null, multicast: null }
  const nonUnicast = perSecond(c.rxNonUnicast, b.rxNonUnicast, seconds)
  const broadcastBytes = perSecond(c.rxBroadcastOctets, b.rxBroadcastOctets, seconds)
  const broadcast = broadcastBytes === null ? null : broadcastBytes / BROADCAST_FRAME_BYTES
  const multicast =
    c.rxMulticast !== null
      ? perSecond(c.rxMulticast, b.rxMulticast, seconds)
      : nonUnicast === null
        ? null
        : Math.max(0, nonUnicast - (broadcast ?? 0))
  return {
    rxPackets: perSecond(c.rxPackets, b.rxPackets, seconds),
    errors: perSecond(c.rxErrors, b.rxErrors, seconds),
    broadcast:
      broadcast === null || nonUnicast === null ? broadcast : Math.min(broadcast, nonUnicast),
    multicast,
  }
}

const NO_POINT: Omit<EtherPoint, 'at'> = {
  state: null,
  speed: null,
  duplex: null,
  up: null,
  down: null,
  rxPackets: null,
  errors: null,
  broadcast: null,
  multicast: null,
  gateway: undefined,
  internet: undefined,
  internetState: null,
  route: null,
  carrierDowns: null,
}

/** The second a reading stands for, from the probe round or the sample. */
export function toEtherPoint(
  link: EtherLink | null,
  probe: PathProbe | null,
  at: number,
  previous: { link: EtherLink; at: number } | null,
): EtherPoint {
  if (link === null) return { ...NO_POINT, at }
  const seconds = previous === null ? 0 : (at - previous.at) / 1000
  const base = {
    ...NO_POINT,
    at,
    state: link.state,
    up: link.txSec,
    down: link.rxSec,
    internetState: link.internet,
    route: link.route,
    carrierDowns: link.carrierDowns,
  }
  if (link.state !== 'up') return base
  return {
    ...base,
    speed: link.speedMbps,
    duplex: link.duplex,
    ...counterPart(link, previous?.link ?? null, seconds),
    gateway: gatewayEcho(probe, link.id),
    internet: probe !== null && link.route === 'default' ? probe.internet : undefined,
  }
}

// ---------------------------------------------------------------------------
// Diagnosis
// ---------------------------------------------------------------------------

/**
 * The limits a wired path is judged by. The gateway's are tighter than Wi-Fi's
 * on delay and looser on jitter and loss: a router one cable away answers within
 * a millisecond or two, but home routers answer pings from a busy processor and
 * thin them out. CRC errors need a count as well as a share, so one damaged frame
 * among a thousand is never a fault. Tuned in one place, quoted by the cards.
 */
export const ETHER_LIMITS = {
  gatewayRtt: { warn: 5, bad: 20 },
  gatewayJitter: { warn: 5, bad: 15 },
  gatewayLoss: { warn: 3, bad: 10 },
  crc: { warnCount: 5, warnShare: 0.01, badCount: 20, badShare: 0.1 },
  drops: { warn: 2, bad: 4 },
  broadcast: { warn: 300, bad: 3000 },
  ...PATH_LIMITS,
} as const

/** How far back the link's counters are judged: errors and drops are rare, so a minute is too short. */
export const LINK_WINDOW_MS = 600_000
/** A drop is the link down and back within this; longer is unplugging, docking or sleep. */
export const DROP_MAX_MS = 60_000
/** Seconds of broadcast whose median is judged, so a ten-second network scan does not count. */
export const BROADCAST_SECONDS = 30
/** Seconds a link may be up without an address before it is a fault: a switch port's spanning tree. */
export const ADDRESS_WAIT_S = 45
/** A USB adapter's traffic flat in this band, for this long, looks like a USB 2.0 port. */
export const USB2_PLATEAU = { lowMbps: 250, highMbps: 350, seconds: 20, within: 0.05 }

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

/** Figures the diagnosis, the panel and the cards share. */
export interface EtherFigures {
  gateway: ProbeStats
  internet: ProbeStats
  up: number | null
  down: number | null
  uploadDrag: number | null
  upstreamGone: boolean
  /** Damaged frames and frames received over the last ten minutes. */
  errors: number
  packets: number
  /** Errors as a share of packets, percent; null with no packets. */
  errorShare: number | null
  /** Drops over the last ten minutes, and when each began. */
  drops: number
  dropTimes: number[]
  /** Broadcast frames a second, the median of the last half minute; null where not counted. */
  broadcast: number | null
  multicast: number | null
  /** The speed now, and the best this adapter has had while the pane watched it. */
  speed: number | null
  bestSeen: number | null
  /** Seconds since the link last came up; null while down. */
  upFor: number | null
  /** Traffic flat where a USB 2.0 port would hold it. */
  usbPlateau: boolean
  /** The moment the figures were taken at, epoch ms. */
  now: number
}

const isUp = (p: EtherPoint): boolean => p.state === 'up'

/**
 * Drops the second-by-second reading could not see: the system's count of the link
 * going down rose between two readings that both found it up - down and back
 * inside a second.
 */
export function quickDrops(previous: EtherPoint, p: EtherPoint): number {
  if (!isUp(previous) || !isUp(p) || previous.carrierDowns === null || p.carrierDowns === null)
    return 0
  return Math.max(0, p.carrierDowns - previous.carrierDowns)
}

/** A drop the readings saw: when it began, and its start kept once it ended in time. */
function seenDrop(
  previous: EtherPoint | null,
  p: EtherPoint,
  downAt: number | null,
  starts: number[],
): number | null {
  if (previous !== null && isUp(previous) && p.state === 'no-carrier') return p.at
  if (downAt !== null && isUp(p)) {
    if (p.at - downAt <= DROP_MAX_MS) starts.push(downAt)
    return null
  }
  return downAt
}

/**
 * The readings that end a drop inside a second: the system counted one since the
 * reading before. Not across a gap in the watching, where a rise is the drops
 * while not watched (`unseen`), as `dropsIn` counts it.
 */
export function quickDropPoints(points: readonly EtherPoint[]): Set<EtherPoint> {
  const out = new Set<EtherPoint>()
  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1] as EtherPoint
    const p = points[i] as EtherPoint
    if (p.at - previous.at <= 5000 && quickDrops(previous, p) > 0) out.add(p)
  }
  return out
}

/**
 * Drops in the stretch: the link down and back within a minute, the adapter not
 * switched off - those the readings saw, and those inside a second that only the
 * system's count saw.
 */
export function dropsIn(points: readonly EtherPoint[]): number[] {
  const starts: number[] = []
  let downAt: number | null = null
  let previous: EtherPoint | null = null
  for (const p of points) {
    const gap = previous !== null && p.at - previous.at > 5000
    downAt = gap ? null : seenDrop(previous, p, downAt, starts)
    if (previous !== null && !gap)
      for (let i = quickDrops(previous, p); i > 0; i--) starts.push(p.at)
    previous = p
  }
  // Down now and for less than a drop's length: it counts already.
  const last = points[points.length - 1]
  if (downAt !== null && last !== undefined && last.at - downAt <= DROP_MAX_MS) starts.push(downAt)
  return starts
}

/** Seconds since the link last came up, or null while it is down. */
function upSince(points: readonly EtherPoint[]): number | null {
  const last = points[points.length - 1]
  if (last === undefined || !isUp(last)) return null
  let first = last
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i]
    if (p === undefined || !isUp(p)) break
    const next = points[i + 1]
    if (next !== undefined && next.at - p.at > 5000) break
    first = p
  }
  return (last.at - first.at) / 1000
}

/** Whether a USB adapter's traffic sat flat in USB 2.0's band for long enough. */
export function usbPlateau(points: readonly EtherPoint[]): boolean {
  const tail = points.slice(-USB2_PLATEAU.seconds)
  if (tail.length < USB2_PLATEAU.seconds) return false
  const mbps = tail.map((p) => ((p.down ?? 0) * 8) / 1e6)
  const mid = median([...mbps].sort((a, b) => a - b))
  if (mid === null || mid < USB2_PLATEAU.lowMbps || mid > USB2_PLATEAU.highMbps) return false
  return mbps.every((v) => Math.abs(v - mid) <= mid * USB2_PLATEAU.within)
}

function sum(values: readonly (number | null)[]): number {
  return values.reduce<number>((a, v) => a + (v ?? 0), 0)
}

function medianOf(values: readonly (number | null)[]): number | null {
  const got = values.filter((v): v is number => v !== null).sort((a, b) => a - b)
  return median(got)
}

export function etherFigures(
  points: readonly EtherPoint[],
  now: number,
  bestSeen: number | null,
  span = DIAGNOSIS_WINDOW_MS,
): EtherFigures {
  // Echoes while the link was down blame the link, so they stay out of the hops' figures.
  const recent = points.filter((p) => p.at > now - span && p.at <= now && isUp(p))
  const tail = points.filter((p) => p.at <= now).slice(-GONE_AFTER)
  const upstreamGone =
    tail.length === GONE_AFTER &&
    tail.every((p) => isUp(p) && p.internet === null && typeof p.gateway === 'number')
  const ten = points.filter((p) => p.at > now - LINK_WINDOW_MS && p.at <= now)
  // Counted a second at a time from counters a second apart: whole frames over the ten minutes.
  const errors = Math.round(sum(ten.map((p) => p.errors)))
  const packets = Math.round(sum(ten.map((p) => p.rxPackets)))
  const lately = ten.filter(isUp).slice(-BROADCAST_SECONDS)
  const dropTimes = dropsIn(ten)
  const last = points[points.length - 1]
  return {
    gateway: probeStats(recent.map((p) => p.gateway)),
    internet: probeStats(recent.map((p) => p.internet)),
    up: meanOf(recent.slice(-5).map((p) => p.up)),
    down: meanOf(recent.slice(-5).map((p) => p.down)),
    uploadDrag: correlation(
      recent
        .filter((p) => p.up !== null && typeof p.internet === 'number')
        .map((p) => [p.up as number, p.internet as number] as const),
    ),
    upstreamGone,
    errors,
    packets,
    errorShare: packets > 0 ? (errors / packets) * 100 : null,
    drops: dropTimes.length,
    dropTimes,
    broadcast:
      lately.length < BROADCAST_SECONDS / 2 ? null : medianOf(lately.map((p) => p.broadcast)),
    multicast: medianOf(lately.map((p) => p.multicast)),
    speed: last !== undefined && isUp(last) ? last.speed : null,
    bestSeen,
    upFor: upSince(points),
    usbPlateau: usbPlateau(recent),
    now,
  }
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
  const beyond =
    link.route === 'default'
      ? `internet ${roundMs(f.internet.median)}, loss ${roundPct(f.internet.loss)}`
      : `internet by ${routeWord(link.route)}, not judged here`
  return {
    segments,
    cause: quiet ? 'waiting' : 'ok',
    health: 'ok',
    evidence: quiet ? 'measuring…' : `${beyond}; gateway ${roundMs(f.gateway.median)}`,
  }
}

/** "Wi-Fi", "a VPN": what carries the internet's echo when this adapter does not. */
export function routeWord(route: EtherRoute | null): string {
  switch (route) {
    case 'wifi':
      return 'Wi-Fi'
    case 'vpn':
      return 'VPN'
    case 'other':
      return 'another adapter'
    default:
      return 'this adapter'
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

// ---------------------------------------------------------------------------
// Events: what the history shows happening
// ---------------------------------------------------------------------------

export type EtherEventKind =
  | 'connected'
  | 'link-lost'
  | 'speed'
  | 'duplex'
  | 'upstream-lost'
  | 'upstream-back'
  | 'sign-in'
  | 'crc'
  | 'broadcast'
  | 'unseen'
  | 'conflict'

/** A mark on the timeline and a row in the log. */
export interface EtherEvent {
  key: string
  at: number
  kind: EtherEventKind
  detail: string
  /** Seconds the link was down, for a drop the pane saw end. */
  downFor: number | null
}

const event = (
  at: number,
  kind: EtherEventKind,
  detail: string,
  downFor: number | null = null,
): EtherEvent => ({
  key: `${kind}:${at}`,
  at,
  kind,
  detail,
  downFor,
})

interface Walk {
  lostRun: number
  gone: boolean
  downAt: number | null
  errorsMinute: number[]
  crcOn: boolean
  broadcast: number[]
  stormOn: boolean
}

const fresh = (): Walk => ({
  lostRun: 0,
  gone: false,
  downAt: null,
  errorsMinute: [],
  crcOn: false,
  broadcast: [],
  stormOn: false,
})

/**
 * What the history shows happening: the link going and coming back, its speed or
 * duplex changing, the way out going and coming back, a sign-in page, CRC errors
 * beginning, a broadcast flood beginning - and, where the platform counts the
 * link's drops (Linux), the ones that happened while the pane was not looking.
 * Nothing is claimed across a gap otherwise. Newest first.
 */
export function etherEvents(points: readonly EtherPoint[]): EtherEvent[] {
  const out: EtherEvent[] = []
  let walk = fresh()
  let previous: EtherPoint | null = null
  for (const p of points) {
    if (previous !== null && p.at - previous.at > 5000) {
      out.push(...unseen(previous, p))
      walk = fresh()
    } else if (previous !== null) {
      out.push(...linkChanges(walk, previous, p), ...wayOut(walk, p), ...counted(walk, p))
    }
    previous = p
  }
  return out.sort((a, b) => b.at - a.at || a.key.localeCompare(b.key))
}

function unseen(before: EtherPoint, after: EtherPoint): EtherEvent[] {
  if (before.carrierDowns === null || after.carrierDowns === null) return []
  const n = after.carrierDowns - before.carrierDowns
  return n > 0
    ? [event(after.at, 'unseen', `${n} drop${n === 1 ? '' : 's'} while not watched`)]
    : []
}

/** What changed while the link stayed up: a drop inside a second, the speed, the duplex. */
function whileUp(a: EtherPoint, b: EtherPoint): EtherEvent[] {
  const out: EtherEvent[] = []
  const quick = quickDrops(a, b)
  if (quick > 0) {
    const times = quick > 1 ? ` (${quick} times)` : ''
    out.push(event(b.at, 'link-lost', `down and back inside a second${times}`, 0))
  }
  if (!isUp(a) || !isUp(b)) return out
  if (a.speed !== null && b.speed !== null && a.speed !== b.speed)
    out.push(event(b.at, 'speed', `${speedLabel(a.speed)} → ${speedLabel(b.speed)}`))
  if (a.duplex !== null && b.duplex !== null && a.duplex !== b.duplex)
    out.push(event(b.at, 'duplex', `${a.duplex} → ${b.duplex}`))
  return out
}

function linkChanges(walk: Walk, a: EtherPoint, b: EtherPoint): EtherEvent[] {
  const out: EtherEvent[] = []
  if (isUp(a) && b.state === 'no-carrier') {
    walk.downAt = b.at
    out.push(event(b.at, 'link-lost', 'nothing at the other end of the cable'))
  }
  if (!isUp(a) && isUp(b)) {
    const downFor = walk.downAt === null ? null : Math.round((b.at - walk.downAt) / 1000)
    walk.downAt = null
    out.push(event(b.at, 'connected', `${speedLabel(b.speed)} ${b.duplex ?? ''}`.trim(), downFor))
  }
  out.push(...whileUp(a, b))
  if (b.internetState === 'constrained' && a.internetState !== 'constrained')
    out.push(event(b.at, 'sign-in', 'captive portal'))
  return out
}

function wayOut(walk: Walk, p: EtherPoint): EtherEvent[] {
  const lost = isUp(p) && p.internet === null && typeof p.gateway === 'number'
  walk.lostRun = lost ? walk.lostRun + 1 : 0
  if (!walk.gone && walk.lostRun === GONE_AFTER) {
    walk.gone = true
    return [event(p.at - (GONE_AFTER - 1) * 1000, 'upstream-lost', 'gateway up, internet silent')]
  }
  if (walk.gone && typeof p.internet === 'number') {
    walk.gone = false
    return [event(p.at, 'upstream-back', `internet ${roundMs(p.internet)}`)]
  }
  return []
}

/** CRC errors and broadcast floods beginning, judged as the diagnosis judges them, over a sliding window. */
function counted(walk: Walk, p: EtherPoint): EtherEvent[] {
  const out: EtherEvent[] = []
  walk.errorsMinute.push(p.errors ?? 0)
  if (walk.errorsMinute.length > 60) walk.errorsMinute.shift()
  const minute = walk.errorsMinute.reduce((a, b) => a + b, 0)
  const crcNow = minute >= ETHER_LIMITS.crc.warnCount
  if (crcNow && !walk.crcOn) out.push(event(p.at, 'crc', `${minute} damaged frames in a minute`))
  walk.crcOn = crcNow
  if (p.broadcast !== null) walk.broadcast.push(p.broadcast)
  if (walk.broadcast.length > BROADCAST_SECONDS) walk.broadcast.shift()
  const level = walk.broadcast.length === BROADCAST_SECONDS ? medianOf(walk.broadcast) : null
  const stormNow = level !== null && level >= ETHER_LIMITS.broadcast.warn
  if (stormNow && !walk.stormOn)
    out.push(
      event(
        p.at,
        'broadcast',
        `${Math.round(level ?? 0).toLocaleString('en')}/s for ${BROADCAST_SECONDS} s`,
      ),
    )
  walk.stormOn = stormNow
  return out
}

/** The address conflicts the system logged for this adapter, as events (the last day). */
export function conflictEvents(link: EtherLink | null, since = 0): EtherEvent[] {
  // The log can hold two records of the same millisecond; one row each moment, keyed by it.
  const moments = [...new Set(link?.conflicts ?? [])].filter((at) => at > since)
  return moments.map((at) => event(at, 'conflict', 'another machine claims this address'))
}

/** The pane's own events and the system's conflicts together, newest first. */
export function mergeEtherEvents(
  seen: readonly EtherEvent[],
  logged: readonly EtherEvent[],
): EtherEvent[] {
  return [...seen, ...logged].sort((a, b) => b.at - a.at || a.key.localeCompare(b.key))
}

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

/** A stretch of the timeline drawn as one column. */
export interface EtherBucket {
  from: number
  to: number
  /** Points in the column; none is time the pane was not watched. */
  count: number
  /** The lowest speed in the column while up; null when it was never up. */
  speed: number | null
  /** The link was down at some second of the column. */
  down: boolean
  errors: number | null
  broadcast: number | null
  gateway: Spread | null
  internet: Spread | null
  /** Echoes lost to the internet, 0-100. */
  loss: number | null
  up: number | null
  downBytes: number | null
}

function maxOf(values: readonly (number | null)[]): number | null {
  const got = values.filter((v): v is number => v !== null)
  return got.length === 0 ? null : Math.max(...got)
}

export function etherBuckets(
  points: readonly EtherPoint[],
  from: number,
  to: number,
  count: number,
): EtherBucket[] {
  const width = (to - from) / Math.max(1, count)
  const quick = quickDropPoints(points)
  return columnsOf(points, from, to, count).map((column, i) => {
    const asked = column.filter((p) => p.internet !== undefined)
    const speeds = column
      .filter(isUp)
      .map((p) => p.speed)
      .filter((s): s is number => s !== null)
    return {
      from: from + i * width,
      to: from + (i + 1) * width,
      count: column.length,
      speed: speeds.length === 0 ? null : Math.min(...speeds),
      down: column.some((p) => p.state === 'no-carrier' || quick.has(p)),
      errors: maxOf(column.map((p) => p.errors)),
      broadcast: maxOf(column.map((p) => p.broadcast)),
      gateway: spread(column.map((p) => p.gateway)),
      internet: spread(column.map((p) => p.internet)),
      loss:
        asked.length === 0
          ? null
          : (asked.filter((p) => p.internet === null).length / asked.length) * 100,
      up: meanOf(column.map((p) => p.up)),
      downBytes: meanOf(column.map((p) => p.down)),
    }
  })
}

// ---------------------------------------------------------------------------
// The pane's shape
// ---------------------------------------------------------------------------

export interface EtherSections {
  /** The link panel: the speed ladder, the use of the link, the counts and the settings. */
  link: boolean
  /** The timeline, the log and the detail one under another; otherwise tabs. */
  stacked: boolean
  /** Two columns: the path beside the link panel, the log beside the detail. */
  wide: boolean
  /** The ladder beside the rest of the panel, or above it. */
  linkWide: boolean
}

/**
 * The height each part wants, in CSS pixels, at the type scale of a 1080p screen.
 * The link panel and the detail stand their parts one above another in a narrow
 * pane, and are then about twice as tall (measured on the stubs).
 */
export const ETHER_SECTION_HEIGHTS = {
  header: 34,
  path: 140,
  link: 140,
  linkNarrow: 270,
  timeline: 190,
  log: 130,
  detail: 240,
  detailNarrow: 440,
} as const

/** The width, in CSS pixels, from which the stacked pane goes to two columns (as Wi-Fi's). */
export const ETHER_WIDE_FROM = 1100
/** Below this the link panel's ladder goes above its figures, and the detail to one column. */
export const ETHER_NARROW_BELOW = 480

/**
 * How the pane lays itself out at this size: the path and its verdict always;
 * the link panel when there is room for it above what follows; the timeline, log
 * and detail stacked when all three fit, else as tabs.
 */
export function etherSections(width: number, height: number): EtherSections {
  const h = ETHER_SECTION_HEIGHTS
  const narrow = width < ETHER_NARROW_BELOW
  const withPanel = (panelHeight: number): { link: boolean; stacked: boolean } => {
    const link = height >= h.header + h.path + panelHeight + h.timeline
    const room = height - h.header - h.path - (link ? panelHeight : 0)
    return { link, stacked: room >= h.timeline + h.log + (narrow ? h.detailNarrow : h.detail) }
  }
  // Two columns put the panel beside the path, costing no height - but only when the pane
  // stacks; one column draws it above the lower part, so its height is counted then.
  if (width >= ETHER_WIDE_FROM) {
    const beside = withPanel(0)
    if (beside.stacked) return { ...beside, wide: true, linkWide: true }
  }
  return { ...withPanel(narrow ? h.linkNarrow : h.link), wide: false, linkWide: !narrow }
}

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
