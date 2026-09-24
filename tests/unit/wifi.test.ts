import { describe, expect, it } from 'vitest'
import {
  availability,
  bandOf,
  bucketize,
  buildReport,
  channelOf,
  cipherLabel,
  counterDelta,
  culpritStation,
  derivedEvents,
  diagnose,
  freqOf,
  gatewayEcho,
  isDfs,
  latencySpikes,
  logEvents,
  maskAddress,
  maskName,
  mergeEvents,
  mosEstimate,
  mosOf,
  pathFigures,
  perMinute,
  primaryLink,
  probeStats,
  pushPoint,
  RETRY_FRAMES_PER_SECOND,
  regularInterval,
  retryShare,
  SECTION_HEIGHTS,
  securityLabel,
  signalBars,
  signalGrade,
  standardLabel,
  standardOfPhy,
  toPoint,
  WIDE_FROM,
  WIFI_HISTORY_MS,
  type WifiCounters,
  type WifiLink,
  type WifiPoint,
  type WifiProbe,
  wifiSections,
  windowMs,
} from '../../src/shared/wifi'

/**
 * The Wi-Fi pane's judgements (shared/wifi.ts): the radio's numbers, the
 * statistics over a stretch of echoes, the diagnosis of where a connection
 * fails, the events the history shows, and the report the copy button writes.
 */

const counters = (tx: number, retries: number): WifiCounters => ({
  txFrames: tx,
  rxFrames: tx * 3,
  retries,
  multiRetries: 0,
  failed: 0,
  ackFailures: 0,
  fcsErrors: 0,
  decryptFailures: 0,
  handshakeFailures: 0,
})

const link = (over: Partial<WifiLink> = {}): WifiLink => ({
  id: 'g1',
  adapter: 'Wireless Adapter',
  state: 'connected',
  ssid: 'LAB',
  standard: 'ax',
  freqMhz: 5300,
  channel: 60,
  widthMhz: 80,
  rssi: -55,
  noise: null,
  quality: 90,
  rxMbps: 1200,
  txMbps: 960,
  radios: [],
  security: 'WPA3-Personal',
  cipher: 'GCMP256',
  internet: 'internet',
  metered: false,
  backgroundScan: true,
  streamingMode: false,
  mac: '02:00:5e:10:00:01',
  ip4: '192.0.2.23',
  prefix4: 24,
  ip6: [],
  gateway: '192.0.2.1',
  dns: ['192.0.2.1'],
  mtu: 1500,
  dhcp: true,
  leaseSeconds: 3600,
  rxSec: 100_000,
  txSec: 20_000,
  counters: counters(1000, 50),
  ...over,
})

const point = (at: number, over: Partial<WifiPoint> = {}): WifiPoint => ({
  at,
  state: 'connected',
  rssi: -55,
  quality: 90,
  rxMbps: 1200,
  txMbps: 960,
  retry: 3,
  frames: 300,
  retries: 9,
  gateway: 2,
  internet: 20,
  up: 20_000,
  down: 100_000,
  freqMhz: 5300,
  channel: 60,
  internetState: 'internet',
  ...over,
})

/** A minute of seconds ending at `end`, shaped by `f`. */
const minute = (end: number, f: (i: number) => Partial<WifiPoint> = () => ({})): WifiPoint[] =>
  Array.from({ length: 60 }, (_, i) => point(end - (59 - i) * 1000, f(i)))

