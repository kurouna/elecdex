import type { Battery, DiskVolume, DiskVolumes, NetInterface } from './metrics.js'
import { ALERT_WINDOW_MS, type QuakeState } from './quakes.js'

/**
 * The CLUSTER pane's judgements (docs/cluster.md §4): one pane as a whole
 * dashboard, read from the metric sources main already provides.
 *
 * Every figure the pane draws - a number, its lane's bars, a
 * core, a lamp and the message line - takes its level from here, so a red
 * number never sits beside an amber lamp for the same reading. Pure: no DOM, no
 * clock but the one passed in.
 */

export type Level = 'none' | 'warn' | 'crit'

const RANK: Readonly<Record<Level, number>> = { none: 0, warn: 1, crit: 2 }

/** The milder of two levels: what a reading held for a while has been all along. */
const milder = (a: Level, b: Level): Level => (RANK[a] <= RANK[b] ? a : b)

/** Where a reading turns amber and red, and how long a lamp waits before it lights. */
export const CLUSTER_LIMITS = {
  cpu: { warn: 85, crit: 95 },
  mem: { warn: 85, crit: 95 },
  disk: { warn: 90, crit: 95 },
  /** Disk busy time: amber only - a busy disk is not yet a fault. */
  io: { warn: 90 },
  pingMs: { warn: 150 },
  /** While discharging, percent left. */
  battery: { warn: 20, crit: 10 },
  /** Seconds a CPU or memory level must last before its lamp lights. */
  holdSeconds: 10,
  /** Echoes (one every five seconds) a ping level must last. */
  holdEchoes: 2,
} as const

const byPercent = (value: number, limits: { warn: number; crit: number }): Level =>
  value >= limits.crit ? 'crit' : value >= limits.warn ? 'warn' : 'none'

export const cpuLevel = (percent: number): Level => byPercent(percent, CLUSTER_LIMITS.cpu)
export const memLevel = (percent: number): Level => byPercent(percent, CLUSTER_LIMITS.mem)
export const diskLevel = (percent: number): Level => byPercent(percent, CLUSTER_LIMITS.disk)

/** Disk busy time; null where the platform does not say, which is not a fault. */
export const ioLevel = (busy: number | null): Level =>
  busy !== null && busy >= CLUSTER_LIMITS.io.warn ? 'warn' : 'none'

/** A round trip in ms, or null when no echo came back - the worst there is. */
export const pingLevel = (ms: number | null): Level =>
  ms === null ? 'crit' : ms >= CLUSTER_LIMITS.pingMs.warn ? 'warn' : 'none'

/** Only a battery running down counts: one charging, or on AC, is never low. */
export function batteryLevel(battery: Battery | null): Level {
  if (battery === null || !battery.hasBattery || battery.percent === null) return 'none'
  if (battery.isCharging || battery.acConnected) return 'none'
  const { warn, crit } = CLUSTER_LIMITS.battery
  return battery.percent <= crit ? 'crit' : battery.percent <= warn ? 'warn' : 'none'
}

/* ---------- lanes ---------- */

/** The lanes, top to bottom (user decision 2026-10-10). */
export const LANE_IDS = ['cpu', 'mem', 'io', 'rx', 'tx', 'ping'] as const
export type LaneId = (typeof LANE_IDS)[number]

/**
 * A lane's reading for one second. `undefined` is no reading that second (the
 * ping comes every five, disk I/O every two, and neither while the pane is out of
 * sight); `null` is a reading that says nothing (no echo, no busy figure).
 */
export type LaneValue = number | null | undefined

/** One second of every lane: CPU and memory in percent, network in Mbps, ping in ms. */
export type LaneSecond = { readonly at: number } & { readonly [K in LaneId]: LaneValue }

/** Seconds a lane shows. One more is kept: the one stepping in at the right edge. */
export const HISTORY_SECONDS = 60

/** The history with a second added, the oldest let go. */
export function recordSecond(
  history: readonly LaneSecond[],
  second: LaneSecond,
): readonly LaneSecond[] {
  return [...history, second].slice(-(HISTORY_SECONDS + 1))
}

