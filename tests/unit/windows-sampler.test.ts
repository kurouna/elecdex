import { describe, expect, it } from 'vitest'
import {
  computeThroughput,
  computeTopProcesses,
  parseSamplerLine,
  pickAdapter,
  type RawAdapter,
  type RawProcess,
  type Reading,
  toBattery,
  toNetInterface,
  toSwap,
} from '../../src/services/metrics/windows-sampler.js'

const net = (at: number, data: RawAdapter[]): Reading<RawAdapter> => ({ at, data })
const procs = (at: number, data: RawProcess[]): Reading<RawProcess> => ({ at, data })

describe('pickAdapter', () => {
  it('picks the busiest real adapter that is up', () => {
    const chosen = pickAdapter([
      { n: 'Loopback Pseudo-Interface 1', up: true, rx: 9e12, tx: 9e12 },
      { n: 'Ethernet', up: false, rx: 5e9, tx: 5e9 },
      { n: 'vEthernet (WSL)', up: true, rx: 1e6, tx: 1e6 },
      { n: 'Wi-Fi', up: true, rx: 2.7e8, tx: 2.3e8 },
    ])
    expect(chosen?.n).toBe('Wi-Fi')
  })

  it('returns null when nothing qualifies', () => {
    expect(pickAdapter([{ n: 'Teredo Tunneling', up: true, rx: 1, tx: 1 }])).toBeNull()
    expect(pickAdapter([])).toBeNull()
  })
})

describe('computeThroughput', () => {
  const wifi = (rx: number, tx: number): RawAdapter => ({ n: 'Wi-Fi', up: true, rx, tx })

  it('computes bytes per second between readings', () => {
    const result = computeThroughput(net(1000, [wifi(1000, 500)]), net(3000, [wifi(5000, 2500)]))
    expect(result).toEqual({
      iface: 'Wi-Fi',
      rxSec: 2000,
      txSec: 1000,
      rxTotal: 5000,
      txTotal: 2500,
    })
  })

  it('reports zero rate, not garbage, for the first reading', () => {
    const result = computeThroughput(null, net(1000, [wifi(5000, 2500)]))
    expect([result.rxSec, result.txSec]).toEqual([0, 0])
    expect(result.rxTotal).toBe(5000)
  })

  it('reports zero rather than a negative rate when a counter resets', () => {
    const result = computeThroughput(net(0, [wifi(9000, 9000)]), net(1000, [wifi(100, 100)]))
    expect([result.rxSec, result.txSec]).toEqual([0, 0])
  })

  it('reports zero when the chosen adapter was absent from the previous reading', () => {
    const result = computeThroughput(
      net(0, [{ n: 'Ethernet', up: true, rx: 1, tx: 1 }]),
      net(1000, [wifi(5000, 5000)]),
    )
    expect(result.iface).toBe('Wi-Fi')
    expect(result.rxSec).toBe(0)
  })
})

describe('computeTopProcesses', () => {
  const options = { cores: 4, totalMemory: 16_000, limit: 3 }

  it('turns CPU-time deltas into a share of all cores', () => {
    // 2s elapsed on 4 cores = 8000ms of capacity; 800ms used = 10%.
    const result = computeTopProcesses(
      procs(0, [{ id: 10, n: 'node', c: 1000, m: 1600 }]),
      procs(2000, [{ id: 10, n: 'node', c: 1800, m: 1600 }]),
      options,
    )
    expect(result.top[0]).toEqual({ pid: 10, name: 'node', cpu: 10, mem: 10 })
    expect(result.all).toBe(1)
  })

  it('groups a program by name and sums it', () => {
    const result = computeTopProcesses(
      procs(0, [
        { id: 1, n: 'chrome', c: 0, m: 0 },
        { id: 2, n: 'chrome', c: 0, m: 0 },
      ]),
      procs(1000, [
        { id: 1, n: 'chrome', c: 400, m: 800 },
        { id: 2, n: 'chrome', c: 400, m: 800 },
      ]),
      options,
    )
    expect(result.top).toHaveLength(1)
    expect(result.top[0]?.cpu).toBeCloseTo(20)
    expect(result.top[0]?.mem).toBeCloseTo(10)
  })

  it('does not credit a reused pid with the CPU time of the program that had it before', () => {
    const result = computeTopProcesses(
      procs(0, [{ id: 42, n: 'old', c: 0, m: 0 }]),
      procs(1000, [{ id: 42, n: 'new', c: 999_999, m: 0 }]),
      options,
    )
    expect(result.top[0]?.cpu).toBe(0)
  })

  it('counts a process whose CPU time is unreadable as zero, but still lists it', () => {
    const result = computeTopProcesses(
      procs(0, [{ id: 5, n: 'csrss', c: null, m: 100 }]),
      procs(1000, [{ id: 5, n: 'csrss', c: null, m: 100 }]),
      options,
    )
    expect(result.top[0]).toMatchObject({ name: 'csrss', cpu: 0 })
  })

  it('skips the Idle pseudo-process', () => {
    const result = computeTopProcesses(
      procs(0, [{ id: 0, n: 'Idle', c: 0, m: 0 }]),
      procs(1000, [{ id: 0, n: 'Idle', c: 3900, m: 0 }]),
      options,
    )
    expect(result.top).toEqual([])
  })

  it('sorts busiest first and applies the limit', () => {
    const before = ['a', 'b', 'c', 'd'].map((n, i) => ({ id: i + 1, n, c: 0, m: 0 }))
    const after = [
      { id: 1, n: 'a', c: 100, m: 0 },
      { id: 2, n: 'b', c: 900, m: 0 },
      { id: 3, n: 'c', c: 500, m: 0 },
      { id: 4, n: 'd', c: 300, m: 0 },
    ]
    const result = computeTopProcesses(procs(0, before), procs(1000, after), options)
    expect(result.top.map((p) => p.name)).toEqual(['b', 'c', 'd'])
  })
})

