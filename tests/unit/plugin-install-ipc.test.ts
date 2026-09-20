import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { CH } from '@shared/channels'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The install handler: the picker, the question before a replacement, and the
 * catalog that follows.
 *
 * It cannot be driven end to end - the picker is a native dialog, and an e2e
 * run would sit in front of it - so the dialog is the thing that is mocked here
 * and everything behind it is real: a real folder, a real copy, a real scan.
 */

type Handler = (event: unknown, ...args: unknown[]) => unknown
const handlers = new Map<string, Handler>()
const sent: Array<{ channel: string; payload: unknown }> = []

let userData = ''
/** What the picker answers: a folder, or nothing (closed). */
let picked: string[] = []
/** What the "replace?" box answers: 0 is Replace. */
let replaceAnswer = 1

vi.mock('electron', () => ({
  app: { getPath: () => userData, getVersion: () => '0.0.0' },
  ipcMain: {
    handle: (channel: string, handler: Handler) => handlers.set(channel, handler),
    removeHandler: (channel: string) => handlers.delete(channel),
    on: () => {},
    removeAllListeners: () => {},
  },
  BrowserWindow: { fromWebContents: () => null },
  dialog: {
    showOpenDialog: async () => ({ canceled: picked.length === 0, filePaths: picked }),
    showMessageBox: async () => ({ response: replaceAnswer }),
  },
  Notification: { isSupported: () => false },
  shell: { openPath: async () => '' },
  session: { fromPartition: () => ({ setPermissionRequestHandler: () => {} }) },
}))

vi.mock('../../src/main/app-windows.js', () => ({
  appWindows: () => [
    {
      webContents: {
        isDestroyed: () => false,
        send: (channel: string, payload: unknown) => sent.push({ channel, payload }),
      },
    },
  ],
}))

const { registerPluginsIpc } = await import('../../src/main/ipc/plugins.js')

const settings = {
  current: () => ({ plugins: {} }) as never,
  onChange: () => {},
  file: '',
  dispose: () => {},
}

const invoke = (channel: string, ...args: unknown[]) => handlers.get(channel)?.({}, ...args)

let root = ''
let source = ''
let ipc: { dispose: () => void } | null = null

beforeEach(() => {
  handlers.clear()
  sent.length = 0
  replaceAnswer = 1
  root = mkdtempSync(path.join(tmpdir(), 'elecdex-install-ipc-'))
  userData = path.join(root, 'userData')
  mkdirSync(userData, { recursive: true })
  // Not "pomodoro": that is the sample written into a new plugins folder, and
  // installing over it is its own case below.
  source = path.join(root, 'stopwatch')
  mkdirSync(source, { recursive: true })
  writeFileSync(path.join(source, 'index.ts'), 'export default { id: "stopwatch" }')
  writeFileSync(path.join(source, 'notes.md'), '# not code')
  picked = [source]
  ipc = registerPluginsIpc(settings as never)
})

afterEach(() => {
  ipc?.dispose()
  ipc = null
  rmSync(root, { recursive: true, force: true })
  vi.clearAllMocks()
})

const pluginsDir = () => path.join(userData, 'plugins')

describe('installing a plugin from the settings', () => {
  it('copies it in and tells the pages the catalog changed', async () => {
    const result = await invoke(CH.plugins.install)
    expect(result).toEqual({ status: 'installed', name: 'stopwatch', files: 1 })
    // The code, and not the README beside it.
    expect(readdirSync(path.join(pluginsDir(), 'stopwatch'))).toEqual(['index.ts'])
    expect(sent.map((s) => s.channel)).toContain(CH.plugins.changed)
  })

  it('says nothing happened when the picker is closed', async () => {
    picked = []
    expect(await invoke(CH.plugins.install)).toEqual({ status: 'cancelled' })
    expect(sent).toHaveLength(0)
  })

  it('says why when the folder is not a plugin', async () => {
    const notOne = path.join(root, 'notes')
    mkdirSync(notOne)
    writeFileSync(path.join(notOne, 'README.md'), '# hello')
    picked = [notOne]
    expect(await invoke(CH.plugins.install)).toEqual({
      status: 'refused',
      reason: expect.stringContaining('index.ts'),
    })
    expect(sent).toHaveLength(0)
  })

  it('asks before replacing one of the same name, and leaves it alone on no', async () => {
    await invoke(CH.plugins.install)
    writeFileSync(path.join(source, 'index.ts'), 'export default { id: "other" }')
    replaceAnswer = 1
    expect(await invoke(CH.plugins.install)).toEqual({ status: 'cancelled' })

    replaceAnswer = 0
    expect(await invoke(CH.plugins.install)).toEqual({
      status: 'installed',
      name: 'stopwatch',
      files: 1,
    })
  })

  it('asks before replacing the sample that comes with elecdex', async () => {
    const sample = path.join(root, 'pomodoro')
    mkdirSync(sample)
    writeFileSync(path.join(sample, 'index.ts'), 'export default { id: "mine" }')
    picked = [sample]
    replaceAnswer = 1
    expect(await invoke(CH.plugins.install)).toEqual({ status: 'cancelled' })
  })

  it('takes its handler back when disposed', () => {
    ipc?.dispose()
    ipc = null
    expect(handlers.has(CH.plugins.install)).toBe(false)
  })
})
