import {
  ALL_CLEAR,
  batteryLevel,
  busiestCore,
  CLUSTER_LIMITS,
  CLUSTER_ROOM,
  clusterLamps,
  clusterMessage,
  clusterTier,
  cpuLevel,
  formatRate,
  fullestVolume,
  groupCores,
  HISTORY_SECONDS,
  heldLevel,
  LANE_IDS,
  type LampInput,
  type LaneSecond,
  laneLevel,
  lanePosition,
  laneStats,
  netPosition,
  pingLevel,
  recordSecond,
  showCores,
  uptimeClock,
} from '@shared/cluster'
import type { Battery, DiskVolume } from '@shared/metrics'
import type { Quake, QuakeState } from '@shared/quakes'
import { describe, expect, it } from 'vitest'

const second = (over: Partial<LaneSecond> = {}): LaneSecond => ({
  at: 0,
  cpu: 10,
  mem: 40,
  io: 5,
  rx: 1,
  tx: 0.1,
  ping: undefined,
  ...over,
})

const seconds = (count: number, over: Partial<LaneSecond> = {}): LaneSecond[] =>
  Array.from({ length: count }, (_, i) => second({ at: i * 1000, ...over }))

const battery = (over: Partial<Battery> = {}): Battery => ({
  hasBattery: true,
  percent: 50,
  isCharging: false,
  acConnected: false,
  ...over,
})

const volume = (mount: string, used: number, over: Partial<DiskVolume> = {}): DiskVolume => ({
  mount,
  label: '',
  fs: 'NTFS',
  kind: 'fixed',
  total: 100,
  used,
  ...over,
})

const input = (over: Partial<LampInput> = {}): LampInput => ({
  history: seconds(12),
  link: { iface: 'Ethernet', ip4: null, mac: null, state: 'up' },
  volumes: { volumes: [volume('C:\\', 50)] },
  battery: null,
  awake: false,
  quakeAlerts: false,
  quakes: null,
  topProcess: 'node',
  now: 10_000_000,
  ...over,
})

const lamp = (lamps: ReturnType<typeof clusterLamps>, id: string) =>
  lamps.find((one) => one.id === id)

describe('levels', () => {
  it('turn amber and red at the limits, not before', () => {
    expect(cpuLevel(84.9)).toBe('none')
    expect(cpuLevel(85)).toBe('warn')
    expect(cpuLevel(95)).toBe('crit')
    expect(pingLevel(149)).toBe('none')
    expect(pingLevel(150)).toBe('warn')
    expect(pingLevel(null)).toBe('crit')
  })

  it('count a battery only while it runs down', () => {
    expect(batteryLevel(battery({ percent: 20 }))).toBe('warn')
    expect(batteryLevel(battery({ percent: 10 }))).toBe('crit')
    expect(batteryLevel(battery({ percent: 5, isCharging: true }))).toBe('none')
    expect(batteryLevel(battery({ percent: 5, acConnected: true }))).toBe('none')
    expect(batteryLevel(battery({ hasBattery: false, percent: null }))).toBe('none')
    expect(batteryLevel(null)).toBe('none')
  })

  it('read no reading and no busy figure as nothing, and no echo as the worst', () => {
    expect(laneLevel('io', null)).toBe('none')
    expect(laneLevel('io', undefined)).toBe('none')
    expect(laneLevel('ping', undefined)).toBe('none')
    expect(laneLevel('ping', null)).toBe('crit')
    expect(laneLevel('rx', 9999)).toBe('none')
  })
})