describe('parseSamplerLine', () => {
  it('parses a traffic reading', () => {
    expect(
      parseSamplerLine('{"t":"net","data":[{"n":"Wi-Fi","up":true,"rx":10,"tx":20}]}'),
    ).toEqual({ kind: 'net', data: [{ n: 'Wi-Fi', up: true, rx: 10, tx: 20 }] })
  })

  it('accepts the bare object ConvertTo-Json emits for a one-element array', () => {
    expect(parseSamplerLine('{"t":"net","data":{"n":"Wi-Fi","up":true,"rx":1,"tx":2}}')).toEqual({
      kind: 'net',
      data: [{ n: 'Wi-Fi', up: true, rx: 1, tx: 2 }],
    })
  })

  it('keeps an unreadable CPU time as null', () => {
    const parsed = parseSamplerLine('{"t":"proc","data":[{"id":4,"n":"System","c":null,"m":8}]}')
    expect(parsed).toEqual({ kind: 'proc', data: [{ id: 4, n: 'System', c: null, m: 8 }] })
  })

  it.each(['', 'not json', '{"t":"other","data":[]}', 'null', '42'])('ignores %j', (line) => {
    expect(parseSamplerLine(line)).toBeNull()
  })
})

describe('toNetInterface', () => {
  const loopback = { n: 'Loopback Pseudo-Interface 1', ip4: '127.0.0.1', mac: null, gw: false }
  const wifi = { n: 'Wi-Fi', ip4: '192.168.50.106', mac: 'c8:58:b3:82:28:c3', gw: true }

  it('reports the adapter holding the default route', () => {
    expect(toNetInterface([loopback, wifi])).toEqual({
      iface: 'Wi-Fi',
      ip4: '192.168.50.106',
      mac: 'c8:58:b3:82:28:c3',
      state: 'up',
    })
  })

  it('never falls back to loopback when offline', () => {
    expect(toNetInterface([loopback])).toEqual({ iface: null, ip4: null, mac: null, state: 'down' })
  })

  it('reports an addressed adapter without a route as down', () => {
    expect(toNetInterface([loopback, { ...wifi, gw: false }]).state).toBe('down')
  })
})

describe('toBattery', () => {
  it('reports a charging laptop', () => {
    // BatteryChargeStatus High (1) | Charging (8)
    expect(toBattery({ pct: 0.99, line: 'Online', status: 9 })).toEqual({
      hasBattery: true,
      percent: 99,
      isCharging: true,
      acConnected: true,
    })
  })

  it('reports a desktop on mains', () => {
    expect(toBattery({ pct: 2.55, line: 'Online', status: 128 })).toEqual({
      hasBattery: false,
      percent: null,
      isCharging: false,
      acConnected: true,
    })
  })

  it('does not invent a percentage when Windows does not know', () => {
    expect(toBattery({ pct: 2.55, line: 'Unknown', status: 255 }).percent).toBeNull()
  })
})

describe('toSwap', () => {
  it('converts megabytes and uses free memory as available', () => {
    expect(toSwap({ totalMb: 1024, usedMb: 138 }, 5000)).toEqual({
      total: 1024 * 1024 * 1024,
      used: 138 * 1024 * 1024,
      available: 5000,
      active: 0,
    })
  })
})

describe('parseSamplerLine: other readings', () => {
  it('parses interfaces, ping, power and swap', () => {
    expect(
      parseSamplerLine(
        '{"t":"iface","data":{"n":"Wi-Fi","ip4":"10.0.0.2","mac":"aa:bb","gw":true}}',
      ),
    ).toEqual({
      kind: 'iface',
      data: [{ n: 'Wi-Fi', ip4: '10.0.0.2', mac: 'aa:bb', gw: true }],
    })
    expect(parseSamplerLine('{"t":"ping","data":{"ms":6}}')).toEqual({ kind: 'ping', ms: 6 })
    expect(parseSamplerLine('{"t":"ping","data":{"ms":null}}')).toEqual({ kind: 'ping', ms: null })
    expect(
      parseSamplerLine('{"t":"power","data":{"pct":0.5,"line":"Offline","status":2}}'),
    ).toEqual({
      kind: 'power',
      data: { pct: 0.5, line: 'Offline', status: 2 },
    })
    expect(parseSamplerLine('{"t":"swap","data":{"totalMb":1024,"usedMb":138}}')).toEqual({
      kind: 'swap',
      data: { totalMb: 1024, usedMb: 138 },
    })
  })

  it('treats a missing ip4 as null rather than an empty string', () => {
    const parsed = parseSamplerLine(
      '{"t":"iface","data":[{"n":"x","ip4":null,"mac":"","gw":false}]}',
    )
    expect(parsed).toEqual({ kind: 'iface', data: [{ n: 'x', ip4: null, mac: null, gw: false }] })
  })
})
