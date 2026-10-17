import {
  batteryLevel,
  bytesToMbps,
  cpuLevel,
  diskLevel,
  formatRate,
  fullestVolume,
  ioLevel,
  type LaneId,
  type LaneSecond,
  type Level,
  memLevel,
  pingLevel,
  uptimeClock,
  volumePercent,
  vramLevel,
} from '@shared/cluster'
import type {
  Battery,
  CpuInfo,
  CpuLoad,
  DiskIo,
  DiskVolumes,
  GpuUsage,
  HardwareSystem,
  MemSwap,
  MemUsage,
  MetricSample,
  NetConnections,
  NetInterface,
  NetPing,
  NetThroughput,
  OsInfo,
  ProcessList,
} from '@shared/metrics'
import type { AwakeState } from '@shared/utility'
import { formatBytes, formatTotal, osVersionLabel, trimHardware } from '../../lib/format.js'

/**
 * What each CLUSTER figure says, from the latest readings: the words and numbers
 * the pane draws, kept out of the component so a unit test can read them.
 */

export interface FigureView {
  label: string
  value: string
  unit: string
  note: string
  /** 0-1, or null for no meter. */
  meter: number | null
  level: Level
  /** A word, set as text rather than rolling digits. */
  word: boolean
}

export interface Readings {
  load: CpuLoad | null
  mem: MemUsage | null
  net: NetThroughput | null
  io: DiskIo | null
  ping: NetPing | null
  link: NetInterface | null
  swap: MemSwap | null
  volumes: DiskVolumes | null
  conns: NetConnections | null
  procs: ProcessList | null
  battery: Battery | null
  /** Seconds since boot, counted on to now. */
  uptime: number | null
  /** Its `name` is null where the GPU cannot be read: then the GPU lane, VRAM lamp and slot are left out. */
  gpu: GpuUsage | null
  awake: AwakeState
  /** What the machine is: read once, the same for as long as the app runs. */
  os: OsInfo | null
  hardware: HardwareSystem | null
  cpu: CpuInfo | null
}

const figure = (over: Partial<FigureView> & Pick<FigureView, 'label' | 'value'>): FigureView => ({
  unit: '',
  note: '',
  meter: null,
  level: 'none',
  word: false,
  ...over,
})

const NONE = '--'

export const LANE_LABELS: Readonly<Record<LaneId, string>> = {
  cpu: 'CPU LOAD',
  mem: 'MEMORY',
  gpu: 'GPU LOAD',
  io: 'DISK I/O',
  rx: 'NETWORK ▼ RX',
  tx: 'NETWORK ▲ TX',
  ping: 'PING',
}

/** The room a lane's widest value takes, in digit cells of 0.62em (and a point's 0.36em). */
export const LANE_CELLS: Readonly<Record<LaneId, string>> = {
  cpu: '1.86em',
  mem: '1.86em',
  gpu: '1.86em',
  io: '1.86em',
  rx: '2.6em',
  tx: '2.6em',
  ping: '1.86em',
}

const memPercent = (mem: MemUsage | null): number | null =>
  mem === null || mem.total <= 0 ? null : (mem.used / mem.total) * 100

/** The share of the GPU's own memory in use; null where it is not known. */
export const vramPercent = (gpu: GpuUsage | null): number | null =>
  gpu === null || gpu.vramUsed === null || gpu.vramTotal === null || gpu.vramTotal <= 0
    ? null
    : Math.min(100, (gpu.vramUsed / gpu.vramTotal) * 100)

/** The GPU can be read here: its lane, lamp, slot and spec item go in. */
export const hasGpu = (r: Pick<Readings, 'gpu'>): boolean => r.gpu !== null && r.gpu.name !== null

function rateFigure(lane: 'rx' | 'tx', net: NetThroughput | null): FigureView {
  if (net === null) return figure({ label: LANE_LABELS[lane], value: NONE, word: true })
  const { value, unit } = formatRate(bytesToMbps(lane === 'rx' ? net.rxSec : net.txSec))
  return figure({ label: LANE_LABELS[lane], value, unit })
}

function percentFigure(lane: 'cpu' | 'mem', value: number | null): FigureView {
  if (value === null) return figure({ label: LANE_LABELS[lane], value: NONE, word: true })
  const level = lane === 'cpu' ? cpuLevel(value) : memLevel(value)
  return figure({ label: LANE_LABELS[lane], value: String(Math.round(value)), unit: '%', level })
}

