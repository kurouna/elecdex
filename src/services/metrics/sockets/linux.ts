import { readdir, readFile, readlink } from 'node:fs/promises'
import { decodeProcAddress } from '../net-connections.js'
import { LINUX_STATES, type RawSocket, type SocketReader, type SocketTable } from './common.js'
import type { RawCommand } from './identify.js'

/**
 * Linux sockets, read from /proc - no process spawned at all.
 *
 * /proc/net/tcp and tcp6 give the table, including the state and the socket's
 * inode; the owner is not there, because the kernel files it the other way
 * round: it is /proc/<pid>/fd that holds `socket:[inode]` links. Resolving an
 * owner therefore means walking every process's descriptors, which is a few
 * thousand readlink calls (~20-40ms on a desktop). That is affordable every few
 * seconds but not for nothing, so it happens only for the inodes actually in
 * the table, the answers are cached between samples, and a process that has
 * gone simply loses its name rather than costing a second walk.
 */

const TABLES = ['/proc/net/tcp', '/proc/net/tcp6']

/** Rows from one table. The inode is kept only until the owner is found. */
export function parseProcSockets(text: string, family: 4 | 6): (RawSocket & { inode: string })[] {
  const rows: (RawSocket & { inode: string })[] = []
  for (const line of text.split('\n').slice(1)) {
    const fields = line.trim().split(/\s+/)
    if (fields.length < 10) continue
    const local = splitEndpoint(fields[1] ?? '')
    const remote = splitEndpoint(fields[2] ?? '')
    if (local === null || remote === null) continue
    rows.push({
      family,
      localAddress: local.address,
      localPort: local.port,
      remoteAddress: remote.address,
      remotePort: remote.port,
      state: LINUX_STATES[(fields[3] ?? '').toUpperCase()] ?? 'unknown',
      pid: 0,
      process: '',
      inode: fields[9] ?? '',
    })
  }
  return rows
}

function splitEndpoint(field: string): { address: string; port: number } | null {
  const colon = field.lastIndexOf(':')
  if (colon <= 0) return null
  const address = decodeProcAddress(field.slice(0, colon))
  const port = Number.parseInt(field.slice(colon + 1), 16)
  if (address === null || !Number.isFinite(port)) return null
  return { address, port }
}

export class LinuxSocketReader implements SocketReader {
  /** inode -> pid, kept between samples: a long-lived connection is the common case. */
  private owners = new Map<string, { pid: number; name: string }>()

  /** pid -> its command line and working directory, read once per listening process. */
  private commands = new Map<number, RawCommand>()

  async read(): Promise<SocketTable> {
    const [v4 = '', v6 = ''] = await Promise.all(TABLES.map((file) => readText(file)))
    const rows = [...parseProcSockets(v4, 4), ...parseProcSockets(v6, 6)]
    await this.resolveOwners(rows)
    const sockets = rows.map(({ inode: _inode, ...socket }) => socket)
    return { sockets, ownersUnknown: false, commands: await this.listenerCommands(sockets) }
  }

  /**
   * The command line and working directory of each listening process. Both are
   * readable only for the user's own processes, which are the ones worth
   * naming; a system daemon's stay empty, and its name is enough.
   */
  private async listenerCommands(sockets: readonly RawSocket[]): Promise<RawCommand[]> {
    const pids = new Set(sockets.filter((s) => s.state === 'listen' && s.pid > 0).map((s) => s.pid))
    for (const pid of this.commands.keys()) if (!pids.has(pid)) this.commands.delete(pid)
    for (const pid of pids) {
      if (this.commands.has(pid)) continue
      const [commandLine, cwd] = await Promise.all([
        readText(`/proc/${pid}/cmdline`),
        readlink(`/proc/${pid}/cwd`).catch(() => ''),
      ])
      this.commands.set(pid, { pid, exe: '', commandLine: commandLine.slice(0, 4096), cwd })
    }
    return [...this.commands.values()]
  }

  /** Fills in the owner of every row, walking /proc only for inodes not yet known. */
  private async resolveOwners(rows: (RawSocket & { inode: string })[]): Promise<void> {
    const wanted = new Set(rows.map((row) => row.inode).filter((inode) => inode !== ''))
    for (const inode of this.owners.keys()) {
      // Forget an inode the kernel has reused for something else by now.
      if (!wanted.has(inode)) this.owners.delete(inode)
    }
    const missing = [...wanted].filter((inode) => !this.owners.has(inode))
    if (missing.length > 0) await this.walkProc(new Set(missing))

    for (const row of rows) {
      const owner = this.owners.get(row.inode)
      if (owner === undefined) continue
      row.pid = owner.pid
      row.process = owner.name
    }
  }

  private async walkProc(missing: Set<string>): Promise<void> {
    let entries: string[]
    try {
      entries = await readdir('/proc')
    } catch {
      return
    }
    for (const entry of entries) {
      if (missing.size === 0) return
      if (!/^\d+$/.test(entry)) continue
      await this.claimFor(entry, missing)
    }
  }

  /** Records which of the wanted inodes this process holds. */
  private async claimFor(pid: string, missing: Set<string>): Promise<void> {
    let fds: string[]
    try {
      fds = await readdir(`/proc/${pid}/fd`)
    } catch {
      return // gone, or somebody else's
    }
    let name: string | null = null
    for (const fd of fds) {
      let target: string
      try {
        target = await readlink(`/proc/${pid}/fd/${fd}`)
      } catch {
        continue
      }
      const inode = /^socket:\[(\d+)]$/.exec(target)?.[1]
      if (inode === undefined || !missing.has(inode)) continue
      name ??= await processName(pid)
      this.owners.set(inode, { pid: Number(pid), name })
      missing.delete(inode)
      if (missing.size === 0) return
    }
  }
}

/** /proc/<pid>/comm is the name without its arguments, which is what a row shows. */
async function processName(pid: string): Promise<string> {
  const comm = await readText(`/proc/${pid}/comm`)
  return comm.trim().slice(0, 64)
}

const readText = (file: string): Promise<string> => readFile(file, 'utf8').catch(() => '')
