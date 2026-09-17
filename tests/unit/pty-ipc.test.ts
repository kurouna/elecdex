import { CH } from '@shared/channels'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Quitting in two steps: before-quit ends the shells and refuses new ones, but
 * the handlers stay until will-quit, so a window still open (its orphan reaper,
 * a pane mounting) gets an answer instead of "No handler registered for
 * 'pty:list'".
 */

type Handler = (event: unknown, ...args: unknown[]) => unknown
const handlers = new Map<string, Handler>()

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: Handler) => {
      if (handlers.has(channel)) throw new Error(`second handler for ${channel}`)
      handlers.set(channel, handler)
    },
    removeHandler: (channel: string) => handlers.delete(channel),
    on: () => {},
  },
  BrowserWindow: { fromWebContents: () => null },
  dialog: {},
  MessageChannelMain: class {},
}))

// The real manager spawns shells through node-pty; a list of fake sessions is enough here.
const sessions = new Map<string, { id: string }>()
const created: string[] = []
vi.mock('../../src/main/pty/pty-manager.js', () => ({
  PtyManager: class {
    create() {
      const id = `s${sessions.size + 1}`
      sessions.set(id, { id })
      created.push(id)
      return { id }
    }
    list() {
      return [...sessions.values()]
    }
    has(id: string) {
      return sessions.has(id)
    }
    dispose(id: string) {
      sessions.delete(id)
    }
    disposeAll() {
      sessions.clear()
    }
  },
}))

const { registerPtyIpc } = await import('../../src/main/ipc/pty.js')

const settings = {
  current: () => ({ terminal: { startDirectory: '' } }),
} as unknown as Parameters<typeof registerPtyIpc>[0]

const invoke = async (channel: string, ...args: unknown[]) => {
  const handler = handlers.get(channel)
  if (!handler) throw new Error(`No handler registered for '${channel}'`)
  return handler({}, ...args)
}

beforeEach(() => {
  handlers.clear()
  sessions.clear()
  created.length = 0
})

describe('pty IPC while quitting', () => {
  it('ends the shells but still answers once the sessions are closed', async () => {
    const ipc = registerPtyIpc(settings)
    await invoke(CH.pty.create, {})
    expect(await invoke(CH.pty.list)).toHaveLength(1)

    ipc.closeSessions()
    expect(await invoke(CH.pty.list)).toEqual([])
    expect(await invoke(CH.pty.attach, 's1')).toBe(false)
    await expect(invoke(CH.pty.dispose, 's1')).resolves.toBeUndefined()
    expect(handlers.has(CH.settings.startDirectory)).toBe(true)
  })

  it('starts no new shell after the sessions are closed', async () => {
    const ipc = registerPtyIpc(settings)
    ipc.closeSessions()
    await expect(invoke(CH.pty.create, {})).rejects.toThrow(/quitting/)
    expect(created).toEqual([])
  })

  it('removes every handler on dispose, and can be registered again', async () => {
    const ipc = registerPtyIpc(settings)
    await invoke(CH.pty.create, {})
    ipc.closeSessions()
    ipc.dispose()
    expect(sessions.size).toBe(0)
    for (const channel of [
      CH.pty.create,
      CH.pty.list,
      CH.pty.dispose,
      CH.pty.attach,
      CH.settings.startDirectory,
      CH.settings.chooseStartDirectory,
    ]) {
      expect(handlers.has(channel), channel).toBe(false)
    }
    expect(() => registerPtyIpc(settings)).not.toThrow()
  })

  it('also ends the shells when disposed without closing first', async () => {
    const ipc = registerPtyIpc(settings)
    await invoke(CH.pty.create, {})
    ipc.dispose()
    expect(sessions.size).toBe(0)
  })
})