export function laneLevel(lane: LaneId, value: LaneValue): Level {
  if (value === undefined) return 'none'
  switch (lane) {
    case 'cpu':
      return value === null ? 'none' : cpuLevel(value)
    case 'mem':
      return value === null ? 'none' : memLevel(value)
    case 'io':
      return ioLevel(value)
    case 'ping':
      return pingLevel(value)
    default:
      return 'none'
  }
}

/*
 * Every lane is a line over a soft fill (user decision 2026-10-10: bars read badly where the
 * values sit low). Percentages keep their whole range; the network and the ping are scaled to
 * the minute they show, to a round top, so a quiet link or a quick echo still has a shape.
 */

/** The least top the auto-scaled lanes are given: a quiet minute is not blown up to fill them. */
export const LANE_SCALE_FLOOR = { net: 0.1, ping: 20 } as const

/** The round number (1, 2 or 5 of a power of ten) at or above a value. */
export function niceCeiling(value: number): number {
  if (!(value > 0)) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 5, 10].find((n) => n * power >= value * (1 - 1e-9)) ?? 10
  return step * power
}

const numbers = (history: readonly LaneSecond[], lane: LaneId): number[] =>
  history
    .slice(-HISTORY_SECONDS)
    .map((second) => second[lane])
    .filter((value): value is number => typeof value === 'number')

/**
 * The top of a lane's scale: 100 for the percentages; for the network the larger of RX's and
 * TX's peak, so the two lanes read against each other; for the ping its own peak.
 */
export function laneScale(history: readonly LaneSecond[], lane: LaneId): number {
  if (lane === 'rx' || lane === 'tx') {
    const peak = Math.max(0, ...numbers(history, 'rx'), ...numbers(history, 'tx'))
    return niceCeiling(Math.max(peak, LANE_SCALE_FLOOR.net))
  }
  if (lane === 'ping')
    return niceCeiling(Math.max(0, ...numbers(history, 'ping'), LANE_SCALE_FLOOR.ping))
  return 100
}

/** The top of a lane's scale as its label says it. */
export function scaleLabel(lane: LaneId, top: number): string {
  if (lane === 'rx' || lane === 'tx') {
    return top >= 1000 ? `${top / 1000} Gbps` : `${top} Mbps`
  }
  return lane === 'ping' ? `${top} ms` : `${top}%`
}

/** How high a reading stands against its lane's top, 0-1. */
export const laneHeight = (value: number, top: number): number =>
  top > 0 ? Math.min(1, Math.max(0, value / top)) : 0

/**
 * Seconds without a reading a line still joins across: the ping comes every five and disk I/O
 * every two. A longer gap (the pane was out of sight) breaks the line.
 */
export const LANE_JOIN_SECONDS = 6

/** The highest and the mean of the readings the lane shows; null with none. */
export function laneStats(
  history: readonly LaneSecond[],
  lane: LaneId,
): { peak: number | null; average: number | null } {
  const values = history
    .slice(-HISTORY_SECONDS)
    .map((second) => second[lane])
    .filter((value): value is number => typeof value === 'number')
  if (values.length === 0) return { peak: null, average: null }
  const sum = values.reduce((total, value) => total + value, 0)
  return { peak: Math.max(...values), average: sum / values.length }
}

/**
 * The level a lane has kept through its last `count` readings - the mildest of
 * them - or none until there have been that many. A lamp lights on this, so a
 * moment's spike leaves it dark.
 */
export function heldLevel(history: readonly LaneSecond[], lane: LaneId, count: number): Level {
  const readings = history.map((second) => second[lane]).filter((value) => value !== undefined)
  if (readings.length < count) return 'none'
  return readings
    .slice(-count)
    .map((value) => laneLevel(lane, value))
    .reduce(milder, 'crit')
}

/* ---------- the rest of the figures ---------- */

