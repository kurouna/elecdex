import { CH } from '@shared/channels'
import { ART_EDGE, isNowPlayingAction, LARGE_ART_EDGE, type NowPlaying } from '@shared/now-playing'
import { nativeImage } from 'electron'
import { type DemoCover, demoCoverPixels } from '../media/demo-art.js'
import { type StubCover, stubNowPlaying } from '../media/stub.js'
import { NowPlayingWatcher } from '../media/watcher.js'
import { windowsNowPlayingBackend } from '../media/windows.js'
import { PageSubscribers, registerTable } from './table.js'

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
  const stub = process.env.ELECDEX_NOWPLAYING_STUB
  const backend =
    stub === '1' || stub === 'demo'
      ? stubNowPlaying(stub === 'demo', Date.now, stub === 'demo' ? demoCovers() : [])
      : process.platform === 'win32'
        ? windowsNowPlayingBackend()
        : null

  const subscribers = new PageSubscribers((anyone) => watcher.sync(anyone))
  const watcher = new NowPlayingWatcher({
    backend,
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    publish: (state: NowPlaying) => subscribers.send(CH.nowPlaying.update, state),
  })

  const unregister = registerTable({
    on: {
      [CH.nowPlaying.subscribe]: (event) => {
        event.sender.send(CH.nowPlaying.update, watcher.state())
        subscribers.add(event.sender)
      },
      [CH.nowPlaying.unsubscribe]: (event) => subscribers.drop(event.sender),
    },
    handle: {
      [CH.nowPlaying.control]: (event, action) =>
        // A press counts only from a page that shows the session.
        isNowPlayingAction(action) && subscribers.has(event.sender)
          ? watcher.control(action)
          : 'unsupported',
      // The position is checked against the session shown (`seekTarget`).
      [CH.nowPlaying.seek]: (event, seconds) =>
        subscribers.has(event.sender) ? watcher.seek(seconds) : 'unsupported',
      [CH.nowPlaying.art]: (event) => (subscribers.has(event.sender) ? watcher.largeArt() : null),
      // Diagnostics: whether main is reading the session now.
      [CH.nowPlaying.watching]: () => (watcher.active ? ['session'] : []),
    },
  })

  return {
    dispose: () => {
      watcher.dispose()
      unregister()
    },
  }
}
