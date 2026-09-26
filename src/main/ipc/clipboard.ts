import { CH } from '@shared/channels'
import type { ClipBoard } from '@shared/clipboard'
import { isClipId } from '@shared/clipboard'
import { ipcMain, type WebContents } from 'electron'
import { DEMO_HOLDING, demoHistory, stubClipboard } from '../clipboard/stub.js'
import {
  clearSystemClipboard,
  readSystemClipboard,
  writeSystemClipboard,
} from '../clipboard/system.js'
import { ClipboardWatcher } from '../clipboard/watcher.js'
import { whenPageGoes } from './page-gone.js'

/**
 * Clipboard IPC: the clipboard pane subscribes while it is seen, and main reads
 * the clipboard only while some page is subscribed (clipboard/watcher.ts). A
 * page's subscription goes with its reload or its end.
 *
 * The page is given previews; the whole text and its HTML stay here, and are
 * put back by id. No plugin can reach any of it: plugin-api.ts has no clipboard.
 */
export function registerClipboardIpc(): { dispose: () => void } {
  const subscribers = new Set<WebContents>()
  const stub = process.env.ELECDEX_CLIPBOARD_STUB
  const stand =
    stub === '1' || stub === 'demo' ? stubClipboard(stub === 'demo' ? DEMO_HOLDING : null) : null

  const watcher = new ClipboardWatcher({
    read: stand?.read ?? readSystemClipboard,
    write: stand?.write ?? writeSystemClipboard,
    clear: stand?.clear ?? clearSystemClipboard,
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    publish: (board: ClipBoard) => {
      for (const sender of subscribers)
        if (!sender.isDestroyed()) sender.send(CH.clipboard.update, board)
    },
    ...(stub === 'demo' ? { initial: demoHistory(Date.now()) } : {}),
  })

  const drop = (sender: WebContents): void => {
    if (subscribers.delete(sender)) watcher.sync(subscribers.size > 0)
  }

  ipcMain.on(CH.clipboard.subscribe, (event) => {
    whenPageGoes(event.sender, subscribers, () => drop(event.sender))
    subscribers.add(event.sender)
    event.sender.send(CH.clipboard.update, watcher.board())
    watcher.sync(true)
  })

  ipcMain.on(CH.clipboard.unsubscribe, (event) => drop(event.sender))

  ipcMain.handle(CH.clipboard.restore, (_event, id: unknown) =>
    isClipId(id) ? watcher.restore(id) : 'missing',
  )
  ipcMain.on(CH.clipboard.remove, (_event, id: unknown) => {
    if (isClipId(id)) watcher.remove(id)
  })
  ipcMain.on(CH.clipboard.clear, () => void watcher.clear())
  ipcMain.on(CH.clipboard.pause, (_event, paused: unknown) => {
    if (typeof paused === 'boolean') watcher.setPaused(paused)
  })

  // Diagnostics: whether main is reading the clipboard now.
  ipcMain.handle(CH.clipboard.watching, () => watcher.active)

  return {
    dispose: () => {
      watcher.dispose()
      for (const channel of [
        CH.clipboard.subscribe,
        CH.clipboard.unsubscribe,
        CH.clipboard.remove,
        CH.clipboard.clear,
        CH.clipboard.pause,
      ])
        ipcMain.removeAllListeners(channel)
      ipcMain.removeHandler(CH.clipboard.restore)
      ipcMain.removeHandler(CH.clipboard.watching)
    },
  }
}
