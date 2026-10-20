import { describe, expect, it } from 'vitest'
import { type EtherStub, stubEthernet } from '../../src/services/metrics/ethernet/stub'
import {
  BROADCAST_FRAME_BYTES,
  buildEtherReport,
  CONFLICT_WINDOW_MS,
  conflictEvents,
  counterHealth,
  diagnoseEthernet,
  dropsIn,
  type EtherLink,
  type EtherPoint,
  errorHealth,
  etherBuckets,
  etherCulprit,
  etherEvents,
  etherFigures,
  etherSections,
  internetWords,
  mergeEtherEvents,
  powerSuspect,
  quickDropPoints,
  quickDrops,
  recentConflict,
  speedGrade,
  speedHealth,
  speedLabel,
  stepIndex,
  toEtherPoint,
  usbPlateau,
} from '../../src/shared/ethernet'

/**
 * The Ethernet pane's judgements (shared/ethernet/): what is a fault on a cable
 * and what is only the other end, how a drop and a storm are counted, the order
 * the segments are walked in, and what a copied report leaves out. The readings
 * are the collector's own stub, so they are what the e2e tests see too.
 */

const BASE = 1_790_000_000_000

/** `seconds` of a stub case as the page's history would hold them. */
function played(
  kind: EtherStub,
  seconds: number,
  from = 0,
): { points: EtherPoint[]; link: EtherLink; best: number | null } {
  const points: EtherPoint[] = []
  let previous: { link: EtherLink; at: number } | null = null
  let link: EtherLink | null = null
  let best: number | null = null
  for (let s = from; s < from + seconds; s++) {
    const sample = stubEthernet(kind, BASE, BASE + s * 1000)
    link = sample.links[0] ?? null
    if (link === null) break
    const at = sample.probe?.at ?? BASE + s * 1000
    points.push(toEtherPoint(link, sample.probe, at, previous))
    previous = { link, at }
    if (link.state === 'up' && link.speedMbps !== null) best = Math.max(best ?? 0, link.speedMbps)
  }
  return { points, link: link as EtherLink, best }
}

function judged(kind: EtherStub, seconds: number, from = 0) {
  const { points, link, best } = played(kind, seconds, from)
  const now = points[points.length - 1]?.at ?? 0
  const figures = etherFigures(points, now, best)
  return { link, figures, diagnosis: diagnoseEthernet(link, figures), points }
}

describe('a steady gigabit link', () => {
  it('is clear, at its best, with the gateway under a millisecond', () => {
    const { diagnosis, figures, link } = judged('steady', 90)
    expect(diagnosis.cause).toBe('ok')
    expect(diagnosis.evidence).toContain('gateway <1 ms')
    expect(speedGrade(link, figures)).toBe('BEST')
    expect(etherCulprit(diagnosis)).toBeNull()
  })

  it('counts its frames and its broadcast from the counters, broadcast from bytes', () => {
    const { points } = judged('steady', 10)
    const p = points[points.length - 1] as EtherPoint
    expect(p.rxPackets).toBe(2200)
    // 22 broadcast frames a second arrive as 22 * 60 bytes.
    expect(p.broadcast).toBeCloseTo(22, 5)
    expect(BROADCAST_FRAME_BYTES).toBe(60)
    expect(p.multicast).toBeCloseTo(60, 5)
  })
})

