import type { ChildProcess, ChildProcessWithoutNullStreams } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { airportSecurity, parseAirport } from '../../src/services/metrics/wifi/darwin'
import {
  gatewayFromRoute,
  parseIwLink,
  parseProcWireless,
  parseStationDump,
  resolvers,
  standardOfRate,
} from '../../src/services/metrics/wifi/linux'
import { PingStream, parsePingReply } from '../../src/services/metrics/wifi/ping-stream'
import { stubWifi, stubWifiEvents } from '../../src/services/metrics/wifi/stub'
import {
  parseWifiLine,
  parseWlanRows,
  probeStep,
  type RawWlan,
  stateOf,
  toNetWifi,
  toWifiEvents,
  toWifiLink,
  WLAN_SCRIPT,
  WLAN_SOURCE,
} from '../../src/services/metrics/wifi/windows'
import { parseSamplerLine, WindowsSampler } from '../../src/services/metrics/windows-sampler'

/**
 * Where the Wi-Fi pane's readings come from: the Windows sampler's script and
 * what it writes, `iw` and /proc on Linux, system_profiler on macOS, the ping
 * stream, and the stub the tests and screenshots use.
 */

/** A row as the Windows script writes it, from an Intel AX211 on 5 GHz (the name made up). */
const ROW = {
  g: '83dc45e4-f891-4ceb-9c66-f2ca3d3a35fd',
  d: 'Intel(R) Wi-Fi 6E AX211 160MHz',
  s: 1,
  radio: 1,
  bg: 1,
  ms: 0,
  ch: 60,
  rssi: -55,
  phy: 10,
  q: 85,
  rx: 1729000,
  tx: 1922000,
  mlo: 0,
  links: [{ w: 0, f: 5300, r: -55 }],
  c: {
    tx: 1927686,
    rx: 6661650,
    retry: 328266,
    multi: 81774,
    failed: 0,
    ack: 884136,
    fcs: 0,
    decrypt: 0,
    hs: 0,
  },
  ssid: 'LAB',
  auth: 'RsnaPsk',
  cipher: 'Ccmp',
  level: 'InternetAccess',
  cost: 'Unrestricted',
  mac: 'c8:58:00:00:00:01',
  ip4: '192.0.2.107',
  pfx: 24,
  ip6: [],
  gw: '192.0.2.1',
  dns: ['192.0.2.1'],
  mtu: 1500,
  dhcp: true,
  lease: 129610,
  rxb: 1_000_000,
  txb: 200_000,
}