describe('the radio', () => {
  it('turns frequencies into bands and channels, and back', () => {
    expect([bandOf(2412), channelOf(2412)]).toEqual(['2.4', 1])
    expect(channelOf(2484)).toBe(14)
    expect([bandOf(5300), channelOf(5300)]).toEqual(['5', 60])
    expect([bandOf(5955), channelOf(5955)]).toEqual(['6', 1])
    expect(channelOf(5935)).toBe(2)
    expect(bandOf(900)).toBeNull()
    expect(bandOf(null)).toBeNull()
    for (const [ch, band] of [
      [1, '2.4'],
      [149, '5'],
      [37, '6'],
    ] as const) {
      expect(channelOf(freqOf(ch, band))).toBe(ch)
    }
  })

  it('marks the 5 GHz channels radar can take away', () => {
    expect(isDfs(60, '5')).toBe(true)
    expect(isDfs(144, '5')).toBe(true)
    expect(isDfs(36, '5')).toBe(false)
    expect(isDfs(149, '5')).toBe(false)
    expect(isDfs(60, '6')).toBe(false)
  })

  it('names the standard as people know it', () => {
    expect(standardOfPhy(10)).toBe('ax')
    expect(standardOfPhy(11)).toBe('be')
    expect(standardOfPhy(99)).toBeNull()
    expect(standardLabel('ax', '5')).toBe('Wi-Fi 6')
    expect(standardLabel('ax', '6')).toBe('Wi-Fi 6E')
    expect(standardLabel('be', '6')).toBe('Wi-Fi 7')
    expect(standardLabel('g', '2.4')).toBe('802.11g')
  })

  it('grades a signal against what a call needs', () => {
    expect([-50, -60, -70, -80].map(signalGrade)).toEqual(['excellent', 'good', 'fair', 'weak'])
    expect(signalGrade(null)).toBe('none')
    expect([-50, -60, -70, -80, -90].map(signalBars)).toEqual([4, 3, 2, 1, 0])
  })

  it('spells security the way the settings do', () => {
    expect(securityLabel('RsnaPsk')).toBe('WPA2-Personal')
    expect(securityLabel('Wpa3Sae')).toBe('WPA3-Personal')
    expect(securityLabel('Unknown')).toBeNull()
    expect(securityLabel('SomethingNew')).toBe('SomethingNew')
    expect(cipherLabel('Ccmp')).toBe('CCMP')
    expect(cipherLabel('None')).toBe('none')
  })
})

describe('retries', () => {
  it('are a share of the frames sent, and only once enough were sent', () => {
    expect(retryShare(counterDelta(counters(0, 0), counters(1000, 100)))).toBe(10)
    // An idle link: a few dozen frames, half of them retried, which says nothing.
    // Measured on an Intel AX211 at -55 dBm: 54 % (the pane blamed the radio for it).
    expect(retryShare(counterDelta(counters(0, 0), counters(40, 22)))).toBeNull()
    expect(retryShare({ frames: RETRY_FRAMES_PER_SECOND, retries: 5 })).toBe(5)
  })

  it('are not told across a counter reset', () => {
    expect(counterDelta(counters(5000, 100), counters(10, 0))).toBeNull()
    expect(counterDelta(null, counters(10, 0))).toBeNull()
  })

  it('leave the radio unblamed while the link idles', () => {
    const idle = minute(60_000, () => ({ frames: 40, retries: 22, retry: null }))
    const f = pathFigures(idle, 60_000)
    expect(f.retry).toBeNull()
    expect(diagnose(link(), f).cause).toBe('ok')
  })

  it('climb per minute from the mark a minute back', () => {
    const marks = [
      { at: 0, counters: counters(0, 0) },
      { at: 30_000, counters: counters(500, 20) },
      { at: 60_000, counters: counters(1200, 60) },
    ]
    expect(perMinute(marks)?.txFrames).toBe(1200)
    expect(perMinute(marks)?.retries).toBe(60)
    expect(perMinute(marks.slice(2))).toBeNull()
    const reset = [
      { at: 0, counters: counters(5000, 100) },
      { at: 60_000, counters: counters(10, 0) },
    ]
    expect(perMinute(reset)).toBeNull()
  })
})

