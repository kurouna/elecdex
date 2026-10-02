import os from 'node:os'
import { CH } from '@shared/channels'
import { type DockerBoard, isDockerAction, isShortId } from '@shared/docker'
import { findEndpoint } from '../docker/endpoint.js'
import { createEngine } from '../docker/engine.js'
import { stubEngine } from '../docker/stub.js'
import { DockerWatcher } from '../docker/watcher.js'
import { PageSubscribers, registerTable } from './table.js'

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
  const stub = process.env.ELECDEX_DOCKER_STUB
  const engine =
    stub !== undefined && stub !== ''
      ? stubEngine(stub)
      : createEngine(() => findEndpoint(process.env, process.platform, os.homedir()))

  const subscribers = new PageSubscribers((anyone) => watcher.sync(anyone))
  const watcher = new DockerWatcher({
    engine,
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    publish: (board: DockerBoard) => subscribers.send(CH.docker.update, board),
  })

  const unregister = registerTable({
    on: {
      [CH.docker.subscribe]: (event) => {
        event.sender.send(CH.docker.update, watcher.board())
        subscribers.add(event.sender)
      },
      [CH.docker.unsubscribe]: (event) => subscribers.drop(event.sender),
    },
    handle: {
      [CH.docker.control]: (event, id, action) =>
        // A press counts only from a page that shows the list.
        isShortId(id) && isDockerAction(action) && subscribers.has(event.sender)
          ? watcher.control(id, action)
          : 'unsupported',
      // Diagnostics: `['engine']` while main follows the engine.
      [CH.docker.watching]: () => (watcher.active ? ['engine'] : []),
    },
  })

  return {
    dispose: () => {
      watcher.dispose()
      unregister()
    },
  }
}