describe('the speed', () => {
  it('a fall from what the adapter had while watched is a fault', () => {
    const { diagnosis, figures, link } = judged('downshift', 90)
    expect(figures.speed).toBe(100)
    expect(figures.bestSeen).toBe(1000)
    expect(speedHealth(link, figures)).toBe('warn')
    expect(speedGrade(link, figures)).toBe('DOWNSHIFTED')
    expect(diagnosis.cause).toBe('link')
    expect(diagnosis.evidence).toContain('fell to 100 Mb/s from 1 Gb/s')
  })

  it('a speed below the adapter’s best that never changed is the other end, and only noted', () => {
    const { points, link } = played('steady', 60)
    const slow = points.map((p) => ({ ...p, speed: 100 }))
    const figures = etherFigures(slow, slow[slow.length - 1]?.at ?? 0, 100)
    const settings = { ...(link.settings as NonNullable<EtherLink['settings']>), capMbps: 1000 }
    const partner = { ...link, speedMbps: 100, settings }
    expect(speedHealth(partner, figures)).toBe('ok')
    expect(speedGrade(partner, figures)).toBe('BELOW MAX')
    expect(diagnoseEthernet(partner, figures).cause).toBe('ok')
  })

  it('half duplex is a fault; a duplex the platform does not tell is not taken for half', () => {
    const half = judged('half', 60)
    expect(half.diagnosis.cause).toBe('link')
    expect(half.diagnosis.health).toBe('bad')
    expect(half.diagnosis.evidence).toContain('half duplex')
    const steady = judged('steady', 60)
    const unknown = { ...steady.link, duplex: null }
    expect(speedHealth(unknown, steady.figures)).toBe('ok')
  })

  it('lights the ladder to the step at or below an odd speed', () => {
    expect(stepIndex(1000)).toBe(3)
    expect(stepIndex(500)).toBe(2)
    expect(stepIndex(750)).toBe(2)
    expect(stepIndex(null)).toBe(-1)
    expect(speedLabel(2500)).toBe('2.5 Gb/s')
  })
})

describe('CRC errors', () => {
  it('need a count and a share together', () => {
    // One damaged frame in a thousand is a share of 0.1 % and nothing more.
    expect(errorHealth(1, 0.1)).toBe('ok')
    expect(errorHealth(5, 0.01)).toBe('warn')
    expect(errorHealth(20, 0.1)).toBe('bad')
    expect(errorHealth(500, 0.005)).toBe('ok')
    expect(errorHealth(0, null)).toBe('ok')
  })

  it('make the link the cause, and say the other end may be at half duplex when the speed is set by hand', () => {
    const crc = judged('crc', 120)
    expect(crc.diagnosis.cause).toBe('link')
    expect(crc.diagnosis.health).toBe('bad')
    expect(crc.diagnosis.evidence).toMatch(/^CRC errors 0\.3\d%/)
    expect(crc.diagnosis.evidence).not.toContain('half duplex')
    const mismatch = judged('mismatch', 120)
    expect(mismatch.diagnosis.evidence).toContain('the other end may be at half duplex')
  })

  it('leave the speed’s own colour alone: 1 Gb/s is not the fault', () => {
    const { figures, link } = judged('crc', 120)
    expect(speedHealth(link, figures)).toBe('ok')
  })
})

describe('drops', () => {
  const at = (s: number, state: EtherPoint['state']): EtherPoint =>
    ({ ...toEtherPoint(null, null, BASE + s * 1000, null), state }) as EtherPoint

  it('are the link down and back within a minute', () => {
    const points = [
      ...Array.from({ length: 10 }, (_, s) => at(s, 'up')),
      ...Array.from({ length: 3 }, (_, s) => at(10 + s, 'no-carrier')),
      ...Array.from({ length: 10 }, (_, s) => at(13 + s, 'up')),
    ]
    expect(dropsIn(points)).toEqual([BASE + 10_000])
  })

  it('leave out unplugging (down for longer), a switched-off adapter and gaps the pane was not looking', () => {
    const long = [
      at(0, 'up'),
      ...Array.from({ length: 90 }, (_, s) => at(1 + s, 'no-carrier')),
      at(91, 'up'),
    ]
    expect(dropsIn(long)).toEqual([])
    const disabled = [at(0, 'up'), at(1, 'disabled'), at(2, 'up')]
    expect(dropsIn(disabled)).toEqual([])
    const gap = [at(0, 'up'), at(30, 'no-carrier'), at(31, 'up')]
    expect(dropsIn(gap)).toEqual([])
  })

  it('every two minutes make the link warn then bad, and name power saving that is on', () => {
    const { diagnosis, figures, link } = judged('flapping', 600, 1)
    // Down at 60, 180, 300, 420 and 540 s: five in the ten minutes.
    expect(figures.drops).toBe(5)
    expect(diagnosis.cause).toBe('link')
    expect(diagnosis.health).toBe('bad')
    expect(diagnosis.evidence).toContain('5 drops in 10 min, power saving on')
    expect(powerSuspect(link, figures)).toBe(true)
  })

  it('a link that is down right now is LINK LOST, the link to blame', () => {
    const { diagnosis } = judged('flapping', 62, 0)
    expect(diagnosis.cause).toBe('link-lost')
    expect(etherCulprit(diagnosis)).toBe('link')
  })
})

