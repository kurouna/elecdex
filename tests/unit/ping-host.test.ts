import { describe, expect, it } from 'vitest'
import { DEFAULT_PING_HOST, pingHostFrom } from '../../src/services/metrics/ping-host.js'

/**
 * The internet echo's host: 1.1.1.1, or a loopback address the tests name so that no echo leaves
 * the machine during a run (found by the e2e no-external contract, 2026-10-23). The variable is
 * not a way to point the app elsewhere: anything but loopback is ignored.
 */
describe('pingHostFrom', () => {
  it('is 1.1.1.1 when nothing is set', () => {
    expect(pingHostFrom(undefined)).toBe('1.1.1.1')
    expect(DEFAULT_PING_HOST).toBe('1.1.1.1')
  })

  it.each(['127.0.0.1', '127.1.2.3', '::1'])('takes the loopback address %s', (host) => {
    expect(pingHostFrom(host)).toBe(host)
  })

  it.each([
    '8.8.8.8',
    'example.com',
    'localhost',
    '127.0.0.256',
    '127.0.0',
    '',
    "127.0.0.1'; Remove-Item",
    '::2',
  ])('ignores %j and echoes the default', (value) => {
    expect(pingHostFrom(value)).toBe('1.1.1.1')
  })
})
