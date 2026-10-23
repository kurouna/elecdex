import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { CH } from '@shared/channels'
import type { LogFileRef } from '@shared/logwatch/types'
import { defaultSettings } from '@shared/settings'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * LOG WATCH's IPC module between the page and main's parts: the picker's answer checked and
 * catalogued (register.ts, logwatch-main.test.ts), and a dialect set by hand making the files
 * that follow it read afresh (the service, logwatch-service.test.ts; a stand-in here).
 */

const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-logwatch-ipc-'))
const handles = new Map<string, (...args: unknown[]) => unknown>()
let picked: string[] = []

vi.mock('electron', () => ({
  app: { getPath: () => dir },
  BrowserWindow: { fromWebContents: () => null },
  dialog: {
    showOpenDialog: async () => ({ canceled: picked.length === 0, filePaths: picked }),
  },
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handles.set(channel, handler)
    },
    removeHandler: (channel: string) => handles.delete(channel),
    on: () => {},
    off: () => {},
  },
}))

const reloaded: string[] = []
vi.mock('../../src/main/logwatch/service.js', () => ({
  LogWatchService: class {
    reload(id: string) {
      reloaded.push(id)
    }
    dispose() {}
  },
}))

const { registerLogWatchIpc } = await import('../../src/main/ipc/logwatch.js')

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

beforeEach(() => {
  handles.clear()
  reloaded.length = 0
  picked = []
})

const call = (channel: string, ...args: unknown[]) =>
  handles.get(channel)?.({ sender: {} }, ...args)

function register() {
  const settings = {
    current: () => defaultSettings(),
    onChange: () => () => {},
  } as unknown as Parameters<typeof registerLogWatchIpc>[0]
  return registerLogWatchIpc(settings, { keyFor: () => null, adapter: async () => ({}) as never })
}

describe('LOG WATCH from the page', () => {
  it('says why the picker answer cannot be followed, and catalogues one that can', async () => {
    const ipc = register()
    try {
      const file = path.join(dir, 'app.log')
      writeFileSync(file, '2026-10-12 12:00:01 INFO one\n')
      const binary = path.join(dir, 'tool.bin')
      writeFileSync(binary, Buffer.from([0x4d, 0x5a, 0, 0, 1, 2]))
      picked = [file]
      expect(await call(CH.logwatch.pick, true)).toEqual({
        problem: 'its name has nothing that changes from file to file: watch it alone',
      })
      picked = [binary]
      expect(await call(CH.logwatch.pick, false)).toEqual({ problem: 'that is not a text file' })
      picked = []
      expect(await call(CH.logwatch.pick, false)).toBeNull()

      picked = [file]
      const taken = (await call(CH.logwatch.pick, false)) as { file: LogFileRef }
      expect(taken.file).toMatchObject({ name: 'app.log', format: null })
      // An id main never gave out is not known, however well formed.
      expect(call(CH.logwatch.describe, 'abcdefabcdefabcd')).toBeNull()
      expect(call(CH.logwatch.describe, taken.file.id)).toMatchObject({ name: 'app.log' })
    } finally {
      ipc.dispose()
    }
  })

  it('reads a file afresh in the dialect set by hand, and keeps it', async () => {
    const ipc = register()
    try {
      const file = path.join(dir, 'other.log')
      writeFileSync(file, 'one\n')
      picked = [file]
      const { file: ref } = (await call(CH.logwatch.pick, false)) as { file: LogFileRef }
      expect(call(CH.logwatch.setFormat, ref.id, 'plain')).toBe(true)
      expect(reloaded).toEqual([ref.id])
      expect(call(CH.logwatch.describe, ref.id)).toMatchObject({ format: 'plain' })
      // One main does not know changes nothing and reads nothing again.
      expect(call(CH.logwatch.setFormat, 'abcdefabcdefabcd', 'plain')).toBe(false)
      expect(reloaded).toEqual([ref.id])
    } finally {
      ipc.dispose()
    }
  })
})