describe('power saving', () => {
  it('is never named on a quiet link, nor when the speed is set by hand', () => {
    const steady = judged('steady', 60)
    expect(powerSuspect(steady.link, steady.figures)).toBe(false)
    const fixed = judged('mismatch', 60)
    expect(powerSuspect(fixed.link, { ...fixed.figures, drops: 3 })).toBe(false)
  })
})

describe('broadcast and multicast', () => {
  it('a broadcast flood held for half a minute makes the link the cause', () => {
    const { diagnosis, figures } = judged('storm', 60)
    expect(figures.broadcast).toBeCloseTo(2400, 0)
    expect(diagnosis.cause).toBe('link')
    expect(diagnosis.evidence).toContain('broadcast 2,400/s')
  })

  it('IPTV’s multicast is shown and never judged', () => {
    const { diagnosis, figures } = judged('multicast', 60)
    expect(figures.multicast).toBeCloseTo(1600, 0)
    expect(diagnosis.cause).toBe('ok')
  })

  it('a ten-second scan does not count: the median of half a minute is judged', () => {
    const { points, link, best } = played('steady', 60)
    const scanned = points.map((p, i) => (i >= 50 ? { ...p, broadcast: 5000 } : p))
    const figures = etherFigures(scanned, scanned[scanned.length - 1]?.at ?? 0, best)
    expect(diagnoseEthernet(link, figures).cause).toBe('ok')
  })
})

describe('the order the path is walked in', () => {
  it('a bad gateway is named before a link that is only worth watching', () => {
    const { points, link, best } = played('router', 120)
    // Two drops: the link warns; the router is bad.
    const withDrops = points.map((p, i) =>
      i === 30 || i === 70 ? { ...p, state: 'no-carrier' as const } : p,
    )
    const figures = etherFigures(withDrops, withDrops[withDrops.length - 1]?.at ?? 0, best)
    const d = diagnoseEthernet(link, figures)
    expect(d.segments.link).toBe('warn')
    expect(d.segments.gateway).toBe('bad')
    expect(d.cause).toBe('local')
  })

  it('echoes lost while the link was down blame the link, not the gateway', () => {
    const { figures } = judged('flapping', 300, 1)
    expect(figures.gateway.loss).toBe(0)
  })

  it('the way out gone while the router answers is UPSTREAM LOST', () => {
    const { diagnosis } = judged('upstream', 25)
    expect(diagnosis.cause).toBe('upstream-lost')
  })

  it('with the internet by a VPN, the internet is not judged here, and there is no call score', () => {
    const { diagnosis, link, points } = judged('vpn', 60)
    expect(link.route).toBe('vpn')
    expect(diagnosis.segments.internet).toBe('idle')
    expect(diagnosis.evidence).toContain('internet by VPN, not judged here')
    expect(points.every((p) => p.internet === undefined)).toBe(true)
  })
})