describe('points', () => {
  const probe = (over: Partial<WifiProbe> = {}): WifiProbe => ({
    at: 1000,
    host: '192.0.2.53',
    internet: 20,
    gateways: [{ link: 'g1', address: '192.0.2.1', rtt: 2 }],
    ...over,
  })

  it('say a gateway that was not asked was not asked, not lost', () => {
    expect(toPoint(link(), probe({ gateways: [] }), 1000, null).gateway).toBe(undefined)
    expect(
      toPoint(link(), probe({ gateways: [{ link: 'g1', address: 'a', rtt: null }] }), 1000, null)
        .gateway,
    ).toBeNull()
    expect(toPoint(link(), null, 1000, null).internet).toBe(undefined)
  })

  it("take each adapter's own gateway echo, never another's", () => {
    const both = probe({
      gateways: [
        { link: 'g1', address: '192.0.2.1', rtt: 2 },
        { link: 'g2', address: '192.0.2.129', rtt: 9 },
      ],
    })
    expect(toPoint(link(), both, 1000, null).gateway).toBe(2)
    expect(toPoint(link({ id: 'g2' }), both, 1000, null).gateway).toBe(9)
    expect(toPoint(link({ id: 'g3' }), both, 1000, null).gateway).toBe(undefined)
    expect(gatewayEcho(both, 'g2')).toBe(9)
    expect(gatewayEcho(null, 'g2')).toBe(undefined)
  })

  it('take retries only against the same adapter', () => {
    const before = link({ counters: counters(0, 0) })
    const after = link({ counters: counters(1000, 100) })
    expect(toPoint(after, probe(), 2000, before).retry).toBe(10)
    expect(
      toPoint(after, probe(), 2000, link({ id: 'other', counters: counters(0, 0) })).retry,
    ).toBe(null)
  })

  it('are kept an hour, once each', () => {
    let points: WifiPoint[] = []
    points = pushPoint(points, point(1000))
    points = pushPoint(points, point(1000))
    expect(points).toHaveLength(1)
    points = pushPoint(points, point(1000 + WIFI_HISTORY_MS + 1))
    expect(points.map((p) => p.at)).toEqual([1000 + WIFI_HISTORY_MS + 1])
  })

  it('follow the chosen adapter, else the connected one', () => {
    const a = link({ id: 'a', state: 'disconnected' })
    const b = link({ id: 'b' })
    expect(primaryLink([a, b], null)?.id).toBe('b')
    expect(primaryLink([a, b], 'a')?.id).toBe('a')
    expect(primaryLink([], null)).toBeNull()
  })

  it('know their windows', () => {
    expect(windowMs('1m')).toBe(60_000)
    expect(windowMs('60m')).toBe(3_600_000)
    expect(windowMs('nonsense')).toBe(300_000)
  })
})

describe('echo statistics', () => {
  it('count losses, and leave out what was not asked', () => {
    const s = probeStats([10, null, 30, undefined, 20])
    expect(s.sent).toBe(4)
    expect(s.received).toBe(3)
    expect(s.loss).toBe(25)
    expect([s.min, s.median, s.max]).toEqual([10, 20, 30])
    // |30-10| and |20-30|, averaged.
    expect(s.jitter).toBe(15)
    expect(probeStats([]).loss).toBe(0)
  })

  it('give a call score that falls with delay and loss', () => {
    expect(mosEstimate(20, 2, 0)).toBeGreaterThan(4.3)
    expect(mosEstimate(300, 40, 0)).toBeLessThan(mosEstimate(100, 10, 0))
    expect(mosEstimate(40, 5, 10)).toBeLessThan(3.8)
    expect(mosEstimate(5000, 500, 100)).toBe(1)
    expect(mosOf(probeStats([]))).toBeNull()
    expect(mosOf(probeStats([null, null]))).toBe(1)
  })
})

