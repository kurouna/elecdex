import { CH } from '@shared/channels'
import type { ClipBoard } from '@shared/clipboard'
import { isClipId } from '@shared/clipboard'
import { DEMO_HOLDING, demoHistory, stubClipboard } from '../clipboard/stub.js'
import {
  clearSystemClipboard,
  readSystemClipboard,
  writeSystemClipboard,
  writeSystemImage,
} from '../clipboard/system.js'
import { ClipboardWatcher } from '../clipboard/watcher.js'
import { broadcastSnippets, openSnippetShelf, registerSnippetsIpc } from './snippets.js'
import { PageSubscribers, registerTable } from './table.js'

/**
 * Clipboard IPC: the clipboard pane subscribes while it is seen, and main reads
 * the clipboard only while some page is subscribed (clipboard/watcher.ts). A
 * page's subscription goes with its reload or its end.
 *
 * The page is given previews; the whole text and its HTML stay here, and are
 * put back by id. No plugin can reach any of it: plugin-api.ts has no clipboard.
 *
 * What other panes put on the clipboard through main (the UTILITY pane's copies)
 * goes through `writer`, so the tests' stand-in catches it as well.
 */
export interface ClipboardWriter {
  writeText(text: string): Promise<void>
  writeImage(png: Uint8Array): Promise<void>
}

export function registerClipboardIpc(): { dispose: () => void; writer: ClipboardWriter } {
  const subscribers = new PageSubscribers((anyone) => watcher.sync(anyone))
  const stub = process.env.ELECDEX_CLIPBOARD_STUB
  const stand =
    stub === '1' || stub === 'demo' ? stubClipboard(stub === 'demo' ? DEMO_HOLDING : null) : null

  // The snippets change the history's marks (which rows are kept, which snippet is on the clipboard).
  const snippets = openSnippetShelf(() => {
    broadcastSnippets(snippets.shelf.views())
    watcher.republish()
  })

  const watcher = new ClipboardWatcher({
    read: stand?.read ?? readSystemClipboard,
    write: stand?.write ?? writeSystemClipboard,
    clear: stand?.clear ?? clearSystemClipboard,
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    publish: (board: ClipBoard) => subscribers.send(CH.clipboard.update, board),
    ...(stub === 'demo' ? { initial: demoHistory(Date.now()) } : {}),
    snipOf: (text) => snippets.shelf.idOf(text),
  })
  const snippetsIpc = registerSnippetsIpc(snippets.shelf, watcher)

  const unregister = registerTable({
    on: {
      [CH.clipboard.subscribe]: (event) => {
        event.sender.send(CH.clipboard.update, watcher.board())
        subscribers.add(event.sender)
      },
      [CH.clipboard.unsubscribe]: (event) => subscribers.drop(event.sender),
      [CH.clipboard.remove]: (_event, id) => {
        if (isClipId(id)) watcher.remove(id)
      },
      [CH.clipboard.clear]: () => void watcher.clear(),
      [CH.clipboard.pause]: (_event, paused) => {
        if (typeof paused === 'boolean') watcher.setPaused(paused)
      },
    },
    handle: {
      [CH.clipboard.restore]: (_event, id) => (isClipId(id) ? watcher.restore(id) : 'missing'),
      // Diagnostics: whether main is reading the clipboard now.
      [CH.clipboard.watching]: () => (watcher.active ? ['clipboard'] : []),
    },
  })

  const write = stand?.write ?? writeSystemClipboard
  const writer: ClipboardWriter = {
    writeText: (text) => write({ text, html: null, rtf: null }),
    writeImage: stand?.writeImage ?? writeSystemImage,
  }

  return {
    writer,
    dispose: () => {
      watcher.dispose()
      snippetsIpc.dispose()
      snippets.close()
      unregister()
    },
  }
}