describe('what stops the judging', () => {
  it('no cable is NO CARRIER, with nothing beyond judged', () => {
    const { diagnosis } = judged('unplugged', 10)
    expect(diagnosis.cause).toBe('no-carrier')
    expect(diagnosis.segments.gateway).toBe('idle')
  })

  it('802.1X still holding the port is AUTH, not a DHCP failure', () => {
    expect(judged('auth', 10).diagnosis.cause).toBe('auth')
  })

  it('no address is waited for while a switch port may still be in its spanning tree', () => {
    const { points, link, best } = played('steady', 60)
    const bare = { ...link, ip4: null, ip6: [] }
    const early = etherFigures(points.slice(0, 20), points[19]?.at ?? 0, best)
    expect(diagnoseEthernet(bare, early).cause).toBe('waiting')
    const late = etherFigures(points, points[59]?.at ?? 0, best)
    expect(diagnoseEthernet(bare, late).cause).toBe('no-address')
  })

  it('no adapter at all is waiting, nothing to blame', () => {
    const figures = etherFigures([], 0, null)
    expect(diagnoseEthernet(null, figures).cause).toBe('waiting')
  })
})

describe('events', () => {
  it('the link going and coming back, with how long it was down', () => {
    const { points } = played('flapping', 70, 0)
    const events = etherEvents(points)
    expect(events.map((e) => e.kind)).toEqual(['connected', 'link-lost'])
    expect(events[0]?.downFor).toBe(3)
  })

  it('a fall in speed, CRC errors beginning and a broadcast flood beginning', () => {
    expect(etherEvents(played('downshift', 60).points).map((e) => e.kind)).toContain('speed')
    expect(etherEvents(played('crc', 60).points).map((e) => e.kind)).toContain('crc')
    expect(etherEvents(played('storm', 60).points).map((e) => e.kind)).toContain('broadcast')
  })

  it('drops the kernel counted while the pane was not looking, across a gap', () => {
    const { points } = played('steady', 3)
    const [a, b] = points as [EtherPoint, EtherPoint]
    const gap = [
      { ...a, carrierDowns: 4 },
      { ...b, at: a.at + 60_000, carrierDowns: 6 },
    ]
    const events = etherEvents(gap)
    expect(events.map((e) => [e.kind, e.detail])).toEqual([['unseen', '2 drops while not watched']])
  })
})

describe('the timeline', () => {
  it('a column holds the lowest speed in it, and whether the link was down', () => {
    const { points } = played('flapping', 70, 0)
    const from = points[0]?.at ?? 0
    const buckets = etherBuckets(points, from, from + 70_000, 7)
    expect(buckets[6]?.down).toBe(true)
    expect(buckets[0]?.speed).toBe(1000)
  })

  it('a column the pane was not watching is empty', () => {
    const buckets = etherBuckets([], 0, 60_000, 6)
    expect(buckets.every((b) => b.count === 0 && b.speed === null)).toBe(true)
  })
})

describe('the USB 2.0 plateau', () => {
  it('is traffic flat near 280 Mb/s for twenty seconds, nothing less', () => {
    const { points } = played('usb', 30)
    expect(usbPlateau(points)).toBe(true)
    expect(usbPlateau(played('steady', 30).points)).toBe(false)
  })
})

describe('the pane’s shape', () => {
  it('forward on a wide screen: two columns with the panel beside the path', () => {
    expect(etherSections(1700, 900)).toEqual({
      link: true,
      stacked: true,
      wide: true,
      linkWide: true,
    })
  })

  it('wide but too short to stack: one column, the panel counted in the height it takes', () => {
    // 1200 x 500: beside the path the panel would fit, but one column draws it above the
    // lower part, where its 140 px leave the timeline no room.
    expect(etherSections(1200, 500)).toEqual({
      link: false,
      stacked: false,
      wide: false,
      linkWide: true,
    })
    expect(etherSections(1200, 600).link).toBe(true)
  })

  it('in the network preset’s slot: the panel as a tab, the rest as tabs', () => {
    const s = etherSections(620, 455)
    expect(s.stacked).toBe(false)
    expect(s.link).toBe(false)
  })

  it('narrow and tall: the panel stands its ladder above its figures, and leaves the timeline room', () => {
    const s = etherSections(420, 1050)
    expect(s.linkWide).toBe(false)
    expect(s.stacked).toBe(false)
    expect(s.link).toBe(true)
  })
})

