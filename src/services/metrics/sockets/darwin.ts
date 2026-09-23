import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { BSD_STATES, type RawSocket, type SocketReader, type SocketTable } from './common.js'

/**
 * macOS sockets, from `netstat -an -p tcp`.
 *
 * netstat does not say who owns a socket, and the tool that does - `lsof -nPi` -
 * costs a process and several hundred milliseconds of its own every reading, on
 * top of this one. The pane says the owners are unknown here rather than paying
 * that every few seconds; the addresses, ports and states are all still there.
 *
 * BSD writes an endpoint as `address.port`, with the port after the last dot,
 * so an IPv6 address keeps its own colons and `*.22` is a socket listening
 * everywhere.
 */

const run = promisify(execFile)

/** Parses the table. Exported and pure: this is what the unit test drives. */
export function parseBsdSockets(text: string): RawSocket[] {
  const rows: RawSocket[] = []
  for (const line of text.split('\n')) {
    const row = parseBsdLine(line)
    if (row !== null) rows.push(row)
  }
  return rows
}

function parseBsdLine(line: string): RawSocket | null {
  const fields = line.trim().split(/\s+/)
  const proto = fields[0] ?? ''
  if (!/^tcp[46]?$/.test(proto) || fields.length < 5) return null
  const local = splitEndpoint(fields[3] ?? '')
  const remote = splitEndpoint(fields[4] ?? '')
  if (local === null || remote === null) return null
  return {
    family: proto === 'tcp6' ? 6 : 4,
    localAddress: local.address,
    localPort: local.port,
    remoteAddress: remote.address,
    remotePort: remote.port,
    // A listening row has no state column of its own on some releases; an
    // endpoint of `*.*` is the tell either way.
    state: BSD_STATES[fields[5] ?? ''] ?? (remote.address === '' ? 'listen' : 'unknown'),
    pid: 0,
    process: '',
  }
}

function splitEndpoint(field: string): { address: string; port: number } | null {
  const dot = field.lastIndexOf('.')
  if (dot <= 0) return null
  const address = field.slice(0, dot)
  const port = field.slice(dot + 1)
  return {
    address: address === '*' ? '' : address,
    // `*` is every port, which only a listening socket has.
    port: port === '*' ? 0 : Number.parseInt(port, 10),
  }
}

export class DarwinSocketReader implements SocketReader {
  async read(): Promise<SocketTable> {
    const { stdout } = await run('netstat', ['-an', '-p', 'tcp'], { timeout: 4000 })
    return { sockets: parseBsdSockets(stdout), ownersUnknown: true, commands: [] }
  }
}
