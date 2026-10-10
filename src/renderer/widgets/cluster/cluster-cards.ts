import {
  type ClusterMessage,
  type ClusterTier,
  formatRate,
  fullestVolume,
  type LaneId,
  type LaneSecond,
  laneStats,
  volumePercent,
} from '@shared/cluster'
import type {
  Battery,
  CpuLoad,
  DiskIo,
  DiskVolumes,
  MemSwap,
  MemUsage,
  NetConnections,
  NetInterface,
  NetPing,
  NetThroughput,
  ProcessList,
} from '@shared/metrics'
import type { AwakeState } from '@shared/utility'
import { formatBytes, formatTotal } from '../../lib/format.js'
import type { CardRow } from '../../lib/hover-card.ts'

/**
 * What the CLUSTER pane's detail cards say (docs/cluster.md §7): only what the
 * row has no room for, never the row again. Pure, so a unit test holds it.
 */

export const CARD_KEYS = [
  'date',
  'cpu',
  'cores',
  'mem',
  'io',
  'rx',
  'tx',
  'ping',
  'swap',
  'disk',
  'conn',
  'top',
  'power',
  'uptime',
  'link',
  'awake',
  'message',
] as const
export type CardKey = (typeof CARD_KEYS)[number]

export interface CardReadings {
  now: number
  tier: ClusterTier
  history: readonly LaneSecond[]
  load: CpuLoad | null
  procs: ProcessList | null
  mem: MemUsage | null
  swap: MemSwap | null
  io: DiskIo | null
  net: NetThroughput | null
  ping: NetPing | null
  volumes: DiskVolumes | null
  conns: NetConnections | null
  uptime: number | null
  link: NetInterface | null
  battery: Battery | null
  awake: AwakeState
  message: ClusterMessage
}

export const CARD_TITLES: Readonly<Record<CardKey, string>> = {
  date: 'DATE',
  cpu: 'CPU LOAD',
  cores: 'CORES',
  mem: 'MEMORY',
  io: 'DISK I/O',
  rx: 'NETWORK ▼ RX',
  tx: 'NETWORK ▲ TX',
  ping: 'PING',
  swap: 'SWAP',
  disk: 'DISK',
  conn: 'CONNECTIONS',
  top: 'TOP PROCESS',
  power: 'POWER',
  uptime: 'UPTIME',
  link: 'LINK',
  awake: 'AWAKE',
  message: 'ALERTS',
}

/** Where each card's figures come from, said quietly at its foot. */
const SOURCES: Readonly<Record<CardKey, string>> = {
  date: 'the system clock',
  cpu: 'cpu.load · proc.list',
  cores: 'cpu.load',
  mem: 'mem.usage',
  io: 'disk.io · every 2 s',
  rx: 'net.throughput',
  tx: 'net.throughput',
  ping: 'net.ping · every 5 s',
  swap: 'mem.swap · every 10 s',
  disk: 'disk.volumes · every 30 s',
  conn: 'net.connections · every 5 s',
  top: 'proc.list',
  power: 'power.battery · every 30 s',
  uptime: 'os.uptime',
  link: 'net.interface · net.throughput',
  awake: 'the UTILITY pane',
  message: 'lamps lit for 10 s or more',
}

const row = (label: string, value: string, muted = false): CardRow =>
  muted ? { label, value, muted } : { label, value }

const percent = (value: number): string => `${Math.round(value)}%`

/** A lane's peak and mean, where the lane has no column for them (every tier but wide). */
function statsRows(r: CardReadings, lane: LaneId, format: (value: number) => string): CardRow[] {
  if (r.tier === 'wide') return []
  const { peak, average } = laneStats(r.history, lane)
  if (peak === null || average === null) return []
  return [row('PEAK 60 s', format(peak)), row('AVG 60 s', format(average))]
}

const rate = (mbps: number): string => {
  const { value, unit } = formatRate(mbps)
  return `${value} ${unit}`
}

/** Cores by load, busiest first, as "#3 41%". */
function rankedCores(load: CpuLoad | null): string[] {
  return (load?.cores ?? [])
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
    .map(({ value, index }) => `#${index} ${percent(value)}`)
}

function topProcesses(procs: ProcessList | null, count: number): string {
  const top = (procs?.top ?? []).slice(0, count)
  return top.length === 0 ? '--' : top.map((p) => `${p.name} ${percent(p.cpu)}`).join(' · ')
}

function dateRows(r: CardReadings): CardRow[] {
  const now = new Date(r.now)
  const start = new Date(now.getFullYear(), 0, 0)
  const day = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
  const year = new Date(now.getFullYear(), 1, 29).getMonth() === 1 ? 366 : 365
  return [row('DAY', `${day} of ${year}`), row('QUARTER', `Q${Math.floor(now.getMonth() / 3) + 1}`)]
}

function cpuRows(r: CardReadings): CardRow[] {
  return [
    ...statsRows(r, 'cpu', percent),
    row('BUSIEST', rankedCores(r.load).slice(0, 3).join(' · ') || '--'),
    row('TOP', topProcesses(r.procs, 3)),
    row('NOTE', '% of one core, summed per program', true),
  ]
}