describe('the copied report', () => {
  it('names the verdict and the link, and never a MAC or an IPv6 address', () => {
    const { diagnosis, figures, link, points } = judged('crc', 60)
    const withSix = { ...link, ip6: ['2001:db8::31'] }
    const text = buildEtherReport({
      now: BASE,
      link: withSix,
      diagnosis,
      lastMinute: figures,
      lastFive: figures,
      mos: 4.4,
      events: etherEvents(points),
      mask: false,
    })
    expect(text).toContain('elecdex Ethernet report')
    expect(text).toContain('LINK (bad)')
    expect(text).toContain('192.0.2.31')
    expect(text).not.toContain('02:00:5e')
    expect(text).not.toContain('2001:db8')
  })

  it('masked, hides the addresses too', () => {
    const { diagnosis, figures, link } = judged('steady', 30)
    const text = buildEtherReport({
      now: BASE,
      link,
      diagnosis,
      lastMinute: figures,
      lastFive: figures,
      mos: null,
      events: [],
      mask: true,
    })
    expect(text).not.toContain('192.0.2.31')
    expect(text).toContain('192.0.x.x')
  })
})

describe('drops inside a second', () => {
  /** Two up readings a second apart, the system's count rising by `by` between them. */
  function quick(by: number): EtherPoint[] {
    const { points } = played('steady', 3)
    const [a, b, c] = points as [EtherPoint, EtherPoint, EtherPoint]
    return [
      { ...a, carrierDowns: 0 },
      { ...b, carrierDowns: by },
      { ...c, carrierDowns: by },
    ]
  }

  it('are counted from the system’s count when both readings found the link up', () => {
    const points = quick(2)
    expect(quickDrops(points[0] as EtherPoint, points[1] as EtherPoint)).toBe(2)
    expect(dropsIn(points)).toEqual([points[1]?.at, points[1]?.at])
  })

  it('are not counted across a reading that saw the link down: that one counts already', () => {
    const points = quick(1)
    const down = { ...(points[1] as EtherPoint), state: 'no-carrier' as const }
    expect(quickDrops(points[0] as EtherPoint, down)).toBe(0)
    expect(quickDrops(points[0] as EtherPoint, { ...down, state: 'up', carrierDowns: null })).toBe(
      0,
    )
  })

  it('are logged as a link lost for no time, said how many', () => {
    const events = etherEvents(quick(3))
    const lost = events.find((e) => e.kind === 'link-lost')
    expect(lost?.detail).toBe('down and back inside a second (3 times)')
    expect(lost?.downFor).toBe(0)
    expect(etherEvents(quick(1)).find((e) => e.kind === 'link-lost')?.detail).toBe(
      'down and back inside a second',
    )
  })
})

describe('an address conflict', () => {
  it('is the verdict while it is recent, blamed on the link, never naming the address', () => {
    const { diagnosis, link } = judged('conflict', 20)
    expect(diagnosis.cause).toBe('address-conflict')
    expect(diagnosis.health).toBe('bad')
    // The verdict is drawn, carded and copied whatever MASK says: the address stays out of it.
    expect(diagnosis.evidence).toContain('this adapter’s address')
    expect(diagnosis.evidence).not.toContain(link.ip4 as string)
    expect(etherCulprit(diagnosis)).toBe('link')
    expect(judged('conflict', 4).diagnosis.cause).toBe('ok')
  })

  it('stops being the verdict once older than the window', () => {
    const { link } = judged('conflict', 20)
    const at = link.conflicts[0] as number
    expect(recentConflict(link, at + CONFLICT_WINDOW_MS)).toBe(at)
    expect(recentConflict(link, at + CONFLICT_WINDOW_MS + 1)).toBeNull()
    expect(recentConflict(link, at - 1)).toBeNull()
  })

  it('is an event, merged newest first with the pane’s own', () => {
    const { link, points } = judged('conflict', 20)
    const logged = conflictEvents(link)
    expect(logged.map((e) => e.kind)).toEqual(['conflict'])
    expect(conflictEvents(null)).toEqual([])
    const merged = mergeEtherEvents(etherEvents(points), logged)
    expect(merged.map((e) => e.at)).toEqual([...merged.map((e) => e.at)].sort((a, b) => b - a))
    expect(merged.some((e) => e.kind === 'conflict')).toBe(true)
  })
})

