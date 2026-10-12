import os from 'node:os'
import path from 'node:path'
import { CH } from '@shared/channels'
import {
  isEncodingChoice,
  isExplainToken,
  isLogFormat,
  isLogId,
  type LogExplainRequest,
  parseExplainRequest,
  parseSubscribeRequest,
} from '@shared/logwatch/types'
import { app, BrowserWindow, dialog, type WebContents } from 'electron'
import { LogCatalog } from '../logwatch/catalog.js'
import { LogExplainer } from '../logwatch/explain.js'
import { nodeFs } from '../logwatch/node-fs.js'
import { type Pick, registerChosen } from '../logwatch/register.js'
import { LogWatchService } from '../logwatch/service.js'
import type { ElecLinks } from './elec.js'
import { whenPageGoes } from './page-gone.js'
import type { SettingsHandle } from './settings.js'
import { registerTable } from './table.js'

/**
 * LOG WATCH's IPC (docs/logwatch.md §10). The page names a file only by the id main gave it at
 * the picker; main reads only files of its own catalog, and only while a page shows them.
 * EXPLAIN asks the AI settings' providers through the chat's adapters and keys.
 */

export function registerLogWatchIpc(
  settings: SettingsHandle,
  ai: ElecLinks,
): { dispose: () => void } {
  const catalog = new LogCatalog(path.join(app.getPath('userData'), 'log-files.json'), os.homedir())
  const pages = new Set<WebContents>()

  const service = new LogWatchService<WebContents>({
    fs: nodeFs,
    entry: (id) => catalog.get(id),
    keepLines: () => settings.current().logWatch.keepLines,
    initialLines: () => settings.current().logWatch.initialLines,
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    send: (page, event) => {
      if (!page.isDestroyed()) page.send(CH.logwatch.event, event)
    },
  })

  const explainer = new LogExplainer<WebContents>({
    providers: () => settings.current().ai.providers,
    systemPrompt: () => settings.current().ai.systemPrompt,
    keyFor: ai.keyFor,
    adapter: ai.adapter,
    context: (request: LogExplainRequest) =>
      service.context(request.id, request.encoding, request.seq),
    newId: () => crypto.randomUUID(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    send: (page, event) => {
      if (!page.isDestroyed()) page.send(CH.logwatch.explained, event)
    },
  })

  const track = (page: WebContents): void => {
    pages.add(page)
    whenPageGoes(page, pages, () => {
      pages.delete(page)
      service.dropPage(page)
      explainer.dropPage(page)
    })
  }

  const unregister = registerTable({
    on: {
      [CH.logwatch.subscribe]: (event, raw) => {
        const request = parseSubscribeRequest(raw)
        if (request === null) return
        track(event.sender)
        service.subscribe(event.sender, request)
      },
      [CH.logwatch.unsubscribe]: (event, id, encoding) => {
        if (isLogId(id) && isEncodingChoice(encoding))
          service.unsubscribe(event.sender, id, encoding)
      },
      [CH.logwatch.cancelExplain]: (event, token) => {
        if (isExplainToken(token)) explainer.cancel(event.sender, token)
      },
    },
    handle: {
      [CH.logwatch.pick]: async (event, newest): Promise<Pick> => {
        const owner = BrowserWindow.fromWebContents(event.sender)
        const options: Electron.OpenDialogOptions = {
          title: newest === true ? 'Follow the newest log like this one' : 'Watch a log file',
          properties: ['openFile'],
          buttonLabel: 'Watch',
        }
        const picked = owner
          ? await dialog.showOpenDialog(owner, options)
          : await dialog.showOpenDialog(options)
        const chosen = picked.canceled ? undefined : picked.filePaths[0]
        if (chosen === undefined) return null
        return registerChosen(catalog, chosen, newest === true, Date.now())
      },
      [CH.logwatch.describe]: (_event, id) => {
        if (!isLogId(id)) return null
        const entry = catalog.get(id)
        return entry === null ? null : catalog.ref(entry)
      },
      [CH.logwatch.recent]: () => catalog.recent(),
      [CH.logwatch.setFormat]: (_event, id, format) => {
        if (!isLogId(id) || !(format === null || isLogFormat(format))) return false
        if (catalog.setFormat(id, format) === null) return false
        service.reload(id)
        return true
      },
      [CH.logwatch.preview]: (_event, raw) => {
        const request = parseExplainRequest(raw)
        return request === null ? null : explainer.preview(request)
      },
      [CH.logwatch.explain]: (event, raw) => {
        const request = parseExplainRequest(raw)
        if (request === null) return { problem: 'not a line this pane shows' }
        track(event.sender)
        return explainer.start(event.sender, request)
      },
      [CH.logwatch.watching]: () => service.watching(),
    },
  })

  return {
    dispose: () => {
      explainer.dispose()
      service.dispose()
      unregister()
    },
  }
}
