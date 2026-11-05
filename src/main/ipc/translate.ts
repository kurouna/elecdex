import { CH } from '@shared/channels'
import { PLAMO_LICENSE_URL } from '@shared/translate/board'
import { app, BrowserWindow, dialog, net, shell } from 'electron'
import { TranslateService } from '../translate/service.js'
import type { SettingsHandle } from './settings.js'
import { PageSubscribers, registerTable } from './table.js'

/**
 * TRANSLATE's IPC (docs/translate.md §8.3). The page follows a board and presses buttons; main
 * alone starts llama-server, fetches, and holds where the engine comes from. Every argument is
 * checked here, as `unknown`, before the service sees it.
 */

const SOURCES = new Set(['fetched', 'own', 'external'])

export function registerTranslateIpc(settings: SettingsHandle): {
  dispose: () => void
  /** elecdex is quitting: the engine, a fetch and the hashing end now (§4.3). */
  quit: () => void
} {
  const env = process.env
  const stallMs = Number(env.ELECDEX_LLAMA_STALL_MS)
  const service = new TranslateService(
    {
      userData: app.getPath('userData'),
      platform: process.platform,
      arch: process.arch,
      hfBase: env.ELECDEX_HF_BASE_URL,
      releasesBase: env.ELECDEX_LLAMA_RELEASES_URL,
      manifest: env.ELECDEX_TRANSLATE_MANIFEST,
      stubServer: env.ELECDEX_LLAMA_SERVER,
      stallMs: Number.isFinite(stallMs) && stallMs > 0 ? stallMs : undefined,
      execPath: process.execPath,
      netFetch: (url, init) => net.fetch(url, { ...init, credentials: 'omit', cache: 'no-store' }),
      gpuName: async () => {
        try {
          const info = (await app.getGPUInfo('basic')) as {
            gpuDevice?: { deviceString?: string; active?: boolean }[]
          }
          const devices = info.gpuDevice ?? []
          return (devices.find((d) => d.active) ?? devices[0])?.deviceString ?? null
        } catch {
          return null
        }
      },
    },
    settings.current().translate,
  )
  settings.onChange((next) => service.setSettings(next.translate))

  const subscribers = new PageSubscribers(() => {})
  const publish = (): void => {
    if (subscribers.size === 0) return
    void service.board().then((board) => subscribers.send(CH.translate.board, board))
  }
  service.onChange(publish)

  const knownModel = (id: unknown): id is string =>
    typeof id === 'string' && service.models.some((model) => model.id === id)

  const unregister = registerTable({
    on: {
      [CH.translate.subscribe]: (event) => {
        subscribers.add(event.sender)
        void service.board().then((board) => {
          if (!event.sender.isDestroyed()) event.sender.send(CH.translate.board, board)
        })
      },
      [CH.translate.unsubscribe]: (event) => subscribers.drop(event.sender),
    },
    handle: {
      [CH.translate.engineStart]: async () => {
        await service.engine.ensure().catch(() => {})
      },
      [CH.translate.engineStop]: () => service.engine.stop(),
      [CH.translate.engineRestart]: () => service.engine.restart(),
      [CH.translate.setSource]: (_event, kind) => {
        if (typeof kind !== 'string' || !SOURCES.has(kind)) return { problem: 'No such source.' }
        try {
          service.setSource(kind as 'fetched' | 'own' | 'external')
          return null
        } catch (error) {
          return { problem: error instanceof Error ? error.message : String(error) }
        }
      },
      [CH.translate.pickOwn]: async (event) => {
        const owner = BrowserWindow.fromWebContents(event.sender)
        const options = {
          title: 'Choose llama-server',
          properties: ['openFile' as const],
          filters:
            process.platform === 'win32'
              ? [{ name: 'llama-server', extensions: ['exe'] }]
              : [{ name: 'llama-server', extensions: ['*'] }],
        }
        const picked = owner
          ? await dialog.showOpenDialog(owner, options)
          : await dialog.showOpenDialog(options)
        const file = picked.filePaths[0]
        if (picked.canceled || !file) return null
        return service.chooseOwn(file)
      },
      [CH.translate.testExternal]: (_event, address) => service.testExternal(address),
      [CH.translate.consent]: (_event, modelId) => {
        if (knownModel(modelId)) service.consent(modelId, PLAMO_LICENSE_URL)
      },
      [CH.translate.fetch]: () => {
        const problem = service.fetchProblem()
        if (problem) return { problem }
        // Runs on with the pane closed; how it goes is on the board.
        void service.fetchSelected()
        return null
      },
      [CH.translate.pause]: () => service.pause(),
      [CH.translate.cancelFetch]: () => service.cancelFetch(),
      [CH.translate.removeModel]: async (_event, modelId) => {
        if (knownModel(modelId)) await service.removeModel(modelId)
      },
      [CH.translate.logs]: () => service.logs(),
      [CH.translate.selfTest]: async () => {
        try {
          return await service.selfTest()
        } catch (error) {
          return { problem: error instanceof Error ? error.message : String(error) }
        }
      },
      // A fixed address only: the page cannot name what is opened.
      [CH.translate.openLicence]: () => shell.openExternal(PLAMO_LICENSE_URL),
      [CH.translate.watching]: () =>
        [...(subscribers.size > 0 ? ['board'] : []), ...service.watching()].sort(),
    },
  })

  return {
    dispose: () => {
      unregister()
    },
    quit: () => service.quit(),
  }
}
