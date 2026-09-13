import type { PtyCreateOptions, PtySessionSummary } from '@shared/api'
import { CH, type PtyPortMessage, type PtyPortRequest } from '@shared/channels'
import { ipcMain, MessageChannelMain, type MessagePortMain, type WebContents } from 'electron'
import { PtyManager } from '../pty/pty-manager.js'

/**
 * Wires PtyManager to the renderer.
 *
 * Output does not travel over ipcMain. Each attach creates a MessageChannelMain
 * and transfers one end to the renderer, so a session's stream is its own
 * channel: no shared-channel contention, no port allocation, and the data never
 * leaves the process pair. See docs/architecture.md section 4.3.
 */

/**
 * A port attached to a session. While its snapshot is being taken, live events
 * are held in `backlog` so they reach the pane after the snapshot, not before.
 */
interface Attached {
  port: MessagePortMain
  backlog: PtyPortMessage[] | null
}

/** Ports currently attached to a session, keyed by session id. */
type PortsBySession = Map<string, Set<Attached>>

/** Upper bound on a single write, to keep a runaway renderer from wedging the PTY. */
const MAX_WRITE_BYTES = 1024 * 1024

export function registerPtyIpc(): { dispose: () => void } {
  const ports: PortsBySession = new Map()

  const broadcast = (id: string, message: PtyPortMessage): void => {
    const set = ports.get(id)
    if (!set) return
    for (const attached of set) {
      if (attached.backlog !== null) attached.backlog.push(message)
      else post(attached.port, message)
    }
  }

  const manager = new PtyManager({
    onData: (id, chunk) => broadcast(id, { t: 'data', chunk }),
    onCwd: (id, cwd) => broadcast(id, { t: 'cwd', cwd }),
    onCommandEnd: (id, exitCode, durationMs) =>
      broadcast(id, { t: 'commandEnd', exitCode, durationMs }),
    onIntegrationUnavailable: (id) => broadcast(id, { t: 'integrationUnavailable' }),
    onExit: (id, code, signal) => {
      broadcast(id, { t: 'exit', code, signal })
      // A port still catching up closes itself once its backlog, which now
      // ends with this exit, has been delivered.
      for (const attached of ports.get(id) ?? []) {
        if (attached.backlog === null) attached.port.close()
      }
      ports.delete(id)
    },
  })

  ipcMain.handle(CH.pty.create, (_event, raw: unknown): PtySessionSummary => {
    return manager.create(validateCreateOptions(raw))
  })

  ipcMain.handle(CH.pty.list, (): PtySessionSummary[] => manager.list())

  ipcMain.handle(CH.pty.dispose, (_event, raw: unknown) => {
    const id = asSessionId(raw)
    if (id !== null) manager.dispose(id)
  })

  ipcMain.handle(CH.pty.attach, (event, raw: unknown): boolean => {
    const id = asSessionId(raw)
    if (id === null || !manager.has(id)) return false

    const { port1, port2 } = new MessageChannelMain()

    port1.on('message', (msg) => {
      const request = validatePortRequest(msg.data)
      if (request === null) return
      if (request.t === 'write') manager.write(id, request.data)
      else manager.resize(id, request.cols, request.rows)
    })
    const attached: Attached = { port: port1, backlog: [] }
    port1.on('close', () => {
      ports.get(id)?.delete(attached)
    })
    port1.start()

    let set = ports.get(id)
    if (!set) {
      set = new Set()
      ports.set(id, set)
    }
    set.add(attached)

    sendPort(event.sender, id, port2)
    void catchUp(manager, id, attached)
    return true
  })

  return {
    dispose: () => {
      manager.disposeAll()
      for (const set of ports.values()) for (const { port } of set) port.close()
      ports.clear()
      ipcMain.removeHandler(CH.pty.create)
      ipcMain.removeHandler(CH.pty.list)
      ipcMain.removeHandler(CH.pty.dispose)
      ipcMain.removeHandler(CH.pty.attach)
    },
  }
}

/**
 * Brings a freshly-attached port up to date before it sees any live event.
 *
 * First the state it could not have witnessed - the shell's first OSC 7 fires
 * before any pane exists - then the screen as it stands, then whatever arrived
 * while that snapshot was being taken. See ScreenMirror for why the screen is a
 * snapshot rather than a replay of recent output.
 */
async function catchUp(manager: PtyManager, id: string, attached: Attached): Promise<void> {
  const { port } = attached
  const state = manager.stateFor(id)
  const snapshot = await (manager.snapshotFor(id) ?? Promise.resolve(''))

  if (state !== null) {
    if (state.cwd !== null) {
      post(port, { t: 'cwd', cwd: state.cwd })
    } else if (state.integrationResolved) {
      post(port, { t: 'integrationUnavailable' })
    }
  }
  if (snapshot !== '') {
    post(port, { t: 'data', chunk: new TextEncoder().encode(snapshot) })
  }

  const backlog = attached.backlog ?? []
  attached.backlog = null
  for (const message of backlog) post(port, message)
  if (backlog.some((m) => m.t === 'exit')) port.close()
}

function post(port: MessagePortMain, message: PtyPortMessage): void {
  try {
    port.postMessage(message)
  } catch {
    // The renderer went away; cleanup happens on the port's 'close' event.
  }
}

function sendPort(sender: WebContents, id: string, port: MessagePortMain): void {
  if (sender.isDestroyed()) {
    port.close()
    return
  }
  sender.postMessage(CH.pty.port, { id }, [port])
}

/** Session ids are uuids; anything else is not ours. */
function asSessionId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw) ? raw : null
}

function validateCreateOptions(raw: unknown): PtyCreateOptions {
  if (typeof raw !== 'object' || raw === null) return {}
  const o = raw as Record<string, unknown>

  const opts: PtyCreateOptions = {}
  if (typeof o.shell === 'string' && o.shell.length > 0) opts.shell = o.shell
  if (typeof o.cwd === 'string' && o.cwd.length > 0) opts.cwd = o.cwd
  if (Array.isArray(o.args)) opts.args = o.args.filter((a): a is string => typeof a === 'string')
  if (typeof o.cols === 'number' && Number.isFinite(o.cols)) opts.cols = clampDim(o.cols)
  if (typeof o.rows === 'number' && Number.isFinite(o.rows)) opts.rows = clampDim(o.rows)
  return opts
}

const clampDim = (n: number): number => Math.max(1, Math.min(Math.floor(n), 1000))

function validatePortRequest(raw: unknown): PtyPortRequest | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>

  if (o.t === 'write') {
    if (typeof o.data !== 'string') return null
    if (Buffer.byteLength(o.data, 'utf8') > MAX_WRITE_BYTES) return null
    return { t: 'write', data: o.data }
  }
  if (o.t === 'resize') {
    if (typeof o.cols !== 'number' || typeof o.rows !== 'number') return null
    if (!Number.isFinite(o.cols) || !Number.isFinite(o.rows)) return null
    return { t: 'resize', cols: o.cols, rows: o.rows }
  }
  return null
}