export const bytesToMbps = (bytesPerSecond: number): number => (bytesPerSecond * 8) / 1_000_000

/** A rate as the lanes write it: Mbps up to a thousand, Gbps beyond. */
export function formatRate(mbps: number): { value: string; unit: 'Mbps' | 'Gbps' } {
  if (mbps >= 1000) return { value: (mbps / 1000).toFixed(2), unit: 'Gbps' }
  const digits = mbps >= 100 ? 0 : mbps >= 10 ? 1 : 2
  return { value: mbps.toFixed(digits), unit: 'Mbps' }
}

/** Uptime as the pane counts it: days, then a clock. */
export function uptimeClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const two = (n: number): string => String(Math.floor(n)).padStart(2, '0')
  return `${Math.floor(s / 86_400)}d ${two((s % 86_400) / 3600)}:${two((s % 3600) / 60)}:${two(s % 60)}`
}

/** The cores row draws at most this many bars. */
export const MAX_CORE_BARS = 32

/** Cores beyond the row's room put together with their neighbours, each group drawn at its busiest. */
export function groupCores(cores: readonly number[], max: number = MAX_CORE_BARS): number[] {
  if (cores.length <= max) return [...cores]
  const per = Math.ceil(cores.length / max)
  const groups: number[] = []
  for (let i = 0; i < cores.length; i += per) groups.push(Math.max(...cores.slice(i, i + per)))
  return groups
}

/** The busiest logical core, by its number; null with none. */
export function busiestCore(cores: readonly number[]): { index: number; load: number } | null {
  let best: { index: number; load: number } | null = null
  cores.forEach((load, index) => {
    if (best === null || load > best.load) best = { index, load }
  })
  return best
}

const usedPercent = (volume: DiskVolume): number =>
  volume.total > 0 ? (volume.used / volume.total) * 100 : 0

/** The fixed volume nearest to full: the one the DISK slot and lamp speak for. */
export function fullestVolume(volumes: DiskVolumes | null): DiskVolume | null {
  const fixed = (volumes?.volumes ?? []).filter(
    (volume) => volume.kind === 'fixed' && volume.total > 0,
  )
  if (fixed.length === 0) return null
  return fixed.reduce((best, volume) => (usedPercent(volume) > usedPercent(best) ? volume : best))
}

export const volumePercent = usedPercent

/* ---------- lamps and the message line ---------- */

export const LAMP_IDS = ['link', 'ping', 'cpu', 'mem', 'disk', 'batt', 'awake', 'quake'] as const
export type LampId = (typeof LAMP_IDS)[number]

/** A lamp dark, on for information (AWAKE), or lit amber or red. */
export type LampState = 'off' | 'info' | 'warn' | 'crit'

export interface Lamp {
  id: LampId
  state: LampState
  /** What the message line says when this is the lamp it speaks for. */
  text: string | null
}

export interface LampInput {
  history: readonly LaneSecond[]
  link: NetInterface | null
  volumes: DiskVolumes | null
  battery: Battery | null
  /** AWAKE holds the machine (or its display) awake. */
  awake: boolean
  /** Quake alerts on in the settings: the QUAKE lamp is shown only then. */
  quakeAlerts: boolean
  quakes: QuakeState | null
  topProcess: string | null
  now: number
}

const lit = (id: LampId, level: Level, text: string): Lamp =>
  level === 'none' ? { id, state: 'off', text: null } : { id, state: level, text }

function linkLamp(link: NetInterface | null): Lamp {
  if (link === null || link.state !== 'down') return { id: 'link', state: 'off', text: null }
  return { id: 'link', state: 'crit', text: `LINK DOWN · ${link.iface ?? 'NETWORK'}` }
}

function pingLamp(history: readonly LaneSecond[]): Lamp {
  const level = heldLevel(history, 'ping', CLUSTER_LIMITS.holdEchoes)
  const last = history.map((second) => second.ping).findLast((value) => value !== undefined)
  const text = last === null ? 'PING · NO ECHO' : `PING · ${Math.round(last ?? 0)} ms`
  return lit('ping', level, text)
}