describe('the Windows script', () => {
  /** Everything the sampler would hand PowerShell. */
  function script(): string {
    let text = ''
    const sampler = new WindowsSampler('1.1.1.1', (t) => {
      text = t
      const child = Object.assign(new EventEmitter(), {
        stdin: new PassThrough(),
        stdout: new PassThrough(),
        stderr: new PassThrough(),
        kill: () => true,
      })
      return child as unknown as ChildProcessWithoutNullStreams
    })
    void sampler.wifi().catch(() => {})
    sampler.stop()
    return text
  }

  it('reads nothing behind the location consent, and never runs netsh', () => {
    const text = `${script()}\n${WLAN_SOURCE}\n${WLAN_SCRIPT}\n${probeStep('1.1.1.1')}`
    for (const forbidden of [
      'WlanGetNetworkBssList',
      'WlanGetAvailableNetworkList',
      'WlanScan',
      'netsh',
      'GetLanIdentifiers',
      'Windows.Devices.WiFi',
    ]) {
      expect(text).not.toContain(forbidden)
    }
    // WlanQueryInterface's opcodes: never 7, current_connection, which carries the BSSID.
    const opcodes = [...WLAN_SOURCE.matchAll(/const int OP_\w+ = (0x[0-9a-f]+|\d+);/gi)].map((m) =>
      Number(m[1]),
    )
    expect(opcodes.length).toBeGreaterThan(5)
    expect(opcodes).not.toContain(7)
    // The log names the access point too; its BSSID field is never read.
    expect(WLAN_SCRIPT).not.toMatch(/\['BSSID'\]/i)
  })

  it('writes UTF-8, so a reason in Japanese does not cost the whole reading', () => {
    expect(script()).toContain('[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding')
    // Shift-JIS "ソ" is 0x83 0x5C: read as UTF-8 its trail byte was a backslash that
    // escaped the quote after it, and the line did not parse.
    const line = JSON.stringify({
      t: 'wlanlog',
      data: [
        {
          rid: 1118,
          id: 8002,
          at: 1_790_186_446_503,
          g: '{ABC}',
          ssid: 'LAB',
          code: '229378',
          why: 'アソシエーションの試行中にドライバーが切断されました。',
        },
      ],
    })
    const parsed = parseSamplerLine(line)
    expect(parsed?.kind).toBe('wlanlog')
    expect(parsed?.kind === 'wlanlog' && parsed.data[0]?.why).toContain('アソシエーション')
    expect(parsed?.kind === 'wlanlog' && parsed.data[0]?.g).toBe('abc')
  })

  it("pings the host once a round for both panes, and every adapter's gateway", () => {
    const step = probeStep('1.1.1.1')
    expect(step.match(/SendPingAsync\('1\.1\.1\.1'/g)).toHaveLength(1)
    expect(step).toContain('$gwPingers[$i].SendPingAsync')
    expect(WLAN_SCRIPT).toContain('function WlanGateways')
    expect(step).toContain("Emit 'probe'")
    expect(step).toContain("Emit 'ping'")
  })

  it('reads its lines back', () => {
    // Every connected adapter's gateway, each with its echo; a row without an address is dropped.
    expect(
      parseWifiLine('probe', {
        net: 6,
        gws: [{ l: 'a', a: '192.0.2.1', r: 4 }, { l: 'b', a: '192.0.2.129', r: null }, { l: 'c' }],
      }),
    ).toEqual({
      kind: 'probe',
      data: {
        net: 6,
        gws: [
          { l: 'a', a: '192.0.2.1', r: 4 },
          { l: 'b', a: '192.0.2.129', r: null },
        ],
      },
    })
    // ConvertTo-Json writes a one-element array as a bare object.
    expect(parseWifiLine('probe', { net: 6, gws: { l: 'a', a: '192.0.2.1', r: 3 } })).toEqual({
      kind: 'probe',
      data: { net: 6, gws: [{ l: 'a', a: '192.0.2.1', r: 3 }] },
    })
    expect(parseWifiLine('probe', 'nonsense')).toBeNull()
    expect(parseWifiLine('net', [])).toBeUndefined()
    // ConvertTo-Json writes a one-element array as a bare object.
    expect(parseWlanRows(ROW)).toHaveLength(1)
    expect(parseWlanRows([{ d: 'no guid' }])).toEqual([])
  })
})

describe('Windows readings', () => {
  const row = parseWlanRows([ROW])[0] as RawWlan

  it('become a link', () => {
    const link = toWifiLink(row, undefined, 0)
    expect(link).toMatchObject({
      state: 'connected',
      ssid: 'LAB',
      standard: 'ax',
      freqMhz: 5300,
      channel: 60,
      widthMhz: null,
      rssi: -55,
      rxMbps: 1729,
      txMbps: 1922,
      security: 'WPA2-Personal',
      cipher: 'CCMP',
      internet: 'internet',
      metered: false,
      backgroundScan: true,
      streamingMode: false,
      leaseSeconds: 129610,
      rxSec: null,
    })
    expect(link.counters?.retries).toBe(328266)
  })

  it('say nothing of a radio that is not connected, and tell a switched-off one', () => {
    const off = toWifiLink({ ...row, s: 4 }, undefined, 0)
    expect([off.state, off.ssid, off.rssi, off.channel]).toEqual(['disconnected', null, null, null])
    expect(stateOf(1, 0)).toBe('off')
    expect(stateOf(5, 1)).toBe('connecting')
  })

  it('give byte rates between two readings, and none across a reset', () => {
    const before = { ...row, rxb: 0, txb: 0 }
    const link = toWifiLink(row, before, 2)
    expect([link.rxSec, link.txSec]).toEqual([500_000, 100_000])
    expect(toWifiLink({ ...row, rxb: 5 }, row, 1).rxSec).toBeNull()
  })

  it('keep a static address from reading as a lease', () => {
    expect(toWifiLink({ ...row, dhcp: false }, undefined, 0).leaseSeconds).toBeNull()
    expect(toWifiLink({ ...row, lease: 0xffffffff }, undefined, 0).leaseSeconds).toBeNull()
  })

  it('list each radio of a multi-link connection', () => {
    const mlo = toWifiLink(
      {
        ...row,
        mlo: 1,
        links: [
          { f: 5300, w: 160, r: -55 },
          { f: 6115, w: 320, r: -60 },
        ],
      },
      undefined,
      0,
    )
    expect(mlo.radios.map((r) => r.freqMhz)).toEqual([5300, 6115])
  })

  it('carry the echo round with its gateway', () => {
    const wifi = toNetWifi(
      null,
      { at: 1, data: [row] },
      { at: 5, net: 6, gws: [{ l: 'g', a: '192.0.2.1', r: null }] },
      'h',
    )
    expect(wifi.probe).toEqual({
      at: 5,
      host: 'h',
      internet: 6,
      gateways: [{ link: 'g', address: '192.0.2.1', rtt: null }],
    })
    expect(wifi.limits).toContain('bssid-location')
  })

  it('keep a day of the log, newest first, and only its three kinds', () => {
    const now = 100_000_000
    const events = toWifiEvents(
      [
        { rid: 1, id: 8003, at: now - 1000, g: 'x', ssid: 'LAB', code: 0, why: ' driver ' },
        { rid: 2, id: 8001, at: now - 500, g: 'x', ssid: 'LAB', code: null, why: '' },
        { rid: 3, id: 11005, at: now - 400, g: 'x', ssid: 'LAB', code: null, why: '' },
        { rid: 4, id: 8002, at: now - 90_000_000, g: 'x', ssid: 'LAB', code: 1, why: 'old' },
      ],
      now,
    )
    expect(events.map((e) => [e.key, e.kind, e.reason])).toEqual([
      ['log:2', 'connected', ''],
      ['log:1', 'disconnected', 'driver'],
    ])
  })
})

describe('Linux readings', () => {
  const LINK = `Connected to 02:00:5e:00:00:01 (on wlp2s0)
	SSID: LAB
	freq: 5180.0
	RX: 123456 bytes (789 packets)
	TX: 23456 bytes (345 packets)
	signal: -61 dBm
	rx bitrate: 866.7 MBit/s VHT-MCS 9 80MHz short GI VHT-NSS 2
	tx bitrate: 780.0 MBit/s VHT-MCS 8 80MHz short GI VHT-NSS 2
`

  it('read `iw dev link`', () => {
    expect(parseIwLink(LINK)).toEqual({
      connected: true,
      ssid: 'LAB',
      freqMhz: 5180,
      rssi: -61,
      rxMbps: 866.7,
      txMbps: 780,
      widthMhz: 80,
      standard: 'ac',
    })
    expect(parseIwLink('Not connected.\n').connected).toBe(false)
    expect(standardOfRate('1201.0 MBit/s 80MHz HE-MCS 11 HE-NSS 2')).toBe('ax')
    expect(standardOfRate('144.4 MBit/s MCS 15 short GI')).toBe('n')
  })

  it('read the station counters', () => {
    const dump =
      'Station 02:00:5e:00:00:01 (on wlp2s0)\n\ttx packets:\t1000\n\ttx retries:\t120\n\ttx failed:\t3\n\trx packets:\t4000\n'
    expect(parseStationDump(dump)).toMatchObject({
      txFrames: 1000,
      retries: 120,
      failed: 3,
      rxFrames: 4000,
    })
    expect(parseStationDump('')).toBeNull()
  })

  it('read /proc/net/wireless, the route and the resolvers', () => {
    const proc =
      'Inter-| sta-|   Quality        |   Discarded packets\n face | tus | link level noise |  nwid  crypt\nwlp2s0: 0000   49.  -61.  -256        0      0\n'
    expect(parseProcWireless(proc).get('wlp2s0')).toEqual({ quality: 49, level: -61 })
    const route = 'Iface\tDestination\tGateway\nwlp2s0\t00000000\t0102A8C0\t0003\n'
    expect(gatewayFromRoute(route, 'wlp2s0')).toBe('192.168.2.1')
    expect(gatewayFromRoute(route, 'eth0')).toBeNull()
    expect(resolvers('# x\nnameserver 192.0.2.53\nnameserver ::1\n')).toEqual(['192.0.2.53', '::1'])
  })
})

describe('macOS readings', () => {
  const ANSWER = {
    SPAirPortDataType: [
      {
        spairport_airport_interfaces: [
          {
            _name: 'en0',
            spairport_current_network_information: {
              _name: '<redacted>',
              spairport_network_channel: '149 (5GHz, 80MHz)',
              spairport_network_phymode: '802.11ax',
              spairport_network_rate: 864,
              spairport_security_mode: 'spairport_security_mode_wpa2_personal',
              spairport_signal_noise: '-58 dBm / -94 dBm',
            },
          },
          { _name: 'awdl0' },
        ],
      },
    ],
  }

  it('read system_profiler, with the name macOS keeps back left out', () => {
    const [en0, awdl] = parseAirport(ANSWER)
    expect(en0).toEqual({
      iface: 'en0',
      connected: true,
      ssid: null,
      channel: 149,
      band: '5',
      widthMhz: 80,
      standard: 'ax',
      txMbps: 864,
      rssi: -58,
      noise: -94,
      security: 'WPA2-Personal',
    })
    expect(awdl?.connected).toBe(false)
    expect(parseAirport({})).toEqual([])
    expect(airportSecurity('spairport_security_mode_none')).toBe('Open')
  })
})

describe('the ping stream', () => {
  /** A ping that answers when told to. */
  function fakePing() {
    const started: string[] = []
    let current: (EventEmitter & { stdout: PassThrough; kill: () => boolean }) | null = null
    const spawn = (target: string): ChildProcess => {
      started.push(target)
      current = Object.assign(new EventEmitter(), { stdout: new PassThrough(), kill: () => true })
      return current as unknown as ChildProcess
    }
    const reply = (ms: number) =>
      current?.stdout.write(`64 bytes from x: icmp_seq=1 ttl=57 time=${ms} ms\n`)
    return { started, spawn, reply }
  }

  it('reads iputils and BSD replies', () => {
    expect(parsePingReply('64 bytes from 1.1.1.1: icmp_seq=3 ttl=57 time=12.4 ms')).toBe(12.4)
    expect(parsePingReply('64 bytes from 1.1.1.1: icmp_seq=3 ttl=57 time<1 ms')).toBe(1)
    expect(parsePingReply('Request timeout for icmp_seq 4')).toBeNull()
  })

  it('keeps one process per target, says nothing while it warms up, then a loss when silent', async () => {
    const ping = fakePing()
    const stream = new PingStream(ping.spawn)
    const t0 = Date.now()
    expect(stream.read('192.0.2.1', t0)).toBeUndefined()
    ping.reply(3)
    await new Promise((r) => setImmediate(r))
    expect(stream.read('192.0.2.1', Date.now())).toBe(3)
    expect(stream.read('192.0.2.1', Date.now() + 5000)).toBeNull()
    expect(ping.started).toEqual(['192.0.2.1'])
    // Another pane's reader never starts one; it only shares a running one.
    expect(stream.peek('192.0.2.9')).toBeUndefined()
    stream.end()
    expect(stream.peek('192.0.2.1')).toBeUndefined()
  })

  it('refuses a target that is not an address or a name', () => {
    const ping = fakePing()
    const stream = new PingStream(ping.spawn)
    expect(stream.read('1.1.1.1; rm -rf /')).toBeUndefined()
    expect(ping.started).toEqual([])
  })
})

describe('the stub', () => {
  it('has two adapters in `dual`, each with its own gateway echo', () => {
    const wifi = stubWifi('dual', 0, 5000)
    expect(wifi.links.map((l) => l.id)).toEqual(['stub-wlan0', 'stub-wlan1'])
    expect(wifi.probe?.gateways.map((g) => g.link)).toEqual(['stub-wlan0', 'stub-wlan1'])
  })

  it('is steady for `1`, so a spec can assert on it', () => {
    const a = stubWifi('steady', 0, 10_000)
    const b = stubWifi('steady', 0, 20_000)
    expect(a.links[0]?.rssi).toBe(b.links[0]?.rssi)
    expect(a.probe?.internet).toBe(18)
  })

  it('on a train, loses the way out for eight seconds in every forty, and changes car', () => {
    const lost = [20, 21, 27].map((s) => stubWifi('train', 0, s * 1000).probe?.internet)
    expect(lost).toEqual([null, null, null])
    expect(stubWifi('train', 0, 29_000).probe?.gateways[0]?.rtt).not.toBeNull()
    expect(stubWifi('train', 0, 0).links[0]?.channel).not.toBe(
      stubWifi('train', 0, 30_000).links[0]?.channel,
    )
  })

  it('keeps its counters climbing, as a driver does', () => {
    let before = stubWifi('train', 0, 0).links[0]?.counters?.retries ?? 0
    for (let s = 1; s < 120; s++) {
      const now = stubWifi('train', 0, s * 1000).links[0]?.counters?.retries ?? 0
      expect(now).toBeGreaterThanOrEqual(before)
      before = now
    }
  })

  it('has a log from before it started', () => {
    const { events } = stubWifiEvents('train', 1_000_000_000)
    expect(events.length).toBeGreaterThan(3)
    expect(events.every((e) => e.at < 1_000_000_000)).toBe(true)
  })
})