describe('lanes', () => {
  it('keep the seconds shown and the one stepping in', () => {
    let history: readonly LaneSecond[] = []
    for (let i = 0; i < 100; i++) history = recordSecond(history, second({ at: i }))
    expect(history).toHaveLength(HISTORY_SECONDS + 1)
    expect(history.at(-1)?.at).toBe(99)
  })

  it('place readings on their scales', () => {
    expect(lanePosition('cpu', 50)).toBe(0.5)
    expect(lanePosition('cpu', 120)).toBe(1)
    expect(lanePosition('ping', null)).toBe(1)
    expect(lanePosition('ping', undefined)).toBe(0)
    expect(lanePosition('io', null)).toBe(0)
    expect(netPosition(0)).toBe(0)
    expect(netPosition(10_000)).toBeCloseTo(1)
    expect(netPosition(1000)).toBeLessThan(1)
    expect(netPosition(100)).toBeLessThan(netPosition(1000))
  })

  it('take peak and average over what was read, skipping the seconds without a reading', () => {
    const history = [second({ ping: 10 }), second(), second({ ping: null }), second({ ping: 30 })]
    expect(laneStats(history, 'ping')).toEqual({ peak: 30, average: 20 })
    expect(laneStats([second()], 'ping')).toEqual({ peak: null, average: null })
  })

  it('hold a level only through every one of the last readings', () => {
    const hot = seconds(CLUSTER_LIMITS.holdSeconds, { cpu: 90 })
    expect(heldLevel(hot, 'cpu', CLUSTER_LIMITS.holdSeconds)).toBe('warn')
    expect(heldLevel(hot.slice(1), 'cpu', CLUSTER_LIMITS.holdSeconds)).toBe('none')
    const dip = [...hot.slice(0, 5), second({ cpu: 50 }), ...hot.slice(6)]
    expect(heldLevel(dip, 'cpu', CLUSTER_LIMITS.holdSeconds)).toBe('none')
    const mixed = [...seconds(5, { cpu: 99 }), ...seconds(5, { cpu: 90 })]
    expect(heldLevel(mixed, 'cpu', 10)).toBe('warn')
  })

  it('count echoes, not seconds, for the ping', () => {
    const history = [second({ ping: null }), second(), second(), second({ ping: null }), second()]
    expect(heldLevel(history, 'ping', CLUSTER_LIMITS.holdEchoes)).toBe('crit')
    expect(heldLevel(history.slice(2), 'ping', CLUSTER_LIMITS.holdEchoes)).toBe('none')
  })

  it('run top to bottom as the user set them', () => {
    expect([...LANE_IDS]).toEqual(['cpu', 'mem', 'io', 'rx', 'tx', 'ping'])
  })
})

describe('figures', () => {
  it('write rates in Mbps, and in Gbps from a thousand', () => {
    expect(formatRate(8.634)).toEqual({ value: '8.63', unit: 'Mbps' })
    expect(formatRate(20.54)).toEqual({ value: '20.5', unit: 'Mbps' })
    expect(formatRate(380.2)).toEqual({ value: '380', unit: 'Mbps' })
    expect(formatRate(1867)).toEqual({ value: '1.87', unit: 'Gbps' })
  })

  it('count uptime in days and a clock', () => {
    expect(uptimeClock(12 * 86_400 + 4 * 3600 + 33 * 60 + 7)).toBe('12d 04:33:07')
    expect(uptimeClock(-5)).toBe('0d 00:00:00')
  })

  it('put many cores together at their busiest', () => {
    expect(groupCores([1, 2, 3])).toEqual([1, 2, 3])
    const many = Array.from({ length: 64 }, (_, i) => i)
    const grouped = groupCores(many)
    expect(grouped).toHaveLength(32)
    expect(grouped[0]).toBe(1)
    expect(grouped.at(-1)).toBe(63)
  })

  it('name the busiest core', () => {
    expect(busiestCore([10, 80, 30])).toEqual({ index: 1, load: 80 })
    expect(busiestCore([])).toBeNull()
  })

  it('speak for the fixed volume nearest to full', () => {
    const volumes = {
      volumes: [volume('C:\\', 50), volume('D:\\', 70), volume('E:\\', 99, { kind: 'removable' })],
    }
    expect(fullestVolume(volumes)?.mount).toBe('D:\\')
    expect(fullestVolume({ volumes: [] })).toBeNull()
    expect(fullestVolume(null)).toBeNull()
  })
})

const quake = (over: Partial<Quake> = {}): Quake => ({
  source: 'jma',
  id: 'q1',
  at: 10_000_000 - 60_000,
  reportedAt: 10_000_000,
  area: { ja: '千葉県北西部', en: 'Northwestern Chiba' },
  lat: 35.6,
  lon: 140,
  depthKm: 40,
  magnitude: 4.8,
  maxIntensity: '4',
  distant: false,
  url: 'https://example.invalid',
  ...over,
})

const quakeState = (over: Partial<QuakeState> = {}): QuakeState => ({
  active: true,
  source: 'jma',
  quakes: [],
  tsunami: null,
  fetchedAt: null,
  error: null,
  announced: [],
  ...over,
})

