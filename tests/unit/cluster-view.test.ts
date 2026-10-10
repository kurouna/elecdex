import { clusterMessage, type LaneSecond } from '@shared/cluster'
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
  dateText,
  isoWeek,
  LANE_LABELS,
  laneFigure,
  type Readings,
  SLOT_KEYS,
  slotFigure,
  specItems,
  statText,
} from '../../src/renderer/widgets/cluster/cluster-view.js'

const volume = (mount: string, used: number): DiskVolume => ({
  mount,
  label: '',
  fs: 'NTFS',
  kind: 'fixed',
  total: 500e9,
  used,
})

const readings = (over: Partial<Readings> = {}): Readings => ({
  load: { total: 42.4, cores: [10, 80, 30, 50] },
  mem: { total: 32e9, used: 16e9, free: 16e9 },
  net: { iface: 'Ethernet', rxSec: 1_250_000, txSec: 125_000, rxTotal: 41.8e9, txTotal: 3.9e9 },
  io: { readSec: 2e6, writeSec: 1e6, busy: 7 },
  ping: { host: '1.1.1.1', ms: 14 },
  link: { iface: 'Ethernet', ip4: null, mac: null, state: 'up' },
  swap: { total: 4e9, used: 1e9, available: 0, active: 0 },
  volumes: { volumes: [volume('C:\\', 300e9), volume('D:\\', 100e9)] },
  conns: { total: 81, unresolved: 2, countries: [{ code: 'JP', count: 41, lat: 0, lon: 0 }] },
  procs: { all: 312, top: [{ pid: 1, name: 'msedge', cpu: 6.4, mem: 3 }] },
  battery: { hasBattery: false, percent: null, isCharging: false, acConnected: true },
  uptime: 12 * 86_400 + 4 * 3600 + 33 * 60 + 7,
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
  })

  it('mark a hot CPU', () => {
    expect(laneFigure('cpu', readings({ load: { total: 96, cores: [] } })).level).toBe('crit')
  })

  it('have their labels in the lanes’ order', () => {
    expect(Object.keys(LANE_LABELS)).toEqual(['cpu', 'mem', 'io', 'rx', 'tx', 'ping'])
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
    expect(slotFigure('awake', r)).toMatchObject({ value: 'SYSTEM' })
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

  it('say a link that is down', () => {
    const down = readings({ link: { iface: 'Wi-Fi', ip4: null, mac: null, state: 'down' } })
    expect(slotFigure('link', down)).toMatchObject({ value: 'DOWN', level: 'crit', note: 'Wi-Fi' })
  })

  it('are eight', () => {
    expect(SLOT_KEYS).toHaveLength(8)
  })
})

describe('the spec row', () => {
  it('says what the standard layout says, in its order', () => {
    const items = specItems(readings())
    expect(items.map((item) => item.label)).toEqual([
      'TYPE',
      'OS',
      'MANUFACTURER',
      'MODEL',
      'CHASSIS',
      'CPU',
      'INTERFACE',
      'IPV4',
    ])
    const value = (key: string) => items.find((item) => item.key === key)?.value
    expect(value('type')).toBe('win')
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
    const items = specItems({ os: null, hardware: null, cpu: null, link: null })
    expect(items.find((item) => item.key === 'ip')?.value).toBe('--.--.--.--')
    expect(items.every((item) => item.value.startsWith('--'))).toBe(true)
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
