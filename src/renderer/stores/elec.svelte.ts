import type { SessionSummary } from '@shared/elec'

/**
 * The deliberations every ELEC system pane lists in its log. The seats and the
 * rule are settings, read from the appearance store.
 *
 * Reference-counted like the chat store: a window with no ELEC pane listens for nothing.
 */
class ElecStore {
  sessions = $state<SessionSummary[]>([])

  private users = 0
  private stop: (() => void) | null = null

  /** Called while an ELEC pane is mounted; returns the release. */
  use(): () => void {
    this.users += 1
    if (this.users === 1) this.start()
    return () => {
      this.users -= 1
      if (this.users === 0) {
        this.stop?.()
        this.stop = null
      }
    }
  }

  private start(): void {
    const api = window.elecdex.elec
    this.stop = api.onSessions((list) => {
      this.sessions = list
    })
    void api.sessions().then((list) => {
      this.sessions = list
    })
  }
}

export const elec = new ElecStore()
