import { CH } from '@shared/channels'
import { isNowPlayingAction, type NowPlaying } from '@shared/now-playing'
import { ipcMain, type WebContents } from 'electron'
import { stubNowPlaying } from '../media/stub.js'
import { NowPlayingWatcher } from '../media/watcher.js'
import { windowsNowPlayingBackend } from '../media/windows.js'
import { whenPageGoes } from './page-gone.js'

/**
 * NOW PLAYING IPC: the pane subscribes while it is seen, and main reads the
 * media session only while some page is subscribed (media/watcher.ts). A page's
 * subscription goes with its reload or its end.
 *
 * What a track is called can say something about someone, so none of it is
 * logged or written, and no plugin can reach it: plugin-api.ts has no media.
 * Only Windows is read for now; elsewhere the pane says it cannot be.
 */
export function registerNowPlayingIpc(): { dispose: () => void } {
  const subscribers = new Set<WebContents>()
  const stub = process.env.ELECDEX_NOWPLAYING_STUB
  const backend =
    stub === '1' || stub === 'demo'
      ? stubNowPlaying(stub === 'demo')
      : process.platform === 'win32'
        ? windowsNowPlayingBackend()
        : null

  const watcher = new NowPlayingWatcher({
    backend,
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    publish: (state: NowPlaying) => {
      for (const sender of subscribers)
        if (!sender.isDestroyed()) sender.send(CH.nowPlaying.update, state)
    },
  })

  const drop = (sender: WebContents): void => {
    if (subscribers.delete(sender)) watcher.sync(subscribers.size > 0)
  }

  ipcMain.on(CH.nowPlaying.subscribe, (event) => {
    whenPageGoes(event.sender, subscribers, () => drop(event.sender))
    subscribers.add(event.sender)
    event.sender.send(CH.nowPlaying.update, watcher.state())
    watcher.sync(true)
  })

  ipcMain.on(CH.nowPlaying.unsubscribe, (event) => drop(event.sender))

  ipcMain.handle(CH.nowPlaying.control, (event, action: unknown) =>
    // A press counts only from a page that shows the session.
    isNowPlayingAction(action) && subscribers.has(event.sender)
      ? watcher.control(action)
      : 'unsupported',
  )

  // Diagnostics: whether main is reading the session now.
  ipcMain.handle(CH.nowPlaying.watching, () => watcher.active)

  return {
    dispose: () => {
      watcher.dispose()
      ipcMain.removeAllListeners(CH.nowPlaying.subscribe)
      ipcMain.removeAllListeners(CH.nowPlaying.unsubscribe)
      ipcMain.removeHandler(CH.nowPlaying.control)
      ipcMain.removeHandler(CH.nowPlaying.watching)
    },
  }
}