describe('diagnose', () => {
  const now = 100_000
  const judge = (points: WifiPoint[], over: Partial<WifiLink> = {}) =>
    diagnose(link(over), pathFigures(points, now))

  it('names the station to single out, and none while all is well', () => {
    expect(culpritStation(judge(minute(now)))).toBeNull()
    expect(culpritStation(judge(minute(now, (i) => (i >= 54 ? { internet: null } : {}))))).toBe(
      'internet',
    )
    expect(culpritStation(judge(minute(now, () => ({ rssi: -80 }))))).toBe('radio')
    expect(culpritStation(judge(minute(now, (i) => ({ gateway: i % 5 === 0 ? null : 3 }))))).toBe(
      'gateway',
    )
    expect(culpritStation(judge(minute(now), { state: 'off' }))).toBe('radio')
    expect(culpritStation(diagnose(null, pathFigures([], now)))).toBeNull()
  })

  it('says so when all is well', () => {
    const d = judge(minute(now))
    expect(d.cause).toBe('ok')
    expect(d.segments).toEqual({ pc: 'ok', radio: 'ok', gateway: 'ok', internet: 'ok' })
  })

  it('puts the link state first', () => {
    expect(diagnose(null, pathFigures([], now)).cause).toBe('waiting')
    expect(judge(minute(now), { state: 'off' }).cause).toBe('off')
    expect(judge(minute(now), { state: 'disconnected' }).cause).toBe('disconnected')
    expect(judge(minute(now), { internet: 'constrained' }).cause).toBe('sign-in')
  })

  it('tells the way out gone from a lossy hop: the gateway still answers', () => {
    const tunnel = minute(now, (i) => (i >= 54 ? { internet: null } : {}))
    const d = judge(tunnel)
    expect(d.cause).toBe('upstream-lost')
    expect(d.health).toBe('bad')
  })

  it('blames the radio before the hops after it', () => {
    const weak = minute(now, () => ({ rssi: -80, gateway: 90, internet: 300 }))
    expect(judge(weak).cause).toBe('radio')
    const retrying = minute(now, () => ({ frames: 300, retries: 150 }))
    expect(judge(retrying).cause).toBe('radio')
  })

  it('blames the hop to the access point when the gateway is lossy', () => {
    const lossy = minute(now, (i) => ({ gateway: i % 5 === 0 ? null : 3 }))
    const d = judge(lossy)
    expect(d.cause).toBe('local')
    expect(d.evidence).toContain('gateway')
  })

  it('does not blame a gateway that simply does not answer pings', () => {
    const silent = minute(now, () => ({ gateway: null }))
    const d = judge(silent)
    expect(d.segments.gateway).toBe('idle')
    expect(d.cause).toBe('ok')
  })

  it('blames the way beyond when only the internet suffers', () => {
    const far = minute(now, (i) => ({ internet: 150 + (i % 2) * 120 }))
    const d = judge(far)
    expect(d.cause).toBe('upstream')
    expect(d.segments.gateway).toBe('ok')
  })

  it('blames the machine when its own upload drags the delay along', () => {
    const upload = minute(now, (i) => ({ up: 200_000 + i * 20_000, internet: 30 + i * 3 }))
    const d = judge(upload)
    expect(d.cause).toBe('own-upload')
    expect(d.segments.pc).toBe('warn')
  })
})

describe('events', () => {
  it('see a new access point in a change of channel on a link that stayed up', () => {
    const events = derivedEvents([point(0), point(1000, { channel: 149 })])
    expect(events.map((e) => [e.kind, e.detail])).toEqual([['handover', 'ch 60 → 149']])
  })

  it('see the way out go and come back', () => {
    const points = [0, 1, 2, 3, 4, 5].map((i) =>
      point(i * 1000, { internet: i >= 1 && i <= 4 ? null : 20 }),
    )
    expect(derivedEvents(points).map((e) => [e.kind, e.at])).toEqual([
      ['upstream-lost', 1000],
      ['upstream-back', 5000],
    ])
  })

  it('see a sign-in page appear, once', () => {
    const points = [0, 1, 2].map((i) =>
      point(i * 1000, { internetState: i === 0 ? 'internet' : 'constrained' }),
    )
    expect(derivedEvents(points).map((e) => e.kind)).toEqual(['sign-in'])
  })

  it('claim nothing across a gap the pane was not seen', () => {
    expect(derivedEvents([point(0), point(60_000, { channel: 149 })])).toEqual([])
  })

  it('from the log, say how long each drop lasted', () => {
    const marks = logEvents([
      { key: 'a', at: 0, kind: 'disconnected', ssid: 'LAB', code: 0, reason: 'driver' },
      { key: 'b', at: 14_000, kind: 'connected', ssid: 'LAB', code: null, reason: '' },
    ])
    expect(marks.find((e) => e.key === 'a')?.downFor).toBe(14)
    const merged = mergeEvents(marks, derivedEvents([point(5000), point(6000, { channel: 1 })]))
    expect(merged.map((e) => e.kind)).toEqual(['connected', 'handover', 'disconnected'])
  })

  it('find a steady beat, and none in noise', () => {
    const halfHour = 1_800_000
    expect(regularInterval([0, 1, 2, 3].map((i) => i * halfHour + (i % 2) * 20_000))).toBeCloseTo(
      halfHour,
      -5,
    )
    expect(regularInterval([0, 60_000, 900_000, 1_000_000])).toBeNull()
    expect(regularInterval([0, halfHour, 2 * halfHour])).toBeNull()
  })

  it('find latency spikes, one per spike', () => {
    const points = Array.from({ length: 30 }, (_, i) =>
      point(i * 1000, { internet: i === 10 || i === 11 || i === 25 ? 200 : 20 }),
    )
    expect(latencySpikes(points)).toEqual([10_000, 25_000])
  })
})

