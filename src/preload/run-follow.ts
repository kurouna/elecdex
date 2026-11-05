import type { RunEvent } from '@shared/translate/run'

/**
 * A pane's TRANSLATE run, followed (docs/translate.md §8.5). Not a keyed subscription: a run's
 * events are numbered, and a page that follows is given a snapshot of its own rather than the last
 * event again. Each handler is one follower in main. Apart from Electron, so a test reaches it.
 */

export interface RunIpc {
  send(channel: string, paneId: string): void
  on(channel: string, listener: (event: unknown, payload: RunEvent) => void): void
}

export function runFollowing(
  ipc: RunIpc,
  channels: { follow: string; unfollow: string; event: string },
): (paneId: string, handler: (event: RunEvent) => void) => () => void {
  const handlers = new Map<string, Set<(event: RunEvent) => void>>()
  ipc.on(channels.event, (_event, payload) => {
    // A copy: a handler that follows again (a missed event) takes itself out and puts itself back,
    // and a live set would hand it the same event again, for ever with two handlers on a pane.
    for (const handler of [...(handlers.get(payload.paneId) ?? [])]) handler(payload)
  })
  return (paneId, handler) => {
    let set = handlers.get(paneId)
    if (!set) {
      set = new Set()
      handlers.set(paneId, set)
    }
    set.add(handler)
    ipc.send(channels.follow, paneId)
    let active = true
    return () => {
      if (!active) return
      active = false
      const current = handlers.get(paneId)
      current?.delete(handler)
      if (current?.size === 0) handlers.delete(paneId)
      ipc.send(channels.unfollow, paneId)
    }
  }
}