/** No level: a GPU at 100% is doing its work (CLUSTER_LIMITS.vram says what is a fault). */
function gpuFigure(gpu: GpuUsage | null): FigureView {
  const load = gpu?.load ?? null
  return load === null
    ? figure({ label: LANE_LABELS.gpu, value: NONE, word: true })
    : figure({ label: LANE_LABELS.gpu, value: String(Math.round(load)), unit: '%' })
}

function ioFigure(io: DiskIo | null): FigureView {
  const busy = io?.busy ?? null
  // Speeds read but no busy figure (a system that does not say): said, not left as if waiting.
  if (busy === null) {
    return figure({
      label: LANE_LABELS.io,
      value: io?.readSec == null && io?.writeSec == null ? NONE : 'N/A',
      word: true,
    })
  }
  return figure({
    label: LANE_LABELS.io,
    value: String(Math.round(busy)),
    unit: '% BUSY',
    level: ioLevel(busy),
  })
}

function pingFigure(ping: NetPing | null): FigureView {
  if (ping === null) return figure({ label: LANE_LABELS.ping, value: NONE, word: true })
  const ms = ping.ms
  const level = pingLevel(ms)
  if (ms === null) return figure({ label: LANE_LABELS.ping, value: 'LOST', word: true, level })
  return figure({ label: LANE_LABELS.ping, value: String(Math.round(ms)), unit: 'ms', level })
}

/** A lane's number now. */
export function laneFigure(lane: LaneId, r: Readings): FigureView {
  switch (lane) {
    case 'cpu':
      return percentFigure('cpu', r.load?.total ?? null)
    case 'mem':
      return percentFigure('mem', memPercent(r.mem))
    case 'gpu':
      return gpuFigure(r.gpu)
    case 'io':
      return ioFigure(r.io)
    case 'rx':
    case 'tx':
      return rateFigure(lane, r.net)
    case 'ping':
      return pingFigure(r.ping)
  }
}

/**
 * A second of the lanes, from a cpu.load sample and what else is read now. Disk
 * I/O and the ping are given only in the second they arrived (null otherwise),
 * so a reading every two or five seconds is one bar, not a plateau.
 */
export function laneSecond(
  load: MetricSample<'cpu.load'>,
  r: {
    mem: MemUsage | null
    gpu: GpuUsage | null
    net: NetThroughput | null
    io: DiskIo | null
    ping: NetPing | null
  },
): LaneSecond {
  return {
    at: load.at,
    cpu: load.data.total,
    mem: memPercent(r.mem) ?? undefined,
    gpu: r.gpu?.load ?? undefined,
    vram: vramPercent(r.gpu) ?? undefined,
    rx: r.net === null ? undefined : bytesToMbps(r.net.rxSec),
    tx: r.net === null ? undefined : bytesToMbps(r.net.txSec),
    io: r.io === null ? undefined : r.io.busy,
    ping: r.ping === null ? undefined : r.ping.ms,
  }
}

/** A lane's peak or mean, with its unit. */
export function statText(lane: LaneId, value: number | null): { value: string; unit: string } {
  if (value === null) return { value: NONE, unit: '' }
  if (lane === 'rx' || lane === 'tx') return formatRate(value)
  return { value: String(Math.round(value)), unit: lane === 'ping' ? 'ms' : '%' }
}

/**
 * The slots, in their order: what the lanes do not say, five to a row in wide - memory and VRAM
 * as amounts first (user decision 2026-10-17). `ram` is the memory slot, `mem` its lane.
 */
export const SLOT_KEYS = [
  'ram',
  'vram',
  'swap',
  'disk',
  'conn',
  'top',
  'power',
  'uptime',
  'link',
  'address',
] as const
export type SlotKey = (typeof SLOT_KEYS)[number]

/** The slots drawn here: VRAM is left out where the GPU cannot be read. */
export const clusterSlots = (gpu: boolean): readonly SlotKey[] =>
  gpu ? SLOT_KEYS : SLOT_KEYS.filter((key) => key !== 'vram')

const GIB = 1024 ** 3