describe('what the review found', () => {
  it('a drop inside a second marks its column down, as one the readings saw', () => {
    const { points } = played('steady', 4)
    const [a, b, c, d] = points as [EtherPoint, EtherPoint, EtherPoint, EtherPoint]
    const quick = [
      { ...a, carrierDowns: 0 },
      { ...b, carrierDowns: 0 },
      { ...c, carrierDowns: 1 },
      { ...d, carrierDowns: 1 },
    ]
    expect([...quickDropPoints(quick)]).toEqual([quick[2]])
    // Across a gap the rise is the drops while not watched, never one inside a second.
    const gap = [quick[1] as EtherPoint, { ...(quick[2] as EtherPoint), at: b.at + 60_000 }]
    expect(quickDropPoints(gap).size).toBe(0)
    const buckets = etherBuckets(quick, a.at - 500, d.at + 500, 4)
    expect(buckets.map((x) => x.down)).toEqual([false, false, true, false])
  })

  it('a column whose speeds are unknown has no speed, not an infinite one', () => {
    const { points } = played('steady', 2)
    const blind = points.map((p) => ({ ...p, speed: null }))
    const [bucket] = etherBuckets(
      blind,
      (blind[0] as EtherPoint).at - 500,
      (blind[1] as EtherPoint).at + 500,
      1,
    )
    expect(bucket?.speed).toBeNull()
  })

  it('a silent internet with no gateway asked is not the upstream lost', () => {
    const { points, link, best } = played('steady', 20)
    const noGateway = points.map((p) => ({ ...p, gateway: undefined, internet: null }))
    const now = (noGateway[noGateway.length - 1] as EtherPoint).at
    const figures = etherFigures(noGateway, now, best)
    expect(diagnoseEthernet(link, figures).cause).not.toBe('upstream-lost')
    expect(etherEvents(noGateway).map((e) => e.kind)).not.toContain('upstream-lost')
    // With the gateway answering it still is.
    const answering = points.map((p) => ({ ...p, gateway: 1, internet: null }))
    expect(diagnoseEthernet(link, etherFigures(answering, now, best)).cause).toBe('upstream-lost')
  })

  it('conflicts: one row a moment, and only from the window the log covers', () => {
    const { link } = judged('conflict', 20)
    const at = link.conflicts[0] as number
    const twice = { ...link, conflicts: [at, at, at - 7_200_000] }
    expect(conflictEvents(twice).map((e) => e.at)).toEqual([at, at - 7_200_000])
    expect(conflictEvents(twice, at - 3_600_000).map((e) => e.at)).toEqual([at])
    expect(new Set(conflictEvents(twice).map((e) => e.key)).size).toBe(2)
  })

  it('a trouble counter needs a count and a share, as CRC errors do', () => {
    // One damaged frame a minute on an idle link: a large share, but no count.
    expect(counterHealth(0.1, 10)).toBe('ok')
    // Two a minute in 1,000 frames: 20 in ten minutes at 0.2 %.
    expect(counterHealth(2, 1000)).toBe('bad')
    expect(counterHealth(1, 5000)).toBe('warn')
    expect(counterHealth(1, 100_000)).toBe('ok')
  })
})

