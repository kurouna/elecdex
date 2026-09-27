import os from 'node:os'
import { CH } from '@shared/channels'
import { type DockerBoard, isDockerAction, isShortId } from '@shared/docker'
import { ipcMain, type WebContents } from 'electron'
import { findEndpoint } from '../docker/endpoint.js'
import { createEngine } from '../docker/engine.js'
import { stubEngine } from '../docker/stub.js'
import { DockerWatcher } from '../docker/watcher.js'
import { whenPageGoes } from './page-gone.js'

/**
 * DOCKER IPC: the pane subscribes while it is seen, and main talks to the engine
 * only while some page is subscribed (docker/watcher.ts). A page's subscription
 * goes with its reload or its end.
 *
 * The engine's socket is as good as root on the machine, so the page reaches it
 * only through this: a listing it is given, and five presses on a container of
 * that listing, by its short id. No plugin can reach any of it (plugin-api.ts has
 * no Docker), and none of it is logged or written.
 */
export function registerDockerIpc(): { dispose: () => void } {
  const subscribers = new Set<WebContents>()
  const stub = process.env.ELECDEX_DOCKER_STUB
  const engine =
    stub !== undefined && stub !== ''
      ? stubEngine(stub)
      : createEngine(() => findEndpoint(process.env, process.platform, os.homedir()))

  const watcher = new DockerWatcher({
    engine,
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    publish: (board: DockerBoard) => {
      for (const sender of subscribers)
        if (!sender.isDestroyed()) sender.send(CH.docker.update, board)
    },
  })

  const drop = (sender: WebContents): void => {
    if (subscribers.delete(sender)) watcher.sync(subscribers.size > 0)
  }

  ipcMain.on(CH.docker.subscribe, (event) => {
    whenPageGoes(event.sender, subscribers, () => drop(event.sender))
    subscribers.add(event.sender)
    event.sender.send(CH.docker.update, watcher.board())
    watcher.sync(true)
  })

  ipcMain.on(CH.docker.unsubscribe, (event) => drop(event.sender))

  ipcMain.handle(CH.docker.control, (event, id: unknown, action: unknown) =>
    // A press counts only from a page that shows the list.
    isShortId(id) && isDockerAction(action) && subscribers.has(event.sender)
      ? watcher.control(id, action)
      : 'unsupported',
  )

  // Diagnostics: whether main is following the engine now.
  ipcMain.handle(CH.docker.watching, () => watcher.active)

  return {
    dispose: () => {
      watcher.dispose()
      ipcMain.removeAllListeners(CH.docker.subscribe)
      ipcMain.removeAllListeners(CH.docker.unsubscribe)
      ipcMain.removeHandler(CH.docker.control)
      ipcMain.removeHandler(CH.docker.watching)
    },
  }
}