/** "7.4 / 15.7 GiB": what is in use of how much, in one unit. */
const ofTotal = (used: number, total: number): string =>
  `${(used / GIB).toFixed(1)} / ${(total / GIB).toFixed(1)} GiB`

function ramFigure(mem: MemUsage | null): FigureView {
  const percent = memPercent(mem)
  if (mem === null || percent === null) return figure({ label: 'MEMORY', value: NONE, word: true })
  return figure({
    label: 'MEMORY',
    value: String(Math.round(percent)),
    unit: '%',
    meter: percent / 100,
    note: ofTotal(mem.used, mem.total),
    level: memLevel(percent),
  })
}

function vramFigure(gpu: GpuUsage | null): FigureView {
  const percent = vramPercent(gpu)
  if (gpu === null || percent === null) return figure({ label: 'VRAM', value: NONE, word: true })
  return figure({
    label: 'VRAM',
    value: String(Math.round(percent)),
    unit: '%',
    meter: percent / 100,
    note: ofTotal(gpu.vramUsed ?? 0, gpu.vramTotal ?? 0),
    level: vramLevel(percent),
  })
}

function swapFigure(swap: MemSwap | null): FigureView {
  if (swap === null) return figure({ label: 'SWAP', value: NONE, word: true })
  if (swap.total <= 0) return figure({ label: 'SWAP', value: 'NONE', word: true })
  const percent = (swap.used / swap.total) * 100
  return figure({
    label: 'SWAP',
    value: String(Math.round(percent)),
    unit: '%',
    meter: percent / 100,
    note: formatBytes(swap.total),
  })
}

function diskFigure(volumes: DiskVolumes | null): FigureView {
  const volume = fullestVolume(volumes)
  if (volume === null) return figure({ label: 'DISK · FULLEST', value: NONE, word: true })
  const percent = volumePercent(volume)
  return figure({
    label: 'DISK · FULLEST',
    value: String(Math.round(percent)),
    unit: '%',
    meter: percent / 100,
    note: `${volume.mount} · ${formatBytes(volume.total - volume.used)} FREE`,
    level: diskLevel(percent),
  })
}

function connFigure(conns: NetConnections | null): FigureView {
  if (conns === null) return figure({ label: 'CONNECTIONS', value: NONE, word: true })
  return figure({
    label: 'CONNECTIONS',
    value: String(conns.total),
    unit: 'PEERS',
    note: `${conns.countries.length} COUNTRIES`,
  })
}

function topFigure(procs: ProcessList | null): FigureView {
  const top = procs?.top[0]
  if (procs === null || top === undefined)
    return figure({ label: 'TOP PROCESS', value: NONE, word: true })
  return figure({
    label: 'TOP PROCESS',
    value: top.name,
    word: true,
    note: `${Math.round(top.cpu)}% · ${procs.all} PROC`,
  })
}

function powerFigure(battery: Battery | null): FigureView {
  if (battery === null) return figure({ label: 'POWER', value: NONE, word: true })
  if (!battery.hasBattery) {
    return figure({ label: 'POWER', value: 'AC', word: true, note: 'NO BATTERY' })
  }
  const state = battery.isCharging ? 'CHARGING' : battery.acConnected ? 'AC' : 'DISCHARGING'
  // A battery that does not say how full it is is still a battery (found in review: NO BATTERY).
  if (battery.percent === null)
    return figure({ label: 'POWER', value: NONE, word: true, note: state })
  return figure({
    label: 'POWER',
    value: String(Math.round(battery.percent)),
    unit: '%',
    meter: battery.percent / 100,
    note: state,
    level: batteryLevel(battery),
  })
}

function linkFigure(net: NetThroughput | null, link: NetInterface | null): FigureView {
  if (link?.state === 'down')
    return figure({
      label: 'LINK ▼ TOTAL',
      value: 'DOWN',
      word: true,
      level: 'crit',
      note: link.iface ?? '',
    })
  if (net === null) return figure({ label: 'LINK ▼ TOTAL', value: NONE, word: true })
  return figure({
    label: 'LINK ▼ TOTAL',
    value: formatTotal(net.rxTotal),
    word: true,
    note: `▲ ${formatTotal(net.txTotal)}`,
  })
}

const AWAKE_WORDS = { off: 'OFF', system: 'SYSTEM', display: 'DISPLAY' } as const

