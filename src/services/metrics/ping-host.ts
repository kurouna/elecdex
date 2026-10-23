/** Host pinged for latency. The same default eDEX-UI used. */
export const DEFAULT_PING_HOST = '1.1.1.1'

/**
 * The host the internet echo goes to: 1.1.1.1, or the loopback address `ELECDEX_PING_HOST`
 * names. Only a loopback address is taken - the variable exists so the tests echo nothing off
 * the machine (tests/e2e/support STUB_ENV), not to point the app somewhere else - and anything
 * else is ignored rather than refused, so a stray value never stops the collector.
 */
export function pingHostFrom(value: string | undefined): string {
  if (value === undefined) return DEFAULT_PING_HOST
  if (value === '::1' || /^127\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(value)) {
    const octets = value === '::1' ? [] : value.split('.').map(Number)
    if (octets.every((n) => n <= 255)) return value
  }
  return DEFAULT_PING_HOST
}
