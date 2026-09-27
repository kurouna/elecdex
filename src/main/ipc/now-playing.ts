import { CH } from '@shared/channels'
import { ART_EDGE, isNowPlayingAction, LARGE_ART_EDGE, type NowPlaying } from '@shared/now-playing'
import { ipcMain, nativeImage, type WebContents } from 'electron'
import { type DemoCover, demoCoverPixels } from '../media/demo-art.js'
import { type StubCover, stubNowPlaying } from '../media/stub.js'
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
/** The demo tracks' covers, drawn and made JPEGs at the reader's two sizes (the screenshots, the demos). */
function demoCovers(): StubCover[] {
  const jpeg = (cover: DemoCover, size: number): string =>
    nativeImage
      .createFromBitmap(Buffer.from(demoCoverPixels(cover, size)), { width: size, height: size })
      .toJPEG(82)
      .toString('base64')
  return (['sunset', 'orbit'] as const).map((cover) => ({
    small: jpeg(cover, ART_EDGE),
    large: jpeg(cover, LARGE_ART_EDGE),
  }))
}

export function registerNowPlayingIpc(): { dispose: () => void } {
  const subscribers = new Set<WebContents>()
  const stub = process.env.ELECDEX_NOWPLAYING_STUB
  const backend =
    stub === '1' || stub === 'demo'
      ? stubNowPlaying(stub === 'demo', Date.now, stub === 'demo' ? demoCovers() : [])
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

  // The position is checked against the session shown (`seekTarget`).
  ipcMain.handle(CH.nowPlaying.seek, (event, seconds: unknown) =>
    subscribers.has(event.sender) ? watcher.seek(seconds) : 'unsupported',
  )

  ipcMain.handle(CH.nowPlaying.art, (event) =>
    subscribers.has(event.sender) ? watcher.largeArt() : null,
  )

  // Diagnostics: whether main is reading the session now.
  ipcMain.handle(CH.nowPlaying.watching, () => watcher.active)

  return {
    dispose: () => {
      watcher.dispose()
      ipcMain.removeAllListeners(CH.nowPlaying.subscribe)
      ipcMain.removeAllListeners(CH.nowPlaying.unsubscribe)
      ipcMain.removeHandler(CH.nowPlaying.control)
      ipcMain.removeHandler(CH.nowPlaying.seek)
      ipcMain.removeHandler(CH.nowPlaying.art)
      ipcMain.removeHandler(CH.nowPlaying.watching)
    },
  }
}
