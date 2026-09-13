import { describe, expect, it } from 'vitest'
import { summarizeConnections } from '../../src/services/metrics/geoip.js'
import {
  isPublicAddress,
  parseBsdNetstat,
  parseProcNetTcp,
  publicRemotes,
} from '../../src/services/metrics/net-connections.js'
import { parseSamplerLine } from '../../src/services/metrics/windows-sampler.js'

describe('isPublicAddress', () => {
  it.each(['8.8.8.8', '1.1.1.1', '133.242.0.3', '2001:4860:4860::8888'])('%s is public', (ip) => {
    expect(isPublicAddress(ip)).toBe(true)
  })

  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.50.1',
    '169.254.1.1',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.251',
    '::1',
    '::',
    'fe80::1',
    'fd12:3456::1',
    'ff02::fb',
    'not an address',
  ])('%s is not', (ip) => {
    expect(isPublicAddress(ip)).toBe(false)
  })

  it('keeps 172.15 and 172.32, which are outside the private block', () => {
    expect(isPublicAddress('172.15.0.1')).toBe(true)
    expect(isPublicAddress('172.32.0.1')).toBe(true)
  })
})

describe('publicRemotes', () => {
  it('unwraps IPv4-mapped IPv6, drops zone ids and private addresses, and de-duplicates', () => {
    expect(
      publicRemotes(['::ffff:8.8.8.8', '8.8.8.8', '192.168.1.1', 'fe80::1%12', '1.1.1.1']),
    ).toEqual(['8.8.8.8', '1.1.1.1'])
  })
})

describe('parseProcNetTcp', () => {
  it('decodes established IPv4 and IPv6 remotes from /proc/net/tcp*', () => {
    const tcp = [
      '  sl  local_address rem_address   st tx_rx_rcv tx_rx_snd tr tm->when retrnsmt   uid  timeout inode',
      '   0: 0100007F:0CEA 00000000:0000 0A 00000000:00000000 00:00000000 00000000     0        0 1',
      '   1: 0A00020F:A2C4 08080808:01BB 03 00000000:00000000 00:00000000 00000000  1000        0 2',
      '   2: 0A00020F:A2C6 0101A8C0:0016 03 00000000:00000000 00:00000000 00000000  1000        0 3',
    ].join('\n')
    expect(parseProcNetTcp(tcp)).toEqual(['8.8.8.8', '192.168.1.1'])

    const tcp6 = [
      '  sl  local_address                         rem_address                           st',
      '   0: 00000000000000000000000001000000:1F90 00000000000000000000000000000000:0000 0A',
      '   1: 00000000000000000000000001000000:A000 0048602000000000000000008888000000:01BB 03',
      '   2: 00000000000000000000000001000000:A002 B80D0120000000000000000001000000:01BB 03',
    ].join('\n')
    expect(parseProcNetTcp(tcp6)).toEqual(['2001:db8:0:0:0:0:0:1'])
  })
})

describe('parseBsdNetstat', () => {
  it('reads the foreign address of ESTABLISHED rows', () => {
    const out = [
      'Active Internet connections (including servers)',
      'Proto Recv-Q Send-Q  Local Address          Foreign Address        (state)',
      'tcp4       0      0  192.168.1.20.52344     93.184.216.34.443      ESTABLISHED',
      'tcp6       0      0  2001:db8::20.52345     2606:2800:220:1::1.443 ESTABLISHED',
      'tcp4       0      0  *.22                   *.*                    LISTEN',
    ].join('\n')
    expect(parseBsdNetstat(out)).toEqual(['93.184.216.34', '2606:2800:220:1::1'])
  })
})

describe('the Windows sampler tcp line', () => {
  it('parses remote addresses, including the one-row collapse', () => {
    expect(parseSamplerLine('{"t":"tcp","data":[{"r":"8.8.8.8"},{"r":"1.1.1.1"}]}')).toEqual({
      kind: 'tcp',
      remotes: ['8.8.8.8', '1.1.1.1'],
    })
    expect(parseSamplerLine('{"t":"tcp","data":{"r":"8.8.8.8"}}')).toEqual({
      kind: 'tcp',
      remotes: ['8.8.8.8'],
    })
  })
})

describe('summarizeConnections', () => {
  it('groups by country with the country pin, most connections first', () => {
    const table: Record<string, string> = { a: 'US', b: 'JP', c: 'US', d: 'XX' }
    const summary = summarizeConnections(['a', 'b', 'c', 'd', 'e'], (ip) => table[ip] ?? null)
    expect(summary.total).toBe(5)
    expect(summary.unresolved).toBe(2) // an unknown code and no record at all
    expect(summary.countries.map((c) => [c.code, c.count])).toEqual([
      ['US', 2],
      ['JP', 1],
    ])
    expect(summary.countries[1]?.lat).toBeCloseTo(36.65, 1)
  })

  it('places real addresses with the bundled database', () => {
    const summary = summarizeConnections(['8.8.8.8', '133.242.0.3'])
    expect(summary.countries.map((c) => c.code).sort()).toEqual(['JP', 'US'])
  })
})
