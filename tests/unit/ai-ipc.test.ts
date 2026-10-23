import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { CH } from '@shared/channels'
import { defaultSettings, type Settings } from '@shared/settings'
import { afterAll, describe, expect, it, vi } from 'vitest'

/**
 * The AI chat's IPC module hands the conversation service what the settings say now - the
 * providers, the system prompt and whether what stays behind is summarised - read at each
 * question, not once. The service itself is tested in ai-context.test.ts and ai-service.test.ts;
 * here it is a stand-in that keeps what it was given.
 */

const userData = mkdtempSync(path.join(tmpdir(), 'elecdex-ai-ipc-'))
const { handles, ipcMain } = await vi.hoisted(async () =>
  (await import('./support/electron-ipc')).fakeIpcMain(),
)

vi.mock('electron', () => ({
  app: { getPath: () => userData },
  net: { fetch: () => Promise.reject(new Error('no network in a unit test')) },
  ipcMain,
  BrowserWindow: { getAllWindows: () => [], fromWebContents: () => null },
  dialog: {},
  safeStorage: { isEncryptionAvailable: () => false },
}))

vi.mock('../../src/main/ipc/elec.js', () => ({
  registerElecIpc: () => ({ dispose: () => {} }),
}))

interface Deps {
  providers(): unknown
  systemPrompt(): string
  compact(): boolean
}
const given: Deps[] = []
vi.mock('../../src/main/ai/service.js', () => ({
  AiChatService: class {
    constructor(deps: Deps) {
      given.push(deps)
    }
    create() {
      return 'chat'
    }
    dispose() {}
  },
}))

const { registerAiIpc } = await import('../../src/main/ipc/ai.js')

afterAll(() => {
  rmSync(userData, { recursive: true, force: true })
})

describe('the chat service as the settings make it', () => {
  it('summarises, and is told the prompt and providers, as the settings say at each question', () => {
    let current: Settings = defaultSettings()
    const settings = {
      current: () => current,
      onChange: () => () => {},
    } as unknown as Parameters<typeof registerAiIpc>[0]
    const ai = registerAiIpc(settings)
    try {
      // Made on the first question about the conversations, not before.
      expect(given).toHaveLength(0)
      expect(handles.get(CH.ai.create)?.({})).toBe('chat')
      const deps = given[0] as Deps
      expect(deps.compact()).toBe(false)

      const providers = [
        {
          id: 'local',
          name: 'Local',
          kind: 'openai' as const,
          baseUrl: 'http://localhost:11434/v1',
          model: 'tiny',
        },
      ]
      current = {
        ...current,
        ai: { ...current.ai, compact: true, systemPrompt: 'Answer briefly.', providers },
      }
      expect(deps.compact()).toBe(true)
      expect(deps.systemPrompt()).toBe('Answer briefly.')
      expect(deps.providers()).toEqual(providers)

      current = { ...current, ai: { ...current.ai, compact: false } }
      expect(deps.compact()).toBe(false)
    } finally {
      ai.dispose()
    }
  })
})