describe('lamps', () => {
  it('are all dark on a quiet machine, in their order', () => {
    const lamps = clusterLamps(input())
    expect(lamps.map((one) => one.id)).toEqual(['link', 'ping', 'cpu', 'mem', 'disk', 'awake'])
    expect(lamps.every((one) => one.state === 'off')).toBe(true)
  })

  it('leave out BATT without a battery and QUAKE with alerts off', () => {
    const ids = (over: Partial<LampInput>) => clusterLamps(input(over)).map((one) => one.id)
    expect(ids({ battery: battery({ hasBattery: false }) })).not.toContain('batt')
    expect(ids({ battery: battery() })).toContain('batt')
    expect(ids({ quakeAlerts: false, quakes: quakeState() })).not.toContain('quake')
    expect(ids({ quakeAlerts: true, quakes: quakeState() })).toContain('quake')
  })

  it('light CPU only after it has held, and say for how long and who', () => {
    const brief = clusterLamps(input({ history: [...seconds(9), second({ cpu: 99 })] }))
    expect(lamp(brief, 'cpu')?.state).toBe('off')
    const held = clusterLamps(input({ history: seconds(10, { cpu: 96 }) }))
    expect(lamp(held, 'cpu')).toMatchObject({ state: 'crit' })
    expect(lamp(held, 'cpu')?.text).toBe('CPU 96% · OVER 95% FOR 10 s · TOP node')
  })

  it('light LINK at once when the link is down, naming it', () => {
    const lamps = clusterLamps(
      input({ link: { iface: 'イーサネット', ip4: null, mac: null, state: 'down' } }),
    )
    expect(lamp(lamps, 'link')).toEqual({
      id: 'link',
      state: 'crit',
      text: 'LINK DOWN · イーサネット',
    })
  })

  it('light DISK for the fullest fixed volume', () => {
    const lamps = clusterLamps(input({ volumes: { volumes: [volume('C:\\', 96)] } }))
    expect(lamp(lamps, 'disk')).toMatchObject({ state: 'crit', text: 'DISK C:\\ · 96% FULL' })
  })

  it('light QUAKE for an announced, recent quake, and red for a tsunami, naming the source', () => {
    const recent = quakeState({ quakes: [quake()], announced: ['q1'] })
    const on = clusterLamps(input({ quakeAlerts: true, quakes: recent }))
    expect(lamp(on, 'quake')).toMatchObject({ state: 'warn' })
    expect(lamp(on, 'quake')?.text).toContain('JMA')
    expect(lamp(on, 'quake')?.text).toContain('NOT AN EARLY WARNING')

    const old = quakeState({ quakes: [quake({ at: 0 })], announced: ['q1'] })
    expect(lamp(clusterLamps(input({ quakeAlerts: true, quakes: old })), 'quake')?.state).toBe(
      'off',
    )
    const unannounced = quakeState({ quakes: [quake()] })
    expect(
      lamp(clusterLamps(input({ quakeAlerts: true, quakes: unannounced })), 'quake')?.state,
    ).toBe('off')
  })

  it('light AWAKE for information only', () => {
    expect(lamp(clusterLamps(input({ awake: true })), 'awake')?.state).toBe('info')
  })
})

describe('the message line', () => {
  it('says all is well with nothing lit', () => {
    expect(clusterMessage(clusterLamps(input({ awake: true })))).toEqual({
      level: 'none',
      text: ALL_CLEAR,
      more: 0,
      all: [],
    })
  })

  it('speaks for the most severe lamp, the first of equals, and counts the rest', () => {
    const lamps = clusterLamps(
      input({
        history: seconds(10, { cpu: 90, mem: 90 }),
        link: { iface: 'Wi-Fi', ip4: null, mac: null, state: 'down' },
      }),
    )
    const message = clusterMessage(lamps)
    expect(message.level).toBe('crit')
    expect(message.text).toBe('LINK DOWN · Wi-Fi')
    expect(message.more).toBe(2)
    expect(message.all[1]).toMatch(/^CPU/)
    expect(message.all[2]).toMatch(/^MEMORY/)
  })
})

describe('tiers', () => {
  // The panes the mock was checked at, as the widget sees them: less the header's 28 px.
  it('fit the sizes the mock was checked at', () => {
    expect(clusterTier(1178, 592)).toBe('wide')
    expect(clusterTier(1598, 872)).toBe('wide')
    expect(clusterTier(598, 632)).toBe('medium')
    expect(clusterTier(598, 272)).toBe('short')
    expect(clusterTier(1178, 232)).toBe('short')
    expect(clusterTier(698, 392)).toBe('short')
    expect(clusterTier(478, 472)).toBe('compact')
    expect(clusterTier(358, 672)).toBe('narrow')
    expect(clusterTier(498, 272)).toBe('narrow')
  })

  it('hold a tier a little past its line, so a drag along it does not flicker', () => {
    const { width, height } = CLUSTER_ROOM.wide
    expect(clusterTier(width - 4, height)).not.toBe('wide')
    expect(clusterTier(width - 4, height, 'wide')).toBe('wide')
    expect(clusterTier(width - 40, height, 'wide')).not.toBe('wide')
    expect(clusterTier(width + 4, height + 4, 'medium')).toBe('medium')
    expect(clusterTier(width + 40, height + 40, 'medium')).toBe('wide')
  })

  it('give the cores row only where the lanes keep their room', () => {
    expect(showCores('wide', 1178, 592)).toBe(true)
    expect(showCores('wide', 1178, 492)).toBe(false)
    expect(showCores('medium', 598, 632)).toBe(false)
    expect(showCores('medium', 598, 700)).toBe(true)
    expect(showCores('short', 1178, 272)).toBe(false)
  })
})