function percentLamp(input: LampInput, id: 'cpu' | 'mem'): Lamp {
  const level = heldLevel(input.history, id, CLUSTER_LIMITS.holdSeconds)
  const now = input.history.at(-1)?.[id]
  const limit = CLUSTER_LIMITS[id][level === 'crit' ? 'crit' : 'warn']
  const name = id === 'cpu' ? 'CPU' : 'MEMORY'
  const top = id === 'cpu' && input.topProcess !== null ? ` · TOP ${input.topProcess}` : ''
  const text = `${name} ${Math.round(now ?? 0)}% · OVER ${limit}% FOR ${CLUSTER_LIMITS.holdSeconds} s${top}`
  return lit(id, level, text)
}

function diskLamp(volumes: DiskVolumes | null): Lamp {
  const volume = fullestVolume(volumes)
  if (volume === null) return { id: 'disk', state: 'off', text: null }
  const percent = usedPercent(volume)
  return lit('disk', diskLevel(percent), `DISK ${volume.mount} · ${Math.round(percent)}% FULL`)
}

function batteryLamp(battery: Battery | null): Lamp | null {
  if (battery === null || !battery.hasBattery) return null
  const text = `BATTERY · ${Math.round(battery.percent ?? 0)}% · DISCHARGING`
  return lit('batt', batteryLevel(battery), text)
}

/**
 * A tsunami in effect is red; an earthquake main announced, still recent, is
 * amber. Both name their source and say what they are not (CLAUDE.md,
 * Publishing: attribution).
 */
function quakeLamp(input: LampInput): Lamp | null {
  if (!input.quakeAlerts) return null
  const state = input.quakes
  if (state === null) return { id: 'quake', state: 'off', text: null }
  if (state.tsunami !== null) {
    const issuer = state.tsunami.source === 'jma' ? 'JMA' : 'NOAA'
    const text = `TSUNAMI ${state.tsunami.level.toUpperCase()} · ${issuer} · FOLLOW LOCAL AUTHORITIES`
    return { id: 'quake', state: 'crit', text }
  }
  const quake = state.quakes.find(
    (q) => state.announced.includes(q.id) && input.now - q.at <= ALERT_WINDOW_MS[q.source],
  )
  if (quake === undefined) return { id: 'quake', state: 'off', text: null }
  const magnitude = quake.magnitude === null ? '' : ` M${quake.magnitude.toFixed(1)}`
  const area = quake.area === null ? '' : ` · ${quake.area.en}`
  const issuer = quake.source === 'jma' ? 'JMA' : 'USGS'
  return {
    id: 'quake',
    state: 'warn',
    text: `QUAKE${magnitude}${area} · ${issuer} · NOT AN EARLY WARNING`,
  }
}

/**
 * The lamps in their fixed order. One that does not apply here - BATT on a
 * machine without a battery, QUAKE with quake alerts off - is left out, never
 * shown dark: dark would read as "all is well" (user decision 2026-10-10).
 */
export function clusterLamps(input: LampInput): Lamp[] {
  const lamps: Array<Lamp | null> = [
    linkLamp(input.link),
    pingLamp(input.history),
    percentLamp(input, 'cpu'),
    percentLamp(input, 'mem'),
    diskLamp(input.volumes),
    batteryLamp(input.battery),
    { id: 'awake', state: input.awake ? 'info' : 'off', text: null },
    quakeLamp(input),
  ]
  return lamps.filter((lamp): lamp is Lamp => lamp !== null)
}

export interface ClusterMessage {
  level: Level
  text: string
  /** Other lamps lit amber or red besides the one spoken for. */
  more: number
  /** What every lit lamp says, most severe first. */
  all: string[]
}

export const ALL_CLEAR = 'ALL SYSTEMS NOMINAL'