describe('the last day', () => {
  const H = 3_600_000
  const ev = (at: number, kind: 'connected' | 'disconnected' | 'failed') => ({
    key: `${kind}${at}`,
    at,
    kind,
    ssid: null,
    code: null,
    reason: '',
  })

  it('is unknown before the log begins, then up and down by its events', () => {
    const now = 24 * H
    const day = availability(
      [ev(2 * H, 'connected'), ev(5 * H, 'disconnected'), ev(6 * H, 'connected')],
      now,
    )
    expect(day.map((s) => [s.state, s.from / H, s.to / H])).toEqual([
      ['unknown', 0, 2],
      ['up', 2, 5],
      ['down', 5, 6],
      ['up', 6, 24],
    ])
  })

  it('starts from what held before the day, and a failed attempt changes nothing', () => {
    const now = 30 * H
    const day = availability(
      [ev(3 * H, 'connected'), ev(10 * H, 'failed'), ev(20 * H, 'disconnected')],
      now,
    )
    expect(day.map((s) => [s.state, s.from / H, s.to / H])).toEqual([
      ['up', 6, 20],
      ['down', 20, 30],
    ])
  })
})

describe('the timeline', () => {
  it('draws a column per stretch, with its spread and its loss', () => {
    const points = [
      point(0, { internet: 10 }),
      point(1000, { internet: 50 }),
      point(2000, { internet: null }),
    ]
    const [first, second] = bucketize(points, 0, 4000, 2)
    expect(first?.internet).toEqual({ min: 10, mid: 30, max: 50 })
    expect(first?.loss).toBe(0)
    expect(second?.loss).toBe(100)
  })

  it('leaves a gap a gap, and says it held nothing', () => {
    const [empty, full] = bucketize([point(3000)], 0, 4000, 2)
    expect(empty).toMatchObject({ count: 0, rssi: null, internet: null, loss: null, up: null })
    expect(full?.count).toBe(1)
  })
})

describe('the pane shape', () => {
  it('stacks everything when brought forward, and tabs it in the network preset', () => {
    // The network preset at 1080p: the Wi-Fi pane over the socket table, half and
    // half, leaves its body about 620 by 455.
    expect(wifiSections(620, 455)).toEqual({
      radio: false,
      radioWide: true,
      stacked: false,
      wide: false,
    })
    const h = SECTION_HEIGHTS
    const all = h.header + h.path + h.radio + h.timeline + h.log + h.detail
    // Brought forward on a wide screen, two columns; the same height narrower, one.
    expect(wifiSections(1700, all)).toEqual({
      radio: true,
      radioWide: true,
      stacked: true,
      wide: true,
    })
    expect(wifiSections(WIDE_FROM - 1, all).wide).toBe(false)
    expect(wifiSections(380, 700).radioWide).toBe(false)
  })
})

describe('the report', () => {
  const report = (mask: boolean) => {
    const points = minute(100_000)
    return buildReport({
      now: 100_000,
      link: link({ ssid: 'HOME-NETWORK' }),
      diagnosis: diagnose(link(), pathFigures(points, 100_000)),
      lastMinute: pathFigures(points, 100_000),
      lastFive: pathFigures(points, 100_000, 300_000),
      mos: 4.4,
      events: [],
      mask,
    })
  }

  it('says the verdict, the call score and the figures', () => {
    const text = report(false)
    expect(text).toContain('HOME-NETWORK')
    expect(text).toContain('CLEAR')
    expect(text).toContain('MOS ≈ 4.4')
    expect(text).toContain('192.0.2.23/24')
    expect(text).toMatch(/internet +median 20ms/)
  })

  it('masked, gives away neither the name nor the addresses', () => {
    const text = report(true)
    expect(text).not.toContain('HOME-NETWORK')
    expect(text).toContain(maskName('HOME-NETWORK'))
    expect(text).not.toContain('192.0.2.23')
    expect(text).not.toContain('192.0.2.1 ')
    expect(maskAddress('192.0.2.23')).toBe('192.0.x.x')
    expect(maskName('ab')).toBe('••')
  })
})
