import type { NetSocket, NetSockets } from '@shared/metrics'
import { countryOf } from '../geoip.js'
import { isPublicAddress } from '../net-connections.js'
import type { WindowsSampler } from '../windows-sampler.js'
import { place, type SocketReader } from './common.js'
import { DarwinSocketReader } from './darwin.js'
import { LinuxSocketReader } from './linux.js'
import { stubSocketReader } from './stub.js'
import { WindowsSocketReader } from './windows.js'

/**
 * The machine's socket table, for the connections pane.
 *
 * Where the table comes from is the platform's business (linux.ts, darwin.ts,
 * windows.ts); what happens to it afterwards is the same everywhere: the peers
 * are placed with the bundled GeoIP database - on this machine, as the globe
 * does - and the rows are capped, because a busy machine holds thousands and
 * no pane draws thousands.
 *
 * Nothing here is polled unless a pane is open: the source is subscribed only
 * while the widget is mounted, and it is not in `keepWhileHidden`, so a pane
 * behind another tab reads nothing at all.
 */

/**
 * Rows sent to the renderer. Enough to fill a pane several times over at the
 * sizes panes come in, and about 25 kB on the wire.
 */
export const MAX_SOCKETS = 240

function readerFor(sampler: WindowsSampler | null): SocketReader {
  // The stub stands in for the real table in tests and when the README
  // screenshots are taken, so neither ever shows where this machine has been.
  if (process.env.ELECDEX_SOCKETS_STUB) return stubSocketReader(process.env.ELECDEX_SOCKETS_STUB)
  if (sampler !== null) return new WindowsSocketReader(sampler)
  if (process.platform === 'linux') return new LinuxSocketReader()
  return new DarwinSocketReader()
}

let reader: SocketReader | null = null

export async function readSockets(sampler: WindowsSampler | null): Promise<NetSockets> {
  reader ??= readerFor(sampler)
  const { sockets, ownersUnknown } = await reader.read()
  const placed = sockets.map((socket) => place(socket, countryOf, isPublicAddress))
  return summarize(placed, ownersUnknown)
}

/** Counts the whole table, then keeps the rows worth drawing. */
export function summarize(sockets: readonly NetSocket[], ownersUnknown: boolean): NetSockets {
  let established = 0
  let listening = 0
  for (const socket of sockets) {
    if (socket.state === 'listen') listening += 1
    else if (socket.state === 'established') established += 1
  }
  // Which rows go when there are too many is decided here rather than in the
  // pane: a peer on the public internet is the reason the pane exists, so it is
  // the last thing dropped.
  const ordered = [...sockets].sort(
    (a, b) => rank(a) - rank(b) || a.process.localeCompare(b.process) || a.localPort - b.localPort,
  )
  return {
    sockets: ordered.slice(0, MAX_SOCKETS),
    established,
    listening,
    dropped: Math.max(0, ordered.length - MAX_SOCKETS),
    ownersUnknown,
  }
}

/** Lower is kept: outward connections, then the rest, then what is closing. */
function rank(socket: NetSocket): number {
  if (socket.state === 'established') return socket.publicPeer ? 0 : 1
  if (socket.state === 'listen') return 2
  if (socket.state === 'syn-sent' || socket.state === 'syn-recv') return 3
  return 4
}