/** The message line: the most severe lamp in words (the first of equals), and how many more. */
export function clusterMessage(lamps: readonly Lamp[]): ClusterMessage {
  const alarms = lamps
    .filter((lamp) => (lamp.state === 'warn' || lamp.state === 'crit') && lamp.text !== null)
    .map((lamp) => ({ level: lamp.state as Level, text: lamp.text ?? '' }))
    .sort((a, b) => RANK[b.level] - RANK[a.level])
  const first = alarms[0]
  if (first === undefined) return { level: 'none', text: ALL_CLEAR, more: 0, all: [] }
  return {
    level: first.level,
    text: first.text,
    more: alarms.length - 1,
    all: alarms.map((alarm) => alarm.text),
  }
}

/* ---------- tiers ---------- */

/** How the pane lays itself out, largest first (docs/cluster.md §2.1). */
export const CLUSTER_TIERS = ['wide', 'medium', 'short', 'compact', 'narrow'] as const
export type ClusterTier = (typeof CLUSTER_TIERS)[number]

/**
 * The room each part needs, in CSS pixels, measured on the mock. Sizes are the
 * widget's own - the pane's body, under the header PaneHost draws.
 */
export const CLUSTER_ROOM = {
  wide: { width: 1100, height: 470 },
  /** The lamps and the clock beside the date, above the lanes. */
  mediumTop: 170,
  laneMin: 46,
  /** A row of slots, and how wide a slot is with its gap. */
  slotRow: 64,
  slotWidth: 140,
  slots: 8,
  padding: 40,
  minWidth: 560,
  short: { height: 200 },
  compact: { width: 460, height: 350 },
  /** Wide: the cores row goes in from this height. */
  wideCores: 530,
  /** Room a tier is kept for before it gives way, so a drag across a threshold does not flicker. */
  hysteresis: 12,
} as const

/** Rows the slots take at a width. */
export function slotRows(width: number): number {
  const perRow = Math.max(1, Math.floor((width - 32) / CLUSTER_ROOM.slotWidth))
  return Math.ceil(CLUSTER_ROOM.slots / perRow)
}

/** The height medium needs at a width: the top, `lanes` lanes and the slot rows. */
const mediumNeed = (width: number, lanes: number): number =>
  CLUSTER_ROOM.mediumTop +
  lanes * CLUSTER_ROOM.laneMin +
  slotRows(width) * CLUSTER_ROOM.slotRow +
  CLUSTER_ROOM.padding

function tierAt(width: number, height: number): ClusterTier {
  const room = CLUSTER_ROOM
  if (width < room.compact.width) return 'narrow'
  if (width >= room.wide.width && height >= room.wide.height) return 'wide'
  if (width >= room.minWidth && height >= mediumNeed(width, LANE_IDS.length)) return 'medium'
  if (width >= room.minWidth && height >= room.short.height) return 'short'
  return height >= room.compact.height ? 'compact' : 'narrow'
}

const order = (tier: ClusterTier): number => CLUSTER_TIERS.indexOf(tier)

/**
 * The tier for a pane of this size. Given the tier it has, it keeps it until
 * the size is a little past the line, so dragging along a threshold does not
 * flip the layout back and forth.
 */
export function clusterTier(width: number, height: number, previous?: ClusterTier): ClusterTier {
  const tier = tierAt(width, height)
  if (previous === undefined || previous === tier) return tier
  const slack = CLUSTER_ROOM.hysteresis
  // Growing, the larger tier must still hold with a little less room; shrinking, the
  // smaller one with a little more. Otherwise the pane stays as it was.
  const growing = order(tier) < order(previous)
  const check = growing
    ? tierAt(width - slack, height - slack)
    : tierAt(width + slack, height + slack)
  const past = growing ? order(check) < order(previous) : order(check) > order(previous)
  return past ? tier : previous
}

/** Whether the cores row goes in: only where the lanes keep their least height with it. */
export function showCores(tier: ClusterTier, width: number, height: number): boolean {
  if (tier === 'wide') return height >= CLUSTER_ROOM.wideCores
  if (tier === 'medium') return height >= mediumNeed(width, LANE_IDS.length + 1)
  return false
}
