import type { RawSocket, SocketReader } from './common.js'

/**
 * A made-up socket table, for the tests and the README screenshots.
 *
 * The connections pane is the one pane whose whole content is where this
 * machine has been, so a screenshot of the real thing would publish the user's
 * browsing and a test would depend on whatever the machine happened to be doing.
 * `ELECDEX_SOCKETS_STUB=1` gives a fixed table instead; `=demo` gives a fuller
 * one for the screenshots. The addresses are documentation ranges and
 * well-known public resolvers, never anything belonging to a person.
 */

/** Peers in TEST-NET-1/2/3 and the two public resolvers everybody recognises. */
const ACTIVE: [string, number, string, number, string][] = [
  ['firefox', 4821, '93.184.216.34', 443, 'established'],
  ['firefox', 4822, '93.184.216.34', 443, 'established'],
  ['firefox', 4823, '203.0.113.42', 443, 'established'],
  ['code', 5310, '198.51.100.7', 443, 'established'],
  ['code', 5311, '198.51.100.7', 443, 'established'],
  ['elecdex', 6001, '1.1.1.1', 443, 'established'],
  ['elecdex', 6002, '8.8.8.8', 443, 'established'],
  ['ssh', 6100, '192.0.2.10', 22, 'established'],
  ['syncthing', 6204, '192.168.1.24', 22000, 'established'],
  ['thunderbird', 6310, '203.0.113.99', 993, 'established'],
  ['thunderbird', 6311, '203.0.113.99', 587, 'syn-sent'],
  ['curl', 6400, '93.184.216.34', 80, 'time-wait'],
]

const LISTENING: [string, number, string][] = [
  ['sshd', 22, '0.0.0.0'],
  ['nginx', 80, '0.0.0.0'],
  ['nginx', 443, '0.0.0.0'],
  ['postgres', 5432, '127.0.0.1'],
  ['node', 5173, '127.0.0.1'],
  ['elecdex', 9229, '127.0.0.1'],
]

const PIDS: Record<string, number> = {
  firefox: 2140,
  code: 3312,
  elecdex: 4088,
  ssh: 5012,
  syncthing: 5240,
  thunderbird: 6120,
  curl: 7331,
  sshd: 812,
  nginx: 1044,
  postgres: 1288,
  node: 1502,
}

const STATES = new Set([
  'established',
  'syn-sent',
  'time-wait',
  'close-wait',
  'listen',
]) as ReadonlySet<string>

export function stubSocketReader(mode: string): SocketReader {
  const rows = buildRows(mode === 'demo')
  return { read: async () => ({ sockets: rows, ownersUnknown: false }) }
}

function buildRows(demo: boolean): RawSocket[] {
  const active = demo ? ACTIVE : ACTIVE.slice(0, 4)
  const listening = demo ? LISTENING : LISTENING.slice(0, 2)
  return [
    ...active.map(([process, localPort, remoteAddress, remotePort, state]) => ({
      family: 4 as const,
      localAddress: '192.0.2.2',
      localPort,
      remoteAddress,
      remotePort,
      state: STATES.has(state) ? (state as RawSocket['state']) : ('unknown' as const),
      pid: PIDS[process] ?? 0,
      process,
    })),
    ...listening.map(([process, localPort, localAddress]) => ({
      family: 4 as const,
      localAddress,
      localPort,
      remoteAddress: '',
      remotePort: 0,
      state: 'listen' as const,
      pid: PIDS[process] ?? 0,
      process,
    })),
  ]
}
