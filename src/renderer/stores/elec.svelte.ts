import type { SessionSummary } from '@shared/elec'
import { refCounted } from '../lib/ref-counted.ts'

/**
 * The deliberations every ELEC system pane lists in its log. The seats and the
 * rule are settings, read from the appearance store.
 *
 * Reference-counted like the chat store: a window with no ELEC pane listens for nothing.
 */
class ElecStore {
  // Replaced whole with each change from main, never changed in place: no deep proxy.
  sessions = $state.raw<SessionSummary[]>([])

  /** Called while an ELEC pane is mounted; returns the release. */
  readonly use = refCounted(() => this.start())

  /** Follows main's file and answers the first reading; returns how to stop. */
  private start(): () => void {
    const api = window.elecdex.elec
    const stop = api.onSessions((list) => {
      this.sessions = list
    })
    void api.sessions().then((list) => {
      this.sessions = list
    })
    return stop
  }
}

export const elec = new ElecStore()
