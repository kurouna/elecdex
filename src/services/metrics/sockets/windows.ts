import type { WindowsSampler } from '../windows-sampler.js'
import { type RawSocket, type SocketReader, WINDOWS_STATES } from './common.js'

/**
 * Windows sockets, from the long-lived sampler (windows-sampler.ts).
 *
 * The table itself comes from iphlpapi's GetExtendedTcpTable, which is the only
 * way to learn which process holds a socket: .NET's IPGlobalProperties leaves
 * the owner out, `Get-NetTCPConnection` is a CIM query costing a few hundred
 * milliseconds a call, and `netstat -ano` would be a process per reading - the
 * thing this project does not do on Windows.
 *
 * The sampler already emits a process table on the same tick, so the pid is
 * turned into a name here for nothing.
 */

/** `family|state|localAddress|localPort|remoteAddress|remotePort|pid`. */
export function parseSamplerSockets(
  rows: readonly string[],
  names: ReadonlyMap<number, string>,
): RawSocket[] {
  const sockets: RawSocket[] = []
  for (const row of rows) {
    const parts = row.split('|')
    if (parts.length !== 7) continue
    const [family, state, localAddress, localPort, remoteAddress, remotePort, pid] = parts
    const owner = Number(pid)
    sockets.push({
      family: family === '6' ? 6 : 4,
      localAddress: localAddress ?? '',
      localPort: port(localPort),
      remoteAddress: remoteAddress ?? '',
      remotePort: port(remotePort),
      state: WINDOWS_STATES[Number(state)] ?? 'unknown',
      pid: Number.isFinite(owner) ? owner : 0,
      // pid 0 means the table did not say who owns the socket, not that the
      // System Idle Process does - and the process table has a name for 0.
      process: owner > 0 ? (names.get(owner) ?? '') : '',
    })
  }
  return sockets
}

const port = (value: string | undefined): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 65_535 ? parsed : 0
}

/**
 * True when not one row names an owner, which is how the fallback table shows
 * itself: .NET's own table has no owners, and it is also what the sampler emits
 * in the second before the P/Invoke has compiled. The pane says so rather than
 * leaving a column mysteriously empty.
 */
export function noneOwned(sockets: readonly RawSocket[]): boolean {
  return sockets.length > 0 && sockets.every((socket) => socket.pid === 0)
}

export class WindowsSocketReader implements SocketReader {
  private readonly sampler: WindowsSampler

  constructor(sampler: WindowsSampler) {
    this.sampler = sampler
  }

  async read(): Promise<{ sockets: RawSocket[]; ownersUnknown: boolean }> {
    const { rows, names } = await this.sampler.tcpSockets()
    const sockets = parseSamplerSockets(rows, names)
    return { sockets, ownersUnknown: noneOwned(sockets) }
  }
}