function coreRows(r: CardReadings): CardRow[] {
  const ranked = rankedCores(r.load)
  return [
    row('BUSIEST', ranked.slice(0, 4).join(' · ') || '--'),
    row('QUIETEST', ranked.slice(-2).join(' · ') || '--'),
  ]
}

function memRows(r: CardReadings): CardRow[] {
  const mem = r.mem
  const usage =
    mem === null ? [] : [row('USED', formatBytes(mem.used)), row('FREE', formatBytes(mem.free))]
  return [...statsRows(r, 'mem', percent), ...usage]
}

function ioRows(r: CardReadings): CardRow[] {
  const io = r.io
  const speed = (value: number | null): string =>
    value === null ? 'not reported' : `${formatBytes(value)}/s`
  return [
    ...statsRows(r, 'io', percent),
    row('READ', speed(io?.readSec ?? null)),
    row('WRITE', speed(io?.writeSec ?? null)),
  ]
}

function netRows(r: CardReadings, lane: 'rx' | 'tx'): CardRow[] {
  const total = lane === 'rx' ? r.net?.rxTotal : r.net?.txTotal
  return [
    ...statsRows(r, lane, rate),
    row('INTERFACE', r.net?.iface ?? '--'),
    row('SINCE LINK UP', total === undefined ? '--' : formatTotal(total)),
    row('SCALE', 'shared by RX and TX, up to the minute’s peak'),
  ]
}

function pingRows(r: CardReadings): CardRow[] {
  return [
    ...statsRows(r, 'ping', (value) => `${Math.round(value)} ms`),
    row('HOST', r.ping?.host ?? '--'),
    row('NOTE', 'an echo that never came back is a red stroke', true),
  ]
}

function swapRows(r: CardReadings): CardRow[] {
  const swap = r.swap
  if (swap === null || swap.total <= 0) return [row('SWAP', 'none')]
  return [row('USED', `${formatBytes(swap.used)} of ${formatBytes(swap.total)}`)]
}

function diskRows(r: CardReadings): CardRow[] {
  const volumes = (r.volumes?.volumes ?? []).filter((volume) => volume.total > 0)
  if (volumes.length === 0) return [row('VOLUMES', '--')]
  const fullest = fullestVolume(r.volumes)
  return volumes.map((volume) =>
    row(
      volume.mount,
      `${percent(volumePercent(volume))} of ${formatBytes(volume.total)}${volume === fullest ? ' · shown' : ''}`,
    ),
  )
}

function connRows(r: CardReadings): CardRow[] {
  const conns = r.conns
  if (conns === null) return [row('PEERS', '--')]
  const top = [...conns.countries]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((country) => `${country.code} ${country.count}`)
  return [
    row('COUNTRIES', top.join(' · ') || '--'),
    row('UNPLACED', String(conns.unresolved)),
    row('NOTE', 'distinct public addresses this machine talks to', true),
  ]
}

function powerRows(r: CardReadings): CardRow[] {
  const battery = r.battery
  if (battery === null || !battery.hasBattery) return [row('BATTERY', 'none on this machine')]
  const state = battery.isCharging ? 'charging' : battery.acConnected ? 'on AC' : 'on battery'
  return [row('STATE', state)]
}

function uptimeRows(r: CardReadings, time: (at: number) => string): CardRow[] {
  return r.uptime === null ? [] : [row('BOOTED', time(r.now - r.uptime * 1000))]
}

function linkRows(r: CardReadings): CardRow[] {
  return [
    row('INTERFACE', r.link?.iface ?? r.net?.iface ?? '--'),
    row('STATE', r.link?.state ?? '--'),
  ]
}

function awakeRows(r: CardReadings, time: (at: number) => string): CardRow[] {
  const { level, until } = r.awake
  if (level === 'off') return [row('HOLD', 'none: the machine may sleep')]
  return [
    row('HOLD', level === 'display' ? 'the machine and its display' : 'the machine'),
    row('UNTIL', until === null ? 'turned off' : time(until)),
  ]
}

function messageRows(r: CardReadings): CardRow[] {
  const all = r.message.all
  return all.length === 0 ? [row('LIT', 'nothing')] : all.map((text, i) => row(String(i + 1), text))
}

/** The rows of a card, with where its figures come from at the foot. */
export function cardRows(key: CardKey, r: CardReadings, time: (at: number) => string): CardRow[] {
  const rows: Record<CardKey, () => CardRow[]> = {
    date: () => dateRows(r),
    cpu: () => cpuRows(r),
    cores: () => coreRows(r),
    mem: () => memRows(r),
    io: () => ioRows(r),
    rx: () => netRows(r, 'rx'),
    tx: () => netRows(r, 'tx'),
    ping: () => pingRows(r),
    swap: () => swapRows(r),
    disk: () => diskRows(r),
    conn: () => connRows(r),
    top: () => [row('TOP', topProcesses(r.procs, 3))],
    power: () => powerRows(r),
    uptime: () => uptimeRows(r, time),
    link: () => linkRows(r),
    awake: () => awakeRows(r, time),
    message: () => messageRows(r),
  }
  return [...rows[key](), row('FROM', SOURCES[key], true)]
}
