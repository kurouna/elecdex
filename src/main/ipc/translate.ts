import { CH } from '@shared/channels'
import { MAX_SOURCE_CHARS } from '@shared/translate/blocks'
import { isLicencePage, LICENCE_PAGES, PLAMO_LICENSE_URL } from '@shared/translate/board'
import { historyRow } from '@shared/translate/history'
import { isSourceLang } from '@shared/translate/languages'
import { PANE_ID, RunRequestSchema } from '@shared/translate/run'
import { app, BrowserWindow, dialog, net, shell, type WebContents } from 'electron'
import { RunFollowers } from '../translate/followers.js'
import { TranslateService } from '../translate/service.js'
import type { ClipboardTextReader } from './clipboard.js'
import { whenPageGoes, whenPageLoads } from './page-gone.js'
import type { SettingsHandle } from './settings.js'
import { PageSubscribers, registerTable } from './table.js'

/**
 * TRANSLATE's IPC (docs/translate.md §8.3). The page follows a board and presses buttons; main
 * alone starts llama-server, fetches, and holds where the engine comes from. Every argument is
 * checked here, as `unknown`, before the service sees it.
 */

const SOURCES = new Set(['fetched', 'own', 'external'])
/** A block's place in a run, and the longest text EDIT may give one. */
const blockIndex = (raw: unknown): raw is number =>
  typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw < 10_000
const MAX_BLOCK_TEXT = 80_000
/** A glossary's or a history entry's id. */
const ENTRY_ID = /^[\w-]{1,40}$/