describe('the third review', () => {
  it('with no way out known, says so: route unknown while echoes come back, no default route when none do', () => {
    const { points, link, best } = played('steady', 20)
    const now = (points[points.length - 1] as EtherPoint).at
    const lost = { ...link, route: null }
    // The internet's echo is recorded with no route known (shown, never judged).
    const probe = { at: now, host: '192.0.2.53', internet: 19, gateways: [] }
    expect(toEtherPoint(lost, probe, now, null).internet).toBe(19)
    expect(toEtherPoint({ ...link, route: 'wifi' }, probe, now, null).internet).toBeUndefined()
    const answering = etherFigures(points, now, best)
    const d = diagnoseEthernet(lost, answering)
    expect(d.evidence).toContain('route unknown')
    expect(d.evidence).not.toContain('this adapter')
    expect(d.segments.internet).toBe('idle')
    const silent = points.map((p) => ({ ...p, internet: undefined }))
    expect(diagnoseEthernet(lost, etherFigures(silent, now, best)).evidence).toContain(
      'no default route on this machine',
    )
    expect(internetWords('vpn', answering)).toBe('internet by VPN, not judged here')
  })

  it('a CRC event needs a count and a share, as the verdict: a fast link’s few is none', () => {
    const { points } = played('steady', 70)
    // Six damaged frames in a minute among 2,200 a second: a count, but a share of 0.005 %.
    const few = points.map((p, i) => ({ ...p, errors: i >= 60 && i < 66 ? 1 : 0 }))
    expect(etherEvents(few).map((e) => e.kind)).not.toContain('crc')
    expect(etherEvents(played('crc', 70).points).map((e) => e.kind)).toContain('crc')
  })

  it('a storm before a drop says nothing of after it, and one going on is logged again', () => {
    const { points } = played('storm', 80)
    const [first] = points as [EtherPoint]
    const down = points.map((p, i) =>
      i >= 35 && i < 40 ? { ...p, state: 'no-carrier' as const, broadcast: null } : p,
    )
    const storms = etherEvents(down).filter((e) => e.kind === 'broadcast')
    // Once before the drop, and again 30 s after the link is back - not straight away.
    expect(storms).toHaveLength(2)
    const again = storms[0] as { at: number }
    expect(again.at - first.at).toBeGreaterThanOrEqual(69_000 - 1000)
  })
})

describe('what the reviews of the third found', () => {
  /** A minute on a machine with no default route: the gateway answers, the internet never. */
  function noRoute(): { points: EtherPoint[]; link: EtherLink; best: number | null } {
    const { points, link, best } = played('steady', 60)
    return {
      points: points.map((p) => ({ ...p, route: null, internet: null })),
      link: { ...link, route: null },
      best,
    }
  }

  it('with no route, no UPSTREAM LOST in the log nor in the verdict, and no loss drawn', () => {
    const { points, link, best } = noRoute()
    const now = (points[points.length - 1] as EtherPoint).at
    expect(etherEvents(points).map((e) => e.kind)).not.toContain('upstream-lost')
    const d = diagnoseEthernet(link, etherFigures(points, now, best))
    expect(d.cause).not.toBe('upstream-lost')
    expect(d.evidence).toContain('no default route')
    const [bucket] = etherBuckets(points, (points[0] as EtherPoint).at - 500, now + 500, 1)
    expect(bucket?.loss).toBeNull()
  })

  it('with no route, the internet’s echo never judges this machine’s own upload', () => {
    const { points, best } = played('steady', 60)
    // Upload and delay rising together, on echoes recorded with no route known.
    const dragged = points.map((p, i) => ({ ...p, route: null, up: i * 50_000, internet: 10 + i }))
    const now = (dragged[dragged.length - 1] as EtherPoint).at
    expect(etherFigures(dragged, now, best).uploadDrag).toBeNull()
  })

  it('once the route is back, the internet’s figures are this adapter’s echoes alone', () => {
    const { points, best } = played('steady', 60)
    const mixed = points.map((p, i) =>
      i < 50
        ? { ...p, route: null, internet: 300 }
        : { ...p, route: 'default' as const, internet: 20 },
    )
    const now = (mixed[mixed.length - 1] as EtherPoint).at
    const f = etherFigures(mixed, now, best)
    expect(f.internet.received).toBe(10)
    expect(f.internet.median).toBe(20)
  })
})