export function slotFigure(key: SlotKey, r: Readings): FigureView {
  switch (key) {
    case 'ram':
      return ramFigure(r.mem)
    case 'vram':
      return vramFigure(r.gpu)
    case 'swap':
      return swapFigure(r.swap)
    case 'disk':
      return diskFigure(r.volumes)
    case 'conn':
      return connFigure(r.conns)
    case 'top':
      return topFigure(r.procs)
    case 'power':
      return powerFigure(r.battery)
    case 'uptime':
      return r.uptime === null
        ? figure({ label: 'UPTIME', value: NONE, word: true })
        : figure({ label: 'UPTIME', value: uptimeClock(r.uptime), note: 'SINCE BOOT' })
    case 'link':
      return linkFigure(r.net, r.link)
    case 'address':
      // The address changes with the network, so it sits with the readings; the interface under it.
      return figure({
        label: 'ADDRESS',
        value: r.link?.ip4 ?? '--.--.--.--',
        note: r.link?.iface ?? NONE,
        level: r.link?.state === 'down' ? 'crit' : 'none',
      })
  }
}

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const
const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const

const two = (n: number): string => String(Math.floor(n)).padStart(2, '0')

export const clockText = (date: Date): string =>
  `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`

/** ISO 8601 week number. */
export function isoWeek(date: Date): number {
  const day = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const weekday = day.getUTCDay() || 7
  day.setUTCDate(day.getUTCDate() + 4 - weekday)
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1)
  return Math.ceil(((day.getTime() - yearStart) / 86_400_000 + 1) / 7)
}

/** The date with its weekday, and a note of the week and the offset from UTC. */
export function dateText(date: Date): { value: string; note: string } {
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '−'
  const zone = `UTC${sign}${two(Math.abs(offset) / 60)}:${two(Math.abs(offset) % 60)}`
  return {
    value: `${DAYS[date.getDay()]} ${two(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
    note: `WEEK ${isoWeek(date)} · ${zone}`,
  }
}

/* ---- The spec row: what the machine is, as the standard layout's system column says it ---- */

export interface SpecItem {
  key: 'os' | 'maker' | 'model' | 'chassis' | 'cpu' | 'gpu' | 'awake'
  label: string
  value: string
}

/**
 * The CPU's name as the CPU pane titles itself: systeminformation's brand usually names the
 * maker already ("Gen Intel® Core™ i5"), so the maker is put in front only when it does not.
 */
export function cpuName(cpu: CpuInfo): string {
  return cpu.brand.toLowerCase().includes(cpu.manufacturer.toLowerCase())
    ? cpu.brand
    : `${cpu.manufacturer} ${cpu.brand}`.trim()
}

/**
 * OS, MANUFACTURER, MODEL and CHASSIS as the system pane words them (not TYPE, which the OS
 * already says, user decision 2026-10-10), the CPU as the CPU
 * pane titles itself with its cores and threads, and AWAKE: what the user set it to, not
 * something it reads (the address went up among the readings, user decision 2026-10-10).
 * The GPU after the CPU, where it can be read. Never the host name.
 */
export function specItems(
  r: Pick<Readings, 'os' | 'hardware' | 'cpu' | 'gpu' | 'awake'>,
): SpecItem[] {
  const hw = r.hardware
  const gpu: SpecItem[] =
    r.gpu?.name == null ? [] : [{ key: 'gpu', label: 'GPU', value: r.gpu.name }]
  return [
    { key: 'os', label: 'OS', value: r.os ? osVersionLabel(r.os) : NONE },
    { key: 'maker', label: 'MANUFACTURER', value: hw ? trimHardware(hw.manufacturer, 2) : NONE },
    {
      key: 'model',
      label: 'MODEL',
      value: hw ? trimHardware(hw.model, 2, hw.manufacturer, hw.chassis) : NONE,
    },
    { key: 'chassis', label: 'CHASSIS', value: hw?.chassis || NONE },
    {
      key: 'cpu',
      label: 'CPU',
      value: r.cpu ? `${cpuName(r.cpu)} · ${r.cpu.physicalCores}C/${r.cpu.cores}T` : NONE,
    },
    ...gpu,
    { key: 'awake', label: 'AWAKE', value: AWAKE_WORDS[r.awake.level] },
  ]
}
