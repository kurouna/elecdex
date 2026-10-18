import { CLUSTER_BASE, clusterLanes, clusterMessage, type LaneSecond } from '@shared/cluster'
import type { DiskVolume } from '@shared/metrics'
import { RELEASED } from '@shared/utility'
import { describe, expect, it } from 'vitest'
import {
  CARD_KEYS,
  type CardReadings,
  cardRows,
} from '../../src/renderer/widgets/cluster/cluster-cards.js'
import {
  clockText,
  clusterSlots,
  dateText,
  hasGpu,
  isoWeek,
  LANE_LABELS,
  laneFigure,
  type Readings,
  SLOT_KEYS,
  slotFigure,
  specItems,
  statText,
  vramPercent,
} from '../../src/renderer/widgets/cluster/cluster-view.js'

const volume = (mount: string, used: number): DiskVolume => ({
  mount,
  label: '',
  fs: 'NTFS',
  kind: 'fixed',
  total: 500e9,
  used,
})

const GIB = 1024 ** 3

const GPU = {
  name: 'Stub Graphics',
  load: 64,
  engines: { graphics: 64, compute: 12, copy: 3, video: null },
  vramUsed: 11.2 * GIB,
  vramTotal: 12 * GIB,
  sharedUsed: 0.5 * GIB,
  sharedTotal: 16 * GIB,
}

const readings = (over: Partial<Readings> = {}): Readings => ({
  load: { total: 42.4, cores: [10, 80, 30, 50] },
  mem: { total: 32e9, used: 16e9, free: 16e9 },
  net: { iface: 'Ethernet', rxSec: 1_250_000, txSec: 125_000, rxTotal: 41.8e9, txTotal: 3.9e9 },
  io: { readSec: 2e6, writeSec: 1e6, busy: 7 },
  ping: { host: '1.1.1.1', ms: 14 },
  link: { iface: 'Ethernet', ip4: '192.168.0.12', mac: null, state: 'up' },
  swap: { total: 4e9, used: 1e9, available: 0, active: 0 },
  volumes: { volumes: [volume('C:\\', 300e9), volume('D:\\', 100e9)] },
  conns: { total: 81, unresolved: 2, countries: [{ code: 'JP', count: 41, lat: 0, lon: 0 }] },
  procs: { all: 312, top: [{ pid: 1, name: 'msedge', cpu: 6.4, mem: 3 }] },
  battery: { hasBattery: false, percent: null, isCharging: false, acConnected: true },
  uptime: 12 * 86_400 + 4 * 3600 + 33 * 60 + 7,
  gpu: null,
  awake: { ...RELEASED, level: 'system', held: true, onBattery: false },
  os: {
    platform: 'win32',
    distro: 'Microsoft Windows 11 Pro',
    release: '10.0.26300',
    codename: '',
    build: '26300',
    kernel: '10.0.26300',
    arch: 'x64',
    hostname: 'someones-laptop',
  },
  hardware: {
    manufacturer: 'HP',
    model: 'HP EliteBook 630 13 inch G10 Notebook PC',
    chassis: 'Notebook',
  },
  cpu: { manufacturer: 'Intel', brand: 'Core™ i5-1335U', cores: 12, physicalCores: 10 },
  ...over,
})

