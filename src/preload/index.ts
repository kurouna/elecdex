import type {
  AppInfo,
  ElecdexApi,
  PtyCreateOptions,
  PtyHandlers,
  PtySessionSummary,
} from '@shared/api'
import { CH, type PtyPortMessage, type PtyPortRequest } from '@shared/channels'
import { contextBridge, ipcRenderer } from 'electron'

/**
 * The only bridge between the sandboxed renderer and the main process.
 *
 * Rules for this file:
 *  - never expose `ipcRenderer` itself, only narrow typed functions
 *  - never expose a function that takes a channel name from the caller
 *  - keep it free of Node API usage so it keeps working under `sandbox: true`
 *
 * A MessagePort cannot cross `contextBridge`, so this file holds the ports and
 * relays them: main transfers a port here, and the renderer only ever sees the
 * callbacks. See docs/architecture.md section 4.3.
 */

/** Ports handed to us by main, keyed by session id, awaiting an attach. */
const ports = new Map<string, MessagePort>()
/** Sessions whose port has not arrived yet, with the resolver waiting for it. */
const pending = new Map<string, (port: MessagePort) => void>()

ipcRenderer.on(CH.pty.port, (event, payload: { id: string }) => {
  const port = event.ports[0]
  if (!port) return

  const waiting = pending.get(payload.id)
  if (waiting) {
    pending.delete(payload.id)
    waiting(port)
  } else {
    ports.set(payload.id, port)
  }
})

/** Resolves once main has transferred the port for `id`. */
function awaitPort(id: string): Promise<MessagePort> {
  const existing = ports.get(id)
  if (existing) {
    ports.delete(id)
    return Promise.resolve(existing)
  }
  return new Promise((resolve) => pending.set(id, resolve))
}

async function attach(id: string, handlers: PtyHandlers): Promise<() => void> {
  // Ask for the port first, then wait: main posts it during the invoke, so the
  // listener above may well receive it before this promise settles.
  const portPromise = awaitPort(id)
  const ok = (await ipcRenderer.invoke(CH.pty.attach, id)) as boolean
  if (!ok) {
    pending.delete(id)
    throw new Error(`No such terminal session: ${id}`)
  }

  const port = await portPromise
  let detached = false

  port.onmessage = (event: MessageEvent) => {
    if (detached) return
    const msg = event.data as PtyPortMessage
    switch (msg.t) {
      case 'data':
        handlers.onData(msg.chunk)
        break
      case 'exit':
        handlers.onExit(msg.code, msg.signal)
        break
      case 'cwd':
        handlers.onCwd(msg.cwd)
        break
      case 'commandEnd':
        handlers.onCommandEnd(msg.exitCode, msg.durationMs)
        break
      case 'integrationUnavailable':
        handlers.onIntegrationUnavailable()
        break
    }
  }
  port.start()
  live.set(id, port)

  return () => {
    if (detached) return
    detached = true
    port.onmessage = null
    port.close()
    if (live.get(id) === port) live.delete(id)
  }
}

/** Attached ports, so write/resize can reach the right session synchronously. */
const live = new Map<string, MessagePort>()

function post(id: string, request: PtyPortRequest): void {
  live.get(id)?.postMessage(request)
}

const api: ElecdexApi = {
  system: {
    info: () => ipcRenderer.invoke(CH.system.info) as Promise<AppInfo>,
    openExternal: (url) => ipcRenderer.invoke(CH.system.openExternal, url) as Promise<void>,
    revealInFolder: (path) => ipcRenderer.invoke(CH.system.revealInFolder, path) as Promise<void>,
    toggleDevTools: () => ipcRenderer.send(CH.system.toggleDevTools),
    setFullscreen: (on) => ipcRenderer.send(CH.system.setFullscreen, on),
  },
  pty: {
    create: (opts?: PtyCreateOptions) =>
      ipcRenderer.invoke(CH.pty.create, opts ?? {}) as Promise<PtySessionSummary>,
    attach,
    write: (id, data) => post(id, { t: 'write', data }),
    resize: (id, cols, rows) => post(id, { t: 'resize', cols, rows }),
    dispose: (id) => ipcRenderer.invoke(CH.pty.dispose, id) as Promise<void>,
    list: () => ipcRenderer.invoke(CH.pty.list) as Promise<PtySessionSummary[]>,
  },
}

contextBridge.exposeInMainWorld('elecdex', api)