export function registerTranslateIpc(
  settings: SettingsHandle,
  clipboardText: ClipboardTextReader,
): {
  dispose: () => void
  /** elecdex is quitting: the engine, a fetch and the hashing end now (§4.3). */
  quit: () => void
} {
  const env = process.env
  /** When the PLaMo Community License's page was last opened from elecdex, for the consent log. */
  let licenceOpenedAt: string | null = null
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
  // Changes come in bursts (a download's progress, the engine's boot lines), and each board stats
  // every model's files: one board per 50 ms, and never two in flight, so they arrive in order.
  let timer: NodeJS.Timeout | null = null
  let building = false
  let again = false
  const send = (): void => {
    timer = null
    if (subscribers.size === 0) return
    if (building) {
      again = true
      return
    }
    building = true
    void service
      .board()
      .then((board) => subscribers.send(CH.translate.board, board))
      .catch((error) => console.error('[elecdex] translate board', error))
      .finally(() => {
        building = false
        if (again) {
          again = false
          send()
        }
      })
  }
  const publish = (): void => {
    timer ??= setTimeout(send, 50)
  }
  service.onChange(publish)

  // Who follows which pane's run: each follow is one follower in main, dropped with its page. A
  // reload holds the run until the page has loaded again (§8.5).
  const following = new RunFollowers<WebContents>(service.runs, CH.translate.runEvent)
  const owner = {}
  const unsubscribeRuns = service.onRunEvent((event) => following.publish(event))
  const paneOf = (raw: unknown): string | null =>
    typeof raw === 'string' && PANE_ID.test(raw) ? raw : null

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
      [CH.translate.follow]: (event, raw) => {
        const paneId = paneOf(raw)
        if (paneId === null) return
        const sender = event.sender
        whenPageGoes(sender, owner, () => following.gone(sender))
        whenPageLoads(sender, owner, () => service.runs.pageLoaded())
        following.follow(sender, paneId)
      },
      [CH.translate.unfollow]: (event, raw) => {
        const paneId = paneOf(raw)
        if (paneId !== null) following.unfollow(event.sender, paneId)
      },
      [CH.translate.stop]: (_event, raw) => {
        const paneId = paneOf(raw)
        if (paneId !== null) service.runs.stop(paneId)
      },
      [CH.translate.clear]: (_event, raw) => {
        const paneId = paneOf(raw)
        if (paneId !== null) service.runs.discard(paneId)
      },
      [CH.translate.cancelLive]: (_event, raw) => {
        const paneId = paneOf(raw)
        if (paneId !== null) service.runs.cancelLive(paneId)
      },
    },
    handle: {
      [CH.translate.engineStart]: async () => {
        await service.engine.ensure().catch(() => {})
      },
      [CH.translate.engineStop]: () => service.stopEngine(),
      [CH.translate.engineRestart]: () => service.restartEngine(),
      [CH.translate.run]: (_event, raw) => {
        const parsed = RunRequestSchema.safeParse(raw)
        if (!parsed.success) return { problem: 'Not a translation request.' }
        if (service.engine.phase === 'absent') return { problem: 'Set up a model first.' }
        return { version: service.runs.start(parsed.data) }
      },
      [CH.translate.editBlock]: (_event, rawPane, rawIndex, rawText) => {
        const paneId = paneOf(rawPane)
        if (paneId === null || !blockIndex(rawIndex)) return
        if (typeof rawText !== 'string' || rawText.length > MAX_BLOCK_TEXT) return
        service.runs.editBlock(paneId, rawIndex, rawText)
      },
      [CH.translate.retryBlock]: (_event, rawPane, rawIndex) => {
        const paneId = paneOf(rawPane)
        if (paneId !== null && blockIndex(rawIndex)) service.runs.retry(paneId, rawIndex)
      },
      [CH.translate.roundTrip]: (_event, rawPane, rawLang) => {
        const paneId = paneOf(rawPane)
        if (paneId !== null && isSourceLang(rawLang)) service.runs.roundTrip(paneId, rawLang)
      },
      // Ctrl+Shift+Y (§12): the clipboard's text once, to translate; nothing for any other copy.
      [CH.translate.clipboardText]: async () => {
        const text = await clipboardText()
        // Not cut to the pane's limit: a text past it is shown as too long, never shortened unsaid.
        // Bounded only so a huge copy does not cross IPC whole.
        return text !== null && text.trim() !== '' ? text.slice(0, MAX_SOURCE_CHARS * 10) : null
      },
      [CH.translate.glossaries]: () => service.library.glossaries(),
      [CH.translate.glossarySave]: (_event, raw) => service.library.saveGlossary(raw),
      [CH.translate.glossaryRemove]: (_event, raw) => {
        if (typeof raw === 'string' && ENTRY_ID.test(raw)) service.library.removeGlossary(raw)
      },
      [CH.translate.history]: () => service.library.history().map(historyRow),
      [CH.translate.historyRemove]: (_event, raw) => {
        if (typeof raw === 'string' && ENTRY_ID.test(raw)) service.library.removeEntry(raw)
      },
      [CH.translate.historyClear]: () => service.library.clearHistory(),
      [CH.translate.historyOpen]: (_event, rawPane, rawId) => {
        const paneId = paneOf(rawPane)
        if (paneId === null || typeof rawId !== 'string' || !ENTRY_ID.test(rawId)) {
          return { problem: 'No such entry.' }
        }
        return service.showEntry(paneId, rawId)
      },
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
      [CH.translate.consent]: async (_event, modelId) => {
        if (!knownModel(modelId)) return
        const openedAt = licenceOpenedAt
        const answer = await service.consent(modelId, {
          licence: PLAMO_LICENSE_URL,
          openedAt,
          appVersion: app.getVersion(),
        })
        // Spent on this agreement, once it is written: a later one says when the page was opened
        // for it, or that it was not. One that failed to be written keeps it for its retry, and a
        // page opened again in the meantime is kept for the next.
        if ('revision' in answer && licenceOpenedAt === openedAt) licenceOpenedAt = null
        return answer
      },
      // ENGINE opened: newer commits of the models in place, asked at most once a day (§5).
      [CH.translate.checkUpdates]: async () => {
        await service.checkUpdates()
      },
      [CH.translate.fetch]: (_event, modelId) => {
        if (!knownModel(modelId)) return { problem: 'No such model.' }
        const problem = service.fetchProblem(modelId)
        if (problem) return { problem }
        // Runs on with the pane closed; how it goes is on the board.
        void service.fetchFor(modelId)
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
      // Fixed addresses only: the page names one of them, never the address.
      [CH.translate.openLicence]: async (_event, page) => {
        if (!isLicencePage(page)) return
        // When the licence's own page was opened, for the consent log.
        if (page === 'plamo') licenceOpenedAt = new Date().toISOString()
        await shell.openExternal(LICENCE_PAGES[page])
      },
      [CH.translate.watching]: () =>
        [...(subscribers.size > 0 ? ['board'] : []), ...service.watching()].sort(),
    },
  })

  return {
    dispose: () => {
      if (timer) clearTimeout(timer)
      timer = null
      unsubscribeRuns()
      unregister()
    },
    quit: () => service.quit(),
  }
}