describe('lane figures', () => {
  it('say each reading in its unit', () => {
    const r = readings()
    expect(laneFigure('cpu', r)).toMatchObject({
      label: 'CPU LOAD',
      value: '42',
      unit: '%',
      level: 'none',
    })
    expect(laneFigure('mem', r)).toMatchObject({ value: '50', unit: '%' })
    expect(laneFigure('rx', r)).toMatchObject({ value: '10.0', unit: 'Mbps' })
    expect(laneFigure('tx', r)).toMatchObject({ value: '1.00', unit: 'Mbps' })
    expect(laneFigure('io', r)).toMatchObject({ value: '7', unit: '% BUSY' })
    expect(laneFigure('ping', r)).toMatchObject({ value: '14', unit: 'ms' })
  })

  it('say LOST for no echo, and nothing for what is not read', () => {
    expect(laneFigure('ping', readings({ ping: { host: 'h', ms: null } }))).toMatchObject({
      value: 'LOST',
      word: true,
      level: 'crit',
    })
    expect(
      laneFigure('io', readings({ io: { readSec: null, writeSec: null, busy: null } })),
    ).toMatchObject({
      value: '--',
      word: true,
    })
    expect(laneFigure('cpu', readings({ load: null })).value).toBe('--')
    // Found in review: a system that reads the speeds but no busy share looked as if waiting.
    expect(
      laneFigure('io', readings({ io: { readSec: 1000, writeSec: 0, busy: null } })).value,
    ).toBe('N/A')
  })

  it('mark a hot CPU', () => {
    expect(laneFigure('cpu', readings({ load: { total: 96, cores: [] } })).level).toBe('crit')
  })

  it('have their labels in the lanes’ order', () => {
    expect(Object.keys(LANE_LABELS)).toEqual(['cpu', 'mem', 'gpu', 'io', 'rx', 'tx', 'ping'])
  })

  it('write peaks and means in the lane’s unit', () => {
    expect(statText('rx', 1500)).toEqual({ value: '1.50', unit: 'Gbps' })
    expect(statText('ping', 13.6)).toEqual({ value: '14', unit: 'ms' })
    expect(statText('cpu', null)).toEqual({ value: '--', unit: '' })
  })
})

describe('slots', () => {
  it('speak for the fullest disk, the busiest program and the link', () => {
    const r = readings()
    expect(slotFigure('disk', r)).toMatchObject({
      value: '60',
      unit: '%',
      note: expect.stringContaining('C:\\'),
    })
    expect(slotFigure('top', r)).toMatchObject({
      value: 'msedge',
      word: true,
      note: '6% · 312 PROC',
    })
    expect(slotFigure('conn', r)).toMatchObject({ value: '81', unit: 'PEERS', note: '1 COUNTRIES' })
    expect(slotFigure('link', r)).toMatchObject({ value: '41.80 GB', note: '▲ 3.90 GB' })
    expect(slotFigure('uptime', r)).toMatchObject({ value: '12d 04:33:07' })
    // The address sits with the readings, the interface under it; red when the link is down.
    expect(slotFigure('address', r)).toMatchObject({
      value: '192.168.0.12',
      note: 'Ethernet',
      level: 'none',
    })
    const down = readings({ link: { iface: 'Wi-Fi', ip4: null, mac: null, state: 'down' } })
    expect(slotFigure('address', down)).toMatchObject({ value: '--.--.--.--', level: 'crit' })
  })

  it('say AC without a battery, and the charge with one', () => {
    expect(slotFigure('power', readings())).toMatchObject({ value: 'AC', note: 'NO BATTERY' })
    const low = readings({
      battery: { hasBattery: true, percent: 9, isCharging: false, acConnected: false },
    })
    expect(slotFigure('power', low)).toMatchObject({
      value: '9',
      level: 'crit',
      note: 'DISCHARGING',
    })
  })

  it('say a battery that does not tell its charge is a battery, not none', () => {
    // Found in review: it read AC · NO BATTERY while the BATT lamp was there.
    const unknown = readings({
      battery: { hasBattery: true, percent: null, isCharging: false, acConnected: false },
    })
    expect(slotFigure('power', unknown)).toMatchObject({ value: '--', note: 'DISCHARGING' })
  })

  it('count the day of the year in calendar days, summer time or not', () => {
    // Found in review: after the spring change the first hour of a day was the day before.
    const zone = process.env.TZ
    process.env.TZ = 'America/New_York'
    try {
      const at = new Date(2026, 2, 9, 0, 30).getTime()
      const rows = cardRows('date', cardReadings({ now: at }), String)
      expect(rows.find((r) => r.label === 'DAY')?.value).toBe('68 of 365')
    } finally {
      if (zone === undefined) delete process.env.TZ
      else process.env.TZ = zone
    }
  })

  it("say on the address's card what its slot has no room for, not the interface again", () => {
    const rows = cardRows('address', cardReadings(), String).map((r) => r.label)
    expect(rows).not.toContain('INTERFACE')
  })

  it('say a link that is down', () => {
    const down = readings({ link: { iface: 'Wi-Fi', ip4: null, mac: null, state: 'down' } })
    expect(slotFigure('link', down)).toMatchObject({ value: 'DOWN', level: 'crit', note: 'Wi-Fi' })
  })

  it('are ten, memory and VRAM first, five to a row in wide', () => {
    expect(SLOT_KEYS).toHaveLength(10)
    expect(SLOT_KEYS.slice(0, 2)).toEqual(['ram', 'vram'])
  })

  it('leave VRAM out where the GPU cannot be read', () => {
    expect(clusterSlots(false)).not.toContain('vram')
    expect(clusterSlots(false)).toHaveLength(9)
    expect(clusterSlots(true)).toEqual(SLOT_KEYS)
    // The tiers are measured with this shape where no GPU is read.
    expect({ lanes: clusterLanes(false).length, slots: clusterSlots(false).length }).toEqual(
      CLUSTER_BASE,
    )
    expect(hasGpu(readings())).toBe(false)
    expect(hasGpu(readings({ gpu: { ...GPU, name: null } }))).toBe(false)
    expect(hasGpu(readings({ gpu: GPU }))).toBe(true)
  })

  it('keep VRAM in 0-100, as the GPU pane does', () => {
    expect(vramPercent({ ...GPU, vramUsed: 6 * GIB })).toBe(50)
    expect(vramPercent({ ...GPU, vramUsed: 13 * GIB })).toBe(100)
    expect(vramPercent({ ...GPU, vramUsed: -1 })).toBe(0)
    expect(vramPercent({ ...GPU, vramTotal: null })).toBeNull()
    expect(vramPercent(null)).toBeNull()
  })

  it('say memory and VRAM as a share and as amounts', () => {
    expect(slotFigure('ram', readings())).toMatchObject({
      label: 'MEMORY',
      value: '50',
      unit: '%',
      meter: 0.5,
      note: '14.9 / 29.8 GiB',
      level: 'none',
    })
    expect(slotFigure('vram', readings({ gpu: GPU }))).toMatchObject({
      label: 'VRAM',
      value: '93',
      meter: expect.closeTo(0.93, 2),
      note: '11.2 / 12.0 GiB',
      level: 'warn',
    })
    expect(slotFigure('vram', readings())).toMatchObject({ value: '--', word: true })
  })
})

describe('the GPU lane', () => {
  it('says the load with no level, a busy GPU being no fault', () => {
    expect(laneFigure('gpu', readings({ gpu: { ...GPU, load: 100 } }))).toMatchObject({
      label: 'GPU LOAD',
      value: '100',
      unit: '%',
      level: 'none',
    })
    expect(laneFigure('gpu', readings())).toMatchObject({ value: '--', word: true })
  })
})

describe('the spec row', () => {
  it('names the GPU after the CPU, only where it can be read', () => {
    expect(specItems(readings()).map((item) => item.key)).not.toContain('gpu')
    const items = specItems(readings({ gpu: GPU }))
    expect(items.map((item) => item.label)).toEqual([
      'OS',
      'MANUFACTURER',
      'MODEL',
      'CHASSIS',
      'CPU',
      'GPU',
      'AWAKE',
    ])
    expect(items.find((item) => item.key === 'gpu')?.value).toBe('Stub Graphics')
  })

  it('says what the standard layout says, in its order', () => {
    const items = specItems(readings())
    expect(items.map((item) => item.label)).toEqual([
      'OS',
      'MANUFACTURER',
      'MODEL',
      'CHASSIS',
      'CPU',
      'AWAKE',
    ])
    const value = (key: string) => items.find((item) => item.key === key)?.value
    expect(value('maker')).toBe('HP')
    // The model as the system pane trims it: no maker, no chassis, two words.
    expect(value('model')).toBe('EliteBook 630')
    expect(value('chassis')).toBe('Notebook')
    // The maker in front of a brand that does not name it, then cores and threads.
    expect(value('cpu')).toBe('Intel Core™ i5-1335U · 10C/12T')
  })

  it('never names the host', () => {
    const all = specItems(readings())
      .map((item) => item.value)
      .join(' ')
    expect(all).not.toContain('someones-laptop')
    const rows = cardRows('spec', cardReadings(), (at) => String(at))
    expect(rows.map((row) => row.value).join(' ')).not.toContain('someones-laptop')
  })

  it('shows dashes until the facts are read', () => {
    const items = specItems({ ...readings(), os: null, hardware: null, cpu: null })
    expect(items.filter((item) => item.key !== 'awake').every((item) => item.value === '--')).toBe(
      true,
    )
    // AWAKE is what the user set: never unknown.
    expect(items.find((item) => item.key === 'awake')?.value).toBe('SYSTEM')
  })
})

describe('the clock and the date', () => {
  it('write the time in fixed digits and the date with its weekday', () => {
    const at = new Date(2026, 9, 10, 8, 4, 9)
    expect(clockText(at)).toBe('08:04:09')
    expect(dateText(at).value).toBe('SATURDAY 10 OCT 2026')
    expect(dateText(at).note).toMatch(/^WEEK 41 · UTC[+−]\d\d:\d\d$/)
  })

  it('number weeks as ISO 8601 does', () => {
    expect(isoWeek(new Date(2026, 0, 1))).toBe(1)
    expect(isoWeek(new Date(2027, 0, 1))).toBe(53)
    expect(isoWeek(new Date(2024, 11, 30))).toBe(1)
  })
})

const history: LaneSecond[] = Array.from({ length: 5 }, (_, i) => ({
  at: i,
  cpu: 10 + i,
  mem: 50,
  gpu: 30,
  vram: 93,
  io: 5,
  rx: 1,
  tx: 0.1,
  ping: i === 4 ? 20 : undefined,
}))

const cardReadings = (over: Partial<CardReadings> = {}): CardReadings => ({
  ...readings(),
  now: new Date(2026, 9, 10, 12).getTime(),
  tier: 'medium',
  history,
  message: clusterMessage([]),
  ...over,
})

describe('cards', () => {
  const time = (at: number) => `T${at}`

  it('have a source at the foot of every one, and no label twice', () => {
    for (const key of CARD_KEYS) {
      const rows = cardRows(key, cardReadings(), time)
      expect(rows.at(-1)?.label).toBe('FROM')
      const labels = rows.map((row) => row.label)
      expect(new Set(labels).size).toBe(labels.length)
    }
  })

  it('give a lane’s peak and mean only where the lane has no column for them', () => {
    const labels = (tier: CardReadings['tier']) =>
      cardRows('cpu', cardReadings({ tier }), time).map((row) => row.label)
    expect(labels('medium')).toContain('PEAK 60 s')
    expect(labels('wide')).not.toContain('PEAK 60 s')
  })

  it('never repeat what the row shows', () => {
    const r = cardReadings()
    const values = (key: (typeof CARD_KEYS)[number]) =>
      cardRows(key, r, time).map((row) => row.value)
    expect(values('top')).not.toContain('msedge')
    expect(values('uptime').join(' ')).not.toContain('12d')
    expect(values('cores').join(' ')).toContain('#1 80%')
  })

  it('name the adapter and its engines on the GPU card, and its shared memory on VRAM’s', () => {
    const r = cardReadings({ gpu: GPU })
    const gpu = cardRows('gpu', r, time)
    expect(gpu.find((row) => row.label === 'ADAPTER')?.value).toBe('Stub Graphics')
    expect(gpu.find((row) => row.label === 'ENGINES')?.value).toBe('3D 64% · COMPUTE 12% · COPY 3%')
    const vram = cardRows('vram', r, time)
    expect(vram.find((row) => row.label === 'SHARED')?.value).toContain('of')
    // Linux names no engines: the row is left out, not shown empty.
    const plain = cardReadings({
      gpu: { ...GPU, engines: { graphics: null, compute: null, copy: null, video: null } },
    })
    expect(cardRows('gpu', plain, time).map((row) => row.label)).not.toContain('ENGINES')
  })

  it('list every volume, marking the one shown', () => {
    const rows = cardRows('disk', cardReadings(), time)
    expect(rows.map((row) => row.label)).toEqual(['C:\\', 'D:\\', 'FROM'])
    expect(rows[0]?.value).toContain('shown')
  })

  it('list every lit lamp on the message’s card', () => {
    const message = { level: 'crit' as const, text: 'A', more: 1, all: ['A', 'B'] }
    expect(cardRows('message', cardReadings({ message }), time).map((row) => row.value)).toEqual([
      'A',
      'B',
      expect.any(String),
    ])
  })
})
